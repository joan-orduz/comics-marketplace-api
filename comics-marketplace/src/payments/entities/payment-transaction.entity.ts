import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Order, OrderStatus, OrderItem } from '../../orders/entities';

@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  // unic id from PayU for this transaction, used for tracking and reconciliation
  @Column({ name: 'payu_transaction_id', unique: true })
  payuTransactionId: string;

  // state reported by PayU for this transaction (e.g. PENDING, COMPLETED, FAILED)
  @Column({ length: 50 })
  state: 'APPROVED' | 'DECLINED' | 'PENDING' | 'ERROR';

  @Column({ name: 'response_code', nullable: true })
  responseCode: string; // APPROVED, INSUFFICIENT_FUNDS, etc.

  @Column({ name: 'payment_method', nullable: true })
  paymentMethod: string; // VISA, MASTERCARD, PSE, etc.

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  // save the full raw response from PayU for this transaction, useful for debugging and auditing
  // JSONB in PostgreSQL allows us to store the entire response as a structured object, and query specific fields if needed
  @Column({ type: 'jsonb', name: 'raw_response' })
  rawResponse: Record<string, any>;

  // no updatedAt column needed since transactions are immutable after creation
  @CreateDateColumn ({ name: 'created_at' })
  cretedAt: Date;
}
