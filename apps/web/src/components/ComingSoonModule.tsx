import type { LucideIcon } from 'lucide-react';
import { Construction } from 'lucide-react';

interface ComingSoonModuleProps {
  titre: string;
  description: string;
  icon: LucideIcon;
  fonctionnalites: string[];
}

/**
 * Page d'attente honnête pour un module pas encore construit — jamais un 404 brut, mais jamais
 * non plus présentée comme "terminée". Remplacée module par module par la vraie fonctionnalité
 * (cf. ROADMAP.md) ; cf. docs/PROGRESS.md pour le statut réel de chaque module.
 */
export function ComingSoonModule({ titre, description, icon: Icon, fonctionnalites }: ComingSoonModuleProps) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--batione-space-3)', marginBottom: 4 }}>
        <Icon size={24} color="var(--batione-primary)" aria-hidden />
        <h1 style={{ fontSize: 'var(--batione-font-size-xl)', margin: 0 }}>{titre}</h1>
      </div>
      <p style={{ color: 'var(--batione-ink-500)', margin: '0 0 var(--batione-space-5)' }}>{description}</p>

      <div className="bo-card" style={{ textAlign: 'center', padding: 'var(--batione-space-8)' }}>
        <Construction size={40} color="var(--batione-ink-300)" style={{ marginBottom: 'var(--batione-space-3)' }} aria-hidden />
        <p style={{ fontSize: 'var(--batione-font-size-lg)', fontWeight: 600, color: 'var(--batione-ink-800)', margin: '0 0 8px' }}>
          Ce module est en cours de construction
        </p>
        <p style={{ color: 'var(--batione-ink-500)', maxWidth: 480, margin: '0 auto var(--batione-space-5)' }}>
          Il n&apos;existe pas encore dans BatiOne — voici ce qui y arrivera :
        </p>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '0 auto',
            maxWidth: 420,
            textAlign: 'left',
            display: 'grid',
            gap: 'var(--batione-space-2)',
          }}
        >
          {fonctionnalites.map((f) => (
            <li
              key={f}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--batione-space-2)',
                fontSize: 'var(--batione-font-size-sm)',
                color: 'var(--batione-ink-700)',
              }}
            >
              <span style={{ color: 'var(--batione-primary)', fontWeight: 700 }}>•</span>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
