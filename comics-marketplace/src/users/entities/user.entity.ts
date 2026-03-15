import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Comic } from '../../comics/entities/comic.entity';

@Entity('users') // name of the table in PostgreSQL
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, unique: true })
  email: string;

  // select false means that this field will not be returned in queries by default, for security reasons
  @Column({ length: 255, select: false })
  password: string;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  refreshTokenHash: string | null;

  @Column({ default: 'Buyer' })
  role: string;

  @OneToMany(() => Comic, (comic) => comic.seller)
  comics: Comic[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
