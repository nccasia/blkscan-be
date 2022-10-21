import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { Repository } from 'typeorm';
import { map, Observable, firstValueFrom } from 'rxjs';
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

  async saveTags() {
    const timeToUpdate = 180 * 2592000; // six month
    const currentTime = new Date().getTime();
    const lst = await this.walletService.findAll();

    const listWallet = lst.filter(
      (w) => !w.lastUpdate || currentTime - w.lastUpdate > timeToUpdate,
    );
    console.log(listWallet);

    for (let i = 0; i < listWallet.length; i++) {
      const wallet = listWallet[i];
      const singleAddress = wallet.address;
      await this.saveTagFromAddres(singleAddress);
      await this.walletService.update(singleAddress, {
        lastUpdate: new Date().getTime(),
      });
    }

    return 'results';
  }

  async saveTagFromAddres(address: string) {
    try {
      const URL = this.configService.get<string>('URL_PREFIX') + address;
      const tagElements = await firstValueFrom(this.getDataFromAddress(URL));
      const isListTags = tagElements.length > 0;
      console.log('saveTagFromAddres');

      const tags =
        isListTags &&
        (await Promise.all(
          tagElements.map(async (tag) => {
            const tagExisted = await this.tagRepository.findOne({
              where: {
                tag,
                wallet: address,
              },
            });

            if (tagExisted) {
              throw new ConflictException('Tag with wallet adress is exited!');
            }
            return await this.tagRepository.create({
              tag,
              wallet: address,
            });
          }),
        ));
      isListTags && (await this.tagRepository.save(tags));

      return isListTags ? tags : [];
    } catch (error) {
      console.log(error);
    }
  }

  getDataFromAddress(URL: string): Observable<string[]> {
    return this.httpService.get(URL).pipe(
      map((resp: any) => {
        const html = resp.data;
        const $ = cheerio.load(html);
        let tags: string[] = [];
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
