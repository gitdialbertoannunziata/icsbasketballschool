import { useRef, useState, type DragEvent, type ReactNode } from 'react';
import { uploadBlob, uploadImage, type UploadedImage } from '../../lib/upload';
import { useToast } from '../Toast';
import { Button, Field } from './fields';

/** Zona di rilascio file con click per selezionare. */
export function DropZone({
  accept,
  multiple,
  onFiles,
  children,
  disabled,
}: {
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    if (disabled) return;
    const files = [...e.dataTransfer.files];
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      onClick={() => !disabled && ref.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && ref.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center text-sm transition ${
        over ? 'border-brand bg-brand/5' : 'border-zinc-300 hover:border-brand/60 hover:bg-zinc-50'
      } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
    >
      {children}
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = '';
          if (files.length) onFiles(files);
        }}
      />
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded bg-zinc-200">
      <div className="h-full bg-brand transition-all" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

/** Campo immagine singola: anteprima, carica, sostituisci, rimuovi. */
export function ImageInput({
  label,
  value,
  onChange,
  help,
  folder = 'images',
  aspect = 'aspect-video',
}: {
  label: string;
  value?: string;
  onChange: (url: string | undefined) => void;
  help?: string;
  folder?: string;
  aspect?: string;
}) {
  const toast = useToast();
  const [progress, setProgress] = useState<number | null>(null);

  async function handle(files: File[]) {
    try {
      setProgress(0);
      const res = await uploadImage(files[0], folder, { onProgress: setProgress });
      onChange(res.url);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Caricamento non riuscito', 'error');
    } finally {
      setProgress(null);
    }
  }

  return (
    <Field label={label} help={help}>
      {value ? (
        <div className="group relative w-full max-w-sm overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-zinc-200">
          <img src={value} alt="" className={`${aspect} w-full object-cover`} />
          <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/70 p-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
            <DropZone accept="image/*" onFiles={handle}>
              <span className="rounded bg-white px-2 py-1 text-xs font-medium text-zinc-800">Sostituisci</span>
            </DropZone>
            <Button size="sm" variant="danger" onClick={() => onChange(undefined)}>
              Rimuovi
            </Button>
          </div>
          {progress !== null && (
            <div className="absolute inset-x-0 top-0 p-2">
              <ProgressBar value={progress} />
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-sm">
          <DropZone accept="image/*" onFiles={handle} disabled={progress !== null}>
            {progress !== null ? (
              <div className="w-full space-y-2">
                <span className="text-zinc-600">Caricamento…</span>
                <ProgressBar value={progress} />
              </div>
            ) : (
              <>
                <span className="text-2xl">🖼️</span>
                <span className="mt-1 font-medium text-zinc-700">Trascina un’immagine o clicca per sceglierla</span>
                <span className="text-xs text-zinc-500">Verrà ridimensionata automaticamente</span>
              </>
            )}
          </DropZone>
        </div>
      )}
    </Field>
  );
}

/** Campo video singolo (es. sfondo della home): carica, anteprima, rimuovi. */
export function VideoInput({
  label,
  value,
  onChange,
  help,
  poster,
}: {
  label: string;
  value?: string;
  onChange: (url: string | undefined) => void;
  help?: string;
  poster?: string;
}) {
  const toast = useToast();
  const [progress, setProgress] = useState<number | null>(null);

  async function handle(files: File[]) {
    const f = files[0];
    if (f.size > 100 * 1024 * 1024) return toast('Il video supera i 100 MB: comprimilo prima di caricarlo.', 'error');
    try {
      setProgress(0);
      onChange(await uploadBlob(f, f.name, 'videos', setProgress));
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Caricamento non riuscito', 'error');
    } finally {
      setProgress(null);
    }
  }

  return (
    <Field label={label} help={help}>
      <div className="max-w-sm space-y-2">
        {value && <video src={value} poster={poster} muted loop autoPlay playsInline className="aspect-video w-full rounded-lg bg-zinc-900 object-cover" />}
        <DropZone accept="video/mp4,video/webm" onFiles={handle} disabled={progress !== null}>
          {progress !== null ? (
            <div className="w-full space-y-2">
              <span className="text-zinc-600">Caricamento video…</span>
              <ProgressBar value={progress} />
            </div>
          ) : (
            <>
              <span className="text-2xl">🎬</span>
              <span className="mt-1 font-medium text-zinc-700">{value ? 'Sostituisci il video' : 'Trascina un video MP4 o clicca per sceglierlo'}</span>
              <span className="text-xs text-zinc-500">Consigliato: breve, senza audio, sotto i 20 MB</span>
            </>
          )}
        </DropZone>
        {value && (
          <Button size="sm" variant="danger" onClick={() => onChange(undefined)}>
            Rimuovi video
          </Button>
        )}
      </div>
    </Field>
  );
}

/** Più immagini (es. foto di un membro dello staff). */
export function ImagesInput({
  label,
  values,
  onChange,
  folder = 'images',
  help,
}: {
  label: string;
  values: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  help?: string;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function handle(files: File[]) {
    setBusy(true);
    const added: string[] = [];
    try {
      for (const f of files) added.push((await uploadImage(f, folder)).url);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Caricamento non riuscito', 'error');
    } finally {
      onChange([...values, ...added]);
      setBusy(false);
    }
  }

  const move = (i: number, d: -1 | 1) => {
    const next = [...values];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <Field label={label} help={help}>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {values.map((url, i) => (
          <div key={url + i} className="group relative overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-zinc-200">
            <img src={url} alt="" className="aspect-square w-full object-cover" />
            {i === 0 && <span className="absolute left-1 top-1 rounded bg-brand px-1.5 text-[10px] font-semibold text-white">Principale</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/60 p-1">
              <button type="button" className="px-1 text-white" title="Sposta prima" onClick={() => move(i, -1)}>
                ←
              </button>
              <button type="button" className="px-1 text-white" title="Sposta dopo" onClick={() => move(i, 1)}>
                →
              </button>
              <button type="button" className="px-1 text-red-300" title="Rimuovi" onClick={() => onChange(values.filter((_, j) => j !== i))}>
                ✕
              </button>
            </div>
          </div>
        ))}
        <DropZone accept="image/*" multiple onFiles={handle} disabled={busy}>
          <span className="text-xl">{busy ? '⏳' : '+'}</span>
          <span className="text-xs text-zinc-500">{busy ? 'Caricamento…' : 'Aggiungi'}</span>
        </DropZone>
      </div>
    </Field>
  );
}

/** Upload multiplo con avanzamento per la galleria (immagini + miniature, video). */
export function useGalleryUploader(folder: string) {
  const toast = useToast();
  const [queue, setQueue] = useState<{ name: string; progress: number }[]>([]);

  async function upload(files: File[], onEach: (item: UploadedImage & { type: 'image' | 'video'; name: string }) => void) {
    setQueue(files.map((f) => ({ name: f.name, progress: 0 })));
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const setP = (p: number) => setQueue((q) => q.map((x, j) => (j === i ? { ...x, progress: p } : x)));
      try {
        if (f.type.startsWith('video/')) {
          const url = await uploadBlob(f, f.name, folder, setP);
          onEach({ url, type: 'video', name: f.name });
        } else {
          const res = await uploadImage(f, folder, { thumb: true, onProgress: setP });
          onEach({ ...res, type: 'image', name: f.name });
        }
        setP(1);
      } catch (e) {
        toast(`${f.name}: ${e instanceof Error ? e.message : 'errore'}`, 'error');
      }
    }
    setQueue([]);
  }

  return { queue, upload, busy: queue.length > 0 };
}
