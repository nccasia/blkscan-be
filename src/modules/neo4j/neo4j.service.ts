import { Injectable, Inject } from '@nestjs/common';
import { NEO4J_DRIVER, NEO4J_CONFIG } from './neo4j.constants';
import { Driver, Session, session, Result } from 'neo4j-driver';
import { Neo4jConfig } from './interfaces/neo4j-config.interface';

// https://medium.com/neo4j/building-a-modern-web-application-with-neo4j-and-nestjs-b51ffd8268fa
// https://bloodhound.readthedocs.io/en/latest/data-analysis/bloodhound-gui.html#:~:text=The%20default%20username%20for%20a,the%20example%20database%20is%20BloodHound.

@Injectable()
export class Neo4jService {
  constructor(
    @Inject(NEO4J_CONFIG) private readonly config: Neo4jConfig,
    @Inject(NEO4J_DRIVER) private readonly driver,
  ) {}

  getReadSession(database?: string): Session {
    return this.driver.session({
      database: database || this.config.database,
      defaultAccessMode: session.READ,
    });
  }

  getWriteSession(database?: string): Session {
    return this.driver.session({
      database: database || this.config.database,
      defaultAccessMode: session.WRITE,
    });
  }

  read(
    cypher: string,
    params?: Record<string, any>,
    database?: string,
  ): Result {
    const session = this.getReadSession(database);
    return session.run(cypher, params);
  }

  write(
    cypher: string,
    params: Record<string, any>,
    database?: string,
  ): Result {
    const session = this.getWriteSession(database);
    return session.run(cypher, params);
  }
}
