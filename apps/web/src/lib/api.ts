const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export interface ApiErreurPayload {
  succes: false;
  erreur: { code: string; message: string; horodatage: string };
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

let accessTokenMemoire: string | null = null;

export function definirJetonAcces(token: string | null): void {
  accessTokenMemoire = token;
}

export function obtenirJetonAcces(): string | null {
  return accessTokenMemoire;
}

async function requeteApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (accessTokenMemoire) {
    headers.set('Authorization', `Bearer ${accessTokenMemoire}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const erreur = (body as ApiErreurPayload | null)?.erreur;
    throw new ApiError(erreur?.code ?? 'ERREUR_INCONNUE', erreur?.message ?? 'Une erreur est survenue.');
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
