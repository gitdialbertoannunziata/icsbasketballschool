import DOMPurify from 'dompurify';
import { useMemo } from 'react';

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('href')?.startsWith('http')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

/** Mostra HTML proveniente dall'editor, sempre sanificato. */
export function RichText({ html, className = '' }: { html?: string; className?: string }) {
  const clean = useMemo(() => DOMPurify.sanitize(html ?? '', { ADD_ATTR: ['target'] }), [html]);
  if (!clean.trim()) return null;
  return <div className={`rich ${className}`} dangerouslySetInnerHTML={{ __html: clean }} />;
}

export function hasContent(html?: string) {
  return !!html && html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0;
}
