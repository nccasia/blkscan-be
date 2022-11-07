import { Wallet } from 'src/wallets/entities/wallet.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('tags')
export class Tag {
  constructor(partial: Partial<Tag>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tag: string;

  @Column({ nullable: true })
  walletAddress: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.tags)
  @JoinColumn({ referencedColumnName: 'address' })
  wallet: Wallet;
}
