import { describe, expect, it } from 'vitest';
import type { EventItem } from '../shared/types';
import { computeAvailability, toCsv } from '../functions/registrations';
import { toPublic } from '../functions/content';
import { isRegistrationOpen, validateRegistration, type FormValue } from './registrationValidation';
import { eventsSchema } from './schemas';

function makeEvent(overrides: Partial<EventItem> = {}): EventItem {
  return {
    id: 'camp-2026',
    slug: 'camp-2026',
    title: 'Camp 2026',
    status: 'published',
    sessions: [
      { id: 'w1', label: 'Short week', start: '2026-07-12', end: '2026-07-16', capacity: 2 },
      { id: 'w2', label: 'Long week', start: '2026-07-19', end: '2026-07-25', soldOut: true },
    ],
    pricing: [],
    scheduleItems: [],
    documentIds: [],
    galleryAlbumIds: [],
    registration: {
      enabled: true,
      consentText: 'Privacy',
      notifyEmails: ['segreteria@example.com'],
      fields: [
        { id: 'settimana', label: 'Settimana', type: 'session', required: true },
        { id: 'cognome', label: 'Cognome', type: 'text', required: true, section: 'Atleta' },
        { id: 'cf', label: 'Codice fiscale', type: 'text', required: true, section: 'Atleta' },
        { id: 'email', label: 'Email', type: 'email', required: true, section: 'Atleta' },
        { id: 'nascita', label: 'Data di nascita', type: 'date', required: true },
        { id: 'taglia', label: 'Taglia', type: 'select', required: true, options: ['S', 'M', 'L', 'XL'] },
        { id: 'ricevuta', label: 'Ricevuta', type: 'file', required: true },
        { id: 'certificato', label: 'Certificato', type: 'file', required: false },
      ],
    },
    ...overrides,
  };
}

const validInput: Record<string, FormValue> = {
  settimana: 'w1',
  cognome: 'Rossi',
  cf: 'rssmra10a01l219x',
  email: 'mario@example.com',
  nascita: '2010-01-01',
  taglia: 'M',
  ricevuta: { name: 'bonifico.pdf', size: 1000, type: 'application/pdf' },
  _consent: 'on',
};

const getter = (o: Record<string, FormValue>) => (k: string) => o[k] ?? null;

describe('validateRegistration', () => {
  const ev = makeEvent();
  const avail = computeAvailability(ev, []);

  it('accetta dati validi e normalizza il codice fiscale', () => {
    const r = validateRegistration(ev, getter(validInput), avail);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.sessionId).toBe('w1');
      expect(r.data.email).toBe('mario@example.com');
      expect(r.data.values.cf).toBe('RSSMRA10A01L219X');
      expect(r.data.files).toHaveLength(1);
    }
  });

  it('segnala campi obbligatori, email, opzioni e consenso', () => {
    const r = validateRegistration(
      ev,
      getter({ ...validInput, cognome: '', email: 'x', taglia: 'XXL', ricevuta: null, _consent: null }),
      avail,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.errors).sort()).toEqual(['_consent', 'cognome', 'email', 'ricevuta', 'taglia']);
    }
  });

  it('rifiuta turni esauriti o pieni', () => {
    expect(validateRegistration(ev, getter({ ...validInput, settimana: 'w2' }), avail).ok).toBe(false);
    const full = computeAvailability(ev, [
      { sessionId: 'w1', status: 'nuova' },
      { sessionId: 'w1', status: 'pagata' },
    ]);
    expect(full.sessions.w1).toMatchObject({ available: 0, soldOut: true });
    expect(validateRegistration(ev, getter(validInput), full).ok).toBe(false);
  });

  it('non conta le iscrizioni annullate', () => {
    const a = computeAvailability(ev, [
      { sessionId: 'w1', status: 'annullata' },
      { sessionId: 'w1', status: 'nuova' },
    ]);
    expect(a.sessions.w1.available).toBe(1);
  });

  it('rifiuta file troppo grandi o di tipo non ammesso', () => {
    const big = validateRegistration(
      ev,
      getter({ ...validInput, ricevuta: { name: 'a.pdf', size: 20 * 1024 * 1024, type: 'application/pdf' } }),
      avail,
    );
    const exe = validateRegistration(
      ev,
      getter({ ...validInput, ricevuta: { name: 'a.exe', size: 10, type: 'application/x-msdownload' } }),
      avail,
    );
    expect(big.ok).toBe(false);
    expect(exe.ok).toBe(false);
  });

  it('assegna automaticamente l’unico turno se il modulo non lo chiede', () => {
    const single = makeEvent({
      sessions: [{ id: 'unico', label: 'Stagione', start: '2026-09-01', end: '2027-06-30' }],
    });
    single.registration.fields = single.registration.fields.filter((f) => f.type !== 'session');
    const r = validateRegistration(single, getter(validInput), computeAvailability(single, []));
    expect(r.ok && r.data.sessionId).toBe('unico');
  });
});

describe('isRegistrationOpen', () => {
  it('rispetta stato e finestra temporale', () => {
    expect(isRegistrationOpen(makeEvent())).toBe(true);
    expect(isRegistrationOpen(makeEvent({ status: 'archived' }))).toBe(false);
    const ev = makeEvent();
    ev.registration.closesAt = '2020-01-01';
    expect(isRegistrationOpen(ev)).toBe(false);
  });
});

describe('toPublic', () => {
  it('nasconde bozze ed email di notifica', () => {
    const events = [makeEvent(), makeEvent({ id: 'b', slug: 'b', status: 'draft' })];
    const pub = toPublic('events', events) as EventItem[];
    expect(pub).toHaveLength(1);
    expect(pub[0].registration.notifyEmails).toEqual([]);
  });
});

describe('schemas & csv', () => {
  it('lo schema eventi accetta un evento valido e rifiuta slug non validi', () => {
    expect(eventsSchema.safeParse([makeEvent()]).success).toBe(true);
    expect(eventsSchema.safeParse([makeEvent({ slug: 'Non Valido' })]).success).toBe(false);
  });

  it('esporta CSV con separatore ; ed escape', () => {
    const ev = makeEvent();
    const csv = toCsv(ev, [
      {
        id: 'r1',
        eventId: ev.id,
        eventTitle: ev.title,
        sessionId: 'w1',
        createdAt: '2026-03-01T10:00:00Z',
        status: 'nuova',
        values: { cognome: 'De "Luca"; Jr', cf: 'X', email: 'a@b.it', nascita: '2010-01-01', taglia: 'M' },
        files: [],
      },
    ]);
    expect(csv.startsWith('﻿Codice;Data;Stato;Turno')).toBe(true);
    expect(csv).toContain('"De ""Luca""; Jr"');
    expect(csv).toContain('Short week');
  });
});
