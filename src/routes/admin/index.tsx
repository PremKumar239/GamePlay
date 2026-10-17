import { createFileRoute } from '@tanstack/react-router';
import { DashboardPage } from '@/components/admin/dashboard';

export const Route = createFileRoute('/admin/')({
  component: DashboardPage,
});
