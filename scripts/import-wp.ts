/**
 * Migrazione dal sito WordPress attuale allo storage del nuovo sito.
 *
 *   npm run import -- --dry-run      # scarica i contenuti e li scrive in ./import-output senza toccare lo storage
 *   npm run import                   # importa contenuti + media nello storage (non sovrascrive contenuti già presenti)
 *   npm run import -- --force        # sovrascrive anche i contenuti già presenti
 *   npm run import -- --skip-media   # lascia le immagini sul vecchio sito (import veloce)
 *   npm run import -- --force --only=site,events   # aggiorna solo alcuni contenuti
 *
 * Lo storage di destinazione è STORAGE_CONNECTION_STRING (default: Azurite locale).
 */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import * as cheerio from 'cheerio';
import sharp from 'sharp';
import type { ContentMap, GalleryAlbum, NewsItem, StaffMember } from '../api/src/shared/types';
import { cleanWpHtml, decodeEntities, excerptFrom, fetchJson, fetchText, originalImageUrl, WP_BASE } from './lib/wp';
import { blobExists, containers, mediaUrl, pool, writeJsonBlob } from './lib/storage';
import * as seed from './seed-data';

const args = new Set(process.argv.slice(2));
const DRY = args.has('--dry-run');
const FORCE = args.has('--force');
const SKIP_MEDIA = args.has('--skip-media') || DRY;
const ONLY = [...args].find((a) => a.startsWith('--only='))?.slice(7).split(',').filter(Boolean);
const OUT = path.resolve('import-output');
const CACHE = path.join(OUT, 'cache');

interface WpPost {
  id: number;
  date: string;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  featured_media: number;
}
interface WpMedia {
  id: number;
  source_url: string;
  mime_type: string;
  media_details?: { width?: number; height?: number };
}

const log = (...a: unknown[]) => console.log(...a);

function slugify(s: string) {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

async function fetchMedia(ids: number[]): Promise<Map<number, WpMedia>> {
  const map = new Map<number, WpMedia>();
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const list = await fetchJson<WpMedia[]>(
      `/wp-json/wp/v2/media?include=${chunk.join(',')}&per_page=100&_fields=id,source_url,mime_type,media_details`,
    );
    for (const m of list) map.set(m.id, m);
  }
  return map;
}

// ---------------------------------------------------------------- contenuti

async function buildNews(posts: WpPost[], media: Map<number, WpMedia>): Promise<NewsItem[]> {
  return posts.map((p) => {
    const { html, images } = cleanWpHtml(p.content.rendered);
    const title = decodeEntities(p.title.rendered);
    const cover = media.get(p.featured_media)?.source_url ?? images[0];
    return {
      id: `news-wp-${p.id}`,
      slug: slugify(p.slug && !/^\d+$/.test(p.slug) ? p.slug : title),
      title,
      date: p.date.slice(0, 10),
      coverImage: cover,
      excerpt: excerptFrom(html),
      bodyHtml: html,
      published: true,
    };
  });
}

/** Staff tecnico dalla home: una riga Visual Composer per persona (nome, ruolo, bio, carosello foto). */
function buildTeam(homeHtml: string): StaffMember[] {
  const $ = cheerio.load(homeHtml);
  const team: StaffMember[] = [];
  let inTeam = false;
  $('.vc_row[data-parent="true"]').each((_, row) => {
    const name = $(row).attr('data-name');
    if (name === 'chisiamo') inTeam = true;
    if (name === 'contatti') inTeam = false;
    if (!inTeam) return;
    const h2 = $(row).find('.heading-text h2').first();
    const person = h2.text().trim();
    if (!person) return;
    const role = $(row).find('.text-top-reduced').first().text().trim();
    const bioRaw = $(row).find('.uncode_text_column').first().html() ?? '';
    const photos = $(row)
      .find('img[data-guid]')
      .map((_, img) => $(img).attr('data-guid')!)
      .get()
      .filter(Boolean);
    team.push({
      id: `staff-${slugify(person)}`,
      name: person,
      role,
      group: 'staff',
      photos: [...new Set(photos)],
      bioHtml: cleanWpHtml(bioRaw).html,
      order: team.length,
    });
  });
  return team;
}

async function buildSupport(posts: WpPost[]): Promise<StaffMember[]> {
  return seed.supportStaff.map(({ wpPostId, ...m }) => {
    const post = posts.find((p) => p.id === wpPostId);
    if (!post) return m;
    const { html, images } = cleanWpHtml(post.content.rendered);
    return { ...m, bioHtml: html || m.bioHtml, photos: images.length ? images.slice(0, 3) : m.photos };
  });
}

async function buildGallery(galleryPageHtml: string): Promise<GalleryAlbum[]> {
  const decoded = decodeEntities(galleryPageHtml);
  const lists = [...decoded.matchAll(/medias=\D*?([\d,]+)/g)].map((m) => m[1].split(',').filter(Boolean).map(Number));
  const allIds = [...new Set(lists.flat())];
  log(`  galleria: ${lists.length} blocchi, ${allIds.length} media`);
  const media = await fetchMedia(allIds);
  const albums: GalleryAlbum[] = [];
  for (const a of seed.galleryAlbums) {
    const ids = lists[a.galleryIndex] ?? [];
    const items = ids
      .map((id) => media.get(id))
      .filter((m): m is WpMedia => !!m && (m.mime_type.startsWith('image/') || m.mime_type.startsWith('video/')))
      .map((m) => ({
        id: `wp-${m.id}`,
        type: m.mime_type.startsWith('video/') ? ('video' as const) : ('image' as const),
        url: m.source_url,
        width: m.media_details?.width,
        height: m.media_details?.height,
      }));
    const skipped = ids.length - items.length;
    if (skipped) log(`  ⚠ ${a.title}: ${skipped} media non trovati o di tipo non supportato`);
    albums.push({
      id: a.id,
      title: a.title,
      eventId: a.eventId,
      year: a.year,
      credit: 'credit' in a ? a.credit : undefined,
      published: true,
      items,
    });
  }
  return albums;
}

// ---------------------------------------------------------------- media

const WP_URL_RE = /https?:\/\/icsbasketballschool\.it\/wp-content\/uploads\/[^\s"'<>)]+/g;

interface Relocated {
  url: string;
  thumbUrl?: string;
  width?: number;
  height?: number;
  size?: number;
}

async function download(url: string): Promise<Buffer> {
  const file = path.join(CACHE, createHash('sha1').update(url).digest('hex'));
  if (existsSync(file)) return readFile(file);
  const res = await fetch(url, { headers: { 'User-Agent': 'ICS-migration/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(file, buf);
  return buf;
}

function wpRelativePath(url: string) {
  return decodeURIComponent(new URL(url).pathname.replace(/^\/wp-content\/uploads\/sites\/\d+\//, '').replace(/^\/wp-content\/uploads\//, ''));
}

function createRelocator() {
  const { media } = containers();
  const cache = new Map<string, Promise<Relocated>>();

  async function put(blobName: string, body: Buffer, contentType: string) {
    await media.getBlockBlobClient(blobName).uploadData(body, {
      blobHTTPHeaders: { blobContentType: contentType, blobCacheControl: 'public, max-age=31536000, immutable' },
    });
    return mediaUrl(media, blobName);
  }

  async function relocate(url: string, opts: { thumb?: boolean } = {}): Promise<Relocated> {
    const rel = wpRelativePath(url);
    const ext = path.extname(rel).toLowerCase();
    const base = rel.slice(0, rel.length - ext.length);
    const buf = await download(url);
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      const img = sharp(buf, { failOn: 'none' }).rotate();
      const out = await img.resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
      const result: Relocated = {
        url: await put(`images/wp/${base}.webp`, out.data, 'image/webp'),
        width: out.info.width,
        height: out.info.height,
        size: out.data.length,
      };
      if (opts.thumb) {
        const t = await sharp(buf, { failOn: 'none' }).rotate().resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
        result.thumbUrl = await put(`images/wp/${base}-thumb.webp`, t, 'image/webp');
      }
      return result;
    }
    const type =
      ext === '.pdf' ? 'application/pdf' : ext === '.mp4' ? 'video/mp4' : ext === '.mov' ? 'video/quicktime' : ext === '.gif' ? 'image/gif' : 'application/octet-stream';
    const folder = type.startsWith('video/') ? 'videos' : type === 'application/pdf' ? 'docs' : 'images';
    return { url: await put(`${folder}/wp/${rel}`, buf, type), size: buf.length };
  }

  return (url: string, opts?: { thumb?: boolean }) => {
    const key = `${url}|${opts?.thumb ? 't' : ''}`;
    if (!cache.has(key)) cache.set(key, relocate(url, opts));
    return cache.get(key)!;
  };
}

/** Sostituisce ricorsivamente gli URL del vecchio sito con quelli dello storage. */
function replaceUrls<T>(value: T, map: Map<string, string>): T {
  if (typeof value === 'string') return value.replace(WP_URL_RE, (m) => map.get(m) ?? m) as T;
  if (Array.isArray(value)) return value.map((v) => replaceUrls(v, map)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replaceUrls(v, map)])) as T;
  }
  return value;
}

function collectUrls(value: unknown, out: Set<string>) {
  if (typeof value === 'string') for (const m of value.matchAll(WP_URL_RE)) out.add(m[0]);
  else if (Array.isArray(value)) value.forEach((v) => collectUrls(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectUrls(v, out));
}

async function relocateMedia(content: ContentMap): Promise<ContentMap> {
  const relocate = createRelocator();
  let done = 0;
  let failed = 0;

  // 1) Galleria: immagine ottimizzata + miniatura + dimensioni
  const galleryItems = content.gallery.flatMap((a) => a.items);
  log(`  media galleria: ${galleryItems.length}`);
  await pool(galleryItems, 6, async (item) => {
    try {
      const r = await relocate(item.url, { thumb: item.type === 'image' });
      Object.assign(item, { url: r.url, thumbUrl: r.thumbUrl, width: r.width ?? item.width, height: r.height ?? item.height });
    } catch (e) {
      failed++;
      log(`  ⚠ ${item.url}: ${(e as Error).message}`);
    }
    if (++done % 25 === 0) log(`    … ${done}/${galleryItems.length}`);
  });

  // 2) Documenti: dimensione del file
  await pool(content.documents, 4, async (d) => {
    try {
      const r = await relocate(d.url);
      d.url = r.url;
      d.size = r.size;
    } catch (e) {
      failed++;
      log(`  ⚠ documento ${d.title}: ${(e as Error).message}`);
    }
  });

  // 3) Tutti gli altri URL (immagini di copertina, staff, loghi, link nei testi)
  const urls = new Set<string>();
  collectUrls({ ...content, gallery: [], documents: [] }, urls);
  log(`  altre immagini/file: ${urls.size}`);
  const map = new Map<string, string>();
  await pool([...urls], 6, async (u) => {
    try {
      map.set(u, (await relocate(u)).url);
    } catch (e) {
      failed++;
      log(`  ⚠ ${u}: ${(e as Error).message}`);
    }
  });
  if (failed) log(`  ⚠ ${failed} file non trasferiti: restano collegati al vecchio sito.`);
  return replaceUrls(content, map);
}

// ---------------------------------------------------------------- main

async function main() {
  await mkdir(CACHE, { recursive: true });
  log(`▶ Lettura da ${WP_BASE}`);
  const [posts, home, galleryPage, privacy, cookie] = await Promise.all([
    fetchJson<WpPost[]>('/wp-json/wp/v2/posts?per_page=100&_fields=id,date,slug,title,content,excerpt,featured_media'),
    fetchText(`${WP_BASE}/`),
    fetchJson<{ content: { rendered: string } }>('/wp-json/wp/v2/pages/462?_fields=content'),
    fetchJson<{ content: { rendered: string } }>('/wp-json/wp/v2/pages/306?_fields=content'),
    fetchJson<{ content: { rendered: string } }>('/wp-json/wp/v2/pages/310?_fields=content'),
  ]);
  const supportPostIds = new Set(seed.supportStaff.map((s) => s.wpPostId));
  const newsPosts = posts.filter((p) => !supportPostIds.has(p.id));
  const featured = await fetchMedia(posts.map((p) => p.featured_media).filter(Boolean));

  const team = buildTeam(home);
  log(`  staff tecnico: ${team.map((t) => t.name).join(', ') || 'nessuno trovato!'}`);

  let content: ContentMap = {
    site: { ...seed.site, privacyHtml: cleanWpHtml(privacy.content.rendered).html, cookieHtml: cleanWpHtml(cookie.content.rendered).html },
    news: await buildNews(posts, featured),
    staff: [...team, ...(await buildSupport(posts))].map((m, i) => ({ ...m, order: i })),
    events: structuredClone(seed.events),
    documents: structuredClone(seed.documents),
    gallery: await buildGallery(galleryPage.content.rendered),
  };
  // Gli articoli dei professionisti di supporto restano anche come news (come sul sito attuale).
  log(`  news: ${content.news.length} (di cui ${posts.length - newsPosts.length} anche come schede staff)`);

  // Collega gli album agli eventi
  for (const ev of content.events) {
    ev.galleryAlbumIds = content.gallery.filter((a) => a.eventId === ev.id).map((a) => a.id);
  }
  // Le foto con miniatura <300px sul vecchio sito: usa l'originale
  content.staff.forEach((m) => (m.photos = m.photos.map(originalImageUrl)));

  if (!SKIP_MEDIA) {
    log('▶ Trasferimento media sullo storage (può richiedere qualche minuto)…');
    content = await relocateMedia(content);
  }

  await mkdir(OUT, { recursive: true });
  for (const [name, data] of Object.entries(content)) {
    await writeFile(path.join(OUT, `${name}.json`), JSON.stringify(data, null, 2));
  }
  log(`✔ Contenuti scritti in ${OUT}`);

  if (DRY) {
    log('ℹ Dry run: nessuna modifica allo storage.');
    return;
  }

  const { content: contentContainer } = containers();
  await contentContainer.createIfNotExists();
  for (const [name, data] of Object.entries(content)) {
    const blob = `${name}.json`;
    if (ONLY && !ONLY.includes(name)) continue;
    if (!FORCE && (await blobExists(contentContainer, blob))) {
      log(`  • ${blob} già presente: non sovrascritto (usa --force)`);
      continue;
    }
    await writeJsonBlob(contentContainer, blob, data);
    log(`  ✔ ${blob}`);
  }
  log('✔ Import completato');
}

main().catch((e) => {
  console.error('✖ Import fallito:', e);
  process.exit(1);
});
