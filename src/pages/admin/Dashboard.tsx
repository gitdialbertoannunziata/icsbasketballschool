import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAdminDoc } from '../../lib/hooks';
import { formatDate } from '../../lib/format';
import { Card, PageHeader } from '../../components/admin/fields';

function Stat({ to, label, value, hint }: { to: string; label: string; value: number | string; hint?: string }) {
  return (
    <Link to={to} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 transition hover:ring-brand">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-zinc-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </Link>
  );
}

export default function Dashboard() {
  const news = useAdminDoc('news');
  const events = useAdminDoc('events');
  const staff = useAdminDoc('staff');
  const docs = useAdminDoc('documents');
  const gallery = useAdminDoc('gallery');
  const regs = useQuery({ queryKey: ['registrations', 'all'], queryFn: () => api.registrations() });

  const newRegs = regs.data?.registrations.filter((r) => r.status === 'nuova') ?? [];
  const activeEvents = events.data?.filter((e) => e.status === 'published') ?? [];

  return (
    <>
      <PageHeader title="Benvenuto 👋" description="Da qui puoi gestire tutti i contenuti del sito ICS Basketball School." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat to="/admin/iscrizioni" label="Nuove iscrizioni" value={newRegs.length} hint={`${regs.data?.registrations.length ?? 0} totali`} />
        <Stat to="/admin/eventi" label="Eventi attivi" value={activeEvents.length} hint={`${events.data?.length ?? 0} totali`} />
        <Stat to="/admin/news" label="News pubblicate" value={news.data?.filter((n) => n.published).length ?? 0} />
        <Stat
          to="/admin/galleria"
          label="Foto e video"
          value={gallery.data?.reduce((s, a) => s + a.items.length, 0) ?? 0}
          hint={`${gallery.data?.length ?? 0} album`}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card title="Azioni rapide">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ['/admin/news/nuova', '➕ Scrivi una news'],
              ['/admin/eventi/nuovo', '➕ Crea un evento'],
              ['/admin/galleria', '📷 Carica foto'],
              ['/admin/documenti', '📄 Carica un documento'],
              ['/admin/sito', '✏️ Modifica i testi'],
              ['/admin/staff', '👥 Gestisci lo staff'],
            ].map(([to, label]) => (
              <Link key={to} to={to} className="rounded-lg bg-zinc-50 px-4 py-3 text-sm font-medium ring-1 ring-zinc-200 hover:bg-brand/5 hover:ring-brand">
                {label}
              </Link>
            ))}
          </div>
        </Card>

        <Card title="Ultime iscrizioni" actions={<Link to="/admin/iscrizioni" className="text-sm text-brand-dark hover:underline">Vedi tutte</Link>}>
          {regs.isLoading ? (
            <p className="text-sm text-zinc-500">Caricamento…</p>
          ) : regs.data?.registrations.length ? (
            <ul className="divide-y divide-zinc-100 text-sm">
              {regs.data.registrations.slice(0, 6).map((r) => {
                const name = [r.values.nome, r.values.cognome].filter(Boolean).join(' ') || r.email || r.id;
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                    <span>
                      <span className="font-medium">{String(name)}</span>
                      <span className="block text-xs text-zinc-500">{r.eventTitle}</span>
                    </span>
                    <span className="text-right text-xs text-zinc-500">
                      {formatDate(r.createdAt, { day: '2-digit', month: 'short' })}
                      <span className={`ml-2 rounded-full px-2 py-0.5 ${r.status === 'nuova' ? 'bg-amber-100 text-amber-800' : 'bg-zinc-100'}`}>{r.status}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Nessuna iscrizione ancora.</p>
          )}
        </Card>

        <Card title="Contenuti">
          <ul className="space-y-1 text-sm text-zinc-600">
            <li>👥 {staff.data?.length ?? '–'} persone nello staff</li>
            <li>📄 {docs.data?.length ?? '–'} documenti ({docs.data?.filter((d) => d.public).length ?? '–'} pubblici)</li>
            <li>📰 {news.data?.length ?? '–'} news ({news.data?.filter((n) => !n.published).length ?? '–'} bozze)</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
