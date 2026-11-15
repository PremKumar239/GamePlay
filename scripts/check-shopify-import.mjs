import { config } from 'dotenv';
import pg from 'pg';

config();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing. Put it in .env first.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const total = await client.query('select count(*)::int as c from products');
const imported = await client.query('select count(*)::int as c from products where shopify_key is not null');
const local = await client.query('select id, name from products where shopify_key is null order by id');
const groups = await client.query(
  `select group_name, count(*)::int as c
   from products
   where shopify_key is not null
   group by group_name
   order by c desc`,
);
const sample = await client.query(
  `select id, name, group_name, subcategory, price, stock, shopify_key
   from products
   where shopify_key is not null
   order by id
   limit 12`,
);
const missingImage = await client.query(
  `select count(*)::int as c from products where shopify_key is not null and (image_url is null or image_url = '')`,
);

console.log(`Total products: ${total.rows[0].c}`);
console.log(`Imported Shopify products: ${imported.rows[0].c}`);
console.log(`Admin/sample products left untouched: ${local.rows.length}`);
for (const row of local.rows) console.log(`  #${row.id} ${row.name}`);
console.log('\nImported by group');
for (const row of groups.rows) console.log(`  ${row.group_name}: ${row.c}`);
console.log(`\nImported products missing image_url: ${missingImage.rows[0].c}`);
console.log('\nSample imported rows');
for (const row of sample.rows) {
  console.log(`  #${row.id} ${row.name} | ${row.group_name}/${row.subcategory} | Rs ${row.price} | stock ${row.stock} | ${row.shopify_key}`);
}

await client.end();
