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

  if (Math.random() < 0.90) portals.push('easy');
  if (Math.random() < 0.70) portals.push('medium');
  if (Math.random() < 0.50) portals.push('hard');

  // Fallback: if nothing spawned, pick one at random
  if (portals.length === 0) {
    const all: PortalDifficulty[] = ['easy', 'medium', 'hard'];
    portals.push(all[Math.floor(Math.random() * all.length)]);
  }

  return portals;
}

// ── Full map pre-generation ─────────────────────────────────────────

import type { MapNode, FracturedMap } from './types';

const MAX_TIER = 7;

/**
 * Pre-generate the entire fractured world map for a run.
 * Tier 0: single node (starting zone, no modifiers).
 * Tiers 1-7: 1-3 portals rolled independently.
 * Tier 8: single node (final boss zone).
 */
export function generateFracturedMap(): FracturedMap {
  const tiers: MapNode[][] = [];

  for (let tier = 0; tier <= MAX_TIER; tier++) {
    const biome = getBiome(tier);

    if (tier === 0) {
      tiers.push([{ tier, index: 0, difficulty: 'easy', biome, modifiers: [], curse: null, connections: [] }]);
    } else if (tier === MAX_TIER) {
      const roll = rollModifiers('hard', tier);
      tiers.push([{ tier, index: 0, difficulty: 'hard', biome, modifiers: roll.modifiers, curse: roll.curse, connections: [] }]);
    } else {
      const difficulties = rollPortals();
      const nodes: MapNode[] = difficulties.map((diff, idx) => {
        const roll = rollModifiers(diff, tier);
        return { tier, index: idx, difficulty: diff, biome, modifiers: roll.modifiers, curse: roll.curse, connections: [] };
      });
      // Never allow curses on single-portal tiers — player must have a non-cursed option
      if (nodes.length === 1) nodes[0].curse = null;
      tiers.push(nodes);
    }
  }

  // Wire connections: every node connects to all nodes in the next tier (full access)
  for (let t = 0; t < MAX_TIER; t++) {
    const curr = tiers[t];
    const next = tiers[t + 1];
    for (const node of curr) {
      node.connections = next.map((_, i) => i);
    }
  }

  return {
    tiers,
    chosenPath: new Array(MAX_TIER + 1).fill(null),
    currentTier: 0,
    chosenShrine: null,
    brokenShrine: null,
  };
}
