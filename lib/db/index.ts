import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@/lib/db/schema";

const globalForDb = globalThis as unknown as {
  pool: mysql.Pool | undefined;
};

function getPool(): mysql.Pool | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!globalForDb.pool) {
    globalForDb.pool = mysql.createPool(url);
  }
  return globalForDb.pool;
}

export function getDb() {
  const pool = getPool();
  if (!pool) return null;
  return drizzle(pool, { schema, mode: "default" });
}
