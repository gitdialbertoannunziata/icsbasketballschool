import { ApiError } from '../../lib/api';
import { useToast } from '../Toast';

/** Esegue un salvataggio mostrando un messaggio di esito comprensibile. */
export function useSaveFeedback() {
  const toast = useToast();
  return async function run(fn: () => Promise<unknown>, successMessage = 'Modifiche salvate'): Promise<boolean> {
    try {
      await fn();
      toast(successMessage, 'success');
      return true;
    } catch (e) {
      if (e instanceof ApiError) {
        const detail = e.issues?.length ? ` (${e.issues.join('; ')})` : '';
        toast(e.message + detail, 'error');
      } else {
        toast('Errore di connessione: riprova.', 'error');
      }
      return false;
    }
  };
}
