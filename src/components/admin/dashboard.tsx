import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { fetchOrders, fetchProducts, fetchSettings, messageOf, salesSummary, type AdminOrder, type AdminProduct } from '@/lib/admin';
import { money } from '@/lib/store';
import { AdminEmpty, AdminHeader, AdminNotice, Stat, when } from '@/components/admin/ui';

export function DashboardPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [threshold, setThreshold] = useState(5);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancel = false;
    Promise.all([fetchProducts(), fetchOrders(), fetchSettings()])
      .then(([nextProducts, nextOrders, settings]) => {
        if (cancel) return;
        setProducts(nextProducts);
        setOrders(nextOrders);
        setThreshold(settings.low_stock_threshold);
      })
      .catch(reason => { if (!cancel) setError(messageOf(reason)); });
    return () => { cancel = true; };
  }, []);

  const summary = salesSummary(orders, products, threshold);

  return (
    <section>
      <AdminHeader title="Dashboard" text="Live figures from your Supabase orders, products, and stock." />
      {error && <AdminNotice>{error}</AdminNotice>}
      <div className="admin-stats">
        <Stat label="Total sales" value={String(summary.sales)} hint="Paid orders, excluding cancelled" />
        <Stat label="Total orders" value={String(summary.orders)} hint="Every saved enquiry" />
        <Stat label="Revenue" value={money(summary.revenue)} hint="Sum of paid orders" />
        <Stat label="Pending orders" value={String(summary.pending)} hint="Waiting for the store" />
      </div>
      <div className="admin-split">
        <section className="admin-panel">
          <div className="admin-panel-head"><h2>Low stock</h2><Link to="/admin/inventory">Inventory</Link></div>
          {summary.lowStock.length === 0 ? <AdminEmpty>No products are at or below {threshold} in stock.</AdminEmpty> : (
            <ul className="admin-list">
              {summary.lowStock.slice(0, 6).map(product => (
                <li key={product.id}><span>{product.name}</span><strong className={product.stock === 0 ? 'is-out' : 'is-low'}>{product.stock === 0 ? 'Out of stock' : `${product.stock} left`}</strong></li>
              ))}
            </ul>
          )}
        </section>
        <section className="admin-panel">
          <div className="admin-panel-head"><h2>Recent orders</h2><Link to="/admin/orders">Orders</Link></div>
          {orders.length === 0 ? <AdminEmpty>No orders yet. A cart enquiry with a name and phone is saved here.</AdminEmpty> : (
            <ul className="admin-list">
              {orders.slice(0, 6).map(order => (
                <li key={order.id}><span>{order.order_number} · {order.customer_name}<small>{when(order.created_at)}</small></span><strong>{money(order.total)}</strong></li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
