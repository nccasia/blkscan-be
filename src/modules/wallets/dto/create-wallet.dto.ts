import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  address: string;
  @IsNumber()
  @IsOptional()
  type: number;
  @IsNumber()
  @IsOptional()
  lastUpdate: number;
  @IsString()
  @IsOptional()
  desc: string;
}
