import { Module } from '@nestjs/common';
import { SendModule } from '../send/send.module';
import { AddressResolver } from './address.resolver';
import { AddressService } from './address.service';

@Module({
  imports: [SendModule],
  // controllers: [AddressController],
  providers: [AddressService, AddressResolver],
  exports: [AddressService, AddressResolver],
})
export class AddressModule {}
