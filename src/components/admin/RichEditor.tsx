import { useEffect, type ReactNode } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';

function ToolButton({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title: string; children: ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`min-w-8 rounded px-2 py-1 text-sm transition ${active ? 'bg-zinc-800 text-white' : 'text-zinc-700 hover:bg-zinc-200'}`}
    >
      {children}
    </button>
  );
}

/** Editor di testo semplice (grassetto, titoli, elenchi, link). Produce HTML. */
export function RichEditor({
  label,
  value,
  onChange,
  help,
  placeholder,
}: {
  label?: string;
  value: string | undefined;
  onChange: (html: string) => void;
  help?: string;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
      Placeholder.configure({ placeholder: placeholder ?? 'Scrivi qui…' }),
    ],
    content: value ?? '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  // Riallinea il contenuto se cambia dall'esterno (es. ricarica / annulla modifiche).
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value ?? '';
    if (next !== current && !(next === '' && current === '<p></p>')) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive('bold'),
            italic: e.isActive('italic'),
            underline: e.isActive('underline'),
            h2: e.isActive('heading', { level: 2 }),
            h3: e.isActive('heading', { level: 3 }),
            bullet: e.isActive('bulletList'),
            ordered: e.isActive('orderedList'),
            quote: e.isActive('blockquote'),
            link: e.isActive('link'),
          }
        : null,
  });

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Indirizzo del link (lascia vuoto per rimuoverlo)', prev ?? 'https://');
    if (url === null) return;
    if (url === '' || url === 'https://') editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div>
      {label && <span className="mb-1 block text-sm font-medium text-zinc-700">{label}</span>}
      <div className="overflow-hidden rounded-md border border-zinc-300 bg-white shadow-sm focus-within:border-brand focus-within:ring-1 focus-within:ring-brand">
        <div className="flex flex-wrap gap-0.5 border-b border-zinc-200 bg-zinc-50 p-1">
          <ToolButton title="Grassetto" active={state?.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
            <b>B</b>
          </ToolButton>
          <ToolButton title="Corsivo" active={state?.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <i>I</i>
          </ToolButton>
          <ToolButton title="Sottolineato" active={state?.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <u>U</u>
          </ToolButton>
          <span className="mx-1 w-px bg-zinc-300" />
          <ToolButton title="Titolo" active={state?.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            H2
          </ToolButton>
          <ToolButton title="Sottotitolo" active={state?.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            H3
          </ToolButton>
          <span className="mx-1 w-px bg-zinc-300" />
          <ToolButton title="Elenco puntato" active={state?.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            • Elenco
          </ToolButton>
          <ToolButton title="Elenco numerato" active={state?.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            1. Elenco
          </ToolButton>
          <ToolButton title="Citazione" active={state?.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            “ ”
          </ToolButton>
          <ToolButton title="Link" active={state?.link} onClick={setLink}>
            🔗 Link
          </ToolButton>
          <span className="mx-1 w-px bg-zinc-300" />
          <ToolButton title="Annulla" onClick={() => editor.chain().focus().undo().run()}>
            ↶
          </ToolButton>
          <ToolButton title="Ripeti" onClick={() => editor.chain().focus().redo().run()}>
            ↷
          </ToolButton>
        </div>
        <EditorContent editor={editor} />
      </div>
      {help && <span className="mt-1 block text-xs text-zinc-500">{help}</span>}
    </div>
  );
}
