import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { WalletsService } from '../services/wallets.service';

@Resolver('Address')
export class WalletsResolver {
  constructor(private readonly walletsService: WalletsService) { }

  @Query('getGraph')
  async getGraph(
    @Args('limit')
    limit?: number,
  ) {
    return this.walletsService.getGraph(limit);
  }

  @Query('searchGraph')
  async searchGraph(
    @Args('id') id: string,
    @Args('limit') limit: number
  ) {
    console.log("limit line 23:", limit)
    console.log("id line 23:", id)
    return this.walletsService.searchGraph(id, limit);
  }
}
