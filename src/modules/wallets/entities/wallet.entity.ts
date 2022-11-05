import { Tag } from 'src/modules/tags/entities/tag.entity';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

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

  @OneToMany(() => Tag, (tag) => tag.wallet)
  tags: Tag[];
}
