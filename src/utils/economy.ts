/** Milestone tier = every 10 levels */
export function getTier(level: number): number {
  return Math.floor(level / 10);
}

/** Zone gold multiplier — 5% bonus per zone to incentivize pushing. */
export function zoneGoldMult(currentZone: number): number {
  return 1 + currentZone * 0.05;
}

// ---- Gold (run) upgrade costs ----

export function goldUpgradeCost(baseCost: number, level: number): number {
  const tier = getTier(level);
  let cost = Math.floor(baseCost * Math.pow(1 + level, 1.8) * (1 + tier * 0.8) * Math.pow(1.13, level));
  if (level % 10 === 9) cost = Math.floor(cost * 1.2);
  return cost;
}

/** Gold Drop upgrade cost — slightly softer exponential (0.95x) to smooth tier boundaries. */
export function goldDropUpgradeCost(level: number): number {
  const tier = getTier(level);
  let cost = Math.floor(22 * Math.pow(1 + level, 1.8) * (1 + tier * 0.8) * Math.pow(1.13, level * 0.95));
  if (level % 10 === 9) cost = Math.floor(cost * 1.2);
  return cost;
}

// ---- Hero (run) upgrade costs — softer curve ----

export function heroUpgradeCost(baseCost: number, level: number): number {
  return Math.floor(baseCost * Math.pow(1 + level, 1.7) * Math.pow(1.15, level));
}

// ---- Gem (permanent) upgrade costs ----

export function gemUpgradeCost(baseCost: number, level: number): number {
  return Math.floor(baseCost * Math.pow(1 + level * 0.3, 1.3));
}

// ---- Hero benefit scaling ----

export function heroTotalHp(baseHp: number, level: number, ranged = false): number {
  const tier = getTier(level);
  if (ranged) {
    // Glass cannon: weak HP growth
    return Math.floor(baseHp * (1 + level * 0.10 * (1 + tier * 0.25)));
  }
  // Melee tank: strong HP growth (~1.3x knight)
  return Math.floor(baseHp * (1 + level * 0.20 * (1 + tier * 0.35)));
}

export function heroTotalDmg(baseDmg: number, level: number, ranged = false): number {
  const tier = getTier(level);
  if (ranged) {
    // Ranged: slow scaling, stays near ally archer damage
    return Math.floor(baseDmg * (1 + level * 0.09 * (1 + tier * 0.25)));
  }
  // Melee: moderate scaling
  return Math.floor(baseDmg * (1 + level * 0.13 * (1 + tier * 0.35)));
}

// ---- Unit benefit scaling ----

export function unitHpMult(level: number): number {
  const tier = getTier(level);
  return 1 + level * 0.16 * (1 + tier * 0.3);
}

export function unitDmgMult(level: number): number {
  const tier = getTier(level);
  return 1 + level * 0.12 * (1 + tier * 0.3);
}

// ---- Gold drop bonus per kill ----

export function goldDropBonus(level: number): number {
  const tier = getTier(level);
  return Math.floor((level * (1 + tier * 1.5) + tier * 8) * softIncomeExp(level));
}

/** Gold Drop multiplier (replaces flat goldDropBonus). Each level adds 5%+, scaling with tier. */
export function goldDropMult(level: number): number {
  let pct = 0;
  for (let i = 1; i <= level; i++) {
    const t = Math.floor((i - 1) / 10);
    pct += 0.05 * (1 + t * 0.3);
  }
  return 1 + pct;
}

/** Zone-based kill gold multiplier — quadratic scaling to reward pushing. */
export function zoneKillGoldMult(zone: number): number {
  return 1 + zone * (zone - 1) * 5;
}

// ══════════════════════════════════════════════════════════════════════════════
// INCOME TIER COST & PAYOUT FORMULAS
// ══════════════════════════════════════════════════════════════════════════════
//
// COST PATTERN:  gated( floor( BASE * RATIO^level * (1 + tier * TIER_MULT) ), level )
//
//   BASE      – Gold cost of the first upgrade (level 0→1). Sets the entry price
//               for the tier. Increasing BASE shifts the entire cost curve up.
//   RATIO     – Per-level cost multiplier (e.g. 1.13 = +13% per level). Controls
//               how fast costs grow. Higher ratio = steeper curve = longer payback
//               at high levels. Must be > ~1.03 for payback to always increase.
//   TIER_MULT – Milestone tier cost bump. Every 10 levels, costs jump by this
//               factor per milestone tier (e.g. 0.6 → +60% at tier 1, +120% at
//               tier 2). Keeps post-milestone costs higher than pre-milestone.
//   GATE TAX  – 1.2x cost on level % 10 === 9 (the last level before a milestone).
//               Creates a "gate" that makes the milestone crossing feel earned.
//
// PAYOUT PATTERN:  floor( (BASE_PAY + level * PER_LV * (1 + tier)) * softIncomeExp(level) )
//
//   BASE_PAY  – Minimum payout at level 1. Sets the floor income for the tier.
//               Higher BASE_PAY = more generous first buy.
//   PER_LV    – Income gained per level. Controls how fast income scales with
//               upgrades. Higher PER_LV = faster income growth.
//   (1 + tier)– Milestone payout multiplier. At tier 1 (lv 10+), payouts double.
//               At tier 2 (lv 20+), payouts triple. This creates the milestone
//               "dip" in payback time that feels rewarding.
//   softExp   – 1.03^(level^0.7). Soft exponential that adds gentle acceleration
//               to payouts at high levels without exploding.
//
// TIER JUMP = (next_tier_income_per_min) / (this_tier_income_per_min)
//   Target: ~8x between adjacent tiers. Affected by both payout ratios AND
//   timer ratios. Changing one tier's payouts affects jumps in BOTH directions
//   (the tier below and above). Always check both when tuning.
//
// TIMER REFERENCE (ticks @ 60/sec → real time → income/min multiplier):
//   T1:    60 ticks =  1s  → payout × 60/min
//   T2:   600 ticks = 10s  → payout ×  6/min
//   T3:  3600 ticks =  1m  → payout ×  1/min
//   T4: 10800 ticks =  3m  → payout /  3/min
//   T5: 18000 ticks =  5m  → payout /  5/min
//   T6: 36000 ticks = 10m  → payout / 10/min
//   T7: 72000 ticks = 20m  → payout / 20/min
//   T8:108000 ticks = 30m  → payout / 30/min
//
// ══════════════════════════════════════════════════════════════════════════════

/** Gate tax: 1.2x cost on the last level before a tier-up (feels like a milestone).
 *  Tier factor is tuned so post-gate (next tier) always costs more than the gate. */
function gated(cost: number, level: number): number {
  return level % 10 === 9 ? Math.floor(cost * 1.2) : cost;
}

// ---- Soft exponential income scaling ----
// Stronger late-game curve so upgrades stay meaningful past tier 3-4

function softIncomeExp(level: number): number {
  return Math.pow(1.045, Math.pow(level, 0.78));
}

// ---- Per-tier income upgrade costs ----
// Formula: gated( floor( BASE * RATIO^lv * (1 + tier * TIER_MULT) ), lv )

/** T1 — Hunting Slimes | 1s timer | ratio 1.21x | tier_mult 0.8 */
export function slimesCost(level: number): number {
  const tier = getTier(level);
  return gated(Math.floor(10 * Math.pow(1.21, level) * (1 + tier * 0.8)), level);
}

/** T2 — Scouting Forests | 10s timer | ratio 1.14x | tier_mult 0.7 */
export function forestsCost(level: number): number {
  if (level === 0) return 2500; // unlock cost stays the same
  const tier = getTier(level);
  return gated(Math.floor(1800 * Math.pow(1.14, level) * (1 + tier * 0.7)), level);
}

/** T3 — Delivering Resources | 1m timer | ratio 1.12x | tier_mult 0.6 */
export function deliveryCost(level: number): number {
  const tier = getTier(level);
  return gated(Math.floor(35000 * Math.pow(1.12, level) * (1 + tier * 0.6)), level);
}

/** T4 — Smithing Swords | 3m timer | ratio 1.13x | tier_mult 0.6 */
export function smithCost(level: number): number {
  const tier = getTier(level);
  return gated(Math.floor(500000 * Math.pow(1.13, level) * (1 + tier * 0.6)), level);
}

/** T5 — Reinforcing Barricades | 5m timer | ratio 1.11x | tier_mult 0.6 */
export function barricadeCost(level: number): number {
  const tier = getTier(level);
  return gated(Math.floor(8000000 * Math.pow(1.11, level) * (1 + tier * 0.6)), level);
}

/** T6 — Enchanting Scrolls | 10m timer | ratio 1.095x | tier_mult 0.6 */
export function enchantingCost(level: number): number {
  const tier = getTier(level);
  return gated(Math.floor(130000000 * Math.pow(1.095, level) * (1 + tier * 0.6)), level);
}

/** T7 — Training Militia | 20m timer | ratio 1.08x | tier_mult 0.6 */
export function militiaCost(level: number): number {
  const tier = getTier(level);
  return gated(Math.floor(1500000000 * Math.pow(1.08, level) * (1 + tier * 0.6)), level);
}

/** T8 — Expanding Territories | 30m timer | ratio 1.07x | tier_mult 0.6 */
export function territoryCost(level: number): number {
  const tier = getTier(level);
  return gated(Math.floor(20000000000 * Math.pow(1.07, level) * (1 + tier * 0.6)), level);
}

// ---- Income tier payouts ----
// Formula: floor( (BASE_PAY + lv * PER_LV * (1 + tier)) * softIncomeExp(lv) )
// T1 uses a unique formula: floor( (lv * (1.5 + tier * 1.5) + tier * 6) * softExp(lv) )

/** T1 — Hunting Slimes | base_pay: lv-scaled | per_lv: 1.5 | tier_mult: 1.5 | tier_bonus: 6 */
export function huntingSlimesIncome(level: number): number {
  const tier = getTier(level);
  return Math.floor((level * (1.5 + tier * 1.5) + tier * 6) * softIncomeExp(level));
}

/** T2 — Scouting Forests | base_pay: 180 | per_lv: 90 | tier_mult: 1.3 */
export function scoutingForestsPayout(level: number): number {
  const tier = getTier(level);
  return Math.floor((180 + level * 90 * (1 + tier * 1.3)) * softIncomeExp(level));
}

/** T3 — Delivering Resources | base_pay: 9900 | per_lv: 4620 | tier_mult: 1.3 */
export function deliveringResourcesPayout(level: number): number {
  const tier = getTier(level);
  return Math.floor((9900 + level * 4620 * (1 + tier * 1.3)) * softIncomeExp(level));
}

/** T4 — Smithing Swords | base_pay: 322000 | per_lv: 140000 | tier_mult: 1.3 */
export function smithingSwordsPayout(level: number): number {
  const tier = getTier(level);
  return Math.floor((322000 + level * 140000 * (1 + tier * 1.3)) * softIncomeExp(level));
}

/** T5 — Reinforcing Barricades | base_pay: 5100000 | per_lv: 2295000 | tier_mult: 1.3 */
export function reinforcingBarricadesPayout(level: number): number {
  const tier = getTier(level);
  return Math.floor((5100000 + level * 2295000 * (1 + tier * 1.3)) * softIncomeExp(level));
}

/** T6 — Enchanting Scrolls | base_pay: 102000000 | per_lv: 42000000 | tier_mult: 1.3 */
export function enchantingScrollsPayout(level: number): number {
  const tier = getTier(level);
  return Math.floor((102000000 + level * 42000000 * (1 + tier * 1.3)) * softIncomeExp(level));
}

/** T7 — Training Militia | base_pay: 1550000000 | per_lv: 600000000 | tier_mult: 1.3 */
export function trainingMilitiaPayout(level: number): number {
  const tier = getTier(level);
  return Math.floor((1550000000 + level * 600000000 * (1 + tier * 1.3)) * softIncomeExp(level));
}

/** T8 — Expanding Territories | base_pay: 17500000000 | per_lv: 6800000000 | tier_mult: 1.3 */
export function expandingTerritoriesPayout(level: number): number {
  const tier = getTier(level);
  return Math.floor((17500000000 + level * 6800000000 * (1 + tier * 1.3)) * softIncomeExp(level));
}

// ---- Passive income summary (gold per minute from all tiers) ----

export function passiveGoldPerMin(ru: { passiveIncome: number; passiveIncome2: number; passiveIncome3: number; passiveIncome4: number; passiveIncome5: number; passiveIncome6: number; passiveIncome7: number; passiveIncome8: number }): number {
  const t1 = (ru.passiveIncome || 0) > 0 ? huntingSlimesIncome(ru.passiveIncome) * 60 : 0;
  const t2 = (ru.passiveIncome2 || 0) > 0 ? scoutingForestsPayout(ru.passiveIncome2) * 6 : 0;
  const t3 = (ru.passiveIncome3 || 0) > 0 ? deliveringResourcesPayout(ru.passiveIncome3) : 0;
  const t4 = (ru.passiveIncome4 || 0) > 0 ? Math.floor(smithingSwordsPayout(ru.passiveIncome4) / 3) : 0;
  const t5 = (ru.passiveIncome5 || 0) > 0 ? Math.floor(reinforcingBarricadesPayout(ru.passiveIncome5) / 5) : 0;
  const t6 = (ru.passiveIncome6 || 0) > 0 ? Math.floor(enchantingScrollsPayout(ru.passiveIncome6) / 10) : 0;
  const t7 = (ru.passiveIncome7 || 0) > 0 ? Math.floor(trainingMilitiaPayout(ru.passiveIncome7) / 20) : 0;
  const t8 = (ru.passiveIncome8 || 0) > 0 ? Math.floor(expandingTerritoriesPayout(ru.passiveIncome8) / 30) : 0;
  return t1 + t2 + t3 + t4 + t5 + t6 + t7 + t8;
}

// ---- Offline income (30% of normal rate, capped at 8h) ----

export function calculateOfflineIncome(
  runUpgrades: { passiveIncome: number; passiveIncome2: number; passiveIncome3: number; passiveIncome4: number; passiveIncome5: number; passiveIncome6: number; passiveIncome7: number; passiveIncome8: number },
  unlockedTiers: { incomeTier2: number; incomeTier3: number; incomeTier4: number; incomeTier5: number; incomeTier6: number; incomeTier7: number; incomeTier8: number },
  elapsedSeconds: number,
): number {
  const cappedSeconds = Math.min(elapsedSeconds, 28800); // 8h max
  const ticks = cappedSeconds * 60;

  const tiers: { threshold: number; level: number; payout: (l: number) => number; gate?: number }[] = [
    { threshold: 60, level: runUpgrades.passiveIncome, payout: huntingSlimesIncome },
    { threshold: 600, level: runUpgrades.passiveIncome2, payout: scoutingForestsPayout, gate: unlockedTiers.incomeTier2 },
    { threshold: 3600, level: runUpgrades.passiveIncome3, payout: deliveringResourcesPayout, gate: unlockedTiers.incomeTier3 },
    { threshold: 10800, level: runUpgrades.passiveIncome4, payout: smithingSwordsPayout, gate: unlockedTiers.incomeTier4 },
    { threshold: 18000, level: runUpgrades.passiveIncome5, payout: reinforcingBarricadesPayout, gate: unlockedTiers.incomeTier5 },
    { threshold: 36000, level: runUpgrades.passiveIncome6, payout: enchantingScrollsPayout, gate: unlockedTiers.incomeTier6 },
    { threshold: 72000, level: runUpgrades.passiveIncome7, payout: trainingMilitiaPayout, gate: unlockedTiers.incomeTier7 },
    { threshold: 108000, level: runUpgrades.passiveIncome8, payout: expandingTerritoriesPayout, gate: unlockedTiers.incomeTier8 },
  ];

  let totalGold = 0;
  for (const tier of tiers) {
    if (tier.gate !== undefined && !tier.gate) continue;
    if (tier.level <= 0) continue;
    const payouts = Math.floor(ticks / tier.threshold);
    totalGold += payouts * tier.payout(tier.level);
  }

  return Math.floor(totalGold * 0.30);
}

// ---- Prestige shard reward (only for NEW progress beyond previous best) ----

export function prestigeShardReward(
  bossesDefeated: number,
  flagsCaptured: number,
  highestZone: number,
  highestFlags: number
): number {
  const newZones = Math.max(0, bossesDefeated - highestZone);
  const newFlags = Math.max(0, flagsCaptured - highestFlags);
  return Math.floor(newZones * 3 + newFlags * 0.8);
}
