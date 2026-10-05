import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { FormField } from '@shared/types';
import { api, ApiError } from '../../lib/api';
import { useContent } from '../../lib/hooks';
import { formatDateRange, formatPrice } from '../../lib/format';
import { RichText } from '../../components/RichText';
import { ButtonLink, Container, ErrorState, Loading, Seo } from '../../components/public/ui';
import NotFound from './NotFound';
import { isRegistrationOpen } from './EventDetail';

const inputCls =
  'w-full rounded-md border border-zinc-700 bg-ink px-3 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand';

function groupBySection(fields: FormField[]) {
  const groups: { section: string; fields: FormField[] }[] = [];
  for (const f of fields) {
    const section = f.section ?? '';
    const last = groups[groups.length - 1];
    if (last && last.section === section) last.fields.push(f);
    else groups.push({ section, fields: [f] });
  }
  return groups;
}

export default function RegistrationPage() {
  const { slug } = useParams();
  const events = useContent('events');
  const ev = events.data?.find((e) => e.slug === slug);
  const availability = useQuery({
    queryKey: ['availability', ev?.id],
    queryFn: () => api.availability(ev!.id),
    enabled: !!ev && ev.sessions.length > 0,
    staleTime: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  if (events.isLoading) return <Loading />;
  if (events.error) return <ErrorState />;
  if (!ev) return <NotFound />;

  if (!isRegistrationOpen(ev.registration, ev.status)) {
    return (
      <Container className="max-w-2xl py-24 text-center">
        <Seo title={`Iscrizioni ${ev.title}`} />
        <h1 className="font-display text-3xl uppercase">Iscrizioni chiuse</h1>
        <p className="mt-4 text-zinc-400">Le iscrizioni per {ev.title} non sono al momento aperte.</p>
        <div className="mt-8">
          <ButtonLink to={`/eventi/${ev.slug}`} variant="ghost">
            Torna all’evento
          </ButtonLink>
        </div>
      </Container>
    );
  }

  if (done) {
    return (
      <Container className="max-w-2xl py-24 text-center">
        <Seo title={`Iscrizione inviata – ${ev.title}`} />
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-3xl">✓</div>
        <h1 className="font-display text-3xl uppercase">Richiesta inviata!</h1>
        <p className="mt-4 text-zinc-300">
          {ev.registration.confirmationMessage ||
            'Abbiamo ricevuto la tua richiesta di iscrizione. Riceverai una email di conferma all’indirizzo indicato (controlla anche lo spam).'}
        </p>
        <p className="mt-4 text-sm text-zinc-500">
          Codice pratica: <strong className="text-zinc-300">{done}</strong>
        </p>
        <div className="mt-8">
          <ButtonLink to={`/eventi/${ev.slug}`} variant="ghost">
            Torna all’evento
          </ButtonLink>
        </div>
      </Container>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setFormError('');
    setSubmitting(true);
    try {
      const res = await api.submitRegistration(ev!.id, new FormData(e.currentTarget));
      setDone(res.id);
      window.scrollTo({ top: 0 });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields ?? {});
        setFormError(err.message);
        availability.refetch();
      } else setFormError('Errore di connessione. Riprova.');
      setTimeout(() => document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    } finally {
      setSubmitting(false);
    }
  }

  const renderField = (f: FormField) => {
    const err = errors[f.id];
    const label = (
      <span className="mb-1.5 block text-sm font-medium">
        {f.label}
        {f.required && <span className="text-brand-light"> *</span>}
      </span>
    );
    let control;
    switch (f.type) {
      case 'session':
        control = (
          <div className="grid gap-3 sm:grid-cols-2">
            {ev.sessions.map((s) => {
              const st = availability.data?.sessions[s.id];
              const soldOut = s.soldOut || st?.soldOut;
              return (
                <label
                  key={s.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg p-4 ring-1 transition has-[:checked]:bg-brand/15 has-[:checked]:ring-brand ${
                    soldOut ? 'cursor-not-allowed opacity-50 ring-white/10' : 'ring-zinc-700 hover:ring-brand/60'
                  }`}
                >
                  <input type="radio" name={f.id} value={s.id} required={f.required} disabled={soldOut} className="mt-1 accent-[#c05c03]" />
                  <span>
                    <span className="block font-semibold">{s.label}</span>
                    <span className="block text-sm text-zinc-400">{formatDateRange(s.start, s.end)}</span>
                    {s.price != null && <span className="block text-sm">{formatPrice(s.price)}</span>}
                    <span className={`block text-xs font-semibold uppercase ${soldOut ? 'text-red-400' : 'text-emerald-400'}`}>
                      {soldOut ? 'Sold out' : st?.available != null ? `${st.available} posti disponibili` : 'Disponibile'}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        );
        break;
      case 'textarea':
        control = <textarea name={f.id} required={f.required} rows={4} className={inputCls} />;
        break;
      case 'select':
        control = (
          <select name={f.id} required={f.required} className={inputCls} defaultValue="">
            <option value="" disabled>
              Seleziona…
            </option>
            {f.options?.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        );
        break;
      case 'radio':
        control = (
          <div className="flex flex-wrap gap-4">
            {f.options?.map((o) => (
              <label key={o} className="flex items-center gap-2">
                <input type="radio" name={f.id} value={o} required={f.required} className="accent-[#c05c03]" />
                {o}
              </label>
            ))}
          </div>
        );
        break;
      case 'checkbox':
        return (
          <label key={f.id} className="flex items-start gap-3" data-error={!!err}>
            <input type="checkbox" name={f.id} required={f.required} className="mt-1 accent-[#c05c03]" />
            <span className="text-sm">
              {f.label}
              {f.required && <span className="text-brand-light"> *</span>}
              {err && <span className="block text-red-400">{err}</span>}
            </span>
          </label>
        );
      case 'file':
        control = (
          <input
            type="file"
            name={f.id}
            required={f.required}
            accept="application/pdf,image/*"
            className={`${inputCls} file:mr-4 file:rounded file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white`}
          />
        );
        break;
      default:
        control = (
          <input
            type={f.type}
            name={f.id}
            required={f.required}
            className={inputCls}
            autoComplete={f.type === 'email' ? 'email' : 'off'}
            maxLength={2000}
          />
        );
    }
    const wide = f.type === 'session' || f.type === 'textarea' || f.type === 'radio' || f.type === 'file';
    return (
      <div key={f.id} className={wide ? 'sm:col-span-2' : ''} data-error={!!err}>
        {f.type === 'session' || f.type === 'radio' ? <fieldset>{label}{control}</fieldset> : <label className="block">{label}{control}</label>}
        {f.help && <p className="mt-1 text-xs text-zinc-500">{f.help}</p>}
        {f.type === 'file' && <p className="mt-1 text-xs text-zinc-500">PDF o immagine, max 10 MB.</p>}
        {err && <p className="mt-1 text-sm text-red-400">{err}</p>}
      </div>
    );
  };

  return (
    <>
      <Seo title={`Iscrizione ${ev.title}`} />
      <Container className="max-w-3xl py-12">
        <Link to={`/eventi/${ev.slug}`} className="text-sm font-semibold uppercase text-brand-light hover:underline">
          ← {ev.title}
        </Link>
        <h1 className="mt-4 font-display text-4xl uppercase tracking-wide">Iscrizione</h1>
        <p className="mt-1 text-lg text-zinc-400">{ev.title}</p>

        {ev.registration.introHtml && (
          <div className="mt-8 rounded-xl bg-coal p-6 ring-1 ring-white/5">
            <RichText html={ev.registration.introHtml} className="text-zinc-300" />
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-8 space-y-8" noValidate={false}>
          {/* honeypot anti-spam */}
          <input type="text" name="_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

          {groupBySection(ev.registration.fields).map((g, i) => (
            <fieldset key={i} className="rounded-xl bg-coal p-6 ring-1 ring-white/5">
              {g.section && <legend className="px-2 font-display text-xl uppercase tracking-wide text-brand-light">{g.section}</legend>}
              <div className="grid gap-5 sm:grid-cols-2">{g.fields.map(renderField)}</div>
            </fieldset>
          ))}

          <label className="flex items-start gap-3 rounded-xl bg-coal p-6 ring-1 ring-white/5" data-error={!!errors._consent}>
            <input type="checkbox" name="_consent" required className="mt-1 accent-[#c05c03]" />
            <span className="text-sm text-zinc-300">
              {ev.registration.consentText}{' '}
              <Link to="/privacy" target="_blank" className="text-brand-light underline">
                Leggi la privacy policy
              </Link>
              <span className="text-brand-light"> *</span>
              {errors._consent && <span className="block text-red-400">{errors._consent}</span>}
            </span>
          </label>

          {(formError || errors._session) && (
            <div className="rounded-lg bg-red-500/15 p-4 text-red-300 ring-1 ring-red-500/40" data-error="true">
              {errors._session || formError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-brand px-6 py-4 font-semibold uppercase tracking-wide text-white transition hover:bg-brand-light disabled:opacity-60"
          >
            {submitting ? 'Invio in corso…' : 'Invia la richiesta di iscrizione'}
          </button>
        </form>
      </Container>
    </>
  );
}
