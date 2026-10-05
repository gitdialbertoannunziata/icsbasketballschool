import { Link } from 'react-router-dom';
import { useAdminDoc } from '../../lib/hooks';
import { formatDate } from '../../lib/format';
import { AdminError, AdminLoading, ConfirmButton, PageHeader } from '../../components/admin/fields';
import { useSaveFeedback } from '../../components/admin/useSave';

export default function NewsAdmin() {
  const doc = useAdminDoc('news');
  const run = useSaveFeedback();
  if (doc.isLoading) return <AdminLoading />;
  if (doc.error) return <AdminError error={doc.error} onRetry={doc.reload} />;
  const list = [...(doc.data ?? [])].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <PageHeader
        title="News"
        description="Articoli e comunicazioni mostrati in home e nella pagina News."
        actions={
          <Link to="/admin/news/nuova" className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
            + Nuova news
          </Link>
        }
      />
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-zinc-200">
        {list.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">Nessuna news. Crea la prima!</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {list.map((n) => (
              <li key={n.id} className="flex items-center gap-4 p-4">
                {n.coverImage ? (
                  <img src={n.coverImage} alt="" className="h-14 w-20 shrink-0 rounded object-cover" />
                ) : (
                  <div className="h-14 w-20 shrink-0 rounded bg-zinc-100" />
                )}
                <Link to={`/admin/news/${n.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-medium text-zinc-900 hover:text-brand-dark">{n.title}</p>
                  <p className="text-xs text-zinc-500">
                    {formatDate(n.date)} ·{' '}
                    {n.published ? <span className="text-emerald-600">Pubblicata</span> : <span className="text-amber-600">Bozza</span>}
                  </p>
                </Link>
                <Link to={`/admin/news/${n.id}`} className="rounded-md px-3 py-1.5 text-sm ring-1 ring-zinc-300 hover:bg-zinc-50">
                  Modifica
                </Link>
                <ConfirmButton
                  size="sm"
                  message={`Eliminare la news "${n.title}"?`}
                  onConfirm={() => run(() => doc.save(doc.data!.filter((x) => x.id !== n.id)), 'News eliminata')}
                >
                  Elimina
                </ConfirmButton>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
