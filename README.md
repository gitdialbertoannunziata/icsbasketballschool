# ICS Basketball School – sito web

Nuovo sito di [icsbasketballschool.it](https://icsbasketballschool.it) su **Azure Static Web Apps**, con pannello di gestione in `/admin` e tutti i dati su **Azure Blob Storage**.

📘 **[Guida al pannello di amministrazione](docs/admin/README.md)** (con screenshot): come gestire testi, news, eventi, iscrizioni, staff, documenti e galleria.

## Architettura

| Parte | Tecnologia | Cartella |
|---|---|---|
| Sito pubblico + pannello admin | React 19, Vite, Tailwind 4, React Router, TanStack Query, TipTap | `src/` |
| API | Azure Functions (Node 20, modello v4) gestite dalla Static Web App | `api/` |
| Tipi condivisi | TypeScript senza dipendenze, usato da frontend e API | `api/src/shared/types.ts` |
| Dati | Blob Storage: `content` (JSON), `media` (immagini/PDF, pubblico), `registrations` (privato) | |
| Email iscrizioni | Azure Communication Services | |
| Login admin | Microsoft (login integrato SWA) + ruolo `admin` tramite inviti | `staticwebapp.config.json` |
| Migrazione | Script che importa contenuti e media dal sito WordPress | `scripts/` |
| Infrastruttura | Bicep | `infra/main.bicep` |

**Contenuti** (`content/*.json`): `site` (testi, contatti, safeguarding, privacy), `news`, `staff`, `events` (con turni, quote, programma, info pratiche e modulo d'iscrizione configurabile), `documents`, `gallery` (album collegati agli eventi).
Ogni salvataggio dall'admin viene validato con zod e usa l'ETag del blob: se due persone modificano lo stesso contenuto, la seconda riceve l'avviso di ricaricare la pagina.

**Upload**: il browser ridimensiona le foto (webp, max 1920px, con miniatura per la galleria) e le carica direttamente sul blob tramite un SAS di 30 minuti rilasciato dall'API.

**Iscrizioni**: il modulo è generato dai campi configurati nell'evento. L'API valida i dati, controlla i posti disponibili, salva i dati e gli allegati nel container privato e invia l'email di conferma e quella di notifica alla segreteria. Dall'admin si gestiscono lo stato, le note, gli allegati (link SAS di 5 minuti) e l'export CSV per Excel.

## Sviluppo locale

### Con devcontainer (consigliato)
Apri la cartella in VS Code e scegli **Reopen in Container**: Node 20, Functions Core Tools e Azure CLI sono già installati. Poi esegui:

```bash
npm start                 # Azurite + SWA CLI (Vite + API) su http://localhost:4280
npm run storage:setup     # una volta: crea i container e il CORS su Azurite
npm run import            # una volta: importa contenuti e foto dal sito attuale
```

### Senza container
Servono Node 20+ e [Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local). Poi:

```bash
npm ci && npm --prefix api ci
cp api/local.settings.sample.json api/local.settings.json
npm start
```

Per il login locale, la SWA CLI mostra un modulo di login simulato: inserisci un'email qualsiasi e aggiungi il ruolo `admin`.

### Comandi utili
| Comando | Cosa fa |
|---|---|
| `npm test` | test frontend/script + API (Vitest) |
| `npm run build` | type-check + build di produzione |
| `npm run import -- --dry-run` | scarica i contenuti WP in `import-output/` senza toccare lo storage |
| `npm run import:check` | valida `import-output/` con gli schemi dell'API |
| `npm run import -- --force` | reimporta e sovrascrive i contenuti esistenti |

## Messa in produzione

1. **Login**: per ora si usa il login Microsoft integrato di Static Web Apps, senza registrazioni da creare. Google (e `ADMIN_EMAILS` tramite `GetRoles`) richiedono di tornare all'auth personalizzata con la sezione `auth` in `staticwebapp.config.json`.
2. **Infrastruttura**:
   ```bash
   az group create -n rg-icsbasketball -l westeurope
   az deployment group create -g rg-icsbasketball -f infra/main.bicep \
     -p adminEmails='persona1@outlook.com'
   ```
   Il template crea lo storage (container, CORS, soft delete e versioning), il servizio email ACS con dominio gestito, la Static Web App e tutte le app settings.
3. **Deploy**: copia il deployment token della SWA (portale → *Manage deployment token*) nel secret GitHub `AZURE_STATIC_WEB_APPS_API_TOKEN`. Ogni push su `main` esegue test e deploy, e ogni PR crea un ambiente di preview.
4. **Import dei contenuti** verso lo storage di produzione:
   ```bash
   STORAGE_CONNECTION_STRING='<connection string>' npm run import
   ```
5. **Dominio**: aggiungi `www.icsbasketballschool.it` e il dominio apex come custom domain della SWA, quindi aggiorna i DNS. I vecchi URL WordPress (`/camp-gressoney/`, `/iscrizioni/`, ecc.) sono già rediretti con un 301 in `staticwebapp.config.json`.

### Gestire gli amministratori
Con il login integrato il ruolo `admin` si assegna con gli inviti di Static Web Apps (portale → *Role management* → *Invite*, provider Microsoft, ruolo `admin`). Con l'auth personalizzata, invece, lo assegna la funzione `GetRoles` agli indirizzi in **`ADMIN_EMAILS`**.

### Variabili d'ambiente (API)
| Nome | Descrizione |
|---|---|
| `STORAGE_CONNECTION_STRING` | storage account (in locale `UseDevelopmentStorage=true`) |
| `ACS_CONNECTION_STRING`, `MAIL_FROM` | invio email; se mancano, le email vengono solo scritte nel log |
| `ADMIN_EMAILS` | email (Microsoft o Google) degli amministratori |
| `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` | facoltativi: solo con auth personalizzata |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | facoltativi: abilitano il login Google |
| `PUBLIC_SITE_URL` | usato per il link "Apri nel pannello" nelle email |
| `MEDIA_PUBLIC_BASE_URL` | facoltativo: CDN o dominio custom per le immagini |
