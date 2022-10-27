import { Module, forwardRef } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { Wallet } from './entities/wallet.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { TagsModule } from '../tags/tags.module';
import { AddressModule } from '../address/address.module';
@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Wallet]),
    forwardRef(() => TagsModule),
    AddressModule,
  ],
  controllers: [WalletsController],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}
