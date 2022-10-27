import { Controller, Get } from '@nestjs/common';
import { WalletsService } from './wallets.service';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('crawl-wallet')
  crawlWallet() {
    return this.walletsService.crawlWallet();
  }

  @Get('testWriteNeo4j')
  testWriteNeo4j() {
    return this.walletsService.testWriteNeo4j();
  }

  @Get('testReadNeo4j')
  testReadNeo4j() {
    return this.walletsService.testReadNeo4j();
  }
}
