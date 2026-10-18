-- Keep only the gift card brands used by the storefront.
-- Safe to run more than once.

update public.categories
set label = 'Apple, PlayStation, Xbox, Nintendo eShop, Steam, iTunes and Roblox'
where name = 'Gift Cards';

delete from public.subcategories
where category_id = (select id from public.categories where name = 'Gift Cards')
  and name in ('Google Play', 'Razer Gold', 'Riot', 'Meta Quest');

insert into public.subcategories (category_id, name, sort_order)
select c.id, s.name, s.sort_order
from (values
  ('Gift Cards', 'Apple', 1),
  ('Gift Cards', 'PlayStation', 2),
  ('Gift Cards', 'Xbox', 3),
  ('Gift Cards', 'Nintendo eShop', 4),
  ('Gift Cards', 'Steam', 5),
  ('Gift Cards', 'iTunes', 6),
  ('Gift Cards', 'Roblox', 7)
) as s(category_name, name, sort_order)
join public.categories c on c.name = s.category_name
on conflict (category_id, name) do update set sort_order = excluded.sort_order;
