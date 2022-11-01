import { Injectable, Logger } from '@nestjs/common';
import {
  Neo4jRelationshipModelService,
  Neo4jService,
} from '@nhogs/nestjs-neo4j';
import { AddressDto } from '../address/dto/address.dto';
import { SendDto } from './dto/send.dto';

@Injectable()
export class SendService extends Neo4jRelationshipModelService<SendDto> {
  constructor(protected readonly neo4jService: Neo4jService) {
    super();
  }

  timestamp = 'since';
  label = 'SEND';
  protected logger = new Logger(SendService.name);

  async findAll(): Promise<[AddressDto, SendDto, AddressDto][]> {
    const results = await this.neo4jService.run({
      cypher:
        'MATCH (as:Address)-[s:SEND]->(ar:Address) RETURN properties(as) AS addressSender, properties(s) AS send, properties(ar) AS addressReceiver',
    });
    return results.records.map((record) => {
      const addressSender = record.toObject().addressSender;
      const send = this.fromNeo4j(record.toObject().send);
      const addressReceiver = record.toObject().addressReceiver;
      return [addressSender, send, addressReceiver];
    });
  }

  async saveGraph(from: string, to: string, val: number): Promise<boolean> {
    await this.neo4jService.run({
      cypher: `MERGE (fromAddress:Addresses {address: ${from}})
        ON CREATE
          SET fromAddress.val = ${val}
        ON MATCH
          SET fromAddress.val = fromAddress.val + ${val}
        MERGE (toAddress:Addresses {address: ${to}})
        ON CREATE
          SET toAddress.val = ${val}
        ON MATCH
          SET toAddress.val = toAddress.val + ${val}
        MERGE (fromAddress)-[r:Send]->(toAddress)
        RETURN fromAddress, toAddress`,
    });
    return true;
  }
}
