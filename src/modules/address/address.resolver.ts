import { AddressService } from './address.service';
import { ParseIntPipe } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { Address } from '../../gen/graphql.schema';
import { AddressDto } from './dto/address.dto';

@Resolver('Address')
export class AddressResolver {
  constructor(private readonly addresssService: AddressService) {}

  @Query('getAddresses')
  async getAddresses() {
    console.log('🚀  ~ getAddresses');
    return this.addresssService.findAll();
  }

  @Query('getAddress')
  async getAddress(
    @Args('address')
    address: string,
  ): Promise<Address> {
    console.log('🚀 ~ file: addr', address);
    return { address: 'hai' } as Address;
    // return this.addresssService.findBy(address);
  }

  // @Mutation('createAddress')
  // async create(
  //   @Args('createAddressInput') args: CreateAddressDto,
  // ): Promise<Address> {
  //   const createdAddress = await this.addresssService.create(args);
  //   return createdAddress;
  // }
}
