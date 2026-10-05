import type { SocialLinks } from '@shared/types';

const icons: Record<keyof SocialLinks, { label: string; path: string }> = {
  facebook: {
    label: 'Facebook',
    path: 'M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.5-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z',
  },
  instagram: {
    label: 'Instagram',
    path: 'M12 2.2c3.2 0 3.58 0 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s0-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33 0 7.05.07 2.7.27.27 2.69.07 7.05 0 8.33 0 8.74 0 12s0 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 24 8.74 24 12 24s3.67 0 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98C24 15.67 24 15.26 24 12s0-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67 0 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z',
  },
  telegram: {
    label: 'Telegram',
    path: 'M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.89 8.22-1.97 9.28c-.15.66-.54.82-1.09.51l-3-2.21-1.45 1.4c-.16.16-.3.3-.6.3l.21-3.05 5.56-5.02c.24-.21-.05-.33-.38-.12l-6.87 4.32-2.96-.92c-.64-.2-.66-.64.14-.95l11.57-4.46c.54-.2 1.01.13.84.92z',
  },
  youtube: {
    label: 'YouTube',
    path: 'M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z',
  },
};

export function telegramUrl(v: string) {
  if (v.startsWith('http')) return v;
  const digits = v.replace(/[\s.-]/g, '');
  if (/^\+?\d{6,}$/.test(digits)) return `https://t.me/${digits.startsWith('+') ? digits : '+39' + digits}`;
  return `https://t.me/${v.replace(/^@/, '')}`;
}

export function SocialIcons({ social, className = '' }: { social: SocialLinks; className?: string }) {
  const entries = (Object.keys(icons) as (keyof SocialLinks)[]).filter((k) => social[k]);
  if (!entries.length) return null;
  return (
    <div className={`flex gap-3 ${className}`}>
      {entries.map((k) => {
        const v = social[k]!;
        const href = k === 'telegram' ? telegramUrl(v) : v;
        return (
          <a
            key={k}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={icons[k].label}
            className="rounded-full bg-white/5 p-2.5 transition hover:bg-brand"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d={icons[k].path} />
            </svg>
          </a>
        );
      })}
    </div>
  );
}
