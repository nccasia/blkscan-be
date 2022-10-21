import { Controller, Post } from '@nestjs/common';
import { WalletsService } from './wallets.service';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post('crawl-wallet')
  crawlWallet() {
    return this.walletsService.crawlWallet();
  }
}
