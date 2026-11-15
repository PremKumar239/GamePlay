import { config } from 'dotenv';
import pg from 'pg';

config();

const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5432/GamePlay';

let pool: pg.Pool | null = null;

export function db() {
  if (!pool) {
    pool = new pg.Pool({
      connectionString,
      ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

export async function query<T extends pg.QueryResultRow>(text: string, params: unknown[] = []) {
  try {
    return await db().query<T>(text, params);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database query failed';
    throw new Error(`${message}. Check DATABASE_URL in .env (pgAdmin → GamePlay).`);
  }
}
