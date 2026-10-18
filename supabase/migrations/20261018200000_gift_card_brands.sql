-- Add the gift card brands shown on the storefront.
-- Safe to run more than once.

update public.categories
set label = 'PlayStation, iTunes, Xbox, Google Play, Nintendo eShop, Steam, Roblox, Razer Gold, Riot, Meta Quest and Apple'
where name = 'Gift Cards';

insert into public.subcategories (category_id, name, sort_order)
select c.id, s.name, s.sort_order
from (values
  ('Gift Cards', 'PlayStation', 1),
  ('Gift Cards', 'iTunes', 2),
  ('Gift Cards', 'Xbox', 3),
  ('Gift Cards', 'Google Play', 4),
  ('Gift Cards', 'Nintendo eShop', 5),
  ('Gift Cards', 'Steam', 6),
  ('Gift Cards', 'Roblox', 7),
  ('Gift Cards', 'Razer Gold', 8),
  ('Gift Cards', 'Riot', 9),
  ('Gift Cards', 'Meta Quest', 10),
  ('Gift Cards', 'Apple', 11)
) as s(category_name, name, sort_order)
join public.categories c on c.name = s.category_name
on conflict (category_id, name) do update set sort_order = excluded.sort_order;
