create table if not exists public.products (
  id integer primary key,
  name text not null,
  category text not null,
  group_name text,
  subcategory text,
  image_key text not null,
  price integer not null,
  old_price integer,
  badge text
);

alter table public.products enable row level security;

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
  on public.products
  for select
  to anon, authenticated
  using (true);

insert into public.products (id, name, category, group_name, subcategory, image_key, price, old_price, badge)
values
  (1, 'PlayStation 5 Slim — Disc Edition, 1TB', 'Consoles', 'PlayStation', 'Consoles', 'product-0', 169999, 179999, 'BEST SELLER'),
  (2, 'DualSense Wireless Controller — White', 'Controllers', 'PlayStation', 'Controllers', 'product-1', 19999, 22499, 'HOT DEAL'),
  (3, 'Premium Over-Ear Gaming Headset', 'Headsets', null, null, 'product-2', 12499, null, null),
  (4, 'Nintendo Switch — Neon Blue & Red', 'Consoles', 'Nintendo', 'Consoles', 'product-5', 74999, null, 'POPULAR'),
  (5, 'RGB Mechanical Gaming Keyboard', 'Keyboards', null, null, 'product-3', 14999, 17999, 'HOT DEAL'),
  (6, 'Wireless Performance Gaming Mouse', 'Mice', null, null, 'product-4', 8999, null, null),
  (7, 'Action & Adventure — PlayStation Games', 'Games', 'PlayStation', 'Games', 'games-banner', 14999, null, 'NEW ARRIVAL'),
  (8, 'DualSense Controller & Headset Bundle', 'Controllers', 'PlayStation', 'Controllers', 'product-1', 29999, 32498, 'BUNDLE DEAL')
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  group_name = excluded.group_name,
  subcategory = excluded.subcategory,
  image_key = excluded.image_key,
  price = excluded.price,
  old_price = excluded.old_price,
  badge = excluded.badge;
