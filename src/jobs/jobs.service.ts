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
    this.crawlsTransactions();
  }

  // this cron just for testing
  @Cron(CronExpression.EVERY_12_HOURS, { timeZone: 'Asia/Ho_Chi_Minh' })
  crawlsTransactions() {
    const isCrawls = this.transactionsService.getCrawls();
    if (!isCrawls) {
      this.logger.log(`start crawlsWallet`);
      this.transactionsService.crawlsTransactions().catch(this.logger.error);
    }
    this.logger.log(`isCrawls ${isCrawls}`);
  }

  @Cron(CronExpression.EVERY_10_MINUTES, { timeZone: 'Asia/Ho_Chi_Minh' })
  //@Cron(CronExpression.EVERY_10_SECONDS, { timeZone: 'Asia/Ho_Chi_Minh' })
  async saveTransactionsToNeo4j() {
    const res = await this.transactionsService.findWithConverted(false);
    console.log('findWithConverted false', res.length);
    const ids = res.map((t) => t.id);

    for (const rs of res) {
      const fromAddress = rs.from;
      const toAddress = rs.to;

      const value = rs.value;

      await this.walletsService.saveGraph(fromAddress, toAddress, value);
    }

    await this.transactionsService.convertMany(ids);
  }
}
