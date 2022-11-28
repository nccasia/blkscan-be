import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import InputDataDecoder, { InputData } from 'ethereum-input-data-decoder';

@Injectable()
export class Web3Service {
  private readonly logger = new Logger(Web3Service.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getAbi(address: string): Promise<string> {
    const apiKey = this.configService.get<string>('ETH_SCAN_API_KEY');
    const URL = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${apiKey}`;
    const { data } = await firstValueFrom(
      this.httpService.get(URL).pipe(),
    ).catch(async (error) => {
      console.error('getAbi ~ error', error);
      // await this.stopCrawlsLogError('lastValueFrom', error, subscription);
      return { data: null };
    });

    if (data && data.status === '1') {
      return data.result || '';
    }
    return '';
  }

  decodeData(abi: string, txInput: string): InputData | null {
    if (!abi || !txInput) return null;
    const decoder = new InputDataDecoder(abi);
    return decoder.decodeData(txInput);
  }
}
