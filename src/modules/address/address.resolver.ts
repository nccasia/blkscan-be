import { AddressService } from './address.service';
import { Args, Query, Resolver } from '@nestjs/graphql';

@Resolver('Address')
export class AddressResolver {
  constructor(private readonly addresssService: AddressService) {}

  // @Query('getAddresses')
  // async getAddresses() {
  //   console.log('🚀  ~ getAddresses');
  //   return this.addresssService.findAll();
  // }

  // @Query('getAddress')
  // async getAddress(
  //   @Args('address')
  //   address: string,
  // ): Promise<Address> {
  //   console.log('🚀 ~ file: addr', address);
  //   return { address: 'hai' } as Address;
  // }

  @Query('getGraph')
  async getGraph(
    @Args('limit')
    limit?: number,
  ) {
    return this.addresssService.getGraph(limit);
  }

  @Query('searchGraph')
  async searchGraph(
    @Args('id')
    id: string,
  ) {
    return this.addresssService.searchGraph(id);
  }
  // @Mutation('createAddress')
  // async create(
  //   @Args('createAddressInput') args: CreateAddressDto,
  // ): Promise<Address> {
  //   const createdAddress = await this.addresssService.create(args);
  //   return createdAddress;
  // }
}
