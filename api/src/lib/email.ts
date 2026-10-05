import { EmailClient } from '@azure/communication-email';
import type { InvocationContext } from '@azure/functions';

let client: EmailClient | undefined;

export interface MailMessage {
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Invia un'email tramite Azure Communication Services.
 * Se ACS non è configurato (sviluppo locale) il messaggio viene solo loggato.
 */
export async function sendMail(msg: MailMessage, ctx: InvocationContext): Promise<void> {
  const to = [...new Set(msg.to.map((t) => t.trim()).filter(Boolean))];
  if (to.length === 0) return;
  const cs = process.env.ACS_CONNECTION_STRING;
  const from = process.env.MAIL_FROM;
  if (!cs || !from) {
    ctx.log(`[email non inviata: ACS non configurato] to=${to.join(',')} subject="${msg.subject}"`);
    return;
  }
  client ??= new EmailClient(cs);
  try {
    const poller = await client.beginSend({
      senderAddress: from,
      recipients: { to: to.map((address) => ({ address })) },
      replyTo: msg.replyTo ? [{ address: msg.replyTo }] : undefined,
      content: { subject: msg.subject, html: msg.html },
    });
    await poller.pollUntilDone();
  } catch (err) {
    // L'iscrizione è già salvata: un errore email non deve far fallire la richiesta.
    ctx.error(`Invio email fallito (${msg.subject})`, err);
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
