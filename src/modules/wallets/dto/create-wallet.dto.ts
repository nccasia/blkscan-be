import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  address: string;
  @IsString()
  @IsOptional()
  type: string;
  @IsNumber()
  @IsOptional()
  lastUpdate: number;
  @IsString()
  @IsOptional()
  desc: string;
}
