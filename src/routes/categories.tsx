import { createFileRoute } from '@tanstack/react-router';
import { Storefront } from '@/components/storefront';

export const Route = createFileRoute('/categories')({
  head: () => ({ meta: [
    { title: 'Shop by Category | GAME PLAY' },
    { name: 'description', content: 'Browse PlayStation, Xbox, Meta, Nintendo, mobiles, laptops and gift cards at GAME PLAY in Bahria Town, Lahore.' },
    { property: 'og:title', content: 'Categories | GAME PLAY' },
    { property: 'og:description', content: 'Find consoles, games, controllers and gift cards by category at GAME PLAY.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <Storefront page="categories" />,
});
