import {
  Column,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConvertedTransaction } from './convertedTransaction.entity';

@Entity('transactions')
export class Transaction {
  constructor(partial: Partial<Transaction>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  from: string;

  @Column()
  to: string;

  @Column({ type: 'float' })
  value: number;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'now()',
    onUpdate: 'now()',
  })
  updatedAt: Date;

  @OneToOne(
    () => ConvertedTransaction,
    (convertedTransaction) => convertedTransaction.transaction,
  )
  convertedTransaction: ConvertedTransaction;
}
