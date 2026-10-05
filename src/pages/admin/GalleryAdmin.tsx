import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { GalleryAlbum } from '@shared/types';
import { useAdminDoc } from '../../lib/hooks';
import { newId } from '../../lib/format';
import { AdminError, AdminLoading, Button, Card, PageHeader, SelectInput, TextInput } from '../../components/admin/fields';
import { useSaveFeedback } from '../../components/admin/useSave';
import { albumCover } from '../public/GalleryList';

export default function GalleryAdmin() {
  const doc = useAdminDoc('gallery');
  const events = useAdminDoc('events');
  const run = useSaveFeedback();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [eventId, setEventId] = useState('');

  if (doc.isLoading) return <AdminLoading />;
  if (doc.error) return <AdminError error={doc.error} onRetry={doc.reload} />;

  const evTitle = (id?: string) => events.data?.find((e) => e.id === id)?.title;

  async function create() {
    if (!title.trim()) return;
    const ev = events.data?.find((e) => e.id === eventId);
    const album: GalleryAlbum = {
      id: newId('album'),
      title: title.trim(),
      eventId: eventId || undefined,
      year: ev?.startDate ? Number(ev.startDate.slice(0, 4)) : new Date().getFullYear(),
      published: true,
      items: [],
    };
    const ok = await run(() => doc.save([album, ...doc.data!]), 'Album creato: ora carica le foto');
    if (ok) navigate(`/admin/galleria/${album.id}`);
  }

  // Raggruppa per evento come nella galleria pubblica.
  const groups = new Map<string, GalleryAlbum[]>();
  for (const a of doc.data!) {
    const k = a.eventId ?? '';
    groups.set(k, [...(groups.get(k) ?? []), a]);
  }

  return (
    <>
      <PageHeader title="Galleria" description="Gli album sono collegati a un evento: compaiono nella Galleria e nella pagina dell’evento." />
      <Card title="Nuovo album">
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_260px_auto]">
          <TextInput label="Titolo" placeholder="es. Summer Camp 2026 – settimana 1" value={title} onChange={setTitle} />
          <SelectInput
            label="Evento"
            value={eventId}
            onChange={setEventId}
            options={[{ value: '', label: 'Nessun evento' }, ...(events.data ?? []).map((e) => ({ value: e.id, label: e.title }))]}
          />
          <Button variant="primary" onClick={create} disabled={!title.trim() || doc.saving}>
            Crea album
          </Button>
        </div>
      </Card>

      <div className="mt-8 space-y-8">
        {[...groups.entries()].map(([k, albums]) => (
          <section key={k}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">{k ? evTitle(k) ?? 'Evento eliminato' : 'Senza evento'}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {albums.map((a) => {
                const cover = albumCover(a);
                return (
                  <Link key={a.id} to={`/admin/galleria/${a.id}`} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-zinc-200 hover:ring-brand">
                    <div className="aspect-[4/3] bg-zinc-100">{cover && <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />}</div>
                    <div className="p-3">
                      <p className="truncate font-medium">{a.title}</p>
                      <p className="text-xs text-zinc-500">
                        {a.items.length} elementi {!a.published && <span className="text-amber-600">· nascosto</span>}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
