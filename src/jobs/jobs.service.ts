import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { TransactionsService } from 'src/wallets/services/transactions.service';
import { WalletsService } from 'src/wallets/services/wallets.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class JobsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(JobsService.name);
  constructor(
    private readonly walletsService: WalletsService,
    private readonly transactionsService: TransactionsService,
  ) {}

  onApplicationBootstrap() {
    this.logger.log(`onApplicationBootstrap`);
    // this.crawlWallet();
  }

  crawlWallet() {
    return this.transactionsService.crawlWallet();
  }

  // @Cron(CronExpression.EVERY_30_MINUTES, { timeZone: 'Asia/Ho_Chi_Minh' })
  @Cron(CronExpression.EVERY_10_SECONDS, { timeZone: 'Asia/Ho_Chi_Minh' })
  async saveTransactionsToNeo4j() {
    const res = await this.transactionsService.findWithConverted(false);
    console.log('findWithConverted false', res.length);
  }
}
