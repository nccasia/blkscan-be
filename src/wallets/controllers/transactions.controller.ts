import { Controller, Get } from '@nestjs/common';
import { TransactionsService } from '../services/transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('')
  getGraph() {
    return 'abc';
    // return this.transactionsService.crawlWallet().catch();
  }
}
