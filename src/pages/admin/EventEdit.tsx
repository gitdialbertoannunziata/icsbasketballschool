import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { EventItem, EventSession } from '@shared/types';
import { useAdminDoc, useDraft, useUnsavedWarning } from '../../lib/hooks';
import { newId, slugify } from '../../lib/format';
import {
  AdminError,
  AdminLoading,
  Button,
  Card,
  NumberInput,
  PageHeader,
  SaveBar,
  SelectInput,
  StringListInput,
  Tabs,
  TextArea,
  TextInput,
  Toggle,
  inputCls,
} from '../../components/admin/fields';
import { RichEditor } from '../../components/admin/RichEditor';
import { ImageInput } from '../../components/admin/MediaInputs';
import { FormBuilder, standardFields } from '../../components/admin/FormBuilder';
import { useSaveFeedback } from '../../components/admin/useSave';

const TABS = [
  { id: 'general', label: 'Generale' },
  { id: 'sessions', label: 'Date e quote' },
  { id: 'program', label: 'Programma' },
  { id: 'info', label: 'Info pratiche' },
  { id: 'links', label: 'Documenti e galleria' },
  { id: 'registration', label: 'Modulo iscrizione' },
];

function emptyEvent(): EventItem {
  return {
    id: newId('evento'),
    slug: '',
    title: '',
    status: 'draft',
    sessions: [],
    pricing: [],
    scheduleItems: [],
    documentIds: [],
    galleryAlbumIds: [],
    registration: {
      enabled: false,
      fields: standardFields(),
      consentText:
        "Ho letto e compreso la Privacy Policy ai sensi dell'art. 13 d.lgs. 196/2003 e del Regolamento UE 2016/679 e accetto integralmente i termini d'uso.",
      notifyEmails: [],
    },
  };
}

export default function EventEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const doc = useAdminDoc('events');
  const docs = useAdminDoc('documents');
  const gallery = useAdminDoc('gallery');
  const run = useSaveFeedback();
  const [tab, setTab] = useState('general');
  const isNew = id === 'nuovo';

  const source = useMemo(() => (doc.data ? (isNew ? emptyEvent() : doc.data.find((e) => e.id === id)) : undefined), [doc.data, id, isNew]);
  const { draft, update, dirty, reset } = useDraft(source);
  useUnsavedWarning(dirty && !doc.saving);

  if (doc.isLoading) return <AdminLoading />;
  if (doc.error) return <AdminError error={doc.error} onRetry={doc.reload} />;
  if (!draft) return <p>Evento non trovato. <Link to="/admin/eventi" className="underline">Torna all’elenco</Link></p>;

  const set = <K extends keyof EventItem>(k: K, v: EventItem[K]) => update((d) => ({ ...d, [k]: v }));
  const setReg = <K extends keyof EventItem['registration']>(k: K, v: EventItem['registration'][K]) =>
    update((d) => ({ ...d, registration: { ...d.registration, [k]: v } }));
  const setSession = (i: number, patch: Partial<EventSession>) =>
    set('sessions', draft.sessions.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  async function save() {
    const ev: EventItem = { ...draft!, slug: draft!.slug || slugify(draft!.title) };
    if (!ev.title.trim()) return alert('Inserisci il titolo dell’evento');
    const list = doc.data!;
    const next = list.some((e) => e.id === ev.id) ? list.map((e) => (e.id === ev.id ? ev : e)) : [...list, ev];
    const ok = await run(() => doc.save(next), 'Evento salvato');
    if (ok && isNew) navigate(`/admin/eventi/${ev.id}`, { replace: true });
  }

  const toggleId = (list: string[], value: string) => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  return (
    <>
      <PageHeader
        title={isNew ? 'Nuovo evento' : draft.title || 'Evento'}
        actions={
          <>
            <Link to="/admin/eventi" className="rounded-md px-3.5 py-2 text-sm text-zinc-600 hover:bg-zinc-200/60">
              ← Elenco
            </Link>
            {!isNew && draft.status !== 'draft' && (
              <a href={`/eventi/${draft.slug}`} target="_blank" rel="noopener" className="rounded-md px-3.5 py-2 text-sm ring-1 ring-zinc-300 hover:bg-white">
                Vedi sul sito ↗
              </a>
            )}
            <Button variant="primary" onClick={save} disabled={doc.saving}>
              {doc.saving ? 'Salvataggio…' : 'Salva'}
            </Button>
          </>
        }
      />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div className="space-y-6">
        {tab === 'general' && (
          <>
            <Card title="Informazioni principali">
              <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
                <TextInput
                  label="Titolo"
                  value={draft.title}
                  onChange={(v) => update((d) => ({ ...d, title: v, slug: isNew ? slugify(v) : d.slug }))}
                />
                <SelectInput
                  label="Stato"
                  value={draft.status}
                  onChange={(v) => set('status', v)}
                  options={[
                    { value: 'draft', label: 'Bozza (non visibile)' },
                    { value: 'published', label: 'Pubblicato' },
                    { value: 'archived', label: 'Archiviato (passato)' },
                  ]}
                />
              </div>
              <TextInput label="Sottotitolo" value={draft.subtitle} onChange={(v) => set('subtitle', v)} />
              <div className="grid gap-4 sm:grid-cols-3">
                <TextInput label="Data inizio" type="date" value={draft.startDate} onChange={(v) => set('startDate', v || undefined)} />
                <TextInput label="Data fine" type="date" value={draft.endDate} onChange={(v) => set('endDate', v || undefined)} />
                <TextInput label="Annate / età" placeholder="es. 2007–2014 (U13–U19)" value={draft.ageGroups} onChange={(v) => set('ageGroups', v)} />
              </div>
              <TextInput label="Indirizzo pagina" help={`/eventi/${draft.slug || '…'}`} value={draft.slug} onChange={(v) => set('slug', slugify(v))} />
            </Card>
            <Card title="Menu del sito">
              <Toggle
                label="Mostra nel menu principale"
                help="Aggiunge un pulsante in evidenza nel menu in alto, che porta alla pagina dell’evento. Compare solo quando l’evento è pubblicato: consigliati al massimo 1–2 eventi."
                checked={!!draft.showInMenu}
                onChange={(v) => set('showInMenu', v || undefined)}
              />
              {draft.showInMenu && (
                <TextInput
                  label="Testo nel menu (facoltativo)"
                  placeholder={draft.title || 'es. Summer Camp'}
                  help="Una versione breve del titolo, es. «Summer Camp 2026». Se vuoto si usa il titolo."
                  value={draft.menuLabel}
                  onChange={(v) => set('menuLabel', v || undefined)}
                />
              )}
              {draft.showInMenu && draft.status !== 'published' && (
                <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
                  L’evento non è pubblicato: il link comparirà nel menu solo quando lo stato sarà «Pubblicato».
                </p>
              )}
            </Card>
            <Card title="Luogo">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Nome" value={draft.location?.name} onChange={(v) => set('location', { ...draft.location, name: v })} />
                <TextInput
                  label="Indirizzo"
                  value={draft.location?.address}
                  onChange={(v) => set('location', { name: draft.location?.name ?? '', ...draft.location, address: v })}
                />
              </div>
              <TextInput
                label="Link Google Maps"
                value={draft.location?.mapUrl}
                onChange={(v) => set('location', { name: draft.location?.name ?? '', ...draft.location, mapUrl: v })}
              />
            </Card>
            <Card title="Immagini">
              <div className="grid gap-6 sm:grid-cols-2">
                <ImageInput label="Immagine di copertina" value={draft.coverImage} onChange={(v) => set('coverImage', v)} />
                <ImageInput label="Locandina" value={draft.poster} onChange={(v) => set('poster', v)} aspect="aspect-[3/4]" />
              </div>
            </Card>
            <Card title="Presentazione">
              <RichEditor value={draft.descriptionHtml} onChange={(v) => set('descriptionHtml', v)} />
            </Card>
          </>
        )}

        {tab === 'sessions' && (
          <>
            <Card
              title="Turni / settimane"
              actions={
                <Button
                  size="sm"
                  onClick={() =>
                    set('sessions', [
                      ...draft.sessions,
                      { id: newId('turno'), label: `Turno ${draft.sessions.length + 1}`, start: draft.startDate ?? '', end: draft.endDate ?? '' },
                    ])
                  }
                >
                  + Aggiungi turno
                </Button>
              }
            >
              <p className="text-sm text-zinc-500">
                Indica la capienza per mostrare i posti residui: quando si esaurisce il turno viene segnato automaticamente «Sold out».
              </p>
              {draft.sessions.map((s, i) => (
                <div key={s.id} className="space-y-4 rounded-lg bg-zinc-50 p-4 ring-1 ring-zinc-200">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <TextInput className="lg:col-span-2" label="Nome" value={s.label} onChange={(v) => setSession(i, { label: v })} />
                    <TextInput label="Dal" type="date" value={s.start} onChange={(v) => setSession(i, { start: v })} />
                    <TextInput label="Al" type="date" value={s.end} onChange={(v) => setSession(i, { end: v })} />
                    <NumberInput label="Quota (€)" step={0.01} value={s.price} onChange={(v) => setSession(i, { price: v })} />
                  </div>
                  <div className="grid items-end gap-4 sm:grid-cols-3">
                    <NumberInput label="Posti disponibili" help="Vuoto = nessun limite" value={s.capacity} onChange={(v) => setSession(i, { capacity: v })} />
                    <Toggle label="Sold out (forzato)" checked={!!s.soldOut} onChange={(v) => setSession(i, { soldOut: v })} />
                    <div className="text-right">
                      <Button size="sm" variant="danger" onClick={() => set('sessions', draft.sessions.filter((_, j) => j !== i))}>
                        Rimuovi turno
                      </Button>
                    </div>
                  </div>
                  <StringListInput
                    label="Dettagli (punti elenco)"
                    values={s.details ?? []}
                    onChange={(v) => setSession(i, { details: v })}
                    placeholder="es. 5 giorni / 4 notti, pensione completa"
                  />
                </div>
              ))}
            </Card>
            <Card
              title="Quote e supplementi"
              actions={<Button size="sm" onClick={() => set('pricing', [...draft.pricing, { label: '', amount: 0 }])}>+ Aggiungi voce</Button>}
            >
              {draft.pricing.map((p, i) => (
                <div key={i} className="grid items-end gap-3 sm:grid-cols-[1fr_140px_1fr_auto]">
                  <TextInput label="Voce" value={p.label} onChange={(v) => set('pricing', draft.pricing.map((x, j) => (j === i ? { ...x, label: v } : x)))} />
                  <NumberInput
                    label="Importo (€)"
                    step={0.01}
                    value={p.amount}
                    onChange={(v) => set('pricing', draft.pricing.map((x, j) => (j === i ? { ...x, amount: v ?? 0 } : x)))}
                  />
                  <TextInput label="Note" value={p.notes} onChange={(v) => set('pricing', draft.pricing.map((x, j) => (j === i ? { ...x, notes: v } : x)))} />
                  <Button variant="ghost" title="Rimuovi" onClick={() => set('pricing', draft.pricing.filter((_, j) => j !== i))}>
                    ✕
                  </Button>
                </div>
              ))}
            </Card>
            <Card title="Cosa è incluso">
              <RichEditor value={draft.includedHtml} onChange={(v) => set('includedHtml', v)} />
            </Card>
            <Card title="Pagamento">
              <RichEditor help="IBAN, causale, acconto e saldo." value={draft.paymentInfoHtml} onChange={(v) => set('paymentInfoHtml', v)} />
            </Card>
            <Card title="Sconti">
              <RichEditor value={draft.discountsHtml} onChange={(v) => set('discountsHtml', v)} />
            </Card>
            <Card title="Recesso e rimborsi">
              <RichEditor value={draft.refundPolicyHtml} onChange={(v) => set('refundPolicyHtml', v)} />
            </Card>
          </>
        )}

        {tab === 'program' && (
          <>
            <Card
              title="Giornata tipo"
              actions={<Button size="sm" onClick={() => set('scheduleItems', [...draft.scheduleItems, { time: '', activity: '' }])}>+ Aggiungi orario</Button>}
            >
              {draft.scheduleItems.map((it, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={`${inputCls} w-24`}
                    placeholder="08:00"
                    value={it.time}
                    onChange={(e) => set('scheduleItems', draft.scheduleItems.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))}
                  />
                  <input
                    className={inputCls}
                    placeholder="Attività"
                    value={it.activity}
                    onChange={(e) => set('scheduleItems', draft.scheduleItems.map((x, j) => (j === i ? { ...x, activity: e.target.value } : x)))}
                  />
                  <Button variant="ghost" title="Rimuovi" onClick={() => set('scheduleItems', draft.scheduleItems.filter((_, j) => j !== i))}>
                    ✕
                  </Button>
                </div>
              ))}
            </Card>
            <Card title="Modalità di partecipazione">
              <RichEditor value={draft.participationHtml} onChange={(v) => set('participationHtml', v)} />
            </Card>
            <Card title="Le strutture">
              <RichEditor value={draft.facilitiesHtml} onChange={(v) => set('facilitiesHtml', v)} />
            </Card>
          </>
        )}

        {tab === 'info' && (
          <>
            <Card title="Arrivo e partenza">
              <RichEditor value={draft.checkInOutHtml} onChange={(v) => set('checkInOutHtml', v)} />
            </Card>
            <Card title="Come raggiungerci">
              <RichEditor value={draft.howToReachHtml} onChange={(v) => set('howToReachHtml', v)} />
            </Card>
            <Card title="Cosa portare">
              <RichEditor value={draft.whatToBringHtml} onChange={(v) => set('whatToBringHtml', v)} />
            </Card>
            <Card title="Documenti da inviare">
              <RichEditor value={draft.requiredDocsHtml} onChange={(v) => set('requiredDocsHtml', v)} />
            </Card>
          </>
        )}

        {tab === 'links' && (
          <>
            <Card title="Documenti da scaricare" actions={<Link to="/admin/documenti" className="text-sm text-brand-dark hover:underline">Carica nuovi documenti</Link>}>
              {(docs.data ?? []).length === 0 && <p className="text-sm text-zinc-500">Nessun documento caricato.</p>}
              <div className="grid gap-2 sm:grid-cols-2">
                {(docs.data ?? []).map((d) => (
                  <label key={d.id} className="flex items-center gap-3 rounded-lg p-2 ring-1 ring-zinc-200 hover:bg-zinc-50">
                    <input
                      type="checkbox"
                      checked={draft.documentIds.includes(d.id) || d.eventId === draft.id}
                      disabled={d.eventId === draft.id}
                      onChange={() => set('documentIds', toggleId(draft.documentIds, d.id))}
                      className="accent-[#c05c03]"
                    />
                    <span className="text-sm">
                      {d.title}
                      <span className="block text-xs text-zinc-500">
                        {d.category}
                        {d.eventId === draft.id && ' · collegato da Documenti'}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </Card>
            <Card title="Album della galleria" actions={<Link to="/admin/galleria" className="text-sm text-brand-dark hover:underline">Gestisci galleria</Link>}>
              {(gallery.data ?? []).length === 0 && <p className="text-sm text-zinc-500">Nessun album.</p>}
              <div className="grid gap-2 sm:grid-cols-2">
                {(gallery.data ?? []).map((a) => (
                  <label key={a.id} className="flex items-center gap-3 rounded-lg p-2 ring-1 ring-zinc-200 hover:bg-zinc-50">
                    <input
                      type="checkbox"
                      checked={draft.galleryAlbumIds.includes(a.id) || a.eventId === draft.id}
                      disabled={a.eventId === draft.id}
                      onChange={() => set('galleryAlbumIds', toggleId(draft.galleryAlbumIds, a.id))}
                      className="accent-[#c05c03]"
                    />
                    <span className="text-sm">
                      {a.title}
                      <span className="block text-xs text-zinc-500">
                        {a.items.length} elementi{a.eventId === draft.id && ' · album di questo evento'}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </Card>
          </>
        )}

        {tab === 'registration' && (
          <>
            <Card title="Iscrizioni online">
              <Toggle
                label="Iscrizioni aperte"
                help="Mostra il pulsante «Iscriviti» sulla pagina dell’evento (l’evento deve essere pubblicato)."
                checked={draft.registration.enabled}
                onChange={(v) => setReg('enabled', v)}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Apertura (facoltativa)" type="date" value={draft.registration.opensAt?.slice(0, 10)} onChange={(v) => setReg('opensAt', v || undefined)} />
                <TextInput
                  label="Chiusura (facoltativa)"
                  type="date"
                  help="Le iscrizioni si chiudono alla fine di questo giorno."
                  value={draft.registration.closesAt?.slice(0, 10)}
                  onChange={(v) => setReg('closesAt', v ? `${v}T23:59:59` : undefined)}
                />
              </div>
              <RichEditor
                label="Istruzioni mostrate sopra il modulo"
                help="es. bonifico da effettuare prima dell’iscrizione, IBAN, causale."
                value={draft.registration.introHtml}
                onChange={(v) => setReg('introHtml', v)}
              />
              <TextArea label="Testo consenso privacy" value={draft.registration.consentText} onChange={(v) => setReg('consentText', v)} />
              <TextArea
                label="Messaggio di conferma"
                help="Mostrato dopo l’invio e nell’email di conferma."
                value={draft.registration.confirmationMessage}
                onChange={(v) => setReg('confirmationMessage', v)}
              />
              <StringListInput
                label="Email da avvisare per questo evento"
                values={draft.registration.notifyEmails}
                onChange={(v) => setReg('notifyEmails', v)}
                placeholder="nome@esempio.it"
              />
            </Card>
            <Card
              title="Campi del modulo"
              actions={
                <Button
                  size="sm"
                  onClick={() => window.confirm('Sostituire i campi attuali con il modello standard (atleta + genitore)?') && setReg('fields', standardFields())}
                >
                  Usa modello standard
                </Button>
              }
            >
              <FormBuilder fields={draft.registration.fields} onChange={(f) => setReg('fields', f)} />
            </Card>
          </>
        )}
      </div>

      <SaveBar dirty={dirty} saving={doc.saving} onReset={reset} onSave={save} />
    </>
  );
}
