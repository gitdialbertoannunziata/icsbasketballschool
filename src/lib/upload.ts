import { api } from './api';

export type Progress = (fraction: number) => void;

/** Carica un Blob direttamente sullo storage usando un SAS fornito dall'API. Restituisce l'URL pubblico. */
export async function uploadBlob(blob: Blob, fileName: string, folder: string, onProgress?: Progress): Promise<string> {
  const contentType = blob.type || 'application/octet-stream';
  const ticket = await api.uploadTicket(folder, fileName, contentType);
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', ticket.uploadUrl);
    xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob');
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.setRequestHeader('x-ms-blob-cache-control', 'public, max-age=31536000, immutable');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Caricamento non riuscito (${xhr.status})`)));
    xhr.onerror = () => reject(new Error('Errore di rete durante il caricamento'));
    xhr.send(blob);
  });
  return ticket.url;
}

const RESIZABLE = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif'];

/** Ridimensiona un'immagine lato client (mantiene le proporzioni). */
export async function resizeImage(
  file: File,
  maxSize: number,
  quality = 0.85,
): Promise<{ blob: Blob; width: number; height: number }> {
  if (!RESIZABLE.includes(file.type)) return { blob: file, width: 0, height: 0 };
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Formato non decodificabile dal browser (es. HEIC su Chrome): carichiamo l'originale.
    return { blob: file, width: 0, height: 0 };
  }
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Conversione immagine fallita'))), 'image/webp', quality),
  );
  return { blob, width, height };
}

function baseName(name: string) {
  return name.replace(/\.[^.]+$/, '');
}

export interface UploadedImage {
  url: string;
  thumbUrl?: string;
  width?: number;
  height?: number;
}

/** Ridimensiona e carica un'immagine (con miniatura opzionale). */
export async function uploadImage(
  file: File,
  folder: string,
  opts: { maxSize?: number; thumb?: boolean; onProgress?: Progress } = {},
): Promise<UploadedImage> {
  const { blob, width, height } = await resizeImage(file, opts.maxSize ?? 1920);
  const ext = blob.type === 'image/webp' ? '.webp' : file.name.match(/\.[^.]+$/)?.[0] ?? '';
  const url = await uploadBlob(blob, baseName(file.name) + ext, folder, (p) => opts.onProgress?.(opts.thumb ? p * 0.85 : p));
  let thumbUrl: string | undefined;
  if (opts.thumb && blob !== file) {
    const t = await resizeImage(file, 480, 0.8);
    thumbUrl = await uploadBlob(t.blob, `${baseName(file.name)}-thumb.webp`, folder);
    opts.onProgress?.(1);
  }
  return { url, thumbUrl, width: width || undefined, height: height || undefined };
}
