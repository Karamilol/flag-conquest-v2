import type { ChallengeId } from './types';

export interface ChallengeDef {
  id: ChallengeId;
  name: string;
  icon: string;
  desc: string;
  stars: number;
  rewardId: string;
  rewardName: string;
  rewardDesc: string;
}

export const CHALLENGE_DEFS: ChallengeDef[] = [
  { id: 'loneWolf',    name: 'Lone Wolf',    icon: '\u{1F43A}', desc: 'No units. Hero only.',                  stars: 2, rewardId: 'wolfsFury',        rewardName: "Wolf's Fury",        rewardDesc: 'Hero +10% attack speed' },
  { id: 'famine',      name: 'Famine',       icon: '\u{1F480}', desc: 'No passive income. Gold from kills only.', stars: 2, rewardId: 'scavengersBounty', rewardName: "Scavenger's Bounty", rewardDesc: '+25% gold from kills' },
  { id: 'colosseum',   name: 'Colosseum',    icon: '\u{1F3DF}\uFE0F', desc: 'Slow GIANT enemies. 20x HP, 2.5x ATK.',   stars: 3, rewardId: 'titansEndurance',  rewardName: "Titan's Endurance",  rewardDesc: 'Melee units +15% max HP' },
  { id: 'glassCannon', name: 'Glass Cannon', icon: '\u{1F4A5}', desc: 'Everyone: 3x damage, 1/3 HP.',          stars: 3, rewardId: 'razorsEdge',       rewardName: "Razor's Edge",       rewardDesc: 'All units +10% damage' },
  { id: 'noRetreat',   name: 'No Retreat',   icon: '\u{1F6AB}', desc: 'Portal cannot advance forward.',        stars: 3, rewardId: 'taxHaven',         rewardName: 'Tax Haven',          rewardDesc: 'Income tiers tick 10% faster' },
  { id: 'cursedLands', name: 'Cursed Lands', icon: '\u2620\uFE0F', desc: 'No healing. Potions at 50%.',           stars: 4, rewardId: 'blessedAura',      rewardName: 'Blessed Aura',       rewardDesc: 'Cleric heals spread to nearby ally' },
  { id: 'hordeMode',   name: 'Horde Mode',   icon: '\u{1F525}', desc: '5x spawns. No gold from kills.',        stars: 4, rewardId: 'battleHardened',   rewardName: 'Battle Hardened',    rewardDesc: 'All units +8% attack speed' },
  { id: 'embargo',     name: 'Embargo',      icon: '\u{1F512}', desc: 'No chests, no kill gold. Income only.', stars: 3, rewardId: 'efficientMarkets', rewardName: 'Efficient Markets',  rewardDesc: 'All upgrades cost 5% less' },
];

export function getChallengeDef(id: ChallengeId): ChallengeDef {
  return CHALLENGE_DEFS.find(c => c.id === id)!;
}

// ── Challenge Levels ──────────────────────────────────────────────
export const MAX_CHALLENGE_LEVEL = 3; // TODO: expand later

/** Reward multiplier for a given challenge level (L1=1x, L2=1.5x, L3=2x) */
export function getChallengeRewardMult(level: number): number {
  return [0, 1, 1.5, 2][Math.min(level, MAX_CHALLENGE_LEVEL)] || 1;
}

/** Flat shard reward per level (same shards each level, based on star rating) */
export function getChallengeShardsPerLevel(stars: number): number {
  return [0, 1, 2, 3, 5, 7][stars] || 0;
}
