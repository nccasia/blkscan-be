import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TagsModule } from './modules/tags/tags.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { configEnvPath } from './common/helper/env.helper';
import { TypeOrmConfigSerivce } from './shared/typeorm/typeorm.service';

@Module({
  imports: [
    ConfigModule.forRoot(configEnvPath),
    TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigSerivce }),
    TagsModule,
    WalletsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
