-- Safe to run more than once. Does not delete existing products.
alter table public.products add column if not exists shopify_key text;
create unique index if not exists products_shopify_key_uidx on public.products (shopify_key) where shopify_key is not null;
