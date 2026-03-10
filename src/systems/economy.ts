import { GROUND_Y, UNIT_STATS, ENEMY_SIZE, isUnitMelee } from '../constants';
import { makeParticle, uid, formatNumber } from '../utils/helpers';
import { passiveGoldPerMin, goldDropMult, zoneKillGoldMult, unitHpMult, unitDmgMult, huntingSlimesIncome, scoutingForestsPayout, deliveringResourcesPayout, smithingSwordsPayout, reinforcingBarricadesPayout, enchantingScrollsPayout, trainingMilitiaPayout, expandingTerritoriesPayout, zoneGoldMult } from '../utils/economy';
import type { TickState } from './tickState';
import { tickHasArtifact, tickHasSynergy, tickHasSetBonus, tickSkillBuffActive, tickHasSkill, getRegaliaBonus, dealDamageToHero, dealDamageToAlly } from './tickState';
import { getRelicLevel } from '../relics';
import { getAncientEffect, getAncientRelicLevel } from '../ancientRelics';
import type { GameState, PermanentUpgrades, Ally } from '../types';
import type { RelicCollection } from '../relics';
import { BUILDING_DEFS } from '../constants';
import { getChallengeRewardMult } from '../challenges';
import { awardDungeonMedals } from './dungeon';
import { rollChestConsumable, getConsumableDef } from '../consumables';
import { applyShardUpgrades, applyRelicEffects, applyAncientRelicSpawnEffects, applyDungeonBoosts, applyBuildingBuffs } from './spawning';
import { grantEliteRewards } from './elites';
import { rollRegaliaDrop, getRandomSlot, MOB_RARITY_POOL, RARITY_COLORS, buildUnlockFilter } from '../regalias';
import { getPetDef } from '../pets';
import { modKillGoldMult, modPassiveIncomeMult, modVoidTouchedMult, modHealingWellsActive, modCorruptionActive, modMartyrdomActive, modMartyrdomRewardActive, modNoChestDrops } from './modifierEffects';

/** Process passive income tiers and hero HP regen */
export function processEconomy(ts: TickState): void {
  if (ts.inDungeon && ts.dungeonType !== 'timed') {
    // Wave dungeon: skip all income ticks, only process hero regen
    const { hero } = ts;
    const timeSinceDamage = ts.frame - (hero.lastDamageTime || 0);
    if (timeSinceDamage >= 300) {
      ts.regenTimer = ts.regenTimer + 1;
      if (ts.regenTimer >= 120 && hero.health < hero.maxHealth && hero.health > 0) {
        ts.regenTimer = 0;
        const regenAmount = Math.max(1, Math.floor(hero.maxHealth * 0.008 * modVoidTouchedMult(ts)));
        hero.health = Math.min(hero.maxHealth, hero.health + regenAmount);
        ts.particles.push(makeParticle(hero.x + 16, hero.y - 5, `+${regenAmount}`, '#4aff4a'));
      }
    }
    if (tickHasArtifact(ts, 'regeneration') && hero.health > 0 && hero.health < hero.maxHealth && ts.frame % 60 === 0) {
      const vitalityHeal = Math.max(1, Math.floor(hero.maxHealth * 0.02 * modVoidTouchedMult(ts)));
      hero.health = Math.min(hero.maxHealth, hero.health + vitalityHeal);
    }
    if (ts.blessingCooldown > 0) ts.blessingCooldown--;
    return;
  }
  // Rolling gold tracker: snapshot every second (60 frames)
  if (ts.frame % 60 === 0) {
    const history = ts.goldHistory || new Array(60).fill(0);
    const idx = (ts.goldHistoryIdx || 0) % 60;
    history[idx] = ts.goldEarned - (ts.goldLastSnapshot || ts.goldEarned);
    ts.goldHistory = history;
    ts.goldHistoryIdx = idx + 1;
    ts.goldLastSnapshot = ts.goldEarned;
  }

  const { runUpgrades, hero, relicCollection } = ts;
  const harvestActive = tickSkillBuffActive(ts, 'harvest');
  // Regalia: global gold bonus applies to income too
  const rGoldBonusIncome = getRegaliaBonus(ts, 'goldBonusPct');
  const harvestMult = (harvestActive ? 1.5 : 1) * (1 + rGoldBonusIncome / 100) * modPassiveIncomeMult(ts);

  // Harvest gold rain animation: scatter gold coins around hero while active
  if (harvestActive && ts.frame % 10 === 0) {
    const offsetX = (Math.random() - 0.5) * 120;
    ts.particles.push(makeParticle(hero.x + offsetX, GROUND_Y - 60 - Math.random() * 40, '🪙', '#ffd700'));
  }

  // Relic income speed/payout helpers (v2 IDs)
  const slimeBaitLv = getRelicLevel(relicCollection['slimeBait'] || 0);
  const biggerNetsLv = getRelicLevel(relicCollection['biggerNets'] || 0);
  const gaitersLv = getRelicLevel(relicCollection['gaiters'] || 0);
  const rucksackLv = getRelicLevel(relicCollection['rucksack'] || 0);
  const carriageLv = getRelicLevel(relicCollection['carriage'] || 0);
  const trunksLv = getRelicLevel(relicCollection['trunks'] || 0);
  const blacksmithHammerLv = getRelicLevel(relicCollection['blacksmithHammer'] || 0);
  const betterIronLv = getRelicLevel(relicCollection['betterIron'] || 0);
  const nailsLv = getRelicLevel(relicCollection['nails'] || 0);
  const reinforcedPlanksLv = getRelicLevel(relicCollection['reinforcedPlanks'] || 0);
  const quillsLv = getRelicLevel(relicCollection['quills'] || 0);
  const papyrusLv = getRelicLevel(relicCollection['papyrus'] || 0);
  const trainingDummyLv = getRelicLevel(relicCollection['trainingDummy'] || 0);
  const warHornLv = getRelicLevel(relicCollection['warHorn'] || 0);
  const warTableLv = getRelicLevel(relicCollection['warTable'] || 0);
  const diplomacyLv = getRelicLevel(relicCollection['diplomacy'] || 0);

  // Grand Design (Expansion 4pc): income upgrades 3% faster and 3% more payout
  const hasGrandDesign = tickHasSetBonus(ts, 'expansionSet', 4);
  const gdSpeedMult = hasGrandDesign ? 0.97 : 1;   // 3% faster timers
  const gdPayoutMult = hasGrandDesign ? 1.03 : 1;   // 3% more payout

  // Ancient Relic: Time Warp Crystal — income ticks faster (scales with level)
  const twcEff = ts.ancientRelicsOwned.includes('timeWarpCrystal')
    ? getAncientEffect('timeWarpCrystal', getAncientRelicLevel(ts.ancientRelicCopies['timeWarpCrystal'] || 1))
    : null;
  let timeWarpMult = twcEff ? 1 + (twcEff.tickSpeed || 0.03) : 1;
  // Reward: Tax Haven (No Retreat completion) — income tiers tick faster (L1=10%, L2=15%, L3=20%)
  const taxLv = ts.challengeCompletions.noRetreat || 0;
  if (taxLv > 0) timeWarpMult *= (1 + 0.10 * getChallengeRewardMult(taxLv));

  // Famine challenge: skip ALL passive income — gold from kills only
  if (ts.challengeId !== 'famine') {
  // Starting Income gem upgrade: +5 gold/sec per level
  const startingIncomeLevel = (ts.upgrades.startingIncome as number) || 0;
  if (startingIncomeLevel > 0 && ts.frame % 60 === 0) {
    const bonus = startingIncomeLevel * 5;
    ts.goldEarned += Math.floor(bonus * harvestMult);
  }

  // Regalia: passiveIncome — flat gold per second
  const rPassiveIncome = getRegaliaBonus(ts, 'passiveIncome');
  if (rPassiveIncome > 0 && ts.frame % 60 === 0) {
    ts.goldEarned += Math.floor(rPassiveIncome * harvestMult);
  }

  // Taxes relic (Adventurer's Kit): per building owned, generate 1% gold/min per level
  const taxesLv = getRelicLevel(relicCollection['taxes'] || 0);
  if (taxesLv > 0 && ts.frame % 60 === 0) {
    let buildingCount = 0;
    for (const f of ts.flags) if (f.captured && !f.corrupted && f.buildingType) buildingCount++;
    if (buildingCount > 0) {
      const taxGold = Math.max(1, Math.floor(passiveGoldPerMin(runUpgrades) * 0.01 * taxesLv * buildingCount));
      ts.goldEarned += Math.floor(taxGold * harvestMult / 60); // per-second slice of gold/min
    }
  }

  // Tier 1: Hunting Slimes (1s timer = 60 ticks)
  const passiveIncomeLevel = runUpgrades.passiveIncome || 0;
  if (passiveIncomeLevel > 0) {
    ts.incomeTimer = ts.incomeTimer + timeWarpMult;
    const t1Speed = Math.max(0.5, 1 - slimeBaitLv * 0.05) * gdSpeedMult;
    const cookedGooMult = tickHasArtifact(ts, 'cookedGoo') ? 0.9 : 1;
    const rSlimeSpd = getRegaliaBonus(ts, 'slimeSpeed');
    if (ts.incomeTimer >= Math.floor(60 * t1Speed * cookedGooMult * (rSlimeSpd > 0 ? Math.max(0.5, 1 - rSlimeSpd / 100) : 1))) {
      ts.incomeTimer = 0;
      const payout = Math.max(1, huntingSlimesIncome(passiveIncomeLevel));
      const rSlimeInc = getRegaliaBonus(ts, 'slimeIncome');
      ts.goldEarned += Math.floor(payout * (1 + biggerNetsLv * 0.05) * harvestMult * gdPayoutMult * (1 + rSlimeInc / 100) * zoneGoldMult(ts.currentZone));
      // Friendly Slimes artifact: 1% chance to spawn a friendly slime ally
      if (tickHasArtifact(ts, 'friendlySlimes') && Math.random() < 0.01) {
        const portalX = ts.flags[ts.portalFlagIndex]?.x || 80;
        ts.allies.push({
          id: uid(), slotIndex: -1, unitType: 'soldier' as const, x: hero.x - 20, y: GROUND_Y - 20,
          health: Math.floor(ts.hero.maxHealth * 0.3), maxHealth: Math.floor(ts.hero.maxHealth * 0.3),
          damage: 0, defense: 0, speed: 0.4, attackRate: 9999, attackRange: 0, frame: 0,
          attackCooldown: 9999, lane: Math.floor(Math.random() * 6) - 3, isFriendlySlime: true,
          slimeDir: Math.random() < 0.5 ? 1 : -1,
        });
        ts.particles.push(makeParticle(portalX + 20, GROUND_Y - 40, '🟢 Slime!', '#44ff44'));
      }
    }
  }

  // Slime pet milestone: earn 'slime' pet when Hunting Slimes reaches level 60
  if (passiveIncomeLevel >= 60 && !ts.ownedPets.includes('slime') && !(ts.upgrades as any).slimePetEarned) {
    const slimeDef = getPetDef('slime');
    if (slimeDef) {
      ts.onCollectPet('slime');
      ts.particles.push(makeParticle(hero.x, hero.y - 40, `${slimeDef.icon} PET EARNED: ${slimeDef.name}!`, '#44ff44'));
      ts.particles.push(makeParticle(hero.x, hero.y - 60, slimeDef.effectDescription, '#66ff66'));
    }
  }

  // Tier 2: Scouting the Forests (10s timer = 600 ticks)
  const passiveIncome2Level = runUpgrades.passiveIncome2 || 0;
  if (passiveIncome2Level > 0) {
    ts.incomeTimer2 = ts.incomeTimer2 + timeWarpMult;
    const t2Speed = Math.max(0.5, 1 - gaitersLv * 0.05) * gdSpeedMult;
    const rScoutSpd = getRegaliaBonus(ts, 'scoutingSpeed');
    if (ts.incomeTimer2 >= Math.floor(600 * t2Speed * (rScoutSpd > 0 ? Math.max(0.5, 1 - rScoutSpd / 100) : 1))) {
      ts.incomeTimer2 = 0;
      const payout = scoutingForestsPayout(passiveIncome2Level);
      const rScoutInc = getRegaliaBonus(ts, 'scoutingIncome');
      ts.goldEarned += Math.floor(payout * (1 + rucksackLv * 0.05) * harvestMult * gdPayoutMult * (1 + rScoutInc / 100) * zoneGoldMult(ts.currentZone));
      // Treasure artifact: 2% chance scouting proc drops a gold chest worth 5x payout
      if (tickHasArtifact(ts, 'treasure') && Math.random() < 0.02) {
        const treasureGold = Math.max(10, Math.floor(payout * 5));
        ts.chests.push({ id: uid(), x: hero.x + 30 + Math.random() * 40, y: GROUND_Y - 20, type: 'gold', value: treasureGold, age: 0 });
        ts.particles.push(makeParticle(hero.x + 50, GROUND_Y - 40, `Treasure! +${formatNumber(treasureGold)}g`, '#66ffcc'));
      }
    }
  }

  // Tier 3: Delivering Resources (1min timer = 3600 ticks)
  const passiveIncome3Level = runUpgrades.passiveIncome3 || 0;
  if (passiveIncome3Level > 0) {
    ts.incomeTimer3 = ts.incomeTimer3 + timeWarpMult;
    const t3Speed = Math.max(0.5, 1 - carriageLv * 0.05) * gdSpeedMult;
    const rDelivSpd = getRegaliaBonus(ts, 'deliverySpeed');
    if (ts.incomeTimer3 >= Math.floor(3600 * t3Speed * (rDelivSpd > 0 ? Math.max(0.5, 1 - rDelivSpd / 100) : 1))) {
      ts.incomeTimer3 = 0;
      const payout = deliveringResourcesPayout(passiveIncome3Level);
      const rDelivInc = getRegaliaBonus(ts, 'deliveryIncome');
      ts.goldEarned += Math.floor(payout * (1 + trunksLv * 0.05) * harvestMult * gdPayoutMult * (tickHasArtifact(ts, 'tips') ? 1.10 : 1) * (1 + rDelivInc / 100) * zoneGoldMult(ts.currentZone));

      // Courier artifact: 50% chance to spawn a courier (walks portal->structure, collects 5% gold/min)
      if (tickHasArtifact(ts, 'courier') && Math.random() < 0.50) {
        const portalX = ts.flags[ts.portalFlagIndex]?.x || 80;
        const farthestCaptured = ts.flags.filter(f => f.captured).sort((a2, b2) => b2.x - a2.x)[0];
        if (farthestCaptured) {
          const courierGold = Math.max(5, Math.floor(ts.goldEarned * 0.05 / 60)); // 5% gold/min distributed
          const courierHp = Math.max(20, Math.floor(hero.maxHealth * 0.15));
          ts.allies.push({
            id: uid(), slotIndex: -1, unitType: 'soldier' as const, x: portalX, y: GROUND_Y - 18,
            health: courierHp, maxHealth: courierHp, damage: 0, defense: 0, speed: 0.6, attackRate: 9999,
            attackRange: 0, frame: 0, attackCooldown: 9999, lane: 0,
            isCourier: true, courierGold,
          });
          ts.particles.push(makeParticle(portalX, GROUND_Y - 40, 'Courier!', '#ffcc44'));
        }
      }

      // Supplies relic (Haulers legendary): delivering proc heals all living units 5% max HP per level
      const suppliesLv = getRelicLevel(relicCollection['supplies'] || 0);
      if (suppliesLv > 0 && ts.challengeId !== 'cursedLands') {
        const healPct = suppliesLv * 0.05;
        for (const ally of ts.allies) {
          if (ally.health > 0 && ally.health < ally.maxHealth) {
            const heal = Math.max(1, Math.floor(ally.maxHealth * healPct));
            ally.health = Math.min(ally.maxHealth, ally.health + heal);
          }
        }
        // Also heal hero
        if (hero.health > 0 && hero.health < hero.maxHealth) {
          const heroHeal = Math.max(1, Math.floor(hero.maxHealth * healPct));
          hero.health = Math.min(hero.maxHealth, hero.health + heroHeal);
        }
        ts.particles.push(makeParticle(hero.x, GROUND_Y - 55, `SUPPLIES! +${Math.round(healPct * 100)}% HP`, '#44ff88'));
      }
    }
  }

  // Tier 4: Smithing The Swords (3min timer = 10800 ticks)
  const passiveIncome4Level = runUpgrades.passiveIncome4 || 0;
  if (passiveIncome4Level > 0) {
    ts.incomeTimer4 = ts.incomeTimer4 + timeWarpMult;
    const t4Speed = Math.max(0.5, 1 - blacksmithHammerLv * 0.05) * gdSpeedMult;
    const betterSmithiesMult = tickHasArtifact(ts, 'betterSmithies') ? 0.9 : 1;
    const rSmithSpd = getRegaliaBonus(ts, 'smithingSpeed');
    if (ts.incomeTimer4 >= Math.floor(10800 * t4Speed * betterSmithiesMult * (rSmithSpd > 0 ? Math.max(0.5, 1 - rSmithSpd / 100) : 1))) {
      ts.incomeTimer4 = 0;
      const payout = smithingSwordsPayout(passiveIncome4Level);
      const rSmithInc = getRegaliaBonus(ts, 'smithingIncome');
      ts.goldEarned += Math.floor(payout * (1 + betterIronLv * 0.05) * harvestMult * gdPayoutMult * (1 + rSmithInc / 100) * zoneGoldMult(ts.currentZone));
      // Better Weapons artifact: +0.5 dmg per proc to melee allies + warlord hero (cap 2/zone = 4 procs)
      if (tickHasArtifact(ts, 'betterWeapons') && ts.smithingBonusStacks < 4) {
        ts.smithingBonusStacks++;
        const totalBonus = ts.smithingBonusStacks * 0.5;
        // Apply to warlord hero (melee)
        if (ts.heroClass === 'warlord') {
          hero.damage = Math.floor(hero.damage + 0.5);
        }
        // Apply to melee allies
        for (const ally of ts.allies) {
          const isMelee = ally.unitType === 'soldier' || ally.unitType === 'knight' || ally.unitType === 'halberd';
          if (isMelee && ally.health > 0) {
            ally.damage = Math.floor(ally.damage + 0.5);
          }
        }
        ts.particles.push(makeParticle(hero.x, GROUND_Y - 50, `Smithing +${totalBonus} melee dmg`, '#aaaaff'));
      }
    }
  }

  // Tier 5: Reinforcing the Barricades (5min timer = 18000 ticks)
  const passiveIncome5Level = runUpgrades.passiveIncome5 || 0;
  if (passiveIncome5Level > 0) {
    ts.incomeTimer5 = ts.incomeTimer5 + timeWarpMult;
    const t5Speed = Math.max(0.5, 1 - nailsLv * 0.05) * gdSpeedMult;
    const rBarrSpd = getRegaliaBonus(ts, 'barricadeSpeed');
    if (ts.incomeTimer5 >= Math.floor(18000 * t5Speed * (rBarrSpd > 0 ? Math.max(0.5, 1 - rBarrSpd / 100) : 1))) {
      ts.incomeTimer5 = 0;
      const payout = reinforcingBarricadesPayout(passiveIncome5Level);
      const rBarrInc = getRegaliaBonus(ts, 'barricadeIncome');
      ts.goldEarned += Math.floor(payout * (1 + reinforcedPlanksLv * 0.05) * harvestMult * gdPayoutMult * (tickHasArtifact(ts, 'enhancedWood') ? 1.10 : 1) * (1 + rBarrInc / 100) * zoneGoldMult(ts.currentZone));
      // Hold The Line artifact: build watchtower 200px right of portal (max 1)
      const hasWatchtowerPlus = tickHasSetBonus(ts, 'defendersSet', 5);
      if (tickHasArtifact(ts, 'holdTheLine') && ts.barricades.length < 1) {
        const portalX = ts.flags[ts.portalFlagIndex]?.x || 80;
        let barricadeHp = Math.floor(hero.maxHealth * 6);
        let barricadeDef = 3;
        // Watchtower+ (Defenders 5pc): 2x barricade HP + 20% DR (+2 defense as proxy)
        if (hasWatchtowerPlus) {
          barricadeHp *= 2;
          barricadeDef += 2;
        }
        ts.barricades.push({ id: uid(), x: portalX + 150, y: GROUND_Y - 30, health: barricadeHp, maxHealth: barricadeHp, defense: barricadeDef });
        ts.particles.push(makeParticle(portalX + 150, GROUND_Y - 50, hasWatchtowerPlus ? 'Watchtower+!' : 'Watchtower!', '#8B6914'));
      }
      // Watchtower+ without Hold The Line: spawn a basic watchtower
      if (hasWatchtowerPlus && !tickHasArtifact(ts, 'holdTheLine') && ts.barricades.length < 1) {
        const portalX = ts.flags[ts.portalFlagIndex]?.x || 80;
        const wtHp = Math.floor(hero.maxHealth * 3);
        ts.barricades.push({ id: uid(), x: portalX + 150, y: GROUND_Y - 30, health: wtHp, maxHealth: wtHp, defense: 2 });
        ts.particles.push(makeParticle(portalX + 150, GROUND_Y - 50, 'Watchtower+!', '#8B6914'));
      }
    }
  }

  // Tier 6: Enchanting The Scrolls (10min timer = 36000 ticks)
  const passiveIncome6Level = runUpgrades.passiveIncome6 || 0;
  if (passiveIncome6Level > 0) {
    ts.incomeTimer6 = ts.incomeTimer6 + timeWarpMult;
    const t6Speed = Math.max(0.5, 1 - quillsLv * 0.05) * gdSpeedMult;
    const featheredPensMult = tickHasArtifact(ts, 'featheredPens') ? 0.9 : 1;
    const rEnchSpd = getRegaliaBonus(ts, 'enchantingSpeed');
    if (ts.incomeTimer6 >= Math.floor(36000 * t6Speed * featheredPensMult * (rEnchSpd > 0 ? Math.max(0.5, 1 - rEnchSpd / 100) : 1))) {
      ts.incomeTimer6 = 0;
      const payout = enchantingScrollsPayout(passiveIncome6Level);
      const rEnchInc = getRegaliaBonus(ts, 'enchantingIncome');
      ts.goldEarned += Math.floor(payout * (1 + papyrusLv * 0.05) * harvestMult * gdPayoutMult * (1 + rEnchInc / 100) * zoneGoldMult(ts.currentZone));
      // Empowered Glyphs artifact: mages get +8% dmg for 3 minutes (10800 ticks)
      if (tickHasArtifact(ts, 'empoweredGlyphs')) {
        for (const ally of ts.allies) {
          if (ally.unitType === 'wizard' && ally.health > 0) {
            ally.empoweredGlyphsTimer = 10800;
          }
        }
        ts.particles.push(makeParticle(hero.x, GROUND_Y - 50, '✨ Glyphs Empowered!', '#aa66ff'));
      }
      // Extra Scrolls synergy: enchanting proc also produces a reroll voucher
      if (tickHasSynergy(ts, 'econPair6')) {
        ts.onCollectConsumable('rerollVoucher');
        ts.particles.push(makeParticle(hero.x + 30, GROUND_Y - 40, '📜 Reroll Voucher!', '#44aaff'));
      }
    }
  }

  // Tier 7: Training Militia (20min timer = 72000 ticks)
  const passiveIncome7Level = runUpgrades.passiveIncome7 || 0;
  if (passiveIncome7Level > 0) {
    ts.incomeTimer7 = ts.incomeTimer7 + timeWarpMult;
    const t7Speed = Math.max(0.5, 1 - trainingDummyLv * 0.05) * gdSpeedMult;
    const drillSergeantMult = tickHasArtifact(ts, 'drillSergeant') ? 0.9 : 1;
    const rMilitSpd = getRegaliaBonus(ts, 'militiaSpeed');
    if (ts.incomeTimer7 >= Math.floor(72000 * t7Speed * drillSergeantMult * (rMilitSpd > 0 ? Math.max(0.5, 1 - rMilitSpd / 100) : 1))) {
      ts.incomeTimer7 = 0;
      const payout = trainingMilitiaPayout(passiveIncome7Level);
      const rMilitInc = getRegaliaBonus(ts, 'militiaIncome');
      ts.goldEarned += Math.floor(payout * (1 + warHornLv * 0.05) * harvestMult * gdPayoutMult * (1 + rMilitInc / 100) * zoneGoldMult(ts.currentZone));
      // War Banner artifact: spawn 5 soldiers + 3 halberds + 1 knight (with full stat scaling)
      if (tickHasArtifact(ts, 'warBanner')) {
        const portalX = ts.flags[ts.portalFlagIndex]?.x || 80;
        const spawnMilitia = (unitType: string, count: number) => {
          const stats = (UNIT_STATS as any)[unitType] || UNIT_STATS.soldier;
          const buffLevel = ts.runUpgrades[unitType] || 0;
          for (let i = 0; i < count; i++) {
            let allyDamage = Math.floor(stats.damage * unitDmgMult(buffLevel));
            let allySpeed = stats.speed;
            let allyDef = 0;
            if (unitType === 'soldier') allyDef = Math.floor(buffLevel / 4);
            if (unitType === 'knight') allyDef = 2 + Math.floor(buffLevel / 2);
            if (unitType === 'halberd') allyDef = 1 + Math.floor(buffLevel / 3);
            if (tickHasArtifact(ts, 'swiftArmy')) allySpeed += 0.1;
            if (tickHasArtifact(ts, 'endurance') && isUnitMelee(unitType)) allyDef += 1;
            if (tickHasArtifact(ts, 'trainingManual') && isUnitMelee(unitType)) allyDamage += 2;
            let allyHealth = Math.floor(stats.health * unitHpMult(buffLevel));
            const allyAtkRate = stats.attackRate || 60;
            if (unitType === 'soldier' && tickHasArtifact(ts, 'reinforced')) allyHealth = Math.floor(allyHealth * 1.2);
            const newAlly: Ally = {
              id: uid(), slotIndex: -1, unitType: unitType as any,
              x: portalX + 10 + Math.random() * 30, y: GROUND_Y - 20,
              health: allyHealth, maxHealth: allyHealth, damage: allyDamage,
              defense: allyDef, speed: allySpeed, attackRate: allyAtkRate,
              attackRange: stats.attackRange, frame: 0, attackCooldown: allyAtkRate,
              lane: Math.floor(Math.random() * 8) - 4,
            };
            applyShardUpgrades(newAlly, ts.shardUpgrades);
            applyRelicEffects(newAlly, ts);
            applyAncientRelicSpawnEffects(newAlly, ts);
            applyDungeonBoosts(newAlly, ts);
            applyBuildingBuffs(newAlly, ts);
            if (ts.challengeId === 'glassCannon') {
              newAlly.maxHealth = Math.floor(newAlly.maxHealth / 3);
              newAlly.health = newAlly.maxHealth;
              newAlly.damage *= 3;
            }
            const cc = ts.challengeCompletions;
            if (cc.colosseum && isUnitMelee(newAlly.unitType)) {
              newAlly.maxHealth = Math.floor(newAlly.maxHealth * 1.15);
              newAlly.health = newAlly.maxHealth;
            }
            if (cc.glassCannon) newAlly.damage = Math.floor(newAlly.damage * 1.10);
            if (cc.hordeMode) newAlly.attackRate = Math.max(15, Math.floor(newAlly.attackRate * 0.90));
            if (ts.smithingBonusStacks > 0 && isUnitMelee(unitType)) {
              newAlly.damage = Math.floor(newAlly.damage + ts.smithingBonusStacks * 0.5);
            }
            ts.allies.push(newAlly);
          }
        };
        spawnMilitia('soldier', 5);
        spawnMilitia('halberd', 3);
        spawnMilitia('knight', 1);
        ts.particles.push(makeParticle(portalX + 20, GROUND_Y - 50, '🚩 WAR BANNER! +9 units!', '#ff4444'));
      }
    }
  }

  // Tier 8: Expanding Territories (30min timer = 108000 ticks)
  const passiveIncome8Level = runUpgrades.passiveIncome8 || 0;
  if (passiveIncome8Level > 0) {
    ts.incomeTimer8 = ts.incomeTimer8 + timeWarpMult;
    const t8Speed = Math.max(0.5, 1 - warTableLv * 0.05) * gdSpeedMult;
    const rTerrSpd = getRegaliaBonus(ts, 'territorySpeed');
    if (ts.incomeTimer8 >= Math.floor(108000 * t8Speed * (rTerrSpd > 0 ? Math.max(0.5, 1 - rTerrSpd / 100) : 1))) {
      ts.incomeTimer8 = 0;
      const payout = expandingTerritoriesPayout(passiveIncome8Level);
      const rTerrInc = getRegaliaBonus(ts, 'territoryIncome');
      ts.goldEarned += Math.floor(payout * (1 + diplomacyLv * 0.05) * harvestMult * gdPayoutMult * (1 + rTerrInc / 100) * zoneGoldMult(ts.currentZone));
      // Decree artifact: next unit death respawns instantly
      if (tickHasArtifact(ts, 'decree')) {
        ts.decreeActive = true;
        ts.particles.push(makeParticle(hero.x, GROUND_Y - 50, '📜 Decree Active!', '#ffd700'));
      }
    }
  }
  } // end Famine income skip

  // Hero HP regen (0.8% per 2 sec, 5s delay after damage)
  // Cursed Lands: no healing (regen, vitality, titan's heart all disabled)
  if (ts.challengeId !== 'cursedLands') {
  const timeSinceDamage = ts.frame - (hero.lastDamageTime || 0);
  if (timeSinceDamage >= 300) {
    ts.regenTimer = ts.regenTimer + 1;
    if (ts.regenTimer >= 120 && hero.health < hero.maxHealth && hero.health > 0) {
      ts.regenTimer = 0;
      const regenAmount = Math.max(1, Math.floor(hero.maxHealth * 0.008 * modVoidTouchedMult(ts)));
      hero.health = Math.min(hero.maxHealth, hero.health + regenAmount);
      ts.particles.push(makeParticle(hero.x + 16, hero.y - 5, `+${regenAmount}`, '#4aff4a'));
    }
  }

  // Regeneration artifact: hero regens 2% HP/sec always (bypasses damage delay, applied once per second)
  if (tickHasArtifact(ts, 'regeneration') && hero.health > 0 && hero.health < hero.maxHealth && ts.frame % 60 === 0) {
    const vitalityHeal = Math.max(1, Math.floor(hero.maxHealth * 0.02 * modVoidTouchedMult(ts)));
    hero.health = Math.min(hero.maxHealth, hero.health + vitalityHeal);
  }

  // Ancient Relic: Titan's Heart — HP regen/sec scales with level
  if (ts.ancientRelicsOwned.includes('titansHeart') && hero.health > 0 && hero.health < hero.maxHealth && ts.frame % 60 === 0) {
    const titanEff = getAncientEffect('titansHeart', getAncientRelicLevel(ts.ancientRelicCopies['titansHeart'] || 1));
    const titanHeal = Math.max(1, Math.floor(hero.maxHealth * (titanEff.regenPct || 0.003) * modVoidTouchedMult(ts)));
    hero.health = Math.min(hero.maxHealth, hero.health + titanHeal);
  }
  } // end Cursed Lands heal skip

  // Fractured World: Healing Wells — all units regen 1% HP/sec
  if (modHealingWellsActive(ts) && ts.frame % 60 === 0) {
    if (hero.health > 0 && hero.health < hero.maxHealth) {
      const wellHeal = Math.max(1, Math.floor(hero.maxHealth * 0.01));
      hero.health = Math.min(hero.maxHealth, hero.health + wellHeal);
    }
    for (const a of ts.allies) {
      if (a.health > 0 && a.health < a.maxHealth) {
        const wellHeal = Math.max(1, Math.floor(a.maxHealth * 0.01));
        a.health = Math.min(a.maxHealth, a.health + wellHeal);
      }
    }
  }

  // Fractured World: Corruption — allies lose 0.5% max HP/sec
  if (modCorruptionActive(ts) && ts.frame % 60 === 0) {
    for (const a of ts.allies) {
      if (a.health > 0 && !a.isPet) {
        a.health -= Math.max(1, Math.floor(a.maxHealth * 0.005));
        if (a.health < 1) a.health = 1; // Don't kill, just bring to 1
      }
    }
  }

  // Blessing cooldown tick
  if (ts.blessingCooldown > 0) ts.blessingCooldown--;

  // Momentum timer tick-down
  const hero2 = ts.hero;
  if ((hero2.momentumTimer || 0) > 0) {
    hero2.momentumTimer!--;
    if (hero2.momentumTimer! <= 0) { hero2.momentumStacks = 0; }
  }
}

/**
 * Fast-forward income timers when the tab was hidden (alt-tabbed).
 * Only advances income — no combat, movement, or spawning.
 * Returns a new GameState with updated timers and gold.
 */
export function fastForwardIncome(
  game: GameState,
  elapsedTicks: number,
  upgrades: PermanentUpgrades,
  relicCollection: RelicCollection,
  ancientRelicsOwned: string[],
  ancientRelicCopies: Record<string, number> = {},
): GameState {
  if (elapsedTicks <= 0 || game.gameOver || game.inDungeon) return game;

  // Cap at 30 minutes to prevent extreme catch-up
  const cappedTicks = Math.min(elapsedTicks, 108000);

  // timeWarpMult (same as processEconomy) — scales with ancient relic level
  const twcFfEff = ancientRelicsOwned.includes('timeWarpCrystal')
    ? getAncientEffect('timeWarpCrystal', getAncientRelicLevel(ancientRelicCopies['timeWarpCrystal'] || 1))
    : null;
  let timeWarpMult = twcFfEff ? 1 + (twcFfEff.tickSpeed || 0.03) : 1;

  const effectiveTicks = cappedTicks * timeWarpMult;
  let goldBonus = 0;

  // Relic speed/payout helpers (mirrors processEconomy, v2 IDs)
  const slimeBaitLv = getRelicLevel(relicCollection['slimeBait'] || 0);
  const biggerNetsLv = getRelicLevel(relicCollection['biggerNets'] || 0);
  const gaitersLv = getRelicLevel(relicCollection['gaiters'] || 0);
  const rucksackLv = getRelicLevel(relicCollection['rucksack'] || 0);
  const carriageLv = getRelicLevel(relicCollection['carriage'] || 0);
  const trunksLv = getRelicLevel(relicCollection['trunks'] || 0);
  const blacksmithHammerLv = getRelicLevel(relicCollection['blacksmithHammer'] || 0);
  const betterIronLv = getRelicLevel(relicCollection['betterIron'] || 0);
  const nailsLv = getRelicLevel(relicCollection['nails'] || 0);
  const reinforcedPlanksLv = getRelicLevel(relicCollection['reinforcedPlanks'] || 0);
  const quillsLv = getRelicLevel(relicCollection['quills'] || 0);
  const papyrusLv = getRelicLevel(relicCollection['papyrus'] || 0);
  const trainingDummyLv = getRelicLevel(relicCollection['trainingDummy'] || 0);
  const warHornLv = getRelicLevel(relicCollection['warHorn'] || 0);
  const warTableLv = getRelicLevel(relicCollection['warTable'] || 0);
  const diplomacyLv = getRelicLevel(relicCollection['diplomacy'] || 0);

  // Starting Income gem upgrade: +5 gold/sec per level
  const startingIncomeLevel = (upgrades.startingIncome as number) || 0;
  if (startingIncomeLevel > 0) {
    const cycles = Math.floor(cappedTicks / 60);
    goldBonus += cycles * startingIncomeLevel * 5;
  }

  // Helper: advance a timer, count payouts, return new timer value
  function advanceTier(currentTimer: number, threshold: number, payout: number): { newTimer: number; gold: number } {
    const newTimer = currentTimer + effectiveTicks;
    const cycles = Math.floor(newTimer / threshold);
    const remainder = newTimer - cycles * threshold;
    return { newTimer: remainder, gold: cycles > 0 ? cycles * payout : 0 };
  }

  // Clone timers
  let t1 = game.incomeTimer;
  let t2 = game.incomeTimer2;
  let t3 = game.incomeTimer3;
  let t4 = game.incomeTimer4;
  let t5 = game.incomeTimer5;
  let t6 = game.incomeTimer6;
  let t7 = game.incomeTimer7;
  let t8 = game.incomeTimer8;

  // Tier 1: Hunting Slimes
  const t1Level = game.runUpgrades.passiveIncome || 0;
  if (t1Level > 0) {
    const threshold = Math.floor(60 * Math.max(0.5, 1 - slimeBaitLv * 0.05));
    const payout = Math.floor(Math.max(1, huntingSlimesIncome(t1Level)) * (1 + biggerNetsLv * 0.05));
    const r = advanceTier(t1, threshold, payout);
    t1 = r.newTimer; goldBonus += r.gold;
  }

  // Tier 2: Scouting Forests
  const t2Level = game.runUpgrades.passiveIncome2 || 0;
  if (t2Level > 0) {
    const threshold = Math.floor(600 * Math.max(0.5, 1 - gaitersLv * 0.05));
    const payout = Math.floor(scoutingForestsPayout(t2Level) * (1 + rucksackLv * 0.05));
    const r = advanceTier(t2, threshold, payout);
    t2 = r.newTimer; goldBonus += r.gold;
  }

  // Tier 3: Delivering Resources
  const t3Level = game.runUpgrades.passiveIncome3 || 0;
  if (t3Level > 0) {
    const threshold = Math.floor(3600 * Math.max(0.5, 1 - carriageLv * 0.05));
    const payout = Math.floor(deliveringResourcesPayout(t3Level) * (1 + trunksLv * 0.05));
    const r = advanceTier(t3, threshold, payout);
    t3 = r.newTimer; goldBonus += r.gold;
  }

  // Tier 4: Smithing Swords
  const t4Level = game.runUpgrades.passiveIncome4 || 0;
  if (t4Level > 0) {
    const threshold = Math.floor(10800 * Math.max(0.5, 1 - blacksmithHammerLv * 0.05));
    const payout = Math.floor(smithingSwordsPayout(t4Level) * (1 + betterIronLv * 0.05));
    const r = advanceTier(t4, threshold, payout);
    t4 = r.newTimer; goldBonus += r.gold;
  }

  // Tier 5: Reinforcing Barricades
  const t5Level = game.runUpgrades.passiveIncome5 || 0;
  if (t5Level > 0) {
    const threshold = Math.floor(18000 * Math.max(0.5, 1 - nailsLv * 0.05));
    const payout = Math.floor(reinforcingBarricadesPayout(t5Level) * (1 + reinforcedPlanksLv * 0.05));
    const r = advanceTier(t5, threshold, payout);
    t5 = r.newTimer; goldBonus += r.gold;
  }

  // Tier 6: Enchanting Scrolls
  const t6Level = game.runUpgrades.passiveIncome6 || 0;
  if (t6Level > 0) {
    const threshold = Math.floor(36000 * Math.max(0.5, 1 - quillsLv * 0.05));
    const payout = Math.floor(enchantingScrollsPayout(t6Level) * (1 + papyrusLv * 0.05));
    const r = advanceTier(t6, threshold, payout);
    t6 = r.newTimer; goldBonus += r.gold;
  }

  // Tier 7: Training Militia
  const t7Level = game.runUpgrades.passiveIncome7 || 0;
  if (t7Level > 0) {
    const threshold = Math.floor(72000 * Math.max(0.5, 1 - trainingDummyLv * 0.05));
    const payout = Math.floor(trainingMilitiaPayout(t7Level) * (1 + warHornLv * 0.05));
    const r = advanceTier(t7, threshold, payout);
    t7 = r.newTimer; goldBonus += r.gold;
  }

  // Tier 8: Expanding Territories
  const t8Level = game.runUpgrades.passiveIncome8 || 0;
  if (t8Level > 0) {
    const threshold = Math.floor(108000 * Math.max(0.5, 1 - warTableLv * 0.05));
    const payout = Math.floor(expandingTerritoriesPayout(t8Level) * (1 + diplomacyLv * 0.05));
    const r = advanceTier(t8, threshold, payout);
    t8 = r.newTimer; goldBonus += r.gold;
  }

  // Fast-forward farm building timers
  const updatedFlags = game.flags.map(f => {
    if (!f.captured || !f.buildingType) return f;
    const def = BUILDING_DEFS[f.buildingType];
    if (!def || def.type !== 'income') return f;
    const timer = (f.buildingTimer || 0) + cappedTicks;
    const cycles = Math.floor(timer / 600);
    if (cycles > 0) {
      const farmPayout = Math.max(5, Math.floor(passiveGoldPerMin(game.runUpgrades) * 0.02));
      goldBonus += cycles * farmPayout;
    }
    return { ...f, buildingTimer: timer - cycles * 600 };
  });

  return {
    ...game,
    incomeTimer: t1,
    incomeTimer2: t2,
    incomeTimer3: t3,
    incomeTimer4: t4,
    incomeTimer5: t5,
    incomeTimer6: t6,
    incomeTimer7: t7,
    incomeTimer8: t8,
    flags: updatedFlags,
    goldEarned: game.goldEarned + goldBonus,
    totalGoldEarned: game.totalGoldEarned + goldBonus,
  };
}

/** Flag Haven relic: REMOVED in v2 — kept as no-op for compatibility */
export function processRelicFlagHaven(_ts: TickState): void {
  // flagHaven relic removed in relic v2
}

/** Martyrdom reward: enemy deaths detonate for 3% max HP to nearby enemies */
function applyMartyrdomRewardAoE(ts: TickState, x: number): void {
  if (!modMartyrdomRewardActive(ts)) return;
  const RADIUS = 60;
  const allEnemyArrays = [ts.enemies, ts.enemyArchers, ts.enemyWraiths, ts.enemyHounds, ts.enemyLichs,
    ts.enemyShadowAssassins, ts.enemyFlameCallers, ts.enemyCorruptedSentinels, ts.enemyDungeonRats, ts.enemyFireImps, ts.enemyCursedKnights];
  for (const arr of allEnemyArrays) {
    for (const e of arr) {
      if (Math.abs(e.x - x) < RADIUS && e.health > 0) {
        const dmg = Math.floor((e as any).maxHealth * 0.03);
        e.health -= dmg;
      }
    }
  }
  if (ts.boss && ts.boss.health > 0 && Math.abs(ts.boss.x - x) < RADIUS) {
    ts.boss.health -= Math.floor(ts.boss.maxHealth * 0.03);
  }
  ts.particles.push(makeParticle(x, GROUND_Y - 30, '💀', '#ff6644'));
}

/** Try to spawn a chest at a given position (drop rate soft-capped by active enemy count) */
export function trySpawnChest(ts: TickState, x: number, y: number): void {
  // Embargo challenge or modifier: no chests from kills
  if (ts.challengeId === 'embargo' || modNoChestDrops(ts)) return;
  // Soft cap: more active enemies = lower per-kill drop rate, keeps chests/min steady
  const activeEnemies = ts.enemies.length + ts.enemyArchers.length + ts.enemyWraiths.length + ts.enemyHounds.length + ts.enemyLichs.length;
  const luckyMult = 1;
  const rChestDrop = getRegaliaBonus(ts, 'chestDropChance');
  const dropRate = 0.005 / Math.max(1, activeEnemies * 0.08) * luckyMult * (1 + rChestDrop / 100);
  if (Math.random() >= dropRate) return;

  // 3% of chests become item chests (consumable)
  if (Math.random() < 0.03) {
    const consumableId = rollChestConsumable(ts.dungeonUnlocked);
    const cDef = getConsumableDef(consumableId);
    ts.chests.push({ id: uid(), x, y: GROUND_Y - 20, type: 'consumable', value: 0, age: 0, consumableId });
    ts.particles.push(makeParticle(x, y - 30, 'ITEM!', '#44ffaa'));
    return;
  }

  const roll = Math.random();
  let chestType: 'gold' | 'gem' | 'shard';
  let chestValue: number;

  if (roll < 0.68) {
    // 68% gold chest — 50% of passive income/min
    chestType = 'gold';
    chestValue = Math.max(10, Math.floor(passiveGoldPerMin(ts.runUpgrades) * 0.50));
  } else if (roll < 0.98) {
    // 30% gem chest — 1 base + 1 per zone
    chestType = 'gem';
    chestValue = 1 + (ts.currentZone || 0);
  } else {
    // 2% shard chest (rare treat, always 1 shard)
    chestType = 'shard';
    chestValue = 1;
  }

  ts.chests.push({ id: uid(), x, y: GROUND_Y - 20, type: chestType, value: chestValue, age: 0 });
  const chestEmoji = chestType === 'shard' ? 'SHARD CHEST!' : 'CHEST!';
  ts.particles.push(makeParticle(x, y - 30, chestEmoji, chestType === 'shard' ? '#ff44ff' : '#ffaa00'));

  // 0.3% chance for a regalia drop on top of normal chest
  if (Math.random() < 0.003) {
    const regalia = rollRegaliaDrop(getRandomSlot(), ts.currentZone + 1, MOB_RARITY_POOL, buildUnlockFilter(ts.upgrades));
    ts.chests.push({ id: uid(), x: x + 15, y: GROUND_Y - 20, type: 'regalia', value: 0, age: 0, regaliaData: regalia });
    ts.particles.push(makeParticle(x, y - 50, `👑 REGALIA DROP!`, RARITY_COLORS[regalia.rarity]));
  }
}

/** Remove dead enemies and award gold */
export function processDeathRewards(ts: TickState): void {
  const gdLevel = ts.runUpgrades?.goldBonus || 0;
  const gdMult = goldDropMult(gdLevel);
  const zkMult = zoneKillGoldMult(ts.currentZone) * modKillGoldMult(ts);
  // Challenge: Horde Mode / Embargo — no gold from kills
  const noKillGold = ts.challengeId === 'hordeMode' || ts.challengeId === 'embargo';
  // Reward: Scavenger's Bounty (Famine completion) — kill gold bonus (L1=25%, L2=37.5%, L3=50%)
  const scavLv = ts.challengeCompletions.famine || 0;
  const scavengerBountyMult = scavLv > 0 ? (1 + 0.25 * getChallengeRewardMult(scavLv)) : 1;
  const warChestMult = 1 * scavengerBountyMult * (noKillGold ? 0 : 1);
  const harvestMult = tickSkillBuffActive(ts, 'harvest') ? 1.5 : 1;
  // Regalia: kill gold % + global gold %
  const rKillGoldPct = getRegaliaBonus(ts, 'killGoldPct');
  const rGoldBonusPct = getRegaliaBonus(ts, 'goldBonusPct');
  const regaliaKillMult = (1 + rKillGoldPct / 100) * (1 + rGoldBonusPct / 100);
  const midasEff = ts.ancientRelicsOwned.includes('midasTouch')
    ? getAncientEffect('midasTouch', getAncientRelicLevel(ts.ancientRelicCopies['midasTouch'] || 1))
    : null;
  const midasMult = midasEff ? 1 + (midasEff.goldBonus || 0.03) : 1;

  // Larger Bags relic: +10% gold on kill per level
  const largerBagsLv = getRelicLevel(ts.relicCollection['largerBags'] || 0);
  const largerBagsMult = (1 + largerBagsLv * 0.10) * regaliaKillMult;

  const scavengerMult = tickHasSkill(ts, 'scavenger') ? 1.5 : 1;

  const inDungeon = ts.inDungeon && ts.dungeonType === 'wave';

  // Ancient Relic: Necromancer's Grimoire — chance scales with level
  const hasGrimoire = ts.ancientRelicsOwned.includes('necromancersGrimoire');
  const grimoireEff = hasGrimoire
    ? getAncientEffect('necromancersGrimoire', getAncientRelicLevel(ts.ancientRelicCopies['necromancersGrimoire'] || 1))
    : null;

  // Slime Expertise (Slime Hunters 5pc): hero kills have 5% chance to spawn a slime
  const hasSlimeExpertise = tickHasSetBonus(ts, 'slimeHunters', 5);
  // Spoils (Scouting relic): kills near an archer have 1% chance to drop gold chest
  const spoilsLv = getRelicLevel(ts.relicCollection['spoils'] || 0);

  const deadSkeletonOwnerIds: number[] = [];
  ts.enemies = ts.enemies.filter(e => {
    if (e.health <= 0) {
      if (e.isLichSkeleton && e.lichOwnerId) deadSkeletonOwnerIds.push(e.lichOwnerId);
      if (!e.isLichSkeleton && hasGrimoire && Math.random() < (grimoireEff?.chance || 0.02)) {
        const skelHp = Math.floor(e.maxHealth * 0.3);
        ts.allies.push({
          id: uid(), x: e.x, y: GROUND_Y - ENEMY_SIZE,
          health: skelHp, maxHealth: skelHp, damage: Math.floor(e.damage * 0.3),
          defense: 0, speed: 0.3, attackRate: 30, attackRange: 40,
          frame: ts.frame, attackCooldown: 0, unitType: 'skeleton',
          lane: Math.floor(Math.random() * 10) - 5, slotIndex: -1,
        });
        ts.particles.push(makeParticle(e.x, e.y - 20, '\u{1F4D6} RISEN!', '#44ff88'));
      }
      if (e.isElite) {
        ts.eliteKills++;
        if (!(inDungeon && ts.dungeonType === 'wave')) grantEliteRewards(ts, 2, e.x, e.y);
      }
      if (inDungeon) {
        awardDungeonMedals(ts, 'goblin');
        ts.enemiesKilled++;
      } else {
        const eliteMult = 1;
        let gold = Math.floor((e.isLichSkeleton ? 1 : 2) * zkMult * gdMult * warChestMult * harvestMult * midasMult * eliteMult);
        if (e.lastHitByHero) gold = Math.floor(gold * scavengerMult);
        gold = Math.floor(gold * largerBagsMult);
        ts.goldEarned += gold;
        ts.killGoldEarned += gold;
        ts.enemiesKilled++;
        ts.particles.push(makeParticle(e.x + 20, e.y - 12, `+${formatNumber(gold)}g`, e.isElite ? '#ff4444' : '#ffd700'));
        if (!e.isLichSkeleton) trySpawnChest(ts, e.x, e.y);
        applyMartyrdomRewardAoE(ts, e.x);
        // Riches: hero kills have increased chance to drop consumable chest
        if (tickHasArtifact(ts, 'riches') && e.lastHitByHero && Math.random() < 0.05) {
          ts.chests.push({ id: uid(), x: e.x + 10, y: GROUND_Y - 20, type: 'consumable', value: 0, age: 0, consumableId: 'healingPotion' as any });
          ts.particles.push(makeParticle(e.x, GROUND_Y - 40, 'RICHES!', '#44ffaa'));
        }
        // Momentum synergy: hero kill grants speed + atk speed for 5s
        if (tickHasSynergy(ts, 'heroPair2') && e.lastHitByHero) {
          const stacks = Math.min(8, (ts.hero.momentumStacks || 0) + 1);
          ts.hero.momentumStacks = stacks;
          ts.hero.momentumTimer = 300;
        }
        // Slime Expertise: hero kill 5% chance to spawn a friendly slime
        if (hasSlimeExpertise && e.lastHitByHero && Math.random() < 0.05) {
          ts.allies.push({
            id: uid(), x: e.x, y: GROUND_Y - 12, unitType: 'friendlySlime', slotIndex: -1,
            health: 30, maxHealth: 30, damage: 0, defense: 0, speed: 0.4, attackRate: 999,
            attackRange: 0, frame: ts.frame, attackCooldown: 0, lane: 0, isFriendlySlime: true,
          });
          ts.particles.push(makeParticle(e.x, e.y - 20, '🟢 SLIME!', '#44ff44'));
        }
        // Spoils: kill near an archer 1% chance to drop gold chest
        if (spoilsLv > 0 && ts.allies.some(a => a.unitType === 'archer' && a.health > 0 && Math.abs(a.x - e.x) < 220) && Math.random() < 0.01) {
          ts.chests.push({ id: uid(), x: e.x, y: GROUND_Y - 15, type: 'gold', value: Math.max(10, Math.floor(passiveGoldPerMin(ts.runUpgrades) * 0.50)), age: 0 });
          ts.particles.push(makeParticle(e.x, e.y - 25, '💰 SPOILS!', '#ffd700'));
        }
      }
      return false;
    }
    return true;
  });

  ts.enemyArchers = ts.enemyArchers.filter(a => {
    if (a.health <= 0) {
      if (a.isElite) {
        ts.eliteKills++;
        if (!(inDungeon && ts.dungeonType === 'wave')) grantEliteRewards(ts, 5, a.x, a.y);
      }
      if (inDungeon) {
        awardDungeonMedals(ts, 'archer');
        ts.enemiesKilled++;
        ts.particles.push(makeParticle(a.x + 20, a.y - 12, `+M`, '#ffd700'));
      } else {
        const eliteMult = 1;
        let gold = Math.floor(5 * zkMult * gdMult * warChestMult * harvestMult * midasMult * eliteMult);
        if (a.lastHitByHero) gold = Math.floor(gold * scavengerMult);
        gold = Math.floor(gold * largerBagsMult);
        ts.goldEarned += gold;
        ts.killGoldEarned += gold;
        ts.enemiesKilled++;
        ts.particles.push(makeParticle(a.x + 20, a.y - 12, `+${formatNumber(gold)}g`, a.isElite ? '#ff4444' : '#ffd700'));
        trySpawnChest(ts, a.x, a.y);
        applyMartyrdomRewardAoE(ts, a.x);
        // Riches: hero kills have increased chance to drop consumable chest
        if (tickHasArtifact(ts, 'riches') && a.lastHitByHero && Math.random() < 0.05) {
          ts.chests.push({ id: uid(), x: a.x + 10, y: GROUND_Y - 20, type: 'consumable', value: 0, age: 0, consumableId: 'healingPotion' as any });
          ts.particles.push(makeParticle(a.x, GROUND_Y - 40, 'RICHES!', '#44ffaa'));
        }
        // Momentum synergy: hero kill grants speed + atk speed for 5s
        if (tickHasSynergy(ts, 'heroPair2') && a.lastHitByHero) {
          const stacks = Math.min(8, (ts.hero.momentumStacks || 0) + 1);
          ts.hero.momentumStacks = stacks;
          ts.hero.momentumTimer = 300;
        }
      }
      return false;
    }
    return true;
  });

  ts.enemyWraiths = ts.enemyWraiths.filter(w => {
    if (w.health <= 0) {
      if (w.isElite) {
        ts.eliteKills++;
        if (!(inDungeon && ts.dungeonType === 'wave')) grantEliteRewards(ts, 8, w.x, w.y);
      }
      if (inDungeon) {
        awardDungeonMedals(ts, 'wraith');
        ts.enemiesKilled++;
        ts.particles.push(makeParticle(w.x + 20, w.y - 12, `+M`, '#ffd700'));
      } else {
        const eliteMult = 1;
        let gold = Math.floor(8 * zkMult * gdMult * warChestMult * harvestMult * midasMult * eliteMult);
        if (w.lastHitByHero) gold = Math.floor(gold * scavengerMult);
        gold = Math.floor(gold * largerBagsMult);
        ts.goldEarned += gold;
        ts.killGoldEarned += gold;
        ts.enemiesKilled++;
        ts.particles.push(makeParticle(w.x + 20, w.y - 12, `+${formatNumber(gold)}g`, w.isElite ? '#ff4444' : '#ffd700'));
        trySpawnChest(ts, w.x, w.y);
        applyMartyrdomRewardAoE(ts, w.x);
        // Riches: hero kills have increased chance to drop consumable chest
        if (tickHasArtifact(ts, 'riches') && w.lastHitByHero && Math.random() < 0.05) {
          ts.chests.push({ id: uid(), x: w.x + 10, y: GROUND_Y - 20, type: 'consumable', value: 0, age: 0, consumableId: 'healingPotion' as any });
          ts.particles.push(makeParticle(w.x, GROUND_Y - 40, 'RICHES!', '#44ffaa'));
        }
        // Momentum synergy: hero kill grants speed + atk speed for 5s
        if (tickHasSynergy(ts, 'heroPair2') && w.lastHitByHero) {
          const stacks = Math.min(8, (ts.hero.momentumStacks || 0) + 1);
          ts.hero.momentumStacks = stacks;
          ts.hero.momentumTimer = 300;
        }
      }
      return false;
    }
    return true;
  });

  ts.enemyHounds = ts.enemyHounds.filter(hd => {
    if (hd.health <= 0) {
      if (hd.isElite) {
        ts.eliteKills++;
        if (!(inDungeon && ts.dungeonType === 'wave')) grantEliteRewards(ts, 4, hd.x, hd.y);
      }
      if (inDungeon) {
        awardDungeonMedals(ts, 'hound');
        ts.enemiesKilled++;
        ts.particles.push(makeParticle(hd.x + 20, hd.y - 12, `+M`, '#ffd700'));
      } else {
        const eliteMult = 1;
        let gold = Math.floor(4 * zkMult * gdMult * warChestMult * harvestMult * midasMult * eliteMult);
        if (hd.lastHitByHero) gold = Math.floor(gold * scavengerMult);
        gold = Math.floor(gold * largerBagsMult);
        ts.goldEarned += gold;
        ts.killGoldEarned += gold;
        ts.enemiesKilled++;
        ts.particles.push(makeParticle(hd.x + 20, hd.y - 12, `+${formatNumber(gold)}g`, hd.isElite ? '#ff4444' : '#ffd700'));
        trySpawnChest(ts, hd.x, hd.y);
        applyMartyrdomRewardAoE(ts, hd.x);
        // Riches: hero kills have increased chance to drop consumable chest
        if (tickHasArtifact(ts, 'riches') && hd.lastHitByHero && Math.random() < 0.05) {
          ts.chests.push({ id: uid(), x: hd.x + 10, y: GROUND_Y - 20, type: 'consumable', value: 0, age: 0, consumableId: 'healingPotion' as any });
          ts.particles.push(makeParticle(hd.x, GROUND_Y - 40, 'RICHES!', '#44ffaa'));
        }
        // Momentum synergy: hero kill grants speed + atk speed for 5s
        if (tickHasSynergy(ts, 'heroPair2') && hd.lastHitByHero) {
          const stacks = Math.min(8, (ts.hero.momentumStacks || 0) + 1);
          ts.hero.momentumStacks = stacks;
          ts.hero.momentumTimer = 300;
        }
      }
      return false;
    }
    return true;
  });

  ts.enemyLichs = ts.enemyLichs.filter(l => {
    if (l.health <= 0) {
      if (l.isElite) {
        ts.eliteKills++;
        if (!(inDungeon && ts.dungeonType === 'wave')) grantEliteRewards(ts, 6, l.x, l.y);
      }
      if (inDungeon) {
        awardDungeonMedals(ts, 'lich');
        ts.enemiesKilled++;
        ts.particles.push(makeParticle(l.x + 20, l.y - 12, `+M`, '#ffd700'));
      } else {
        const eliteMult = 1;
        let gold = Math.floor(6 * zkMult * gdMult * warChestMult * harvestMult * midasMult * eliteMult);
        if (l.lastHitByHero) gold = Math.floor(gold * scavengerMult);
        gold = Math.floor(gold * largerBagsMult);
        ts.goldEarned += gold;
        ts.killGoldEarned += gold;
        ts.enemiesKilled++;
        ts.particles.push(makeParticle(l.x + 20, l.y - 12, `+${formatNumber(gold)}g`, l.isElite ? '#ff4444' : '#ffd700'));
        trySpawnChest(ts, l.x, l.y);
        applyMartyrdomRewardAoE(ts, l.x);
        // Riches: hero kills have increased chance to drop consumable chest
        if (tickHasArtifact(ts, 'riches') && l.lastHitByHero && Math.random() < 0.05) {
          ts.chests.push({ id: uid(), x: l.x + 10, y: GROUND_Y - 20, type: 'consumable', value: 0, age: 0, consumableId: 'healingPotion' as any });
          ts.particles.push(makeParticle(l.x, GROUND_Y - 40, 'RICHES!', '#44ffaa'));
        }
        // Momentum synergy: hero kill grants speed + atk speed for 5s
        if (tickHasSynergy(ts, 'heroPair2') && l.lastHitByHero) {
          const stacks = Math.min(8, (ts.hero.momentumStacks || 0) + 1);
          ts.hero.momentumStacks = stacks;
          ts.hero.momentumTimer = 300;
        }
        // Orphan skeletons — they persist but no longer count toward any cap
        ts.enemies.forEach(e => { if (e.isLichSkeleton && e.lichOwnerId === l.id) e.lichOwnerId = undefined; });
      }
      return false;
    }
    return true;
  });

  // Shadow Assassin deaths
  ts.enemyShadowAssassins = ts.enemyShadowAssassins.filter(sa => {
    if (sa.health <= 0) {
      if (sa.isElite) {
        ts.eliteKills++;
        if (!(inDungeon && ts.dungeonType === 'wave')) grantEliteRewards(ts, 12, sa.x, sa.y);
      }
      if (inDungeon) {
        awardDungeonMedals(ts, 'shadowAssassin');
        ts.enemiesKilled++;
        ts.particles.push(makeParticle(sa.x + 20, sa.y - 12, `+M`, '#ffd700'));
      } else {
        const eliteMult = 1;
        let gold = Math.floor(12 * zkMult * gdMult * warChestMult * harvestMult * midasMult * eliteMult);
        if (sa.lastHitByHero) gold = Math.floor(gold * scavengerMult);
        gold = Math.floor(gold * largerBagsMult);
        ts.goldEarned += gold;
        ts.killGoldEarned += gold;
        ts.enemiesKilled++;
        ts.particles.push(makeParticle(sa.x + 20, sa.y - 12, `+${formatNumber(gold)}g`, sa.isElite ? '#ff4444' : '#ffd700'));
        trySpawnChest(ts, sa.x, sa.y);
        applyMartyrdomRewardAoE(ts, sa.x);
        // Riches: hero kills have increased chance to drop consumable chest
        if (tickHasArtifact(ts, 'riches') && sa.lastHitByHero && Math.random() < 0.05) {
          ts.chests.push({ id: uid(), x: sa.x + 10, y: GROUND_Y - 20, type: 'consumable', value: 0, age: 0, consumableId: 'healingPotion' as any });
          ts.particles.push(makeParticle(sa.x, GROUND_Y - 40, 'RICHES!', '#44ffaa'));
        }
        // Momentum synergy: hero kill grants speed + atk speed for 5s
        if (tickHasSynergy(ts, 'heroPair2') && sa.lastHitByHero) {
          const stacks = Math.min(8, (ts.hero.momentumStacks || 0) + 1);
          ts.hero.momentumStacks = stacks;
          ts.hero.momentumTimer = 300;
        }
      }
      return false;
    }
    return true;
  });

  // Flame Caller deaths
  ts.enemyFlameCallers = ts.enemyFlameCallers.filter(fc => {
    if (fc.health <= 0) {
      if (fc.isElite) {
        ts.eliteKills++;
        if (!(inDungeon && ts.dungeonType === 'wave')) grantEliteRewards(ts, 10, fc.x, fc.y);
      }
      if (inDungeon) {
        awardDungeonMedals(ts, 'flameCaller');
        ts.enemiesKilled++;
        ts.particles.push(makeParticle(fc.x + 20, fc.y - 12, `+M`, '#ffd700'));
      } else {
        const eliteMult = 1;
        let gold = Math.floor(10 * zkMult * gdMult * warChestMult * harvestMult * midasMult * eliteMult);
        if (fc.lastHitByHero) gold = Math.floor(gold * scavengerMult);
        gold = Math.floor(gold * largerBagsMult);
        ts.goldEarned += gold;
        ts.killGoldEarned += gold;
        ts.enemiesKilled++;
        ts.particles.push(makeParticle(fc.x + 20, fc.y - 12, `+${formatNumber(gold)}g`, fc.isElite ? '#ff4444' : '#ffd700'));
        trySpawnChest(ts, fc.x, fc.y);
        applyMartyrdomRewardAoE(ts, fc.x);
        // Riches: hero kills have increased chance to drop consumable chest
        if (tickHasArtifact(ts, 'riches') && fc.lastHitByHero && Math.random() < 0.05) {
          ts.chests.push({ id: uid(), x: fc.x + 10, y: GROUND_Y - 20, type: 'consumable', value: 0, age: 0, consumableId: 'healingPotion' as any });
          ts.particles.push(makeParticle(fc.x, GROUND_Y - 40, 'RICHES!', '#44ffaa'));
        }
        // Momentum synergy: hero kill grants speed + atk speed for 5s
        if (tickHasSynergy(ts, 'heroPair2') && fc.lastHitByHero) {
          const stacks = Math.min(8, (ts.hero.momentumStacks || 0) + 1);
          ts.hero.momentumStacks = stacks;
          ts.hero.momentumTimer = 300;
        }
      }
      return false;
    }
    return true;
  });

  // Corrupted Sentinel deaths
  ts.enemyCorruptedSentinels = ts.enemyCorruptedSentinels.filter(cs => {
    if (cs.health <= 0) {
      if (cs.isElite) {
        ts.eliteKills++;
        if (!(inDungeon && ts.dungeonType === 'wave')) grantEliteRewards(ts, 15, cs.x, cs.y);
      }
      if (inDungeon) {
        awardDungeonMedals(ts, 'corruptedSentinel');
        ts.enemiesKilled++;
        ts.particles.push(makeParticle(cs.x + 20, cs.y - 12, `+M`, '#ffd700'));
      } else {
        const eliteMult = 1;
        let gold = Math.floor(15 * zkMult * gdMult * warChestMult * harvestMult * midasMult * eliteMult);
        if (cs.lastHitByHero) gold = Math.floor(gold * scavengerMult);
        gold = Math.floor(gold * largerBagsMult);
        ts.goldEarned += gold;
        ts.killGoldEarned += gold;
        ts.enemiesKilled++;
        ts.particles.push(makeParticle(cs.x + 20, cs.y - 12, `+${formatNumber(gold)}g`, cs.isElite ? '#ff4444' : '#ffd700'));
        trySpawnChest(ts, cs.x, cs.y);
        applyMartyrdomRewardAoE(ts, cs.x);
        // Riches: hero kills have increased chance to drop consumable chest
        if (tickHasArtifact(ts, 'riches') && cs.lastHitByHero && Math.random() < 0.05) {
          ts.chests.push({ id: uid(), x: cs.x + 10, y: GROUND_Y - 20, type: 'consumable', value: 0, age: 0, consumableId: 'healingPotion' as any });
          ts.particles.push(makeParticle(cs.x, GROUND_Y - 40, 'RICHES!', '#44ffaa'));
        }
        // Momentum synergy: hero kill grants speed + atk speed for 5s
        if (tickHasSynergy(ts, 'heroPair2') && cs.lastHitByHero) {
          const stacks = Math.min(8, (ts.hero.momentumStacks || 0) + 1);
          ts.hero.momentumStacks = stacks;
          ts.hero.momentumTimer = 300;
        }
      }
      return false;
    }
    return true;
  });

  // Dungeon Rat deaths
  ts.enemyDungeonRats = ts.enemyDungeonRats.filter(dr => {
    if (dr.health <= 0) {
      if (dr.isElite) {
        ts.eliteKills++;
        if (!(inDungeon && ts.dungeonType === 'wave')) grantEliteRewards(ts, 1, dr.x, dr.y);
      }
      const eliteMult = 1;
      let gold = Math.floor(1 * zkMult * gdMult * warChestMult * harvestMult * midasMult * eliteMult);
      if (dr.lastHitByHero) gold = Math.floor(gold * scavengerMult);
      gold = Math.floor(gold * largerBagsMult);
      ts.goldEarned += gold;
      ts.killGoldEarned += gold;
      ts.enemiesKilled++;
      ts.particles.push(makeParticle(dr.x + 10, dr.y - 8, `+${formatNumber(gold)}g`, dr.isElite ? '#ff4444' : '#ffd700'));
      trySpawnChest(ts, dr.x, dr.y);
      applyMartyrdomRewardAoE(ts, dr.x);
      if (tickHasSynergy(ts, 'heroPair2') && dr.lastHitByHero) {
        const stacks = Math.min(8, (ts.hero.momentumStacks || 0) + 1);
        ts.hero.momentumStacks = stacks;
        ts.hero.momentumTimer = 300;
      }
      return false;
    }
    return true;
  });

  // Fire Imp deaths — if casting, resolve fireball on death
  ts.enemyFireImps = ts.enemyFireImps.filter(fi => {
    if (fi.health <= 0) {
      if (fi.isCasting && fi.castTimer > 15) {
        const aoeR = UNIT_STATS.fireImp.aoeRadius;
        if (Math.abs(ts.hero.x - fi.castTargetX) < aoeR && Math.abs(ts.hero.y - fi.castTargetY) < aoeR) {
          dealDamageToHero(ts, fi.damage, ' 🔥', '#ff4400');
        }
        ts.allies.forEach(a => {
          if (Math.abs(a.x - fi.castTargetX) < aoeR) {
            dealDamageToAlly(ts, a, fi.damage, ' 🔥', '#ff4400');
          }
        });
        ts.particles.push(makeParticle(fi.castTargetX, fi.castTargetY - 10, '🔥', '#ff4400'));
      }
      if (fi.isElite) {
        ts.eliteKills++;
        if (!(inDungeon && ts.dungeonType === 'wave')) grantEliteRewards(ts, 4, fi.x, fi.y);
      }
      const eliteMult = 1;
      let gold = Math.floor(4 * zkMult * gdMult * warChestMult * harvestMult * midasMult * eliteMult);
      if (fi.lastHitByHero) gold = Math.floor(gold * scavengerMult);
      gold = Math.floor(gold * largerBagsMult);
      ts.goldEarned += gold;
      ts.killGoldEarned += gold;
      ts.enemiesKilled++;
      ts.particles.push(makeParticle(fi.x + 10, fi.y - 8, `+${formatNumber(gold)}g`, fi.isElite ? '#ff4444' : '#ffd700'));
      trySpawnChest(ts, fi.x, fi.y);
      applyMartyrdomRewardAoE(ts, fi.x);
      if (tickHasSynergy(ts, 'heroPair2') && fi.lastHitByHero) {
        const stacks = Math.min(8, (ts.hero.momentumStacks || 0) + 1);
        ts.hero.momentumStacks = stacks;
        ts.hero.momentumTimer = 300;
      }
      return false;
    }
    return true;
  });

  // Cursed Knight deaths
  ts.enemyCursedKnights = ts.enemyCursedKnights.filter(ck => {
    if (ck.health <= 0) {
      if (ck.isElite) {
        ts.eliteKills++;
        if (!(inDungeon && ts.dungeonType === 'wave')) grantEliteRewards(ts, 6, ck.x, ck.y);
      }
      const eliteMult = 1;
      let gold = Math.floor(6 * zkMult * gdMult * warChestMult * harvestMult * midasMult * eliteMult);
      if (ck.lastHitByHero) gold = Math.floor(gold * scavengerMult);
      gold = Math.floor(gold * largerBagsMult);
      ts.goldEarned += gold;
      ts.killGoldEarned += gold;
      ts.enemiesKilled++;
      ts.particles.push(makeParticle(ck.x + 10, ck.y - 8, `+${formatNumber(gold)}g`, ck.isElite ? '#ff4444' : '#ffd700'));
      trySpawnChest(ts, ck.x, ck.y);
      applyMartyrdomRewardAoE(ts, ck.x);
      if (tickHasSynergy(ts, 'heroPair2') && ck.lastHitByHero) {
        const stacks = Math.min(8, (ts.hero.momentumStacks || 0) + 1);
        ts.hero.momentumStacks = stacks;
        ts.hero.momentumTimer = 300;
      }
      return false;
    }
    return true;
  });

  // Decrement activeSkeletons for dead skeletons
  for (const ownerId of deadSkeletonOwnerIds) {
    const ownerLich = ts.enemyLichs.find(l => l.id === ownerId);
    if (ownerLich) ownerLich.activeSkeletons = Math.max(0, ownerLich.activeSkeletons - 1);
  }
}

/** Handle ally deaths - mark slots for respawn */
export function processAllyDeaths(ts: TickState): void {
  const { unitSlots } = ts;
  ts.recentAllyDeaths = [];

  const su = ts.shardUpgrades;
  // Ancient Relic: Protector's Pride — chance to revive scales with level
  const hasProtectorsPride = ts.ancientRelicsOwned.includes('protectorsPride');
  const prideEff = hasProtectorsPride
    ? getAncientEffect('protectorsPride', getAncientRelicLevel(ts.ancientRelicCopies['protectorsPride'] || 1))
    : null;

  ts.allies = ts.allies.filter(a => {
    if (a.isPet) return true; // Pets are invulnerable, never removed
    if (a.health <= 0) {
      // Protector's Pride: chance to instantly revive at 50% HP
      if (hasProtectorsPride && Math.random() < (prideEff?.chance || 0.03)) {
        a.health = Math.floor(a.maxHealth * 0.5);
        ts.particles.push(makeParticle(a.x, a.y - 20, '\u{1F6E1}\uFE0F REVIVED!', '#ffd700'));
        return true;
      }
      // Decree artifact: next ally death respawns instantly (consumed)
      if (ts.decreeActive) {
        a.health = a.maxHealth;
        ts.decreeActive = false;
        ts.particles.push(makeParticle(a.x, a.y - 20, '📜 DECREE!', '#ffd700'));
        return true;
      }
      // Soldier second wind: chance to revive at full HP instead of dying
      if (a.unitType === 'soldier' && su.soldier_secondWind > 0 && Math.random() < su.soldier_secondWind * 0.1) {
        a.health = a.maxHealth;
        ts.particles.push(makeParticle(a.x, a.y - 20, '💪 SECOND WIND!', '#4aff4a'));
        return true;
      }
      // Brethren (Militia's relic): melee death heals 5% of dead unit's max HP to nearest ally
      if (isUnitMelee(a.unitType) && getRelicLevel(ts.relicCollection['brethren'] || 0) > 0) {
        let nearestAlly: typeof ts.allies[0] | null = null;
        let nearestDist = Infinity;
        for (const other of ts.allies) {
          if (other.id !== a.id && other.health > 0) {
            const d = Math.abs(other.x - a.x);
            if (d < nearestDist) { nearestDist = d; nearestAlly = other; }
          }
        }
        if (nearestAlly) {
          const healAmt = Math.max(1, Math.floor(a.maxHealth * 0.05));
          nearestAlly.health = Math.min(nearestAlly.maxHealth, nearestAlly.health + healAmt);
          ts.particles.push(makeParticle(nearestAlly.x + 10, nearestAlly.y - 15, `+${healAmt} BRETHREN`, '#88ffaa'));
        }
      }
      // Fractured World: Martyrdom — dying allies explode for 10% max HP AoE
      if (modMartyrdomActive(ts)) {
        const aoeDmg = Math.floor(a.maxHealth * 0.10);
        // Damage nearby allies
        for (const other of ts.allies) {
          if (other.id !== a.id && other.health > 0 && !other.isPet && Math.abs(other.x - a.x) < 60) {
            other.health -= aoeDmg;
          }
        }
        // Damage nearby enemies
        for (const e of ts.enemies) {
          if (e.health > 0 && Math.abs(e.x - a.x) < 60) e.health -= aoeDmg;
        }
        for (const e of ts.enemyArchers) {
          if (e.health > 0 && Math.abs(e.x - a.x) < 60) e.health -= aoeDmg;
        }
        for (const e of ts.enemyWraiths) {
          if (e.health > 0 && Math.abs(e.x - a.x) < 60) e.health -= aoeDmg;
        }
        for (const e of ts.enemyHounds) {
          if (e.health > 0 && Math.abs(e.x - a.x) < 60) e.health -= aoeDmg;
        }
        ts.particles.push(makeParticle(a.x, a.y - 20, `💥 MARTYRDOM`, '#ff4444'));
      }
      // Record death for Lich necromancy
      ts.recentAllyDeaths.push({
        x: a.x, y: a.y, maxHealth: a.maxHealth, damage: a.damage,
        defense: a.defense || 0, attackRate: a.attackRate, attackRange: a.attackRange,
      });
      const si = a.slotIndex;
      if (si !== undefined && unitSlots[si]) {
        const stats = UNIT_STATS[unitSlots[si].type as keyof typeof UNIT_STATS] as any;
        unitSlots[si] = { ...unitSlots[si], alive: false, respawnTimer: stats.respawnTime };
        ts.particles.push(makeParticle(a.x, a.y - 20, `${stats.name} down!`, '#ff6666'));
      }
      return false;
    }
    return true;
  });
}

/** Lich necromancy: raise skeletons from recently dead allies */
export function processLichNecromancy(ts: TickState): void {
  if (ts.enemyLichs.length === 0 || ts.recentAllyDeaths.length === 0) return;

  for (const death of ts.recentAllyDeaths) {
    let closestLich: typeof ts.enemyLichs[0] | null = null;
    let closestDist = Infinity;
    for (const lich of ts.enemyLichs) {
      const skelCap = lich.eliteVariantId === 'archlich' ? 6 : 3;
      if (lich.health <= 0 || lich.activeSkeletons >= skelCap) continue;
      const dist = Math.abs(lich.x - death.x);
      if (dist < 240 && dist < closestDist) { closestDist = dist; closestLich = lich; }
    }
    if (!closestLich) continue;

    const hp = Math.floor(death.maxHealth * 0.7);
    ts.enemies.push({
      id: uid(), x: death.x, y: GROUND_Y - ENEMY_SIZE,
      health: hp, maxHealth: hp, damage: Math.floor(death.damage * 0.7),
      speed: 0.15, attackRate: Math.max(15, Math.floor(death.attackRate * 1.25)),
      attackRange: Math.min(40, Math.floor(death.attackRange * 0.7)),
      frame: ts.frame, attackCooldown: 60,
      lane: Math.floor(Math.random() * 10) - 5,
      isLichSkeleton: true, lichOwnerId: closestLich.id,
      defense: Math.floor(death.defense * 0.7),
    });
    closestLich.activeSkeletons++;
    closestLich.passiveSummonTimer = 0;
    ts.particles.push(makeParticle(death.x, death.y - 20, '💀 RAISE DEAD! 💀', '#44ff44'));
  }
}
