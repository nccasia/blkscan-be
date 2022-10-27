import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post('save-all-tags')
  getDetailWallet() {
    return this.tagsService.saveTags();
  }

  @Post('save-from-wallet')
  saveTagsFromAddres(@Body('address') address: string) {
    return this.tagsService.saveTagsFromAddres(address);
  }

  @Post('create-new-tag')
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  @Get('get-all-tags')
  findAll() {
    return this.tagsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.tagsService.findOne(id);
  }

  @Get('get-all-tags-of-wallet/:walletId')
  listAllTagsOfWallet(@Param('walletId') walletId: string) {
    return this.tagsService.getAllTagsOfWallet(walletId);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateTagDto: UpdateTagDto) {
    return this.tagsService.update(id, updateTagDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.tagsService.remove(id);
  }
}
