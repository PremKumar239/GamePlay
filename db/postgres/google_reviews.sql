-- Cache for Google Places reviews. Safe to run more than once.
create table if not exists public.google_reviews_cache (
  id integer primary key default 1 check (id = 1),
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);
