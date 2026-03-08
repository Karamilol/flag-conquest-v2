// Achievement definitions — 5 categories

export interface AchievementTier {
  threshold: number;
  reward: { gems?: number; shards?: number };
}

export interface AchievementDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  hidden?: boolean;
  singleTier?: boolean;
  tiers: [AchievementTier, AchievementTier, AchievementTier];
  statKey: string;
  formatValue: (v: number) => string;
}

export interface AchievementProgress {
  id: string;
  unlockedTier: number; // 0=none, 1=bronze, 2=silver, 3=gold
  claimedTier: number;  // 0-3
}

export const CATEGORY_ORDER = ['conquest', 'combat', 'economy', 'army', 'hidden'] as const;
export const CATEGORY_LABELS: Record<string, string> = {
  conquest: '🏰 Conquest',
  combat: '⚔️ Combat',
  economy: '💰 Economy',
  army: '🪖 Army',
  hidden: '❓ Hidden',
};

const fmtNum = (v: number) => `${v}`;
const fmtGold = (v: number) => {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return `${v}`;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  // ═══════════════════════════════════════
  // CONQUEST
  // ═══════════════════════════════════════
  {
    id: 'first_steps',
    name: 'First Steps',
    icon: '🏃',
    description: 'Every journey begins with a single step. Complete runs.',
    category: 'conquest',
    tiers: [
      { threshold: 1, reward: { gems: 1 } },
      { threshold: 10, reward: { gems: 5 } },
      { threshold: 50, reward: { gems: 15 } },
    ],
    statKey: 'totalRuns',
    formatValue: fmtNum,
  },
  {
    id: 'flag_bearer',
    name: 'Flag Bearer',
    icon: '🚩',
    description: 'Plant your banner across the land. Capture flags.',
    category: 'conquest',
    tiers: [
      { threshold: 10, reward: { gems: 1 } },
      { threshold: 150, reward: { gems: 5 } },
      { threshold: 1000, reward: { gems: 15 } },
    ],
    statKey: 'totalFlagsCaptured',
    formatValue: fmtNum,
  },
  {
    id: 'zone_pioneer',
    name: 'Zone Pioneer',
    icon: '🗺️',
    description: 'Push deeper into the unknown. Reach higher zones.',
    category: 'conquest',
    tiers: [
      { threshold: 2, reward: { shards: 1 } },
      { threshold: 5, reward: { shards: 2 } },
      { threshold: 8, reward: { shards: 5 } },
    ],
    statKey: 'highestZone',
    formatValue: fmtNum,
  },
  {
    id: 'long_march',
    name: 'Long March',
    icon: '🥾',
    description: 'Your boots tell the story. March across battlefields.',
    category: 'conquest',
    tiers: [
      { threshold: 500, reward: { gems: 2 } },
      { threshold: 5000, reward: { gems: 10 } },
      { threshold: 25000, reward: { gems: 25 } },
    ],
    statKey: 'totalDistance',
    formatValue: (v) => `${v}m`,
  },
  {
    id: 'play_time',
    name: 'Play Time',
    icon: '⏱️',
    description: 'Time flies when you\'re conquering. Spend time in battle.',
    category: 'conquest',
    tiers: [
      { threshold: 3600, reward: { gems: 2 } },      // 1 hour
      { threshold: 36000, reward: { gems: 10 } },     // 10 hours
      { threshold: 172800, reward: { gems: 25 } },    // 48 hours
    ],
    statKey: 'totalPlayTime',
    formatValue: (v) => {
      const mins = Math.floor(v / 60);
      const hours = Math.floor(mins / 60);
      if (hours > 0) return `${hours}h${mins % 60 > 0 ? ` ${mins % 60}m` : ''}`;
      return `${mins}m`;
    },
  },
  {
    id: 'strategic_retreat',
    name: 'Strategic Retreat',
    icon: '🏠',
    description: 'A wise commander knows when to fall back. Retreat to regroup.',
    category: 'conquest',
    tiers: [
      { threshold: 1, reward: { gems: 1 } },
      { threshold: 30, reward: { gems: 5 } },
      { threshold: 150, reward: { gems: 15 } },
    ],
    statKey: 'totalRetreats',
    formatValue: fmtNum,
  },
  {
    id: 'explorer',
    name: 'Explorer',
    icon: '🧭',
    description: 'Chart the uncharted. Reach new zones across all campaigns.',
    category: 'conquest',
    tiers: [
      { threshold: 10, reward: { gems: 2 } },
      { threshold: 50, reward: { gems: 10 } },
      { threshold: 150, reward: { gems: 25 } },
    ],
    statKey: 'totalZonesReached',
    formatValue: fmtNum,
  },
  {
    id: 'find_the_dungeon',
    name: 'Into the Deep',
    icon: '\u26CF\uFE0F',
    description: 'Discover and enter the ancient dungeon.',
    category: 'conquest',
    singleTier: true,
    tiers: [
      { threshold: 1, reward: { gems: 10 } },
      { threshold: 1, reward: { gems: 0 } },
      { threshold: 1, reward: { gems: 0 } },
    ],
    statKey: 'dungeonsEntered',
    formatValue: (v) => v > 0 ? '\u2713' : '0',
  },

  // ═══════════════════════════════════════
  // COMBAT
  // ═══════════════════════════════════════
  {
    id: 'enemy_slayer',
    name: 'Enemy Slayer',
    icon: '💀',
    description: 'Cut them down. Slay enemies across all campaigns.',
    category: 'combat',
    tiers: [
      { threshold: 100, reward: { gems: 2 } },
      { threshold: 3000, reward: { gems: 10 } },
      { threshold: 50000, reward: { gems: 25 } },
    ],
    statKey: 'totalEnemiesKilled',
    formatValue: fmtNum,
  },
  {
    id: 'boss_slayer',
    name: 'Boss Slayer',
    icon: '👹',
    description: 'The bigger they are... Slay bosses across all campaigns.',
    category: 'combat',
    tiers: [
      { threshold: 5, reward: { gems: 2 } },
      { threshold: 30, reward: { gems: 10 } },
      { threshold: 100, reward: { gems: 25 } },
    ],
    statKey: 'totalBossesDefeated',
    formatValue: fmtNum,
  },
  {
    id: 'elite_crusher',
    name: 'Elite Crusher',
    icon: '🔥',
    description: 'The elite fall before you. Slay elite enemies.',
    category: 'combat',
    tiers: [
      { threshold: 10, reward: { gems: 2 } },
      { threshold: 100, reward: { gems: 10 } },
      { threshold: 500, reward: { gems: 25 } },
    ],
    statKey: 'totalEliteKills',
    formatValue: fmtNum,
  },
  {
    id: 'dungeon_warrior',
    name: 'Dungeon Warrior',
    icon: '⛏️',
    description: 'Survive the depths. Clear dungeon waves.',
    category: 'combat',
    tiers: [
      { threshold: 5, reward: { gems: 2 } },
      { threshold: 30, reward: { gems: 10 } },
      { threshold: 100, reward: { gems: 25 } },
    ],
    statKey: 'dungeonWavesCleared',
    formatValue: fmtNum,
  },

  // ═══════════════════════════════════════
  // ECONOMY
  // ═══════════════════════════════════════
  {
    id: 'gold_hoarder',
    name: 'Gold Hoarder',
    icon: '💰',
    description: 'Amass a fortune. Earn gold across all campaigns.',
    category: 'economy',
    tiers: [
      { threshold: 50000, reward: { gems: 2 } },
      { threshold: 10000000, reward: { gems: 10 } },
      { threshold: 1000000000, reward: { gems: 30 } },
    ],
    statKey: 'totalGoldEarned',
    formatValue: fmtGold,
  },
  {
    id: 'gem_collector',
    name: 'Gem Collector',
    icon: '💎',
    description: 'Gather precious gems from the fallen.',
    category: 'economy',
    tiers: [
      { threshold: 50, reward: { gems: 1 } },
      { threshold: 500, reward: { gems: 5 } },
      { threshold: 3000, reward: { gems: 20 } },
    ],
    statKey: 'totalGemsEarned',
    formatValue: fmtNum,
  },
  {
    id: 'shard_investor',
    name: 'Shard Investor',
    icon: '🔮',
    description: 'Collect the essence of the ancients.',
    category: 'economy',
    tiers: [
      { threshold: 50, reward: { shards: 1 } },
      { threshold: 750, reward: { shards: 3 } },
      { threshold: 7500, reward: { shards: 8 } },
    ],
    statKey: 'totalShardsEarned',
    formatValue: fmtNum,
  },
  {
    id: 'wealthy',
    name: 'Wealthy',
    icon: '🤑',
    description: 'Strike it rich. Earn massive gold in a single run.',
    category: 'economy',
    tiers: [
      { threshold: 200000, reward: { gems: 2 } },
      { threshold: 10000000, reward: { gems: 10 } },
      { threshold: 500000000, reward: { gems: 30 } },
    ],
    statKey: 'highestGoldInRun',
    formatValue: fmtGold,
  },
  {
    id: 'income_baron',
    name: 'Income Baron',
    icon: '📈',
    description: 'Earn passive gold. Reach 1K, 200K, then 25M gold/min.',
    category: 'economy',
    tiers: [
      { threshold: 1000, reward: { gems: 2 } },
      { threshold: 200000, reward: { gems: 10 } },
      { threshold: 25000000, reward: { gems: 30 } },
    ],
    statKey: 'highestPassiveGPM',
    formatValue: fmtGold,
  },

  // ═══════════════════════════════════════
  // ARMY
  // ═══════════════════════════════════════
  {
    id: 'recruiter',
    name: 'Recruiter',
    icon: '🪖',
    description: 'Rally the troops. Recruit units across all campaigns.',
    category: 'army',
    tiers: [
      { threshold: 10, reward: { gems: 1 } },
      { threshold: 200, reward: { gems: 5 } },
      { threshold: 2000, reward: { gems: 15 } },
    ],
    statKey: 'totalUnitsRecruited',
    formatValue: fmtNum,
  },
  {
    id: 'artifact_hunter',
    name: 'Artifact Hunter',
    icon: '🏺',
    description: 'Seek out the relics of power. Collect artifacts.',
    category: 'army',
    tiers: [
      { threshold: 5, reward: { gems: 2 } },
      { threshold: 30, reward: { gems: 10 } },
      { threshold: 75, reward: { gems: 25 } },
    ],
    statKey: 'totalArtifactsCollected',
    formatValue: fmtNum,
  },
  {
    id: 'relic_collector',
    name: 'Relic Collector',
    icon: '🏛️',
    description: 'Preserve the treasures of the old world.',
    category: 'army',
    tiers: [
      { threshold: 5, reward: { gems: 2 } },
      { threshold: 25, reward: { gems: 10 } },
      { threshold: 75, reward: { gems: 25 } },
    ],
    statKey: 'totalRelicsFound',
    formatValue: fmtNum,
  },

  // ═══════════════════════════════════════
  // HIDDEN
  // ═══════════════════════════════════════
  {
    id: 'audiophile',
    name: 'Audiophile',
    icon: '🎵',
    description: 'Some secrets are found by those who listen closely...',
    category: 'hidden',
    hidden: true,
    singleTier: true,
    tiers: [
      { threshold: 5, reward: { gems: 5 } },
      { threshold: 5, reward: { gems: 0 } },
      { threshold: 5, reward: { gems: 0 } },
    ],
    statKey: 'musicClicks',
    formatValue: (v) => `${v}/5`,
  },
  {
    id: 'untouchable',
    name: 'Untouchable',
    icon: '🛡️',
    description: 'Defeat a boss without your hero taking any damage.',
    category: 'hidden',
    hidden: true,
    singleTier: true,
    tiers: [
      { threshold: 1, reward: { gems: 15 } },
      { threshold: 1, reward: { gems: 0 } },
      { threshold: 1, reward: { gems: 0 } },
    ],
    statKey: 'flawlessBoss',
    formatValue: (v) => v > 0 ? '\u2713' : '0',
  },
  {
    id: 'speed_runner',
    name: 'Speed Runner',
    icon: '⚡',
    description: 'Defeat a boss in under 60 seconds.',
    category: 'hidden',
    hidden: true,
    singleTier: true,
    tiers: [
      { threshold: 1, reward: { gems: 10 } },
      { threshold: 1, reward: { gems: 0 } },
      { threshold: 1, reward: { gems: 0 } },
    ],
    statKey: 'speedRunBoss',
    formatValue: (v) => v > 0 ? '\u2713' : '0',
  },
];

export function checkAchievements(
  stats: Record<string, number>,
  currentProgress: AchievementProgress[],
): AchievementProgress[] {
  return ACHIEVEMENTS.map(def => {
    const current = currentProgress.find(p => p.id === def.id)
      || { id: def.id, unlockedTier: 0, claimedTier: 0 };
    const value = stats[def.statKey] || 0;

    let unlockedTier = 0;
    for (let i = 0; i < 3; i++) {
      if (value >= def.tiers[i].threshold) unlockedTier = i + 1;
    }
    // Single-tier achievements count as 1 unlock, not 3
    if (def.singleTier && unlockedTier > 0) unlockedTier = 1;

    return {
      id: def.id,
      unlockedTier,
      claimedTier: current.claimedTier,
    };
  });
}

export function getUnclaimedCount(progress: AchievementProgress[]): number {
  return progress.reduce((sum, p) => sum + Math.max(0, p.unlockedTier - p.claimedTier), 0);
}

export function defaultAchievementProgress(): AchievementProgress[] {
  return ACHIEVEMENTS.map(a => ({ id: a.id, unlockedTier: 0, claimedTier: 0 }));
}
