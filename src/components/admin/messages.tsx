import { useEffect, useState } from 'react';
import { fetchContactMessages, messageOf, messageStatuses, updateContactMessage, type AdminContactMessage, type MessageStatus } from '@/lib/admin';
import { AdminEmpty, AdminHeader, AdminNotice, when } from '@/components/admin/ui';

export function MessagesPage() {
  const [messages, setMessages] = useState<AdminContactMessage[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let cancel = false;
    fetchContactMessages()
      .then(rows => { if (!cancel) setMessages(rows); })
      .catch(reason => { if (!cancel) setError(messageOf(reason)); });
    return () => { cancel = true; };
  }, []);

  async function save(message: AdminContactMessage, status: MessageStatus) {
    setBusyId(message.id);
    setError('');
    try {
      await updateContactMessage(message.id, status);
      setMessages(current => current.map(item => item.id === message.id ? { ...item, status } : item));
      setNotice(`Message #${message.id} marked ${status}.`);
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      <AdminHeader title="Messages" text="Questions sent from the Contact Us form. New messages land here even if the visitor also opens WhatsApp." />
      {error && <AdminNotice>{error}</AdminNotice>}
      {notice && <AdminNotice tone="ok">{notice}</AdminNotice>}
      {messages.length === 0 ? (
        <AdminEmpty>No contact messages yet. When someone uses Send on WhatsApp or Send by Email on Contact Us, the message is stored here first.</AdminEmpty>
      ) : (
        <div className="admin-stack">
          {messages.map(message => (
            <article className="admin-panel" key={message.id}>
              <button type="button" className="admin-order-summary" onClick={() => setOpenId(openId === message.id ? null : message.id)}>
                <span><strong>#{message.id}</strong><small>{when(message.created_at)}</small></span>
                <span>{message.customer_name}</span>
                <span className={`admin-pill is-${message.status === 'new' ? 'pending' : message.status === 'replied' ? 'completed' : message.status === 'archived' ? 'cancelled' : 'confirmed'}`}>{message.status}</span>
                <span>{message.customer_phone || message.customer_email || 'No contact'}</span>
                <strong className="admin-muted">{message.message.slice(0, 48)}{message.message.length > 48 ? '…' : ''}</strong>
              </button>
              {openId === message.id && (
                <div className="admin-order-body">
                  <div className="admin-detail-grid">
                    <p><span>Name</span>{message.customer_name}</p>
                    <p><span>Phone</span>{message.customer_phone || 'Not provided'}</p>
                    <p><span>Email</span>{message.customer_email || 'Not provided'}</p>
                    <p><span>Received</span>{when(message.created_at)}</p>
                  </div>
                  <p className="admin-message-body">{message.message}</p>
                  <div className="admin-inline">
                    <label>Status
                      <select value={message.status} disabled={busyId === message.id} onChange={event => void save(message, event.target.value as MessageStatus)}>
                        {messageStatuses.map(status => <option key={status} value={status}>{status}</option>)}
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
