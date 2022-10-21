import { Injectable } from '@nestjs/common';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { Wallet } from './entities/wallet.entity';
import Web3 from 'web3';
import { lastValueFrom } from 'rxjs';
import { CreateWalletDto } from './dto/create-wallet.dto';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private readonly httpService: HttpService,
  ) {}

  async crawlWallet() {
    const REST_ENDPIONT =
      'https://mainnet.infura.io/v3/d054692827b7449f9b46577dfa256134';
    const ENDPOINT =
      'wss://mainnet.infura.io/ws/v3/d054692827b7449f9b46577dfa256134';

    const repository = this.walletRepository;
    const listExistAddresses = await repository.find();
    const addresses = new Set<string>();
    listExistAddresses.forEach((existedAddress) =>
      addresses.add(existedAddress.address),
    );
    const web3 = new Web3(ENDPOINT);
    web3.eth
      .subscribe('newBlockHeaders', function (error, result) {
        if (!error) {
          console.log('subscription: ', result);
          return;
        }
        console.error(error);
      })
      .on('connected', function (subscriptionId) {
        console.log('subscriptionId: ', subscriptionId);
      })
      .on('data', async (blockHeader) => {
        const headers = { 'Content-Type': 'application/json' };
        const data = {
          jsonrpc: '2.0',
          method: 'eth_getBlockByHash',
          params: [blockHeader.hash, false],
          id: 1,
        };
        const res = this.httpService
          .post(REST_ENDPIONT, data, { headers })
          .pipe();

        const { data: wallets } = await lastValueFrom(res);

        wallets.result.transactions.forEach((tr) => {
          web3.eth.getTransaction(tr, async function (err, result) {
            const fromAddress = result.from;
            const toAddress = result.to;

            if (fromAddress) {
              if (!addresses.has(fromAddress)) {
                addresses.add(fromAddress);
                await repository.save({ address: fromAddress });
              }
            }
            if (toAddress) {
              if (!addresses.has(toAddress)) {
                addresses.add(toAddress);
                await repository.save({ address: toAddress });
              }
            }
          });
        });
      })
      .on('error', console.error);

    return 'res_wallets';
  }

  create(createWalletDto: CreateWalletDto) {
    return this.walletRepository.save(createWalletDto);
  }

  findAll() {
    return this.walletRepository.find({
      select: {
        address: true,
      },
    });
  }

  update(address: string, updateWalletDto: UpdateWalletDto) {
    return this.walletRepository.update(address, updateWalletDto);
  }

  findOne(address: string) {
    return this.walletRepository.findOneBy({ address });
  }
}
