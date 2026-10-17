import { useEffect, useState } from 'react';
import { fetchProducts, fetchSettings, messageOf, updateStock, type AdminProduct } from '@/lib/admin';
import { AdminEmpty, AdminHeader, AdminNotice } from '@/components/admin/ui';

export function InventoryPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [threshold, setThreshold] = useState(5);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let cancel = false;
    Promise.all([fetchProducts(), fetchSettings()])
      .then(([nextProducts, settings]) => {
        if (cancel) return;
        setProducts([...nextProducts].sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name)));
        setThreshold(settings.low_stock_threshold);
      })
      .catch(reason => { if (!cancel) setError(messageOf(reason)); });
    return () => { cancel = true; };
  }, []);

  async function save(product: AdminProduct) {
    const stock = Number(drafts[product.id] ?? product.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      setError('Stock must be a whole number, zero or higher.');
      return;
    }
    setBusyId(product.id);
    setError('');
    try {
      await updateStock(product.id, stock);
      setProducts(current => [...current.map(item => item.id === product.id ? { ...item, stock } : item)].sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name)));
      setNotice(`${product.name} stock is now ${stock}.`);
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setBusyId(null);
    }
  }

  const out = products.filter(product => product.stock === 0).length;
  const low = products.filter(product => product.stock > 0 && product.stock <= threshold).length;

  return (
    <section>
      <AdminHeader title="Inventory" text={`${out} out of stock · ${low} low (at or below ${threshold}). Change the low-stock line in Settings.`} />
      {error && <AdminNotice>{error}</AdminNotice>}
      {notice && <AdminNotice tone="ok">{notice}</AdminNotice>}
      {products.length === 0 ? <AdminEmpty>No products to stock yet.</AdminEmpty> : (
        <div className="admin-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Product</th><th>Category</th><th>Status</th><th>Quantity</th><th></th></tr></thead>
              <tbody>
                {products.map(product => {
                  const level = product.stock === 0 ? 'Out of stock' : product.stock <= threshold ? 'Low stock' : 'In stock';
                  return (
                    <tr key={product.id} className={product.stock === 0 ? 'is-out-row' : product.stock <= threshold ? 'is-low-row' : ''}>
                      <td>{product.name}</td>
                      <td>{product.group_name || product.category}</td>
                      <td><span className={`admin-pill ${product.stock === 0 ? 'is-cancelled' : product.stock <= threshold ? 'is-pending' : 'is-completed'}`}>{level}</span></td>
                      <td><input className="admin-stock" inputMode="numeric" aria-label={`Stock for ${product.name}`} value={drafts[product.id] ?? String(product.stock)} onChange={event => setDrafts(current => ({ ...current, [product.id]: event.target.value }))} /></td>
                      <td><button type="button" className="admin-button is-quiet" disabled={busyId === product.id} onClick={() => void save(product)}>{busyId === product.id ? 'Saving…' : 'Save'}</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
