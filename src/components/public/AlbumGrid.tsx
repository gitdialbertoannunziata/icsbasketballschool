import { useState } from 'react';
import Lightbox, { type Slide } from 'yet-another-react-lightbox';
import Video from 'yet-another-react-lightbox/plugins/video';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import type { GalleryMedia } from '@shared/types';
import { youtubeId } from '../../lib/format';

/**
 * Griglia di foto e video di un album, con lightbox al clic.
 * Con `limit` mostra solo i primi elementi e un pulsante per espandere sul posto.
 */
export function AlbumGrid({ items, limit }: { items: GalleryMedia[]; limit?: number }) {
  const [index, setIndex] = useState(-1);
  const [expanded, setExpanded] = useState(false);

  // Il lightbox mostra foto e video caricati; i video YouTube restano incorporati nella griglia.
  const lightboxItems = items.filter((i) => !(i.type === 'video' && youtubeId(i.url)));
  const slides: Slide[] = lightboxItems.map((i) =>
    i.type === 'video'
      ? { type: 'video', sources: [{ src: i.url, type: i.url.endsWith('.webm') ? 'video/webm' : 'video/mp4' }], description: i.caption }
      : { src: i.url, width: i.width, height: i.height, description: i.caption },
  );
  const visible = limit && !expanded ? items.slice(0, limit) : items;
  const hidden = items.length - visible.length;

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {visible.map((item) => {
          const yt = item.type === 'video' ? youtubeId(item.url) : undefined;
          if (yt) {
            return (
              <div key={item.id} className="col-span-2 overflow-hidden rounded-lg bg-graphite">
                <iframe
                  className="aspect-video w-full"
                  src={`https://www.youtube-nocookie.com/embed/${yt}`}
                  title={item.caption || 'Video'}
                  loading="lazy"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            );
          }
          return (
            <button
              key={item.id}
              onClick={() => setIndex(lightboxItems.indexOf(item))}
              className="group relative block aspect-square overflow-hidden rounded-lg bg-graphite"
              aria-label={item.caption || (item.type === 'video' ? 'Guarda il video' : 'Apri la foto')}
            >
              {item.type === 'video' ? (
                <>
                  {item.thumbUrl ? (
                    <img src={item.thumbUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <video src={`${item.url}#t=0.5`} preload="metadata" muted className="h-full w-full object-cover" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/90 text-xl text-white">▶</span>
                  </span>
                </>
              ) : (
                <img
                  src={item.thumbUrl || item.url}
                  alt={item.caption ?? ''}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              )}
            </button>
          );
        })}
      </div>
      {hidden > 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setExpanded(true)}
            className="rounded-md border border-zinc-600 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide transition hover:border-brand hover:text-brand-light"
          >
            Mostra tutte ({items.length})
          </button>
        </div>
      )}
      <Lightbox open={index >= 0} index={index} close={() => setIndex(-1)} slides={slides} plugins={[Video, Captions]} />
    </>
  );
}
