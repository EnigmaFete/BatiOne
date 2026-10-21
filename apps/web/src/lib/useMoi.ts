'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError, definirJetonAcces, obtenirJetonAcces } from './api';

export interface Moi {
  id: string;
  prenom: string;
  nom: string;
  role: string;
  organization: { id: string; nom: string; onboarding_complete: boolean };
}

/** Récupère l'utilisateur connecté, rafraîchit le jeton si besoin, redirige sinon vers /connexion. */
export function useMoi() {
  const router = useRouter();
  const [moi, setMoi] = useState<Moi | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;

    async function charger() {
      if (!obtenirJetonAcces()) {
        try {
          const { accessToken } = await api.post<{ accessToken: string }>('/auth/rafraichir');
          definirJetonAcces(accessToken);
        } catch {
          router.replace('/connexion');
          return;
        }
      }
      try {
        const donnees = await api.get<Moi>('/auth/moi');
        if (!annule) setMoi(donnees);
      } catch (err) {
        if (err instanceof ApiError) {
          router.replace('/connexion');
        } else if (!annule) {
          setErreur('Impossible de charger vos informations.');
        }
      }
    }

    charger();
    return () => {
      annule = true;
    };
  }, [router]);

  return { moi, erreur };
}
