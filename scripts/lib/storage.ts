import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

export const AZURITE_CONNECTION_STRING =
  'DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;';

export function connectionString(): string {
  const cs = process.env.STORAGE_CONNECTION_STRING;
  if (!cs || cs === 'UseDevelopmentStorage=true') return AZURITE_CONNECTION_STRING;
  return cs;
}

export function service(): BlobServiceClient {
  return BlobServiceClient.fromConnectionString(connectionString());
}

export function containers() {
  const s = service();
  return {
    content: s.getContainerClient('content'),
    media: s.getContainerClient('media'),
    registrations: s.getContainerClient('registrations'),
  };
}

export async function blobExists(c: ContainerClient, name: string): Promise<boolean> {
  return c.getBlobClient(name).exists();
}

export async function writeJsonBlob(c: ContainerClient, name: string, data: unknown) {
  const body = JSON.stringify(data, null, 2);
  await c.getBlockBlobClient(name).upload(body, Buffer.byteLength(body), {
    blobHTTPHeaders: { blobContentType: 'application/json; charset=utf-8' },
  });
}

export function mediaUrl(c: ContainerClient, blobName: string): string {
  const base = process.env.MEDIA_PUBLIC_BASE_URL?.replace(/\/$/, '');
  if (base) return `${base}/${blobName.split('/').map(encodeURIComponent).join('/')}`;
  return c.getBlobClient(blobName).url;
}

/** Esegue `fn` su tutti gli elementi con concorrenza limitata. */
export async function pool<T, R>(items: T[], size: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}
