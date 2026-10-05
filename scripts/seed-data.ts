/**
 * Contenuti iniziali ricavati dal sito attuale (icsbasketballschool.it, WordPress).
 * Le immagini puntano ancora al vecchio sito: lo script di import le scarica e le ricarica sullo storage.
 * News, staff tecnico e gallerie vengono invece letti direttamente da WordPress da import-wp.ts.
 */
import type { DocumentItem, EventItem, FormField, SiteContent, StaffMember } from '../api/src/shared/types';

const WP = 'https://icsbasketballschool.it/wp-content/uploads/sites/3';

export const PRIVACY_CONSENT =
  "Ho letto e compreso la Privacy Policy ai sensi dell'art. 13 d.lgs. 196/2003 e del Regolamento UE 2016/679 (GDPR) e accetto integralmente i termini d'uso.";

export const site: SiteContent = {
  name: 'ICS Basketball School',
  heroTagline: 'Make improvements, not excuses. Commit to your dreams.',
  heroSubtitle:
    'Camp di specializzazione estivi e progetti di formazione per giocatori e allenatori: lavoro in piccoli gruppi, staff qualificato, strutture di primo livello.',
  heroVideo: `${WP}/2020/05/ICS-School_low.mp4`,
  logo: `${WP}/2020/05/icon-logo.png`,
  logoWhite: `${WP}/2020/05/logo-white.png`,
  aboutTitle: 'Chi siamo',
  aboutHtml:
    '<p>La ICS (X) Basketball School nasce dall’idea di creare una scuola di basket estiva dove ciascun giocatore di pallacanestro possa migliorare <strong>(IMPROVEMENT)</strong>, attraverso dedizione ed impegno <strong>(COMMITMENT)</strong>, le proprie capacità fisiche e tecniche <strong>(SKILLS)</strong>.</p>',
  aboutImages: [`${WP}/2020/05/SV_7210-scaled.jpg`, `${WP}/2020/05/IMG-20200527-WA0001.jpg`],
  facilities: [
    { title: 'La struttura', image: `${WP}/2023/02/Struttura-leone-XIII-1-scaled.jpg` },
    { title: 'Piscina', image: `${WP}/2023/02/Piscina.jpg` },
    { title: 'Palestra fitness e sala pesi', image: `${WP}/2023/02/Palestra-fitness-sal-pesi.jpg` },
    { title: 'Palazzetto', image: `${WP}/2023/02/Palazzetto-1.jpg` },
  ],
  servicesHtml:
    '<p>Accanto allo staff tecnico, i nostri iscritti possono contare su professionisti dedicati al benessere e alla prestazione: psicologo dello sport, nutrizionista e osteopata.</p>',
  contacts: {
    email: 'icsbasketballschool@gmail.com',
    telegram: '3337778848',
    address: 'Sport Haus Gressoney – Località Tschoarde 1, Gressoney-Saint-Jean (AO)',
    mapUrl: 'https://maps.google.com/?q=Gressoney+Sport+Haus+Tschoarde+1+Gressoney-Saint-Jean',
  },
  legal: {
    name: 'ASD ICS Basketball School',
    address: 'Via Lorè 2, 11020 Champorcher (AO)',
    taxCode: '91083250075',
  },
  social: {
    facebook: 'https://www.facebook.com/ICS-Basketball-School-105494574516508/',
    instagram: 'https://www.instagram.com/ICS_Basketball_School/',
  },
  safeguardingHtml:
    '<p><strong>Responsabile Safeguarding:</strong> Matteo Battuello (<a href="mailto:matteo.battuello@gmail.com">matteo.battuello@gmail.com</a>)</p>',
  privacyHtml: '',
  cookieHtml: '',
  notifyEmails: ['icsbasketballschool@gmail.com'],
};

/** Professionisti di supporto: la biografia viene completata dall'import con il testo dell'articolo WordPress indicato. */
export const supportStaff: (StaffMember & { wpPostId?: number })[] = [
  {
    id: 'staff-andrea-martinetti',
    name: 'Andrea Martinetti',
    role: 'Psicologo dello sport e mental trainer',
    group: 'support',
    photos: [],
    bioHtml:
      '<p>Psicologo sportivo e mental trainer, anche online. Mental Trainer certificato, laureato in Scienze Motorie e Psicologia.</p>',
    order: 100,
    links: [{ label: 'Instagram', url: 'https://www.instagram.com/andrea_mentaltrainer/' }],
    wpPostId: 1473,
  },
  {
    id: 'staff-giada-macri',
    name: 'Giada Macrì',
    role: 'Nutrizionista',
    group: 'support',
    photos: [],
    bioHtml:
      '<p>La nostra nutrizionista ufficiale al Camp ICS! Sportiva, appassionata e super preparata: Giada si sta specializzando in nutrizione sportiva.</p>',
    order: 101,
    wpPostId: 1635,
  },
  {
    id: 'staff-massimiliano-gagliardini',
    name: 'Massimiliano Gagliardini',
    role: 'Preparatore fisico nazionale',
    group: 'support',
    photos: [],
    bioHtml: '<p>Preparatore fisico nazionale, ha seguito il lavoro in palestra e in piscina degli atleti ICS Basketball School.</p>',
    order: 102,
    links: [{ label: 'Instagram', url: 'https://www.instagram.com/massimilianocimi/' }],
    wpPostId: 1629,
  },
];

export const documents: DocumentItem[] = [
  {
    id: 'doc-regolamento-2026',
    title: 'Regolamento Summer Camp 2026',
    category: 'Regolamenti',
    url: `${WP}/2026/01/Regolamento-2026.pdf`,
    fileName: 'Regolamento-2026.pdf',
    uploadedAt: '2026-01-15T10:00:00.000Z',
    eventId: 'summer-camp-gressoney-2026',
    public: true,
  },
  {
    id: 'doc-liberatoria-minori',
    title: 'Liberatoria per immagini (minorenni)',
    category: 'Liberatorie',
    url: `${WP}/2025/09/liberatoria-fotografica-2025.pdf`,
    fileName: 'liberatoria-fotografica-2025.pdf',
    uploadedAt: '2025-09-01T10:00:00.000Z',
    eventId: 'summer-camp-gressoney-2026',
    public: true,
  },
  {
    id: 'doc-liberatoria-maggiorenni',
    title: 'Liberatoria per immagini (maggiorenni)',
    category: 'Liberatorie',
    url: `${WP}/2025/09/liberatoria-fotografica-maggiorenni-2025.pdf`,
    fileName: 'liberatoria-fotografica-maggiorenni-2025.pdf',
    uploadedAt: '2025-09-01T10:00:00.000Z',
    eventId: 'summer-camp-gressoney-2026',
    public: true,
  },
  {
    id: 'doc-policy-minori',
    title: 'Modello organizzativo – policy minori',
    category: 'Safeguarding',
    url: `${WP}/2024/12/Modello_organizzativo_policy_minori_R.pdf`,
    fileName: 'Modello_organizzativo_policy_minori_R.pdf',
    uploadedAt: '2024-12-01T10:00:00.000Z',
    public: true,
  },
];

const campFields: FormField[] = [
  { id: 'settimana', label: 'Seleziona la settimana', type: 'session', required: true },
  { id: 'cognome', label: 'Cognome', type: 'text', required: true, section: '1) Dati atleta' },
  { id: 'nome', label: 'Nome', type: 'text', required: true, section: '1) Dati atleta' },
  { id: 'dataNascita', label: 'Data di nascita', type: 'date', required: true, section: '1) Dati atleta' },
  { id: 'codiceFiscale', label: 'Codice fiscale', type: 'text', required: true, section: '1) Dati atleta' },
  { id: 'luogoNascita', label: 'Luogo di nascita', type: 'text', required: true, section: '1) Dati atleta' },
  { id: 'email', label: 'Email', type: 'email', required: true, section: '1) Dati atleta' },
  { id: 'societa', label: 'Società di appartenenza', type: 'text', required: true, section: '1) Dati atleta' },
  { id: 'taglia', label: 'Taglia divisa', type: 'select', required: true, options: ['S', 'M', 'L', 'XL'], section: '1) Dati atleta' },
  {
    id: 'visitaOsteopatica',
    label: 'Visita posturale osteopatica (solo settimana 19-25 luglio) al costo di € 30,00',
    type: 'radio',
    required: true,
    options: ['Sì', 'No'],
    section: '1) Dati atleta',
  },
  { id: 'ricevuta', label: 'Contabile/ricevuta versamento (acconto)', type: 'file', required: true, section: '1) Dati atleta' },
  { id: 'certificatoMedico', label: 'Certificato medico', type: 'file', required: false, section: '1) Dati atleta' },
  { id: 'genitoreCognome', label: 'Cognome', type: 'text', required: true, section: '2) Dati genitore (per ricevuta)' },
  { id: 'genitoreNome', label: 'Nome', type: 'text', required: true, section: '2) Dati genitore (per ricevuta)' },
  { id: 'genitoreCodiceFiscale', label: 'Codice fiscale', type: 'text', required: true, section: '2) Dati genitore (per ricevuta)' },
  { id: 'genitoreIndirizzo', label: 'Indirizzo', type: 'text', required: true, section: '2) Dati genitore (per ricevuta)' },
  { id: 'genitoreCap', label: 'CAP', type: 'text', required: true, section: '2) Dati genitore (per ricevuta)' },
  { id: 'genitoreCitta', label: 'Città', type: 'text', required: true, section: '2) Dati genitore (per ricevuta)' },
  { id: 'genitoreProvincia', label: 'Provincia', type: 'text', required: true, section: '2) Dati genitore (per ricevuta)' },
  { id: 'genitoreTelefono', label: 'Telefono', type: 'tel', required: true, section: '2) Dati genitore (per ricevuta)' },
  { id: 'genitoreEmail', label: 'Email', type: 'email', required: true, section: '2) Dati genitore (per ricevuta)' },
];

const IBAN_HTML =
  '<ul><li>Intestatario: <strong>A.S.D. ICS Basketball School</strong></li><li>IBAN: <strong>IT30R0326822300052411827190</strong></li></ul>';

export const events: EventItem[] = [
  {
    id: 'summer-camp-gressoney-2026',
    slug: 'summer-camp-gressoney',
    title: 'Summer Camp Gressoney',
    subtitle: 'Camp di specializzazione per ragazzi e ragazze U13–U19 – max 40 posti',
    status: 'published',
    startDate: '2026-07-12',
    endDate: '2026-07-25',
    ageGroups: '2007 – 2014 (U13 – U19), anche per le ragazze',
    location: {
      name: 'Gressoney-Saint-Jean (AO)',
      address: 'Villa Belvedere, Via Obre Biel Waeg 2, 11025 Gressoney-Saint-Jean (AO) – Palazzetto Gressoney Sport Haus, Località Tschoarde 1',
      mapUrl: 'https://maps.google.com/?q=Villa+Belvedere+Via+Obre+Biel+Waeg+2+Gressoney-Saint-Jean',
    },
    coverImage: `${WP}/2020/05/SV_7224-scaled.jpg`,
    descriptionHtml:
      '<p><strong>ICS Basketball Camp</strong> è il Camp di Specializzazione dove ogni mattina ciascun giocatore di pallacanestro può, attraverso il lavoro in piccoli gruppi sul campo, in palestra e in sala video, migliorare <strong>(IMPROVEMENT)</strong>, con dedizione ed impegno <strong>(COMMITMENT)</strong>, le proprie capacità fisiche e tecniche <strong>(SKILLS)</strong>.</p><p>Nel pomeriggio si darà spazio alle collaborazioni offensive e difensive dal 2 vs 2 al 5 vs 5.</p><p>Attività speciali solo nella settimana 19-25 luglio gestite da:</p><ol><li><p>Psicologo sportivo</p></li><li><p>Nutrizionista</p></li></ol>',
    sessions: [
      {
        id: 'short-week',
        label: 'Short Week 1',
        start: '2026-07-12',
        end: '2026-07-16',
        price: 450,
        capacity: 40,
        details: [
          'Durata: 5 giorni / 4 notti (pensione completa)',
          'Annate 2007 – 2014 (U13 – U19), anche per le ragazze',
          'Pensione completa + assicurazione + divisa',
          'Staff: ICS Basketball School',
        ],
      },
      {
        id: 'long-week',
        label: 'Long Week 2',
        start: '2026-07-19',
        end: '2026-07-25',
        price: 700,
        capacity: 40,
        soldOut: true,
        details: [
          'Durata: 7 giorni / 6 notti (pensione completa)',
          'Annate 2007 – 2014 (U13 – U19)',
          'Pensione completa + assicurazione + divisa',
          'Staff: ICS Basketball School + psicologo sportivo + nutrizionista',
          'Visita posturale osteopatica su richiesta a € 30,00',
        ],
      },
    ],
    pricing: [
      { label: 'Short Week (12-16 luglio)', amount: 450, notes: 'Pensione completa + assicurazione + divisa' },
      { label: 'Long Week (19-25 luglio)', amount: 700, notes: 'Pensione completa + assicurazione + divisa + psicologo + nutrizionista' },
      { label: 'Visita posturale osteopatica', amount: 30, notes: 'Solo settimana 19-25 luglio, su richiesta' },
      { label: 'Cena dell’ultimo giorno', amount: 15, notes: 'Permette il ritiro dei ragazzi fino alle 21.30' },
      { label: 'Sconto fratelli', amount: -25, notes: 'Per ogni fratello iscritto' },
    ],
    includedHtml:
      '<ul><li><p>Pensione completa presso Villa Belvedere</p></li><li><p>Assicurazione</p></li><li><p>Divisa ufficiale del camp</p></li><li><p>Staff tecnico ICS Basketball School</p></li><li><p>Psicologo sportivo e nutrizionista (solo Long Week)</p></li></ul>',
    scheduleItems: [
      { time: '07:45', activity: 'Sveglia' },
      { time: '08:00', activity: 'Colazione' },
      { time: '09:00', activity: 'Attività con coach / preparatore fisico / analisi video' },
      { time: '12:00', activity: 'Fine attività – ritorno in albergo' },
      { time: '12:30', activity: 'Pranzo' },
      { time: '13:30', activity: 'Riposo' },
      { time: '15:00', activity: 'Ritorno ai campi' },
      { time: '18:45', activity: 'Fine attività e ritorno in albergo' },
      { time: '19:00', activity: 'Doccia / cena' },
      { time: '20:45', activity: 'Attività serali' },
      { time: '22:30', activity: 'In camera' },
      { time: '23:00', activity: 'Luci spente' },
    ],
    participationHtml:
      '<p>Il <strong>Camp di Specializzazione</strong> è strutturato così: i ragazzi verranno suddivisi dal nostro staff in base all’età e/o alle loro qualità tecniche e fisiche. Verranno creati dei <strong>microgruppi da 4/6 ragazzi</strong> per una migliore qualità del lavoro.</p>',
    facilitiesHtml:
      '<h3>Villa Belvedere</h3><p>Si trova a Gressoney-Saint-Jean in Val d’Aosta, nei pressi del Castello Savoia, nella Valle del Lys, a circa 1500 m s.l.m. e a 30 minuti dal casello autostradale di Pont-Saint-Martin. Villa Belvedere è una casa vacanze comoda e accogliente, ristrutturata di recente, immersa nel verde a 500 metri dal palazzetto dello sport. Dispone di stanze da 2, 3, 4 e 5 posti letto.</p><h3>Il Palazzetto (Gressoney Sport Haus)</h3><p>Località Tschoarde 1, Gressoney-Saint-Jean. Il Gressoney Sport Haus è il centro sportivo coperto tra i più completi e moderni della Valle d’Aosta, con una capienza fino a 400 persone. La struttura si estende su circa 4000 mq e comprende:</p><ul><li><p>una piscina coperta regolamentare da 25 metri con 5 corsie</p></li><li><p>un campo da gioco per basket, calcetto, volley e tennis</p></li><li><p>due campi da squash</p></li><li><p>una palestra fitness</p></li><li><p>area sauna e bagno turco</p></li><li><p>una sala massaggi con osteopata</p></li><li><p>zona boulder d’arrampicata</p></li></ul>',
    howToReachHtml:
      '<ol><li><p>Prendi la A5 in direzione Aosta.</p></li><li><p>Esci a Pont-Saint-Martin.</p></li><li><p>Segui la SR44 in direzione di Via Obre Biel Waeg a Gressoney-Saint-Jean.</p></li></ol>',
    whatToBringHtml:
      '<ol><li><p>Vestiario da montagna.</p></li><li><p>Burro cacao e crema solare.</p></li><li><p>Costume, ciabatte ed asciugamano per piscina.</p></li><li><p>Vestiario per allenarsi (due paia di scarpe da basket, pantaloncini e magliette).</p></li><li><p>Tuta e giacca impermeabile per gli spostamenti dalla struttura al palazzetto.</p></li></ol>',
    checkInOutHtml:
      '<p>La registrazione e l’arrivo sono previsti <strong>dalle 15.00 alle 16.00 di domenica 12 e 19 luglio 2026</strong> presso Villa Belvedere (Via Obre Biel Waeg 2, 11025 Gressoney-Saint-Jean AO).</p><p>Il camp termina <strong>giovedì 16 luglio e sabato 25 luglio alle ore 14.00</strong>, al termine del pranzo.</p><p>Possibilità di venire a ritirare i ragazzi dalle 14 alle 20 dell’ultimo giorno (in caso di cena, al costo di € 15 presso l’hotel Belvedere, è possibile ritirare i ragazzi fino alle 21.30).</p>',
    requiredDocsHtml:
      '<p>Per perfezionare l’iscrizione inoltra via email a <a href="mailto:icsbasketballschool@gmail.com">icsbasketballschool@gmail.com</a>:</p><ol><li><p>Copia della tessera sanitaria</p></li><li><p>Copia della carta d’identità</p></li><li><p>La liberatoria per immagini/video compilata (scaricabile qui a lato)</p></li></ol>',
    paymentInfoHtml: `<p><strong>Acconto</strong> tramite bonifico di € 350 (oppure € 450 se l’iscrizione avviene dopo il 31 maggio):</p>${IBAN_HTML}<p>Nella causale indicare: <strong>quota associativa + iscrizione</strong>, <strong>nome e cognome dell’atleta</strong>.</p><p><strong>Saldo</strong> entro il 31 maggio: € 100 (settimana 12-16 luglio) o € 350 (settimana 19-25 luglio).</p><p>L’iscrizione deve avvenire almeno 72 ore prima dell’inizio della settimana per la copertura assicurativa.</p>`,
    refundPolicyHtml:
      '<p>Se un iscritto recede almeno 30 (trenta) giorni prima dell’inizio del camp ha diritto al rimborso del 50% delle somme versate, al netto dell’acconto. Nessun rimborso è accordato a chi: 1) non ha consegnato tutta la documentazione prevista nel Regolamento come necessaria per l’iscrizione; 2) non si presenta agli allenamenti; 3) si ritira durante lo svolgimento del camp; 4) viene espulso dal camp.</p><p>Qualora l’iscritto presenti, prima dell’inizio del camp, un certificato medico di grave infortunio che ne precluda la partecipazione, le quote versate verranno interamente rimborsate al netto delle spese alberghiere e di segreteria che ammontano ad € 350,00 (nel caso in cui l’organizzazione sia in grado di sostituire l’atleta con una nuova iscrizione il rimborso sarà del 90% dell’intera quota versata).</p>',
    discountsHtml: '<ul><li><p>Fratelli: quota scontata di € 25,00 per ogni fratello.</p></li></ul>',
    documentIds: ['doc-regolamento-2026', 'doc-liberatoria-minori', 'doc-liberatoria-maggiorenni'],
    galleryAlbumIds: [],
    registration: {
      enabled: false,
      introHtml: `<h3>Modalità di iscrizione</h3><ol><li><p>Verifica la disponibilità dei posti (max 40 per settimana).</p></li><li><p>Effettua il bonifico dell’acconto di € 350 (oppure € 450 se l’iscrizione è successiva al 31 maggio):</p></li></ol>${IBAN_HTML}<p>Nella causale indicare: <strong>quota associativa + iscrizione</strong> e <strong>nome e cognome dell’atleta</strong>.</p><ol start="3"><li><p>Compila il modulo qui sotto allegando la contabile dell’acconto. Riceverai una email di conferma all’indirizzo indicato (verifica anche lo spam).</p></li><li><p>Saldo entro il 31 maggio di € 100 (settimana 12-16 luglio) o di € 350 (settimana 19-25 luglio).</p></li></ol>`,
      fields: campFields,
      consentText: PRIVACY_CONSENT,
      notifyEmails: [],
      confirmationMessage:
        'Abbiamo ricevuto la tua richiesta di prenotazione. Ti invieremo la conferma definitiva dopo la verifica dell’acconto. Ricordati di inviare via email tessera sanitaria, carta d’identità e liberatoria.',
    },
  },
  {
    id: 'progetto-13-19-beyond-2026',
    slug: 'progetto-13-19-beyond',
    title: 'Progetto 13-19 & Beyond',
    subtitle: 'Corso di formazione per allenatori del settore giovanile – 17 relatori, solo 75 posti',
    status: 'published',
    startDate: '2026-10-24',
    endDate: '2027-06-30',
    location: { name: 'Online + lezioni pratiche in palestra' },
    poster: `${WP}/2026/09/Locandina.jpeg`,
    descriptionHtml:
      '<p><strong>Corso di formazione per allenatori del settore giovanile</strong>, dal 24 ottobre 2026 a giugno 2027.</p><ul><li><p>Lezioni online + lezioni pratiche in palestra</p></li><li><p>Possibilità di rivedere le lezioni per gli iscritti</p></li><li><p><strong>17 relatori</strong> – solo <strong>75 posti</strong> disponibili</p></li></ul><h3>I relatori</h3><p>Maurizio Messina, Filippo Galli, Carlo Colella, Paolo Galbiati, Carlo Favero, Goran Bjedov, Marco Crespi, Claudio Maino, Franco Cumbat, Michele Catalani, Fabio Fossati, Stefano Bizzozi, Alessandro Ramagli, Stefano Vanoncini, Giorgio Piastra, Adam Filippi, Riccardo Cavaliere.</p><p>Info: Federico Danna – <a href="tel:+393357063623">+39 335 706 3623</a></p>',
    sessions: [
      {
        id: 'stagione-2026-27',
        label: 'Stagione 2026/27',
        start: '2026-10-24',
        end: '2027-06-30',
        price: 200,
        capacity: 75,
      },
    ],
    pricing: [{ label: 'Quota di partecipazione', amount: 200, notes: 'Quota associativa + iscrizione' }],
    scheduleItems: [],
    paymentInfoHtml: `<p>Bonifico di <strong>€ 200</strong> a:</p>${IBAN_HTML}<p>Nella causale indicare: <strong>quota associativa + iscrizione</strong>, <strong>nome e cognome</strong>.</p>`,
    documentIds: [],
    galleryAlbumIds: [],
    registration: {
      enabled: true,
      introHtml: `<h3>Modalità di iscrizione</h3><ol><li><p>Effettua il bonifico di € 200 a:</p></li></ol>${IBAN_HTML}<p>Nella causale indicare: <strong>quota associativa + iscrizione</strong> e <strong>nome e cognome</strong>.</p><ol start="2"><li><p>Inserisci i tuoi dati e invia la richiesta di prenotazione allegando la contabile. Riceverai una email di conferma (verifica anche lo spam).</p></li></ol>`,
      fields: [
        { id: 'cognome', label: 'Cognome', type: 'text', required: true, section: 'I tuoi dati' },
        { id: 'nome', label: 'Nome', type: 'text', required: true, section: 'I tuoi dati' },
        { id: 'dataNascita', label: 'Data di nascita', type: 'date', required: true, section: 'I tuoi dati' },
        { id: 'luogoNascita', label: 'Luogo di nascita', type: 'text', required: false, section: 'I tuoi dati' },
        { id: 'email', label: 'Email', type: 'email', required: true, section: 'I tuoi dati' },
        { id: 'codiceFiscale', label: 'Codice fiscale', type: 'text', required: true, section: 'I tuoi dati' },
        { id: 'societa', label: 'Società di appartenenza', type: 'text', required: true, section: 'I tuoi dati' },
        { id: 'ricevuta', label: 'Contabile/ricevuta versamento', type: 'file', required: true, section: 'I tuoi dati' },
      ],
      consentText: PRIVACY_CONSENT,
      notifyEmails: [],
      confirmationMessage: 'Abbiamo ricevuto la tua richiesta di iscrizione al corso. Ti invieremo la conferma dopo la verifica del pagamento.',
    },
  },
  // Edizioni passate, usate per collegare gli album storici della galleria.
  ...(
    [
      ['gressoney-2023-2024', 'Summer Camp Gressoney 2023–2024', '2023-07-01', '2024-07-31', 'Gressoney-Saint-Jean (AO)'],
      ['venaria-2021', 'Summer Camp Venaria 2021', '2021-07-01', '2021-07-31', 'Venaria Reale (TO)'],
      ['estate-2020', 'Summer Camp Estate 2020', '2020-07-01', '2020-08-31', ''],
    ] as const
  ).map(
    ([id, title, startDate, endDate, place]): EventItem => ({
      id,
      slug: id,
      title,
      status: 'archived',
      startDate,
      endDate,
      location: place ? { name: place } : undefined,
      sessions: [],
      pricing: [],
      scheduleItems: [],
      documentIds: [],
      galleryAlbumIds: [],
      registration: { enabled: false, fields: [], consentText: PRIVACY_CONSENT, notifyEmails: [] },
    }),
  ),
];

/** Album della pagina /galleria di WordPress: titolo, evento collegato e ID dei media nello shortcode [vc_gallery]. */
export const galleryAlbums = [
  { id: 'album-gressoney-2023-2024', title: 'Foto e video Gressoney 2023–2024', eventId: 'gressoney-2023-2024', year: 2024, galleryIndex: 0 },
  { id: 'album-venaria-2021', title: 'Foto e video Venaria 2021', eventId: 'venaria-2021', year: 2021, galleryIndex: 2 },
  { id: 'album-estate-2020', title: 'Foto e video Estate 2020', eventId: 'estate-2020', year: 2020, galleryIndex: 3 },
  {
    id: 'album-cristiana-castano',
    title: 'Foto di Cristiana Castano',
    eventId: 'estate-2020',
    year: 2020,
    galleryIndex: 4,
    credit: 'Cristiana Castano',
  },
];
