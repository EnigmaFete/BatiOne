import { Check } from 'lucide-react';

export interface EtapeOnboarding {
  cle: string;
  label: string;
  fait: boolean;
}

interface OnboardingChecklistProps {
  etapes: EtapeOnboarding[];
}

export function OnboardingChecklist({ etapes }: OnboardingChecklistProps) {
  const nbFaites = etapes.filter((e) => e.fait).length;
  const progression = Math.round((nbFaites / etapes.length) * 100);
  const milieu = Math.ceil(etapes.length / 2);
  const colonnes = [etapes.slice(0, milieu), etapes.slice(milieu)];

  return (
    <div className="bo-card" style={{ marginBottom: 'var(--batione-space-5)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 'var(--batione-font-size-lg)', margin: 0 }}>
          Finalisez la mise en route de votre espace
        </h2>
        <span style={{ fontSize: 'var(--batione-font-size-sm)', color: 'var(--batione-ink-500)' }}>
          {nbFaites} sur {etapes.length} terminé
        </span>
      </div>

      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: 'var(--batione-ink-100)',
          marginTop: 'var(--batione-space-3)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progression}%`,
            background: 'var(--batione-primary)',
            borderRadius: 999,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      <p style={{ color: 'var(--batione-ink-500)', fontSize: 'var(--batione-font-size-sm)', margin: 'var(--batione-space-3) 0 var(--batione-space-4)' }}>
        Suivez ces étapes pour bien démarrer avec BatiOne.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 var(--batione-space-6)' }}>
        {colonnes.map((colonne, colIndex) => (
          <ul key={colIndex} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {colonne.map((etape, index) => {
              const numero = colIndex * milieu + index + 1;
              return (
                <li
                  key={etape.cle}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--batione-space-3)',
                    padding: 'var(--batione-space-3) 0',
                    borderBottom: index < colonne.length - 1 ? '1px solid var(--batione-ink-100)' : 'none',
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'var(--batione-font-size-xs)',
                      fontWeight: 700,
                      background: etape.fait ? 'var(--batione-success)' : 'var(--batione-ink-100)',
                      color: etape.fait ? 'white' : 'var(--batione-ink-500)',
                    }}
                  >
                    {etape.fait ? <Check size={14} aria-hidden /> : numero}
                  </span>
                  <span style={{ flex: 1, fontSize: 'var(--batione-font-size-sm)' }}>{etape.label}</span>
                  <span className={`bo-badge ${etape.fait ? 'bo-badge--success' : 'bo-badge--warning'}`}>
                    {etape.fait ? 'Fait' : 'À faire'}
                  </span>
                </li>
              );
            })}
          </ul>
        ))}
      </div>
    </div>
  );
}
