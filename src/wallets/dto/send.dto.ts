import { NotNull, Relationship } from '@nhogs/nestjs-neo4j';

@Relationship({ type: 'SEND' })
export class SendDto {
  @NotNull()
  volume: number;
}
