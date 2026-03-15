import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('comics') // name of the table in PostgreSQL
export class Comic {
  // UUID primary key for the comic
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // ALWAYS use numeric for money values to avoid floating point precision issues
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'text', default: 'COP' })
  currency: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ nullable: true })
  coverImageUrl: string;

  @Column({ length: 100, nullable: true })
  genre: string;

  @Column({ default: true })
  active: boolean;

  // relation: this comic belongs to a seller (User)
  @ManyToOne(() => User, (user) => user.comics, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @Column({ name: 'seller_id' })
  sellerId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
