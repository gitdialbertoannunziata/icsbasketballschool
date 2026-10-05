import type {
  ContentMap,
  ContentName,
  EventAvailability,
  Registration,
  RegistrationStatus,
  UploadTicket,
} from '@shared/types';

export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;
  issues?: string[];
  constructor(message: string, status: number, extra: { fields?: Record<string, string>; issues?: string[] } = {}) {
    super(message);
    this.status = status;
    this.fields = extra.fields;
    this.issues = extra.issues;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, { credentials: 'same-origin', ...init });
  if (res.status === 204) return undefined as T;
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json().catch(() => undefined) : undefined;
  if (!res.ok) {
    const msg =
      body?.error ??
      (res.status === 401
        ? 'Sessione scaduta: effettua di nuovo l’accesso.'
        : res.status === 403
          ? 'Non hai i permessi per questa operazione.'
          : `Errore ${res.status}`);
    throw new ApiError(msg, res.status, { fields: body?.fields, issues: body?.issues });
  }
  return body as T;
}

const json = (method: string, data: unknown, headers: Record<string, string> = {}): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json', ...headers },
  body: JSON.stringify(data),
});

export const api = {
  content: <K extends ContentName>(name: K) => request<ContentMap[K]>(`/api/content/${name}`),

  availability: (eventId: string) => request<EventAvailability>(`/api/events/${encodeURIComponent(eventId)}/availability`),

  submitRegistration: (eventId: string, form: FormData) =>
    request<{ ok: true; id: string }>(`/api/registrations/${encodeURIComponent(eventId)}`, { method: 'POST', body: form }),

  // ---- admin ----
  adminContent: <K extends ContentName>(name: K) =>
    request<{ data: ContentMap[K]; etag: string }>(`/api/manage/content/${name}`, { cache: 'no-store' }),

  saveContent: <K extends ContentName>(name: K, data: ContentMap[K], etag: string) =>
    request<{ etag: string }>(`/api/manage/content/${name}`, json('PUT', data, etag ? { 'If-Match': etag } : {})),

  uploadTicket: (folder: string, fileName: string, contentType: string) =>
    request<UploadTicket>('/api/manage/upload', json('POST', { folder, fileName, contentType })),

  deleteMedia: (url: string) => request<void>(`/api/manage/media?url=${encodeURIComponent(url)}`, { method: 'DELETE' }),

  registrations: (eventId?: string) =>
    request<{ registrations: Registration[]; availability?: EventAvailability }>(
      `/api/manage/registrations${eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''}`,
      { cache: 'no-store' },
    ),

  registrationsCsvUrl: (eventId: string) => `/api/manage/registrations?eventId=${encodeURIComponent(eventId)}&format=csv`,

  registrationFileUrl: (r: Registration, index: number) =>
    `/api/manage/registrations/${encodeURIComponent(r.eventId)}/${encodeURIComponent(r.id)}/files/${index}`,

  updateRegistration: (r: Registration, patch: { status?: RegistrationStatus; notes?: string }) =>
    request<Registration>(`/api/manage/registrations/${encodeURIComponent(r.eventId)}/${encodeURIComponent(r.id)}`, json('PATCH', patch)),

  deleteRegistration: (r: Registration) =>
    request<void>(`/api/manage/registrations/${encodeURIComponent(r.eventId)}/${encodeURIComponent(r.id)}`, { method: 'DELETE' }),
};

export interface ClientPrincipal {
  identityProvider: string;
  userId: string;
  userDetails: string;
  userRoles: string[];
}

export async function fetchMe(): Promise<ClientPrincipal | null> {
  try {
    const res = await fetch('/.auth/me', { cache: 'no-store' });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.clientPrincipal ?? null;
  } catch {
    return null;
  }
}

export type AuthProvider = 'aad' | 'google';

export async function fetchAuthProviders(): Promise<AuthProvider[]> {
  try {
    const res = await fetch('/api/auth/providers');
    if (!res.ok) return ['aad'];
    const body = await res.json();
    return Array.isArray(body?.providers) && body.providers.length ? body.providers : ['aad'];
  } catch {
    return ['aad'];
  }
}

export const LOGIN_URL = (redirect = '/admin', provider: AuthProvider = 'aad') =>
  `/.auth/login/${provider}?post_login_redirect_uri=${encodeURIComponent(redirect)}`;
export const LOGOUT_URL = '/.auth/logout?post_logout_redirect_uri=/';
