import { Injectable, Logger } from '@nestjs/common';
import { Neo4jNodeModelService, Neo4jService } from '@nhogs/nestjs-neo4j';
import { SendDto } from '../send/dto/send.dto';
import { SendService } from '../send/send.service';
import { AddressDto } from './dto/address.dto';
export interface Nodes {
  id: string;
  val: number;
}

@Injectable()
export class AddressService extends Neo4jNodeModelService<AddressDto> {
  constructor(
    protected readonly neo4jService: Neo4jService,
    readonly sendService: SendService,
  ) {
    super();
  }

  label = 'Address';
  timestamp = undefined;
  protected logger = new Logger(AddressService.name);

  async createWithSendRelationship(
    addressSender: AddressDto,
    addressReceiver: AddressDto,
    send?: SendDto,
  ): Promise<void> {
    const session = this.neo4jService.getSession({ write: true });
    const trans = session.beginTransaction();
    this.create(addressSender, { returns: false }).runTx(trans);
    this.create(addressReceiver, { returns: false }).runTx(trans);
    this.sendService
      .create(send || {}, addressSender, addressReceiver, this, this, {
        returns: false,
      })
      .runTx(trans);
    // this.receiveService
    //   .create({}, props.addressReceiver, props.addressSender, this, this, {
    //     returns: false,
    //   })
    //   .runTx(trans);
    await trans.commit();
    return trans.close();
  }

  async saveGraph(from: string, to: string, val: number): Promise<any> {
    const rs = await this.neo4jService.run(
      {
        cypher: `MERGE (fromAddress:Addresses {address: "${from}"})
        ON CREATE
          SET fromAddress.val = ${val}
        ON MATCH
          SET fromAddress.val = fromAddress.val + ${val}
        MERGE (toAddress:Addresses {address: "${to}"})
        ON CREATE
          SET toAddress.val = ${val}
        ON MATCH
          SET toAddress.val = toAddress.val + ${val}
        MERGE (fromAddress)-[s:Send {value: ${val}}]->(toAddress)
        RETURN fromAddress, toAddress`,
      },
      { write: true },
    );
    return rs;
  }

  async getGraph() {
    const queryResult = await this.neo4jService.run({
      cypher:
        'MATCH (from: Addresses)-[s:Send]-(to:Addresses)  return from, to, s LIMIT 10000',
    });

    const data = queryResult.records.map((data) => data.toObject());
    const key = 'id';

    const nodes: Nodes[] = data.map((a) => {
      return {
        id: a.from.properties.address,
        val: a.from.properties.val?.low
          ? a.from.properties.val?.low
          : a.from.properties.val?.low === 0
          ? 0
          : a.from.properties.val,
      };
    });
    const nodesUniqueByKey = [
      ...new Map(nodes.map((item) => [item[key], item])).values(),
    ];

    const links = data.map((a) => {
      return {
        source: a.from.properties.address,
        target: a.to.properties.address,
      };
    });
    return { nodes: nodesUniqueByKey, links };
  }

  findAll() {
    console.log('🚀 ~ ~ findAll');
    return super.findAll({ orderBy: 'name' });
  }
}
