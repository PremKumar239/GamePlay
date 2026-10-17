import { createFileRoute } from '@tanstack/react-router';
import { SalesPage } from '@/components/admin/sales';

export const Route = createFileRoute('/admin/sales')({
  component: SalesPage,
});
