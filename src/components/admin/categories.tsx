import { useEffect, useState, type FormEvent } from 'react';
import { deleteCategory, deleteSubcategory, fetchCategories, messageOf, saveCategory, saveSubcategory, type AdminCategory } from '@/lib/admin';
import { AdminEmpty, AdminHeader, AdminNotice } from '@/components/admin/ui';

export function CategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [subs, setSubs] = useState<Record<number, string>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  async function load() {
    setCategories(await fetchCategories());
  }

  useEffect(() => {
    let cancel = false;
    load().catch(reason => { if (!cancel) setError(messageOf(reason)); });
    return () => { cancel = true; };
  }, []);

  function beginEdit(category: AdminCategory) {
    setEditing(category.id);
    setName(category.name);
    setLabel(category.label);
    setError('');
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError('');
    try {
      const current = categories.find(category => category.id === editing);
      await saveCategory(editing ?? undefined, name.trim(), label.trim(), current?.sort_order ?? categories.length + 1);
      setName('');
      setLabel('');
      setEditing(null);
      setNotice(editing ? 'Category updated.' : 'Category added.');
      await load();
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    setBusy(true);
    setError('');
    try {
      await deleteCategory(id);
      setConfirmId(null);
      setNotice('Category deleted. Products keep the names already saved on them.');
      await load();
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setBusy(false);
    }
  }

  async function addSub(category: AdminCategory) {
    const value = (subs[category.id] || '').trim();
    if (!value) return;
    setBusy(true);
    setError('');
    try {
      await saveSubcategory(category.id, value, category.subcategories.length + 1);
      setSubs(current => ({ ...current, [category.id]: '' }));
      setNotice('Subcategory added.');
      await load();
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setBusy(false);
    }
  }

  async function removeSub(id: number) {
    setBusy(true);
    setError('');
    try {
      await deleteSubcategory(id);
      await load();
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <AdminHeader title="Categories" text="These groups and subcategories are stored in Supabase and used when you add a product." />
      {error && <AdminNotice>{error}</AdminNotice>}
      {notice && <AdminNotice tone="ok">{notice}</AdminNotice>}
      <form className="admin-panel admin-form" onSubmit={submit}>
        <h2>{editing ? 'Edit category' : 'New category'}</h2>
        <div className="admin-form-grid">
          <label>Name<input value={name} onChange={event => setName(event.target.value)} required /></label>
          <label>Short description<input value={label} onChange={event => setLabel(event.target.value)} /></label>
        </div>
        <div className="admin-actions">
          <button className="admin-button" type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Update category' : 'Add category'}</button>
          {editing && <button className="admin-button is-quiet" type="button" onClick={() => { setEditing(null); setName(''); setLabel(''); }}>Cancel</button>}
        </div>
      </form>
      {categories.length === 0 ? <AdminEmpty>No categories yet.</AdminEmpty> : (
        <div className="admin-category-list">
          {categories.map(category => (
            <article className="admin-panel" key={category.id}>
              <div className="admin-panel-head">
                <h2>{category.name}</h2>
                <div className="admin-row-actions">
                  <button type="button" onClick={() => beginEdit(category)}>Edit</button>
                  {confirmId === category.id ? <button type="button" className="is-danger" onClick={() => void remove(category.id)}>Confirm delete</button> : <button type="button" onClick={() => setConfirmId(category.id)}>Delete</button>}
                </div>
              </div>
              <p className="admin-muted">{category.label || 'No description'}</p>
              <ul className="admin-chips">
                {category.subcategories.map(sub => (
                  <li key={sub.id}>{sub.name}<button type="button" aria-label={`Remove ${sub.name}`} onClick={() => void removeSub(sub.id)}>×</button></li>
                ))}
              </ul>
              <div className="admin-inline">
                <input aria-label={`New subcategory for ${category.name}`} value={subs[category.id] ?? ''} onChange={event => setSubs(current => ({ ...current, [category.id]: event.target.value }))} placeholder="New subcategory" />
                <button type="button" className="admin-button is-quiet" onClick={() => void addSub(category)}>Add</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
