/** Verifica che i JSON in ./import-output rispettino gli schemi dell'API (npm run import:check). */
import { readFileSync } from 'node:fs';
import { checkUniqueness, contentSchemas } from '../api/src/lib/schemas';
import { CONTENT_NAMES } from '../api/src/shared/types';

let ok = true;
for (const n of CONTENT_NAMES) {
  const data = JSON.parse(readFileSync(`import-output/${n}.json`, 'utf8'));
  const r = contentSchemas[n].safeParse(data);
  const dup = checkUniqueness(n, data);
  if (!r.success || dup) {
    ok = false;
    console.log('✖', n, dup ?? r.error!.issues.slice(0, 5));
  } else console.log('✔', n, Array.isArray(data) ? `${data.length} elementi` : '');
}
process.exit(ok ? 0 : 1);
