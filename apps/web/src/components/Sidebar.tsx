'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MODULES = [
  { href: '/tableau-de-bord', label: 'Tableau de bord', icone: '📊' },
  { href: '/projets', label: 'Projets', icone: '🏗️' },
  { href: '/finance', label: 'Finance', icone: '💰' },
  { href: '/clients', label: 'Clients & Documents', icone: '📄' },
  { href: '/stock', label: 'Stock', icone: '📦' },
  { href: '/rh-paie', label: 'RH & Paie', icone: '👥' },
  { href: '/materiel', label: 'Matériel', icone: '🚜' },
  { href: '/rapports', label: 'Rapports', icone: '📈' },
  { href: '/parametres', label: 'Paramètres', icone: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        width: 240,
        background: 'var(--batione-ink-900)',
        color: 'white',
        minHeight: '100vh',
        padding: 'var(--batione-space-5) var(--batione-space-3)',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: '0 var(--batione-space-3)', marginBottom: 'var(--batione-space-6)' }}>
        <strong style={{ fontSize: 'var(--batione-font-size-lg)' }}>BatiOne</strong>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {MODULES.map((module) => {
          const actif = pathname?.startsWith(module.href);
          return (
            <li key={module.href} style={{ marginBottom: 'var(--batione-space-1)' }}>
              <Link
                href={module.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--batione-space-3)',
                  padding: 'var(--batione-space-3)',
                  borderRadius: 'var(--batione-radius-md)',
                  background: actif ? 'var(--batione-ink-800)' : 'transparent',
                  color: actif ? 'var(--batione-primary)' : 'var(--batione-ink-300)',
                  fontWeight: actif ? 600 : 400,
                  fontSize: 'var(--batione-font-size-sm)',
                }}
              >
                <span aria-hidden>{module.icone}</span>
                {module.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
