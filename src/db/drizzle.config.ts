import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env file.
dotenv.config();

const databaseUrl = (process.env.DATABASE_URL || '').trim();
const sqlHost = (process.env.SQL_HOST || "db.hblppudxqlpggwwyypld.supabase.co").trim();
const sqlPort = Number(process.env.SQL_PORT || 5432);
const sqlDbName = (process.env.SQL_DB_NAME || "postgres").trim();
const user = (process.env.SQL_ADMIN_USER || process.env.SQL_USER || "postgres").trim();
const password = (process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || "").trim();

const isSupabase = databaseUrl.includes("supabase.co") || sqlHost.includes("supabase.co");
const hasValidUrl = Boolean(databaseUrl) && !databaseUrl.includes("[YOUR-PASSWORD]");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: hasValidUrl
    ? {
        url: databaseUrl,
        ssl: isSupabase ? { rejectUnauthorized: false } : false,
      }
    : {
        host: sqlHost,
        port: sqlPort,
        user: user,
        password: password,
        database: sqlDbName,
        ssl: isSupabase ? { rejectUnauthorized: false } : false,
      },
  verbose: true,
});

