import { Tag } from 'src/wallets/entities/tag.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Transaction } from './trans.entity';

@Entity('convertedTransactions')
export class ConvertedTransaction {
  constructor(partial: Partial<ConvertedTransaction>) {
    Object.assign(this, partial);
  }

  @PrimaryColumn()
  // @PrimaryGeneratedColumn()
  transactionId: number;

  @OneToOne(
    () => Transaction,
    (transaction) => transaction.convertedTransaction,
  )
  @JoinColumn({ referencedColumnName: 'id' })
  transaction: Transaction;
}
