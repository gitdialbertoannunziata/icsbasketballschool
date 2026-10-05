import { useState } from 'react';
import type { SiteContent } from '@shared/types';
import { useAdminDoc, useDraft, useUnsavedWarning } from '../../lib/hooks';
import {
  AdminError,
  AdminLoading,
  Button,
  Card,
  PageHeader,
  SaveBar,
  StringListInput,
  Tabs,
  TextArea,
  TextInput,
} from '../../components/admin/fields';
import { RichEditor } from '../../components/admin/RichEditor';
import { ImageInput, ImagesInput, VideoInput } from '../../components/admin/MediaInputs';
import { useSaveFeedback } from '../../components/admin/useSave';

const TABS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'Chi siamo' },
  { id: 'contacts', label: 'Contatti e social' },
  { id: 'safeguarding', label: 'Safeguarding' },
  { id: 'legal', label: 'Privacy e cookie' },
  { id: 'notify', label: 'Notifiche' },
];

export default function SiteEditor() {
  const doc = useAdminDoc('site');
  const { draft, update, dirty, reset } = useDraft(doc.data);
  const [tab, setTab] = useState('home');
  const run = useSaveFeedback();
  useUnsavedWarning(dirty);

  if (doc.isLoading) return <AdminLoading />;
  if (doc.error) return <AdminError error={doc.error} onRetry={doc.reload} />;
  if (!draft) return null;

  const set = <K extends keyof SiteContent>(k: K, v: SiteContent[K]) => update((d) => ({ ...d, [k]: v }));
  const setContacts = (k: keyof SiteContent['contacts'], v: string) => update((d) => ({ ...d, contacts: { ...d.contacts, [k]: v } }));
  const setLegal = (k: keyof SiteContent['legal'], v: string) => update((d) => ({ ...d, legal: { ...d.legal, [k]: v } }));
  const setSocial = (k: keyof SiteContent['social'], v: string) => update((d) => ({ ...d, social: { ...d.social, [k]: v || undefined } }));

  return (
    <>
      <PageHeader title="Testi del sito" description="Modifica i testi e le immagini delle pagine principali." />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div className="space-y-6">
        {tab === 'home' && (
          <>
            <Card title="Copertina della home">
              <TextInput label="Frase principale" value={draft.heroTagline} onChange={(v) => set('heroTagline', v)} />
              <TextArea label="Sottotitolo (facoltativo)" value={draft.heroSubtitle} onChange={(v) => set('heroSubtitle', v)} />
              <div className="grid gap-6 sm:grid-cols-2">
                <VideoInput
                  label="Video di sfondo"
                  help="Parte in automatico, senza audio e in loop."
                  value={draft.heroVideo}
                  poster={draft.heroImage}
                  onChange={(v) => set('heroVideo', v)}
                />
                <ImageInput
                  label="Immagine di sfondo"
                  help="Mostrata mentre il video si carica, o al suo posto se non c’è un video. Se vuota, viene usata una foto casuale della galleria."
                  value={draft.heroImage}
                  onChange={(v) => set('heroImage', v)}
                />
              </div>
            </Card>
            <Card title="Logo">
              <div className="grid gap-6 sm:grid-cols-2">
                <ImageInput label="Logo (icona)" value={draft.logo} onChange={(v) => set('logo', v)} aspect="aspect-square" />
                <ImageInput label="Logo bianco (sfondi scuri)" value={draft.logoWhite} onChange={(v) => set('logoWhite', v)} aspect="aspect-square" />
              </div>
            </Card>
            <Card title="Le strutture" actions={<Button size="sm" onClick={() => set('facilities', [...draft.facilities, { title: '', image: '' }])}>+ Aggiungi</Button>}>
              {draft.facilities.length === 0 && <p className="text-sm text-zinc-500">Nessuna struttura.</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                {draft.facilities.map((f, i) => (
                  <div key={i} className="space-y-3 rounded-lg bg-zinc-50 p-4 ring-1 ring-zinc-200">
                    <TextInput
                      label="Titolo"
                      value={f.title}
                      onChange={(v) => set('facilities', draft.facilities.map((x, j) => (j === i ? { ...x, title: v } : x)))}
                    />
                    <ImageInput
                      label="Foto"
                      value={f.image || undefined}
                      onChange={(v) => set('facilities', draft.facilities.map((x, j) => (j === i ? { ...x, image: v ?? '' } : x)))}
                    />
                    <Button size="sm" variant="danger" onClick={() => set('facilities', draft.facilities.filter((_, j) => j !== i))}>
                      Rimuovi
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {tab === 'about' && (
          <>
            <Card title="Chi siamo">
              <TextInput label="Titolo sezione" value={draft.aboutTitle} onChange={(v) => set('aboutTitle', v)} />
              <RichEditor label="Testo" value={draft.aboutHtml} onChange={(v) => set('aboutHtml', v)} />
              <ImagesInput label="Foto (fino a 4 in home)" values={draft.aboutImages} onChange={(v) => set('aboutImages', v)} />
            </Card>
            <Card title="Servizi di supporto">
              <RichEditor
                label="Testo introduttivo (facoltativo)"
                help="Compare sopra le schede di psicologo, nutrizionista, osteopata… (gestite nella sezione Staff, gruppo «Supporto»)."
                value={draft.servicesHtml}
                onChange={(v) => set('servicesHtml', v)}
              />
            </Card>
          </>
        )}

        {tab === 'contacts' && (
          <>
            <Card title="Contatti">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Email" type="email" value={draft.contacts.email} onChange={(v) => setContacts('email', v)} />
                <TextInput label="Telefono" value={draft.contacts.phone} onChange={(v) => setContacts('phone', v)} />
                <TextInput label="Telegram" help="Numero o @username" value={draft.contacts.telegram} onChange={(v) => setContacts('telegram', v)} />
                <TextInput label="Link Google Maps" value={draft.contacts.mapUrl} onChange={(v) => setContacts('mapUrl', v)} />
              </div>
              <TextInput label="Indirizzo (sede attività)" value={draft.contacts.address} onChange={(v) => setContacts('address', v)} />
            </Card>
            <Card title="Dati dell’associazione">
              <TextInput label="Ragione sociale" value={draft.legal.name} onChange={(v) => setLegal('name', v)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Sede sociale" value={draft.legal.address} onChange={(v) => setLegal('address', v)} />
                <TextInput label="P.IVA / Codice fiscale" value={draft.legal.taxCode} onChange={(v) => setLegal('taxCode', v)} />
              </div>
            </Card>
            <Card title="Social">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Facebook (URL)" value={draft.social.facebook} onChange={(v) => setSocial('facebook', v)} />
                <TextInput label="Instagram (URL)" value={draft.social.instagram} onChange={(v) => setSocial('instagram', v)} />
                <TextInput label="Telegram" value={draft.social.telegram} onChange={(v) => setSocial('telegram', v)} />
                <TextInput label="YouTube (URL)" value={draft.social.youtube} onChange={(v) => setSocial('youtube', v)} />
              </div>
            </Card>
          </>
        )}

        {tab === 'safeguarding' && (
          <Card title="Safeguarding">
            <RichEditor
              label="Testo"
              help="I documenti della categoria «Safeguarding» (sezione Documenti) vengono elencati automaticamente sotto questo testo."
              value={draft.safeguardingHtml}
              onChange={(v) => set('safeguardingHtml', v)}
            />
          </Card>
        )}

        {tab === 'legal' && (
          <>
            <Card title="Privacy policy">
              <RichEditor value={draft.privacyHtml} onChange={(v) => set('privacyHtml', v)} />
            </Card>
            <Card title="Cookie policy">
              <RichEditor value={draft.cookieHtml} onChange={(v) => set('cookieHtml', v)} />
            </Card>
          </>
        )}

        {tab === 'notify' && (
          <Card title="Email di notifica">
            <p className="text-sm text-zinc-600">
              Questi indirizzi ricevono un’email per ogni nuova iscrizione, per tutti gli eventi. Puoi aggiungere indirizzi specifici anche nelle impostazioni di ogni evento.
            </p>
            <StringListInput
              label="Indirizzi"
              values={draft.notifyEmails}
              onChange={(v) => set('notifyEmails', v)}
              placeholder="nome@esempio.it"
            />
          </Card>
        )}
      </div>

      <SaveBar dirty={dirty} saving={doc.saving} onReset={reset} onSave={() => run(() => doc.save(draft))} />
    </>
  );
}
