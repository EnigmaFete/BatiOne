interface KpiCardProps {
  titre: string;
  valeur: string;
  tendance?: 'success' | 'warning' | 'danger' | 'info';
  sousTitre?: string;
}

export function KpiCard({ titre, valeur, tendance, sousTitre }: KpiCardProps) {
  return (
    <div className="bo-card" style={{ flex: 1 }}>
      <p style={{ color: 'var(--batione-ink-500)', fontSize: 'var(--batione-font-size-sm)', margin: 0 }}>{titre}</p>
      <p style={{ fontSize: 'var(--batione-font-size-2xl)', fontWeight: 700, margin: '8px 0 4px' }}>{valeur}</p>
      {sousTitre && (
        <span className={`bo-badge ${tendance ? `bo-badge--${tendance}` : 'bo-badge--info'}`}>{sousTitre}</span>
      )}
    </div>
  );
}
