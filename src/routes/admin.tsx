import { Outlet, createFileRoute } from '@tanstack/react-router';
import { AdminShell } from '@/components/admin/shell';

export const Route = createFileRoute('/admin')({
  head: () => ({ meta: [
    { title: 'Admin | GAME PLAY' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: function AdminLayout() {
    return <AdminShell><Outlet /></AdminShell>;
  },
});
