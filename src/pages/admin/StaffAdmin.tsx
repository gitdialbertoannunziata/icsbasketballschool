import { useMemo, useState } from 'react';
import type { StaffMember } from '@shared/types';
import { useAdminDoc, useDraft, useUnsavedWarning } from '../../lib/hooks';
import { newId } from '../../lib/format';
import { AdminError, AdminLoading, Button, Card, ConfirmButton, PageHeader, SaveBar, SelectInput, TextInput } from '../../components/admin/fields';
import { RichEditor } from '../../components/admin/RichEditor';
import { ImagesInput } from '../../components/admin/MediaInputs';
import { useSaveFeedback } from '../../components/admin/useSave';

const GROUPS: { value: StaffMember['group']; label: string }[] = [
  { value: 'staff', label: 'Staff tecnico' },
  { value: 'support', label: 'Supporto (psicologo, nutrizionista, osteopata…)' },
];

export default function StaffAdmin() {
  const doc = useAdminDoc('staff');
  const sorted = useMemo(() => (doc.data ? [...doc.data].sort((a, b) => a.order - b.order) : undefined), [doc.data]);
  const { draft, setDraft, dirty, reset } = useDraft(sorted);
  const [openId, setOpenId] = useState<string | null>(null);
  const run = useSaveFeedback();
  useUnsavedWarning(dirty);

  if (doc.isLoading) return <AdminLoading />;
  if (doc.error) return <AdminError error={doc.error} onRetry={doc.reload} />;
  if (!draft) return null;

  const updateMember = (id: string, patch: Partial<StaffMember>) => setDraft(draft.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const move = (group: StaffMember['group'], id: string, d: -1 | 1) => {
    const members = draft.filter((m) => m.group === group);
    const i = members.findIndex((m) => m.id === id);
    const j = i + d;
    if (j < 0 || j >= members.length) return;
    [members[i], members[j]] = [members[j], members[i]];
    const others = draft.filter((m) => m.group !== group);
    setDraft([...(group === 'staff' ? members : others), ...(group === 'staff' ? others : members)]);
  };

  const add = (group: StaffMember['group']) => {
    const m: StaffMember = { id: newId('staff'), name: '', role: '', group, photos: [], bioHtml: '', order: draft.length };
    setDraft([...draft, m]);
    setOpenId(m.id);
  };

  // L'ordine viene ricalcolato in base alla posizione nella lista.
  const save = () => run(() => doc.save(draft.map((m, i) => ({ ...m, order: i }))));

  return (
    <>
      <PageHeader title="Staff" description="Allenatori, preparatori e professionisti di supporto. Usa le frecce per cambiare l’ordine." />
      <div className="space-y-6">
        {GROUPS.map((g) => {
          const members = draft.filter((m) => m.group === g.value);
          return (
            <Card key={g.value} title={g.label} actions={<Button size="sm" onClick={() => add(g.value)}>+ Aggiungi persona</Button>}>
              {members.length === 0 && <p className="text-sm text-zinc-500">Nessuno.</p>}
              <ul className="space-y-2">
                {members.map((m, idx) => {
                  const open = openId === m.id;
                  return (
                    <li key={m.id} className="rounded-lg ring-1 ring-zinc-200">
                      <div className="flex items-center gap-3 p-3">
                        {m.photos[0] ? (
                          <img src={m.photos[0]} alt="" className="h-12 w-12 rounded-full object-cover" />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-zinc-200" />
                        )}
                        <button className="min-w-0 flex-1 text-left" onClick={() => setOpenId(open ? null : m.id)}>
                          <p className="font-medium text-zinc-900">{m.name || <em className="text-zinc-400">Senza nome</em>}</p>
                          <p className="text-xs text-zinc-500">{m.role}</p>
                        </button>
                        <Button size="sm" variant="ghost" title="Sposta su" onClick={() => move(g.value, m.id, -1)} disabled={idx === 0}>
                          ↑
                        </Button>
                        <Button size="sm" variant="ghost" title="Sposta giù" onClick={() => move(g.value, m.id, 1)} disabled={idx === members.length - 1}>
                          ↓
                        </Button>
                        <Button size="sm" onClick={() => setOpenId(open ? null : m.id)}>
                          {open ? 'Chiudi' : 'Modifica'}
                        </Button>
                      </div>
                      {open && (
                        <div className="space-y-4 border-t border-zinc-200 bg-zinc-50 p-4">
                          <div className="grid gap-4 sm:grid-cols-3">
                            <TextInput label="Nome e cognome" value={m.name} onChange={(v) => updateMember(m.id, { name: v })} />
                            <TextInput label="Ruolo" value={m.role} onChange={(v) => updateMember(m.id, { role: v })} />
                            <SelectInput label="Gruppo" value={m.group} options={GROUPS} onChange={(v) => updateMember(m.id, { group: v })} />
                          </div>
                          <ImagesInput label="Foto" values={m.photos} onChange={(v) => updateMember(m.id, { photos: v })} folder="images" />
                          <RichEditor label="Biografia" value={m.bioHtml} onChange={(v) => updateMember(m.id, { bioHtml: v })} />
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-zinc-700">Link (Instagram, sito…)</p>
                            {(m.links ?? []).map((l, i) => (
                              <div key={i} className="grid gap-2 sm:grid-cols-[200px_1fr_auto]">
                                <TextInput label="" placeholder="Etichetta" value={l.label} onChange={(v) => updateMember(m.id, { links: m.links!.map((x, j) => (j === i ? { ...x, label: v } : x)) })} />
                                <TextInput label="" placeholder="https://" value={l.url} onChange={(v) => updateMember(m.id, { links: m.links!.map((x, j) => (j === i ? { ...x, url: v } : x)) })} />
                                <Button variant="ghost" title="Rimuovi link" onClick={() => updateMember(m.id, { links: m.links!.filter((_, j) => j !== i) })}>
                                  ✕
                                </Button>
                              </div>
                            ))}
                            <Button size="sm" onClick={() => updateMember(m.id, { links: [...(m.links ?? []), { label: 'Instagram', url: '' }] })}>
                              + Link
                            </Button>
                          </div>
                          <div className="text-right">
                            <ConfirmButton size="sm" message={`Rimuovere ${m.name || 'questa persona'}?`} onConfirm={() => setDraft(draft.filter((x) => x.id !== m.id))}>
                              Rimuovi persona
                            </ConfirmButton>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })}
      </div>
      <SaveBar dirty={dirty} saving={doc.saving} onReset={reset} onSave={save} />
    </>
  );
}
