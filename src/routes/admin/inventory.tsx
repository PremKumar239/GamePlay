import { createFileRoute } from '@tanstack/react-router';
import { InventoryPage } from '@/components/admin/inventory';

export const Route = createFileRoute('/admin/inventory')({
  component: InventoryPage,
});
