// ── Fractured World: Map Generation ──────────────────────────────────
//
// Generates portal choices after each boss. Each portal has a difficulty
// that determines its modifier composition. Portals roll independently:
// Easy 80%, Medium 60%, Hard 40%. If all fail, one random spawns.

import {
  ALL_POSITIVE,
  ALL_NEGATIVE,
  CURSES,
} from './modifiers';

// ── Types ────────────────────────────────────────────────────────────

export type PortalDifficulty = 'easy' | 'medium' | 'hard';

export type BiomeId = 'forest' | 'cave' | 'nordic' | 'volcanic' | 'final';

// ── Biome mapping ────────────────────────────────────────────────────

export function getBiome(tier: number): BiomeId {
  if (tier <= 1) return 'forest';
  if (tier <= 3) return 'cave';
  if (tier <= 5) return 'nordic';
  if (tier <= 7) return 'volcanic';
  return 'final';
}

// ── Modifier rolling ─────────────────────────────────────────────────

/** Pick N unique random items from an array */
function pickRandom<T>(arr: T[], count: number): T[] {
  const pool = [...arr];
  const result: T[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

/** Pick a random integer between min and max (inclusive) */
function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

interface ModifierRollResult {
  modifiers: string[];
  curse: string | null;
}

/**
 * Roll modifiers for a portal based on its difficulty.
 *
 * Easy:   0-1 positive, 0 negative
 * Medium: 1-2 positive, 1 negative
 * Hard:   2-3 positive, 1-2 negative
 *
 * Curse: ~10% chance, independent of difficulty.
 * Tier 0: no modifiers (tutorial zone).
 */
export function rollModifiers(difficulty: PortalDifficulty, tier: number): ModifierRollResult {
  if (tier === 0) return { modifiers: [], curse: null };

  let posCount = 0;
  let negCount = 0;

  switch (difficulty) {
    case 'easy':
      posCount = randInt(0, 1);
      negCount = 0;
      break;
    case 'medium':
      posCount = randInt(1, 2);
      negCount = 1;
      break;
    case 'hard':
      posCount = randInt(2, 3);
      negCount = randInt(1, 2);
      break;
  }

  const positives = pickRandom(ALL_POSITIVE, posCount);
  const negatives = pickRandom(ALL_NEGATIVE, negCount);

  const modifiers = [
    ...positives.map(m => m.id),
    ...negatives.map(m => m.id),
  ];

  // Curse: ~10% chance, but never on safe (easy) portals
  const curse = difficulty !== 'easy' && Math.random() < 0.10
    ? pickRandom(CURSES, 1)[0]?.id ?? null
    : null;

  return { modifiers, curse };
}

// ── Portal generation ────────────────────────────────────────────────

/**
 * Roll which portals appear at a tier.
 *
 * Each difficulty rolls independently:
 *   Easy:   80% chance
 *   Medium: 60% chance
 *   Hard:   40% chance
 *
 * If all three fail, one random portal spawns as fallback.
 */
export function rollPortals(): PortalDifficulty[] {
  const portals: PortalDifficulty[] = [];

  if (Math.random() < 0.80) portals.push('easy');
  if (Math.random() < 0.60) portals.push('medium');
  if (Math.random() < 0.40) portals.push('hard');

  // Fallback: if nothing spawned, pick one at random
  if (portals.length === 0) {
    const all: PortalDifficulty[] = ['easy', 'medium', 'hard'];
    portals.push(all[Math.floor(Math.random() * all.length)]);
  }

  return portals;
}
