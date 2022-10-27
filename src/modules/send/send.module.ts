import { Module } from '@nestjs/common';
import { SendService } from './send.service';

@Module({
  imports: [],
  // controllers: [SendController],
  providers: [SendService],
  exports: [SendService],
})
export class SendModule {}
