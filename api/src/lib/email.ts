import { EmailClient } from '@azure/communication-email';
import type { InvocationContext } from '@azure/functions';

export { escapeHtml } from '../shared/emailTemplates';

let client: EmailClient | undefined;

export interface MailMessage {
  to: string[];
  /** Copia nascosta (CCN) */
  bcc?: string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Invia un'email tramite Azure Communication Services.
 * Se ACS non è configurato (sviluppo locale) il messaggio viene solo loggato.
 */
export async function sendMail(msg: MailMessage, ctx: InvocationContext): Promise<void> {
  const clean = (list: string[] = []) => [...new Set(list.map((t) => t.trim().toLowerCase()).filter(Boolean))];
  const to = clean(msg.to);
  const bcc = clean(msg.bcc).filter((a) => !to.includes(a));
  if (to.length === 0 && bcc.length === 0) return;
  const cs = process.env.ACS_CONNECTION_STRING;
  const from = process.env.MAIL_FROM;
  if (!cs || !from) {
    ctx.log(`[email non inviata: ACS non configurato] to=${to.join(',')} bcc=${bcc.join(',')} subject="${msg.subject}"`);
    return;
  }
  client ??= new EmailClient(cs);
  try {
    const poller = await client.beginSend({
      senderAddress: from,
      recipients: {
        to: to.map((address) => ({ address })),
        bcc: bcc.length ? bcc.map((address) => ({ address })) : undefined,
      },
      replyTo: msg.replyTo ? [{ address: msg.replyTo }] : undefined,
      content: { subject: msg.subject, html: msg.html },
    });
    await poller.pollUntilDone();
  } catch (err) {
    // L'iscrizione è già salvata: un errore email non deve far fallire la richiesta.
    ctx.error(`Invio email fallito (${msg.subject})`, err);
  }
}
