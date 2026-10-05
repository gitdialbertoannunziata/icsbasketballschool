import { Link } from 'react-router-dom';
import type { GalleryAlbum } from '@shared/types';
import { useContent } from '../../lib/hooks';
import { Container, ErrorState, Loading, PageHero, SectionTitle, Seo } from '../../components/public/ui';
import { AlbumGrid } from '../../components/public/AlbumGrid';

export function albumCover(a: GalleryAlbum) {
  return a.coverImage || a.items.find((i) => i.type === 'image')?.thumbUrl || a.items.find((i) => i.type === 'image')?.url;
}

export default function GalleryList() {
  const gallery = useContent('gallery');
  const events = useContent('events');
  if (gallery.isLoading) return <Loading />;
  if (gallery.error) return <ErrorState />;

  const evMap = new Map((events.data ?? []).map((e) => [e.id, e]));
  // Raggruppa per evento; gli album senza evento finiscono in "Altre foto".
  const groups = new Map<string, { title: string; slug?: string; year: number; albums: GalleryAlbum[] }>();
  for (const a of gallery.data!.filter((x) => x.items.length > 0)) {
    const ev = a.eventId ? evMap.get(a.eventId) : undefined;
    const key = ev?.id ?? '_altro';
    const year = a.year ?? (ev?.startDate ? Number(ev.startDate.slice(0, 4)) : 0);
    const g = groups.get(key) ?? { title: ev?.title ?? 'Altre foto', slug: ev?.slug, year, albums: [] };
    g.year = Math.max(g.year, year);
    g.albums.push(a);
    groups.set(key, g);
  }
  const sorted = [...groups.entries()].sort(([ka, a], [kb, b]) => (ka === '_altro' ? 1 : kb === '_altro' ? -1 : b.year - a.year));

  return (
    <>
      <Seo title="Galleria" description="Foto e video dei camp e degli eventi ICS Basketball School." />
      <PageHero title="Galleria" subtitle="Foto e video dai nostri camp ed eventi." />
      <Container className="space-y-20 py-16">
        {sorted.length === 0 && <p className="text-zinc-400">Nessuna foto disponibile.</p>}
        {sorted.map(([key, g]) => (
          <section key={key}>
            <SectionTitle kicker={g.year ? String(g.year) : undefined}>{g.title}</SectionTitle>
            {g.slug && evMap.get(key)?.status !== 'archived' && (
              <Link to={`/eventi/${g.slug}`} className="-mt-4 mb-6 inline-block text-sm font-semibold uppercase text-brand-light hover:underline">
                Vai all’evento →
              </Link>
            )}
            <div className="space-y-10">
              {g.albums.map((a) => {
                const photos = a.items.filter((i) => i.type === 'image').length;
                const videos = a.items.length - photos;
                // Il titolo dell'album è mostrato solo se l'evento ne ha più di uno o se è diverso dal titolo del gruppo.
                const showTitle = g.albums.length > 1 || a.title !== g.title;
                return (
                  <div key={a.id} id={a.id} className="scroll-mt-24">
                    <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      {showTitle && <h3 className="text-lg font-semibold">{a.title}</h3>}
                      <p className="text-xs uppercase tracking-wide text-zinc-500">
                        {photos} foto{videos > 0 && ` · ${videos} video`}
                        {a.credit && ` · foto di ${a.credit}`}
                      </p>
                    </div>
                    <AlbumGrid items={a.items} limit={12} />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </Container>
    </>
  );
}
