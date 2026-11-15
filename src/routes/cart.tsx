import { createFileRoute } from '@tanstack/react-router';
import { Storefront } from '@/components/storefront';

export const Route = createFileRoute('/cart')({
  head: () => ({ meta: [
    { title: 'Your Cart | GAME PLAY' },
    { name: 'description', content: 'Review the games and gear in your GAME PLAY cart, then enquire on WhatsApp to confirm stock and price.' },
    { property: 'og:title', content: 'Your Cart | GAME PLAY' },
    { property: 'og:description', content: 'Your GAME PLAY shopping cart. Enquire with the Bahria Town store — no payment is taken here.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <Storefront page="cart" />,
});
