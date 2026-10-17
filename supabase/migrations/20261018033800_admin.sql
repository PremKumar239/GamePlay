-- GAME PLAY admin schema.
-- Run this whole script in the Supabase SQL editor (it is safe to run again).
-- Then create the first admin. See the comments at the bottom of this file.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'customer' check (role in ('admin', 'customer')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, email, role)
select id, email, 'customer' from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;
drop policy if exists "Read own or admin profiles" on public.profiles;
create policy "Read own or admin profiles"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

alter table public.products add column if not exists description text not null default '';
alter table public.products add column if not exists stock integer not null default 0;
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists created_at timestamptz not null default now();
alter table public.products add column if not exists updated_at timestamptz not null default now();
alter table public.products alter column image_key set default 'remote';

create sequence if not exists public.products_id_seq;
select setval('public.products_id_seq', coalesce((select max(id) from public.products), 0) + 1, false);
alter table public.products alter column id set default nextval('public.products_id_seq');
alter sequence public.products_id_seq owned by public.products.id;
grant usage, select on sequence public.products_id_seq to authenticated;

alter table public.products drop constraint if exists products_stock_nonnegative;
alter table public.products add constraint products_stock_nonnegative check (stock >= 0);
alter table public.products drop constraint if exists products_price_nonnegative;
alter table public.products add constraint products_price_nonnegative check (price >= 0);

drop policy if exists "Admins insert products" on public.products;
create policy "Admins insert products"
  on public.products for insert to authenticated
  with check (public.is_admin());
drop policy if exists "Admins update products" on public.products;
create policy "Admins update products"
  on public.products for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins delete products" on public.products;
create policy "Admins delete products"
  on public.products for delete to authenticated
  using (public.is_admin());

create table if not exists public.categories (
  id bigint generated always as identity primary key,
  name text not null unique,
  label text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.subcategories (
  id bigint generated always as identity primary key,
  category_id bigint not null references public.categories (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  unique (category_id, name)
);

insert into public.categories (name, label, sort_order)
values
  ('PlayStation', 'Games, controllers, consoles and accessories', 1),
  ('Xbox', 'Controllers, consoles and accessories', 2),
  ('Meta', 'Consoles and accessories', 3),
  ('Nintendo', 'Games, controllers, consoles and accessories', 4),
  ('Mobiles', 'Apple, Samsung, Mi and accessories', 5),
  ('Laptop', 'Mac computers', 6),
  ('Gift Cards', 'Ask the store about available cards', 7)
on conflict (name) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into public.subcategories (category_id, name, sort_order)
select c.id, s.name, s.sort_order
from (values
  ('PlayStation', 'Games', 1),
  ('PlayStation', 'Controllers', 2),
  ('PlayStation', 'Consoles', 3),
  ('PlayStation', 'Accessories', 4),
  ('Xbox', 'Controllers', 1),
  ('Xbox', 'Consoles', 2),
  ('Xbox', 'Accessories', 3),
  ('Meta', 'Consoles', 1),
  ('Meta', 'Accessories', 2),
  ('Nintendo', 'Games', 1),
  ('Nintendo', 'Controllers', 2),
  ('Nintendo', 'Consoles', 3),
  ('Nintendo', 'Accessories', 4),
  ('Mobiles', 'Apple', 1),
  ('Mobiles', 'Samsung', 2),
  ('Mobiles', 'Mi', 3),
  ('Mobiles', 'Accessories', 4),
  ('Laptop', 'Mac', 1)
) as s(category_name, name, sort_order)
join public.categories c on c.name = s.category_name
on conflict (category_id, name) do nothing;

alter table public.categories enable row level security;
alter table public.subcategories enable row level security;

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories" on public.categories for select to anon, authenticated using (true);
drop policy if exists "Admins insert categories" on public.categories;
create policy "Admins insert categories" on public.categories for insert to authenticated with check (public.is_admin());
drop policy if exists "Admins update categories" on public.categories;
create policy "Admins update categories" on public.categories for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins delete categories" on public.categories;
create policy "Admins delete categories" on public.categories for delete to authenticated using (public.is_admin());

drop policy if exists "Public can read subcategories" on public.subcategories;
create policy "Public can read subcategories" on public.subcategories for select to anon, authenticated using (true);
drop policy if exists "Admins insert subcategories" on public.subcategories;
create policy "Admins insert subcategories" on public.subcategories for insert to authenticated with check (public.is_admin());
drop policy if exists "Admins update subcategories" on public.subcategories;
create policy "Admins update subcategories" on public.subcategories for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins delete subcategories" on public.subcategories;
create policy "Admins delete subcategories" on public.subcategories for delete to authenticated using (public.is_admin());

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  order_number text not null unique,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  customer_address text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'completed', 'cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'refunded')),
  payment_method text not null default 'whatsapp',
  total integer not null default 0 check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders (id) on delete cascade,
  product_id integer references public.products (id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  line_total integer not null check (line_total >= 0)
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists order_items_order_id_idx on public.order_items (order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Admins read orders" on public.orders;
create policy "Admins read orders" on public.orders for select to authenticated using (public.is_admin());
drop policy if exists "Admins update orders" on public.orders;
create policy "Admins update orders" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins read order items" on public.order_items;
create policy "Admins read order items" on public.order_items for select to authenticated using (public.is_admin());

revoke all on public.orders from anon;
revoke all on public.order_items from anon;

create or replace function public.place_enquiry(
  buyer_name text,
  buyer_phone text,
  buyer_note text,
  items jsonb
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id bigint;
  new_number text;
  item jsonb;
  qty integer;
  line_total integer;
  order_total integer := 0;
  product_row public.products%rowtype;
begin
  if coalesce(trim(buyer_name), '') = '' or coalesce(trim(buyer_phone), '') = '' then
    raise exception 'Name and phone are required';
  end if;
  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 or jsonb_array_length(items) > 30 then
    raise exception 'Add between 1 and 30 products';
  end if;

  insert into public.orders (order_number, customer_name, customer_phone, notes, status, payment_status, payment_method, total)
  values ('TMP-' || gen_random_uuid()::text, trim(buyer_name), trim(buyer_phone), nullif(trim(coalesce(buyer_note, '')), ''), 'pending', 'unpaid', 'whatsapp', 0)
  returning id into new_id;

  new_number := 'GP-' || lpad(new_id::text, 5, '0');

  for item in select value from jsonb_array_elements(items)
  loop
    qty := (item->>'quantity')::integer;
    if qty is null or qty < 1 or qty > 99 then
      raise exception 'Invalid quantity';
    end if;
    select * into product_row from public.products where id = (item->>'product_id')::integer;
    if not found then
      raise exception 'Unknown product';
    end if;
    line_total := product_row.price * qty;
    order_total := order_total + line_total;
    insert into public.order_items (order_id, product_id, product_name, quantity, unit_price, line_total)
    values (new_id, product_row.id, product_row.name, qty, product_row.price, line_total);
  end loop;

  update public.orders set order_number = new_number, total = order_total where id = new_id;
  return new_number;
end;
$$;

revoke all on function public.place_enquiry(text, text, text, jsonb) from public;
grant execute on function public.place_enquiry(text, text, text, jsonb) to anon, authenticated;

create table if not exists public.store_settings (
  id integer primary key default 1 check (id = 1),
  store_name text not null default 'GAME PLAY',
  phone text not null default '0323 5551600',
  whatsapp_number text not null default '923235551600',
  address text not null default '1st Floor, 66B, Sector C Commercial Area, Bahria Town, Lahore, 56000, Pakistan',
  closing_time text not null default '11:30 PM',
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.store_settings enable row level security;
drop policy if exists "Public can read store settings" on public.store_settings;
create policy "Public can read store settings" on public.store_settings for select to anon, authenticated using (true);
drop policy if exists "Admins update store settings" on public.store_settings;
create policy "Admins update store settings" on public.store_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at before update on public.products
for each row execute function public.touch_updated_at();
drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at before update on public.orders
for each row execute function public.touch_updated_at();
drop trigger if exists settings_touch_updated_at on public.store_settings;
create trigger settings_touch_updated_at before update on public.store_settings
for each row execute function public.touch_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');
drop policy if exists "Admins upload product images" on storage.objects;
create policy "Admins upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "Admins update product images" on storage.objects;
create policy "Admins update product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "Admins delete product images" on storage.objects;
create policy "Admins delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- First admin user
-- 1. In Supabase, open Authentication → Users → Add user.
--    Enter an email and password, and turn on Auto Confirm User.
-- 2. Run this statement with that same email:
--
--    insert into public.profiles (id, email, role)
--    select id, email, 'admin' from auth.users where email = 'you@example.com'
--    on conflict (id) do update set role = 'admin', email = excluded.email;
--
-- Customers who sign up later stay role = 'customer'.
-- The app cannot change a role. Only this SQL editor can grant admin.
-- Do not put the service role key in .env. The site uses the anon key,
-- and these policies decide what that key is allowed to do.
