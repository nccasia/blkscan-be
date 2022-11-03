import { Injectable, Logger } from '@nestjs/common';
import { Neo4jNodeModelService, Neo4jService } from '@nhogs/nestjs-neo4j';
import { SendDto } from '../send/dto/send.dto';
import { SendService } from '../send/send.service';
import { AddressDto } from './dto/address.dto';

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
        cypher: `MERGE (fromAddress:Address {address: "${from}"})
        ON CREATE
          SET fromAddress.val = ${val}
        ON MATCH
          SET fromAddress.val = fromAddress.val + ${val}
        MERGE (toAddress:Address {address: "${to}"})
        ON CREATE
          SET toAddress.val = ${val}
        ON MATCH
          SET toAddress.val = toAddress.val + ${val}
        MERGE (fromAddress)-[s:Send {value: ${val}, source: "${from}", target: "${to}" }]->(toAddress)
        RETURN fromAddress, toAddress`,
      },
      { write: true },
    );
    return rs;
  }

  async getGraph() {
    const queryResult = await this.neo4jService.run({
      cypher: 'MATCH p=()-[s:Send]->() RETURN p LIMIT 1000',
    });

    const data = queryResult.records.map((data) => data.toObject());
    const key = 'id';

    const nodes = data.map((d) => {
      const startNode = {
        id: d.p.start.properties.address,
        val: d.p.start.properties.val?.low
          ? d.p.start.properties.val?.low
          : d.p.start.properties.val?.low === 0
          ? 0
          : d.p.start.properties.val,
      };

      const endNode = {
        id: d.p.end.properties.address,
        val: d.p.end.properties.val?.low
          ? d.p.end.properties.val?.low
          : d.p.end.properties.val?.low === 0
          ? 0
          : d.p.end.properties.val,
      };
      return [startNode, endNode];
    });

    const nodesUniqueByKey = [
      ...new Map(nodes.flat().map((item) => [item[key], item])).values(),
    ];

    const links = data.map((d) => {
      return {
        source: d.p.start.properties.address,
        target: d.p.end.properties.address,
      };
    });
    return { nodes: nodesUniqueByKey, links };
  }

  findAll() {
    return super.findAll({ orderBy: 'name' });
  }
}
