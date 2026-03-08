// ---- Ancient Relic System (v2 — with leveling) ----

export interface AncientRelicDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  category: 'combat' | 'hero' | 'economy';
}

export const ANCIENT_RELIC_DEFS: AncientRelicDef[] = [
  // Combat (6)
  { id: 'necromancersGrimoire', name: "Necromancer's Grimoire", icon: '\u{1F4D6}',
    desc: 'Killed enemies have a chance to rise as weak temp skeletons', category: 'combat' },
  { id: 'warlordsHorn', name: "Warlord's Horn", icon: '\u{1F4EF}',
    desc: 'Ally chance to spawn with horn: nearby allies atk speed + heal', category: 'combat' },
  { id: 'crownOfTheAncients', name: 'Crown of the Ancients', icon: '\u{1F451}',
    desc: 'Ally chance to spawn with crown: boosted stats + slow aura', category: 'combat' },
  { id: 'protectorsPride', name: "Protector's Pride", icon: '\u{1F6E1}\uFE0F',
    desc: 'Allies have a chance to instantly revive on death', category: 'combat' },
  { id: 'warBanner', name: 'War Banner', icon: '\u{1F6A9}',
    desc: 'Ally chance to spawn with banner: nearby allies bonus damage', category: 'combat' },
  { id: 'quiver', name: 'Quiver', icon: '\u{1F3F9}',
    desc: 'Archers + archer hero: chance for double damage arrows', category: 'combat' },
  // Hero (2)
  { id: 'titansHeart', name: "Titan's Heart", icon: '\u2764\uFE0F',
    desc: 'Hero bonus max HP + passive HP regen', category: 'hero' },
  { id: 'worldSplitter', name: 'World Splitter', icon: '\u{1F300}',
    desc: 'Portal forward deals enemy max HP damage in 500px radius', category: 'hero' },
  // Economy (2)
  { id: 'midasTouch', name: 'Midas Touch', icon: '\u{1FA99}',
    desc: 'All gold earned bonus globally', category: 'economy' },
  { id: 'timeWarpCrystal', name: 'Time Warp Crystal', icon: '\u23F0',
    desc: 'All gold income ticks faster', category: 'economy' },
];

export const FORGE_COST = 15;

// ---- Ancient Relic Leveling ----
// Same thresholds as regular relics: 1/3/5/7/9 copies → Lv 1-5
const ANCIENT_LEVEL_THRESHOLDS = [1, 3, 5, 7, 9];

export function getAncientRelicLevel(copies: number): number {
  if (copies <= 0) return 0;
  for (let i = ANCIENT_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (copies >= ANCIENT_LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 0;
}

// ---- Level-scaled effect values ----
// Returns numeric values for a given ancient relic at a given level
// Each relic has its own scaling table from the plan

interface AncientEffectValues {
  [key: string]: number;
}

const ANCIENT_EFFECT_TABLES: Record<string, AncientEffectValues[]> = {
  // index 0 = Lv1, index 4 = Lv5
  necromancersGrimoire: [
    { chance: 0.02 }, { chance: 0.04 }, { chance: 0.06 }, { chance: 0.08 }, { chance: 0.10 },
  ],
  warlordsHorn: [
    { atkBonus: 0.10, healPct: 0.05 }, { atkBonus: 0.15, healPct: 0.07 }, { atkBonus: 0.20, healPct: 0.10 },
    { atkBonus: 0.25, healPct: 0.12 }, { atkBonus: 0.30, healPct: 0.15 },
  ],
  crownOfTheAncients: [
    { statMult: 1.5, slowPct: 0.10 }, { statMult: 1.8, slowPct: 0.15 }, { statMult: 2.1, slowPct: 0.20 },
    { statMult: 2.6, slowPct: 0.25 }, { statMult: 3.0, slowPct: 0.30 },
  ],
  protectorsPride: [
    { chance: 0.03 }, { chance: 0.05 }, { chance: 0.07 }, { chance: 0.08 }, { chance: 0.10 },
  ],
  warBanner: [
    { dmgMult: 1.10 }, { dmgMult: 1.15 }, { dmgMult: 1.20 }, { dmgMult: 1.25 }, { dmgMult: 1.30 },
  ],
  quiver: [
    { chance: 0.05 }, { chance: 0.07 }, { chance: 0.10 }, { chance: 0.12 }, { chance: 0.15 },
  ],
  titansHeart: [
    { hpBonus: 0.15, regenPct: 0.003 }, { hpBonus: 0.22, regenPct: 0.005 }, { hpBonus: 0.30, regenPct: 0.006 },
    { hpBonus: 0.40, regenPct: 0.008 }, { hpBonus: 0.50, regenPct: 0.010 },
  ],
  worldSplitter: [
    { dmgPct: 0.05 }, { dmgPct: 0.09 }, { dmgPct: 0.13 }, { dmgPct: 0.17 }, { dmgPct: 0.20 },
  ],
  midasTouch: [
    { goldBonus: 0.03 }, { goldBonus: 0.05 }, { goldBonus: 0.07 }, { goldBonus: 0.10 }, { goldBonus: 0.12 },
  ],
  timeWarpCrystal: [
    { tickSpeed: 0.03 }, { tickSpeed: 0.05 }, { tickSpeed: 0.07 }, { tickSpeed: 0.10 }, { tickSpeed: 0.12 },
  ],
};

/** Get the effect values for an ancient relic at a given level (1-5). Returns empty obj for level 0. */
export function getAncientEffect(id: string, level: number): AncientEffectValues {
  if (level <= 0) return {};
  const table = ANCIENT_EFFECT_TABLES[id];
  if (!table) return {};
  const idx = Math.min(level, 5) - 1;
  return table[idx] || {};
}

/** Get a human-readable description of the ancient relic at current level */
export function getAncientRelicDesc(id: string, level: number): string {
  const eff = getAncientEffect(id, level);
  switch (id) {
    case 'necromancersGrimoire': return `${Math.round((eff.chance || 0) * 100)}% skeleton chance on kill`;
    case 'warlordsHorn': return `Horn: +${Math.round((eff.atkBonus || 0) * 100)}% atk speed, ${Math.round((eff.healPct || 0) * 100)}% heal/5s`;
    case 'crownOfTheAncients': return `Crown: ${(eff.statMult || 1).toFixed(1)}x stats, ${Math.round((eff.slowPct || 0) * 100)}% slow aura`;
    case 'protectorsPride': return `${Math.round((eff.chance || 0) * 100)}% revive on death`;
    case 'warBanner': return `Banner: ${(eff.dmgMult || 1).toFixed(2)}x damage aura`;
    case 'quiver': return `${Math.round((eff.chance || 0) * 100)}% double damage arrows`;
    case 'titansHeart': return `Hero +${Math.round((eff.hpBonus || 0) * 100)}% HP, ${((eff.regenPct || 0) * 100).toFixed(1)}% regen/s`;
    case 'worldSplitter': return `Portal: ${Math.round((eff.dmgPct || 0) * 100)}% enemy max HP damage`;
    case 'midasTouch': return `+${Math.round((eff.goldBonus || 0) * 100)}% all gold`;
    case 'timeWarpCrystal': return `+${Math.round((eff.tickSpeed || 0) * 100)}% income tick speed`;
    default: return '';
  }
}

/** Roll a random ancient relic — unowned first, then duplicates */
export function forgeAncientRelic(ownedRelics: string[]): string | null {
  const unowned = ANCIENT_RELIC_DEFS.filter(r => !ownedRelics.includes(r.id));
  if (unowned.length > 0) {
    return unowned[Math.floor(Math.random() * unowned.length)].id;
  }
  // All owned — return random duplicate for leveling
  if (ownedRelics.length === 0) return null;
  return ANCIENT_RELIC_DEFS[Math.floor(Math.random() * ANCIENT_RELIC_DEFS.length)].id;
}
