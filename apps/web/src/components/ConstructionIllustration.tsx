/**
 * Illustration vectorielle (pas de photo) : aucun asset photographique n'est disponible dans ce
 * dépôt. À remplacer par une vraie photo de chantier si l'entreprise en fournit une — voir
 * HeroHeader.tsx pour le point d'intégration (background-image sur `.bo-hero`).
 */
export function ConstructionIllustration() {
  return (
    <svg
      width="320"
      height="140"
      viewBox="0 0 320 140"
      fill="none"
      aria-hidden
      style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 'auto', opacity: 0.9 }}
    >
      <rect x="150" y="40" width="70" height="100" fill="var(--batione-ink-700)" opacity="0.5" />
      <rect x="225" y="60" width="55" height="80" fill="var(--batione-ink-700)" opacity="0.35" />
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 4 }).map((_, col) => (
          <rect
            key={`${row}-${col}`}
            x={158 + col * 15}
            y={50 + row * 17}
            width="9"
            height="11"
            fill="var(--batione-primary-soft)"
            opacity="0.5"
          />
        )),
      )}
      <line x1="60" y1="130" x2="60" y2="20" stroke="var(--batione-primary)" strokeWidth="3" />
      <line x1="10" y1="35" x2="130" y2="35" stroke="var(--batione-primary)" strokeWidth="3" />
      <line x1="60" y1="35" x2="60" y2="60" stroke="var(--batione-primary)" strokeWidth="2" />
      <line x1="60" y1="60" x2="30" y2="75" stroke="var(--batione-primary)" strokeWidth="2" />
      <line x1="10" y1="35" x2="35" y2="70" stroke="var(--batione-primary)" strokeWidth="1.5" opacity="0.6" />
      <line x1="60" y1="35" x2="35" y2="70" stroke="var(--batione-primary)" strokeWidth="1.5" opacity="0.6" />
      <rect x="52" y="128" width="16" height="10" rx="2" fill="var(--batione-primary)" />
    </svg>
  );
}
