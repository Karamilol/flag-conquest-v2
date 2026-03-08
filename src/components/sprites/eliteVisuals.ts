/** Shared elite visual lookup for sprite components */

const ELITE_GLOW_COLORS: Record<string, string> = {
  warchief: '#ff6600',
  deadeye: '#ffcc00',
  revenant: '#8800ff',
  packleader: '#cc4400',
  archlich: '#00ccaa',
  phantomBlade: '#00ff88',
  infernoHerald: '#ff2200',
  colossus: '#aaaaaa',
  plagueKing: '#88aa00',
  magmaLord: '#ff4400',
  deathKnight: '#6622aa',
};

const ELITE_NAMES: Record<string, string> = {
  warchief: 'WARCHIEF',
  deadeye: 'DEADEYE',
  revenant: 'REVENANT',
  packleader: 'PACKLEADER',
  archlich: 'ARCHLICH',
  phantomBlade: 'PHANTOM BLADE',
  infernoHerald: 'INFERNO HERALD',
  colossus: 'COLOSSUS',
  plagueKing: 'PLAGUE KING',
  magmaLord: 'MAGMA LORD',
  deathKnight: 'DEATH KNIGHT',
};

export function getEliteGlow(variantId?: string): string | undefined {
  return variantId ? ELITE_GLOW_COLORS[variantId] : undefined;
}

export function getEliteName(variantId?: string): string | undefined {
  return variantId ? ELITE_NAMES[variantId] : undefined;
}

export function getEliteScale(variantId?: string): number {
  if (!variantId) return 1;
  if (variantId === 'colossus') return 1.8;
  return 1.6;
}
