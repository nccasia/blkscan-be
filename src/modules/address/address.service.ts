import { Injectable, Logger } from '@nestjs/common';
import { Neo4jNodeModelService, Neo4jService } from '@nhogs/nestjs-neo4j';
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

  async createWithSendRelationship(props: {
    addressSender: AddressDto;
    addressReceiver: AddressDto;
  }): Promise<void> {
    const session = this.neo4jService.getSession({ write: true });
    const trans = session.beginTransaction();
    this.create(props.addressSender, { returns: false }).runTx(trans);
    this.create(props.addressReceiver, { returns: false }).runTx(trans);
    this.sendService
      .create({}, props.addressSender, props.addressReceiver, this, this, {
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
    return super.findAll({ orderBy: 'name' });
  }
}
