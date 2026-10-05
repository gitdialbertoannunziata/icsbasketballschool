import { useMemo, useState } from 'react';
import { useContent } from '../../lib/hooks';
import { formatBytes, formatDate } from '../../lib/format';
import { Container, ErrorState, Loading, PageHero, Seo } from '../../components/public/ui';

export default function DocumentsPage() {
  const docs = useContent('documents');
  const events = useContent('events');
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');

  const categories = useMemo(() => [...new Set((docs.data ?? []).map((d) => d.category))].sort(), [docs.data]);
  const evTitle = (id?: string) => events.data?.find((e) => e.id === id)?.title;

  if (docs.isLoading) return <Loading />;
  if (docs.error) return <ErrorState />;

  const filtered = docs
    .data!.filter((d) => !category || d.category === category)
    .filter((d) => !q || `${d.title} ${d.description ?? ''}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.category.localeCompare(b.category) || b.uploadedAt.localeCompare(a.uploadedAt));

  return (
    <>
      <Seo title="Documenti" description="Regolamenti, liberatorie, policy e moduli da scaricare." />
      <PageHero title="Documenti" subtitle="Regolamenti, liberatorie, policy e moduli da scaricare." />
      <Container className="py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2">
            {['', ...categories].map((c) => (
              <button
                key={c || 'all'}
                onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  category === c ? 'bg-brand text-white' : 'bg-coal text-zinc-300 ring-1 ring-white/10 hover:ring-brand/60'
                }`}
              >
                {c || 'Tutti'}
              </button>
            ))}
          </div>
          <input
            type="search"
            placeholder="Cerca…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="rounded-md border border-zinc-700 bg-coal px-3 py-2 sm:ml-auto sm:w-64"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-zinc-400">Nessun documento trovato.</p>
        ) : (
          <ul className="divide-y divide-white/5 overflow-hidden rounded-xl bg-coal ring-1 ring-white/5">
            {filtered.map((d) => {
              const ext = d.fileName.split('.').pop()?.toUpperCase() ?? 'FILE';
              return (
                <li key={d.id}>
                  <a href={d.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 p-5 transition hover:bg-white/5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand/20 text-xs font-bold text-brand-light">
                      {ext.slice(0, 4)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold group-hover:text-brand-light">{d.title}</span>
                      {d.description && <span className="block text-sm text-zinc-400">{d.description}</span>}
                      <span className="block text-xs uppercase tracking-wide text-zinc-500">
                        {d.category}
                        {evTitle(d.eventId) && ` · ${evTitle(d.eventId)}`}
                        {d.size ? ` · ${formatBytes(d.size)}` : ''} · {formatDate(d.uploadedAt)}
                      </span>
                    </span>
                    <span className="hidden text-sm font-semibold uppercase text-brand-light sm:block">Scarica ↓</span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </>
  );
}
