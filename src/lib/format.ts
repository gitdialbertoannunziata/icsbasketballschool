export function formatDate(iso?: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('it-IT', opts);
}

export function formatDateRange(start?: string, end?: string) {
  if (!start) return '';
  if (!end || end === start) return formatDate(start);
  const s = new Date(`${start}T12:00:00`);
  const e = new Date(`${end}T12:00:00`);
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.getDate()}–${formatDate(end)}`;
  }
  return `${formatDate(start, { day: 'numeric', month: 'long' })} – ${formatDate(end)}`;
}

export function formatPrice(amount?: number) {
  if (amount == null) return '';
  return amount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: amount % 1 ? 2 : 0 });
}

export function formatBytes(n?: number) {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function slugify(s: string) {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

export function newId(prefix = '') {
  const rnd = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  return prefix ? `${prefix}-${rnd}` : rnd;
}

export function youtubeId(url: string): string | undefined {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m?.[1];
}

export function stripHtml(html: string) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent ?? '').replace(/\s+/g, ' ').trim();
}
