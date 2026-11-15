import { createReadStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { config } from 'dotenv';
import { parse } from 'csv-parse';
import pg from 'pg';

config();

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (!arg.startsWith('--')) continue;
  const key = arg.slice(2);
  const next = process.argv[i + 1];
  if (!next || next.startsWith('--')) args.set(key, true);
  else {
    args.set(key, next);
    i += 1;
  }
}

const csvPath = String(args.get('csv') || 'C:/Users/prems/Downloads/products_export_1.csv');
const limit = args.has('limit') ? Number(args.get('limit')) : Infinity;
const dryRun = Boolean(args.get('dry-run'));
const skipImages = Boolean(args.get('skip-images'));
const includeDrafts = Boolean(args.get('include-drafts'));

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing. Put it in .env first.');
  process.exit(1);
}

function text(value) {
  return String(value ?? '').replace(/\u00a0/g, ' ').trim();
}

function money(value) {
  const raw = text(value).replace(/[^\d.]/g, '');
  if (!raw) return null;
  const amount = Math.round(Number(raw));
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function htmlToText(html) {
  return text(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function classify(title, type, productCategory) {
  const hay = `${title} ${type} ${productCategory}`.toLowerCase();
  let group = 'PlayStation';
  if (productCategory === 'Gift Cards' || /gift card/.test(hay)) group = 'Gift Cards';
  else if (/nintendo|switch/.test(hay)) group = 'Nintendo';
  else if (/\bxbox\b|series x|series s|rog ally/.test(hay)) group = 'Xbox';
  else if (/meta|\bquest\b|\bvr\b/.test(hay)) group = 'Meta';
  else if (/iphone|samsung|\bvivo\b|\boppo\b|\bmi\b|mobile/.test(hay)) group = 'Mobiles';
  else if (/macbook|\blaptop\b|\bmac\b/.test(hay)) group = 'Laptop';

  let subcategory = 'Accessories';
  let category = 'Accessories';
  if (/dvd game|nintendo games|physical game|video game software|video game/.test(hay) && !/accessor|controller|console|headset|wheel/.test(type.toLowerCase())) {
    subcategory = 'Games';
    category = 'Games';
  }
  if (/controller/.test(hay) && !/racing wheel|handbrake|shifter|playseat|driving force|controller grip|silicone cover|silicone case/.test(hay)) {
    subcategory = 'Controllers';
    category = 'Controllers';
  }
  if (/racing wheel|handbrake|shifter|playseat|driving force racing/.test(hay)) {
    subcategory = 'Accessories';
    category = 'Accessories';
  }
  if (/gaming console|vr headset|console system/.test(hay) || /\b(ps5 slim|ps5 pro|playstation 5|playstation 4|nintendo switch|switch lite|quest)\b/.test(hay) && /console|edition|pro|slim|lite/.test(hay)) {
    if (/gaming console|vr headset/i.test(type) || /playstation 5|playstation 4|nintendo switch|switch lite|quest 3/i.test(title)) {
      subcategory = 'Consoles';
      category = 'Consoles';
    }
  }
  if (/headphones|headset/.test(hay) && !/vr headset/i.test(type)) {
    subcategory = 'Accessories';
    category = 'Headsets';
  }
  if (group === 'Gift Cards') {
    if (/playstation|psn/i.test(title)) subcategory = 'PlayStation';
    else if (/xbox/i.test(title)) subcategory = 'Xbox';
    else if (/nintendo/i.test(title)) subcategory = 'Nintendo eShop';
    else if (/steam/i.test(title)) subcategory = 'Steam';
    else if (/itunes/i.test(title)) subcategory = 'iTunes';
    else if (/roblox/i.test(title)) subcategory = 'Roblox';
    else subcategory = 'Apple';
    category = subcategory;
  }
  return { group, subcategory, category };
}

function imageExt(url) {
  const clean = url.split('?')[0] || url;
  const ext = extname(clean).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'].includes(ext)) return ext === '.jpeg' ? '.jpg' : ext;
  return '.jpg';
}

async function readCsv(file) {
  const parser = createReadStream(file).pipe(parse({ columns: true, relax_quotes: true, relax_column_count: true, skip_empty_lines: true, bom: true }));
  const grouped = new Map();
  let rows = 0;
  let lastOptionName = '';
  for await (const row of parser) {
    rows += 1;
    const handle = text(row.Handle);
    if (!handle) continue;
    if (!grouped.has(handle)) grouped.set(handle, { handle, header: null, variants: [], images: [] });
    const product = grouped.get(handle);
    if (text(row.Title)) product.header = row;
    const optionName = text(row['Option1 Name']) || lastOptionName;
    if (text(row['Option1 Name'])) lastOptionName = text(row['Option1 Name']);
    const optionValue = text(row['Option1 Value']);
    if (optionValue || text(row['Variant Price']) || text(row['Price / Pakistan']) || text(row['Variant SKU'])) {
      product.variants.push({
        optionName,
        optionValue,
        sku: text(row['Variant SKU']),
        barcode: text(row['Variant Barcodes']),
        qty: Number(text(row['Variant Inventory Qty']) || 0),
        price: money(row['Price / Pakistan']) ?? money(row['Variant Price']),
        compare: money(row['Compare At Price / Pakistan']) ?? money(row['Variant Compare At Price']),
        variantImage: text(row['Variant Image']),
        grams: text(row['Variant Grams']),
      });
    }
    const image = text(row['Image Src']);
    if (image) {
      product.images.push({
        src: image,
        position: Number(text(row['Image Position']) || product.images.length + 1),
        alt: text(row['Image Alt Text']),
      });
    }
  }
  return { rows, products: [...grouped.values()] };
}

async function downloadImage(url, dest) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: 'follow' });
    if (!response.ok) return { ok: false, reason: `HTTP ${response.status}` };
    const type = response.headers.get('content-type') || '';
    if (type && !type.startsWith('image/') && !type.includes('octet-stream')) return { ok: false, reason: type };
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 32) return { ok: false, reason: 'empty file' };
    await writeFile(dest, buffer);
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : 'download failed' };
  } finally {
    clearTimeout(timer);
  }
}

const { rows: csvRows, products } = await readCsv(csvPath);
const uploadDir = join(process.cwd(), 'public', 'uploads', 'shopify');
if (!dryRun && !skipImages) await mkdir(uploadDir, { recursive: true });

const report = {
  csvRows,
  uniqueProducts: products.length,
  created: 0,
  updated: 0,
  skipped: 0,
  failed: 0,
  variants: 0,
  imagesOk: 0,
  imagesFailed: 0,
  errors: [],
};

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(`alter table public.products add column if not exists shopify_key text`);
await client.query(`create unique index if not exists products_shopify_key_uidx on public.products (shopify_key) where shopify_key is not null`);

const skipped = [];
const eligible = products.filter(item => {
  const title = text(item.header?.Title);
  const status = text(item.header?.Status).toLowerCase();
  if (!title || /^untitled/i.test(title)) {
    report.skipped += 1;
    skipped.push(`${item.handle} (untitled)`);
    return false;
  }
  if (!includeDrafts && status && status !== 'active') {
    report.skipped += 1;
    skipped.push(`${item.handle} (${status || 'inactive'})`);
    return false;
  }
  return true;
}).slice(0, Number.isFinite(limit) ? limit : undefined);

console.log(`CSV rows: ${csvRows}`);
console.log(`Unique Shopify products: ${products.length}`);
console.log(`Importing: ${eligible.length}${dryRun ? ' (dry run)' : ''}`);

for (const item of eligible) {
  const header = item.header;
  const title = text(header.Title);
  const type = text(header.Type);
  const productCategory = text(header['Product Category']);
  const { group, subcategory, category } = classify(title, type, productCategory);
  const description = [
    htmlToText(header['Body (HTML)']),
    text(header.Vendor) ? `Vendor: ${text(header.Vendor)}` : '',
    text(header.Tags) ? `Tags: ${text(header.Tags)}` : '',
    text(header['SEO Title']) ? `SEO: ${text(header['SEO Title'])}` : '',
    text(header['SEO Description']),
  ].filter(Boolean).join('\n\n');

  const images = [...item.images].sort((a, b) => a.position - b.position);
  const variants = item.variants.length ? item.variants : [{ optionName: 'Title', optionValue: 'Default Title', sku: '', barcode: '', qty: 0, price: 0, compare: null, variantImage: '', grams: '' }];
  const meaningful = variants.filter(variant => variant.optionValue && !['Default Title', 'Title'].includes(variant.optionValue));
  const toImport = meaningful.length ? meaningful : [variants[0]];

  try {
    if (!dryRun) await client.query('begin');
    for (const variant of toImport) {
      report.variants += 1;
      const optionLabel = meaningful.length && variant.optionValue ? ` — ${variant.optionValue}` : '';
      const name = `${title}${optionLabel}`.slice(0, 240);
      const shopifyKey = meaningful.length ? `${item.handle}::${variant.optionValue}` : item.handle;
      const price = variant.price ?? 0;
      const oldPrice = variant.compare && variant.compare > price ? variant.compare : null;
      const stock = Number.isFinite(variant.qty) && variant.qty > 0 ? Math.round(variant.qty) : 0;
      const imageUrl = variant.variantImage || images[0]?.src || '';
      let storedImage = null;
      if (imageUrl && !skipImages) {
        const fileName = `${shopifyKey.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 80)}${imageExt(imageUrl)}`;
        const dest = join(uploadDir, fileName);
        if (dryRun) storedImage = `/uploads/shopify/${fileName}`;
        else {
          const downloaded = await downloadImage(imageUrl, dest);
          if (downloaded.ok) {
            storedImage = `/uploads/shopify/${fileName}`;
            report.imagesOk += 1;
          } else {
            report.imagesFailed += 1;
            report.errors.push(`${shopifyKey} image: ${downloaded.reason}`);
            if (/cdn\.shopify\.com/i.test(imageUrl)) storedImage = imageUrl;
          }
        }
      }
      const badge = oldPrice ? 'HOT DEAL' : null;
      if (dryRun) {
        report.created += 1;
        continue;
      }
      const existing = await client.query('select id from products where shopify_key = $1', [shopifyKey]);
      if (existing.rows[0]) {
        await client.query(
          `update products set name=$1, category=$2, group_name=$3, subcategory=$4, image_key=$5, image_url=coalesce($6, image_url), price=$7, old_price=$8, badge=$9, description=$10, stock=$11
           where shopify_key=$12`,
          [name, category, group, subcategory, 'shopify', storedImage, price, oldPrice, badge, description, stock, shopifyKey],
        );
        report.updated += 1;
      } else {
        await client.query(
          `insert into products (name, category, group_name, subcategory, image_key, image_url, price, old_price, badge, description, stock, shopify_key)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [name, category, group, subcategory, 'shopify', storedImage, price, oldPrice, badge, description, stock, shopifyKey],
        );
        report.created += 1;
      }
    }
    if (!dryRun) await client.query('commit');
  } catch (error) {
    if (!dryRun) await client.query('rollback');
    report.failed += 1;
    report.errors.push(`${item.handle}: ${error instanceof Error ? error.message : 'import failed'}`);
  }
}

await client.end();

console.log('\nImport summary');
console.log(`Total CSV rows: ${report.csvRows}`);
console.log(`Total unique products: ${report.uniqueProducts}`);
console.log(`Successfully imported: ${report.created}`);
console.log(`Updated: ${report.updated}`);
console.log(`Skipped: ${report.skipped}`);
console.log(`Failed: ${report.failed}`);
console.log(`Imported variants: ${report.variants}`);
console.log(`Images downloaded: ${report.imagesOk}`);
console.log(`Failed image downloads: ${report.imagesFailed}`);
if (skipped.length) {
  console.log('\nSkipped');
  for (const line of skipped) console.log(`- ${line}`);
}
if (report.errors.length) {
  console.log('\nErrors');
  for (const line of report.errors.slice(0, 40)) console.log(`- ${line}`);
  if (report.errors.length > 40) console.log(`- … ${report.errors.length - 40} more`);
}
