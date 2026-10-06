// Tipi condivisi tra frontend (src/) e API (api/).
// Questo file NON deve importare librerie esterne: viene incluso anche nella build del frontend.

export const CONTENT_NAMES = ['site', 'news', 'staff', 'events', 'documents', 'gallery'] as const;
export type ContentName = (typeof CONTENT_NAMES)[number];

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  telegram?: string;
  youtube?: string;
}

export interface EmailTemplate {
  subject: string;
  bodyHtml: string;
}

export interface EmailTemplates {
  /** Email di conferma inviata a chi si iscrive */
  confirmation?: EmailTemplate;
  /** Avviso di nuova iscrizione inviato agli indirizzi di notifica */
  notification?: EmailTemplate;
}

export interface SiteContent {
  name: string;
  heroTagline: string;
  heroSubtitle?: string;
  heroImage?: string;
  /** Video di sfondo della copertina (mp4/webm, muto e in loop). L'immagine resta come anteprima. */
  heroVideo?: string;
  logo?: string;
  logoWhite?: string;
  aboutTitle: string;
  aboutHtml: string;
  aboutImages: string[];
  facilities: { title: string; image: string }[];
  servicesHtml?: string;
  contacts: {
    email: string;
    phone?: string;
    telegram?: string;
    address: string;
    mapUrl?: string;
  };
  legal: {
    name: string;
    address: string;
    taxCode: string;
  };
  social: SocialLinks;
  safeguardingHtml: string;
  privacyHtml: string;
  cookieHtml: string;
  footerText?: string;
  /** Indirizzi che ricevono le notifiche di nuove iscrizioni (default per tutti gli eventi) */
  notifyEmails: string[];
  /** Indirizzi amministrativi in copia nascosta su ogni email di conferma inviata a chi si iscrive */
  confirmationBccEmails?: string[];
  /** Testi personalizzati delle email (se assenti si usano quelli predefiniti) */
  emailTemplates?: EmailTemplates;
}

export interface NewsItem {
  id: string;
  slug: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  coverImage?: string;
  excerpt: string;
  bodyHtml: string;
  published: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  group: 'staff' | 'support';
  photos: string[];
  bioHtml: string;
  order: number;
  links?: { label: string; url: string }[];
}

export type FormFieldType = 'text' | 'email' | 'tel' | 'date' | 'select' | 'radio' | 'checkbox' | 'file' | 'textarea' | 'session';

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  options?: string[];
  section?: string;
  help?: string;
}

export interface EventSession {
  id: string;
  label: string;
  start: string;
  end: string;
  price?: number;
  capacity?: number;
  soldOut?: boolean;
  details?: string[];
}

export interface PriceItem {
  label: string;
  amount: number;
  notes?: string;
}

export interface ScheduleItem {
  time: string;
  activity: string;
}

export interface EventRegistrationConfig {
  enabled: boolean;
  opensAt?: string;
  closesAt?: string;
  introHtml?: string;
  fields: FormField[];
  consentText: string;
  notifyEmails: string[];
  confirmationMessage?: string;
}

export type EventStatus = 'draft' | 'published' | 'archived';

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  status: EventStatus;
  startDate?: string;
  endDate?: string;
  ageGroups?: string;
  location?: { name: string; address?: string; mapUrl?: string };
  coverImage?: string;
  poster?: string;
  descriptionHtml?: string;
  sessions: EventSession[];
  pricing: PriceItem[];
  includedHtml?: string;
  scheduleItems: ScheduleItem[];
  participationHtml?: string;
  facilitiesHtml?: string;
  howToReachHtml?: string;
  whatToBringHtml?: string;
  checkInOutHtml?: string;
  requiredDocsHtml?: string;
  paymentInfoHtml?: string;
  refundPolicyHtml?: string;
  discountsHtml?: string;
  documentIds: string[];
  galleryAlbumIds: string[];
  registration: EventRegistrationConfig;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: string;
  url: string;
  fileName: string;
  size?: number;
  uploadedAt: string;
  eventId?: string;
  public: boolean;
  description?: string;
}

export interface GalleryMedia {
  id: string;
  type: 'image' | 'video';
  url: string; // immagine piena / file video / URL YouTube
  thumbUrl?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  eventId?: string;
  year?: number;
  coverImage?: string;
  credit?: string;
  published: boolean;
  items: GalleryMedia[];
}

export type ContentMap = {
  site: SiteContent;
  news: NewsItem[];
  staff: StaffMember[];
  events: EventItem[];
  documents: DocumentItem[];
  gallery: GalleryAlbum[];
};

export type RegistrationStatus = 'nuova' | 'confermata' | 'pagata' | 'annullata';
export const REGISTRATION_STATUSES: RegistrationStatus[] = ['nuova', 'confermata', 'pagata', 'annullata'];

export interface RegistrationFile {
  fieldId: string;
  name: string;
  blobName: string;
  size: number;
  contentType: string;
}

export interface Registration {
  id: string;
  eventId: string;
  eventTitle: string;
  sessionId?: string;
  createdAt: string;
  status: RegistrationStatus;
  notes?: string;
  values: Record<string, string | boolean>;
  files: RegistrationFile[];
  email?: string;
}

export interface UploadTicket {
  uploadUrl: string;
  url: string;
  blobName: string;
}

export interface EventAvailability {
  sessions: Record<string, { taken: number; capacity?: number; available?: number; soldOut: boolean }>;
}
