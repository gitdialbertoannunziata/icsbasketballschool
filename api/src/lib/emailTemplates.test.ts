import { describe, expect, it } from 'vitest';
import { DEFAULT_EMAIL_TEMPLATES, renderTemplate, resolveTemplate } from '../shared/emailTemplates';
import { toPublic } from '../functions/content';
import { defaultContent } from './defaults';
import { siteSchema } from './schemas';

describe('modelli email', () => {
  const vars = {
    text: { evento: 'Camp <2026>', codice: 'X1', nome: 'Mario Rossi', messaggio: '' },
    html: { riepilogo: '<table><tr><td>dati</td></tr></table>' },
  };

  it('usa il testo predefinito se non personalizzato, campo per campo', () => {
    expect(resolveTemplate('confirmation')).toEqual(DEFAULT_EMAIL_TEMPLATES.confirmation);
    const t = resolveTemplate('notification', { notification: { subject: 'Ciao {{nome}}', bodyHtml: ' ' } });
    expect(t.subject).toBe('Ciao {{nome}}');
    expect(t.bodyHtml).toBe(DEFAULT_EMAIL_TEMPLATES.notification.bodyHtml);
  });

  it('sostituisce i segnaposto, esegue l’escape del testo e inserisce l’HTML', () => {
    const out = renderTemplate(
      { subject: 'Iscrizione {{ evento }} – {{codice}}', bodyHtml: '<p>Ciao {{nome}}, {{evento}}</p><p>{{riepilogo}}</p><p>{{messaggio}}</p><p>{{ignoto}}</p>' },
      vars,
    );
    expect(out.subject).toBe('Iscrizione Camp <2026> – X1');
    expect(out.html).toBe('<p>Ciao Mario Rossi, Camp &lt;2026&gt;</p><table><tr><td>dati</td></tr></table><p>{{ignoto}}</p>');
  });

  it('salva i modelli e li nasconde nella vista pubblica', () => {
    const site = {
      ...defaultContent.site,
      confirmationBccEmails: ['segreteria@example.com'],
      emailTemplates: { confirmation: { subject: 'Ok', bodyHtml: '<p>Ok</p>' } },
    };
    expect(siteSchema.safeParse(site).success).toBe(true);
    const pub = toPublic('site', site) as Record<string, unknown>;
    expect(pub.confirmationBccEmails).toBeUndefined();
    expect(pub.emailTemplates).toBeUndefined();
  });
});
