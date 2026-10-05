import { useMemo, useState } from 'react';
import type { StaffMember } from '@shared/types';
import { useContent } from '../../lib/hooks';
import { RichText, hasContent } from '../../components/RichText';
import { ButtonLink, Container, ErrorState, Loading, SectionTitle, Seo } from '../../components/public/ui';
import { EventCard, NewsCard, StaffCard, StaffModal } from '../../components/public/cards';
import { SocialIcons, telegramUrl } from '../../components/public/SocialIcons';
import { formatBytes } from '../../lib/format';

export default function Home() {
  const site = useContent('site');
  const events = useContent('events');
  const news = useContent('news');
  const staff = useContent('staff');
  const documents = useContent('documents');
  const gallery = useContent('gallery');
  const [openMember, setOpenMember] = useState<StaffMember | null>(null);
  const randomGalleryImage = useMemo(() => {
    const photos = (gallery.data ?? [])
      .filter((a) => a.published)
      .flatMap((a) => a.items.filter((i) => i.type === 'image').map((i) => i.url));
    return photos.length ? photos[Math.floor(Math.random() * photos.length)] : undefined;
  }, [gallery.data]);

  if (site.isLoading) return <Loading />;
  if (site.error || !site.data) return <ErrorState />;
  const s = site.data;
  const heroImage = s.heroImage || randomGalleryImage;

  const upcoming = (events.data ?? []).filter((e) => e.status === 'published');
  const team = (staff.data ?? []).filter((m) => m.group === 'staff');
  const support = (staff.data ?? []).filter((m) => m.group === 'support');
  const safeguardingDocs = (documents.data ?? []).filter((d) => d.category.toLowerCase() === 'safeguarding');

  return (
    <>
      <Seo description={s.heroSubtitle || s.heroTagline} />

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-brand/40 via-ink to-ink">
        <Container className="grid items-center gap-10 py-12 lg:min-h-[70vh] lg:grid-cols-5 lg:gap-12 lg:py-20">
          {(s.heroVideo || heroImage) && (
            <div className="relative aspect-video overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 lg:order-2 lg:col-span-3">
              {s.heroVideo && (
                <video
                  className="h-full w-full object-cover motion-reduce:hidden"
                  src={s.heroVideo}
                  poster={heroImage}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-hidden
                />
              )}
              {heroImage && (
                <img
                  src={heroImage}
                  alt=""
                  className={`h-full w-full object-cover ${s.heroVideo ? 'hidden motion-reduce:block' : ''}`}
                />
              )}
            </div>
          )}
          <div className="flex flex-col items-start lg:order-1 lg:col-span-2">
            <img src={s.logoWhite || s.logo || '/logo.png'} alt="" className="mb-6 h-20 object-contain sm:h-28" />
            <h1 className="font-display text-4xl uppercase leading-tight tracking-wide sm:text-5xl lg:text-4xl xl:text-5xl">{s.heroTagline}</h1>
            {s.heroSubtitle && <p className="mt-6 max-w-xl text-lg text-zinc-300">{s.heroSubtitle}</p>}
            <div className="mt-8 flex flex-wrap gap-4">
              {upcoming[0] && <ButtonLink to={`/eventi/${upcoming[0].slug}`}>{upcoming[0].title}</ButtonLink>}
              <ButtonLink to="/#chisiamo" variant="ghost">
                Chi siamo
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      {/* EVENTI */}
      {upcoming.length > 0 && (
        <section className="py-20">
          <Container>
            <SectionTitle kicker="Prossimi appuntamenti">Eventi</SectionTitle>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((e) => (
                <EventCard key={e.id} ev={e} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* CHI SIAMO */}
      <section className="bg-gradient-to-b from-brand/20 to-transparent py-20">
        <Container>
          <SectionTitle id="chisiamo" kicker="Improvement · Commitment · Skills">
            {s.aboutTitle}
          </SectionTitle>
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <RichText html={s.aboutHtml} className="text-lg text-zinc-200" />
            {s.aboutImages.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {s.aboutImages.slice(0, 4).map((img) => (
                  <img key={img} src={img} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-lg object-cover" />
                ))}
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* STAFF */}
      {team.length > 0 && (
        <section className="py-20">
          <Container>
            <SectionTitle id="staff" kicker="Il nostro team">
              Lo staff
            </SectionTitle>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((m) => (
                <StaffCard key={m.id} member={m} onOpen={() => setOpenMember(m)} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* SUPPORTO */}
      {(support.length > 0 || hasContent(s.servicesHtml)) && (
        <section className="bg-coal/60 py-20">
          <Container>
            <SectionTitle kicker="Benessere e prestazione">Servizi di supporto</SectionTitle>
            {hasContent(s.servicesHtml) && <RichText html={s.servicesHtml} className="mb-10 max-w-3xl text-zinc-300" />}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {support.map((m) => (
                <StaffCard key={m.id} member={m} onOpen={() => setOpenMember(m)} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* NEWS */}
      {(news.data?.length ?? 0) > 0 && (
        <section className="py-20">
          <Container>
            <div className="flex items-end justify-between gap-4">
              <SectionTitle id="news" kicker="Dal campo">
                News
              </SectionTitle>
              <ButtonLink to="/news" variant="ghost">
                Tutte le news
              </ButtonLink>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {news.data!.slice(0, 3).map((n) => (
                <NewsCard key={n.id} item={n} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* STRUTTURE */}
      {s.facilities.length > 0 && (
        <section className="bg-coal/60 py-20">
          <Container>
            <SectionTitle kicker="Dove ci alleniamo">Le strutture</SectionTitle>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {s.facilities.map((f) => (
                <figure key={f.image} className="overflow-hidden rounded-xl bg-coal ring-1 ring-white/5">
                  <img src={f.image} alt={f.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  <figcaption className="p-3 text-sm font-semibold uppercase tracking-wide">{f.title}</figcaption>
                </figure>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* CONTATTI */}
      <section className="bg-gradient-to-b from-brand/20 to-transparent py-20">
        <Container>
          <SectionTitle id="contatti" kicker="Scrivici">
            Contatti
          </SectionTitle>
          <div className="grid gap-10 md:grid-cols-2">
            <div className="space-y-4 text-lg">
              {s.contacts.address && (
                <p>
                  <span className="block text-sm uppercase tracking-wide text-zinc-400">Dove siamo</span>
                  {s.contacts.mapUrl ? (
                    <a href={s.contacts.mapUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand-light">
                      {s.contacts.address}
                    </a>
                  ) : (
                    s.contacts.address
                  )}
                </p>
              )}
              {s.contacts.email && (
                <p>
                  <span className="block text-sm uppercase tracking-wide text-zinc-400">Email</span>
                  <a href={`mailto:${s.contacts.email}`} className="hover:text-brand-light">
                    {s.contacts.email}
                  </a>
                </p>
              )}
              {s.contacts.phone && (
                <p>
                  <span className="block text-sm uppercase tracking-wide text-zinc-400">Telefono</span>
                  <a href={`tel:${s.contacts.phone.replace(/\s/g, '')}`} className="hover:text-brand-light">
                    {s.contacts.phone}
                  </a>
                </p>
              )}
              {s.contacts.telegram && (
                <p>
                  <span className="block text-sm uppercase tracking-wide text-zinc-400">Telegram</span>
                  <a href={telegramUrl(s.contacts.telegram)} target="_blank" rel="noopener noreferrer" className="hover:text-brand-light">
                    {s.contacts.telegram}
                  </a>
                </p>
              )}
              <SocialIcons social={s.social} />
            </div>
            <div className="rounded-xl bg-coal p-6 ring-1 ring-white/5">
              <h3 className="font-display text-xl uppercase tracking-wide">{s.legal.name}</h3>
              <p className="mt-2 text-zinc-400">Sede sociale: {s.legal.address}</p>
              <p className="text-zinc-400">P.IVA e codice fiscale: {s.legal.taxCode}</p>
              {(hasContent(s.safeguardingHtml) || safeguardingDocs.length > 0) && (
                <div id="safeguarding" className="mt-6 border-t border-white/10 pt-6">
                  <h4 className="font-display text-lg uppercase tracking-wide text-brand-light">Safeguarding</h4>
                  <RichText html={s.safeguardingHtml} className="text-sm text-zinc-300" />
                  {safeguardingDocs.length > 0 && (
                    <ul className="mt-3 space-y-2 text-sm">
                      {safeguardingDocs.map((d) => (
                        <li key={d.id}>
                          <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-brand-light underline">
                            {d.title}
                          </a>
                          {d.size ? <span className="text-zinc-500"> ({formatBytes(d.size)})</span> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {openMember && <StaffModal member={openMember} onClose={() => setOpenMember(null)} />}
    </>
  );
}
