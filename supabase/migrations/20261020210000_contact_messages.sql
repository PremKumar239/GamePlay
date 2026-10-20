-- Contact form messages from the public Contact Us page.
-- Safe to run more than once.

create table if not exists public.contact_messages (
  id bigint generated always as identity primary key,
  customer_name text not null default '',
  customer_email text,
  customer_phone text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);
create index if not exists contact_messages_status_idx on public.contact_messages (status);

alter table public.contact_messages enable row level security;

drop policy if exists "Admins read contact messages" on public.contact_messages;
create policy "Admins read contact messages" on public.contact_messages
  for select to authenticated using (public.is_admin());

drop policy if exists "Admins update contact messages" on public.contact_messages;
create policy "Admins update contact messages" on public.contact_messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.contact_messages from anon;

create or replace function public.place_contact_message(
  buyer_name text,
  buyer_email text,
  buyer_phone text,
  buyer_message text
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id bigint;
begin
  if coalesce(trim(buyer_message), '') = '' then
    raise exception 'Message is required';
  end if;
  if char_length(trim(buyer_message)) > 4000 then
    raise exception 'Message is too long';
  end if;

  insert into public.contact_messages (customer_name, customer_email, customer_phone, message, status)
  values (
    coalesce(nullif(trim(coalesce(buyer_name, '')), ''), 'Website visitor'),
    nullif(trim(coalesce(buyer_email, '')), ''),
    nullif(trim(coalesce(buyer_phone, '')), ''),
    trim(buyer_message),
    'new'
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.place_contact_message(text, text, text, text) from public;
grant execute on function public.place_contact_message(text, text, text, text) to anon, authenticated;
