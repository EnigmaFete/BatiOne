'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from './api';

export interface Moi {
  id: string;
  prenom: string;
  nom: string;
  role: string;
  organization: { id: string; nom: string; onboarding_complete: boolean };
}

/**
 * Récupère l'utilisateur connecté. Le renouvellement du jeton (absent ou expiré) est entièrement
 * géré par `api.ts` (401 -> rafraîchissement silencieux -> une seule nouvelle tentative) — ce hook
 * ne redirige vers /connexion QUE si le rafraîchissement a réellement échoué (plus de session
 * valide), jamais sur un simple jeton d'accès expiré en mémoire.
 */
export function useMoi() {
  const router = useRouter();
  const [moi, setMoi] = useState<Moi | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;

    api
      .get<Moi>('/auth/moi')
      .then((donnees) => {
        if (!annule) setMoi(donnees);
      })
      .catch((err) => {
        if (annule) return;
        if (err instanceof ApiError) {
          router.replace('/connexion');
        } else {
          setErreur('Impossible de charger vos informations.');
        }
      });

    return () => {
      annule = true;
    };
  }, [router]);

  return { moi, erreur };
}
