import { createFileRoute } from "@tanstack/react-router";
import { Storefront } from '@/components/storefront';
export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: 'GAME PLAY | Consoles, Games & Accessories in Lahore' },
    { name: 'description', content: 'Discover consoles, video games and gaming accessories at GAME PLAY, Bahria Town Lahore. Rated 4.8/5 by 76 customers.' },
    { property: 'og:title', content: 'GAME PLAY | Your Next Level Starts Here' },
    { property: 'og:description', content: 'Explore consoles, games and accessories. Visit GAME PLAY in Bahria Town, Lahore.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <Storefront />,
});
