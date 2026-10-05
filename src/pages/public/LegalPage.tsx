import { useContent } from '../../lib/hooks';
import { RichText } from '../../components/RichText';
import { Container, ErrorState, Loading, Seo } from '../../components/public/ui';

export default function LegalPage({ kind }: { kind: 'privacy' | 'cookie' }) {
  const { data, isLoading, error } = useContent('site');
  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState />;
  const title = kind === 'privacy' ? 'Privacy policy' : 'Cookie policy';
  return (
    <Container className="max-w-3xl py-16">
      <Seo title={title} />
      <h1 className="font-display text-4xl uppercase tracking-wide">{title}</h1>
      <RichText html={kind === 'privacy' ? data.privacyHtml : data.cookieHtml} className="mt-8 text-zinc-300" />
    </Container>
  );
}
