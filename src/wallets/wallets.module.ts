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

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([Wallet, Tag])],
  controllers: [WalletsController, TagsController],
  providers: [WalletsResolver, WalletsService, TagsService, SendService],
  exports: [WalletsService],
})
export class WalletsModule {}
