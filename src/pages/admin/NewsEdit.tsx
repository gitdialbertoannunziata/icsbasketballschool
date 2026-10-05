import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { NewsItem } from '@shared/types';
import { useAdminDoc, useDraft, useUnsavedWarning } from '../../lib/hooks';
import { newId, slugify, stripHtml } from '../../lib/format';
import { AdminError, AdminLoading, Button, Card, PageHeader, TextArea, TextInput, Toggle } from '../../components/admin/fields';
import { RichEditor } from '../../components/admin/RichEditor';
import { ImageInput } from '../../components/admin/MediaInputs';
import { useSaveFeedback } from '../../components/admin/useSave';

export default function NewsEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const doc = useAdminDoc('news');
  const run = useSaveFeedback();
  const isNew = id === 'nuova';

  const source = useMemo<NewsItem | undefined>(() => {
    if (!doc.data) return undefined;
    if (isNew) {
      return { id: newId('news'), slug: '', title: '', date: new Date().toISOString().slice(0, 10), excerpt: '', bodyHtml: '', published: true };
    }
    return doc.data.find((n) => n.id === id);
  }, [doc.data, id, isNew]);

  const { draft, update, dirty } = useDraft(source);
  useUnsavedWarning(dirty && !doc.saving);

  if (doc.isLoading) return <AdminLoading />;
  if (doc.error) return <AdminError error={doc.error} onRetry={doc.reload} />;
  if (!draft) return <p>News non trovata. <Link to="/admin/news" className="underline">Torna all’elenco</Link></p>;

  const set = <K extends keyof NewsItem>(k: K, v: NewsItem[K]) => update((d) => ({ ...d, [k]: v }));

  async function save() {
    const item: NewsItem = {
      ...draft!,
      slug: draft!.slug || slugify(draft!.title),
      excerpt: draft!.excerpt || stripHtml(draft!.bodyHtml).slice(0, 220),
    };
    if (!item.title.trim()) return alert('Inserisci un titolo');
    const list = doc.data!;
    const next = list.some((n) => n.id === item.id) ? list.map((n) => (n.id === item.id ? item : n)) : [item, ...list];
    const ok = await run(() => doc.save(next), 'News salvata');
    if (ok && isNew) navigate(`/admin/news/${item.id}`, { replace: true });
  }

  return (
    <>
      <PageHeader
        title={isNew ? 'Nuova news' : 'Modifica news'}
        actions={
          <>
            <Link to="/admin/news" className="rounded-md px-3.5 py-2 text-sm text-zinc-600 hover:bg-zinc-200/60">
              ← Elenco
            </Link>
            {!isNew && draft.published && (
              <a href={`/news/${draft.slug}`} target="_blank" rel="noopener" className="rounded-md px-3.5 py-2 text-sm ring-1 ring-zinc-300 hover:bg-white">
                Vedi sul sito ↗
              </a>
            )}
            <Button variant="primary" onClick={save} disabled={doc.saving}>
              {doc.saving ? 'Salvataggio…' : 'Salva'}
            </Button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <TextInput
            label="Titolo"
            value={draft.title}
            onChange={(v) => update((d) => ({ ...d, title: v, slug: isNew || !d.slug ? slugify(v) : d.slug }))}
          />
          <RichEditor label="Testo" value={draft.bodyHtml} onChange={(v) => set('bodyHtml', v)} />
          <TextArea
            label="Riassunto (facoltativo)"
            help="Mostrato nelle anteprime. Se vuoto viene generato dall’inizio del testo."
            value={draft.excerpt}
            onChange={(v) => set('excerpt', v)}
          />
        </Card>
        <div className="space-y-6">
          <Card title="Pubblicazione">
            <Toggle label="Pubblicata" help="Se disattivato la news resta in bozza e non è visibile." checked={draft.published} onChange={(v) => set('published', v)} />
            <TextInput label="Data" type="date" value={draft.date} onChange={(v) => set('date', v)} />
            <TextInput label="Indirizzo pagina" help={`/news/${draft.slug || '…'}`} value={draft.slug} onChange={(v) => set('slug', slugify(v))} />
          </Card>
          <Card title="Immagine di copertina">
            <ImageInput label="" value={draft.coverImage} onChange={(v) => set('coverImage', v)} />
          </Card>
        </div>
      </div>
    </>
  );
}
