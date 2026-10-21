'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Home,
  Landmark,
  FileText,
  Package,
  Users,
  Truck,
  BarChart3,
  Settings,
  Headphones,
  ArrowRight,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react';

const MODULES: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/tableau-de-bord', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/projets', label: 'Projets', icon: Home },
  { href: '/finance', label: 'Finance', icon: Landmark },
  { href: '/clients', label: 'Clients & Documents', icon: FileText },
  { href: '/stock', label: 'Stock', icon: Package },
  { href: '/rh-paie', label: 'RH & Paie', icon: Users },
  { href: '/materiel', label: 'Matériel', icon: Truck },
  { href: '/rapports', label: 'Rapports', icon: BarChart3 },
  { href: '/parametres', label: 'Paramètres', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        width: 256,
        background: 'var(--batione-ink-900)',
        color: 'white',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--batione-space-3)',
          padding: 'var(--batione-space-5) var(--batione-space-5) var(--batione-space-6)',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--batione-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            padding: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          }}
        >
          <Image
            src="/brand/logo.png"
            alt="BatiOne Logo"
            width={28}
            height={28}
            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
          />
        </div>
        <strong style={{ fontSize: 'var(--batione-font-size-lg)', letterSpacing: '-0.02em' }}>
          <span>Bati</span>
          <span style={{ color: 'var(--batione-primary)' }}>One</span>
        </strong>
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: '0 var(--batione-space-3)', flex: 1 }}>
        {MODULES.map((module) => {
          const actif = pathname?.startsWith(module.href);
          const Icon = module.icon;
          return (
            <li key={module.href} style={{ marginBottom: 2 }}>
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
                  borderLeft: actif ? '3px solid var(--batione-primary)' : '3px solid transparent',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
              >
                <Icon size={18} strokeWidth={2} aria-hidden style={{ flexShrink: 0 }} />
                {module.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div style={{ padding: 'var(--batione-space-4)' }}>
        <div
          style={{
            background: 'var(--batione-ink-800)',
            borderRadius: 'var(--batione-radius-lg)',
            padding: 'var(--batione-space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--batione-space-3)' }}>
            <Headphones size={20} strokeWidth={2} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--batione-font-size-sm)' }}>Besoin d&apos;aide ?</p>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 'var(--batione-font-size-xs)',
                  color: 'var(--batione-ink-300)',
                  lineHeight: 1.4,
                }}
              >
                Notre équipe est là pour vous accompagner.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="bo-btn bo-btn--secondary"
            style={{
              width: '100%',
              marginTop: 'var(--batione-space-3)',
              background: 'var(--batione-ink-900)',
              color: 'white',
              borderColor: 'var(--batione-ink-700)',
              justifyContent: 'space-between',
              minHeight: 38,
              fontSize: 'var(--batione-font-size-xs)',
            }}
          >
            Nous contacter
            <ArrowRight size={14} aria-hidden />
          </button>
        </div>
        <button
          type="button"
          aria-label="Réduire le menu"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginTop: 'var(--batione-space-3)',
            background: 'transparent',
            border: 'none',
            color: 'var(--batione-ink-500)',
            cursor: 'pointer',
            padding: 'var(--batione-space-2)',
          }}
        >
          <ChevronLeft size={16} aria-hidden />
        </button>
      </div>
    </nav>
  );
}
