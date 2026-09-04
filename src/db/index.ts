import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

// Function to create or retrieve the connection pool.
export const createPool = () => {
  if (!process.env.SQL_HOST) {
    return undefined;
  }
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      console.warn('Unexpected error on idle SQL pool client:', err.message);
    });
  }
  return global._postgresPool;
};

let dbInstance: any;

try {
  const pool = createPool();
  if (pool) {
    dbInstance = drizzle(pool, { schema });
  }
} catch {
  console.warn('[AI Studio] Database not connected — using mock');
}

if (!dbInstance) {
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
  };
  const dummyChain: any = () => dummyChain;
  dummyChain.set = () => dummyChain;
  dummyChain.where = () => dummyChain;
  dummyChain.values = () => dummyChain;
  dummyChain.onConflictDoUpdate = () => dummyChain;
  dummyChain.returning = () => Promise.resolve([]);
  dummyChain.then = (resolve: any) => Promise.resolve([]).then(resolve);
  dummyChain.catch = (reject: any) => Promise.resolve([]).catch(reject);

  dbInstance = new Proxy({}, {
    get: (_, prop) => {
      if (prop === 'query') {
        return new Proxy({}, { get: () => noOp });
      }
      return () => dummyChain;
    },
  });
}

// Export safe db instance
export const db = dbInstance;

