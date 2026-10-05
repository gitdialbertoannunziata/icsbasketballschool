import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { REGISTRATION_STATUSES, type EventItem, type Registration, type RegistrationStatus } from '@shared/types';
import { api } from '../../lib/api';
import { useAdminDoc } from '../../lib/hooks';
import { formatBytes } from '../../lib/format';
import { AdminError, AdminLoading, Button, Card, ConfirmButton, PageHeader, inputCls } from '../../components/admin/fields';
import { useSaveFeedback } from '../../components/admin/useSave';

const STATUS_CLS: Record<RegistrationStatus, string> = {
  nuova: 'bg-amber-100 text-amber-800',
  confermata: 'bg-sky-100 text-sky-800',
  pagata: 'bg-emerald-100 text-emerald-800',
  annullata: 'bg-zinc-200 text-zinc-600 line-through',
};

function displayName(r: Registration) {
  const v = r.values;
  const name = [v.nome, v.cognome].filter((x) => typeof x === 'string' && x).join(' ');
  return name || r.email || r.id;
}

function RegistrationRow({ r, ev, onChanged }: { r: Registration; ev?: EventItem; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(r.notes ?? '');
  const run = useSaveFeedback();
  const session = ev?.sessions.find((s) => s.id === r.sessionId);

  const patch = (p: { status?: RegistrationStatus; notes?: string }, msg: string) =>
    run(async () => {
      await api.updateRegistration(r, p);
      onChanged();
    }, msg);

  return (
    <li className="p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button className="min-w-0 flex-1 text-left" onClick={() => setOpen(!open)}>
          <p className="font-medium text-zinc-900">{displayName(r)}</p>
          <p className="text-xs text-zinc-500">
            {new Date(r.createdAt).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}
            {session && ` · ${session.label}`}
            {!ev && ` · ${r.eventTitle}`} · {r.id}
          </p>
        </button>
        <select
          value={r.status}
          onChange={(e) => patch({ status: e.target.value as RegistrationStatus }, 'Stato aggiornato')}
          className={`rounded-full border-0 px-3 py-1 text-xs font-medium ${STATUS_CLS[r.status]}`}
          aria-label="Stato"
        >
          {REGISTRATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button size="sm" onClick={() => setOpen(!open)}>
          {open ? 'Chiudi' : 'Dettagli'}
        </Button>
      </div>
      {open && (
        <div className="mt-4 grid gap-6 rounded-lg bg-zinc-50 p-4 ring-1 ring-zinc-200 lg:grid-cols-[1fr_300px]">
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {(ev?.registration.fields ?? [])
              .filter((f) => f.type !== 'file' && f.type !== 'session')
              .map((f) => {
                const v = r.values[f.id];
                return (
                  <div key={f.id}>
                    <dt className="text-xs text-zinc-500">
                      {f.section ? `${f.section} · ` : ''}
                      {f.label}
                    </dt>
                    <dd className="font-medium">{typeof v === 'boolean' ? (v ? 'Sì' : 'No') : v || '—'}</dd>
                  </div>
                );
              })}
            {!ev &&
              Object.entries(r.values).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-zinc-500">{k}</dt>
                  <dd className="font-medium">{String(v)}</dd>
                </div>
              ))}
          </dl>
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-zinc-500">Allegati</p>
              {r.files.length === 0 ? (
                <p className="text-sm text-zinc-500">Nessuno</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {r.files.map((f, i) => (
                    <li key={i}>
                      <a href={api.registrationFileUrl(r, i)} target="_blank" rel="noopener noreferrer" className="text-brand-dark underline">
                        {f.name}
                      </a>{' '}
                      <span className="text-xs text-zinc-500">({formatBytes(f.size)})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-zinc-500">Note interne</p>
              <textarea className={inputCls} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              <div className="mt-2 flex justify-between gap-2">
                <Button size="sm" onClick={() => patch({ notes }, 'Note salvate')} disabled={notes === (r.notes ?? '')}>
                  Salva note
                </Button>
                <ConfirmButton
                  size="sm"
                  message="Eliminare definitivamente questa iscrizione e i suoi allegati?"
                  onConfirm={() =>
                    run(async () => {
                      await api.deleteRegistration(r);
                      onChanged();
                    }, 'Iscrizione eliminata')
                  }
                >
                  Elimina
                </ConfirmButton>
              </div>
            </div>
            {r.email && (
              <a href={`mailto:${r.email}?subject=${encodeURIComponent(r.eventTitle)}`} className="inline-block text-sm text-brand-dark underline">
                Scrivi a {r.email}
              </a>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export default function RegistrationsAdmin() {
  const [params, setParams] = useSearchParams();
  const events = useAdminDoc('events');
  const qc = useQueryClient();
  const eventId = params.get('evento') ?? '';
  const [status, setStatus] = useState<RegistrationStatus | ''>('');
  const [q, setQ] = useState('');
  const regs = useQuery({ queryKey: ['registrations', eventId || 'all'], queryFn: () => api.registrations(eventId || undefined), staleTime: 0 });
  const ev = events.data?.find((e) => e.id === eventId);
  const refresh = () => qc.invalidateQueries({ queryKey: ['registrations'] });

  const list = (regs.data?.registrations ?? [])
    .filter((r) => !status || r.status === status)
    .filter((r) => !q || JSON.stringify(r.values).toLowerCase().includes(q.toLowerCase()) || r.id.includes(q));

  return (
    <>
      <PageHeader
        title="Iscrizioni"
        description="Richieste arrivate dal modulo online. Aggiorna lo stato man mano che confermi e ricevi i pagamenti."
        actions={
          eventId ? (
            <a href={api.registrationsCsvUrl(eventId)} className="rounded-md bg-white px-3.5 py-2 text-sm font-medium shadow-sm ring-1 ring-zinc-300 hover:bg-zinc-50">
              ⬇ Esporta Excel (CSV)
            </a>
          ) : undefined
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px_1fr]">
        <select className={inputCls} value={eventId} onChange={(e) => setParams(e.target.value ? { evento: e.target.value } : {})} aria-label="Evento">
          <option value="">Tutti gli eventi</option>
          {(events.data ?? []).map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
        <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as RegistrationStatus | '')} aria-label="Stato">
          <option value="">Tutti gli stati</option>
          {REGISTRATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input className={inputCls} type="search" placeholder="Cerca nome, codice fiscale, email…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {ev && regs.data?.availability && ev.sessions.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ev.sessions.map((s) => {
            const a = regs.data!.availability!.sessions[s.id];
            return (
              <Card key={s.id}>
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-2xl font-bold">
                  {a?.taken ?? 0}
                  {s.capacity != null && <span className="text-base font-normal text-zinc-400"> / {s.capacity}</span>}
                </p>
                <p className="text-xs text-zinc-500">{a?.soldOut ? 'Sold out' : a?.available != null ? `${a.available} posti liberi` : 'iscritti (esclusi annullati)'}</p>
              </Card>
            );
          })}
        </div>
      )}

      {regs.isLoading ? (
        <AdminLoading />
      ) : regs.error ? (
        <AdminError error={regs.error} onRetry={() => regs.refetch()} />
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-zinc-200">
          <div className="border-b border-zinc-100 px-4 py-2 text-xs text-zinc-500">{list.length} iscrizioni</div>
          {list.length === 0 ? (
            <p className="p-6 text-sm text-zinc-500">Nessuna iscrizione.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {list.map((r) => (
                <RegistrationRow key={r.id} r={r} ev={ev ?? events.data?.find((e) => e.id === r.eventId)} onChanged={refresh} />
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
