import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { adminEmails } from '../lib/auth';

interface RolesRequest {
  identityProvider?: string;
  userId?: string;
  userDetails?: string;
  claims?: { typ: string; val: string }[];
}

/**
 * rolesSource di Static Web Apps: viene chiamata dopo ogni login
 * e assegna il ruolo "admin" agli indirizzi presenti in ADMIN_EMAILS.
 * Gli inviti fatti dal portale Azure continuano a funzionare in parallelo.
 */
async function getRoles(req: HttpRequest): Promise<HttpResponseInit> {
  const body = (await req.json().catch(() => ({}))) as RolesRequest;
  const candidates = new Set<string>();
  if (body.userDetails) candidates.add(body.userDetails.toLowerCase());
  for (const c of body.claims ?? []) {
    if (/email/i.test(c.typ) && c.val) candidates.add(c.val.toLowerCase());
  }
  const admins = adminEmails();
  const isAdmin = [...candidates].some((e) => admins.includes(e));
  return { jsonBody: { roles: isAdmin ? ['admin'] : [] } };
}

app.http('GetRoles', { methods: ['POST'], authLevel: 'anonymous', route: 'GetRoles', handler: getRoles });
