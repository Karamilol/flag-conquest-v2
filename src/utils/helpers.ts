import type { Artifact } from '../types';

/** Check if the player has a specific artifact */
export function hasArtifact(artifacts: Artifact[], id: string): boolean {
  return artifacts.some(a => a.id === id);
}

/** Count how many copies of an artifact the player has (stackable) */
export function countArtifact(artifacts: Artifact[], id: string): number {
  return artifacts.filter(a => a.id === id).length;
}

/** Calculate damage after defense reduction (minimum 1) */
export function calcDamage(rawDamage: number, defense: number): number {
  return Math.max(1, rawDamage - defense);
}

let _idCounter = 0;

/** Create a particle with a unique ID */
export function makeParticle(x: number, y: number, text: string, color: string) {
  return {
    id: ++_idCounter,
    x,
    y,
    text,
    color,
    age: 0,
    driftX: (Math.random() - 0.5) * 1.2,
  };
}

/** Create a crit damage particle (bigger, yellow, with "!" suffix) */
export function makeCritParticle(x: number, y: number, dmg: number) {
  return {
    id: ++_idCounter,
    x,
    y,
    text: `-${dmg}!`,
    color: '#ffdd00',
    age: 0,
    driftX: (Math.random() - 0.5) * 1.2,
    isCrit: true,
  };
}

/** Generate a unique entity ID */
export function uid(): number {
  return ++_idCounter;
}

/** Format large numbers: 1234 → "1234", 12345 → "12,345", 1234567 → "1.23M" */
export function formatNumber(n: number): string {
  if (n < 0) return '-' + formatNumber(-n);
  if (n >= 1_000_000_000_000) return (n / 1e12).toFixed(2) + 'T';
  if (n >= 1_000_000_000) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1_000_000) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 10_000) {
    const s = String(Math.floor(n));
    let result = '';
    for (let i = s.length - 1, c = 0; i >= 0; i--, c++) {
      if (c > 0 && c % 3 === 0) result = ',' + result;
      result = s[i] + result;
    }
    return result;
  }
  return String(Math.floor(n));
}
