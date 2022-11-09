import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ nullable: true, type: 'bigint' })
  lastUpdate: number;
}
