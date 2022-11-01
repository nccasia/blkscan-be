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

  findAll() {
    console.log('🚀 ~ ~ findAll');
    return super.findAll({ orderBy: 'name' });
  }
}
