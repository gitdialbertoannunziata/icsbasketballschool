import { useContent } from '../../lib/hooks';
import { Container, ErrorState, Loading, PageHero, Seo } from '../../components/public/ui';
import { NewsCard } from '../../components/public/cards';

export default function NewsList() {
  const { data, isLoading, error } = useContent('news');
  return (
    <>
      <Seo title="News" />
      <PageHero title="News" subtitle="Novità, staff e comunicazioni della ICS Basketball School." />
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState />
      ) : (
        <Container className="py-16">
          {data!.length === 0 ? (
            <p className="text-zinc-400">Nessuna news pubblicata.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data!.map((n) => (
                <NewsCard key={n.id} item={n} />
              ))}
            </div>
          )}
        </Container>
      )}
    </>
  );
}
