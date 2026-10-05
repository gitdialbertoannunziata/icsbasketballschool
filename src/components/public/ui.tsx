import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function SectionTitle({ children, kicker, id }: { children: ReactNode; kicker?: string; id?: string }) {
  return (
    <div id={id} className="mb-8 scroll-mt-24">
      {kicker && <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand-light">{kicker}</p>}
      <h2 className="font-display text-3xl uppercase tracking-wide sm:text-4xl">{children}</h2>
      <div className="mt-3 h-1 w-16 bg-brand" />
    </div>
  );
}

export function PageHero({ title, subtitle, image }: { title: string; subtitle?: ReactNode; image?: string }) {
  return (
    <section className="relative overflow-hidden bg-coal">
      {image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />}
      <div className="absolute inset-0 bg-gradient-to-b from-brand/30 to-ink/90" />
      <Container className="relative py-16 sm:py-24">
        <h1 className="font-display text-4xl uppercase tracking-wide sm:text-6xl">{title}</h1>
        {subtitle && <div className="mt-4 max-w-2xl text-lg text-zinc-300">{subtitle}</div>}
      </Container>
    </section>
  );
}

export function Loading() {
  return (
    <div className="flex justify-center py-24" aria-label="Caricamento">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
    </div>
  );
}

export function ErrorState({ message = 'Impossibile caricare i contenuti. Riprova più tardi.' }: { message?: string }) {
  return (
    <Container className="py-24 text-center text-zinc-400">
      <p>{message}</p>
    </Container>
  );
}

export function ButtonLink({
  to,
  children,
  variant = 'primary',
}: {
  to: string;
  children: ReactNode;
  variant?: 'primary' | 'ghost';
}) {
  const cls =
    variant === 'primary'
      ? 'bg-brand hover:bg-brand-light text-white'
      : 'border border-zinc-600 hover:border-brand hover:text-brand-light text-zinc-100';
  const className = `inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold uppercase tracking-wide transition ${cls}`;
  if (/^(https?:|mailto:)/.test(to) || /\.(pdf|jpe?g|png|webp)$/i.test(to)) {
    return (
      <a href={to} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
}

export function Badge({ children, tone = 'brand' }: { children: ReactNode; tone?: 'brand' | 'red' | 'zinc' | 'green' }) {
  const tones = {
    brand: 'bg-brand/20 text-brand-light ring-brand/40',
    red: 'bg-red-500/15 text-red-300 ring-red-500/40',
    zinc: 'bg-zinc-500/15 text-zinc-300 ring-zinc-500/40',
    green: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Imposta titolo e descrizione della pagina (React 19 sposta <title>/<meta> nell'head). */
export function Seo({ title, description }: { title?: string; description?: string }) {
  const full = title ? `${title} | ICS Basketball School` : 'ICS Basketball School';
  return (
    <>
      <title>{full}</title>
      {description && <meta name="description" content={description} />}
    </>
  );
}
