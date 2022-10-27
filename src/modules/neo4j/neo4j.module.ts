import { DynamicModule, Module } from '@nestjs/common';
import { Neo4jService } from './neo4j.service';
import { createDriver } from './neo4j.utils';
import { Neo4jConfig, Neo4jScheme } from './interfaces/neo4j-config.interface';
import { NEO4J_CONFIG, NEO4J_DRIVER } from './neo4j.constants';
import { Neo4jController } from './neo4j.controller';

@Module({
  providers: [Neo4jService],
})
// Reference for Neo4j Driver
export class Neo4jModule {
  static forRoot(config: Neo4jConfig): DynamicModule {
    console.log('N4J_SCHEME', process.env.N4J_SCHEME);
    config = config || {
      scheme: process.env.N4J_SCHEME as Neo4jScheme,
      host: process.env.N4J_HOST,
      port: +process.env.N4J_PORT,
      username: process.env.N4J_USERNAME,
      password: process.env.N4J_PASSWORD,
      database: process.env.N4J_DATABASE,
    };
    return {
      module: Neo4jModule,
      providers: [
        {
          provide: NEO4J_CONFIG,
          useValue: config,
        },
        {
          // Define a key for injection
          provide: NEO4J_DRIVER,
          // Inject NEO4J_CONFIG defined above as the
          inject: [NEO4J_CONFIG],
          // Use the factory function created above to return the driver
          useFactory: async (config: Neo4jConfig) => createDriver(config),
        },
        Neo4jService,
      ],
      controllers: [Neo4jController],
    };
  }
}
