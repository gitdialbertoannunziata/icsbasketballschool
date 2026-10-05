import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { EventItem, NewsItem, StaffMember } from '@shared/types';
import { formatDate, formatDateRange, stripHtml } from '../../lib/format';
import { RichText } from '../RichText';
import { Badge } from './ui';

export function EventCard({ ev }: { ev: EventItem }) {
  const allSoldOut = ev.sessions.length > 0 && ev.sessions.every((s) => s.soldOut);
  return (
    <Link
      to={`/eventi/${ev.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-coal ring-1 ring-white/5 transition hover:-translate-y-1 hover:ring-brand/60"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-graphite">
        {(ev.coverImage || ev.poster) && (
          <img
            src={ev.coverImage || ev.poster}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          {ev.status === 'archived' && <Badge tone="zinc">Concluso</Badge>}
          {ev.status === 'published' && allSoldOut && <Badge tone="red">Sold out</Badge>}
          {ev.status === 'published' && ev.registration.enabled && !allSoldOut && <Badge tone="green">Iscrizioni aperte</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-light">
          {formatDateRange(ev.startDate, ev.endDate)}
          {ev.location?.name && ` · ${ev.location.name}`}
        </p>
        <h3 className="mt-1 font-display text-2xl uppercase tracking-wide">{ev.title}</h3>
        {ev.subtitle && <p className="mt-2 text-zinc-400">{ev.subtitle}</p>}
        <span className="mt-auto pt-4 text-sm font-semibold uppercase text-brand-light group-hover:underline">Scopri di più →</span>
      </div>
    </Link>
  );
}

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <Link
      to={`/news/${item.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-coal ring-1 ring-white/5 transition hover:ring-brand/60"
    >
      {item.coverImage && (
        <div className="aspect-[16/10] overflow-hidden bg-graphite">
          <img src={item.coverImage} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <time className="text-xs uppercase tracking-wide text-zinc-500">{formatDate(item.date)}</time>
        <h3 className="mt-1 text-lg font-semibold group-hover:text-brand-light">{item.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm text-zinc-400">{item.excerpt || stripHtml(item.bodyHtml).slice(0, 200)}</p>
      </div>
    </Link>
  );
}

export function StaffCard({ member, onOpen }: { member: StaffMember; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group flex flex-col overflow-hidden rounded-xl bg-coal text-left ring-1 ring-white/5 transition hover:ring-brand/60"
    >
      <div className="aspect-[4/3] overflow-hidden bg-graphite">
        {member.photos[0] ? (
          <img src={member.photos[0]} alt={member.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-5xl text-zinc-600">
            {member.name.split(' ').map((p) => p[0]).join('')}
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl uppercase tracking-wide">{member.name}</h3>
        <p className="text-sm font-semibold uppercase text-brand-light">{member.role}</p>
        <p className="mt-3 line-clamp-3 text-sm text-zinc-400">{stripHtml(member.bioHtml)}</p>
        <span className="mt-3 inline-block text-sm font-semibold text-brand-light group-hover:underline">Leggi tutto</span>
      </div>
    </button>
  );
}

export function StaffModal({ member, onClose }: { member: StaffMember; onClose: () => void }) {
  const [photo, setPhoto] = useState(0);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label={member.name}>
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-coal ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}>
        {member.photos.length > 0 && (
          <div className="relative aspect-[16/9] bg-graphite">
            <img src={member.photos[photo]} alt={member.name} className="h-full w-full object-cover" />
            {member.photos.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                {member.photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPhoto(i)}
                    aria-label={`Foto ${i + 1}`}
                    className={`h-2.5 w-2.5 rounded-full ${i === photo ? 'bg-brand' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-3xl uppercase tracking-wide">{member.name}</h3>
              <p className="font-semibold uppercase text-brand-light">{member.role}</p>
            </div>
            <button onClick={onClose} className="rounded p-2 hover:bg-white/10" aria-label="Chiudi">
              ✕
            </button>
          </div>
          <RichText html={member.bioHtml} className="mt-4 text-zinc-300" />
          {member.links && member.links.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {member.links.map((l) => (
                <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-light underline">
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
