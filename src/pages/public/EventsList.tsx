import { useContent } from '../../lib/hooks';
import { Container, ErrorState, Loading, PageHero, SectionTitle, Seo } from '../../components/public/ui';
import { EventCard } from '../../components/public/cards';

export default function EventsList() {
  const { data, isLoading, error } = useContent('events');
  const sortDesc = (a: { startDate?: string }, b: { startDate?: string }) => (b.startDate ?? '').localeCompare(a.startDate ?? '');
  const active = (data ?? []).filter((e) => e.status === 'published').sort((a, b) => sortDesc(b, a));
  const past = (data ?? []).filter((e) => e.status === 'archived').sort(sortDesc);

  return (
    <>
      <Seo title="Eventi" description="Summer camp, progetti e attività della ICS Basketball School." />
      <PageHero title="Eventi" subtitle="Camp di specializzazione, progetti e attività per giovani cestisti." />
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState />
      ) : (
        <Container className="space-y-20 py-16">
          <section>
            <SectionTitle kicker="In programma">Prossimi eventi</SectionTitle>
            {active.length === 0 ? (
              <p className="text-zinc-400">Al momento non ci sono eventi in programma. Seguici sui social per le novità!</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {active.map((e) => (
                  <EventCard key={e.id} ev={e} />
                ))}
              </div>
            )}
          </section>
          {past.length > 0 && (
            <section>
              <SectionTitle kicker="Archivio">Eventi passati</SectionTitle>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {past.map((e) => (
                  <EventCard key={e.id} ev={e} />
                ))}
              </div>
            </section>
          )}
        </Container>
      )}
    </>
  );
}
