import { app, HttpResponseInit } from '@azure/functions';

async function authProviders(): Promise<HttpResponseInit> {
  const google = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return {
    jsonBody: { providers: google ? ['aad', 'google'] : ['aad'] },
    headers: { 'Cache-Control': 'public, max-age=300' },
  };
}

app.http('auth-providers', { methods: ['GET'], authLevel: 'anonymous', route: 'auth/providers', handler: authProviders });
