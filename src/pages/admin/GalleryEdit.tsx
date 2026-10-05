import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { GalleryAlbum, GalleryMedia } from '@shared/types';
import { api } from '../../lib/api';
import { useAdminDoc, useDraft, useUnsavedWarning } from '../../lib/hooks';
import { newId, youtubeId } from '../../lib/format';
import {
  AdminError,
  AdminLoading,
  Button,
  Card,
  ConfirmButton,
  NumberInput,
  PageHeader,
  SaveBar,
  SelectInput,
  TextInput,
  Toggle,
  inputCls,
} from '../../components/admin/fields';
import { DropZone, ProgressBar, useGalleryUploader } from '../../components/admin/MediaInputs';
import { useSaveFeedback } from '../../components/admin/useSave';
import { useToast } from '../../components/Toast';

export default function GalleryEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const doc = useAdminDoc('gallery');
  const events = useAdminDoc('events');
  const run = useSaveFeedback();
  const toast = useToast();
  const source = useMemo(() => doc.data?.find((a) => a.id === id), [doc.data, id]);
  const { draft, setDraft, update, dirty, reset } = useDraft(source);
  const uploader = useGalleryUploader(`gallery/${id}`);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [yt, setYt] = useState('');
  // Elementi rimossi in attesa di salvataggio: i file vengono cancellati dallo storage solo dopo il salvataggio.
  const pendingDeletes = useRef<GalleryMedia[]>([]);
  useUnsavedWarning(dirty || uploader.busy);

  if (doc.isLoading) return <AdminLoading />;
  if (doc.error) return <AdminError error={doc.error} onRetry={doc.reload} />;
  if (!draft) return <p>Album non trovato. <Link to="/admin/galleria" className="underline">Torna alla galleria</Link></p>;

  const saveAlbum = (album: GalleryAlbum, msg?: string) =>
    run(() => doc.save(doc.data!.map((a) => (a.id === album.id ? album : a))), msg);

  const set = <K extends keyof GalleryAlbum>(k: K, v: GalleryAlbum[K]) => update((d) => ({ ...d, [k]: v }));
  const setItem = (itemId: string, patch: Partial<GalleryMedia>) => set('items', draft.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)));

  async function onFiles(files: File[]) {
    const added: GalleryMedia[] = [];
    await uploader.upload(files, (r) => added.push({ id: newId('m'), type: r.type, url: r.url, thumbUrl: r.thumbUrl, width: r.width, height: r.height }));
    if (!added.length) return;
    // Salviamo subito: i file sono già sullo storage.
    const next = { ...draft!, items: [...draft!.items, ...added] };
    setDraft(next);
    await saveAlbum(next, `${added.length} elementi aggiunti`);
  }

  function addYoutube() {
    if (!youtubeId(yt)) return toast('Link YouTube non valido', 'error');
    set('items', [...draft!.items, { id: newId('m'), type: 'video', url: yt.trim() }]);
    setYt('');
  }

  function drop(target: number) {
    if (dragIndex === null || dragIndex === target) return;
    const items = [...draft!.items];
    const [moved] = items.splice(dragIndex, 1);
    items.splice(target, 0, moved);
    set('items', items);
    setDragIndex(null);
  }

  async function deleteAlbum() {
    const ok = await run(() => doc.save(doc.data!.filter((a) => a.id !== draft!.id)), 'Album eliminato');
    if (ok) {
      for (const i of draft!.items) {
        api.deleteMedia(i.url).catch(() => {});
        if (i.thumbUrl) api.deleteMedia(i.thumbUrl).catch(() => {});
      }
      navigate('/admin/galleria');
    }
  }

  function removeItem(item: GalleryMedia) {
    set('items', draft!.items.filter((i) => i.id !== item.id));
    pendingDeletes.current.push(item);
  }

  async function save() {
    const ok = await saveAlbum(draft!);
    if (ok) {
      const stillUsed = new Set(draft!.items.flatMap((i) => [i.url, i.thumbUrl]));
      for (const i of pendingDeletes.current) {
        if (!stillUsed.has(i.url)) api.deleteMedia(i.url).catch(() => {});
        if (i.thumbUrl && !stillUsed.has(i.thumbUrl)) api.deleteMedia(i.thumbUrl).catch(() => {});
      }
      pendingDeletes.current = [];
    }
  }

  return (
    <>
      <PageHeader
        title={draft.title}
        description={`${draft.items.length} elementi · trascina le foto per riordinarle`}
        actions={
          <>
            <Link to="/admin/galleria" className="rounded-md px-3.5 py-2 text-sm text-zinc-600 hover:bg-zinc-200/60">
              ← Galleria
            </Link>
            <a href={`/galleria#${draft.id}`} target="_blank" rel="noopener" className="rounded-md px-3.5 py-2 text-sm ring-1 ring-zinc-300 hover:bg-white">
              Vedi sul sito ↗
            </a>
          </>
        }
      />
      <div className="space-y-6">
        <Card title="Dettagli album">
          <div className="grid gap-4 sm:grid-cols-[1fr_240px_120px]">
            <TextInput label="Titolo" value={draft.title} onChange={(v) => set('title', v)} />
            <SelectInput
              label="Evento"
              value={draft.eventId ?? ''}
              onChange={(v) => set('eventId', v || undefined)}
              options={[{ value: '', label: 'Nessun evento' }, ...(events.data ?? []).map((e) => ({ value: e.id, label: e.title }))]}
            />
            <NumberInput label="Anno" value={draft.year} onChange={(v) => set('year', v)} />
          </div>
          <div className="grid items-end gap-4 sm:grid-cols-2">
            <TextInput label="Crediti fotografici" placeholder="es. Cristiana Castano" value={draft.credit} onChange={(v) => set('credit', v || undefined)} />
            <Toggle label="Visibile sul sito" checked={draft.published} onChange={(v) => set('published', v)} />
          </div>
        </Card>

        <Card title="Aggiungi foto e video">
          <DropZone accept="image/*,video/mp4,video/webm,video/quicktime" multiple onFiles={onFiles} disabled={uploader.busy}>
            <span className="text-2xl">📷</span>
            <span className="mt-1 font-medium text-zinc-700">Trascina qui foto e video, o clicca per sceglierli</span>
            <span className="text-xs text-zinc-500">Puoi selezionare molti file insieme. Le foto vengono ottimizzate automaticamente.</span>
          </DropZone>
          {uploader.busy && (
            <div className="space-y-2">
              {uploader.queue.map((q, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="w-48 truncate">{q.name}</span>
                  <ProgressBar value={q.progress} />
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input className={inputCls} placeholder="Oppure incolla un link YouTube" value={yt} onChange={(e) => setYt(e.target.value)} />
            <Button onClick={addYoutube} disabled={!yt}>
              Aggiungi video
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {draft.items.map((item, i) => {
            const yid = item.type === 'video' ? youtubeId(item.url) : undefined;
            const isCover = draft.coverImage && (draft.coverImage === item.thumbUrl || draft.coverImage === item.url);
            return (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => drop(i)}
                className={`group overflow-hidden rounded-lg bg-white shadow-sm ring-1 ${dragIndex === i ? 'opacity-50 ring-brand' : 'ring-zinc-200'} ${isCover ? 'ring-2 ring-brand' : ''}`}
              >
                <div className="relative aspect-square cursor-move bg-zinc-100">
                  {item.type === 'image' ? (
                    <img src={item.thumbUrl || item.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : yid ? (
                    <img src={`https://i.ytimg.com/vi/${yid}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <video src={`${item.url}#t=0.5`} preload="metadata" muted className="h-full w-full object-cover" />
                  )}
                  {item.type === 'video' && <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 text-[10px] text-white">VIDEO</span>}
                  {isCover && <span className="absolute right-1 top-1 rounded bg-brand px-1.5 text-[10px] text-white">COPERTINA</span>}
                </div>
                <div className="space-y-1 p-2">
                  <input
                    className="w-full rounded border border-zinc-200 px-2 py-1 text-xs"
                    placeholder="Didascalia"
                    value={item.caption ?? ''}
                    onChange={(e) => setItem(item.id, { caption: e.target.value || undefined })}
                  />
                  <div className="flex justify-between">
                    {item.type === 'image' && !isCover ? (
                      <button className="text-[11px] text-zinc-500 hover:text-brand-dark" onClick={() => set('coverImage', item.thumbUrl || item.url)}>
                        Usa come copertina
                      </button>
                    ) : (
                      <span />
                    )}
                    <button className="text-[11px] text-red-500 hover:underline" onClick={() => removeItem(item)}>
                      Elimina
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-zinc-200 pt-6 text-right">
          <ConfirmButton message={`Eliminare l’album "${draft.title}" e tutte le sue foto? L’operazione non è reversibile.`} onConfirm={deleteAlbum}>
            Elimina album
          </ConfirmButton>
        </div>
      </div>
      <SaveBar
        dirty={dirty}
        saving={doc.saving}
        onReset={() => {
          pendingDeletes.current = [];
          reset();
        }}
        onSave={save}
      />
    </>
  );
}

