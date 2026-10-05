import { randomUUID } from 'node:crypto';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAdmin } from '../lib/auth';
import { container, mediaBlobNameFromUrl, mediaPublicUrl, sasUrl } from '../lib/blob';
import type { UploadTicket } from '../shared/types';

const ALLOWED = [
  /^image\/(jpeg|png|webp|gif|svg\+xml|avif)$/,
  /^video\/(mp4|webm|quicktime)$/,
  /^application\/pdf$/,
  /^application\/(msword|vnd\.openxmlformats-officedocument\.[a-z.]+|vnd\.ms-excel)$/,
];
const FOLDER_RE = /^(images|docs|videos|gallery\/[a-z0-9-]{1,100})$/;

export function safeFileName(name: string): string {
  const base = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return base.slice(-120) || 'file';
}

async function createUpload(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as { folder?: string; fileName?: string; contentType?: string };
  const folder = body.folder ?? 'images';
  const contentType = body.contentType ?? '';
  if (!FOLDER_RE.test(folder)) return { status: 400, jsonBody: { error: 'Cartella non valida' } };
  if (!ALLOWED.some((re) => re.test(contentType))) {
    return { status: 400, jsonBody: { error: `Tipo di file non consentito: ${contentType || 'sconosciuto'}` } };
  }
  const year = new Date().getFullYear();
  const blobName = `${folder}/${year}/${randomUUID().slice(0, 8)}-${safeFileName(body.fileName ?? 'file')}`;
  try {
    const uploadUrl = await sasUrl(container('media'), blobName, 'cw', 30);
    const ticket: UploadTicket = { uploadUrl, url: mediaPublicUrl(blobName), blobName };
    return { jsonBody: ticket };
  } catch (err) {
    ctx.error(err);
    return { status: 500, jsonBody: { error: 'Impossibile preparare il caricamento' } };
  }
}

async function deleteMedia(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const url = req.query.get('url') ?? '';
  const blobName = mediaBlobNameFromUrl(url);
  // Gli URL esterni (es. vecchio sito, YouTube) non sono nostri: nulla da cancellare.
  if (!blobName) return { status: 204 };
  try {
    await container('media').deleteBlob(blobName, { deleteSnapshots: 'include' }).catch((e) => {
      if (e?.statusCode !== 404) throw e;
    });
    return { status: 204 };
  } catch (err) {
    ctx.error(err);
    return { status: 500, jsonBody: { error: 'Impossibile eliminare il file' } };
  }
}

app.http('media-upload', { methods: ['POST'], authLevel: 'anonymous', route: 'manage/upload', handler: createUpload });
app.http('media-delete', { methods: ['DELETE'], authLevel: 'anonymous', route: 'manage/media', handler: deleteMedia });
