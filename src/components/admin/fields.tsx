import { useState, type ReactNode } from 'react';

export const inputCls =
  'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:bg-zinc-100';

export function Field({ label, help, children, className = '' }: { label: string; help?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-zinc-700">{label}</span>
      {children}
      {help && <span className="mt-1 block text-xs text-zinc-500">{help}</span>}
    </label>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  help,
  type = 'text',
  placeholder,
  className,
  required,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  help?: string;
  type?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
}) {
  return (
    <Field label={label} help={help} className={className}>
      <input
        type={type}
        value={value ?? ''}
        placeholder={placeholder}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </Field>
  );
}

export function NumberInput({
  label,
  value,
  onChange,
  help,
  className,
  step = 1,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  help?: string;
  className?: string;
  step?: number;
}) {
  return (
    <Field label={label} help={help} className={className}>
      <input
        type="number"
        step={step}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        className={inputCls}
      />
    </Field>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  help,
  rows = 3,
  className,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  help?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <Field label={label} help={help} className={className}>
      <textarea value={value ?? ''} rows={rows} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </Field>
  );
}

export function SelectInput<T extends string>({
  label,
  value,
  onChange,
  options,
  help,
  className,
}: {
  label: string;
  value: T | undefined;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  help?: string;
  className?: string;
}) {
  return (
    <Field label={label} help={help} className={className}>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value as T)} className={inputCls}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Toggle({ label, checked, onChange, help }: { label: string; checked: boolean; onChange: (v: boolean) => void; help?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-brand' : 'bg-zinc-300'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
      <span>
        <span className="block text-sm font-medium text-zinc-800">{label}</span>
        {help && <span className="block text-xs text-zinc-500">{help}</span>}
      </span>
    </label>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
const btn: Record<BtnVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark shadow-sm',
  secondary: 'bg-white text-zinc-800 ring-1 ring-zinc-300 hover:bg-zinc-50 shadow-sm',
  danger: 'bg-white text-red-600 ring-1 ring-red-200 hover:bg-red-50',
  ghost: 'text-zinc-600 hover:bg-zinc-200/60',
};

export function Button({
  children,
  onClick,
  variant = 'secondary',
  type = 'button',
  disabled,
  className = '',
  title,
  size = 'md',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  title?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3.5 py-2 text-sm'
      } ${btn[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function ConfirmButton({
  children,
  onConfirm,
  message = 'Confermi l’eliminazione?',
  size,
  title,
}: {
  children: ReactNode;
  onConfirm: () => void;
  message?: string;
  size?: 'sm' | 'md';
  title?: string;
}) {
  return (
    <Button variant="danger" size={size} title={title} onClick={() => window.confirm(message) && onConfirm()}>
      {children}
    </Button>
  );
}

export function Card({ title, children, actions, className = '' }: { title?: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && <h2 className="text-base font-semibold text-zinc-900">{title}</h2>}
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function SaveBar({ dirty, saving, onSave, onReset }: { dirty: boolean; saving: boolean; onSave: () => void; onReset?: () => void }) {
  if (!dirty && !saving) return null;
  return (
    <div className="sticky bottom-0 z-30 -mx-4 mt-6 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
      <div className="flex items-center justify-end gap-3">
        <span className="mr-auto text-sm text-amber-700">Hai modifiche non salvate</span>
        {onReset && (
          <Button variant="ghost" onClick={onReset} disabled={saving}>
            Annulla modifiche
          </Button>
        )}
        <Button variant="primary" onClick={onSave} disabled={saving}>
          {saving ? 'Salvataggio…' : 'Salva modifiche'}
        </Button>
      </div>
    </div>
  );
}

export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto border-b border-zinc-200">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            active === t.id ? 'border-brand text-brand-dark' : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Spinner() {
  return <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />;
}

export function AdminLoading() {
  return (
    <div className="flex justify-center py-20">
      <Spinner />
    </div>
  );
}

export function AdminError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
      {error instanceof Error ? error.message : 'Errore'}
      {onRetry && (
        <button onClick={onRetry} className="ml-3 font-semibold underline">
          Riprova
        </button>
      )}
    </div>
  );
}

/** Editor per una lista di stringhe (es. punti elenco). */
export function StringListInput({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('');
  return (
    <Field label={label}>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={v}
              onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))}
              className={inputCls}
            />
            <Button size="sm" variant="ghost" title="Rimuovi" onClick={() => onChange(values.filter((_, j) => j !== i))}>
              ✕
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            value={draft}
            placeholder={placeholder ?? 'Aggiungi…'}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draft.trim()) {
                e.preventDefault();
                onChange([...values, draft.trim()]);
                setDraft('');
              }
            }}
            className={inputCls}
          />
          <Button
            size="sm"
            onClick={() => {
              if (draft.trim()) onChange([...values, draft.trim()]);
              setDraft('');
            }}
          >
            Aggiungi
          </Button>
        </div>
      </div>
    </Field>
  );
}
