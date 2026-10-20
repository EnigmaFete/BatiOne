import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'BatiOne — Gérez vos projets, votre argent et vos équipes en un seul endroit',
  description:
    'BatiOne permet aux entreprises marocaines de gérer projets, clients, finances, ouvriers, matériaux, matériel, documents et paie depuis une seule plateforme.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
