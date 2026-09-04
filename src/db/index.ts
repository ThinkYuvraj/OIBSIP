import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

export interface DbConnectionInfo {
  isConnected: boolean;
  provider: string;
  host: string;
  port: number;
  database: string;
  user: string;
  hasPassword: boolean;
  ssl: boolean;
  message: string;
}

export const getConnectionConfig = () => {
  const databaseUrl = (process.env.DATABASE_URL || '').trim();
  const sqlHost = (process.env.SQL_HOST || 'db.hblppudxqlpggwwyypld.supabase.co').trim();
  const sqlPort = Number(process.env.SQL_PORT || 5432);
  const sqlDb = (process.env.SQL_DB_NAME || 'postgres').trim();
  const sqlUser = (process.env.SQL_USER || process.env.SQL_ADMIN_USER || 'postgres').trim();
  const sqlPassword = (process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD || '').trim();

  const isSupabase =
    Boolean(databaseUrl.includes('supabase.co')) ||
    sqlHost.includes('supabase.co');

  const isPlaceholderPassword =
    !sqlPassword ||
    sqlPassword.includes('[YOUR-PASSWORD]') ||
    sqlPassword.includes('your-password') ||
    sqlPassword === 'password';

  const hasValidConnectionString =
    Boolean(databaseUrl) &&
    !databaseUrl.includes('[YOUR-PASSWORD]') &&
    !databaseUrl.includes(':password@') &&
    databaseUrl.includes('@');

  const canConnect = hasValidConnectionString || (!isPlaceholderPassword && Boolean(sqlHost));

  return {
    databaseUrl,
    sqlHost,
    sqlPort,
    sqlDb,
    sqlUser,
    sqlPassword,
    isSupabase,
    canConnect,
    isPlaceholderPassword,
    hasValidConnectionString,
  };
};

// Function to auto-initialize tables on successful connection
export async function initDatabaseTables(pool: Pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uid TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'CUSTOMER' NOT NULL,
        theme TEXT DEFAULT 'light' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light' NOT NULL;


      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        stock INTEGER DEFAULT 0 NOT NULL,
        threshold INTEGER DEFAULT 5 NOT NULL,
        unit TEXT NOT NULL,
        price NUMERIC(10, 2) DEFAULT '0.00' NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS pizzas (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        description TEXT NOT NULL,
        color TEXT NOT NULL,
        rating TEXT NOT NULL,
        category TEXT NOT NULL,
        image_url TEXT,
        recipe JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT,
        delivery_address TEXT NOT NULL,
        items JSONB NOT NULL,
        subtotal NUMERIC(10, 2) NOT NULL,
        discount NUMERIC(10, 2) DEFAULT '0.00',
        delivery_fee NUMERIC(10, 2) DEFAULT '0.00',
        tax NUMERIC(10, 2) DEFAULT '0.00',
        total NUMERIC(10, 2) NOT NULL,
        payment_status TEXT DEFAULT 'PENDING' NOT NULL,
        razorpay_order_id TEXT,
        razorpay_payment_id TEXT,
        status TEXT DEFAULT 'Order Received' NOT NULL,
        status_history JSONB NOT NULL,
        estimated_delivery_minutes INTEGER DEFAULT 35,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS email_logs (
        id TEXT PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT NOW(),
        type TEXT NOT NULL,
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        details JSONB,
        status TEXT NOT NULL
      );
    `);
    console.log('[Supabase / PostgreSQL] Schema tables verified and ready.');

    // Check if initial data seeding is needed
    const countRes = await pool.query('SELECT count(*)::int as count FROM inventory');
    if (countRes.rows[0]?.count === 0) {
      console.log('[Supabase / PostgreSQL] Inventory table is empty. Running initial catalog seed...');
      const { seedDatabase } = await import('./seed.ts');
      await seedDatabase();
    }
  } catch (err: any) {
    console.warn('[Supabase / PostgreSQL] Auto-initialization note:', err.message);
  }
}

// Function to create or retrieve the connection pool
export const createPool = (): Pool | undefined => {
  const config = getConnectionConfig();

  if (!config.canConnect) {
    console.log(
      `[Supabase / PostgreSQL] Configured for host '${config.sqlHost}' (port: ${config.sqlPort}, db: ${config.sqlDb}, user: ${config.sqlUser}). Awaiting database password in environment variables to establish live connection.`
    );
    return undefined;
  }

  if (!global._postgresPool) {
    const ssl = process.env.SQL_SSL === 'false' ? undefined : { rejectUnauthorized: false };

    try {
      if (config.hasValidConnectionString) {
        global._postgresPool = new Pool({
          connectionString: config.databaseUrl,
          ssl,
          max: 10,
          connectionTimeoutMillis: 15000,
        });
      } else {
        global._postgresPool = new Pool({
          host: config.sqlHost,
          port: config.sqlPort,
          user: config.sqlUser,
          password: config.sqlPassword,
          database: config.sqlDb,
          ssl,
          max: 10,
          connectionTimeoutMillis: 15000,
        });
      }

      // Prevent unhandled pool-level errors from crashing the application
      global._postgresPool.on('error', (err) => {
        console.warn('[Supabase / PostgreSQL] Idle pool client notice:', err.message);
      });

      // Asynchronously verify connection and initialize schema
      global._postgresPool
        .query('SELECT NOW()')
        .then(() => {
          console.log(`[Supabase / PostgreSQL] Live connection established to ${config.sqlHost}:${config.sqlPort}/${config.sqlDb}`);
          if (global._postgresPool) {
            initDatabaseTables(global._postgresPool);
          }
        })
        .catch((err) => {
          console.warn(`[Supabase / PostgreSQL] Connection attempt to ${config.sqlHost} note: ${err.message}. Local file store is operating as resilient primary.`);
        });
    } catch (err: any) {
      console.warn('[Supabase / PostgreSQL] Pool initialization error:', err.message);
      return undefined;
    }
  }

  return global._postgresPool;
};

export const getDbStatus = (): DbConnectionInfo => {
  const config = getConnectionConfig();
  const poolActive = Boolean(global._postgresPool && config.canConnect);

  return {
    isConnected: poolActive,
    provider: config.isSupabase ? 'Supabase PostgreSQL' : 'PostgreSQL',
    host: config.sqlHost,
    port: config.sqlPort,
    database: config.sqlDb,
    user: config.sqlUser,
    hasPassword: !config.isPlaceholderPassword || config.hasValidConnectionString,
    ssl: process.env.SQL_SSL !== 'false',
    message: poolActive
      ? `Connected to Supabase PostgreSQL at ${config.sqlHost}:${config.sqlPort}/${config.sqlDb}`
      : config.hasValidConnectionString || !config.isPlaceholderPassword
      ? `Connecting to Supabase PostgreSQL at ${config.sqlHost}:${config.sqlPort}...`
      : `Host '${config.sqlHost}' (port ${config.sqlPort}, db '${config.sqlDb}', user '${config.sqlUser}') configured. Provide password in Settings to connect.`,
  };
};

let dbInstance: any;

try {
  const pool = createPool();
  if (pool) {
    dbInstance = drizzle(pool, { schema });
  }
} catch {
  console.warn('[Supabase / PostgreSQL] Initializing with resilient fallback proxy');
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


