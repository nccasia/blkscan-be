import { Module } from '@nestjs/common';
import { SendModule } from '../send/send.module';
import { AddressService } from './address.service';

@Module({
  imports: [SendModule],
  // controllers: [AddressController],
  providers: [AddressService],
  exports: [AddressService],
})
export class AddressModule {}
