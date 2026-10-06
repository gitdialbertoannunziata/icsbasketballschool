import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAdmin } from '../lib/auth';
import { ConflictError, readContent, writeContent } from '../lib/blob';
import { checkUniqueness, contentSchemas } from '../lib/schemas';
import { CONTENT_NAMES, type ContentMap, type ContentName } from '../shared/types';

function parseName(req: HttpRequest): ContentName | undefined {
  const name = req.params.name as ContentName;
  return CONTENT_NAMES.includes(name) ? name : undefined;
}

/** Rimuove dalla vista pubblica bozze e dati riservati. */
export function toPublic(name: ContentName, data: unknown): unknown {
  switch (name) {
    case 'site': {
      const { notifyEmails: _n, confirmationBccEmails: _b, emailTemplates: _t, ...rest } = data as ContentMap['site'];
      return { ...rest, notifyEmails: [] };
    }
    case 'news':
      return (data as ContentMap['news'])
        .filter((n) => n.published)
        .sort((a, b) => b.date.localeCompare(a.date));
    case 'staff':
      return [...(data as ContentMap['staff'])].sort((a, b) => a.order - b.order);
    case 'events':
      return (data as ContentMap['events'])
        .filter((e) => e.status !== 'draft')
        .map((e) => ({ ...e, registration: { ...e.registration, notifyEmails: [] } }));
    case 'documents':
      return (data as ContentMap['documents']).filter((d) => d.public);
    case 'gallery':
      return (data as ContentMap['gallery']).filter((g) => g.published);
  }
  return data;
}

async function getPublic(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  const name = parseName(req);
  if (!name) return { status: 404, jsonBody: { error: 'Contenuto non trovato' } };
  try {
    const { data } = await readContent(name);
    return {
      jsonBody: toPublic(name, data),
      headers: { 'Cache-Control': 'public, max-age=60' },
    };
  } catch (err) {
    ctx.error(err);
    return { status: 500, jsonBody: { error: 'Errore nel caricamento dei contenuti' } };
  }
}

async function getAdmin(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const name = parseName(req);
  if (!name) return { status: 404, jsonBody: { error: 'Contenuto non trovato' } };
  try {
    const { data, etag } = await readContent(name);
    return { jsonBody: { data, etag }, headers: { 'Cache-Control': 'no-store' } };
  } catch (err) {
    ctx.error(err);
    return { status: 500, jsonBody: { error: 'Errore nel caricamento dei contenuti' } };
  }
}

async function putAdmin(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const name = parseName(req);
  if (!name) return { status: 404, jsonBody: { error: 'Contenuto non trovato' } };

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { status: 400, jsonBody: { error: 'JSON non valido' } };
  }
  const parsed = contentSchemas[name].safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues.slice(0, 5).map((i) => `${i.path.join('.')}: ${i.message}`);
    return { status: 400, jsonBody: { error: 'Dati non validi', issues } };
  }
  const dup = checkUniqueness(name, parsed.data);
  if (dup) return { status: 400, jsonBody: { error: dup } };

  try {
    const etag = await writeContent(name, parsed.data, req.headers.get('if-match') ?? undefined);
    ctx.log(`Contenuto "${name}" aggiornato`);
    return { jsonBody: { etag } };
  } catch (err) {
    if (err instanceof ConflictError) return { status: 409, jsonBody: { error: err.message } };
    ctx.error(err);
    return { status: 500, jsonBody: { error: 'Errore nel salvataggio' } };
  }
}

app.http('content-public', { methods: ['GET'], authLevel: 'anonymous', route: 'content/{name}', handler: getPublic });
app.http('content-admin-get', { methods: ['GET'], authLevel: 'anonymous', route: 'manage/content/{name}', handler: getAdmin });
app.http('content-admin-put', { methods: ['PUT'], authLevel: 'anonymous', route: 'manage/content/{name}', handler: putAdmin });
