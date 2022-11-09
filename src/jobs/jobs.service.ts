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

  @Cron(CronExpression.EVERY_2_HOURS, { timeZone: 'Asia/Ho_Chi_Minh' })
  // @Cron(CronExpression.EVERY_10_SECONDS, { timeZone: 'Asia/Ho_Chi_Minh' })
  handleCron() {
    this.logger.debug('Called when the current second is 45');
  }

  @Cron(CronExpression.EVERY_10_SECONDS, { timeZone: 'Asia/Ho_Chi_Minh' })
  async handleCron2() {
    console.log('🚀 EVERY_10_SECONDS', new Date());
    // this.transactionsService.create();
    // this.transactionsService.convertMany([4, 3]);
    const res = await this.transactionsService.findAllUnconverted();
    console.log('🚀 ~ res', res);
  }
}
