import { createFileRoute } from '@tanstack/react-router';
import { Storefront } from '@/components/storefront';

export const Route = createFileRoute('/shop')({
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search['category'] === 'string' ? search['category'] : 'All',
    q: typeof search['q'] === 'string' ? search['q'] : '',
    deals: search['deals'] === true || search['deals'] === 'true',
  }),
  head: () => ({ meta: [
    { title: 'Shop Consoles, Games & Gaming Gear | GAME PLAY' },
    { name: 'description', content: 'Browse GAME PLAY consoles, controllers, games and gaming accessories. Enquire about availability with our Lahore store.' },
    { property: 'og:title', content: 'Shop Gaming Essentials | GAME PLAY' },
    { property: 'og:description', content: 'Explore consoles, games, controllers, headsets and special offers at GAME PLAY.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Shop,
});
function Shop() { const search = Route.useSearch(); return <Storefront page="shop" initialCategory={search.category} initialQuery={search.q} initialDeals={search.deals} />; }