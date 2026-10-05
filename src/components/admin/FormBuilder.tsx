import type { FormField, FormFieldType } from '@shared/types';
import { Button, inputCls } from './fields';

const TYPES: { value: FormFieldType; label: string }[] = [
  { value: 'text', label: 'Testo breve' },
  { value: 'textarea', label: 'Testo lungo' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Telefono' },
  { value: 'date', label: 'Data' },
  { value: 'select', label: 'Menu a tendina' },
  { value: 'radio', label: 'Scelta singola (Sì/No…)' },
  { value: 'checkbox', label: 'Casella di spunta' },
  { value: 'file', label: 'Allegato (PDF/immagine)' },
  { value: 'session', label: 'Scelta del turno/settimana' },
];

function fieldIdFromLabel(label: string, existing: string[]) {
  const base =
    label
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+(.)?/g, (_, c: string | undefined) => (c ? c.toUpperCase() : ''))
      .replace(/^[^a-zA-Z]+/, '')
      .replace(/^./, (c) => c.toLowerCase())
      .slice(0, 40) || 'campo';
  let id = base;
  let i = 2;
  while (existing.includes(id)) id = `${base}${i++}`;
  return id;
}

/** Costruttore visuale del modulo di iscrizione. */
export function FormBuilder({ fields, onChange }: { fields: FormField[]; onChange: (f: FormField[]) => void }) {
  const setField = (i: number, patch: Partial<FormField>) => onChange(fields.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= fields.length) return;
    const next = [...fields];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = () => {
    const lastSection = fields[fields.length - 1]?.section;
    onChange([...fields, { id: fieldIdFromLabel('nuovo campo', fields.map((f) => f.id)), label: 'Nuovo campo', type: 'text', required: false, section: lastSection }]);
  };

  return (
    <div className="space-y-3">
      {fields.length === 0 && <p className="text-sm text-zinc-500">Il modulo non ha ancora campi.</p>}
      {fields.map((f, i) => {
        const newSection = f.section && f.section !== fields[i - 1]?.section;
        return (
          <div key={i}>
            {newSection && <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-brand-dark">Sezione: {f.section}</p>}
            <div className="rounded-lg bg-zinc-50 p-4 ring-1 ring-zinc-200">
              <div className="grid gap-3 md:grid-cols-[1fr_200px_160px]">
                <input
                  className={inputCls}
                  value={f.label}
                  placeholder="Etichetta del campo"
                  onChange={(e) => setField(i, { label: e.target.value })}
                  onBlur={(e) => {
                    // Gli ID generici vengono rigenerati dall'etichetta per avere export CSV leggibili.
                    if (/^nuovoCampo\d*$/.test(f.id)) setField(i, { id: fieldIdFromLabel(e.target.value, fields.filter((_, j) => j !== i).map((x) => x.id)) });
                  }}
                />
                <select className={inputCls} value={f.type} onChange={(e) => setField(i, { type: e.target.value as FormFieldType })}>
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <input className={inputCls} value={f.section ?? ''} placeholder="Sezione (es. Atleta)" onChange={(e) => setField(i, { section: e.target.value || undefined })} />
              </div>
              {(f.type === 'select' || f.type === 'radio') && (
                <input
                  className={`${inputCls} mt-3`}
                  value={(f.options ?? []).join(', ')}
                  placeholder="Opzioni separate da virgola, es. S, M, L, XL"
                  onChange={(e) => setField(i, { options: e.target.value.split(',').map((o) => o.trim()).filter(Boolean) })}
                />
              )}
              <input
                className={`${inputCls} mt-3`}
                value={f.help ?? ''}
                placeholder="Testo di aiuto (facoltativo)"
                onChange={(e) => setField(i, { help: e.target.value || undefined })}
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={f.required} onChange={(e) => setField(i, { required: e.target.checked })} className="accent-[#c05c03]" />
                  Obbligatorio
                </label>
                <span className="text-xs text-zinc-400">ID: {f.id}</span>
                <div className="ml-auto flex gap-1">
                  <Button size="sm" variant="ghost" title="Sposta su" onClick={() => move(i, -1)}>
                    ↑
                  </Button>
                  <Button size="sm" variant="ghost" title="Sposta giù" onClick={() => move(i, 1)}>
                    ↓
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => onChange(fields.filter((_, j) => j !== i))}>
                    Rimuovi
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <Button onClick={add}>+ Aggiungi campo</Button>
    </div>
  );
}

/** Modello di modulo standard (atleta + genitore) usato come punto di partenza. */
export function standardFields(): FormField[] {
  return [
    { id: 'settimana', label: 'Seleziona la settimana', type: 'session', required: true },
    { id: 'cognome', label: 'Cognome', type: 'text', required: true, section: 'Dati atleta' },
    { id: 'nome', label: 'Nome', type: 'text', required: true, section: 'Dati atleta' },
    { id: 'dataNascita', label: 'Data di nascita', type: 'date', required: true, section: 'Dati atleta' },
    { id: 'luogoNascita', label: 'Luogo di nascita', type: 'text', required: true, section: 'Dati atleta' },
    { id: 'codiceFiscale', label: 'Codice fiscale', type: 'text', required: true, section: 'Dati atleta' },
    { id: 'email', label: 'Email', type: 'email', required: true, section: 'Dati atleta' },
    { id: 'societa', label: 'Società di appartenenza', type: 'text', required: true, section: 'Dati atleta' },
    { id: 'ricevuta', label: 'Contabile/ricevuta versamento (acconto)', type: 'file', required: true, section: 'Dati atleta' },
    { id: 'genitoreCognome', label: 'Cognome', type: 'text', required: true, section: 'Dati genitore (per ricevuta)' },
    { id: 'genitoreNome', label: 'Nome', type: 'text', required: true, section: 'Dati genitore (per ricevuta)' },
    { id: 'genitoreCodiceFiscale', label: 'Codice fiscale', type: 'text', required: true, section: 'Dati genitore (per ricevuta)' },
    { id: 'genitoreTelefono', label: 'Telefono', type: 'tel', required: true, section: 'Dati genitore (per ricevuta)' },
    { id: 'genitoreEmail', label: 'Email', type: 'email', required: true, section: 'Dati genitore (per ricevuta)' },
  ];
}
