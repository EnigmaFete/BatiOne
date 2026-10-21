/**
 * L'URL de l'API est TOUJOURS relative à l'origine qui sert la page (same-origin), jamais un
 * host:port figé ou dérivé séparément. Next.js (apps/web/next.config.js) proxie /api/* vers
 * l'API NestJS locale, donc le navigateur ne voit jamais qu'une seule origine. Raison concrète,
 * pas théorique : le cookie de rafraîchissement httpOnly est `SameSite=Lax` — toute origine
 * distincte (host OU port différent) est "cross-site" pour le navigateur, qui n'envoie alors
 * jamais le cookie, cassant silencieusement le rafraîchissement de session (401 systématique,
 * déconnexions intempestives observées et vérifiées). Rester strictement same-origin règle ça
 * de façon structurelle, et fonctionne sans configuration à changer à la main que l'app soit
 * ouverte via localhost, une IP locale, ou un tunnel public (ngrok, etc.) qui n'expose qu'un
 * seul port à la fois.
 */
function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/v1`;
  }
  // Repli pour un éventuel rendu serveur — n'exécute aucun appel réseau sensible au cookie.
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001/api/v1';
}

const API_BASE_URL = resolveApiBaseUrl();

export interface ApiErreurPayload {
  succes: false;
  erreur: { code: string; message: string; horodatage: string };
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
  }
}

interface EtatAuthGlobal {
  accessToken: string | null;
  minuteurRenouvellement: ReturnType<typeof setTimeout> | null;
  rafraichissementEnCours: Promise<string> | null;
}

/**
 * État de session conservé sur `window`, jamais sur une variable de module (`let` au niveau du
 * fichier). En développement, Next.js/webpack peut regrouper ce module séparément dans CHAQUE
 * chunk de page plutôt que dans un chunk partagé unique — deux pages se retrouvent alors avec
 * deux instances indépendantes du module, donc deux variables de module indépendantes, et le
 * jeton posé par l'une est invisible pour l'autre. Observé et vérifié en conditions réelles (bug
 * à l'origine des déconnexions intempestives à chaque navigation). `window` est un singleton
 * véritable, immunisé contre ce découpage — et n'expose rien de plus à un XSS qu'une variable de
 * module ne l'aurait déjà fait (les deux sont lisibles par tout script exécuté sur la page).
 */
function etatGlobal(): EtatAuthGlobal {
  const w = window as unknown as { __BATIONE_AUTH__?: EtatAuthGlobal };
  if (!w.__BATIONE_AUTH__) {
    w.__BATIONE_AUTH__ = { accessToken: null, minuteurRenouvellement: null, rafraichissementEnCours: null };
  }
  return w.__BATIONE_AUTH__;
}

export function definirJetonAcces(token: string | null): void {
  etatGlobal().accessToken = token;
  planifierRenouvellementProactif(token);
}

export function obtenirJetonAcces(): string | null {
  return etatGlobal().accessToken;
}

/**
 * Décode la charge utile d'un JWT pour en lire `exp` — jamais pour en vérifier la signature
 * (ça reste le rôle exclusif du serveur). Sert uniquement à planifier un renouvellement proactif
 * côté UI ; une erreur de décodage ne doit jamais faire planter l'application.
 */
function lireExpirationJeton(token: string): number | null {
  try {
    const [, charge] = token.split('.');
    const decode = typeof atob === 'function' ? atob : (s: string) => Buffer.from(s, 'base64').toString('binary');
    const payload = JSON.parse(decodeURIComponent(escape(decode(charge.replace(/-/g, '+').replace(/_/g, '/')))));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Renouvelle le jeton d'accès en arrière-plan avant son expiration, pour que l'utilisateur ne
 * subisse jamais un 401 pendant un usage normal de l'application.
 */
function planifierRenouvellementProactif(token: string | null): void {
  const etat = etatGlobal();
  if (etat.minuteurRenouvellement) {
    clearTimeout(etat.minuteurRenouvellement);
    etat.minuteurRenouvellement = null;
  }
  if (!token) return;

  const expirationMs = lireExpirationJeton(token);
  if (!expirationMs) return;

  // Renouvelle aux 80% de la durée de vie restante (jamais avant 5s, pour éviter une boucle
  // serrée si l'horloge du poste est décalée ou si le jeton est déjà quasi expiré).
  const delaiMs = Math.max(5_000, (expirationMs - Date.now()) * 0.8);
  etat.minuteurRenouvellement = setTimeout(() => {
    rafraichirSession().catch(() => {
      // Échec silencieux ici : si le renouvellement proactif échoue (jeton de rafraîchissement
      // expiré/révoqué), la prochaine requête API déclenchera le flux 401 -> rafraîchir -> ou,
      // en cas d'échec, une redirection explicite gérée par l'appelant (cf. useMoi).
    });
  }, delaiMs);
}

/**
 * Rafraîchit la session via le cookie httpOnly. Dédupliquée sur l'état global : si plusieurs
 * appels concurrents la déclenchent (ex. deux composants montés simultanément en React Strict
 * Mode), ils partagent la même requête HTTP au lieu d'en émettre N — une rotation de jeton de
 * rafraîchissement révoque l'ancien jeton immédiatement (cf. AuthService.rafraichir), donc un
 * second appel concurrent utilisant encore l'ancien jeton échouerait sinon avec un faux 401.
 */
export function rafraichirSession(): Promise<string> {
  const etat = etatGlobal();
  if (etat.rafraichissementEnCours) return etat.rafraichissementEnCours;

  etat.rafraichissementEnCours = fetch(`${API_BASE_URL}/auth/rafraichir`, {
    method: 'POST',
    credentials: 'include',
  })
    .then(async (response) => {
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const erreur = (body as ApiErreurPayload | null)?.erreur;
        throw new ApiError(erreur?.code ?? 'JETON_INVALIDE', erreur?.message ?? 'Session expirée.', response.status);
      }
      const { accessToken } = (body as { succes: true; donnees: { accessToken: string } }).donnees;
      definirJetonAcces(accessToken);
      return accessToken;
    })
    .finally(() => {
      etatGlobal().rafraichissementEnCours = null;
    });

  return etat.rafraichissementEnCours;
}

const ENDPOINTS_SANS_RENOUVELLEMENT = ['/auth/connexion', '/auth/rafraichir'];

async function requeteApi<T>(path: string, options: RequestInit = {}, dejaRetente = false): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const jeton = obtenirJetonAcces();
  if (jeton) {
    headers.set('Authorization', `Bearer ${jeton}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const erreur = (body as ApiErreurPayload | null)?.erreur;

    // Un 401 (jeton d'accès absent/expiré) déclenche un rafraîchissement silencieux et UNE
    // seule nouvelle tentative — jamais sur les routes d'auth elles-mêmes, pour ne pas boucler.
    const peutRenouveler = response.status === 401 && !dejaRetente && !ENDPOINTS_SANS_RENOUVELLEMENT.includes(path);
    if (peutRenouveler) {
      try {
        await rafraichirSession();
        return requeteApi<T>(path, options, true);
      } catch {
        // Le rafraîchissement a réellement échoué (session expirée pour de bon) : on retombe
        // sur l'erreur 401 d'origine, que l'appelant (ex. useMoi) traite comme une déconnexion.
      }
    }

    throw new ApiError(erreur?.code ?? 'ERREUR_INCONNUE', erreur?.message ?? 'Une erreur est survenue.', response.status);
  }

  return (body as { succes: true; donnees: T }).donnees;
}

export const api = {
  get: <T>(path: string) => requeteApi<T>(path, { method: 'GET' }),
  post: <T>(path: string, data?: unknown) =>
    requeteApi<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    requeteApi<T>(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
};
