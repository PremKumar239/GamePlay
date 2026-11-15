import { createReadStream } from 'node:fs';
import { parse } from 'csv-parse';

const file = process.argv[2] || 'C:/Users/prems/Downloads/products_export_1.csv';
const parser = createReadStream(file).pipe(parse({ columns: true, relax_quotes: true, relax_column_count: true, skip_empty_lines: true, bom: true }));
const handles = new Map();
for await (const row of parser) {
  const handle = (row.Handle || '').trim();
  if (!handle) continue;
  const item = handles.get(handle) || { title: '', options: [], prices: [], compares: [], qty: [], images: [] };
  if (row.Title) item.title = row.Title;
  if (row['Option1 Value']) item.options.push(`${row['Option1 Name']}=${row['Option1 Value']}`);
  if (row['Variant Price']) item.prices.push(row['Variant Price']);
  if (row['Variant Compare At Price']) item.compares.push(row['Variant Compare At Price']);
  if (row['Variant Inventory Qty']) item.qty.push(row['Variant Inventory Qty']);
  if (row['Image Src']) item.images.push({ pos: row['Image Position'], src: row['Image Src'] });
  if (row.Type) item.type = row.Type;
  handles.set(handle, item);
}
const multi = [...handles.entries()].filter(([, v]) => new Set(v.options).size > 1).slice(0, 3);
console.log(JSON.stringify(multi, null, 2));
console.log('nintendo sample', [...handles.values()].filter(v => /nintendo|switch/i.test(`${v.title} ${v.type || ''}`)).slice(0, 3).map(v => ({ title: v.title, type: v.type })));
console.log('xbox sample', [...handles.values()].filter(v => /xbox/i.test(`${v.title} ${v.type || ''}`)).slice(0, 3).map(v => ({ title: v.title, type: v.type })));
console.log('console sample', [...handles.values()].filter(v => /GAMING CONSOLE/i.test(v.type || '')).slice(0, 5).map(v => ({ title: v.title, type: v.type })));
