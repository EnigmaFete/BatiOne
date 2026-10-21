'use client';

import { createContext, useContext } from 'react';
import { useMoi, type Moi } from './useMoi';

interface AuthContextValue {
  moi: Moi | null;
  erreur: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Récupère l'utilisateur connecté UNE SEULE FOIS au niveau du layout partagé du tableau de bord,
 * au lieu de chaque page faisant son propre `GET /auth/moi` au montage. Le layout `(dashboard)`
 * ne démonte jamais entre deux pages lors d'une navigation côté client (App Router) — donc cette
 * requête ne repart jamais à zéro en naviguant entre /tableau-de-bord, /projets, etc.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { moi, erreur } = useMoi();
  return <AuthContext.Provider value={{ moi, erreur }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() doit être utilisé à l’intérieur de <AuthProvider> (cf. (dashboard)/layout.tsx).');
  }
  return ctx;
}
