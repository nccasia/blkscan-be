import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { TransactionsService } from 'src/wallets/services/transactions.service';
import { WalletsService } from 'src/wallets/services/wallets.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TagsService } from 'src/wallets/services/tags.service';

@Injectable()
export class JobsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(JobsService.name);
  constructor(
    private readonly walletsService: WalletsService,
    private readonly tagsService: TagsService,
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

  @Cron(CronExpression.EVERY_30_MINUTES, { timeZone: 'Asia/Ho_Chi_Minh' })
  async saveTransactionsToNeo4j() {
    const transactions = await this.transactionsService.findWithConverted(
      false,
    );
    const convertIds = [];
    const addresses = [];
    transactions.forEach((tx) => {
      addresses.push(tx.from, tx.to);
      convertIds.push(tx.id);
    });
    const distinctAddresses = Array.from(new Set(addresses));

    this.logger.log(`transactions.length ${transactions.length}`);
    this.logger.log(`distinctAddresses.length ${distinctAddresses.length}`);

    const saveGraph = async () => {
      for (const tx of transactions) {
        await this.walletsService.saveGraph(tx.from, tx.to, tx.value);
      }
    };

    const res = await Promise.allSettled([
      saveGraph(),
      this.tagsService.saveTags(distinctAddresses),
    ]);
    const errors = res.filter(
      (o) => o.status === 'rejected',
    ) as PromiseRejectedResult[];
    console.log(
      'done saveTransactionsToNeo4j:  errors length',
      errors.length,
      errors[0]?.reason,
    );

    await this.transactionsService.convertMany(convertIds);
  }
}
