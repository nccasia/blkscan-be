import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  address: string;

  @IsNumber()
  @IsOptional()
  type?: number;

  @IsString()
  @IsOptional()
  desc?: string;

  @IsOptional()
  updatedAt?: Date;

  constructor(partial: Partial<CreateWalletDto>) {
    Object.assign(this, partial);
  }
}
