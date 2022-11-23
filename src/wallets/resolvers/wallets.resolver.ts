import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { WalletsService } from '../services/wallets.service';

@Resolver('Address')
export class WalletsResolver {
  constructor(private readonly walletsService: WalletsService) {}

  @Query('getGraph')
  async getGraph(
    @Args('limit')
    limit: number,
    @Args('skip')
    skip: number,
  ) {
    return this.walletsService.getGraph(limit, skip);
  }

  @Query('searchGraph')
  async searchGraph(
    @Args('id') id: string,
    @Args('limit') limit: number,
    @Args('skip') skip: number,
  ) {
    return this.walletsService.searchGraph(id, limit, skip);
  }
}
