import { AddressService } from './address.service';
import { ParseIntPipe } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
// import { Address } from '../../gen/graphql.schema';
import { AddressDto } from './dto/address.dto';
type Address = any
@Resolver('Address')
export class AddressResolver {
  constructor(private readonly addresssService: AddressService) {}

  @Query('getAddresses')
  async getAddresses() {
    return this.addresssService.findAll();
  }

  @Query('getAddress')
  async findOneById(
    @Args('address')
    address: string,
  ): Promise<Address> {
    return {} as Address;
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
