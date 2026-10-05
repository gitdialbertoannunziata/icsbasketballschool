import type { EventAvailability, EventItem } from '../shared/types';

export interface FileLike {
  name: string;
  size: number;
  type: string;
}

export type FormValue = string | FileLike | null;

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CF_RE = /^[A-Z0-9]{16}$/;

export interface ValidRegistration {
  values: Record<string, string | boolean>;
  files: { fieldId: string; file: FileLike }[];
  sessionId?: string;
  email?: string;
}

export type ValidationResult = { ok: true; data: ValidRegistration } | { ok: false; errors: Record<string, string> };

function isFile(v: FormValue): v is FileLike {
  return typeof v === 'object' && v !== null && typeof (v as FileLike).size === 'number';
}

export function isRegistrationOpen(ev: EventItem, now = new Date()): boolean {
  const r = ev.registration;
  if (!r.enabled || ev.status !== 'published') return false;
  if (r.opensAt && now < new Date(r.opensAt)) return false;
  if (r.closesAt && now > new Date(r.closesAt)) return false;
  return true;
}

/** Valida i dati inviati rispetto alla configurazione del modulo dell'evento. */
export function validateRegistration(
  ev: EventItem,
  get: (name: string) => FormValue,
  availability: EventAvailability,
): ValidationResult {
  const errors: Record<string, string> = {};
  const values: Record<string, string | boolean> = {};
  const files: ValidRegistration['files'] = [];
  let sessionId: string | undefined;
  let email: string | undefined;

  for (const f of ev.registration.fields) {
    const raw = get(f.id);

    if (f.type === 'file') {
      if (!isFile(raw) || raw.size === 0) {
        if (f.required) errors[f.id] = 'File obbligatorio';
        continue;
      }
      if (raw.size > MAX_FILE_BYTES) errors[f.id] = 'Il file supera i 10 MB';
      else if (!ALLOWED_FILE_TYPES.includes(raw.type)) errors[f.id] = 'Formato non supportato (PDF o immagine)';
      else files.push({ fieldId: f.id, file: raw });
      continue;
    }

    if (f.type === 'checkbox') {
      const checked = raw === 'on' || raw === 'true' || raw === 'Sì';
      if (f.required && !checked) errors[f.id] = 'Campo obbligatorio';
      values[f.id] = checked;
      continue;
    }

    const value = typeof raw === 'string' ? raw.trim() : '';
    if (!value) {
      if (f.required) errors[f.id] = 'Campo obbligatorio';
      continue;
    }
    if (value.length > 2000) {
      errors[f.id] = 'Testo troppo lungo';
      continue;
    }

    switch (f.type) {
      case 'email':
        if (!EMAIL_RE.test(value)) errors[f.id] = 'Email non valida';
        else email ??= value;
        break;
      case 'date':
        if (!DATE_RE.test(value) || Number.isNaN(Date.parse(value))) errors[f.id] = 'Data non valida';
        break;
      case 'select':
      case 'radio':
        if (f.options?.length && !f.options.includes(value)) errors[f.id] = 'Valore non valido';
        break;
      case 'session': {
        const s = ev.sessions.find((x) => x.id === value);
        const a = availability.sessions[value];
        if (!s) errors[f.id] = 'Turno non valido';
        else if (s.soldOut || a?.soldOut) errors[f.id] = 'Turno esaurito';
        else sessionId = s.id;
        break;
      }
      case 'text':
        if (/codice\s*fiscale/i.test(f.label) && !CF_RE.test(value.toUpperCase())) {
          errors[f.id] = 'Codice fiscale non valido';
        }
        break;
    }
    values[f.id] = /codice\s*fiscale/i.test(f.label) ? value.toUpperCase() : value;
  }

  // Se l'evento ha un solo turno e il modulo non lo chiede, assegnalo automaticamente.
  if (!sessionId && ev.sessions.length === 1 && !ev.registration.fields.some((f) => f.type === 'session')) {
    const only = ev.sessions[0];
    if (only.soldOut || availability.sessions[only.id]?.soldOut) errors._session = 'Posti esauriti';
    else sessionId = only.id;
  }

  const consent = get('_consent');
  if (consent !== 'on' && consent !== 'true') errors._consent = 'È necessario accettare la privacy policy';

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { values, files, sessionId, email } };
}
