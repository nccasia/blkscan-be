import { Injectable, Inject, Logger } from '@nestjs/common';
import { CreateTagDto } from '../dto/create-tag.dto';
import { UpdateTagDto } from '../dto/update-tag.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from '../entities/tag.entity';
import { Repository } from 'typeorm';
import { map, Observable, firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { WalletsService } from 'src/wallets/services/wallets.service';
import { sleep } from 'src/common/utils/sleep';

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @Inject(WalletsService)
    private readonly walletService: WalletsService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async saveTagsByAllWallets() {
    // const timeToUpdate = 180 * 2592000; // six month
    // const now = new Date();
    // const lst = await this.walletService.findMany();
    // // const listWallet = lst;
    // const listWallet = lst.filter(
    //   (w) => !w.lastUpdate || now.getTime() - w.lastUpdate > timeToUpdate,
    // );
    // console.log('🚀listWallet', lst.length, listWallet.length, listWallet[0]);
    // const batchSize = 3;
    // for (let i = 0; i < listWallet.length; i += batchSize) {
    //   console.log('🚀 i', i);
    //   const tempList = listWallet.slice(i, i + batchSize);
    //   const res = await Promise.allSettled(
    //     tempList.map(async (wallet) =>
    //       this.saveTagsAndWallet(wallet.address, now),
    //     ),
    //   );
    //   const errors = res.filter((o) => o.status === 'rejected');
    //   console.log('🚀 errors', errors.length, errors[0]);
    //   await sleep(3000);
    // }
    // // for (let i = 0; i < listWallet.length; i++) {
    // //   const wallet = listWallet[i];
    // //   const singleAddress = wallet.address;
    // //   await this.saveTagFromAddres(singleAddress);
    // //   await this.walletService.update(singleAddress, {
    // //     lastUpdate: new Date().getTime(),
    // //   });
    // // }
    return true;
  }

  async saveTags(walletAddresses: string[]) {
    const now = new Date();
    const batchSize = 2;

    for (let i = 0; i < walletAddresses.length; i += batchSize) {
      // console.log('🚀~ i', i);
      const tempList = walletAddresses.slice(i, i + batchSize);
      const res = await Promise.allSettled(
        tempList.map(async (address) => this.saveTagsAndWallet(address, now)),
      );
      const errors = res.filter(
        (o) => o.status === 'rejected',
      ) as PromiseRejectedResult[];
      console.log('saveTags errors length', errors.length, errors[0]?.reason);
      await sleep(2500);
    }

    return true;
  }

  async saveTagsFromAddress(address: string) {
    const url = this.configService.get<string>('URL_PREFIX') + address;
    try {
      const tagElements = await firstValueFrom(this.getDataFromAddress(url));
      if (tagElements.length < 1) {
        return [];
      }

      const existedTags = await this.tagRepository.find({
        where: {
          walletAddress: address,
        },
      });
      const tagMap = new Map<string, boolean>();
      existedTags.forEach((tag) => tagMap.set(tag.tag, true));
      const newTags = tagElements
        .filter((t) => !tagMap.has(t))
        .map((tag) => ({
          tag,
          walletAddress: address,
        }));
      const tags = this.tagRepository.create(newTags);
      tags && (await this.tagRepository.insert(tags));
      this.logger.log(`saveTagsFromAddress length ${tags.length}`);

      return tags || [];
    } catch (error) {
      // console.error(error);
      this.logger.error(`saveTagFromAddres url error ${url}`);
      throw error;
    }
  }

  async saveTagsAndWallet(address: string, date: Date) {
    const tags = await this.saveTagsFromAddress(address);
    // tags.length &&
    //   (await this.walletService.updateWallet(address, {
    //     updatedAt: date,
    //   }));
  }

  getDataFromAddress(URL: string): Observable<string[]> {
    return this.httpService.get(URL).pipe(
      map((resp: any) => {
        const html = resp.data;
        const $ = cheerio.load(html);
        const tags: string[] = [];
        const myNameTag = $(
          '#ContentPlaceHolder1_tr_tokeninfo div.row.align-items-center div.col-md-8 a',
        )
          .text()
          .trim();
        const publicTagName = $(
          'div span.u-label.u-label--secondary.text-dark.font-size-1.rounded.py-1.px-3',
        )
          .text()
          .trim();
        const lstTags = $(
          'div.mb-3.mb-lg-0 div.mt-1 a.mb-1.mb-sm-0.u-label.u-label--xs',
        );

        for (let i = 0; i < lstTags.length; i++) {
          const tag = $(lstTags[i]);
          const tagname = tag.text().trim();
          if (tagname) tags.push(tagname);
        }

        if (publicTagName) tags.push(publicTagName);
        if (myNameTag) tags.push(myNameTag);
        return tags;
      }),
    );
  }

  create(createTagDto: CreateTagDto) {
    return this.tagRepository.insert(createTagDto);
  }

  findAll() {
    return this.tagRepository.find({ relations: { wallet: true } });
  }

  findOne(id: number) {
    return this.tagRepository.findOneBy({ id });
  }

  getAllTagsOfWallet(walletAddress: string) {
    return this.tagRepository.findBy({ walletAddress });
  }

  update(id: number, updateTagDto: UpdateTagDto) {
    return this.tagRepository.update(id, updateTagDto);
  }

  remove(id: number) {
    return this.tagRepository.delete({ id });
  }
}
