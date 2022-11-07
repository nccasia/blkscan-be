import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { WalletsService } from 'src/wallets/services/wallets.service';

@Injectable()
export class JobsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(JobsService.name);
  constructor(private readonly walletsService: WalletsService) {}

  onApplicationBootstrap() {
    this.logger.log(`onApplicationBootstrap`);
    this.crawlWallet();
  }

  crawlWallet() {
    return this.walletsService.crawlWallet();
  }
}
