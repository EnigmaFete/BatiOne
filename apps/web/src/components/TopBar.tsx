'use client';

interface TopBarProps {
  nomOrganisation?: string;
}

export function TopBar({ nomOrganisation }: TopBarProps) {
  return (
    <header
      style={{
        height: 64,
        background: 'var(--batione-surface)',
        borderBottom: `1px solid var(--batione-ink-300)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--batione-space-5)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--batione-space-3)' }}>
        <strong>{nomOrganisation ?? 'Mon entreprise'}</strong>
      </div>
      <input
        className="bo-input"
        placeholder="Rechercher un projet, un client, un document…"
        style={{ width: 360 }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--batione-space-4)' }}>
        <span aria-label="Notifications">🔔</span>
        <span aria-label="Langue">FR</span>
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--batione-primary-soft)',
            color: 'var(--batione-primary-strong)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
          }}
        >
          U
        </span>
      </div>
    </header>
  );
}
