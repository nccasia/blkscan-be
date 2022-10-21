import { IsString, IsNotEmpty } from 'class-validator';

export class CreateTagDto {
  @IsNotEmpty()
  @IsString()
  tagName: string;

  @IsNotEmpty()
  @IsString()
  wallet: string;
}
