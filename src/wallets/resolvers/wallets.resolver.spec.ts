import { Test, TestingModule } from '@nestjs/testing';
import { WalletsResolver } from './wallets.resolver';
import { WalletsService } from '../services/wallets.service';

describe('WalletsResolver', () => {
  let resolver: WalletsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletsResolver, WalletsService],
    }).compile();

    resolver = module.get<WalletsResolver>(WalletsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
