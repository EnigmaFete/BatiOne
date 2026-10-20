/**
 * Fond décoratif des pages d'authentification : scène de chantier stylisée en SVG (grue +
 * immeuble en construction à droite, silhouettes filaires à gauche) sur fond encre foncée.
 * Aucun asset photographique disponible dans ce dépôt — voir ConstructionIllustration.tsx pour
 * la même réserve. À remplacer par une vraie photo si l'entreprise en fournit une (poser l'image
 * en `background-image` sur `.bo-auth-bg` et retirer ce composant).
 */
export function AuthBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, #0B1220 0%, var(--batione-ink-900) 55%, #10192e 100%)',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {/* Silhouettes filaires — gauche */}
      <svg
        width="520"
        height="640"
        viewBox="0 0 520 640"
        style={{ position: 'absolute', left: -60, bottom: -40, opacity: 0.3 }}
      >
        <polygon points="40,560 40,260 140,180 140,560" fill="none" stroke="var(--batione-primary)" strokeWidth="1.5" />
        <polygon points="150,560 150,340 230,280 230,560" fill="none" stroke="var(--batione-primary)" strokeWidth="1.5" />
        <polygon points="240,560 240,140 360,60 360,560" fill="none" stroke="var(--batione-primary)" strokeWidth="1.5" />
      </svg>

      {/* Grue + immeuble en construction — droite */}
      <svg
        width="760"
        height="760"
        viewBox="0 0 760 760"
        style={{ position: 'absolute', right: -80, top: 0, height: '100%', width: 'auto', opacity: 0.55 }}
      >
        {/* Immeuble (structure) */}
        <rect x="430" y="260" width="260" height="500" fill="var(--batione-ink-700)" opacity="0.4" />
        {Array.from({ length: 10 }).map((_, row) =>
          Array.from({ length: 6 }).map((_, col) => (
            <rect
              key={`${row}-${col}`}
              x={448 + col * 38}
              y={280 + row * 46}
              width="26"
              height="30"
              fill="#0B1220"
              opacity="0.45"
            />
          )),
        )}
        {/* Échafaudage vertical */}
        {[430, 480, 530, 580, 630, 680].map((x) => (
          <line key={x} x1={x} y1="260" x2={x} y2="760" stroke="var(--batione-ink-500)" strokeWidth="1" opacity="0.3" />
        ))}

        {/* Grue à tour */}
        <line x1="260" y1="760" x2="260" y2="80" stroke="var(--batione-primary)" strokeWidth="5" />
        <line x1="60" y1="130" x2="520" y2="130" stroke="var(--batione-primary)" strokeWidth="5" />
        <line x1="260" y1="130" x2="260" y2="210" stroke="var(--batione-primary)" strokeWidth="3" />
        <line x1="260" y1="210" x2="140" y2="250" stroke="var(--batione-primary)" strokeWidth="3" />
        <line x1="60" y1="130" x2="150" y2="235" stroke="var(--batione-primary)" strokeWidth="2" opacity="0.7" />
        <line x1="260" y1="130" x2="150" y2="235" stroke="var(--batione-primary)" strokeWidth="2" opacity="0.7" />
        <line x1="520" y1="130" x2="300" y2="150" stroke="var(--batione-primary)" strokeWidth="2" opacity="0.7" />
        <line x1="260" y1="130" x2="300" y2="150" stroke="var(--batione-primary)" strokeWidth="2" opacity="0.7" />
        <rect x="225" y="740" width="70" height="20" rx="3" fill="var(--batione-primary)" />
        <line x1="150" y1="235" x2="150" y2="280" stroke="var(--batione-ink-500)" strokeWidth="2" opacity="0.6" />
      </svg>
    </div>
  );
}
