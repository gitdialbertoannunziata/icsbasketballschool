import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBlocker } from 'react-router-dom';
import type { ContentMap, ContentName } from '@shared/types';
import { api, fetchAuthProviders, fetchMe } from './api';

/** Contenuti pubblici (filtrati dall'API). */
export function useContent<K extends ContentName>(name: K) {
  return useQuery({ queryKey: ['content', name], queryFn: () => api.content(name) });
}

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: fetchMe, staleTime: 5 * 60_000 });
}

export function useAuthProviders() {
  return useQuery({ queryKey: ['auth-providers'], queryFn: fetchAuthProviders, staleTime: Infinity });
}

/** Documento di contenuto lato admin: dati completi + ETag per la concorrenza ottimistica. */
export function useAdminDoc<K extends ContentName>(name: K) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['admin', name], queryFn: () => api.adminContent(name), staleTime: 0 });
  const mutation = useMutation({
    mutationFn: async (data: ContentMap[K]) => {
      const current = qc.getQueryData<{ data: ContentMap[K]; etag: string }>(['admin', name]);
      const res = await api.saveContent(name, data, current?.etag ?? '');
      return { data, etag: res.etag };
    },
    onSuccess: (res) => {
      qc.setQueryData(['admin', name], res);
      qc.invalidateQueries({ queryKey: ['content', name] });
    },
  });
  return {
    data: query.data?.data,
    isLoading: query.isLoading,
    error: query.error,
    reload: () => query.refetch(),
    save: mutation.mutateAsync,
    saving: mutation.isPending,
  };
}

/** Copia locale modificabile di un dato del server, con rilevamento delle modifiche. */
export function useDraft<T>(source: T | undefined) {
  const [draft, setDraft] = useState<T | undefined>(source);
  const [base, setBase] = useState<T | undefined>(source);
  if (source !== base) {
    // Il dato sul server è cambiato (caricamento o salvataggio): riallinea la bozza.
    setBase(source);
    setDraft(source);
  }
  const dirty = useMemo(() => draft !== undefined && JSON.stringify(draft) !== JSON.stringify(base), [draft, base]);
  const update = (fn: (d: T) => T) => setDraft((d) => (d === undefined ? d : fn(d)));
  return { draft, setDraft, update, dirty, reset: () => setDraft(base) };
}

/** Avvisa prima di lasciare la pagina con modifiche non salvate. */
export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (blocker.state === 'blocked') {
      if (window.confirm('Ci sono modifiche non salvate. Vuoi uscire senza salvare?')) blocker.proceed();
      else blocker.reset();
    }
  }, [blocker]);
}
