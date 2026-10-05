import { describe, expect, it } from 'vitest';
import { cleanWpHtml, originalImageUrl } from './wp';
import { formatDateRange, formatPrice, slugify, youtubeId } from '../../src/lib/format';

describe('cleanWpHtml', () => {
  it('rimuove shortcode Visual Composer e attributi', () => {
    const { html } = cleanWpHtml('<p>[vc_row][vc_column]<span style="color:red" class="x">Ciao</span> <strong>mondo</strong>[/vc_column][/vc_row]</p>');
    expect(html).toBe('<p>Ciao <strong>mondo</strong></p>');
  });

  it('converte i div incollati da Facebook in paragrafi ed estrae le immagini', () => {
    const { html, images } = cleanWpHtml(
      '<div class="x1"><div dir="auto">Riga uno</div></div><div dir="auto"></div><div dir="auto"><img src="https://icsbasketballschool.it/wp-content/uploads/sites/3/2024/03/foto-300x300.jpg"></div>',
    );
    expect(html).toBe('<p>Riga uno</p>');
    expect(images).toEqual(['https://icsbasketballschool.it/wp-content/uploads/sites/3/2024/03/foto.jpg']);
  });

  it('sostituisce le emoji di Facebook col testo alternativo e pulisce i link di tracciamento', () => {
    const { html } = cleanWpHtml(
      '<p><a class="x" href="https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.instagram.com%2Fpippo%3Ffbclid%3Dabc&amp;h=1">@pippo</a> <img src="https://static.xx.fbcdn.net/e.png" alt="📢"></p>',
    );
    expect(html).toBe('<p><a href="https://www.instagram.com/pippo">@pippo</a> 📢</p>');
  });
});

describe('utility', () => {
  it('originalImageUrl rimuove i suffissi delle miniature', () => {
    expect(originalImageUrl('https://x/a/Piscina-uai-258x172.jpg')).toBe('https://x/a/Piscina.jpg');
    expect(originalImageUrl('https://x/a/SV_7224-scaled-uai-258x172.jpg')).toBe('https://x/a/SV_7224-scaled.jpg');
  });

  it('slugify, date, prezzi, youtube', () => {
    expect(slugify('Progetto 13-19 & Beyond')).toBe('progetto-13-19-e-beyond');
    expect(slugify('Città  è già!')).toBe('citta-e-gia');
    expect(formatDateRange('2026-07-12', '2026-07-16')).toBe('12–16 luglio 2026');
    expect(formatPrice(450)).toMatch(/450\s?€/);
    expect(youtubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://example.com')).toBeUndefined();
  });
});
