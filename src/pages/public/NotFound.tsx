import { ButtonLink, Container, Seo } from '../../components/public/ui';

export default function NotFound() {
  return (
    <Container className="py-32 text-center">
      <Seo title="Pagina non trovata" />
      <p className="font-display text-8xl text-brand">404</p>
      <h1 className="mt-4 font-display text-3xl uppercase">Pagina non trovata</h1>
      <p className="mt-2 text-zinc-400">La pagina che cerchi non esiste o è stata spostata.</p>
      <div className="mt-8">
        <ButtonLink to="/">Torna alla home</ButtonLink>
      </div>
    </Container>
  );
}
