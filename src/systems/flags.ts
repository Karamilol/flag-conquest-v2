import { COLORS, GROUND_Y, BUILDING_DEFS, UNIT_STATS } from '../constants';
import { ARTIFACT_DEFS, getEligibleArtifacts as getEligibleArtifactDefs } from '../artifacts';
import { makeParticle, uid, formatNumber } from '../utils/helpers';
import { generateZoneFlags } from '../state';
import type { Artifact, Ally } from '../types';
import type { TickState } from './tickState';
import { tickHasSynergy, tickHasSetBonus, getRegaliaBonus, absorbBossShield } from './tickState';
import { rollRandomRelic, getEligibleRelics, RELIC_DEFS, getRelicLevel } from '../relics';
import { getAncientEffect, getAncientRelicLevel } from '../ancientRelics';
import { rollBossConsumable, getConsumableDef } from '../consumables';
import { MAX_CHALLENGE_LEVEL } from '../challenges';
import { getBossPetId, getPetDef } from '../pets';
import { passiveGoldPerMin, zoneGoldMult } from '../utils/economy';
import { rollRegalia, rollBossRegaliaRarity, rollSurveyRegaliaRarity, getBossDropSlot, getRandomSlot, RARITY_COLORS, MOB_RARITY_POOL, buildUnlockFilter } from '../regalias';
import type { RegaliaRarity } from '../regalias';

/** Contest duration: 20s base + 2s per zone (in ticks at 60fps) */
function contestDuration(zone: number, rc?: Record<string, number>, timedDungeon?: boolean): number {
  let dur = (20 + zone * 2) * 60;
  // Flag Conquest relic: reduce capture time by 2 seconds per level
  if (rc) {
    const fcLv = getRelicLevel(rc['flagConquest'] || 0);
    if (fcLv > 0) dur = Math.max(60, dur - fcLv * 2 * 60); // min 1 second
  }
  // Timed dungeon: 3.5x faster capture
  if (timedDungeon) dur = Math.max(60, Math.floor(dur / 3.5));
  return dur;
}

/** Hero starts flag contest by standing near uncaptured flags */
export function processHeroFlagCapture(ts: TickState): void {
  if (ts.inDungeon && ts.dungeonType !== 'timed') return;
  const { hero } = ts;
  const isTimed = ts.inDungeon && ts.dungeonType === 'timed';
  const dur = contestDuration(ts.currentZone, ts.relicCollection, isTimed);

  for (const flag of ts.flags) {
    if (!flag.captured && !flag.contested && Math.abs(hero.x - flag.x) < 30) {
      ts.particles.push(makeParticle(flag.x, GROUND_Y - 60,
        flag.corrupted ? 'RECLAIMING...' : 'CONTESTING!',
        flag.corrupted ? '#aa77ff' : '#ffffff'));
      flag.contested = true;
      flag.contestTimer = dur;
      flag.contestLastTouch = 'ally';
    }
  }
}

/** Allies start flag contest by standing near uncaptured non-boss flags */
export function processAllyFlagCapture(ts: TickState): void {
  if (ts.inDungeon && ts.dungeonType !== 'timed') return;
  const isTimed = ts.inDungeon && ts.dungeonType === 'timed';
  const dur = contestDuration(ts.currentZone, ts.relicCollection, isTimed);
  for (const flag of ts.flags) {
    if (flag.captured || flag.contested || flag.isBossFlag) continue;
    for (const ally of ts.allies) {
      if (Math.abs(ally.x - flag.x) < 30) {
        ts.particles.push(makeParticle(flag.x, GROUND_Y - 60,
          flag.corrupted ? 'RECLAIMING...' : 'CONTESTING!',
          flag.corrupted ? '#aa77ff' : '#ffffff'));
        flag.contested = true;
        flag.contestTimer = dur;
        flag.contestLastTouch = 'ally';
        break; // only one ally needs to start the contest
      }
    }
  }
}

/** Collect chests when hero walks over them (no expiration) */
export function processChestCollection(ts: TickState): void {
  const { hero } = ts;
  let collected = false;

  ts.chests = ts.chests.filter(chest => {
    chest.age++;
    if (!collected && Math.abs(hero.x - chest.x) < 40) {
      collectChest(ts, chest);
      collected = true;
      return false;
    }
    return true;
  });
}

// ---- Chest rarity overlap odds ----
// When opening a tiered chest, roll which rarity the contents actually are
const CHEST_RARITY_ODDS: Record<string, { common: number; rare: number; legendary: number }> = {
  Common: { common: 0.80, rare: 0.18, legendary: 0.02 },
  Rare: { common: 0.10, rare: 0.75, legendary: 0.15 },
  Legendary: { common: 0.02, rare: 0.18, legendary: 0.80 },
};

function rollChestRarity(tier: 'Common' | 'Rare' | 'Legendary'): 'common' | 'rare' | 'legendary' {
  const odds = CHEST_RARITY_ODDS[tier];
  const roll = Math.random();
  if (roll < odds.common) return 'common';
  if (roll < odds.common + odds.rare) return 'rare';
  return 'legendary';
}

function chestTierFromType(type: string): 'Common' | 'Rare' | 'Legendary' {
  if (type.endsWith('Rare')) return 'Rare';
  if (type.endsWith('Legendary')) return 'Legendary';
  return 'Common';
}

// ---- Individual chest handlers ----

type ChestData = { x: number; y: number; type: string; value: number; relicId?: string; consumableId?: import('../types').ConsumableId; regaliaData?: import('../regalias').Regalia };

function collectGold(ts: TickState, chest: ChestData): void {
  const lookingAheadMult = tickHasSynergy(ts, 'econPair2') ? 1.20 : 1;
  const goldValue = Math.floor(chest.value * lookingAheadMult);
  ts.goldEarned += goldValue;
  ts.particles.push(makeParticle(chest.x, chest.y - 20, `+${formatNumber(goldValue)}g`, COLORS.gold));
}

function collectGem(ts: TickState, chest: ChestData): void {
  const lookingAheadMult = tickHasSynergy(ts, 'econPair2') ? 1.20 : 1;
  const rGemBonus = getRegaliaBonus(ts, 'gemBonusPct');
  const gemValue = Math.floor(Math.max(1, chest.value) * lookingAheadMult * (1 + rGemBonus / 100));
  ts.gemsThisRun += gemValue;
  ts.particles.push(makeParticle(chest.x, chest.y - 20, `+${gemValue}💎`, '#a855f7'));
}

function collectConsumableChest(ts: TickState, chest: ChestData): void {
  if (chest.consumableId) {
    ts.onCollectConsumable(chest.consumableId);
  } else {
    const goldBonus = 20 + ts.currentZone * 10;
    ts.goldEarned += goldBonus;
    ts.particles.push(makeParticle(chest.x, chest.y - 20, `+${formatNumber(goldBonus)}g`, COLORS.gold));
  }
}

function collectShard(ts: TickState, chest: ChestData): void {
  const rShardBonus = getRegaliaBonus(ts, 'shardBonusPct');
  const shardValue = Math.max(chest.value, Math.floor(chest.value * (1 + rShardBonus / 100)));
  ts.shardsThisRun += shardValue;
  ts.particles.push(makeParticle(chest.x, chest.y - 20, `+${shardValue}🔮`, '#ff44ff'));
}

function collectRelicChest(ts: TickState, chest: ChestData): void {
  const tier = chestTierFromType(chest.type);
  const eligible = getEligibleRelics(ts.upgrades as Record<string, number>);
  if (eligible.length === 0) return;
  const choices: { id: string; name: string; icon: string; rarity: string; desc: string }[] = [];
  const used = new Set<string>();
  const count = Math.min(3, eligible.length);
  for (let i = 0; i < count; i++) {
    const rarity = rollChestRarity(tier);
    const candidates = eligible.filter(r => r.rarity === rarity && !used.has(r.id));
    const pool = candidates.length > 0 ? candidates : eligible.filter(r => !used.has(r.id));
    const fallback = pool.length > 0 ? pool : eligible;
    const picked = fallback[Math.floor(Math.random() * fallback.length)];
    choices.push({ id: picked.id, name: picked.name, icon: picked.icon, rarity: picked.rarity, desc: picked.desc });
    used.add(picked.id);
  }
  ts.pendingRelicChoice = choices;
  const tierColors = { Common: '#aaa', Rare: '#4a9fff', Legendary: '#ffd700' };
  ts.particles.push(makeParticle(chest.x, chest.y - 20, '✨ RELIC CHOICE! ✨', tierColors[tier]));
}

function collectArtifactChest(ts: TickState, chest: ChestData): void {
  const tier = chestTierFromType(chest.type);
  const ownedIds = ts.artifacts.map(a => a.id);
  const eligible = getEligibleArtifactDefs(
    (ts.upgrades as any).unlockedUnits || ['soldier'],
    ts.upgrades as Record<string, number>,
    ownedIds,
    (ts.upgrades as any).disabledUnits || [],
  );
  if (eligible.length === 0) {
    const goldBonus = 100 + ts.currentZone * 50;
    ts.goldEarned += goldBonus;
    ts.particles.push(makeParticle(chest.x, chest.y - 20, `+${goldBonus}g (all artifacts owned)`, '#ffd700'));
    return;
  }
  const choices: Artifact[] = [];
  const pool = [...eligible];
  const count = Math.min(3, pool.length);
  for (let i = 0; i < count; i++) {
    const rarity = rollChestRarity(tier);
    const byRarity = pool.filter(a => a.rarity === rarity);
    const pick = byRarity.length > 0 ? byRarity : pool;
    const idx = Math.floor(Math.random() * pick.length);
    const chosen = pick[idx];
    choices.push({ id: chosen.id, name: chosen.name, desc: chosen.desc, icon: chosen.icon, rarity: chosen.rarity, category: chosen.category, pairId: chosen.pairId, slot: chosen.slot });
    pool.splice(pool.indexOf(chosen), 1);
  }
  ts.pendingArtifactChoice = choices;
  const tierColors = { Common: '#B8860B', Rare: '#4a9fff', Legendary: '#ffd700' };
  ts.particles.push(makeParticle(chest.x, chest.y - 20, '🏆 ARTIFACT CHOICE! 🏆', tierColors[tier]));
}

function collectRegaliaChest(ts: TickState, chest: ChestData): void {
  if (chest.regaliaData) {
    ts.onCollectRegalia(chest.regaliaData);
    const color = RARITY_COLORS[chest.regaliaData.rarity];
    const rarityLabel = chest.regaliaData.rarity.charAt(0).toUpperCase() + chest.regaliaData.rarity.slice(1);
    ts.particles.push(makeParticle(chest.x, chest.y - 20, `✨ ${rarityLabel} Regalia! ✨`, color));
    ts.particles.push(makeParticle(chest.x, chest.y - 40, chest.regaliaData.name, color));
  }
}

const CHEST_HANDLERS: Record<string, (ts: TickState, chest: ChestData) => void> = {
  gold: collectGold,
  gem: collectGem,
  shard: collectShard,
  consumable: collectConsumableChest,
  relicCommon: collectRelicChest,
  relicRare: collectRelicChest,
  relicLegendary: collectRelicChest,
  artifactCommon: collectArtifactChest,
  artifactRare: collectArtifactChest,
  artifactLegendary: collectArtifactChest,
  regalia: collectRegaliaChest,
};

/** Shared chest collection logic — dispatches to type-specific handler */
export function collectChest(ts: TickState, chest: ChestData): void {
  const handler = CHEST_HANDLERS[chest.type];
  if (handler) {
    handler(ts, chest);
  } else {
    console.warn('[CHEST] Unknown chest type:', chest.type);
  }
}

/** Handle boss death: rewards, zone transition, artifact choice */
export function processBossDefeat(ts: TickState): void {
  const boss = ts.boss;
  if (!boss || boss.health > 0) return;

  // Timed dungeon: boss kill = victory, drop regalia on ground
  if (ts.inDungeon && ts.dungeonType === 'timed') {
    ts.timedDungeonVictory = true;
    ts.timedDungeonTimer = 3600; // 60 seconds to grab loot
    ts.boss = null;
    ts.particles.push(makeParticle(boss.x, boss.y - 30, '\u{1F480} DUNGEON BOSS SLAIN! \u{1F480}', '#ff3333'));
    ts.particles.push(makeParticle(boss.x, boss.y - 50, '60s to collect loot!', '#ffd700'));

    // Drop regalia chest on the ground
    const zone = ts.dungeonTriggerZone;
    const slot = getRandomSlot();
    const rarityPool: RegaliaRarity[] = zone < 3
      ? ['common', 'common', 'rare']
      : zone < 6
        ? ['common', 'rare', 'rare', 'legendary']
        : ['rare', 'rare', 'legendary', 'legendary'];
    const rarity = rarityPool[Math.floor(Math.random() * rarityPool.length)];
    const droppedRegalia = rollRegalia(slot, zone + 1, rarity, buildUnlockFilter(ts.upgrades));
    const rColor = RARITY_COLORS[rarity];
    ts.chests.push({ id: uid(), x: boss.x, y: GROUND_Y - 22, type: 'regalia', value: 0, age: 0, regaliaData: droppedRegalia });
    ts.particles.push(makeParticle(boss.x, boss.y - 50, `\u{1F451} ${rarity.toUpperCase()} REGALIA!`, rColor));
    return;
  }

  // Wave dungeon: no boss mechanic
  if (ts.inDungeon) return;

  const bossZone = boss.zone || 0;
  const bossReward = Math.floor((100 + bossZone * 50) * zoneGoldMult(ts.currentZone));
  ts.goldEarned += bossReward;
  const bossGemReward = 6 + bossZone * 4;
  ts.gemsThisRun += bossGemReward;
  const bossShardReward = 1;
  ts.shardsThisRun += bossShardReward;
  ts.bossesDefeated += 1;
  // Masterwork Arms (Smithy 6pc): track boss kills for hero scaling
  if (tickHasSetBonus(ts, 'smithysSet', 6)) {
    ts.hero.masterworkBossCount = (ts.hero.masterworkBossCount || 0) + 1;
  }
  ts.particles.push(makeParticle(boss.x, boss.y, `+${bossReward}g +${bossGemReward}💎 +${bossShardReward}🔮`, COLORS.gold));
  ts.particles.push(makeParticle(boss.x, boss.y - 30, `💀 BOSS #${bossZone + 1} SLAIN! 💀`, '#ff3333'));

  // Challenge level progression: increment on each boss kill
  if (ts.challengeId && ts.challengeLevel < MAX_CHALLENGE_LEVEL) {
    ts.challengeLevel++;
    ts.challengeComplete = true; // backwards compat for game-over display
    ts.challengeLevelUpPending = false; // no longer pauses — particles handle the celebration
    ts.particles.push(makeParticle(boss.x, boss.y - 60, `🏆 CHALLENGE LV.${ts.challengeLevel} COMPLETE! 🏆`, '#ffd700'));
  }

  // Determine chest tier based on zone progression
  const relicTier: 'relicCommon' | 'relicRare' | 'relicLegendary' =
    bossZone >= 6 ? 'relicLegendary' : bossZone >= 3 ? 'relicRare' : 'relicCommon';
  const artifactTier: 'artifactCommon' | 'artifactRare' | 'artifactLegendary' =
    bossZone >= 6 ? 'artifactLegendary' : bossZone >= 3 ? 'artifactRare' : 'artifactCommon';

  // Spawn tiered relic chest
  ts.chests.push({ id: uid(), x: boss.x + 40, y: GROUND_Y - 22, type: relicTier, value: 0, age: 0 });
  const relicTierLabel = relicTier.replace('relic', '').toUpperCase();
  const relicTierColor = relicTier === 'relicLegendary' ? '#ffd700' : relicTier === 'relicRare' ? '#4a9fff' : '#aaa';
  ts.particles.push(makeParticle(boss.x + 40, boss.y - 50, `🏺 ${relicTierLabel} RELIC CHEST!`, relicTierColor));

  // Roll for consumable — 80% chance — Embargo: no drops
  const consumableDrop = ts.challengeId === 'embargo' ? null : rollBossConsumable(0.80, ts.dungeonUnlocked);
  if (consumableDrop) {
    const cDef = getConsumableDef(consumableDrop);
    ts.chests.push({ id: uid(), x: boss.x + 60, y: GROUND_Y - 22, type: 'consumable', value: 0, age: 0, consumableId: consumableDrop });
    ts.particles.push(makeParticle(boss.x + 60, boss.y - 70, `${cDef.icon} ${cDef.name}!`, '#44ffaa'));
  }

  // Guaranteed regalia drop from boss (cycles sword/shield/necklace)
  {
    const regaliaSlot = getBossDropSlot(ts.bossesDefeated - 1);
    const regaliaRarity = rollBossRegaliaRarity(bossZone);
    const droppedRegalia = rollRegalia(regaliaSlot, bossZone + 1, regaliaRarity, buildUnlockFilter(ts.upgrades));
    const rColor = RARITY_COLORS[regaliaRarity];
    ts.chests.push({ id: uid(), x: boss.x + 80, y: GROUND_Y - 22, type: 'regalia', value: 0, age: 0, regaliaData: droppedRegalia });
    ts.particles.push(makeParticle(boss.x + 80, boss.y - 50, `👑 ${regaliaRarity.toUpperCase()} REGALIA!`, rColor));
  }

  // Capture boss flag
  const bossFlagIndex = ts.flags.findIndex(f => f.isBossFlag && !f.captured);
  if (bossFlagIndex !== -1) {
    ts.flags[bossFlagIndex] = { ...ts.flags[bossFlagIndex], captured: true };
    ts.flagsCaptured++;
    ts.lastFlagCaptureFrame = ts.frame;
  }

  // Clear Wraith King corruption: auto-recapture all corrupted flags
  if (boss.bossType === 2) {
    ts.flags = ts.flags.map(f => f.corrupted ? { ...f, corrupted: false, captured: true } : f);
    ts.particles.push(makeParticle(boss.x, boss.y - 50, '✨ CORRUPTION LIFTED! ✨', '#4aff4a'));
  }

  // Broodmother death: remaining pups go feral (cap lifted, fight until killed)
  if (boss.bossType === 3) {
    ts.enemyHounds.forEach(h => { if (h.isBroodPup) h.isBroodPup = false; });
    if (ts.enemyHounds.length > 0) {
      ts.particles.push(makeParticle(boss.x + 32, boss.y - 50, '\u{1F43A} THE PACK RUNS WILD!', '#ff4400'));
    }
  }

  // Ice Conjurer death — shatter all ice walls and turrets
  if (boss.bossType === 5) {
    ts.iceWalls.forEach(w => ts.particles.push(makeParticle(w.x, w.y - 10, '❄️💥', '#88ccff')));
    ts.iceTurrets.forEach(t => ts.particles.push(makeParticle(t.x, t.y - 10, '❄️💥', '#88ccff')));
    ts.iceWalls = [];
    ts.iceTurrets = [];
    ts.particles.push(makeParticle(boss.x, boss.y - 70, '❄️ The frost shatters...', '#88ccff'));
  }

  // White Ninja death
  if (boss.bossType === 6) {
    ts.particles.push(makeParticle(boss.x, boss.y - 70, '🥷 The shadow vanishes...', '#ddd'));
  }

  // Boss pet drop — 20% chance if not already owned
  if (boss.bossType != null) {
    const petId = getBossPetId(boss.bossType);
    if (petId && !ts.ownedPets.includes(petId) && Math.random() < 0.20) {
      const petDef = getPetDef(petId);
      if (petDef) {
        ts.onCollectPet(petId);
        ts.particles.push(makeParticle(boss.x, boss.y - 90, `${petDef.icon} NEW PET: ${petDef.name}!`, '#ffaa00'));
        ts.particles.push(makeParticle(boss.x, boss.y - 110, petDef.effectDescription, '#ffcc44'));
      }
    }
  }

  if (ts.autoPortalForward) autoAdvancePortal(ts);

  // Generate next zone
  const nextZone = bossZone + 1;
  ts.flags = [...ts.flags, ...generateZoneFlags(nextZone)];
  ts.currentZone = nextZone;
  ts.boss = null;
  ts.smithingBonusStacks = 0; // Reset Better Weapons stacks per zone
  // Reset Second Wind / Nature's Grace availability for new zone
  ts.heroSkills.secondWindAvailable = true;
  ts.heroSkills.naturesGraceAvailable = true;

  // Spawn tiered artifact chest
  ts.chests.push({ id: uid(), x: boss.x, y: GROUND_Y - 22, type: artifactTier, value: 0, age: 0 });
  const artTierLabel = artifactTier.replace('artifact', '').toUpperCase();
  const artTierColor = artifactTier === 'artifactLegendary' ? '#ffd700' : artifactTier === 'artifactRare' ? '#4a9fff' : '#B8860B';
  ts.particles.push(makeParticle(boss.x, boss.y - 50, `✨ ${artTierLabel} ARTIFACT CHEST! ✨`, artTierColor));
  ts.particles.push(makeParticle(boss.x + 200, GROUND_Y - 80, `🚩 ZONE ${nextZone + 1} UNLOCKED! 🚩`, '#4aff4a'));

  // First dungeon: spawn guaranteed portal after second boss defeat (Wild Huntsman, not in challenges)
  if (boss.bossType === 1 && !ts.dungeonUnlocked && !ts.challengeId) {
    ts.dungeonUnlocked = true;
    ts.dungeonPortalTimer = 1800; // 30 seconds
    ts.dungeonPortalFlagId = ts.flags[bossFlagIndex !== -1 ? bossFlagIndex : 0].id;
    ts.particles.push(makeParticle(boss.x, boss.y - 70, '\u{1F7E3} ANCIENT DUNGEON PORTAL! \u{1F7E3}', '#aa44ff'));
    ts.particles.push(makeParticle(boss.x, boss.y - 90, 'A mysterious gateway has appeared...', '#cc88ff'));
  }
}

/** Process dungeon key portal request: spawn a dungeon portal at nearest captured flag */
export function processDungeonKeyPortal(ts: TickState): void {
  if (!ts.artifactKeyPortalRequested || ts.inDungeon || ts.dungeonPortalFlagId >= 0 || ts.challengeId) return;
  // Find nearest captured flag to hero
  let bestFlag = ts.flags.find(f => f.captured && !f.isBossFlag);
  if (!bestFlag) bestFlag = ts.flags.find(f => f.captured);
  if (!bestFlag) return;
  ts.artifactKeyPortalRequested = false;
  ts.dungeonPortalTimer = 3600; // 60 seconds (key-spawned portal lasts longer)
  ts.dungeonPortalFlagId = bestFlag.id;
  ts.particles.push(makeParticle(bestFlag.x, GROUND_Y - 80, '\u{1F5DD}\uFE0F DUNGEON PORTAL SUMMONED!', '#aa44ff'));
  ts.particles.push(makeParticle(bestFlag.x, GROUND_Y - 100, 'A key-forged gateway appears...', '#cc88ff'));
}

/** Auto-advance portal to the latest captured flag */
function autoAdvancePortal(ts: TickState): void {
  // No Retreat: portal cannot advance forward
  if (ts.challengeId === 'noRetreat') return;
  // Find actual index of rightmost captured flag
  let maxPortalIndex = -1;
  for (let i = ts.flags.length - 1; i >= 0; i--) {
    if (ts.flags[i].captured) { maxPortalIndex = i; break; }
  }

  // Don't advance portal within 200px of an active Wraith King
  if (ts.boss && ts.boss.bossType === 2 && ts.boss.health > 0) {
    const bossX = ts.boss.x;
    for (let i = 0; i < ts.flags.length; i++) {
      if (ts.flags[i].x >= bossX - 200) {
        maxPortalIndex = Math.min(maxPortalIndex, Math.max(0, i - 1));
        break;
      }
    }
  }

  if (maxPortalIndex > ts.portalFlagIndex) {
    ts.portalFlagIndex = maxPortalIndex;
    const flag = ts.flags[maxPortalIndex];
    if (flag) {
      ts.particles.push(makeParticle(flag.x, GROUND_Y - 50, '🌀 Portal Auto-Moved!', '#a855f7'));
      // Ancient Relic: World Splitter — deal % max HP damage to enemies in 500px radius (scales with level)
      if (ts.ancientRelicsOwned.includes('worldSplitter')) {
        const wsEff = getAncientEffect('worldSplitter', getAncientRelicLevel(ts.ancientRelicCopies['worldSplitter'] || 1));
        const wsDmgPct = wsEff.dmgPct || 0.05;
        let hitCount = 0;
        const px = flag.x;
        for (const e of ts.enemies) { if (Math.abs(e.x - px) < 500) { e.health -= Math.floor(e.maxHealth * wsDmgPct); hitCount++; } }
        for (const a of ts.enemyArchers) { if (Math.abs(a.x - px) < 500) { a.health -= Math.floor(a.maxHealth * wsDmgPct); hitCount++; } }
        for (const w of ts.enemyWraiths) { if (Math.abs(w.x - px) < 500) { const dmg = Math.max(1, Math.floor(w.maxHealth * wsDmgPct) - (w.defense || 0)); w.health -= dmg; hitCount++; } }
        for (const hd of ts.enemyHounds) { if (Math.abs(hd.x - px) < 500) { hd.health -= Math.floor(hd.maxHealth * wsDmgPct); hitCount++; } }
        for (const l of ts.enemyLichs) { if (Math.abs(l.x - px) < 500) { l.health -= Math.floor(l.maxHealth * wsDmgPct); hitCount++; } }
        for (const sa of ts.enemyShadowAssassins) { if (Math.abs(sa.x - px) < 500) { sa.health -= Math.floor(sa.maxHealth * wsDmgPct); hitCount++; } }
        for (const fc of ts.enemyFlameCallers) { if (Math.abs(fc.x - px) < 500) { fc.health -= Math.floor(fc.maxHealth * wsDmgPct); hitCount++; } }
        for (const cs of ts.enemyCorruptedSentinels) { if (Math.abs(cs.x - px) < 500) { cs.health -= Math.floor(cs.maxHealth * wsDmgPct); hitCount++; } }
        for (const dr of ts.enemyDungeonRats) { if (Math.abs(dr.x - px) < 500) { dr.health -= Math.floor(dr.maxHealth * wsDmgPct); hitCount++; } }
        for (const fi of ts.enemyFireImps) { if (Math.abs(fi.x - px) < 500) { fi.health -= Math.floor(fi.maxHealth * wsDmgPct); hitCount++; } }
        for (const ck of ts.enemyCursedKnights) { if (Math.abs(ck.x - px) < 500) { ck.health -= Math.floor(ck.maxHealth * wsDmgPct); hitCount++; } }
        if (ts.boss && ts.boss.health > 0 && Math.abs(ts.boss.x - px) < 500) {
          ts.boss.health -= absorbBossShield(ts.boss, Math.floor(ts.boss.maxHealth * wsDmgPct)); hitCount++;
        }
        if (hitCount > 0) {
          ts.particles.push(makeParticle(px, GROUND_Y - 70, `\u{1F300} WORLD SPLITTER! -${Math.round(wsDmgPct * 100)}%x${hitCount}`, '#ff8800'));
        }
      }
    }
  }
}

/** Tick contested flag timers: allies present = progress, enemies = pause, no allies = regress */
export function processFlagContest(ts: TickState): void {
  if (ts.inDungeon && ts.dungeonType !== 'timed') return;

  let anyFlagCaptured = false;

  ts.flags = ts.flags.map(flag => {
    if (!flag.contested || flag.captured) return flag;

    const fx = flag.x;

    // Check if hero or any ally is within capture range
    const heroNearby = ts.hero.health > 0 && Math.abs(ts.hero.x - fx) < 30;
    const allyNearby = ts.allies.some(a => a.health > 0 && Math.abs(a.x - fx) < 30);
    const alliesPresent = heroNearby || allyNearby;

    // Check if any living enemy is within range
    const enemiesPresent = (
      ts.enemies.some(e => e.health > 0 && Math.abs(e.x - fx) < 30) ||
      ts.enemyArchers.some(e => e.health > 0 && Math.abs(e.x - fx) < 30) ||
      ts.enemyWraiths.some(e => e.health > 0 && Math.abs(e.x - fx) < 30) ||
      ts.enemyHounds.some(e => e.health > 0 && Math.abs(e.x - fx) < 30 && !(e.lungeTimer && e.lungeTimer > 0)) ||
      ts.enemyLichs.some(e => e.health > 0 && Math.abs(e.x - fx) < 30) ||
      ts.enemyShadowAssassins.some(e => e.health > 0 && Math.abs(e.x - fx) < 30 && e.stealthTimer <= 0) ||
      ts.enemyFlameCallers.some(e => e.health > 0 && Math.abs(e.x - fx) < 30) ||
      ts.enemyCorruptedSentinels.some(e => e.health > 0 && Math.abs(e.x - fx) < 30) ||
      ts.enemyDungeonRats.some(e => e.health > 0 && Math.abs(e.x - fx) < 30) ||
      ts.enemyFireImps.some(e => e.health > 0 && Math.abs(e.x - fx) < 30) ||
      ts.enemyCursedKnights.some(e => e.health > 0 && Math.abs(e.x - fx) < 30)
    );

    // Determine last touch and timer direction
    let lastTouch = flag.contestLastTouch || 'ally';
    if (alliesPresent && !enemiesPresent) lastTouch = 'ally';
    else if (enemiesPresent && !alliesPresent) lastTouch = 'enemy';
    // Both present = paused, neither present = momentum from lastTouch

    if (alliesPresent && enemiesPresent) {
      // Paused — both sides present, timer holds
      return { ...flag, contestLastTouch: lastTouch };
    }

    // Tick direction based on who controls the flag
    const tickDown = lastTouch === 'ally';

    if (tickDown) {
      // Progress toward capture
      const newTimer = (flag.contestTimer || 0) - 1;
      if (newTimer <= 0) {
        // Flag captured!
        if (!flag.corrupted) {
          ts.flagsCaptured++;
          ts.lastFlagCaptureFrame = ts.frame;
          const isTimed = ts.inDungeon && ts.dungeonType === 'timed';
          if (!isTimed) ts.gemsThisRun += 1;
          ts.particles.push(makeParticle(fx, GROUND_Y - 40, isTimed ? 'CAPTURED!' : '+1💎', COLORS.gold));
          ts.particles.push(makeParticle(fx, GROUND_Y - 60, 'CAPTURED!', COLORS.flagFriendly));
          // Dungeon pity trigger (not in challenges, not in dungeons)
          if (ts.dungeonUnlocked && ts.dungeonPortalTimer <= 0 && ts.timedDungeonPortalTimer <= 0 && !ts.challengeId && !ts.inDungeon) {
            ts.dungeonPityCounter++;
            const triggerChance = Math.min(0.10, 0.01 + (ts.dungeonPityCounter - 1) * 0.005);
            if (Math.random() < triggerChance) {
              ts.dungeonPityCounter = 0;
              // 50/50 chance: artifact dungeon or regalia dungeon portal
              if (Math.random() < 0.5) {
                ts.dungeonPortalTimer = 1800;
                ts.dungeonPortalFlagId = flag.id;
                ts.particles.push(makeParticle(fx, GROUND_Y - 80, '\u{1F7E3} ARTIFACT DUNGEON PORTAL! \u{1F7E3}', '#aa44ff'));
              } else {
                ts.timedDungeonPortalTimer = 1800;
                ts.timedDungeonPortalFlagId = flag.id;
                ts.particles.push(makeParticle(fx, GROUND_Y - 80, '\u{1F525} REGALIA DUNGEON PORTAL! \u{1F525}', '#ff6633'));
              }
            }
          }
        } else {
          ts.particles.push(makeParticle(fx, GROUND_Y - 60, 'RECLAIMED!', '#aa77ff'));
        }
        anyFlagCaptured = true;
        return { ...flag, captured: true, corrupted: false, contested: false, contestTimer: 0, contestLastTouch: undefined };
      }
      return { ...flag, contestTimer: newTimer, contestLastTouch: lastTouch };
    } else {
      // Enemy momentum — regress timer back toward max
      const isTimed = ts.inDungeon && ts.dungeonType === 'timed';
      const maxTimer = contestDuration(ts.currentZone, ts.relicCollection, isTimed);
      const newTimer = Math.min(maxTimer, (flag.contestTimer || 0) + 2);
      if (newTimer >= maxTimer) {
        // Fully reverted — flag goes back to red
        ts.particles.push(makeParticle(fx, GROUND_Y - 60, 'LOST!', '#ff4444'));
        return { ...flag, contested: false, contestTimer: 0, contestLastTouch: undefined };
      }
      return { ...flag, contestTimer: newTimer, contestLastTouch: lastTouch };
    }
  });

  // Auto-capture trailing contested flags: if you've pushed to contest a flag further ahead,
  // any previously contested flags behind it should instantly capture
  const contestedFlags = ts.flags.filter(f => f.contested && !f.captured).sort((a, b) => a.x - b.x);
  if (contestedFlags.length >= 2) {
    // Keep only the furthest-forward flag contested; auto-cap all behind it
    const trailingFlags = contestedFlags.slice(0, -1);
    for (const trailing of trailingFlags) {
      ts.flags = ts.flags.map(f => {
        if (f.id !== trailing.id) return f;
        if (!f.corrupted) {
          ts.flagsCaptured++;
          ts.lastFlagCaptureFrame = ts.frame;
          const isTimed = ts.inDungeon && ts.dungeonType === 'timed';
          if (!isTimed) ts.gemsThisRun += 1;
          ts.particles.push(makeParticle(f.x, GROUND_Y - 40, isTimed ? 'AUTO-CAPTURED!' : '+1💎', COLORS.gold));
          ts.particles.push(makeParticle(f.x, GROUND_Y - 60, 'AUTO-CAPTURED!', '#44ffaa'));
        } else {
          ts.particles.push(makeParticle(f.x, GROUND_Y - 60, 'RECLAIMED!', '#aa77ff'));
        }
        anyFlagCaptured = true;
        return { ...f, captured: true, corrupted: false, contested: false, contestTimer: 0, contestLastTouch: undefined };
      });
    }
  }

  // Auto-advance portal if a flag was captured
  if (anyFlagCaptured && ts.autoPortalForward && !(ts.boss && ts.boss.bossType === 2 && ts.boss.health > 0)) {
    autoAdvancePortal(ts);
  }
}

/** Process flag building effects (income, one-shot, regen — passive buffs applied at spawn in spawning.ts) */
export function processFlagBuildings(ts: TickState): void {
  if (ts.inDungeon) return;

  // Church regen: count churches for stacking (0.5% HP per 3s per church)
  const { church: churchCount, blueprintsMult } = ts.buildingCounts;
  // Church regen once per 3 seconds (Cursed Lands: disabled)
  if (churchCount > 0 && ts.frame % 180 === 0 && ts.challengeId !== 'cursedLands') {
    const regenPct = 0.005 * churchCount * blueprintsMult;
    for (const ally of ts.allies) {
      if (ally.health < ally.maxHealth) {
        const heal = Math.max(1, Math.floor(ally.maxHealth * regenPct));
        ally.health = Math.min(ally.maxHealth, ally.health + heal);
      }
    }
    if (ts.hero.health > 0 && ts.hero.health < ts.hero.maxHealth) {
      const heroHeal = Math.max(1, Math.floor(ts.hero.maxHealth * regenPct));
      ts.hero.health = Math.min(ts.hero.maxHealth, ts.hero.health + heroHeal);
    }
  }

  // Regalia regen: per-unit regenPct + armyRegenPct + heroRegenPct (once per second, Cursed Lands: disabled)
  if (ts.frame % 60 === 0 && ts.challengeId !== 'cursedLands') {
    const armyRegen = getRegaliaBonus(ts, 'armyRegenPct');
    for (const ally of ts.allies) {
      if (ally.health > 0 && ally.health < ally.maxHealth) {
        const unitRegen = getRegaliaBonus(ts, 'regenPct', { target: ally.unitType });
        const totalRegenPct = (unitRegen + armyRegen) / 100;
        if (totalRegenPct > 0) {
          const heal = Math.max(1, Math.floor(ally.maxHealth * totalRegenPct));
          ally.health = Math.min(ally.maxHealth, ally.health + heal);
        }
      }
    }
    const heroRegen = getRegaliaBonus(ts, 'heroRegenPct');
    if (heroRegen > 0 && ts.hero.health > 0 && ts.hero.health < ts.hero.maxHealth) {
      const heal = Math.max(1, Math.floor(ts.hero.maxHealth * heroRegen / 100));
      ts.hero.health = Math.min(ts.hero.maxHealth, ts.hero.health + heal);
    }
  }

  for (const flag of ts.flags) {
    if (!flag.buildingType || !flag.captured || flag.corrupted || flag.contested) continue;

    const def = BUILDING_DEFS[flag.buildingType];
    if (!def) continue;

    // Farm: passive gold income every 10s — 2% of passive income/min
    if (flag.buildingType === 'farm') {
      flag.buildingTimer = (flag.buildingTimer || 0) + 1;
      if (flag.buildingTimer >= 600) {
        flag.buildingTimer = 0;
        const payout = Math.max(5, Math.floor(passiveGoldPerMin(ts.runUpgrades) * 0.02 * blueprintsMult));
        ts.goldEarned += payout;
        ts.particles.push(makeParticle(flag.x, GROUND_Y - 50,
          `${def.icon} +${payout}g`, '#88cc44'));
      }
    }

    // Ruins: one-time artifact chest
    if (flag.buildingType === 'ruins' && !flag.ruinsTriggered) {
      flag.ruinsTriggered = true;
      ts.chests.push({
        id: uid(), x: flag.x + 20, y: GROUND_Y - 22,
        type: 'artifactCommon', value: 0, age: 0,
      });
      ts.particles.push(makeParticle(flag.x, GROUND_Y - 70,
        '🏛️ ANCIENT RUINS DISCOVERED!', '#ccaa44'));
      ts.particles.push(makeParticle(flag.x, GROUND_Y - 85,
        '✨ ARTIFACT CHEST! ✨', '#B8860B'));
    }

    // Survey Site: one-time regalia chest (Rare/Legendary 70/30) + relic chest
    if (flag.buildingType === 'surveySite' && !flag.ruinsTriggered) {
      flag.ruinsTriggered = true;
      // Relic chest (original behavior)
      ts.chests.push({
        id: uid(), x: flag.x + 20, y: GROUND_Y - 22,
        type: 'relicCommon', value: 0, age: 0,
      });
      // Regalia chest (guaranteed Rare/Legendary)
      const surveyRarity = rollSurveyRegaliaRarity();
      const surveyRegalia = rollRegalia(getRandomSlot(), ts.currentZone + 1, surveyRarity, buildUnlockFilter(ts.upgrades));
      ts.chests.push({
        id: uid(), x: flag.x + 40, y: GROUND_Y - 22,
        type: 'regalia', value: 0, age: 0, regaliaData: surveyRegalia,
      });
      const sColor = RARITY_COLORS[surveyRarity];
      ts.particles.push(makeParticle(flag.x, GROUND_Y - 70,
        '🔍 SURVEY SITE DISCOVERED!', '#8888cc'));
      ts.particles.push(makeParticle(flag.x, GROUND_Y - 85,
        `👑 ${surveyRarity.toUpperCase()} REGALIA!`, sColor));
    }
  }
}

/** Age and cull expired particles */
export function processParticles(ts: TickState): void {
  let write = 0;
  for (let i = 0; i < ts.particles.length; i++) {
    const p = ts.particles[i];
    p.age++;
    if (p.age < 90) ts.particles[write++] = p;
  }
  ts.particles.length = write;
}
