/**
 * Prepara lo storage: crea i container e imposta le regole CORS per l'upload diretto dal browser.
 *
 *   npm run storage:setup                          # Azurite locale
 *   STORAGE_CONNECTION_STRING=... npm run storage:setup -- --origin https://www.icsbasketballschool.it
 */
import { containers, service } from './lib/storage';

const args = process.argv.slice(2);
const origins = args.flatMap((a, i) => (a === '--origin' && args[i + 1] ? [args[i + 1]] : []));
const allowedOrigins = origins.length ? origins.join(',') : '*';

async function main() {
  const c = containers();
  await c.content.createIfNotExists();
  await c.registrations.createIfNotExists();
  await c.media.createIfNotExists({ access: 'blob' });
  // Se il container esisteva già senza accesso pubblico, lo imposta.
  await c.media.setAccessPolicy('blob');

  const svc = service();
  const props = await svc.getProperties();
  await svc.setProperties({
    ...props,
    cors: [
      {
        allowedOrigins,
        allowedMethods: 'GET,HEAD,PUT,OPTIONS',
        allowedHeaders: '*',
        exposedHeaders: '*',
        maxAgeInSeconds: 3600,
      },
    ],
  });
  console.log(`✔ Container pronti (content, media [pubblico], registrations). CORS: ${allowedOrigins}`);
}

main().catch((e) => {
  console.error('✖', e.message ?? e);
  console.error('  Azurite è avviato? (npm run azurite)');
  process.exit(1);
});
