import {
  BlobSASPermissions,
  BlobServiceClient,
  ContainerClient,
  RestError,
} from '@azure/storage-blob';
import type { ContentMap, ContentName } from '../shared/types';
import { defaultContent } from './defaults';

export const CONTAINERS = {
  content: 'content',
  media: 'media',
  registrations: 'registrations',
} as const;

let service: BlobServiceClient | undefined;

export function getService(): BlobServiceClient {
  if (!service) {
    const cs = process.env.STORAGE_CONNECTION_STRING;
    if (!cs) throw new Error('STORAGE_CONNECTION_STRING non configurata');
    service = BlobServiceClient.fromConnectionString(cs);
  }
  return service;
}

export function container(name: keyof typeof CONTAINERS): ContainerClient {
  return getService().getContainerClient(CONTAINERS[name]);
}

/** Crea i container se mancano (idempotente). Usato dagli script di setup e come fallback. */
export async function ensureContainers(): Promise<void> {
  await container('content').createIfNotExists();
  await container('media').createIfNotExists({ access: 'blob' });
  await container('registrations').createIfNotExists();
}

export class ConflictError extends Error {}

async function streamToString(stream: NodeJS.ReadableStream | undefined): Promise<string> {
  if (!stream) return '';
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
  return Buffer.concat(chunks).toString('utf8');
}

export async function readBlobJson<T>(
  cont: ContainerClient,
  blobName: string,
): Promise<{ data: T; etag: string } | undefined> {
  try {
    const res = await cont.getBlobClient(blobName).download();
    const text = await streamToString(res.readableStreamBody);
    return { data: JSON.parse(text) as T, etag: res.etag ?? '' };
  } catch (err) {
    if (err instanceof RestError && err.statusCode === 404) return undefined;
    throw err;
  }
}

export async function writeBlobJson(
  cont: ContainerClient,
  blobName: string,
  data: unknown,
  opts: { etag?: string; metadata?: Record<string, string> } = {},
): Promise<string> {
  const body = JSON.stringify(data, null, 2);
  try {
    const res = await cont.getBlockBlobClient(blobName).upload(body, Buffer.byteLength(body), {
      blobHTTPHeaders: { blobContentType: 'application/json; charset=utf-8' },
      conditions: opts.etag ? { ifMatch: opts.etag } : undefined,
      metadata: opts.metadata,
    });
    return res.etag ?? '';
  } catch (err) {
    if (err instanceof RestError && (err.statusCode === 412 || err.statusCode === 409)) {
      throw new ConflictError('Il contenuto è stato modificato da qualcun altro. Ricarica la pagina.');
    }
    throw err;
  }
}

export async function readContent<K extends ContentName>(
  name: K,
): Promise<{ data: ContentMap[K]; etag: string }> {
  const res = await readBlobJson<ContentMap[K]>(container('content'), `${name}.json`);
  return res ?? { data: structuredClone(defaultContent[name]) as ContentMap[K], etag: '' };
}

export async function writeContent<K extends ContentName>(
  name: K,
  data: ContentMap[K],
  etag?: string,
): Promise<string> {
  return writeBlobJson(container('content'), `${name}.json`, data, { etag: etag || undefined });
}

/** URL pubblico di un blob del container media (rispetta MEDIA_PUBLIC_BASE_URL, es. CDN o dominio custom). */
export function mediaPublicUrl(blobName: string): string {
  const base = process.env.MEDIA_PUBLIC_BASE_URL?.replace(/\/$/, '');
  if (base) return `${base}/${blobName.split('/').map(encodeURIComponent).join('/')}`;
  return container('media').getBlobClient(blobName).url;
}

/** Ricava il nome del blob a partire da un URL pubblico del container media. */
export function mediaBlobNameFromUrl(url: string): string | undefined {
  const bases = [container('media').url, process.env.MEDIA_PUBLIC_BASE_URL].filter(Boolean) as string[];
  for (const b of bases) {
    const base = b.replace(/\/$/, '') + '/';
    if (url.startsWith(base)) return decodeURIComponent(url.slice(base.length).split('?')[0]);
  }
  return undefined;
}

export async function sasUrl(
  cont: ContainerClient,
  blobName: string,
  permissions: string,
  minutes: number,
  opts: { contentDisposition?: string } = {},
): Promise<string> {
  return cont.getBlockBlobClient(blobName).generateSasUrl({
    permissions: BlobSASPermissions.parse(permissions),
    startsOn: new Date(Date.now() - 5 * 60_000),
    expiresOn: new Date(Date.now() + minutes * 60_000),
    contentDisposition: opts.contentDisposition,
  });
}
