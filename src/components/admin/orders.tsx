import { useEffect, useState } from 'react';
import { fetchOrders, messageOf, orderStatuses, paymentStatuses, updateOrder, type AdminOrder, type OrderStatus, type PaymentStatus } from '@/lib/admin';
import { money } from '@/lib/store';
import { AdminEmpty, AdminHeader, AdminNotice, when } from '@/components/admin/ui';

export function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let cancel = false;
    fetchOrders().then(rows => { if (!cancel) setOrders(rows); }).catch(reason => { if (!cancel) setError(messageOf(reason)); });
    return () => { cancel = true; };
  }, []);

  async function save(order: AdminOrder, status: OrderStatus, payment: PaymentStatus) {
    setBusyId(order.id);
    setError('');
    try {
      await updateOrder(order.id, status, payment);
      setOrders(current => current.map(item => item.id === order.id ? { ...item, status, payment_status: payment } : item));
      setNotice(`${order.order_number} updated.`);
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      <AdminHeader title="Orders" text="Customer enquiries saved from the shop. Payment stays unpaid until you mark it paid. No card payment is taken on the site." />
      {error && <AdminNotice>{error}</AdminNotice>}
      {notice && <AdminNotice tone="ok">{notice}</AdminNotice>}
      {orders.length === 0 ? <AdminEmpty>No orders yet. When a shopper adds their name and phone and taps Enquire on WhatsApp, the order is stored here.</AdminEmpty> : (
        <div className="admin-stack">
          {orders.map(order => (
            <article className="admin-panel" key={order.id}>
              <button type="button" className="admin-order-summary" onClick={() => setOpenId(openId === order.id ? null : order.id)}>
                <span><strong>{order.order_number}</strong><small>{when(order.created_at)}</small></span>
                <span>{order.customer_name}</span>
                <span className={`admin-pill is-${order.status}`}>{order.status}</span>
                <span className={`admin-pill is-${order.payment_status}`}>{order.payment_status}</span>
                <strong>{money(order.total)}</strong>
              </button>
              {openId === order.id && (
                <div className="admin-order-body">
                  <div className="admin-detail-grid">
                    <p><span>Phone</span>{order.customer_phone}</p>
                    <p><span>Email</span>{order.customer_email || 'Not provided'}</p>
                    <p><span>Address</span>{order.customer_address || 'Not provided'}</p>
                    <p><span>Payment method</span>{order.payment_method}</p>
                  </div>
                  {order.notes && <p className="admin-muted">{order.notes}</p>}
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Line</th></tr></thead>
                      <tbody>
                        {order.items.map(item => (
                          <tr key={item.id}><td>{item.product_name}</td><td>{item.quantity}</td><td>{money(item.unit_price)}</td><td>{money(item.line_total)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="admin-inline">
                    <label>Order status
                      <select value={order.status} disabled={busyId === order.id} onChange={event => void save(order, event.target.value as OrderStatus, order.payment_status)}>
                        {orderStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </label>
                    <label>Payment status
                      <select value={order.payment_status} disabled={busyId === order.id} onChange={event => void save(order, order.status, event.target.value as PaymentStatus)}>
                        {paymentStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </label>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
