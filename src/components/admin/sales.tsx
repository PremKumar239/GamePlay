import { useEffect, useState } from 'react';
import { fetchOrders, fetchProducts, fetchSettings, messageOf, salesSummary, type AdminOrder, type AdminProduct } from '@/lib/admin';
import { money } from '@/lib/store';
import { AdminEmpty, AdminHeader, AdminNotice, Stat, when } from '@/components/admin/ui';

export function SalesPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [threshold, setThreshold] = useState(5);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancel = false;
    Promise.all([fetchOrders(), fetchProducts(), fetchSettings()])
      .then(([nextOrders, nextProducts, settings]) => {
        if (cancel) return;
        setOrders(nextOrders);
        setProducts(nextProducts);
        setThreshold(settings.low_stock_threshold);
      })
      .catch(reason => { if (!cancel) setError(messageOf(reason)); });
    return () => { cancel = true; };
  }, []);

  const summary = salesSummary(orders, products, threshold);

  return (
    <section>
      <AdminHeader title="Sales" text="Revenue and history count orders you have marked paid. Cancelled orders are left out." />
      {error && <AdminNotice>{error}</AdminNotice>}
      <div className="admin-stats">
        <Stat label="Revenue" value={money(summary.revenue)} />
        <Stat label="Paid sales" value={String(summary.sales)} />
        <Stat label="Average sale" value={summary.sales ? money(Math.round(summary.revenue / summary.sales)) : money(0)} />
      </div>
      <div className="admin-split">
        <section className="admin-panel">
          <h2>Best sellers</h2>
          {summary.bestsellers.length === 0 ? <AdminEmpty>Best sellers appear after a paid order has items.</AdminEmpty> : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Product</th><th>Sold</th><th>Revenue</th></tr></thead>
                <tbody>
                  {summary.bestsellers.map(item => (
                    <tr key={item.name}><td>{item.name}</td><td>{item.quantity}</td><td>{money(item.revenue)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="admin-panel">
          <h2>Sales history</h2>
          {summary.history.length === 0 ? <AdminEmpty>No paid sales yet. Mark an order paid on the Orders page.</AdminEmpty> : (
            <ul className="admin-list">
              {summary.history.map(order => (
                <li key={order.id}><span>{order.order_number} · {order.customer_name}<small>{when(order.created_at)}</small></span><strong>{money(order.total)}</strong></li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
