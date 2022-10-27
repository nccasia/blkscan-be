import { Node, NodeKey, NotNull } from '@nhogs/nestjs-neo4j';

@Node()
export class AddressDto {
  @NodeKey()
  address: string;

  desc?: string;

  // @NotNull()
  // breed: string;

  // @NotNull()
  // created: string;
}
