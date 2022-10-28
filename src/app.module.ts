import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TagsModule } from './modules/tags/tags.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { configEnvPath } from './common/helper/env.helper';
import { TypeOrmConfigSerivce } from './shared/typeorm/typeorm.service';
import { Neo4jModule } from '@nhogs/nestjs-neo4j';
import { Neo4jConfig } from '@nhogs/nestjs-neo4j/dist';
import { SendModule } from './modules/send/send.module';
import { AddressModule } from './modules/address/address.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloDriver } from '@nestjs/apollo/dist/drivers';
import { upperDirectiveTransformer } from './common/directives/upper-case.directive';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot(configEnvPath),
    TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigSerivce }),
    TagsModule,
    WalletsModule,
    Neo4jModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Neo4jConfig => ({
        scheme: configService.get('NEO4J_SCHEME'),
        host: configService.get('NEO4J_HOST'),
        port: configService.get('NEO4J_PORT'),
        username: configService.get('NEO4J_USERNAME'),
        password: configService.get('NEO4J_PASSWORD'),
        database: configService.get('NEO4J_DATABASE'),
      }),
      global: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: ['./**/*.graphql'],
      transformSchema: (schema) => upperDirectiveTransformer(schema, 'upper'),
      debug: false,
      playground: true,
      // plugins: [ApolloServerPluginLandingPageLocalDefault()],
      definitions: {
        path: join(process.cwd(), 'src/gen/graphql.schema.ts'),
        emitTypenameField: true,
        // outputAs: 'class',
      },
      // include: [AddressModule],
    }),
    SendModule,
    AddressModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
