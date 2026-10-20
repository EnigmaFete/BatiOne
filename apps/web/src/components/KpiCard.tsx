import { MoreHorizontal, type LucideIcon } from 'lucide-react';
import { Sparkline } from './Sparkline';

type Tendance = 'success' | 'warning' | 'danger' | 'info';

interface KpiCardProps {
  titre: string;
  valeur: string;
  icon: LucideIcon;
  tendance?: Tendance;
  sousTitre?: string;
  tendancePoints?: number[];
}

const COULEURS: Record<Tendance, { fort: string; doux: string }> = {
  success: { fort: 'var(--batione-success)', doux: 'var(--batione-success-soft)' },
  warning: { fort: 'var(--batione-warning)', doux: 'var(--batione-warning-soft)' },
  danger: { fort: 'var(--batione-danger)', doux: 'var(--batione-danger-soft)' },
  info: { fort: 'var(--batione-info)', doux: 'var(--batione-info-soft)' },
};

export function KpiCard({ titre, valeur, icon: Icon, tendance = 'info', sousTitre, tendancePoints }: KpiCardProps) {
  const couleur = COULEURS[tendance];

  return (
    <div className="bo-card" style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--batione-space-3)' }}>
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--batione-radius-md)',
              background: couleur.doux,
              color: couleur.fort,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={18} aria-hidden />
          </span>
          <p style={{ color: 'var(--batione-ink-700)', fontSize: 'var(--batione-font-size-sm)', fontWeight: 600, margin: 0 }}>
            {titre}
          </p>
        </div>
        <button
          type="button"
          aria-label="Plus d'options"
          style={{ background: 'transparent', border: 'none', color: 'var(--batione-ink-500)', cursor: 'pointer' }}
        >
          <MoreHorizontal size={18} aria-hidden />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'var(--batione-space-4)' }}>
        <div>
          <p style={{ fontSize: 'var(--batione-font-size-2xl)', fontWeight: 700, margin: '0 0 8px' }}>{valeur}</p>
          {sousTitre && <span className={`bo-badge bo-badge--${tendance}`}>{sousTitre}</span>}
        </div>
        <Sparkline points={tendancePoints} color={couleur.fort} />
      </div>
    </div>
  );
}
