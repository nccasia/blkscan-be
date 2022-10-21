import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('wallets')
export class Wallet {
  @PrimaryColumn()
  address: string;

  @Column({ nullable: true })
  type: number;

  @Column({ nullable: true, type: 'bigint' })
  lastUpdate: number;

  @Column({ nullable: true })
  desc: string;
}
