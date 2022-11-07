import { Tag } from 'src/wallets/entities/tag.entity';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

@Entity('wallets')
export class Wallet {
  constructor(partial: Partial<Wallet>) {
    Object.assign(this, partial);
  }

  @PrimaryColumn()
  address: string;

  @Column({ nullable: true })
  type: number;

  @Column({ nullable: true, type: 'bigint' })
  lastUpdate: number;

  @Column({ nullable: true })
  desc: string;

  @OneToMany(() => Tag, (tag) => tag.wallet)
  tags: Tag[];
}
