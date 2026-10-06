import { randomUUID } from 'node:crypto';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAdmin } from '../lib/auth';
import { container, readBlobJson, readContent, sasUrl, writeBlobJson } from '../lib/blob';
import { escapeHtml, sendMail } from '../lib/email';
import { DEFAULT_CONFIRMATION_MESSAGE, renderTemplate, resolveTemplate, type EmailVars } from '../shared/emailTemplates';
import { isRegistrationOpen, validateRegistration, type FormValue } from '../lib/registrationValidation';
import { safeFileName } from './upload';
import {
  REGISTRATION_STATUSES,
  type EventAvailability,
  type EventItem,
  type Registration,
  type RegistrationStatus,
  type SiteContent,
} from '../shared/types';

const ID_RE = /^[a-zA-Z0-9-]{1,100}$/;

// ---------- Disponibilità ----------

interface RegIndexEntry {
  blobName: string;
  sessionId?: string;
  status: RegistrationStatus;
}

async function listRegistrationBlobs(eventId: string): Promise<RegIndexEntry[]> {
  const out: RegIndexEntry[] = [];
  for await (const b of container('registrations').listBlobsFlat({ prefix: `${eventId}/`, includeMetadata: true })) {
    if (!b.name.endsWith('/data.json')) continue;
    out.push({
      blobName: b.name,
      sessionId: b.metadata?.sessionid || undefined,
      status: (b.metadata?.status as RegistrationStatus) || 'nuova',
    });
  }
  return out;
}

export function computeAvailability(ev: EventItem, regs: { sessionId?: string; status: RegistrationStatus }[]): EventAvailability {
  const sessions: EventAvailability['sessions'] = {};
  for (const s of ev.sessions) {
    const taken = regs.filter((r) => r.sessionId === s.id && r.status !== 'annullata').length;
    const available = s.capacity != null ? Math.max(0, s.capacity - taken) : undefined;
    sessions[s.id] = { taken, capacity: s.capacity, available, soldOut: !!s.soldOut || available === 0 };
  }
  return { sessions };
}

async function findEvent(eventId: string): Promise<EventItem | undefined> {
  const { data } = await readContent('events');
  return data.find((e) => e.id === eventId);
}

async function getAvailability(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  const eventId = req.params.eventId;
  if (!ID_RE.test(eventId)) return { status: 400 };
  try {
    const ev = await findEvent(eventId);
    if (!ev || ev.status === 'draft') return { status: 404, jsonBody: { error: 'Evento non trovato' } };
    const availability = computeAvailability(ev, await listRegistrationBlobs(eventId));
    // Al pubblico mostriamo solo posti residui ed esaurito, non il numero di iscritti.
    for (const s of Object.values(availability.sessions)) s.taken = 0;
    return { jsonBody: availability, headers: { 'Cache-Control': 'no-store' } };
  } catch (err) {
    ctx.error(err);
    return { status: 500, jsonBody: { error: 'Errore' } };
  }
}

// ---------- Invio iscrizione (pubblico) ----------

const hits = new Map<string, number[]>();
function rateLimited(ip: string, max = 8, windowMs = 10 * 60_000): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > max;
}

function clientIp(req: HttpRequest): string {
  return (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
}

function summaryTable(ev: EventItem, reg: Registration): string {
  const rows: string[] = [];
  const session = ev.sessions.find((s) => s.id === reg.sessionId);
  if (session) rows.push(`<tr><th align="left">Turno</th><td>${escapeHtml(session.label)}</td></tr>`);
  let section = '';
  for (const f of ev.registration.fields) {
    if (f.type === 'session') continue;
    if (f.section && f.section !== section) {
      section = f.section;
      rows.push(`<tr><th colspan="2" align="left" style="padding-top:12px">${escapeHtml(section)}</th></tr>`);
    }
    let v: string;
    if (f.type === 'file') v = reg.files.find((x) => x.fieldId === f.id)?.name ?? '—';
    else {
      const raw = reg.values[f.id];
      v = typeof raw === 'boolean' ? (raw ? 'Sì' : 'No') : raw || '—';
    }
    rows.push(`<tr><th align="left" style="padding-right:12px">${escapeHtml(f.label)}</th><td>${escapeHtml(String(v))}</td></tr>`);
  }
  return `<table cellpadding="4" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">${rows.join('')}</table>`;
}

export function registrationEmailVars(ev: EventItem, reg: Registration, site: SiteContent): EmailVars {
  const siteUrl = process.env.PUBLIC_SITE_URL ?? '';
  const adminUrl = `${siteUrl}/admin/iscrizioni?evento=${encodeURIComponent(ev.id)}`;
  const name = [reg.values.nome, reg.values.cognome].filter((v) => typeof v === 'string' && v).join(' ');
  return {
    text: {
      evento: ev.title,
      nome: name,
      turno: ev.sessions.find((s) => s.id === reg.sessionId)?.label ?? '',
      codice: reg.id,
      messaggio: ev.registration.confirmationMessage || DEFAULT_CONFIRMATION_MESSAGE,
      sito: site.name,
      contatto: site.contacts.email,
      email: reg.email ?? '',
      allegati: String(reg.files.length),
    },
    html: {
      riepilogo: summaryTable(ev, reg),
      link: `<a href="${escapeHtml(adminUrl)}">Apri nel pannello</a>`,
    },
  };
}

async function submitRegistration(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  const eventId = req.params.eventId;
  if (!ID_RE.test(eventId)) return { status: 400, jsonBody: { error: 'Evento non valido' } };
  if (rateLimited(clientIp(req))) {
    return { status: 429, jsonBody: { error: 'Troppe richieste, riprova tra qualche minuto.' } };
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return { status: 400, jsonBody: { error: 'Richiesta non valida' } };
  }
  // Honeypot anti-spam: campo nascosto che gli utenti reali lasciano vuoto.
  if (form.get('_website')) return { status: 200, jsonBody: { ok: true } };

  const ev = await findEvent(eventId);
  if (!ev || !isRegistrationOpen(ev)) {
    return { status: 400, jsonBody: { error: 'Le iscrizioni per questo evento non sono aperte.' } };
  }

  const existing = await listRegistrationBlobs(eventId);
  const availability = computeAvailability(ev, existing);
  const result = validateRegistration(ev, (n) => form.get(n) as FormValue, availability);
  if (!result.ok) return { status: 400, jsonBody: { error: 'Controlla i campi evidenziati', fields: result.errors } };

  const id = `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID().slice(0, 8)}`;
  const prefix = `${eventId}/${id}`;
  const regs = container('registrations');

  const files: Registration['files'] = [];
  for (const { fieldId, file } of result.data.files) {
    const blobName = `${prefix}/${fieldId}-${safeFileName(file.name)}`;
    const buf = Buffer.from(await (file as unknown as Blob).arrayBuffer());
    await regs.getBlockBlobClient(blobName).uploadData(buf, { blobHTTPHeaders: { blobContentType: file.type } });
    files.push({ fieldId, name: file.name, blobName, size: file.size, contentType: file.type });
  }

  const reg: Registration = {
    id,
    eventId,
    eventTitle: ev.title,
    sessionId: result.data.sessionId,
    createdAt: new Date().toISOString(),
    status: 'nuova',
    values: result.data.values,
    files,
    email: result.data.email,
  };
  await writeBlobJson(regs, `${prefix}/data.json`, reg, {
    metadata: { status: reg.status, sessionid: reg.sessionId ?? '' },
  });
  ctx.log(`Nuova iscrizione ${id} per ${eventId}`);

  const { data: site } = await readContent('site');
  const vars = registrationEmailVars(ev, reg, site);
  const notify = [...ev.registration.notifyEmails, ...site.notifyEmails];
  const confirmation = renderTemplate(resolveTemplate('confirmation', site.emailTemplates), vars);
  const notification = renderTemplate(resolveTemplate('notification', site.emailTemplates), vars);
  await Promise.all([
    reg.email
      ? sendMail(
          {
            to: [reg.email],
            bcc: site.confirmationBccEmails,
            replyTo: site.contacts.email || undefined,
            ...confirmation,
          },
          ctx,
        )
      : Promise.resolve(),
    sendMail({ to: notify, replyTo: reg.email, ...notification }, ctx),
  ]);

  return { status: 201, jsonBody: { ok: true, id } };
}

// ---------- Gestione (admin) ----------

async function loadRegistrations(eventId?: string): Promise<Registration[]> {
  const regs = container('registrations');
  const out: Registration[] = [];
  for await (const b of regs.listBlobsFlat({ prefix: eventId ? `${eventId}/` : undefined })) {
    if (!b.name.endsWith('/data.json')) continue;
    const r = await readBlobJson<Registration>(regs, b.name);
    if (r) out.push(r.data);
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function csvCell(v: unknown): string {
  const s = v == null ? '' : typeof v === 'boolean' ? (v ? 'Sì' : 'No') : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(ev: EventItem | undefined, list: Registration[]): string {
  const fields = (ev?.registration.fields ?? []).filter((f) => f.type !== 'file' && f.type !== 'session');
  const header = ['Codice', 'Data', 'Stato', 'Turno', ...fields.map((f) => (f.section ? `${f.section} - ${f.label}` : f.label)), 'Allegati', 'Note'];
  const lines = [header.map(csvCell).join(';')];
  for (const r of list) {
    const session = ev?.sessions.find((s) => s.id === r.sessionId)?.label ?? r.sessionId ?? '';
    lines.push(
      [
        r.id,
        new Date(r.createdAt).toLocaleString('it-IT', { timeZone: 'Europe/Rome' }),
        r.status,
        session,
        ...fields.map((f) => r.values[f.id]),
        r.files.map((f) => f.name).join(', '),
        r.notes ?? '',
      ]
        .map(csvCell)
        .join(';'),
    );
  }
  // BOM per far riconoscere UTF-8 a Excel
  return '﻿' + lines.join('\r\n');
}

async function listAdmin(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const eventId = req.query.get('eventId') ?? undefined;
  if (eventId && !ID_RE.test(eventId)) return { status: 400 };
  try {
    const list = await loadRegistrations(eventId);
    const { data: events } = await readContent('events');
    const ev = events.find((e) => e.id === eventId);
    if (req.query.get('format') === 'csv') {
      return {
        body: toCsv(ev, list),
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="iscrizioni-${eventId ?? 'tutte'}.csv"`,
          'Cache-Control': 'no-store',
        },
      };
    }
    const availability = ev ? computeAvailability(ev, list) : undefined;
    return { jsonBody: { registrations: list, availability }, headers: { 'Cache-Control': 'no-store' } };
  } catch (err) {
    ctx.error(err);
    return { status: 500, jsonBody: { error: 'Errore nel caricamento delle iscrizioni' } };
  }
}

async function updateAdmin(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { eventId, id } = req.params;
  if (!ID_RE.test(eventId) || !ID_RE.test(id)) return { status: 400 };
  const body = (await req.json().catch(() => ({}))) as { status?: RegistrationStatus; notes?: string };
  if (body.status && !REGISTRATION_STATUSES.includes(body.status)) {
    return { status: 400, jsonBody: { error: 'Stato non valido' } };
  }
  const regs = container('registrations');
  const blobName = `${eventId}/${id}/data.json`;
  try {
    const current = await readBlobJson<Registration>(regs, blobName);
    if (!current) return { status: 404, jsonBody: { error: 'Iscrizione non trovata' } };
    const updated: Registration = {
      ...current.data,
      status: body.status ?? current.data.status,
      notes: body.notes !== undefined ? body.notes.slice(0, 5000) : current.data.notes,
    };
    await writeBlobJson(regs, blobName, updated, {
      etag: current.etag,
      metadata: { status: updated.status, sessionid: updated.sessionId ?? '' },
    });
    return { jsonBody: updated };
  } catch (err) {
    ctx.error(err);
    return { status: 500, jsonBody: { error: 'Errore nel salvataggio' } };
  }
}

async function deleteAdmin(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { eventId, id } = req.params;
  if (!ID_RE.test(eventId) || !ID_RE.test(id)) return { status: 400 };
  const regs = container('registrations');
  try {
    for await (const b of regs.listBlobsFlat({ prefix: `${eventId}/${id}/` })) await regs.deleteBlob(b.name);
    return { status: 204 };
  } catch (err) {
    ctx.error(err);
    return { status: 500, jsonBody: { error: 'Errore nella cancellazione' } };
  }
}

async function fileAdmin(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { eventId, id } = req.params;
  const index = Number(req.params.index);
  if (!ID_RE.test(eventId) || !ID_RE.test(id) || !Number.isInteger(index)) return { status: 400 };
  const regs = container('registrations');
  try {
    const current = await readBlobJson<Registration>(regs, `${eventId}/${id}/data.json`);
    const file = current?.data.files[index];
    if (!file) return { status: 404 };
    const url = await sasUrl(regs, file.blobName, 'r', 5, {
      contentDisposition: `inline; filename="${safeFileName(file.name)}"`,
    });
    return { status: 302, headers: { Location: url, 'Cache-Control': 'no-store' } };
  } catch (err) {
    ctx.error(err);
    return { status: 500 };
  }
}

app.http('event-availability', { methods: ['GET'], authLevel: 'anonymous', route: 'events/{eventId}/availability', handler: getAvailability });
app.http('registration-submit', { methods: ['POST'], authLevel: 'anonymous', route: 'registrations/{eventId}', handler: submitRegistration });
app.http('registrations-list', { methods: ['GET'], authLevel: 'anonymous', route: 'manage/registrations', handler: listAdmin });
app.http('registration-update', { methods: ['PATCH'], authLevel: 'anonymous', route: 'manage/registrations/{eventId}/{id}', handler: updateAdmin });
app.http('registration-delete', { methods: ['DELETE'], authLevel: 'anonymous', route: 'manage/registrations/{eventId}/{id}', handler: deleteAdmin });
app.http('registration-file', { methods: ['GET'], authLevel: 'anonymous', route: 'manage/registrations/{eventId}/{id}/files/{index}', handler: fileAdmin });
