import { createFileRoute } from '@tanstack/react-router';
import { CategoriesPage } from '@/components/admin/categories';

export const Route = createFileRoute('/admin/categories')({
  component: CategoriesPage,
});
