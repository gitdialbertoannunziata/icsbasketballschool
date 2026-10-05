import * as cheerio from 'cheerio';
import type { AnyNode, Element } from 'domhandler';

export const WP_BASE = 'https://icsbasketballschool.it';

export async function fetchJson<T>(path: string): Promise<T> {
  const url = path.startsWith('http') ? path : `${WP_BASE}${path}`;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'ICS-migration/1.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status} su ${url}`);
      return (await res.json()) as T;
    } catch (e) {
      if (attempt >= 3) throw e;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

export async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': 'ICS-migration/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} su ${url}`);
  return res.text();
}

/** Decodifica le entità e gli apici "tipografici" che WordPress inserisce negli shortcode. */
export function decodeEntities(s: string): string {
  return cheerio.load(`<div>${s}</div>`, null, false)('div').text();
}

/** Toglie i link di tracciamento di Facebook (l.facebook.com/l.php?u=...). */
function unwrapFacebookLink(href: string): string {
  try {
    const u = new URL(href);
    if (u.hostname.endsWith('facebook.com') && u.pathname === '/l.php' && u.searchParams.get('u')) {
      const target = new URL(u.searchParams.get('u')!);
      target.searchParams.delete('fbclid');
      return target.toString();
    }
  } catch {
    /* href non valido: lo lasciamo com'è */
  }
  return href;
}

const BLOCK = new Set(['p', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'div', 'table']);
const KEEP_TAGS = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote']);

/**
 * Converte l'HTML di WordPress (Visual Composer, contenuti incollati da Facebook) in HTML semplice
 * compatibile con l'editor dell'admin. Le immagini vengono rimosse dal testo e restituite a parte.
 */
export function cleanWpHtml(raw: string): { html: string; images: string[] } {
  const withoutShortcodes = raw.replace(/\[\/?[a-z_]+[^\]]*\]/g, '');
  const $ = cheerio.load(withoutShortcodes, null, false);
  const images: string[] = [];

  $('script,style,noscript,iframe,form').remove();

  $('img').each((_, el) => {
    const src = $(el).attr('src') ?? '';
    if (/fbcdn\.net|emoji/.test(src)) {
      $(el).replaceWith($(el).attr('alt') ?? '');
      return;
    }
    if (src) images.push(originalImageUrl(src));
    $(el).remove();
  });

  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (href) $(el).attr('href', unwrapFacebookLink(href));
  });

  // h1/h5/h6 → h2/h4 (l'editor supporta solo h2-h4)
  $('h1').each((_, el) => void ((el as Element).tagName = 'h2'));
  $('h5,h6').each((_, el) => void ((el as Element).tagName = 'h4'));
  $('b').each((_, el) => void ((el as Element).tagName = 'strong'));
  $('i').each((_, el) => void ((el as Element).tagName = 'em'));

  // I <div> vengono convertiti in paragrafi (se contengono solo testo) o "srotolati".
  let divs = $('div');
  while (divs.length) {
    const el = divs.last();
    const hasBlock = el.children().toArray().some((c) => BLOCK.has((c as Element).tagName));
    if (hasBlock || !el.text().trim()) el.replaceWith(el.contents());
    else (el.get(0) as Element).tagName = 'p';
    divs = $('div');
  }

  // Rimuove i tag non supportati mantenendone il contenuto, e tutti gli attributi tranne href/start.
  const walk = (nodes: AnyNode[]) => {
    for (const node of nodes) {
      if (node.type !== 'tag') continue;
      const el = node as Element;
      walk(el.children);
      if (!KEEP_TAGS.has(el.tagName)) {
        $(el).replaceWith($(el).contents());
        continue;
      }
      for (const attr of Object.keys(el.attribs)) {
        if (!(el.tagName === 'a' && attr === 'href') && !(el.tagName === 'ol' && attr === 'start')) delete el.attribs[attr];
      }
    }
  };
  walk($.root().children().toArray());

  // Testo "nudo" a livello radice → paragrafo.
  $.root()
    .contents()
    .each((_, node) => {
      if (node.type === 'text' && node.data.trim()) $(node).wrap('<p></p>');
    });

  $('p').each((_, el) => {
    const t = $(el).text().replace(/ /g, ' ').trim();
    if (!t) $(el).remove();
  });

  const html = $.html()
    .replace(/&nbsp;/g, ' ')
    .replace(/(<br\s*\/?>\s*)+<\/p>/g, '</p>')
    .replace(/<p>(\s*<br\s*\/?>)+/g, '<p>')
    .replace(/\n{2,}/g, '\n')
    .trim();
  return { html, images: [...new Set(images)] };
}

/** Da una miniatura WordPress ("-300x200", "-uai-258x172") ricava l'URL dell'immagine originale. */
export function originalImageUrl(src: string): string {
  return src.replace(/-uai-\d+x\d+(?=\.\w+$)/, '').replace(/-\d+x\d+(?=\.\w+$)/, '');
}

export function excerptFrom(html: string, max = 220): string {
  const text = cheerio.load(`<div>${html}</div>`, null, false)('div').text().replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, '')}…` : text;
}
