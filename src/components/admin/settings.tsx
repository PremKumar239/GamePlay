import { useEffect, useState, type FormEvent } from 'react';
import { fetchSettings, messageOf, saveSettings, type StoreSettings } from '@/lib/admin';
import { supabase } from '@/lib/supabase';
import { AdminHeader, AdminNotice } from '@/components/admin/ui';

export function SettingsPage() {
  const [form, setForm] = useState<Omit<StoreSettings, 'id'> | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancel = false;
    fetchSettings().then(settings => {
      if (cancel) return;
      setForm({
        store_name: settings.store_name,
        phone: settings.phone,
        whatsapp_number: settings.whatsapp_number,
        address: settings.address,
        closing_time: settings.closing_time,
        low_stock_threshold: settings.low_stock_threshold,
      });
    }).catch(reason => { if (!cancel) setError(messageOf(reason)); });
    supabase?.auth.getUser().then(({ data }) => { if (!cancel) setEmail(data.user?.email ?? ''); });
    return () => { cancel = true; };
  }, []);

  function set<K extends keyof Omit<StoreSettings, 'id'>>(key: K, value: Omit<StoreSettings, 'id'>[K]) {
    setForm(current => current ? { ...current, [key]: value } : current);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    if (!form.store_name.trim() || !form.phone.trim() || form.low_stock_threshold < 0 || !Number.isInteger(form.low_stock_threshold)) {
      setError('Store name, phone, and a whole-number stock threshold are required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await saveSettings(form);
      setNotice('Store settings saved.');
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <AdminHeader title="Settings" text="Store details shown on the website, plus sign-out for this browser." />
      {error && <AdminNotice>{error}</AdminNotice>}
      {notice && <AdminNotice tone="ok">{notice}</AdminNotice>}
      {form && (
        <form className="admin-panel admin-form" onSubmit={submit}>
          <div className="admin-form-grid">
            <label>Store name<input value={form.store_name} onChange={event => set('store_name', event.target.value)} required /></label>
            <label>Phone<input value={form.phone} onChange={event => set('phone', event.target.value)} required /></label>
            <label>WhatsApp number<input value={form.whatsapp_number} onChange={event => set('whatsapp_number', event.target.value)} /></label>
            <label>Closing time<input value={form.closing_time} onChange={event => set('closing_time', event.target.value)} /></label>
            <label className="admin-span">Address<textarea value={form.address} rows={3} onChange={event => set('address', event.target.value)} /></label>
            <label>Low-stock threshold<input inputMode="numeric" value={form.low_stock_threshold} onChange={event => set('low_stock_threshold', Number(event.target.value))} /></label>
          </div>
          <div className="admin-actions">
            <button className="admin-button" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>
          </div>
        </form>
      )}
      <section className="admin-panel">
        <h2>Session</h2>
        <p className="admin-muted">Signed in as {email || 'an admin'}.</p>
        <button type="button" className="admin-button is-quiet" onClick={() => void supabase?.auth.signOut()}>Log out</button>
      </section>
    </section>
  );
}
