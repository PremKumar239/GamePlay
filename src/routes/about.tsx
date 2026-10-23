import { createFileRoute } from '@tanstack/react-router';
import { Storefront } from '@/components/storefront';

export const Route = createFileRoute('/about')({
  head: () => ({ meta: [
    { title: 'About GAME PLAY | Bahria Town Lahore' },
    { name: 'description', content: 'About GAME PLAY in Bahria Town, Lahore — consoles, games, accessories, gift cards, plus refund and exchange for store and online purchases.' },
    { property: 'og:title', content: 'About GAME PLAY' },
    { property: 'og:description', content: 'Gaming store in Bahria Town, Lahore. Service-first shopping with refund and exchange for in-store and online orders.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <Storefront page="about" />,
});
