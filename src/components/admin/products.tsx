import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { deleteProduct, fetchCategories, fetchProducts, messageOf, saveProduct, uploadProductImage, type AdminCategory, type AdminProduct } from '@/lib/admin';
import { money } from '@/lib/store';
import { AdminEmpty, AdminHeader, AdminNotice } from '@/components/admin/ui';

type Draft = {
  id?: number;
  name: string;
  group_name: string;
  subcategory: string;
  price: string;
  old_price: string;
  stock: string;
  description: string;
  badge: string;
  image_url: string;
  image_key: string;
};

const emptyDraft: Draft = { name: '', group_name: '', subcategory: '', price: '', old_price: '', stock: '0', description: '', badge: '', image_url: '', image_key: 'remote' };

export function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');
  const [subFilter, setSubFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'out'>('all');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  async function load() {
    const [nextProducts, nextCategories] = await Promise.all([fetchProducts(), fetchCategories()]);
    setProducts(nextProducts);
    setCategories(nextCategories);
  }

  useEffect(() => {
    let cancel = false;
    load().catch(reason => { if (!cancel) setError(messageOf(reason)); });
    return () => { cancel = true; };
  }, []);

  const groups = useMemo(() => {
    return [...new Set(products.map(product => product.group_name).filter((name): name is string => Boolean(name)))].sort();
  }, [products]);
  const subcategories = useMemo(() => {
    return [...new Set(products.filter(product => groupFilter === 'All' || product.group_name === groupFilter).map(product => product.subcategory).filter((name): name is string => Boolean(name)))].sort();
  }, [products, groupFilter]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter(product => {
      if (groupFilter !== 'All' && product.group_name !== groupFilter) return false;
      if (subFilter && product.subcategory !== subFilter) return false;
      if (stockFilter === 'in' && product.stock <= 0) return false;
      if (stockFilter === 'out' && product.stock > 0) return false;
      if (!needle) return true;
      return [product.name, product.group_name, product.subcategory, product.category].join(' ').toLowerCase().includes(needle);
    });
  }, [products, query, groupFilter, subFilter, stockFilter]);

  const subs = categories.find(category => category.name === draft?.group_name)?.subcategories ?? [];

  function edit(product: AdminProduct) {
    setNotice('');
    setError('');
    setDraft({
      id: product.id,
      name: product.name,
      group_name: product.group_name ?? '',
      subcategory: product.subcategory ?? '',
      price: String(product.price),
      old_price: product.old_price == null ? '' : String(product.old_price),
      stock: String(product.stock),
      description: product.description ?? '',
      badge: product.badge ?? '',
      image_url: product.image_url ?? '',
      image_key: product.image_key,
    });
  }

  async function onImage(file: File | undefined) {
    if (!file || !draft) return;
    setBusy(true);
    setError('');
    try {
      const image_url = await uploadProductImage(file);
      setDraft({ ...draft, image_url, image_key: 'remote' });
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    const price = Number(draft.price);
    const stock = Number(draft.stock);
    const oldPrice = draft.old_price.trim() ? Number(draft.old_price) : null;
    if (!draft.name.trim() || !draft.group_name) {
      setError('Name and category are required.');
      return;
    }
    if (!Number.isInteger(price) || price < 0 || !Number.isInteger(stock) || stock < 0 || (oldPrice != null && (!Number.isInteger(oldPrice) || oldPrice < 0))) {
      setError('Price, compare-at price, and stock must be whole numbers, zero or higher.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await saveProduct(draft.id, {
        name: draft.name.trim(),
        group_name: draft.group_name,
        subcategory: draft.subcategory,
        price,
        old_price: oldPrice,
        stock,
        description: draft.description.trim(),
        badge: draft.badge.trim() || null,
        image_url: draft.image_url || null,
        image_key: draft.image_key || 'remote',
      });
      setDraft(null);
      setNotice(draft.id ? 'Product updated.' : 'Product added.');
      await load();
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setBusy(false);
    }
  }

  async function remove(product: AdminProduct) {
    setBusy(true);
    setError('');
    try {
      await deleteProduct(product);
      setConfirmId(null);
      setNotice('Product deleted.');
      await load();
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <AdminHeader title="Products" text="Add, edit, search, and filter products stored in PostgreSQL." action={<button type="button" className="admin-button" onClick={() => { setDraft(emptyDraft); setError(''); setNotice(''); }}>Add product</button>} />
      {error && <AdminNotice>{error}</AdminNotice>}
      {notice && <AdminNotice tone="ok">{notice}</AdminNotice>}
      {draft && (
        <form className="admin-panel admin-form" onSubmit={submit}>
          <h2>{draft.id ? 'Edit product' : 'New product'}</h2>
          <div className="admin-form-grid">
            <label>Name<input value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} required /></label>
            <label>Category
              <select value={draft.group_name} onChange={event => setDraft({ ...draft, group_name: event.target.value, subcategory: '' })} required>
                <option value="">Select a category</option>
                {categories.map(category => <option key={category.id} value={category.name}>{category.name}</option>)}
              </select>
            </label>
            <label>Subcategory
              <select value={draft.subcategory} onChange={event => setDraft({ ...draft, subcategory: event.target.value })}>
                <option value="">None</option>
                {subs.map(sub => <option key={sub.id} value={sub.name}>{sub.name}</option>)}
              </select>
            </label>
            <label>Price (Rs.)<input inputMode="numeric" value={draft.price} onChange={event => setDraft({ ...draft, price: event.target.value })} required /></label>
            <label>Compare-at price<input inputMode="numeric" value={draft.old_price} onChange={event => setDraft({ ...draft, old_price: event.target.value })} /></label>
            <label>Stock quantity<input inputMode="numeric" value={draft.stock} onChange={event => setDraft({ ...draft, stock: event.target.value })} required /></label>
            <label>Badge<input value={draft.badge} onChange={event => setDraft({ ...draft, badge: event.target.value })} placeholder="Optional" /></label>
            <label className="admin-span">Description<textarea value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} rows={4} /></label>
            <label>Image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={event => void onImage(event.target.files?.[0])} /></label>
            {draft.image_url && <img className="admin-thumb" src={draft.image_url} alt="" />}
          </div>
          <div className="admin-actions">
            <button className="admin-button" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button>
            <button className="admin-button is-quiet" type="button" onClick={() => setDraft(null)}>Cancel</button>
          </div>
        </form>
      )}
      <div className="admin-panel">
        <div className="admin-filters">
          <label className="admin-search">Search<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Name or category" /></label>
          <label>Category
            <select value={groupFilter} onChange={event => { setGroupFilter(event.target.value); setSubFilter(''); }}>
              <option value="All">All categories</option>
              {groups.map(group => <option key={group} value={group}>{group}</option>)}
            </select>
          </label>
          <label>Subcategory
            <select value={subFilter} onChange={event => setSubFilter(event.target.value)}>
              <option value="">All subcategories</option>
              {subcategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
          </label>
          <label>Stock
            <select value={stockFilter} onChange={event => setStockFilter(event.target.value as 'all' | 'in' | 'out')}>
              <option value="all">All stock</option>
              <option value="in">In stock</option>
              <option value="out">Out of stock</option>
            </select>
          </label>
        </div>
        <div className="admin-quick-filters">
          <button type="button" className={groupFilter === 'All' && !subFilter && stockFilter === 'all' ? 'is-on' : ''} onClick={() => { setGroupFilter('All'); setSubFilter(''); setStockFilter('all'); }}>All</button>
          {groups.map(group => (
            <button type="button" key={group} className={groupFilter === group ? 'is-on' : ''} onClick={() => { setGroupFilter(group); setSubFilter(''); }}>{group}</button>
          ))}
        </div>
        <p className="admin-muted">{visible.length} of {products.length} products</p>
        {visible.length === 0 ? <AdminEmpty>No products match this search.</AdminEmpty> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead>
              <tbody>
                {visible.map(product => (
                  <tr key={product.id}>
                    <td><div className="admin-product"><img src={product.image_url || '/favicon.png'} alt="" /><span>{product.name}<small>{product.description || 'No description'}</small></span></div></td>
                    <td>{product.group_name || product.category}{product.subcategory ? ` / ${product.subcategory}` : ''}</td>
                    <td>{money(product.price)}</td>
                    <td className={product.stock === 0 ? 'is-out' : ''}>{product.stock}</td>
                    <td className="admin-row-actions">
                      <button type="button" onClick={() => edit(product)}>Edit</button>
                      {confirmId === product.id ? <button type="button" className="is-danger" onClick={() => void remove(product)}>Confirm</button> : <button type="button" onClick={() => setConfirmId(product.id)}>Delete</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
