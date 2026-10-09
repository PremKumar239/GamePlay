import { createFileRoute } from '@tanstack/react-router';
import { Storefront } from '@/components/storefront';
export const Route = createFileRoute('/contact')({
  head: () => ({ meta: [
    { title: 'Visit & Contact GAME PLAY | Bahria Town Lahore' },
    { name: 'description', content: 'Find GAME PLAY at 1st Floor, 66B, Sector C Commercial Area, Bahria Town Lahore. Call 0323 5551600. Closes at 11:30 PM.' },
    { property: 'og:title', content: 'Visit GAME PLAY in Lahore' },
    { property: 'og:description', content: 'Store location, phone, closing time and customer review summary for GAME PLAY, Bahria Town Lahore.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <Storefront page="contact" />,
});