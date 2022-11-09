import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ConvertedTransaction } from './convertedTransaction.entity';

@Entity('transactions')
export class Transaction {
  constructor(partial: Partial<Transaction>) {
    Object.assign(this, partial);
  }

  // @PrimaryColumn()
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  desc: string;

  @OneToOne(
    () => ConvertedTransaction,
    (convertedTransaction) => convertedTransaction.transaction,
  )
  convertedTransaction: ConvertedTransaction;
}
