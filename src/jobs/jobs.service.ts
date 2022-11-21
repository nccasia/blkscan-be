import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { TransactionsService } from 'src/wallets/services/transactions.service';
import { WalletsService } from 'src/wallets/services/wallets.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TagsService } from 'src/wallets/services/tags.service';
import { CronJob } from 'cron';

@Injectable()
export class JobsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(JobsService.name);
  constructor(
    private readonly walletsService: WalletsService,
    private readonly tagsService: TagsService,
    private readonly transactionsService: TransactionsService,
  ) {}

  // testJob() {
  //   const name = new Date().toISOString();
  //   const cronExpression = '0 */15 * * * *';
  //   const job = new CronJob(cronExpression, () => {
  //     this.logger.warn(`time (${cronExpression}) for job ${name} to run!`);
  //   });

  //   // this.schedulerRegistry.addCronJob(name, job);
  //   // job.start();
  //   const timeRuns = job.nextDates(5) as any[];
  //   this.logger.log(`job run at ${timeRuns.join('\n')}`);
  // }

  onApplicationBootstrap() {
    this.logger.log(`onApplicationBootstrap`);
    this.crawlsTransactions();
  }

  // this cron is using temporary while calling to infura
  @Cron(CronExpression.EVERY_12_HOURS, { timeZone: 'Asia/Ho_Chi_Minh' })
  crawlsTransactions() {
    const isCrawls = this.transactionsService.getCrawls();
    if (!isCrawls) {
      this.logger.log(`start crawlsWallet`);
      this.transactionsService.crawlsTransactions().catch(this.logger.error);
    }
    this.logger.log(`isCrawls ${isCrawls}`);
  }

  // @Cron(CronExpression.EVERY_10_MINUTES, { timeZone: 'Asia/Ho_Chi_Minh' })
  @Cron(`0 */5 * * * *`, { timeZone: 'Asia/Ho_Chi_Minh' })
  async saveTransactionsToNeo4j() {
    console.time(`[DoneTime] saveTransactionsToNeo4j`);
    const transactions = await this.transactionsService.findWithConverted(
      false,
      250,
    );
    this.logger.log(`start saveTransactionsToNeo4j ${transactions.length}`);
    const convertIds = transactions.map((t) => t.id);

    for (const tx of transactions) {
      await this.walletsService.saveGraph(tx);
      // await this.walletsService.saveGraph(fromAddress, toAddress, value, 1);
    }

    await this.transactionsService.convertMany(convertIds);
    this.logger.log(`done saveTransactionsToNeo4j ${convertIds.length}`);
    console.timeEnd(`[DoneTime] saveTransactionsToNeo4j`);
  }

  // @Cron(CronExpression.EVERY_30_MINUTES, { timeZone: 'Asia/Ho_Chi_Minh' })
  async saveTagsByWallets() {
    console.time(`[DoneTime] saveTagsByWallets`);
    const wallets = await this.walletsService.findByHasTag(false, 1500);
    this.logger.log(`start saveTagsByWallets ${wallets.length}`);
    const walletAddresses = wallets.map((t) => t.address);

    await this.tagsService.saveTags(walletAddresses);
    await this.walletsService.updateManyHasTag(walletAddresses);
    this.logger.log(`done saveTagsByWallets ${walletAddresses.length}`);
    console.timeEnd(`[DoneTime] saveTagsByWallets`);
  }

  // async saveTransactionsToNeo4j() {
  //   const transactions = await this.transactionsService.findWithConverted(
  //     false,
  //     1500,
  //   );
  //   const convertIds = [];
  //   const addresses = [];
  //   transactions.forEach((tx) => {
  //     addresses.push(tx.from, tx.to);
  //     convertIds.push(tx.id);
  //   });
  //   const distinctAddresses = Array.from(new Set(addresses));

  //   this.logger.log(`transactions.length ${transactions.length}`);
  //   this.logger.log(`distinctAddresses.length ${distinctAddresses.length}`);

  //   const saveGraph = async () => {
  //     for (const tx of transactions) {
  //       await this.walletsService.saveGraph(tx.from, tx.to, tx.value);
  //     }
  //   };

  //   const res = await Promise.allSettled([
  //     saveGraph(),
  //     this.tagsService.saveTags(distinctAddresses),
  //   ]);
  //   const errors = res.filter(
  //     (o) => o.status === 'rejected',
  //   ) as PromiseRejectedResult[];
  //   console.log(
  //     'done saveTransactionsToNeo4j:  errors length',
  //     errors.length,
  //     errors[0]?.reason,
  //   );

  //   await this.transactionsService.convertMany(convertIds);
  // }
}
