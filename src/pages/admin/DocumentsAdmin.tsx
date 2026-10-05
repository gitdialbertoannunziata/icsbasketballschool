import { useState } from 'react';
import type { DocumentItem } from '@shared/types';
import { api } from '../../lib/api';
import { useAdminDoc, useDraft, useUnsavedWarning } from '../../lib/hooks';
import { formatBytes, formatDate, newId } from '../../lib/format';
import { uploadBlob } from '../../lib/upload';
import { AdminError, AdminLoading, Card, ConfirmButton, PageHeader, SaveBar, inputCls } from '../../components/admin/fields';
import { DropZone, ProgressBar } from '../../components/admin/MediaInputs';
import { useSaveFeedback } from '../../components/admin/useSave';
import { useToast } from '../../components/Toast';

const DEFAULT_CATEGORIES = ['Regolamenti', 'Liberatorie', 'Moduli', 'Safeguarding', 'Assemblee', 'Altro'];

export default function DocumentsAdmin() {
  const doc = useAdminDoc('documents');
  const events = useAdminDoc('events');
  const { draft, setDraft, dirty, reset } = useDraft(doc.data);
  const [progress, setProgress] = useState<number | null>(null);
  const [filter, setFilter] = useState('');
  const run = useSaveFeedback();
  const toast = useToast();
  useUnsavedWarning(dirty);

  if (doc.isLoading) return <AdminLoading />;
  if (doc.error) return <AdminError error={doc.error} onRetry={doc.reload} />;
  if (!draft) return null;

  const categories = [...new Set([...DEFAULT_CATEGORIES, ...draft.map((d) => d.category)])];
  const setItem = (id: string, patch: Partial<DocumentItem>) => setDraft(draft.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  async function onFiles(files: File[]) {
    const added: DocumentItem[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setProgress(0);
        const url = await uploadBlob(f, f.name, 'docs', (p) => setProgress((i + p) / files.length));
        added.push({
          id: newId('doc'),
          title: f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
          category: filter || 'Altro',
          url,
          fileName: f.name,
          size: f.size,
          uploadedAt: new Date().toISOString(),
          public: true,
        });
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Caricamento non riuscito', 'error');
    } finally {
      setProgress(null);
    }
    if (added.length) {
      await run(() => doc.save([...added, ...draft!]), `${added.length} documento/i caricato/i: ora puoi modificarne titolo e categoria`);
    }
  }

  async function remove(d: DocumentItem) {
    const ok = await run(() => doc.save(draft!.filter((x) => x.id !== d.id)), 'Documento eliminato');
    if (ok) api.deleteMedia(d.url).catch(() => {});
  }

  const shown = draft.filter((d) => !filter || d.category === filter);

  return (
    <>
      <PageHeader title="Documenti" description="PDF e moduli scaricabili dalla pagina Documenti, dagli eventi e dalla sezione Safeguarding." />
      <Card>
        <DropZone accept=".pdf,.doc,.docx,.xls,.xlsx,image/*" multiple onFiles={onFiles} disabled={progress !== null}>
          {progress !== null ? (
            <div className="w-full max-w-sm space-y-2">
              <span>Caricamento…</span>
              <ProgressBar value={progress} />
            </div>
          ) : (
            <>
              <span className="text-2xl">📄</span>
              <span className="mt-1 font-medium text-zinc-700">Trascina qui i file o clicca per sceglierli</span>
              <span className="text-xs text-zinc-500">PDF, Word, Excel o immagini{filter && ` · categoria «${filter}»`}</span>
            </>
          )}
        </DropZone>
      </Card>

      <div className="my-4 flex flex-wrap gap-2">
        {['', ...categories].map((c) => (
          <button
            key={c || 'all'}
            onClick={() => setFilter(c)}
            className={`rounded-full px-3 py-1 text-sm ${filter === c ? 'bg-zinc-900 text-white' : 'bg-white ring-1 ring-zinc-300 hover:bg-zinc-50'}`}
          >
            {c || 'Tutti'} ({c ? draft.filter((d) => d.category === c).length : draft.length})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {shown.length === 0 && <p className="text-sm text-zinc-500">Nessun documento.</p>}
        {shown.map((d) => (
          <div key={d.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
            <div className="grid gap-3 lg:grid-cols-[1fr_180px_220px]">
              <input className={inputCls} value={d.title} onChange={(e) => setItem(d.id, { title: e.target.value })} aria-label="Titolo" />
              <input
                className={inputCls}
                list="doc-categories"
                value={d.category}
                onChange={(e) => setItem(d.id, { category: e.target.value })}
                aria-label="Categoria"
              />
              <select className={inputCls} value={d.eventId ?? ''} onChange={(e) => setItem(d.id, { eventId: e.target.value || undefined })} aria-label="Evento">
                <option value="">Nessun evento</option>
                {(events.data ?? []).map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </div>
            <input
              className={`${inputCls} mt-3`}
              placeholder="Descrizione (facoltativa)"
              value={d.description ?? ''}
              onChange={(e) => setItem(d.id, { description: e.target.value || undefined })}
            />
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
              <a href={d.url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-dark hover:underline">
                {d.fileName}
              </a>
              <span>{formatBytes(d.size)}</span>
              <span>{formatDate(d.uploadedAt)}</span>
              <label className="flex items-center gap-1.5 text-sm text-zinc-700">
                <input type="checkbox" checked={d.public} onChange={(e) => setItem(d.id, { public: e.target.checked })} className="accent-[#c05c03]" />
                Visibile sul sito
              </label>
              <span className="ml-auto">
                <ConfirmButton size="sm" message={`Eliminare definitivamente "${d.title}"?`} onConfirm={() => remove(d)}>
                  Elimina
                </ConfirmButton>
              </span>
            </div>
          </div>
        ))}
      </div>
      <datalist id="doc-categories">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <SaveBar dirty={dirty} saving={doc.saving} onReset={reset} onSave={() => run(() => doc.save(draft))} />
    </>
  );
}
