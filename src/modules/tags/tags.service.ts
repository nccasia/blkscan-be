import { Injectable, Inject } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { Repository } from 'typeorm';
import { map, lastValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @Inject(WalletsService)
    private readonly walletService: WalletsService,
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {}

  API = this.configService.get<string>('URL_PREFIX');
  header = { headers: { 'Content-Type': 'application/json' } };

  async saveTags() {
    const timeToUpdate = 180 * 2592000; // six month
    const currentTime = new Date().getTime();
    const lst = await this.walletService.findAll();

    const listWallet = lst.filter(
      (w) => !w.lastUpdate || currentTime - w.lastUpdate > timeToUpdate,
    );

    const listWallet_length = listWallet.length;
    for (let i = 0; i < listWallet_length; i++) {
      const singleAddress = listWallet[i].address;
      const URL = this.configService.get<string>('URL_PREFIX') + singleAddress;
      const emitter = await this.getDataFromAddress(URL);

      await this.tagRepository.delete({ wallet: singleAddress });
      for (let j = 0; j < emitter.length; j++) {
        this.tagRepository.save({
          tag: emitter[j],
          wallet: singleAddress,
        });
      }
      this.walletService.update(singleAddress, {
        lastUpdate: new Date().getTime(),
      });
    }
  }

  async getDataFromAddress(URL: string) {
    return lastValueFrom(
      this.httpService.get(`${URL}`, this.header).pipe(
        map((resp) => {
          const html = resp.data;
          const $ = cheerio.load(html);
          let tags = [];
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
          if (publicTagName) tags = [...tags, publicTagName];
          if (myNameTag) tags = [...tags, myNameTag];
          return tags;
        }),
      ),
    );
  }

  create(createTagDto: CreateTagDto) {
    return this.tagRepository.save(createTagDto);
  }

  findAll() {
    return this.tagRepository.find();
  }

  findOne(id: number) {
    return this.tagRepository.findOneBy({ id });
  }

  getAllTagsOfWallet(wallet: string) {
    return this.tagRepository.findBy({ wallet });
  }

  update(id: number, updateTagDto: UpdateTagDto) {
    return this.tagRepository.update(id, updateTagDto);
  }

  remove(id: number) {
    return this.tagRepository.delete({ id });
  }
}
