import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Neo4jNodeModelService, Neo4jService } from '@nhogs/nestjs-neo4j';
import { SendService } from 'src/wallets/services/send.service';
import { Repository } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import { AddressDto } from '../dto/address.dto';
import { SendDto } from '../dto/send.dto';
import { UpdateWalletDto } from '../dto/update-wallet.dto';
import { CreateWalletDto } from '../dto/create-wallet.dto';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import InputDataDecoder, { InputData } from 'ethereum-input-data-decoder';
import { Transaction } from '../entities/transaction.entity';
import { Graph } from 'src/graphql.schema';

@Injectable()
export class WalletsService {
  constructor(
    readonly sendService: SendService,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  protected logger = new Logger(WalletsService.name);

  findMany() {
    return this.walletRepository.find();
  }

  createWallet(createWalletDto: CreateWalletDto | CreateWalletDto[]) {
    return this.walletRepository.insert(createWalletDto);
  }

  updateWallet(address: string, updateWalletDto: UpdateWalletDto) {
    return this.walletRepository.update(address, updateWalletDto);
  }

  async findByHasTag(hasTag: boolean, size: number) {
    const result = await this.walletRepository.find({
      where: { hasTag },
      take: size,
    });
    return result;
  }

  async updateManyHasTag(addresses: string[]) {
    if (!addresses.length) return;
    const result = await this.walletRepository.update(addresses, {
      hasTag: true,
    });
    return result;
  }
}
