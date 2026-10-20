import Image from 'next/image';

interface LogoProps {
  /** Taille de la marque (icône) en pixels. Le texte s'échelonne harmonieusement. */
  size?: number;
  /** N'affiche que l'icône (pour la sidebar, un favicon, etc.), sans le mot-symbole. */
  iconOnly?: boolean;
  /** Orientation : 'vertical' (empilé, défaut sur la page de connexion) ou 'horizontal'. */
  orientation?: 'vertical' | 'horizontal';
  /** Priorité de chargement Next.js pour LCP. */
  priority?: boolean;
  /** Thème d'affichage du mot-symbole : 'light' (défaut) ou 'dark'. */
  theme?: 'light' | 'dark';
}

/**
 * Marque BatiOne officielle :
 * Monogramme architectural "B" alliant silhouette d'immeuble, panneau d'or/ocre en perspective
 * et courbes navy, accompagné du mot-symbole bicolore "BatiOne".
 */
export function Logo({
  size = 76,
  iconOnly = false,
  orientation = 'vertical',
  priority = true,
  theme = 'light',
}: LogoProps) {
  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isHorizontal ? 12 : 12,
        textDecoration: 'none',
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Image
          src="/brand/logo.png"
          alt="BatiOne Logo"
          width={size}
          height={size}
          priority={priority}
          style={{
            objectFit: 'contain',
            width: '100%',
            height: '100%',
          }}
        />
      </div>
      {!iconOnly && (
        <span
          style={{
            fontSize: isHorizontal ? Math.max(18, Math.round(size * 0.5)) : Math.max(22, Math.round(size * 0.38)),
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '-0.025em',
            userSelect: 'none',
          }}
        >
          <span style={{ color: theme === 'dark' ? '#ffffff' : 'var(--batione-ink-900)' }}>Bati</span>
          <span style={{ color: 'var(--batione-primary)' }}>One</span>
        </span>
      )}
    </div>
  );
}
