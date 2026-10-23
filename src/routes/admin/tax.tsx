import { createFileRoute } from '@tanstack/react-router';
import { TaxPage } from '@/components/admin/tax';

export const Route = createFileRoute('/admin/tax')({
  component: TaxPage,
});
