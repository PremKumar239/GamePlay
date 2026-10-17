import { createFileRoute } from '@tanstack/react-router';
import { Storefront } from '@/components/storefront';

export const Route = createFileRoute('/about')({
  head: () => ({ meta: [
    { title: 'About GAME PLAY | Bahria Town Lahore' },
    { name: 'description', content: 'GAME PLAY is a gaming store in Bahria Town, Lahore. Rated 4.8/5 by 76 customers. Consoles, games and accessories.' },
    { property: 'og:title', content: 'About GAME PLAY' },
    { property: 'og:description', content: 'Your destination for consoles, games and gaming essentials in Bahria Town, Lahore.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <Storefront page="about" />,
});
