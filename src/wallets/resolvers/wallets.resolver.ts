import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Graph, NodeType } from 'src/graphql.schema';
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
    @Args('type')
    type: NodeType,
  ) {
    switch (type) {
      case NodeType.Contracts: {
        return this.walletsService.getGraphContract(limit, skip);
      }
      case NodeType.Wallets: {
        return this.walletsService.getGraphWallet(limit, skip);
      }
      default: {
        const graph: Graph = { nodes: [], links: [] };
        return graph;
      }
    }
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
