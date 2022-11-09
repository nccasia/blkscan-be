import { Controller, Get } from '@nestjs/common';
import { TransactionsService } from '../services/transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('')
  getGraph() {
    return this.transactionsService.crawlWallet().catch();
  }
}
