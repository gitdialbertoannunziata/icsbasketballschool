import { Link, useParams } from 'react-router-dom';
import { useContent } from '../../lib/hooks';
import { formatDate } from '../../lib/format';
import { RichText } from '../../components/RichText';
import { Container, ErrorState, Loading, Seo } from '../../components/public/ui';
import NotFound from './NotFound';

export default function NewsDetail() {
  const { slug } = useParams();
  const { data, isLoading, error } = useContent('news');
  if (isLoading) return <Loading />;
  if (error) return <ErrorState />;
  const item = data!.find((n) => n.slug === slug);
  if (!item) return <NotFound />;

  return (
    <article>
      <Seo title={item.title} description={item.excerpt} />
      <Container className="max-w-3xl py-16">
        <Link to="/news" className="text-sm font-semibold uppercase text-brand-light hover:underline">
          ← Tutte le news
        </Link>
        <time className="mt-6 block text-sm uppercase tracking-wide text-zinc-500">{formatDate(item.date)}</time>
        <h1 className="mt-2 font-display text-4xl uppercase tracking-wide sm:text-5xl">{item.title}</h1>
        {item.coverImage && <img src={item.coverImage} alt="" className="mt-8 w-full rounded-xl object-cover" />}
        <RichText html={item.bodyHtml} className="mt-8 text-lg text-zinc-200" />
      </Container>
    </article>
  );
}
