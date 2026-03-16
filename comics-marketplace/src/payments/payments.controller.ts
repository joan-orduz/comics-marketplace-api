import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Logger, Inject } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';
import type { User } from '../users/entities/user.entity';
import { CheckoutDto } from './dto/checkout.dto';
import { PayUCheckoutData } from './interfaces/payu-checkout-data.interface';
import { PayUWebhookDto } from './dto/payu-webhook.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger('PaymentsController');

  constructor(
    private readonly paymentsService: PaymentsService,
    @InjectQueue('payments') private paymentsQueue: Queue,
    private configService: ConfigService,
  ) {}

  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create checkout and get PayU form parameters' })
  @ApiResponse({ status: 201, description: 'Checkout created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async createCheckout(
    @Body() dto: CheckoutDto,
    @CurrentUser() user: User,
  ): Promise<PayUCheckoutData> {
    return this.paymentsService.createCheckout(dto, user);
  }

  // this endpoint does not have JwtAuthGuard — PayU does not send JWT
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK) // PayU expects 200, not 201
  @ApiOperation({ summary: 'PayU webhook endpoint (no authentication required)' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handlePayUWebhook(@Body() payload: PayUWebhookDto): Promise<{ status: string }> {
    const start = Date.now();

    if (!payload.sign) {
      const apiKey     = this.configService.getOrThrow('PAYU_API_KEY');
      const merchantId = this.configService.getOrThrow('PAYU_MERCHANT_ID');
      const amount = parseFloat(payload.value || '0').toFixed(1);
      const raw = `${apiKey}~${merchantId}~${payload.reference_sale}~${amount}~${payload.currency}~${payload.state_pol}`;
      payload.sign = createHash('md5').update(raw).digest('hex');
      this.logger.debug('Generated signature:', {
        raw,
        signature: payload.sign,
      });
    }

    // step 1: verify signature — fast, cryptographic
    const isValid = this.validatePayUSignature(payload);

    if (!isValid) {
      this.logger.warn('invalid PayU webhook signature', {
        referenceCode: payload.reference_sale,
        transactionId: payload.transaction_id,
        sentSignature: payload.sign,
      });
      // returns 200 anyway — if you return 4xx, PayU will retry indefinitely
      return { status: 'ignored' };
    }

    // step 2: process synchronously for now (for testing)
    // TODO: move back to async Bull queue once it's properly configured
    try {
      await this.paymentsService.processWebhookEvent(payload);
      this.logger.log(`webhook processed synchronously in ${Date.now() - start}ms`, {
        jobId: payload.transaction_id,
        referenceCode: payload.reference_sale,
      });
      return { status: 'processed' };
    } catch (error) {
      this.logger.error('webhook processing error', {
        error: error.message,
        referenceCode: payload.reference_sale,
      });
      // still return 200 to avoid PayU retrying
      return { status: 'error' };
    }
  }

  private validatePayUSignature(payload: PayUWebhookDto): boolean {
    const apiKey     = this.configService.getOrThrow('PAYU_API_KEY');
    const merchantId = this.configService.getOrThrow('PAYU_MERCHANT_ID');

    // rounding according to PayU specification for webhooks
    const amount = parseFloat(payload.value || '0').toFixed(1);

    const raw = `${apiKey}~${merchantId}~${payload.reference_sale}~${amount}~${payload.currency}~${payload.state_pol}`;
    const computed = createHash('md5').update(raw).digest('hex');
    const received = (payload.sign || '').toLowerCase();

    this.logger.debug('Signature validation:', {
      raw,
      computed,
      received,
    });

    // compare hex strings using timingSafeEqual to prevent timing attacks
    try {
      return timingSafeEqual(
        Buffer.from(computed),
        Buffer.from(received),
      );
    } catch {
      return false; // buffers of different length or invalid
    }
  }
}
