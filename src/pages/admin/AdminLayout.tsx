import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { LOGIN_URL, LOGOUT_URL } from '../../lib/api';
import { useAuthProviders, useMe } from '../../lib/hooks';
import { AdminLoading } from '../../components/admin/fields';

const NAV = [
  { to: '/admin', label: 'Panoramica', icon: '🏠', end: true },
  { to: '/admin/sito', label: 'Testi del sito', icon: '✏️' },
  { to: '/admin/news', label: 'News', icon: '📰' },
  { to: '/admin/eventi', label: 'Eventi', icon: '🏀' },
  { to: '/admin/iscrizioni', label: 'Iscrizioni', icon: '📝' },
  { to: '/admin/staff', label: 'Staff', icon: '👥' },
  { to: '/admin/documenti', label: 'Documenti', icon: '📄' },
  { to: '/admin/galleria', label: 'Galleria', icon: '📷' },
];

function Gate({ children }: { children: React.ReactNode }) {
  const { data: me, isLoading } = useMe();
  const { data: providers = ['aad'] } = useAuthProviders();
  const location = useLocation();
  if (isLoading) return <AdminLoading />;
  const redirect = location.pathname + location.search;

  if (!me) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg ring-1 ring-zinc-200">
          <img src="/logo.png" alt="" className="mx-auto h-16" />
          <h1 className="mt-4 text-xl font-bold text-zinc-900">Area riservata</h1>
          <p className="mt-2 text-sm text-zinc-500">Accedi con il tuo account autorizzato per gestire il sito.</p>
          <a
            href={LOGIN_URL(redirect, 'aad')}
            className="mt-6 flex items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 font-medium text-zinc-800 shadow ring-1 ring-zinc-300 hover:bg-zinc-50"
          >
            <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden>
              <path fill="#F25022" d="M1 1h9v9H1z" />
              <path fill="#7FBA00" d="M11 1h9v9h-9z" />
              <path fill="#00A4EF" d="M1 11h9v9H1z" />
              <path fill="#FFB900" d="M11 11h9v9h-9z" />
            </svg>
            Accedi con Microsoft
          </a>
          {providers.includes('google') && (
          <a
            href={LOGIN_URL(redirect, 'google')}
            className="mt-3 flex items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 font-medium text-zinc-800 shadow ring-1 ring-zinc-300 hover:bg-zinc-50"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
            </svg>
            Accedi con Google
          </a>
          )}
          <Link to="/" className="mt-6 inline-block text-sm text-zinc-500 hover:text-zinc-800">
            ← Torna al sito
          </Link>
        </div>
      </div>
    );
  }

  if (!me.userRoles.includes('admin')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg ring-1 ring-zinc-200">
          <h1 className="text-xl font-bold text-zinc-900">Accesso non autorizzato</h1>
          <p className="mt-2 text-sm text-zinc-500">
            L’account <strong>{me.userDetails}</strong> non è abilitato alla gestione del sito. Chiedi a un amministratore di aggiungerti.
          </p>
          <a href={LOGOUT_URL} className="mt-6 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
            Esci e cambia account
          </a>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export default function AdminLayout() {
  const { data: me } = useMe();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="admin-scope min-h-screen">
      <title>Gestione sito | ICS Basketball School</title>
      <meta name="robots" content="noindex" />
      <Gate>
        <div className="flex min-h-screen">
          <aside
            className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-ink text-zinc-200 transition lg:static lg:translate-x-0 ${
              open ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
              <img src="/logo-white.png" alt="" className="h-9 w-9 object-contain" />
              <div className="leading-tight">
                <p className="font-display uppercase tracking-wide">ICS Basketball</p>
                <p className="text-xs text-zinc-400">Gestione sito</p>
              </div>
            </div>
            <nav className="space-y-1 p-3">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive ? 'bg-brand text-white' : 'hover:bg-white/10'
                    }`
                  }
                >
                  <span aria-hidden>{n.icon}</span>
                  {n.label}
                </NavLink>
              ))}
            </nav>
            <div className="absolute inset-x-0 bottom-0 space-y-2 border-t border-white/10 p-4 text-xs">
              <a href="/" target="_blank" rel="noopener" className="block text-zinc-300 hover:text-white">
                ↗ Vedi il sito
              </a>
              <p className="truncate text-zinc-500" title={me?.userDetails}>
                {me?.userDetails}
              </p>
              <a href={LOGOUT_URL} className="block text-zinc-300 hover:text-white">
                Esci
              </a>
            </div>
          </aside>
          {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-14 items-center gap-3 border-b border-zinc-200 bg-white px-4 lg:hidden">
              <button onClick={() => setOpen(true)} className="rounded p-2 hover:bg-zinc-100" aria-label="Apri menu">
                ☰
              </button>
              <span className="font-semibold">Gestione sito</span>
            </header>
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8">
              <Outlet />
            </main>
          </div>
        </div>
      </Gate>
    </div>
  );
}
