import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmConfigSerivce implements TypeOrmOptionsFactory {
  @Inject(ConfigService)
  private readonly config: ConfigService;
  public createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.config.get<string>('PG_HOST', 'localhost'),
      port: this.config.get<number>('PG_PORT'),
      username: this.config.get<string>('PG_USERNAME'),
      password: this.config.get<string>('PG_PASSWORD'),
      database: this.config.get<string>('PG_DATABASE'),
      autoLoadEntities: true,
      synchronize: true,
    };
  }
}
