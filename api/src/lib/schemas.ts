import { z } from 'zod';
import type {
  ContentMap,
  ContentName,
  DocumentItem,
  EventItem,
  FormField,
  GalleryAlbum,
  NewsItem,
  SiteContent,
  StaffMember,
} from '../shared/types';

const str = (max = 500) => z.string().max(max);
const html = z.string().max(200_000);
const optStr = (max = 500) => z.string().max(max).optional();
const id = z.string().min(1).max(100);
const slug = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug non valido: usa lettere minuscole, numeri e trattini');
const emails = z.array(z.string().email().max(200)).max(20);
const emailTemplate = z.object({ subject: str(300), bodyHtml: z.string().max(50_000) }).optional();

export const siteSchema: z.ZodType<SiteContent> = z.object({
  name: str(200),
  heroTagline: str(500),
  heroSubtitle: optStr(1000),
  heroImage: optStr(),
  heroVideo: optStr(),
  logo: optStr(),
  logoWhite: optStr(),
  aboutTitle: str(200),
  aboutHtml: html,
  aboutImages: z.array(str()).max(50),
  facilities: z.array(z.object({ title: str(200), image: str() })).max(50),
  servicesHtml: html.optional(),
  contacts: z.object({
    email: str(200),
    phone: optStr(50),
    telegram: optStr(50),
    address: str(500),
    mapUrl: optStr(2000),
  }),
  legal: z.object({ name: str(200), address: str(500), taxCode: str(50) }),
  social: z.object({
    facebook: optStr(),
    instagram: optStr(),
    telegram: optStr(),
    youtube: optStr(),
  }),
  safeguardingHtml: html,
  privacyHtml: html,
  cookieHtml: html,
  footerText: optStr(1000),
  notifyEmails: emails,
  confirmationBccEmails: emails.optional(),
  emailTemplates: z.object({ confirmation: emailTemplate, notification: emailTemplate }).optional(),
});

export const newsSchema: z.ZodType<NewsItem[]> = z.array(
  z.object({
    id,
    slug,
    title: str(300),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    coverImage: optStr(),
    excerpt: str(2000),
    bodyHtml: html,
    published: z.boolean(),
  }),
);

export const staffSchema: z.ZodType<StaffMember[]> = z.array(
  z.object({
    id,
    name: str(200),
    role: str(200),
    group: z.enum(['staff', 'support']),
    photos: z.array(str()).max(20),
    bioHtml: html,
    order: z.number().int(),
    links: z.array(z.object({ label: str(100), url: str() })).max(10).optional(),
  }),
);

export const formFieldSchema: z.ZodType<FormField> = z.object({
  id: z.string().min(1).max(60).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'ID campo non valido'),
  label: str(300),
  type: z.enum(['text', 'email', 'tel', 'date', 'select', 'radio', 'checkbox', 'file', 'textarea', 'session']),
  required: z.boolean(),
  options: z.array(str(200)).max(50).optional(),
  section: optStr(200),
  help: optStr(1000),
});

export const eventsSchema: z.ZodType<EventItem[]> = z.array(
  z.object({
    id,
    slug,
    title: str(300),
    subtitle: optStr(500),
    status: z.enum(['draft', 'published', 'archived']),
    showInMenu: z.boolean().optional(),
    menuLabel: optStr(60),
    startDate: optStr(30),
    endDate: optStr(30),
    ageGroups: optStr(200),
    location: z.object({ name: str(300), address: optStr(), mapUrl: optStr(2000) }).optional(),
    coverImage: optStr(),
    poster: optStr(),
    descriptionHtml: html.optional(),
    sessions: z
      .array(
        z.object({
          id,
          label: str(200),
          start: str(30),
          end: str(30),
          price: z.number().nonnegative().optional(),
          capacity: z.number().int().nonnegative().optional(),
          soldOut: z.boolean().optional(),
          details: z.array(str(1000)).max(30).optional(),
        }),
      )
      .max(20),
    pricing: z.array(z.object({ label: str(300), amount: z.number(), notes: optStr(1000) })).max(30),
    includedHtml: html.optional(),
    scheduleItems: z.array(z.object({ time: str(20), activity: str(300) })).max(50),
    participationHtml: html.optional(),
    facilitiesHtml: html.optional(),
    howToReachHtml: html.optional(),
    whatToBringHtml: html.optional(),
    checkInOutHtml: html.optional(),
    requiredDocsHtml: html.optional(),
    paymentInfoHtml: html.optional(),
    refundPolicyHtml: html.optional(),
    discountsHtml: html.optional(),
    documentIds: z.array(id).max(50),
    galleryAlbumIds: z.array(id).max(50),
    registration: z.object({
      enabled: z.boolean(),
      opensAt: optStr(30),
      closesAt: optStr(30),
      introHtml: html.optional(),
      fields: z.array(formFieldSchema).max(60),
      consentText: str(2000),
      notifyEmails: emails,
      confirmationMessage: optStr(2000),
    }),
  }),
);

export const documentsSchema: z.ZodType<DocumentItem[]> = z.array(
  z.object({
    id,
    title: str(300),
    category: str(100),
    url: str(),
    fileName: str(300),
    size: z.number().nonnegative().optional(),
    uploadedAt: str(40),
    eventId: optStr(100),
    public: z.boolean(),
    description: optStr(2000),
  }),
);

export const gallerySchema: z.ZodType<GalleryAlbum[]> = z.array(
  z.object({
    id,
    title: str(300),
    eventId: optStr(100),
    year: z.number().int().min(1990).max(2100).optional(),
    coverImage: optStr(),
    credit: optStr(300),
    published: z.boolean(),
    items: z
      .array(
        z.object({
          id,
          type: z.enum(['image', 'video']),
          url: str(),
          thumbUrl: optStr(),
          caption: optStr(1000),
          width: z.number().optional(),
          height: z.number().optional(),
        }),
      )
      .max(2000),
  }),
);

export const contentSchemas: { [K in ContentName]: z.ZodType<ContentMap[K]> } = {
  site: siteSchema,
  news: newsSchema,
  staff: staffSchema,
  events: eventsSchema,
  documents: documentsSchema,
  gallery: gallerySchema,
};

/** Verifica unicità di id/slug nelle liste. */
export function checkUniqueness(name: ContentName, data: unknown): string | undefined {
  if (!Array.isArray(data)) return undefined;
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const item of data as { id: string; slug?: string }[]) {
    if (ids.has(item.id)) return `ID duplicato: ${item.id}`;
    ids.add(item.id);
    if (item.slug) {
      if (slugs.has(item.slug)) return `Slug duplicato in ${name}: ${item.slug}`;
      slugs.add(item.slug);
    }
  }
  if (name === 'events') {
    for (const ev of data as EventItem[]) {
      const fieldIds = new Set<string>();
      for (const f of ev.registration.fields) {
        if (fieldIds.has(f.id)) return `Campo duplicato "${f.id}" nel modulo di "${ev.title}"`;
        fieldIds.add(f.id);
      }
    }
  }
  return undefined;
}
