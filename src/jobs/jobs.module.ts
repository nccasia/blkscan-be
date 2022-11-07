import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { WalletsModule } from 'src/wallets/wallets.module';

@Module({
  imports: [WalletsModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
