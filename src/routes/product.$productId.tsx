import { createFileRoute } from '@tanstack/react-router';
import { Storefront } from '@/components/storefront';
import { getProduct } from '@/lib/store';

export const Route = createFileRoute('/product/$productId')({
  head: ({ params }) => {
    const product = getProduct(Number(params.productId));
    const title = product ? `${product.name} | GAME PLAY` : 'Product | GAME PLAY';
    const description = product?.description || 'View product details, stock and price at GAME PLAY, Bahria Town, Lahore. Enquire on WhatsApp.';
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { productId } = Route.useParams();
  return <Storefront page="product" productId={Number(productId)} />;
}
