interface SparklineProps {
  /** Valeurs relatives (0–1). Un tableau plat reflète honnêtement l'absence de données — on
   * n'invente jamais une tendance haussière tant qu'aucune donnée réelle n'existe. */
  points?: number[];
  color: string;
  width?: number;
  height?: number;
}

const POINTS_PAR_DEFAUT = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

export function Sparkline({ points = POINTS_PAR_DEFAUT, color, width = 72, height = 32 }: SparklineProps) {
  const pas = width / (points.length - 1);
  const coords = points.map((valeur, index) => {
    const x = index * pas;
    const y = height - valeur * (height - 4) - 2;
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden>
      <polyline
        points={coords.join(' ')}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
