// Modelli delle email di iscrizione, condivisi tra API (invio) e pannello (testi predefiniti e anteprima).
// Questo file NON deve importare librerie esterne: viene incluso anche nella build del frontend.

import type { EmailTemplate, EmailTemplates } from './types';

export type EmailTemplateKind = keyof EmailTemplates;

export const EMAIL_PLACEHOLDERS: { key: string; label: string; only?: EmailTemplateKind }[] = [
  { key: 'evento', label: 'Titolo dell’evento' },
  { key: 'nome', label: 'Nome e cognome indicati nel modulo' },
  { key: 'turno', label: 'Turno / settimana scelta' },
  { key: 'codice', label: 'Codice pratica' },
  { key: 'riepilogo', label: 'Tabella con tutti i dati inseriti' },
  { key: 'messaggio', label: 'Messaggio di conferma dell’evento', only: 'confirmation' },
  { key: 'sito', label: 'Nome dell’associazione' },
  { key: 'contatto', label: 'Email di contatto del sito' },
  { key: 'email', label: 'Email di chi si iscrive' },
  { key: 'allegati', label: 'Numero di allegati', only: 'notification' },
  { key: 'link', label: 'Link alle iscrizioni nel pannello', only: 'notification' },
];

export const DEFAULT_EMAIL_TEMPLATES: Required<EmailTemplates> = {
  confirmation: {
    subject: 'Richiesta di iscrizione ricevuta – {{evento}}',
    bodyHtml:
      '<p>Grazie! Abbiamo ricevuto la tua richiesta di iscrizione a <strong>{{evento}}</strong>.</p>' +
      '<p>{{messaggio}}</p>' +
      '<p>{{riepilogo}}</p>' +
      '<p>Codice pratica: <strong>{{codice}}</strong></p>' +
      '<p>{{sito}} – {{contatto}}</p>',
  },
  notification: {
    subject: 'Nuova iscrizione: {{evento}} ({{codice}})',
    bodyHtml:
      '<p>Nuova iscrizione ricevuta per <strong>{{evento}}</strong>.</p>' +
      '<p>{{riepilogo}}</p>' +
      '<p>Allegati: {{allegati}}. {{link}}</p>',
  },
};

export const DEFAULT_CONFIRMATION_MESSAGE = 'Ti contatteremo a breve per la conferma definitiva.';

/** Valori dei segnaposto: testo semplice, tranne quelli in `html` già pronti come HTML. */
export interface EmailVars {
  text: Record<string, string>;
  html?: Record<string, string>;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const PLACEHOLDER_RE = /\{\{\s*([a-z_]+)\s*\}\}/g;

/** Usa il modello personalizzato se presente, altrimenti quello predefinito (campo per campo). */
export function resolveTemplate(kind: EmailTemplateKind, custom?: EmailTemplates): EmailTemplate {
  const def = DEFAULT_EMAIL_TEMPLATES[kind];
  const c = custom?.[kind];
  return { subject: c?.subject?.trim() || def.subject, bodyHtml: c?.bodyHtml?.trim() || def.bodyHtml };
}

export function renderTemplate(tpl: EmailTemplate, vars: EmailVars): { subject: string; html: string } {
  const html = vars.html ?? {};
  const subject = tpl.subject
    .replace(PLACEHOLDER_RE, (m, k: string) => (k in vars.text ? vars.text[k] : m))
    .replace(/\s+/g, ' ')
    .trim();
  const body = tpl.bodyHtml
    // Un blocco HTML (es. la tabella) da solo in un paragrafo sostituisce l'intero <p>.
    .replace(/<p>\s*\{\{\s*([a-z_]+)\s*\}\}\s*<\/p>/g, (m, k: string) => (k in html ? html[k] : m))
    .replace(PLACEHOLDER_RE, (m, k: string) => (k in html ? html[k] : k in vars.text ? escapeHtml(vars.text[k]) : m))
    // Paragrafi rimasti vuoti (segnaposto senza valore).
    .replace(/<p>\s*(?:–\s*)?<\/p>/g, '');
  return { subject, html: body };
}
