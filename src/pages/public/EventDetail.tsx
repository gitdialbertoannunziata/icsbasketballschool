import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useContent } from '../../lib/hooks';
import { formatBytes, formatDate, formatDateRange, formatPrice } from '../../lib/format';
import { RichText, hasContent } from '../../components/RichText';
import { Badge, ButtonLink, Container, ErrorState, Loading, Seo } from '../../components/public/ui';
import { AlbumGrid } from '../../components/public/AlbumGrid';
import NotFound from './NotFound';

function Block({ title, html, children }: { title: string; html?: string; children?: ReactNode }) {
  if (!children && !hasContent(html)) return null;
  return (
    <section className="rounded-xl bg-coal p-6 ring-1 ring-white/5 sm:p-8">
      <h2 className="mb-4 font-display text-2xl uppercase tracking-wide text-brand-light">{title}</h2>
      {html && <RichText html={html} className="text-zinc-300" />}
      {children}
    </section>
  );
}

export function isRegistrationOpen(r: { enabled: boolean; opensAt?: string; closesAt?: string }, status: string) {
  const now = new Date();
  return (
    status === 'published' &&
    r.enabled &&
    (!r.opensAt || now >= new Date(r.opensAt)) &&
    (!r.closesAt || now <= new Date(r.closesAt))
  );
}

export default function EventDetail() {
  const { slug } = useParams();
  const events = useContent('events');
  const documents = useContent('documents');
  const gallery = useContent('gallery');
  const ev = events.data?.find((e) => e.slug === slug);
  const availability = useQuery({
    queryKey: ['availability', ev?.id],
    queryFn: () => api.availability(ev!.id),
    enabled: !!ev && ev.status === 'published' && ev.sessions.length > 0,
    staleTime: 30_000,
  });

  if (events.isLoading) return <Loading />;
  if (events.error) return <ErrorState />;
  if (!ev) return <NotFound />;

  const docs = (documents.data ?? []).filter((d) => ev.documentIds.includes(d.id) || d.eventId === ev.id);
  const albums = (gallery.data ?? []).filter((a) => ev.galleryAlbumIds.includes(a.id) || a.eventId === ev.id);
  const open = isRegistrationOpen(ev.registration, ev.status);
  const sessionState = (id: string) => availability.data?.sessions[id];
  const allSoldOut = ev.sessions.length > 0 && ev.sessions.every((s) => s.soldOut || sessionState(s.id)?.soldOut);
  const canRegister = open && !allSoldOut;

  const cta = canRegister ? (
    <ButtonLink to={`/eventi/${ev.slug}/iscrizione`}>Iscriviti ora</ButtonLink>
  ) : ev.status === 'published' && allSoldOut ? (
    <Badge tone="red">Sold out</Badge>
  ) : null;

  return (
    <>
      <Seo title={ev.title} description={ev.subtitle} />
      <section className="relative isolate overflow-hidden">
        {(ev.coverImage || ev.poster) && (
          <img src={ev.coverImage || ev.poster} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand/40 to-ink" />
        <Container className="py-16 sm:py-24">
          <Link to="/eventi" className="text-sm font-semibold uppercase text-brand-light hover:underline">
            ← Tutti gli eventi
          </Link>
          <div className="mt-4 flex flex-wrap gap-2">
            {ev.status === 'archived' && <Badge tone="zinc">Evento concluso</Badge>}
            {canRegister && <Badge tone="green">Iscrizioni aperte</Badge>}
          </div>
          <h1 className="mt-3 font-display text-4xl uppercase tracking-wide sm:text-6xl">{ev.title}</h1>
          {ev.subtitle && <p className="mt-4 max-w-2xl text-lg text-zinc-300">{ev.subtitle}</p>}
          <p className="mt-4 font-semibold uppercase tracking-wide text-brand-light">
            {formatDateRange(ev.startDate, ev.endDate)}
            {ev.location?.name && ` · ${ev.location.name}`}
          </p>
          {cta && <div className="mt-8">{cta}</div>}
        </Container>
      </section>

      <Container className="grid gap-8 py-12 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <Block title="Presentazione" html={ev.descriptionHtml} />

          {ev.sessions.length > 0 && (
            <Block title="Date e turni">
              <div className="grid gap-4 sm:grid-cols-2">
                {ev.sessions.map((s) => {
                  const st = sessionState(s.id);
                  const soldOut = s.soldOut || st?.soldOut;
                  return (
                    <div key={s.id} className={`rounded-lg p-5 ring-1 ${soldOut ? 'bg-white/5 ring-white/10' : 'bg-brand/10 ring-brand/40'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-xl uppercase tracking-wide">{s.label}</h3>
                        {soldOut ? (
                          <Badge tone="red">Sold out</Badge>
                        ) : open && st?.available != null ? (
                          <Badge tone="green">{st.available} posti</Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-zinc-400">{formatDateRange(s.start, s.end)}</p>
                      {s.price != null && <p className="mt-2 text-2xl font-bold">{formatPrice(s.price)}</p>}
                      {s.details && s.details.length > 0 && (
                        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-300">
                          {s.details.map((d) => (
                            <li key={d}>{d}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </Block>
          )}

          <Block title="Cosa è incluso" html={ev.includedHtml} />
          <Block title="Modalità di partecipazione" html={ev.participationHtml} />

          {ev.scheduleItems.length > 0 && (
            <Block title="Giornata tipo">
              <ol className="relative border-l border-brand/40 pl-6">
                {ev.scheduleItems.map((it, i) => (
                  <li key={i} className="mb-4 last:mb-0">
                    <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-brand" />
                    <span className="font-mono font-semibold text-brand-light">{it.time}</span>
                    <span className="ml-3 text-zinc-200">{it.activity}</span>
                  </li>
                ))}
              </ol>
            </Block>
          )}

          <Block title="Le strutture" html={ev.facilitiesHtml} />
          <Block title="Arrivo e partenza" html={ev.checkInOutHtml} />
          <Block title="Come raggiungerci" html={ev.howToReachHtml}>
            {ev.location?.mapUrl ? (
              <a href={ev.location.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-brand-light underline">
                Apri in Google Maps
              </a>
            ) : undefined}
          </Block>
          <Block title="Cosa portare" html={ev.whatToBringHtml} />
          <Block title="Documenti da inviare" html={ev.requiredDocsHtml} />
          <Block title="Pagamento" html={ev.paymentInfoHtml} />
          <Block title="Sconti" html={ev.discountsHtml} />
          <Block title="Recesso e rimborsi" html={ev.refundPolicyHtml} />

          {albums.length > 0 && (
            <Block title="Galleria">
              <div className="space-y-8">
                {albums
                  .filter((a) => a.items.length > 0)
                  .map((a) => (
                    <div key={a.id}>
                      {albums.length > 1 && <h3 className="mb-3 font-semibold">{a.title}</h3>}
                      <AlbumGrid items={a.items} limit={8} />
                    </div>
                  ))}
              </div>
            </Block>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl bg-coal p-6 ring-1 ring-white/5">
            <h2 className="mb-4 font-display text-xl uppercase tracking-wide">In breve</h2>
            <dl className="space-y-3 text-sm">
              {ev.startDate && (
                <div>
                  <dt className="text-zinc-500 uppercase">Quando</dt>
                  <dd>{formatDateRange(ev.startDate, ev.endDate)}</dd>
                </div>
              )}
              {ev.location && (
                <div>
                  <dt className="text-zinc-500 uppercase">Dove</dt>
                  <dd>
                    {ev.location.name}
                    {ev.location.address && <span className="block text-zinc-400">{ev.location.address}</span>}
                  </dd>
                </div>
              )}
              {ev.ageGroups && (
                <div>
                  <dt className="text-zinc-500 uppercase">Annate</dt>
                  <dd>{ev.ageGroups}</dd>
                </div>
              )}
              {ev.registration.closesAt && open && (
                <div>
                  <dt className="text-zinc-500 uppercase">Iscrizioni entro</dt>
                  <dd>{formatDate(ev.registration.closesAt)}</dd>
                </div>
              )}
            </dl>
            {ev.pricing.length > 0 && (
              <>
                <h3 className="mb-2 mt-6 font-semibold uppercase text-brand-light">Quote</h3>
                <ul className="divide-y divide-white/5 text-sm">
                  {ev.pricing.map((p, i) => (
                    <li key={i} className="py-2">
                      <div className="flex justify-between gap-4">
                        <span>{p.label}</span>
                        <span className="font-semibold">{formatPrice(p.amount)}</span>
                      </div>
                      {p.notes && <p className="text-xs text-zinc-500">{p.notes}</p>}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {cta && <div className="mt-6">{cta}</div>}
          </div>

          {ev.poster && ev.poster !== ev.coverImage && (
            <a href={ev.poster} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl ring-1 ring-white/5">
              <img src={ev.poster} alt={`Locandina ${ev.title}`} className="w-full" />
            </a>
          )}

          {docs.length > 0 && (
            <div className="rounded-xl bg-coal p-6 ring-1 ring-white/5">
              <h2 className="mb-4 font-display text-xl uppercase tracking-wide">Moduli da scaricare</h2>
              <ul className="space-y-3">
                {docs.map((d) => (
                  <li key={d.id}>
                    <a href={d.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3">
                      <span className="rounded bg-brand/20 px-2 py-1 text-xs font-bold text-brand-light">PDF</span>
                      <span>
                        <span className="font-semibold group-hover:text-brand-light">{d.title}</span>
                        {d.size ? <span className="block text-xs text-zinc-500">{formatBytes(d.size)}</span> : null}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </Container>
    </>
  );
}
