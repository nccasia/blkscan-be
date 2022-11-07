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
  constructor(partial: Partial<CreateWalletDto>) {
    Object.assign(this, partial);
  }
}
