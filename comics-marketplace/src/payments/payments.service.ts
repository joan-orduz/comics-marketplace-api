import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CheckoutDto } from './dto';
import { PayUCheckoutData } from './interfaces/payu-checkout-data.interface';
import type { User } from '../users/entities/user.entity';
import { Order, OrderStatus } from '../orders/entities';
import { OrderItem } from '../orders/entities';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Comic } from '../comics/entities/comic.entity';
import { PaymentGatewayException, InsufficientStockException } from '../common/exceptions/payment.exceptions';


@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Order) private ordersRepo: Repository<Order>,
    @InjectRepository(PaymentTransaction) private txRepo: Repository<PaymentTransaction>,
    private dataSource: DataSource,  // for transactions
    private configService: ConfigService,
    @InjectQueue('payments') private paymentsQueue: Queue,
  ) {}

  // generates payu form parameters
  async createCheckout(dto: CheckoutDto, buyer: User): Promise<PayUCheckoutData> {
    // use transaction to: verify stock + create order atomically
    return this.dataSource.transaction(async (manager) => {

      // 1. verify stock for each item and retrieve comic details
      const comicsData: { comic: Comic; quantity: number }[] = [];
      for (const item of dto.items) {
        const comic = await manager.findOne(Comic, {
          where: { id: item.comicId, active: true },
          lock: { mode: 'pessimistic_write' }, // lock for concurrency
        });

        if (!comic) throw new NotFoundException(`Comic ${item.comicId} not found`);
        if (comic.stock < item.quantity)
          throw new InsufficientStockException(comic.title, comic.stock, item.quantity);

        comicsData.push({ comic, quantity: item.quantity });
      }

      // 2. calculate total from comic prices
      const total = comicsData.reduce((sum, { comic, quantity }) => {
        return sum + (Number(comic.price) * quantity);
      }, 0);

      // 3. create order
      const referenceCode = `ORDER-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      const order = manager.create(Order, {
        buyerId: buyer.id,
        status: OrderStatus.PENDING,
        total,
        currency: 'COP',
        referenceCode,
      });
      await manager.save(order);

      // 4. create order items with comic prices
      const orderItems = comicsData.map(({ comic, quantity }) =>
        manager.create(OrderItem, {
          orderId: order.id,
          comicId: comic.id,
          quantity,
          unitPrice: Number(comic.price),
          subtotal: Number(comic.price) * quantity,
        }),
      );
      await manager.save(orderItems);

      // 5. generate payu signature and parameters
      return this.buildPayUCheckoutParams(order, buyer);
    });
  }

  private buildPayUCheckoutParams(order: Order, buyer: User): PayUCheckoutData {
    const apiKey      = this.configService.getOrThrow('PAYU_API_KEY');
    const merchantId  = this.configService.getOrThrow('PAYU_MERCHANT_ID');
    const accountId   = this.configService.getOrThrow('PAYU_ACCOUNT_ID');
    const appUrl      = this.configService.getOrThrow('APP_URL');
    const apiUrl      = this.configService.getOrThrow('API_URL');
    const amountStr   = order.total.toFixed(1); // '150000.0' — payu format

    // signature: apiKey~merchantId~referenceCode~amount~currency
    const signatureStr = `${apiKey}~${merchantId}~${order.referenceCode}~${amountStr}~${order.currency}`;
    const signature = createHash('md5').update(signatureStr).digest('hex');

    return {
      formUrl: this.configService.getOrThrow('PAYU_CHECKOUT_URL'),
      params: {
        merchantId,
        accountId,
        description:     `Comics Marketplace - Order ${order.referenceCode}`,
        referenceCode:   order.referenceCode,
        amount:          amountStr,
        currency:        order.currency,
        signature,
        tax:             '0',
        taxReturnBase:   '0',
        buyerEmail:      buyer.email,
        buyerFullName:   buyer.name,
        responseUrl:     `${appUrl}/payment/response`,
        confirmationUrl: `${apiUrl}/api/v1/payments/webhook`,
      },
    };
  }

  // the most robust method: manual QueryRunner
  // gives you full control over COMMIT and ROLLBACK
  async processWebhookEvent(payuPayload: any): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const orderId = payuPayload.reference_sale;

      // step 1: lock order for exclusive read (without relations to avoid join issues)
      // prevents two webhooks from the same payment from processing simultaneously
      const order = await queryRunner.manager.findOne(Order, {
        where: { referenceCode: orderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) throw new NotFoundException(`Order ${orderId} not found`);
      if (order.status !== OrderStatus.PENDING) {
        // idempotency: already processed
        await queryRunner.release();
        return;
      }

      // step 1b: load order items in separate query (after lock)
      const orderItems = await queryRunner.manager.find(OrderItem, {
        where: { orderId: order.id },
      });
      order.items = orderItems;

      // step 2: save payment transaction (immutable)
      const newStatus = payuPayload.state_pol === '4' ? OrderStatus.PAID : OrderStatus.CANCELLED;

      await queryRunner.manager.save(PaymentTransaction, {
        orderId:            order.id,
        payuTransactionId:  payuPayload.transaction_id,
        state:              payuPayload.state_pol === '4' ? 'APPROVED' : 'DECLINED',
        responseCode:       payuPayload.response_code_pol,
        paymentMethod:      payuPayload.payment_method_name,
        amount:             parseFloat(payuPayload.value),
        rawResponse:        payuPayload, // save all for audit
      });

      // step 3: update order status
      await queryRunner.manager.update(Order, order.id, {
        status: newStatus,
      });

      // step 4: if approved, permanently decrease stock
      if (newStatus === OrderStatus.PAID) {
        for (const item of order.items) {
          await queryRunner.manager.decrement(
            Comic,
            { id: item.comicId },
            'stock',
            item.quantity,
          );
        }
      }

      // all good — COMMIT all changes
      await queryRunner.commitTransaction();

    } catch (error) {
      // something failed — ROLLBACK all
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // ALWAYS release queryRunner — prevents connection leaks
      await queryRunner.release();
    }
  }
}
