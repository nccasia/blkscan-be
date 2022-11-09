import { Module } from '@nestjs/common';
import { WalletsService } from './services/wallets.service';
import { WalletsController } from './controllers/wallets.controller';
import { Wallet } from './entities/wallet.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { TagsController } from './controllers/tags.controller';
import { WalletsResolver } from './resolvers/wallets.resolver';
import { TagsService } from './services/tags.service';
import { Tag } from './entities/tag.entity';
import { SendService } from './services/send.service';
import { Transaction } from './entities/trans.entity';
import { ConvertedTransaction } from './entities/convertedTransaction.entity';
import { TransactionsService } from './services/transactions.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Wallet, Tag, Transaction, ConvertedTransaction]),
  ],
  controllers: [WalletsController, TagsController],
  providers: [
    WalletsResolver,
    WalletsService,
    TagsService,
    SendService,
    TransactionsService,
  ],
  exports: [WalletsService, TransactionsService],
})
export class WalletsModule {}
