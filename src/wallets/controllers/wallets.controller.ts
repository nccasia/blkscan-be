import { Controller, Get } from '@nestjs/common';
import { WalletsService } from '../services/wallets.service';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('crawl-wallet')
  crawlWallet() {
    return this.walletsService.crawlWallet();
  }

  @Get('getGraph')
  getGraph() {
    return this.walletsService.getGraph();
  }
}
