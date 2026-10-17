import { createFileRoute } from '@tanstack/react-router';
import { ProductsPage } from '@/components/admin/products';

export const Route = createFileRoute('/admin/products')({
  component: ProductsPage,
});
