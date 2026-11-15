import { config } from 'dotenv';
import pg from 'pg';

config();
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const result = await client.query('select current_database() as db, (select count(*)::int from products) as products, (select count(*)::int from categories) as categories');
console.log(JSON.stringify(result.rows[0]));
await client.end();
