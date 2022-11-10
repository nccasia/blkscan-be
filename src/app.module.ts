import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configEnvPath } from './common/helper/env.helper';
import { TypeOrmConfigSerivce } from './common/typeorm/typeorm.service';
import { Neo4jModule } from '@nhogs/nestjs-neo4j';
import { Neo4jConfig } from '@nhogs/nestjs-neo4j/dist';
import { GraphQLModule } from '@nestjs/graphql';
import { upperDirectiveTransformer } from './common/directives/upper-case.directive';
import { join } from 'path';
// import { generate, OGM } from '@neo4j/graphql-ogm';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { WalletsModule } from './wallets/wallets.module';
import { JobsModule } from './jobs/jobs.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot(configEnvPath),
    TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigSerivce }),
    ScheduleModule.forRoot(),
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
        path: join(process.cwd(), 'src/graphql.schema.ts'),
        emitTypenameField: true,
        // outputAs: 'class',
      },
      // include: [AddressModule],
    }),
    // GraphQLModule.forRootAsync<ApolloDriverConfig>({
    //   driver: ApolloDriver,
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: async (configService: ConfigService) => {
    //     const SCHEMA = './src/index.graphql';
    //     const typeDefs = readFileSync(SCHEMA, 'utf-8');
    //     // TODO: get driver from Neo4jModule
    //     const driver = neo4j.driver(
    //       `${configService.get('NEO4J_SCHEME')}://${configService.get(
    //         'NEO4J_HOST',
    //       )}:${configService.get('NEO4J_HOST')}`,
    //       neo4j.auth.basic(
    //         configService.get('NEO4J_USERNAME'),
    //         configService.get('NEO4J_PASSWORD'),
    //       ),
    //     );
    //     const ogm = new OGM({ typeDefs, driver });
    //     await generate({
    //       ogm,
    //       outFile: join(process.cwd(), 'src/graphql.schema.ts'),
    //     });
    //     // process.exit(1);
    //     await ogm.init();

    //     const neo4jGraphQL = new Neo4jGraphQL({ typeDefs, driver });
    //     const schema = await neo4jGraphQL.getSchema();

    //     return {
    //       schema,
    //       playground: true,
    //     };
    //   },
    // }),
    JobsModule,
    WalletsModule,
  ],
})
export class AppModule {}
