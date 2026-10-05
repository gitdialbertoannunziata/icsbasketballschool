import type { HttpRequest, HttpResponseInit } from '@azure/functions';

export interface ClientPrincipal {
  identityProvider: string;
  userId: string;
  userDetails: string;
  userRoles: string[];
}

/** Legge l'header x-ms-client-principal iniettato da Static Web Apps. */
export function getPrincipal(req: HttpRequest): ClientPrincipal | undefined {
  const header = req.headers.get('x-ms-client-principal');
  if (!header) return undefined;
  try {
    return JSON.parse(Buffer.from(header, 'base64').toString('utf8')) as ClientPrincipal;
  } catch {
    return undefined;
  }
}

/**
 * Difesa in profondità: le route /api/manage/* sono già protette da staticwebapp.config.json,
 * ma ricontrolliamo il ruolo anche qui. Restituisce una risposta di errore se l'utente non è admin.
 */
export function requireAdmin(req: HttpRequest): HttpResponseInit | undefined {
  const p = getPrincipal(req);
  if (!p) return { status: 401, jsonBody: { error: 'Accesso richiesto' } };
  if (!p.userRoles?.includes('admin')) return { status: 403, jsonBody: { error: 'Permessi insufficienti' } };
  return undefined;
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
