import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { useContent } from '../../lib/hooks';
import { Container } from './ui';
import { SocialIcons } from './SocialIcons';

const NAV = [
  { to: '/#chisiamo', label: 'Chi siamo' },
  { to: '/eventi', label: 'Eventi' },
  { to: '/news', label: 'News' },
  { to: '/galleria', label: 'Galleria' },
  { to: '/documenti', label: 'Documenti' },
  { to: '/#contatti', label: 'Contatti' },
];

function useHashScroll() {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (!hash) return;
    // Riprova per qualche istante: l'elemento può comparire solo dopo il caricamento dei contenuti.
    let tries = 0;
    const t = setInterval(() => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el || ++tries > 20) {
        clearInterval(t);
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
    return () => clearInterval(t);
  }, [hash, pathname]);
}

export default function PublicLayout() {
  const { data: site } = useContent('site');
  const { data: events } = useContent('events');
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useHashScroll();
  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  const featured = (events ?? []).filter((e) => e.status === 'published').slice(0, 2);
  const logo = site?.logo || '/logo.png';

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-ink/90 backdrop-blur">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="ICS Basketball School - Home">
            <img src={site?.logoWhite || "/logo-white.png"} alt="" className="h-10 w-10 object-contain" />
            <span className="font-display text-lg uppercase leading-none tracking-wider whitespace-nowrap">
              ICS <span className="text-brand-light">Basketball</span> School
            </span>
          </Link>
          <nav className="hidden items-center gap-5 whitespace-nowrap text-sm font-semibold uppercase tracking-wide lg:flex">
            {NAV.map((n) =>
              n.to.includes('#') ? (
                <Link key={n.to} to={n.to} className="transition hover:text-brand-light">
                  {n.label}
                </Link>
              ) : (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) => `transition hover:text-brand-light ${isActive ? 'text-brand-light' : ''}`}
                >
                  {n.label}
                </NavLink>
              ),
            )}
            {featured.map((e) => (
              <Link
                key={e.id}
                to={`/eventi/${e.slug}`}
                className="hidden rounded-md bg-brand px-3 py-2 text-white transition hover:bg-brand-light 2xl:inline-block"
              >
                {e.title}
              </Link>
            ))}
          </nav>
          <button
            className="rounded p-2 hover:bg-white/10 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </Container>
        {open && (
          <nav className="border-t border-white/5 bg-ink lg:hidden">
            <Container className="flex flex-col py-3 text-sm font-semibold uppercase tracking-wide">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} className="border-b border-white/5 py-3">
                  {n.label}
                </Link>
              ))}
              {featured.map((e) => (
                <Link key={e.id} to={`/eventi/${e.slug}`} className="py-3 text-brand-light">
                  {e.title}
                </Link>
              ))}
            </Container>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-white/5 bg-coal text-sm text-zinc-400">
        <Container className="grid gap-8 py-12 md:grid-cols-3">
          <div>
            <img src={site?.logoWhite || logo} alt="ICS Basketball School" className="mb-4 h-16 object-contain" />
            {site?.heroTagline && <p className="italic">“{site.heroTagline}”</p>}
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-zinc-200">{site?.legal.name}</p>
            {site?.legal.address && <p>Sede sociale: {site.legal.address}</p>}
            {site?.legal.taxCode && <p>P.IVA e C.F.: {site.legal.taxCode}</p>}
            {site?.contacts.email && (
              <p className="pt-2">
                <a href={`mailto:${site.contacts.email}`} className="hover:text-brand-light">
                  {site.contacts.email}
                </a>
              </p>
            )}
          </div>
          <div className="space-y-3 md:text-right">
            {site && <SocialIcons social={site.social} className="md:justify-end" />}
            <p className="space-x-4">
              <Link to="/privacy" className="hover:text-brand-light">
                Privacy
              </Link>
              <Link to="/cookie-policy" className="hover:text-brand-light">
                Cookie policy
              </Link>
              <Link to="/admin" className="hover:text-brand-light">
                Area riservata
              </Link>
            </p>
            <p>
              © {new Date().getFullYear()} {site?.legal.name}
            </p>
          </div>
        </Container>
      </footer>
      <ScrollRestoration />
    </div>
  );
}
