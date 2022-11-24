import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Graph, NodeType } from 'src/graphql.schema';
import { GraphService } from '../services/graph.service';

@Resolver('Address')
export class WalletsResolver {
  // constructor(private readonly walletsService: WalletsService) {}
  constructor(private readonly graphService: GraphService) {}

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
        return this.graphService.getGraphContract(limit, skip);
      }
      case NodeType.Wallets: {
        return this.graphService.getGraphWallet(limit, skip);
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
    return this.graphService.searchGraph(id, limit, skip);
  }
}
