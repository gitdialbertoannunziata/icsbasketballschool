import { Link, useNavigate } from 'react-router-dom';
import type { EventItem } from '@shared/types';
import { useAdminDoc } from '../../lib/hooks';
import { formatDateRange, newId } from '../../lib/format';
import { AdminError, AdminLoading, Button, ConfirmButton, PageHeader } from '../../components/admin/fields';
import { useSaveFeedback } from '../../components/admin/useSave';

const STATUS: Record<EventItem['status'], { label: string; cls: string }> = {
  draft: { label: 'Bozza', cls: 'bg-amber-100 text-amber-800' },
  published: { label: 'Pubblicato', cls: 'bg-emerald-100 text-emerald-800' },
  archived: { label: 'Archiviato', cls: 'bg-zinc-200 text-zinc-700' },
};

export default function EventsAdmin() {
  const doc = useAdminDoc('events');
  const run = useSaveFeedback();
  const navigate = useNavigate();
  if (doc.isLoading) return <AdminLoading />;
  if (doc.error) return <AdminError error={doc.error} onRetry={doc.reload} />;
  const list = [...doc.data!].sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));

  async function duplicate(ev: EventItem) {
    const id = newId('evento');
    const copy: EventItem = {
      ...structuredClone(ev),
      id,
      slug: `${ev.slug}-copia-${id.slice(-4)}`,
      title: `${ev.title} (copia)`,
      status: 'draft',
      galleryAlbumIds: [],
      sessions: ev.sessions.map((s) => ({ ...s, id: newId('turno'), soldOut: false })),
    };
    const ok = await run(() => doc.save([...doc.data!, copy]), 'Evento duplicato come bozza');
    if (ok) navigate(`/admin/eventi/${id}`);
  }

  return (
    <>
      <PageHeader
        title="Eventi"
        description="Camp, progetti e attività. Ogni evento ha la sua pagina, il modulo di iscrizione, i documenti e le gallerie."
        actions={
          <Link to="/admin/eventi/nuovo" className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
            + Nuovo evento
          </Link>
        }
      />
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-zinc-200">
        {list.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">Nessun evento.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {list.map((ev) => (
              <li key={ev.id} className="flex flex-wrap items-center gap-4 p-4">
                {ev.coverImage || ev.poster ? (
                  <img src={ev.coverImage || ev.poster} alt="" className="h-14 w-20 shrink-0 rounded object-cover" />
                ) : (
                  <div className="h-14 w-20 shrink-0 rounded bg-zinc-100" />
                )}
                <Link to={`/admin/eventi/${ev.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-medium text-zinc-900 hover:text-brand-dark">{ev.title}</p>
                  <p className="text-xs text-zinc-500">
                    {formatDateRange(ev.startDate, ev.endDate) || 'Date da definire'}
                    {ev.registration.enabled && ' · iscrizioni attive'}
                    {ev.showInMenu && ' · nel menu'}
                  </p>
                </Link>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS[ev.status].cls}`}>{STATUS[ev.status].label}</span>
                <div className="flex gap-2">
                  <Link to={`/admin/eventi/${ev.id}`} className="rounded-md px-3 py-1.5 text-sm ring-1 ring-zinc-300 hover:bg-zinc-50">
                    Modifica
                  </Link>
                  <Link to={`/admin/iscrizioni?evento=${ev.id}`} className="rounded-md px-3 py-1.5 text-sm ring-1 ring-zinc-300 hover:bg-zinc-50">
                    Iscrizioni
                  </Link>
                  <Button size="sm" onClick={() => duplicate(ev)} title="Duplica (es. per l’edizione dell’anno successivo)">
                    Duplica
                  </Button>
                  <ConfirmButton
                    size="sm"
                    message={`Eliminare l’evento "${ev.title}"? Le iscrizioni ricevute resteranno archiviate.`}
                    onConfirm={() => run(() => doc.save(doc.data!.filter((x) => x.id !== ev.id)), 'Evento eliminato')}
                  >
                    Elimina
                  </ConfirmButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
