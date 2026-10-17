import type { ReactNode } from 'react';

export function AdminHeader({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="admin-heading">
      <div>
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function AdminNotice({ tone = 'error', children }: { tone?: 'error' | 'ok'; children: ReactNode }) {
  return <p className={`admin-notice${tone === 'ok' ? ' is-ok' : ' is-error'}`}>{children}</p>;
}

export function AdminEmpty({ children }: { children: ReactNode }) {
  return <p className="admin-empty">{children}</p>;
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <article className="admin-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </article>
  );
}

export function when(value: string) {
  return new Date(value).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
}
