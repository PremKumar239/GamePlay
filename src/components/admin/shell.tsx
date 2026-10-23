import { Link, useRouterState } from '@tanstack/react-router';
import { ArrowLeft, Folders, LayoutDashboard, LineChart, LogOut, Menu, MessageSquareText, Package, Percent, Settings, ShoppingBag, Warehouse, X } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/products', label: 'Products', icon: Package, exact: false },
  { to: '/admin/categories', label: 'Categories', icon: Folders, exact: false },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, exact: false },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquareText, exact: false },
  { to: '/admin/sales', label: 'Sales', icon: LineChart, exact: false },
  { to: '/admin/tax', label: 'Tax', icon: Percent, exact: false },
  { to: '/admin/inventory', label: 'Inventory', icon: Warehouse, exact: false },
  { to: '/admin/settings', label: 'Settings', icon: Settings, exact: false },
] as const;

type Gate = 'loading' | 'setup' | 'login' | 'denied' | 'ready';

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: state => state.location.pathname });
  const [gate, setGate] = useState<Gate>('loading');
  const [notice, setNotice] = useState('');
  const [email, setEmail] = useState('');
  const [account, setAccount] = useState('');
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setGate('setup');
      return;
    }
    let active = true;
    let acceptSession = false;
    const client = supabase;

    async function applySession() {
      const { data: { session } } = await client.auth.getSession();
      if (!active || !acceptSession) return;
      if (!session) {
        setGate('login');
        setAccount('');
        return;
      }
      const { data: profile, error } = await client.from('profiles').select('role,email').eq('id', session.user.id).maybeSingle();
      if (!active) return;
      if (error) {
        setNotice(error.message);
        setGate('setup');
        return;
      }
      if (profile?.role !== 'admin') {
        setAccount(profile?.email || session.user.email || '');
        setGate('denied');
        return;
      }
      setAccount(profile.email || session.user.email || '');
      setGate('ready');
    }

    async function boot() {
      // Always clear any saved session so opening /admin asks for email and password.
      await client.auth.signOut();
      if (!active) return;
      acceptSession = true;
      setGate('login');
      setAccount('');
    }

    void boot();
    const { data: subscription } = client.auth.onAuthStateChange(() => { void applySession(); });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase?.auth.signOut();
    setNavOpen(false);
  }

  if (gate === 'loading') {
    return <section className="admin-gate"><p>Checking access…</p></section>;
  }
  if (gate === 'setup') {
    return (
      <section className="admin-gate">
        <form className="admin-card">
          <p className="admin-kicker">GAME PLAY</p>
          <h1>Admin setup needed</h1>
          <p>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env</code>, then run the admin SQL in the Supabase SQL editor.</p>
          {notice && <p className="admin-notice is-error">{notice}</p>}
        </form>
      </section>
    );
  }
  if (gate === 'login') return <Login onError={setNotice} notice={notice} />;
  if (gate === 'denied') {
    return (
      <section className="admin-gate">
        <div className="admin-card">
          <p className="admin-kicker">GAME PLAY</p>
          <h1>This account is not an admin</h1>
          <p>{account || 'This user'} can sign in, but only a profile with the admin role can open the panel. Promote the user from the Supabase SQL editor, then sign in again.</p>
          <button type="button" className="admin-button" onClick={signOut}>Sign out</button>
          <Link className="admin-side-link" to="/"><ArrowLeft size={15} /> Back to website</Link>
        </div>
      </section>
    );
  }

  return (
    <div className={`admin-app${navOpen ? ' is-nav-open' : ''}`}>
      {navOpen && <button type="button" className="admin-backdrop" aria-label="Close menu" onClick={() => setNavOpen(false)} />}
      <aside className="admin-side">
        <div className="admin-brand">
          <Link to="/">GAME PLAY</Link>
          <button type="button" className="admin-menu" aria-label="Close menu" onClick={() => setNavOpen(false)}><X size={18} /></button>
        </div>
        <nav className="admin-nav" aria-label="Admin">
          {links.map(link => {
            const Icon = link.icon;
            const active = link.exact ? pathname === '/admin' || pathname === '/admin/' : pathname.startsWith(link.to);
            return (
              <Link key={link.to} to={link.to} className={active ? 'is-active' : ''} onClick={() => setNavOpen(false)}>
                <Icon size={16} /> {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="admin-side-foot">
          <span>{account}</span>
          <Link className="admin-side-link" to="/" onClick={() => setNavOpen(false)}><ArrowLeft size={15} /> Back to website</Link>
          <button type="button" onClick={signOut}><LogOut size={15} /> Log out</button>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-top">
          <button type="button" className="admin-menu" aria-label="Open menu" onClick={() => setNavOpen(true)}><Menu size={18} /></button>
          <Link to="/">View store</Link>
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}

function Login({ notice, onError }: { notice: string; onError: (value: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    onError('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) onError(error.message);
  }

  return (
    <section className="admin-gate">
      <form className="admin-card" onSubmit={submit}>
        <p className="admin-kicker">GAME PLAY</p>
        <h1>Admin sign in</h1>
        <p>Enter your email and password each time you open the admin panel.</p>
        <label>Email<input type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></label>
        {notice && <p className="admin-notice is-error">{notice}</p>}
        <button className="admin-button" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <Link className="admin-side-link" to="/"><ArrowLeft size={15} /> Back to website</Link>
      </form>
    </section>
  );
}
