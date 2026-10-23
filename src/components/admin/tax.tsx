import { useEffect, useState, type FormEvent } from 'react';
import {
  fetchOrders,
  fetchTaxSettings,
  messageOf,
  taxPaymentMethods,
  taxSummary,
  saveTaxSettings,
  updateOrderPaymentMethod,
  type AdminOrder,
  type TaxPaymentMethod,
  type TaxSettings,
} from '@/lib/admin';
import { money } from '@/lib/store';
import { AdminEmpty, AdminHeader, AdminNotice, Stat, when } from '@/components/admin/ui';

function paymentLabel(method: string, kind: string) {
  if (kind === 'card') return 'Card Payment';
  if (kind === 'cod') return method.toLowerCase() === 'whatsapp' ? 'COD (WhatsApp)' : 'Cash on Delivery';
  return method || 'Other';
}

export function TaxPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [settings, setSettings] = useState<Pick<TaxSettings, 'card_tax_percent' | 'cod_tax_percent'> | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null);

  useEffect(() => {
    let cancel = false;
    Promise.all([fetchOrders(), fetchTaxSettings()])
      .then(([nextOrders, nextSettings]) => {
        if (cancel) return;
        setOrders(nextOrders);
        setSettings({
          card_tax_percent: nextSettings.card_tax_percent,
          cod_tax_percent: nextSettings.cod_tax_percent,
        });
      })
      .catch(reason => { if (!cancel) setError(messageOf(reason)); });
    return () => { cancel = true; };
  }, []);

  async function saveRates(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    if (settings.card_tax_percent < 0 || settings.cod_tax_percent < 0 || settings.card_tax_percent > 100 || settings.cod_tax_percent > 100) {
      setError('Tax percentages must be between 0 and 100.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await saveTaxSettings(settings);
      setNotice('Tax percentages saved. New and existing orders use these rates in this Tax section only.');
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setBusy(false);
    }
  }

  async function setPaymentMethod(order: AdminOrder, method: TaxPaymentMethod) {
    setBusyOrderId(order.id);
    setError('');
    try {
      await updateOrderPaymentMethod(order.id, method);
      setOrders(current => current.map(item => item.id === order.id ? { ...item, payment_method: method } : item));
      setNotice(`${order.order_number} payment method set to ${method === 'card' ? 'Card Payment' : 'Cash on Delivery'}.`);
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setBusyOrderId(null);
    }
  }

  const summary = settings ? taxSummary(orders, settings) : null;

  return (
    <section>
      <AdminHeader
        title="Tax"
        text="Configure card and COD tax percentages for admin reference. These rates do not change product prices, checkout totals, or what customers see."
      />
      {error && <AdminNotice>{error}</AdminNotice>}
      {notice && <AdminNotice tone="ok">{notice}</AdminNotice>}

      {settings && (
        <form className="admin-panel admin-form" onSubmit={saveRates}>
          <h2>Tax percentages</h2>
          <p className="admin-muted">Saved in Supabase. Applied automatically to every order listed below based on payment method.</p>
          <div className="admin-form-grid">
            <label>Card Payment tax (%)
              <input
                inputMode="decimal"
                value={settings.card_tax_percent}
                onChange={event => setSettings({ ...settings, card_tax_percent: Number(event.target.value) })}
                required
              />
            </label>
            <label>Cash on Delivery tax (%)
              <input
                inputMode="decimal"
                value={settings.cod_tax_percent}
                onChange={event => setSettings({ ...settings, cod_tax_percent: Number(event.target.value) })}
                required
              />
            </label>
          </div>
          <div className="admin-actions">
            <button className="admin-button" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save tax rates'}</button>
          </div>
        </form>
      )}

      {summary && (
        <>
          <div className="admin-stats">
            <Stat label="Card tax total" value={money(summary.cardTax)} hint="Sum of tax on card-method orders" />
            <Stat label="COD tax total" value={money(summary.codTax)} hint="Sum of tax on COD / WhatsApp orders" />
            <Stat label="Overall tax" value={money(summary.totalTax)} hint="Card + COD tax for admin reference" />
          </div>

          <section className="admin-panel">
            <h2>Order tax</h2>
            <p className="admin-muted">Each row uses the current saved percentage for that order’s payment method. Cancelled orders are excluded.</p>
            {summary.rows.length === 0 ? (
              <AdminEmpty>No orders yet. When customers enquire, their tax appears here using the rates above.</AdminEmpty>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Payment method</th>
                      <th>Order amount</th>
                      <th>Tax %</th>
                      <th>Tax amount</th>
                      <th>Classify</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.rows.map(row => (
                      <tr key={row.orderId}>
                        <td>
                          <strong>{row.orderNumber}</strong>
                          <small className="admin-muted" style={{ display: 'block' }}>#{row.orderId} · {when(row.createdAt)}</small>
                        </td>
                        <td>{paymentLabel(row.paymentMethod, row.kind)}</td>
                        <td>{money(row.orderAmount)}</td>
                        <td>{row.taxPercent}%</td>
                        <td><strong>{money(row.taxAmount)}</strong></td>
                        <td>
                          <select
                            value={row.kind === 'card' ? 'card' : row.kind === 'cod' ? 'cod' : ''}
                            disabled={busyOrderId === row.orderId}
                            onChange={event => {
                              const value = event.target.value as TaxPaymentMethod;
                              if (!taxPaymentMethods.includes(value)) return;
                              const order = orders.find(item => item.id === row.orderId);
                              if (order) void setPaymentMethod(order, value);
                            }}
                            aria-label={`Set payment method for ${row.orderNumber}`}
                          >
                            {row.kind === 'other' && <option value="">Set method…</option>}
                            <option value="card">Card Payment</option>
                            <option value="cod">Cash on Delivery</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}
