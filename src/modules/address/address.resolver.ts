import { AddressService } from './address.service';
import { Query, Resolver } from '@nestjs/graphql';

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
  async getGraph() {
    return this.addresssService.getGraph();
  }

  // @Mutation('createAddress')
  // async create(
  //   @Args('createAddressInput') args: CreateAddressDto,
  // ): Promise<Address> {
  //   const createdAddress = await this.addresssService.create(args);
  //   return createdAddress;
  // }
}
