import { GROUND_Y } from '../constants';
import { makeParticle, makeCritParticle, uid } from '../utils/helpers';
import type { TickState } from './tickState';
import { tickHasArtifact, tickHasSynergy, tickHasSetBonus, tickHasSkill, tickSkillBuffActive, dealDamageToHero, dealDamageToAlly, forEachEnemy, tryAbsorbDebuff, getRegaliaBonus, absorbBossShield } from './tickState';
import { getClassDef } from '../classes';
import { getRelicLevel } from '../relics';
import { getChallengeRewardMult } from '../challenges';
import { getAncientEffect, getAncientRelicLevel } from '../ancientRelics';
import { getSkillDef } from '../skills';
import { modHeroMult, modEnemyDamageReduction, modDuelistRewardActive, modEnemyRegenActive } from './modifierEffects';

/** Hero auto-attack — branches on melee vs ranged */
export function processHeroCombat(ts: TickState): void {
  // Channeling lock — mage can't auto-attack during channels
  if ((ts.hero.channeling || 0) > 0) return;
  const classDef = getClassDef(ts.heroClass);
  if (ts.heroClass === 'mage') {
    processHeroChainLightning(ts, classDef.attackCooldown, classDef.attackRange);
  } else if (classDef.attackType === 'ranged') {
    processHeroRangedCombat(ts, classDef.attackCooldown, classDef.attackRange);
  } else {
    processHeroMeleeCombat(ts, classDef.attackCooldown, classDef.attackRange);
  }
}

/** Melee auto-attack (Warlord) */
function processHeroMeleeCombat(ts: TickState, baseAtkCD: number, attackRange: number): void {
  const { hero, enemies, enemyArchers, enemyWraiths, enemyHounds } = ts;
  let { boss } = ts;

  let atkCD = baseAtkCD;
  // Reward: Wolf's Fury (Lone Wolf completion) — hero attack speed (L1=10%, L2=15%, L3=20%)
  const wolfLv = ts.challengeCompletions.loneWolf || 0;
  if (wolfLv > 0) atkCD = Math.floor(atkCD * (1 - 0.10 * getChallengeRewardMult(wolfLv)));
  // Momentum synergy: hero atk speed bonus from kills (+3% per stack)
  if ((hero.momentumStacks || 0) > 0) atkCD = Math.floor(atkCD * (1 - (hero.momentumStacks || 0) * 0.03));
  // Regalia: hero attack speed
  const heroAtkSpdBonus = getRegaliaBonus(ts, 'heroAttackSpeed');
  if (heroAtkSpdBonus > 0) atkCD = Math.max(10, Math.floor(atkCD * (1 - heroAtkSpdBonus / 100)));
  // Barracks building: hero +5% atk speed per barracks
  { const { barracks: barN, blueprintsMult: bpM } = ts.buildingCounts; if (barN > 0) atkCD = Math.max(10, Math.floor(atkCD * Math.max(0.7, 1 - 0.05 * barN * bpM))); }
  // Fractured World: Duelist reward — hero attack speed +10%
  if (modDuelistRewardActive(ts)) atkCD = Math.floor(atkCD * 0.9);
  hero.attackCooldown++;
  if (hero.attackCooldown < atkCD) return;

  let didAttack = false;

  let heroDmg = hero.damage;
  // Training Manual: melee hero +2 dmg
  if (tickHasArtifact(ts, 'trainingManual')) heroDmg += 2;
  // Collection: +3 atk per boss killed (+1 for warlord)
  if (tickHasArtifact(ts, 'collection')) {
    const collBonus = ts.heroClass === 'warlord' ? 1 : 3;
    heroDmg += collBonus * (ts.bossesDefeated || 0);
  }
  if (tickHasSkill(ts, 'bloodlust') && ts.heroSkills.bloodlustStacks > 0) {
    heroDmg += ts.heroSkills.bloodlustStacks * 2;
  }
  // Masterwork Arms (Smithy 6pc): hero +2 dmg and +1 def per boss killed
  if (tickHasSetBonus(ts, 'smithysSet', 6) && (hero.masterworkBossCount || 0) > 0) {
    heroDmg += (hero.masterworkBossCount || 0) * 2;
  }
  // Kiting (Adventurer 3pc): hero +8% damage while moving
  if (tickHasSetBonus(ts, 'adventurersKit', 3) && hero.isMoving) {
    heroDmg = Math.floor(heroDmg * 1.08);
  }
  // Slime Expertise (Slime Hunters 5pc): +1% damage per friendly slime alive
  if (tickHasSetBonus(ts, 'slimeHunters', 5)) {
    let slimeCount = 0; for (const a of ts.allies) if (a.unitType === 'friendlySlime' && a.health > 0) slimeCount++;
    if (slimeCount > 0) heroDmg = Math.floor(heroDmg * (1 + slimeCount * 0.01));
  }
  // Forge building: hero +2 dmg per forge
  { const { forge: forgeN, blueprintsMult: bpM } = ts.buildingCounts; if (forgeN > 0) heroDmg += Math.floor(2 * forgeN * bpM); }
  // Strike Back synergy: +5% dmg per stack after being hit (warlord hero)
  if ((hero as any).strikeBackStacks > 0 && (hero as any).strikeBackTimer > 0) {
    heroDmg = Math.floor(heroDmg * (1 + (hero as any).strikeBackStacks * 0.05));
    (hero as any).strikeBackStacks = 0;
  }
  // Regalia: hero damage flat + %
  const heroDmgFlat = getRegaliaBonus(ts, 'heroDamageFlat');
  if (heroDmgFlat > 0) heroDmg += Math.floor(heroDmgFlat);
  const heroDmgPct = getRegaliaBonus(ts, 'heroDamagePct');
  if (heroDmgPct > 0) heroDmg = Math.floor(heroDmg * (1 + heroDmgPct / 100));
  // Fractured World: hero damage multiplier
  heroDmg = Math.floor(heroDmg * modHeroMult(ts));
  // Hero base crit + Knife (3% per level) + War Shrine (3% per building) + Regalia
  let heroCrit = false;
  let heroCritChance = getClassDef(ts.heroClass).baseStats.critChance;
  const knifeLv = getRelicLevel(ts.relicCollection['knife'] || 0);
  if (knifeLv > 0) heroCritChance += knifeLv * 0.03;
  { const { warShrine: wsN, blueprintsMult: bpM } = ts.buildingCounts; if (wsN > 0) heroCritChance += 0.03 * wsN * bpM; }
  const heroCritBonus = getRegaliaBonus(ts, 'heroCritChance');
  if (heroCritBonus > 0) heroCritChance += heroCritBonus / 100;
  let heroCritMult = 1.5;
  const heroCritDmgBonus = getRegaliaBonus(ts, 'heroCritDamage');
  if (heroCritDmgBonus > 0) heroCritMult += heroCritDmgBonus / 100;
  if (heroCritChance > 0 && Math.random() < heroCritChance) {
    heroDmg = Math.floor(heroDmg * heroCritMult);
    heroCrit = true;
  }

  if (boss && boss.health > 0 && Math.abs(boss.x - hero.x) < 80) {
    let dmg = heroDmg;
    if ((boss.markedTimer || 0) > 0) dmg = Math.floor(dmg * 1.3);
    dmg = absorbBossShield(boss, dmg);
    boss.health -= dmg;
    boss.lastDamageTime = ts.frame;
    boss.lastHitByHero = true;
    ts.boss = boss;
    if (heroCrit) {
      ts.particles.push(makeCritParticle(boss.x + 32, boss.y, dmg));
    } else {
      ts.particles.push(makeParticle(boss.x + 32, boss.y, `-${dmg}`, '#ffd700'));
    }
    didAttack = true;
  }

  // Unified melee hit: single forEachEnemy pass (skips dead, avoids 12 closure allocations)
  forEachEnemy(ts, (e: any) => {
    if (e === boss) return; // boss handled above
    if (e.lungeTimer && e.lungeTimer > 0) return; // hounds invuln during lunge
    if (e.stealthTimer !== undefined && e.stealthTimer > 0) return; // shadow assassins stealthed
    if (Math.abs(e.x - hero.x) >= attackRange) return;
    let dmg = heroDmg;
    if (e.defense) dmg = Math.max(1, dmg - e.defense);
    const modReduction = modEnemyDamageReduction(ts);
    if (modReduction > 0) dmg = Math.max(1, Math.floor(dmg * (1 - modReduction)));
    if ((e.markedTimer || 0) > 0) dmg = Math.floor(dmg * 1.3);
    e.health -= dmg;
    e.lastDamageTime = ts.frame;
    e.lastHitByHero = true;
    if (heroCrit) ts.particles.push(makeCritParticle(e.x + 12, e.y, dmg));
    else ts.particles.push(makeParticle(e.x + 12, e.y, `-${dmg}`, '#ffd700'));
    didAttack = true;
  });

  if (didAttack) {
    hero.attackCooldown = 0;
    hero.isAttacking = true;
    // Banner synergy: first attack every 30s drops a banner
    if (tickHasSynergy(ts, 'heroPair1') && (ts.hero.bannerCooldown || 0) <= 0) {
      ts.banners.push({ id: uid(), x: hero.x, y: GROUND_Y - 20, radius: 100, lifetime: 600, regenRate: 0.01, speedBonus: 0.1 });
      ts.hero.bannerCooldown = 1800; // 30s
      ts.particles.push(makeParticle(hero.x, hero.y - 20, '\u{1F6A9} BANNER!', '#ffd700'));
    }
  } else { hero.isAttacking = false; }
}

/** Ranged auto-attack (Ranger) — fires heroArrow projectile with aiming delay */
function processHeroRangedCombat(ts: TickState, baseAtkCD: number, attackRange: number): void {
  const { hero } = ts;

  // Find closest enemy in range first (needed for aiming)
  const allTargets: Array<{ x: number; health: number; maxHealth: number }> = [];
  forEachEnemy(ts, (e: any) => {
    if (e.x > hero.x && e.x - hero.x < attackRange && !(e.lungeTimer && e.lungeTimer > 0)) allTargets.push(e);
  });

  if (allTargets.length === 0) {
    hero.aimingTimer = 0; // Reset aim when no target
    hero.isAttacking = false;
    return;
  }

  // Aiming delay: hero must aim for 48 ticks (0.8s) before first shot
  const aimingDelay = 48;
  hero.aimingTimer = (hero.aimingTimer || 0) + 1;
  if (hero.aimingTimer < aimingDelay) return;

  let atkCD = baseAtkCD;
  // Reward: Wolf's Fury (Lone Wolf completion) — hero attack speed (L1=20%, L2=30%, L3=40%)
  const wolfLv2 = ts.challengeCompletions.loneWolf || 0;
  if (wolfLv2 > 0) atkCD = Math.floor(atkCD * (1 - 0.20 * getChallengeRewardMult(wolfLv2)));
  // Momentum synergy: hero atk speed bonus from kills (+3% per stack)
  if ((hero.momentumStacks || 0) > 0) atkCD = Math.floor(atkCD * (1 - (hero.momentumStacks || 0) * 0.03));
  // Regalia: hero attack speed
  const rangedHeroAtkSpd = getRegaliaBonus(ts, 'heroAttackSpeed');
  if (rangedHeroAtkSpd > 0) atkCD = Math.max(10, Math.floor(atkCD * (1 - rangedHeroAtkSpd / 100)));
  // Barracks building: hero +5% atk speed per barracks
  { const { barracks: barN, blueprintsMult: bpM } = ts.buildingCounts; if (barN > 0) atkCD = Math.max(10, Math.floor(atkCD * Math.max(0.7, 1 - 0.05 * barN * bpM))); }
  // Fractured World: Duelist reward — hero attack speed +10%
  if (modDuelistRewardActive(ts)) atkCD = Math.floor(atkCD * 0.9);
  hero.attackCooldown++;
  if (hero.attackCooldown < atkCD) return;

  let heroDmg = hero.damage;
  // Collection: +3 atk per boss killed (+1 for warlord)
  if (tickHasArtifact(ts, 'collection')) {
    const collBonus = ts.heroClass === 'warlord' ? 1 : 3;
    heroDmg += collBonus * (ts.bossesDefeated || 0);
  }
  // Masterwork Arms (Smithy 6pc): hero +2 dmg per boss killed
  if (tickHasSetBonus(ts, 'smithysSet', 6) && (hero.masterworkBossCount || 0) > 0) {
    heroDmg += (hero.masterworkBossCount || 0) * 2;
  }
  // Kiting (Adventurer 3pc): hero +8% damage while moving
  if (tickHasSetBonus(ts, 'adventurersKit', 3) && hero.isMoving) {
    heroDmg = Math.floor(heroDmg * 1.08);
  }
  // Slime Expertise (Slime Hunters 5pc): +1% damage per friendly slime alive
  if (tickHasSetBonus(ts, 'slimeHunters', 5)) {
    let slimeCount = 0; for (const a of ts.allies) if (a.unitType === 'friendlySlime' && a.health > 0) slimeCount++;
    if (slimeCount > 0) heroDmg = Math.floor(heroDmg * (1 + slimeCount * 0.01));
  }
  // Forge building: hero +2 dmg per forge
  { const { forge: forgeN, blueprintsMult: bpM } = ts.buildingCounts; if (forgeN > 0) heroDmg += Math.floor(2 * forgeN * bpM); }
  allTargets.sort((a, b) => a.x - b.x);
  const target = allTargets[0];

  // Keen Eye: crit 2x on enemies above 90% HP
  let arrowDmg = heroDmg;
  if (tickHasSkill(ts, 'keenEye') && target.health > target.maxHealth * 0.9) {
    arrowDmg = Math.floor(arrowDmg * 2);
  }
  // Ancient Relic: Quiver — chance for double damage hero arrows (scales with level)
  const quiverEff = ts.ancientRelicsOwned.includes('quiver')
    ? getAncientEffect('quiver', getAncientRelicLevel(ts.ancientRelicCopies['quiver'] || 1))
    : null;
  if (quiverEff && Math.random() < (quiverEff.chance || 0.05)) {
    arrowDmg = Math.floor(arrowDmg * 2);
  }
  // Regalia: hero damage flat + %
  const rangedHeroDmgFlat = getRegaliaBonus(ts, 'heroDamageFlat');
  if (rangedHeroDmgFlat > 0) arrowDmg += Math.floor(rangedHeroDmgFlat);
  const rangedHeroDmgPct = getRegaliaBonus(ts, 'heroDamagePct');
  if (rangedHeroDmgPct > 0) arrowDmg = Math.floor(arrowDmg * (1 + rangedHeroDmgPct / 100));
  // Fractured World: hero damage multiplier
  arrowDmg = Math.floor(arrowDmg * modHeroMult(ts));
  // Hero base crit + Knife (3% per level) + War Shrine (3% per building) + Regalia
  let rangedHeroCritChance = getClassDef(ts.heroClass).baseStats.critChance;
  const rangedKnifeLv = getRelicLevel(ts.relicCollection['knife'] || 0);
  if (rangedKnifeLv > 0) rangedHeroCritChance += rangedKnifeLv * 0.03;
  { const { warShrine: wsN, blueprintsMult: bpM } = ts.buildingCounts; if (wsN > 0) rangedHeroCritChance += 0.03 * wsN * bpM; }
  const rangedCritBonus = getRegaliaBonus(ts, 'heroCritChance');
  if (rangedCritBonus > 0) rangedHeroCritChance += rangedCritBonus / 100;
  let rangedCritMult = 1.5;
  const rangedCritDmgBonus = getRegaliaBonus(ts, 'heroCritDamage');
  if (rangedCritDmgBonus > 0) rangedCritMult += rangedCritDmgBonus / 100;
  if (rangedHeroCritChance > 0 && Math.random() < rangedHeroCritChance) {
    arrowDmg = Math.floor(arrowDmg * rangedCritMult);
  }

  ts.projectiles.push({
    id: uid(), x: hero.x + 20, y: hero.y + 5,
    targetX: target.x, speed: -10, damage: arrowDmg, type: 'heroArrow',
  });

  // Passive Power Shot: 10% chance to fire a bonus 3x damage arrow at the furthest enemy
  if (tickHasSkill(ts, 'powerShot') && Math.random() < 0.10) {
    // Find furthest enemy in range for the power shot
    const furthest = [...allTargets].sort((a, b) => b.x - a.x)[0];
    if (furthest) {
      const shotDmg = Math.floor(hero.damage * 3);
      ts.projectiles.push({ id: uid(), x: hero.x + 20, y: hero.y + 5, targetX: furthest.x, speed: -8, damage: shotDmg, type: 'heroArrow' });
      ts.particles.push(makeParticle(hero.x + 30, hero.y - 10, '\u{1F3AF} POWER SHOT!', '#6aaf5f'));
    }
  }

  hero.attackCooldown = 0;
  hero.isAttacking = true;
  // Banner synergy: first attack every 30s drops a banner
  if (tickHasSynergy(ts, 'heroPair1') && (ts.hero.bannerCooldown || 0) <= 0) {
    ts.banners.push({ id: uid(), x: hero.x, y: GROUND_Y - 20, radius: 100, lifetime: 600, regenRate: 0.01, speedBonus: 0.1 });
    ts.hero.bannerCooldown = 1800; // 30s
    ts.particles.push(makeParticle(hero.x, hero.y - 20, '\u{1F6A9} BANNER!', '#ffd700'));
  }
}

/** Mage chain lightning auto-attack — instant damage chaining between enemies */
function processHeroChainLightning(ts: TickState, baseAtkCD: number, attackRange: number): void {
  const { hero } = ts;

  // Find targets in range
  const allTargets: Array<{ x: number; y: number; health: number; maxHealth: number; defense?: number; lastDamageTime?: number; markedTimer?: number; burnTimer?: number; burnDamage?: number }> = [];
  forEachEnemy(ts, (e: any) => {
    if (e.x > hero.x && e.x - hero.x < attackRange && !(e.lungeTimer && e.lungeTimer > 0)) allTargets.push(e);
  });

  if (allTargets.length === 0) {
    hero.aimingTimer = 0;
    hero.isAttacking = false;
    return;
  }

  // Aiming delay
  const aimingDelay = 48;
  hero.aimingTimer = (hero.aimingTimer || 0) + 1;
  if (hero.aimingTimer < aimingDelay) return;

  // Attack cooldown with modifiers (same as ranger)
  let atkCD = baseAtkCD;
  const wolfLv = ts.challengeCompletions.loneWolf || 0;
  if (wolfLv > 0) atkCD = Math.floor(atkCD * (1 - 0.20 * getChallengeRewardMult(wolfLv)));
  if ((hero.momentumStacks || 0) > 0) atkCD = Math.floor(atkCD * (1 - (hero.momentumStacks || 0) * 0.03));
  const heroAtkSpd = getRegaliaBonus(ts, 'heroAttackSpeed');
  if (heroAtkSpd > 0) atkCD = Math.max(10, Math.floor(atkCD * (1 - heroAtkSpd / 100)));
  { const { barracks: barN, blueprintsMult: bpM } = ts.buildingCounts; if (barN > 0) atkCD = Math.max(10, Math.floor(atkCD * Math.max(0.7, 1 - 0.05 * barN * bpM))); }
  // Fractured World: Duelist reward — hero attack speed +10%
  if (modDuelistRewardActive(ts)) atkCD = Math.floor(atkCD * 0.9);
  hero.attackCooldown++;
  if (hero.attackCooldown < atkCD) return;

  // Base damage with modifiers
  let heroDmg = hero.damage;
  if (tickHasArtifact(ts, 'collection')) {
    heroDmg += 3 * (ts.bossesDefeated || 0);
  }
  if (tickHasSetBonus(ts, 'smithysSet', 6) && (hero.masterworkBossCount || 0) > 0) {
    heroDmg += (hero.masterworkBossCount || 0) * 2;
  }
  if (tickHasSetBonus(ts, 'adventurersKit', 3) && hero.isMoving) {
    heroDmg = Math.floor(heroDmg * 1.08);
  }
  if (tickHasSetBonus(ts, 'slimeHunters', 5)) {
    let slimeCount = 0; for (const a of ts.allies) if (a.unitType === 'friendlySlime' && a.health > 0) slimeCount++;
    if (slimeCount > 0) heroDmg = Math.floor(heroDmg * (1 + slimeCount * 0.01));
  }
  { const { forge: forgeN, blueprintsMult: bpM } = ts.buildingCounts; if (forgeN > 0) heroDmg += Math.floor(2 * forgeN * bpM); }
  const heroDmgFlat = getRegaliaBonus(ts, 'heroDamageFlat');
  if (heroDmgFlat > 0) heroDmg += Math.floor(heroDmgFlat);
  const heroDmgPct = getRegaliaBonus(ts, 'heroDamagePct');
  if (heroDmgPct > 0) heroDmg = Math.floor(heroDmg * (1 + heroDmgPct / 100));
  // Fractured World: hero damage multiplier
  heroDmg = Math.floor(heroDmg * modHeroMult(ts));

  // Arcane Intellect buff check
  if (tickSkillBuffActive(ts, 'arcaneIntellect')) heroDmg = Math.floor(heroDmg * 1.2);

  // Crit setup
  let heroCritChance = getClassDef(ts.heroClass).baseStats.critChance;
  const knifeLv = getRelicLevel(ts.relicCollection['knife'] || 0);
  if (knifeLv > 0) heroCritChance += knifeLv * 0.03;
  { const { warShrine: wsN, blueprintsMult: bpM } = ts.buildingCounts; if (wsN > 0) heroCritChance += 0.03 * wsN * bpM; }
  const critBonus = getRegaliaBonus(ts, 'heroCritChance');
  if (critBonus > 0) heroCritChance += critBonus / 100;
  let critMult = 1.5;
  const critDmgBonus = getRegaliaBonus(ts, 'heroCritDamage');
  if (critDmgBonus > 0) critMult += critDmgBonus / 100;

  const hasChargedZap = tickHasSkill(ts, 'chargedZap');
  const hasHighAmps = tickHasSkill(ts, 'highAmps');
  // Without either passive, chain lightning cannot crit at all
  const canFirstCrit = hasChargedZap || hasHighAmps;

  // Sort targets by distance for initial target
  allTargets.sort((a, b) => a.x - b.x);
  const chainRange = 120; // px between chain targets
  const maxChains = 5;
  const falloff = 0.80; // 20% less per chain
  const hitSet = new Set<any>();
  const chainPositions: Array<{x: number, y: number}> = [{ x: hero.x + 20, y: hero.y + 5 }];

  let currentDmg = heroDmg;
  let chainsLeft = maxChains;
  let lastTarget = { x: hero.x, y: hero.y };

  // Find closest target for first hit
  let target = allTargets[0];
  if (!target) return;

  // First hit
  let firstDmg = currentDmg;
  let firstCrit = false;
  if (canFirstCrit && heroCritChance > 0 && Math.random() < heroCritChance) {
    firstDmg = Math.floor(firstDmg * critMult);
    firstCrit = true;
    if (hasChargedZap) chainsLeft++; // crit extends chain
  }
  let actualDmg = firstDmg;
  if ((target.markedTimer || 0) > 0) actualDmg = Math.floor(actualDmg * 1.3);
  if (target.defense) actualDmg = Math.max(1, actualDmg - target.defense);
  if (ts.boss && target === ts.boss) actualDmg = absorbBossShield(ts.boss, actualDmg);
  target.health -= actualDmg;
  target.lastDamageTime = ts.frame;
  hitSet.add(target);
  chainPositions.push({ x: target.x, y: (target.y || GROUND_Y - 15) + ((target as any).lane || 0) });
  if (firstCrit) {
    ts.particles.push(makeCritParticle(target.x, (target.y || GROUND_Y - 15) - 10, actualDmg));
  } else {
    ts.particles.push(makeParticle(target.x, (target.y || GROUND_Y - 15) - 10, `-${actualDmg}`, '#88ccff'));
  }
  lastTarget = target;
  chainsLeft--;

  // Chain to additional targets
  while (chainsLeft > 0) {
    currentDmg = Math.floor(currentDmg * falloff);
    if (currentDmg < 1) break;

    // Find nearest unhit enemy within chainRange of last target
    let bestDist = chainRange + 1;
    let bestEnemy: any = null;

    // Check all enemy arrays for chain targets
    const checkChain = (e: any) => {
      if (hitSet.has(e) || e.health <= 0) return;
      const dist = Math.abs(e.x - lastTarget.x);
      if (dist < bestDist) {
        bestDist = dist;
        bestEnemy = e;
      }
    };
    ts.enemies.forEach(checkChain);
    ts.enemyArchers.forEach(checkChain);
    ts.enemyWraiths.forEach(checkChain);
    ts.enemyHounds.forEach(checkChain);
    ts.enemyLichs.forEach(checkChain);
    ts.enemyShadowAssassins.forEach((sa: any) => { if (sa.stealthTimer <= 0) checkChain(sa); });
    ts.enemyFlameCallers.forEach(checkChain);
    ts.enemyCorruptedSentinels.forEach(checkChain);
    ts.enemyDungeonRats.forEach(checkChain);
    ts.enemyFireImps.forEach(checkChain);
    ts.enemyCursedKnights.forEach(checkChain);
    if (ts.boss && ts.boss.health > 0 && !hitSet.has(ts.boss)) checkChain(ts.boss);

    if (!bestEnemy) break;

    // Apply chain damage
    let chainDmg = currentDmg;
    let chainCrit = false;
    if (hasHighAmps && heroCritChance > 0 && Math.random() < heroCritChance) {
      chainDmg = Math.floor(chainDmg * critMult);
      chainCrit = true;
      chainsLeft++; // crit extends chain
    }
    if ((bestEnemy.markedTimer || 0) > 0) chainDmg = Math.floor(chainDmg * 1.3);
    if (bestEnemy.defense) chainDmg = Math.max(1, chainDmg - bestEnemy.defense);
    if (ts.boss && bestEnemy === ts.boss) chainDmg = absorbBossShield(ts.boss, chainDmg);
    bestEnemy.health -= chainDmg;
    bestEnemy.lastDamageTime = ts.frame;
    hitSet.add(bestEnemy);
    chainPositions.push({ x: bestEnemy.x, y: (bestEnemy.y || GROUND_Y - 15) + ((bestEnemy as any).lane || 0) });
    if (chainCrit) {
      ts.particles.push(makeCritParticle(bestEnemy.x, (bestEnemy.y || GROUND_Y - 15) - 10, chainDmg));
    } else {
      ts.particles.push(makeParticle(bestEnemy.x, (bestEnemy.y || GROUND_Y - 15) - 10, `-${chainDmg}`, '#66aadd'));
    }
    lastTarget = bestEnemy;
    chainsLeft--;
  }

  // Spawn visual-only chain lightning projectile
  ts.projectiles.push({
    id: uid(), x: hero.x + 20, y: hero.y + 5,
    targetX: hero.x + 20, speed: 0, damage: 0,
    type: 'chainLightning', duration: 20,
    chainTargets: chainPositions,
  });

  // Arcane Intellect passive: reduce all skill CDs by 5% on each attack
  if (tickHasSkill(ts, 'arcaneIntellect')) {
    const skills = ts.heroSkills;
    for (const sid of skills.equippedSkills) {
      const cd = skills.skillCooldowns[sid] || 0;
      const def = getSkillDef(sid);
      if (def && def.cooldownFrames > 0 && cd < def.cooldownFrames) {
        const remaining = def.cooldownFrames - cd;
        skills.skillCooldowns[sid] = cd + Math.floor(remaining * 0.05);
      }
    }
  }

  hero.attackCooldown = 0;
  hero.isAttacking = true;
  // Banner synergy
  if (tickHasSynergy(ts, 'heroPair1') && (ts.hero.bannerCooldown || 0) <= 0) {
    ts.banners.push({ id: uid(), x: hero.x, y: GROUND_Y - 20, radius: 100, lifetime: 600, regenRate: 0.01, speedBonus: 0.1 });
    ts.hero.bannerCooldown = 1800;
    ts.particles.push(makeParticle(hero.x, hero.y - 20, '\u{1F6A9} BANNER!', '#ffd700'));
  }
}

/** Wizard beam collision — AOE damage when beam reaches end of range */
function handleWizardBeamHit(ts: TickState, p: { x: number; targetX: number; damage: number; crit?: boolean; startX?: number; burnRate?: number; burnDuration?: number }): boolean {
  if (p.x < p.targetX - 10) return true;  // still in flight

  const beamStart = (p.startX ?? p.x) - 30; // beam hits 30px behind wizard
  const beamEnd = p.targetX;
  let hitCount = 0;

  const inBeam = (ex: number) => ex >= beamStart && ex <= beamEnd;

  forEachEnemy(ts, (enemy: any) => {
    if (enemy.lungeTimer && enemy.lungeTimer > 0) return;
    if (enemy.stealthTimer !== undefined && enemy.stealthTimer > 0) return;
    if (!inBeam(enemy.x)) return;
    let dmg = p.damage;
    if (enemy.defense) dmg = Math.max(1, dmg - enemy.defense);
    if (ts.boss && enemy === ts.boss) dmg = absorbBossShield(ts.boss, dmg);
    enemy.health -= dmg;
    enemy.lastDamageTime = ts.frame;
    if (p.burnRate && p.burnDuration && !(enemy.burnTimer && enemy.burnTimer > 0)) {
      enemy.burnTimer = p.burnDuration;
      enemy.burnDamage = Math.max(1, Math.floor(enemy.maxHealth * p.burnRate));
    }
    hitCount++;
  });

  if (hitCount > 0) {
    const midX = ((p.startX || p.x) + p.targetX) / 2;
    if (p.crit) {
      ts.particles.push(makeCritParticle(midX, GROUND_Y - 40, p.damage * hitCount));
    } else {
      ts.particles.push(makeParticle(midX, GROUND_Y - 40, hitCount > 1 ? `⚡-${p.damage}x${hitCount}!` : `⚡-${p.damage}`, '#aa55ff'));
    }
  }

  return false; // consumed
}

/** Fireball collision — AOE damage on arrival (damage > 0 only; damage: 0 = visual) */
function handleFireballHit(ts: TickState, p: { x: number; targetX: number; damage: number; aoeRadius?: number }): boolean {
  if (p.damage === 0) return p.x < p.targetX + 10; // visual-only fireball
  if (p.x < p.targetX - 10) return true; // still in flight

  const hitX = p.targetX;
  const splashR = p.aoeRadius || 51;
  let hitCount = 0;

  forEachEnemy(ts, (enemy: any) => {
    if (enemy.lungeTimer && enemy.lungeTimer > 0) return;
    if (enemy.stealthTimer !== undefined && enemy.stealthTimer > 0) return;
    if (Math.abs(enemy.x - hitX) > splashR) return;
    let dmg = p.damage;
    if (enemy.defense) dmg = Math.max(1, dmg - enemy.defense);
    if (ts.boss && enemy === ts.boss) dmg = absorbBossShield(ts.boss, dmg);
    enemy.health -= dmg;
    enemy.lastDamageTime = ts.frame;
    hitCount++;
  });

  ts.particles.push(makeParticle(hitX, GROUND_Y - 40, hitCount > 0 ? `💥-${p.damage}${hitCount > 1 ? 'x' + hitCount : ''}` : '💥', '#ff4400'));
  return false; // consumed
}

/** Cleric bolt collision — single-target damage when bolt reaches target */
function handleClericBoltHit(ts: TickState, p: { x: number; y: number; targetX: number; damage: number; crit?: boolean }): boolean {
  if (p.x < p.targetX - 10) return true;  // still in flight
  if (p.x > p.targetX + 50) return false; // overshot

  const hitX = p.targetX;
  const hitRadius = 25;
  let hit = false;

  const applyHit = (enemy: { x: number; health: number; lastDamageTime?: number; defense?: number }) => {
    if (hit) return;
    if (Math.abs(enemy.x - hitX) > hitRadius) return;
    let dmg = p.damage;
    if (enemy.defense) dmg = Math.max(1, dmg - enemy.defense);
    if (ts.boss && enemy === ts.boss) dmg = absorbBossShield(ts.boss, dmg);
    enemy.health -= dmg;
    enemy.lastDamageTime = ts.frame;
    if (p.crit) {
      ts.particles.push(makeCritParticle(enemy.x + 12, GROUND_Y - 30, dmg));
    } else {
      ts.particles.push(makeParticle(enemy.x + 12, GROUND_Y - 30, `-${dmg}`, '#ff88cc'));
    }
    hit = true;
  };

  for (const e of ts.enemies) applyHit(e);
  if (!hit) for (const a of ts.enemyArchers) applyHit(a);
  if (!hit) for (const w of ts.enemyWraiths) applyHit(w as any);
  if (!hit) for (const hd of ts.enemyHounds) { if (!(hd.lungeTimer && hd.lungeTimer > 0)) applyHit(hd); }
  if (!hit) for (const l of ts.enemyLichs) applyHit(l);
  if (!hit) for (const sa of ts.enemyShadowAssassins) { if (sa.stealthTimer <= 0) applyHit(sa); }
  if (!hit) for (const fc of ts.enemyFlameCallers) applyHit(fc);
  if (!hit) for (const cs of ts.enemyCorruptedSentinels) applyHit(cs as any);
  if (!hit) for (const dr of ts.enemyDungeonRats) applyHit(dr);
  if (!hit) for (const fi of ts.enemyFireImps) applyHit(fi);
  if (!hit) for (const ck of ts.enemyCursedKnights) applyHit(ck as any);
  if (!hit && ts.boss && ts.boss.health > 0) applyHit(ts.boss);

  return !hit;
}

/** Crystal turret bolt collision — single-target damage + mark debuff */
function handleCrystalBoltHit(ts: TickState, p: { x: number; y: number; targetX: number; damage: number; markOnHit?: boolean }): boolean {
  if (p.x < p.targetX - 10) return true;  // still in flight
  if (p.x > p.targetX + 50) return false; // overshot

  const hitX = p.targetX;
  const hitRadius = 25;
  let hit = false;

  const applyHit = (enemy: { x: number; health: number; lastDamageTime?: number; defense?: number; markedTimer?: number }) => {
    if (hit) return;
    if (Math.abs(enemy.x - hitX) > hitRadius) return;
    let dmg = p.damage;
    if (enemy.defense) dmg = Math.max(1, dmg - enemy.defense);
    if (ts.boss && enemy === ts.boss) dmg = absorbBossShield(ts.boss, dmg);
    enemy.health -= dmg;
    enemy.lastDamageTime = ts.frame;
    if (p.markOnHit) enemy.markedTimer = 180;
    ts.particles.push(makeParticle(enemy.x + 12, GROUND_Y - 30, `-${dmg}`, '#55ddcc'));
    hit = true;
  };

  for (const e of ts.enemies) applyHit(e);
  if (!hit) for (const a of ts.enemyArchers) applyHit(a);
  if (!hit) for (const w of ts.enemyWraiths) applyHit(w as any);
  if (!hit) for (const hd of ts.enemyHounds) { if (!(hd.lungeTimer && hd.lungeTimer > 0)) applyHit(hd); }
  if (!hit) for (const l of ts.enemyLichs) applyHit(l);
  if (!hit) for (const sa of ts.enemyShadowAssassins) { if (sa.stealthTimer <= 0) applyHit(sa); }
  if (!hit) for (const fc of ts.enemyFlameCallers) applyHit(fc);
  if (!hit) for (const cs of ts.enemyCorruptedSentinels) applyHit(cs as any);
  if (!hit) for (const dr of ts.enemyDungeonRats) applyHit(dr);
  if (!hit) for (const fi of ts.enemyFireImps) applyHit(fi);
  if (!hit) for (const ck of ts.enemyCursedKnights) applyHit(ck as any);
  if (!hit && ts.boss && ts.boss.health > 0) applyHit(ts.boss);

  return !hit;
}

/** Ally arrow collision — apply damage when arrow reaches target area */
function handleAllyArrowHit(ts: TickState, p: { x: number; y: number; targetX: number; damage: number; crit?: boolean; pierce?: number; aoeRadius?: number }): boolean {
  if (p.x < p.targetX - 10) return true;  // still in flight
  if (p.x > p.targetX + 50) return false; // overshot

  const hitX = p.targetX;
  const hitRadius = p.aoeRadius || 25;
  let hitCount = 0;
  const maxHits = p.aoeRadius ? 999 : 1 + (p.pierce || 0); // AoE hits all, pierce adds extra

  const applyHit = (enemy: { x: number; health: number; lastDamageTime?: number; defense?: number }) => {
    if (hitCount >= maxHits) return;
    if (Math.abs(enemy.x - hitX) > hitRadius) return;
    let dmg = p.damage;
    if (enemy.defense) dmg = Math.max(1, dmg - enemy.defense);
    if (ts.boss && enemy === ts.boss) dmg = absorbBossShield(ts.boss, dmg);
    enemy.health -= dmg;
    enemy.lastDamageTime = ts.frame;
    if (p.crit) {
      ts.particles.push(makeCritParticle(enemy.x + 12, GROUND_Y - 30, dmg));
    } else {
      ts.particles.push(makeParticle(enemy.x + 12, GROUND_Y - 30, `-${dmg}`, '#7f7'));
    }
    hitCount++;
  };

  for (const e of ts.enemies) applyHit(e);
  if (hitCount < maxHits) for (const a of ts.enemyArchers) applyHit(a);
  if (hitCount < maxHits) for (const w of ts.enemyWraiths) applyHit(w as any);
  if (hitCount < maxHits) for (const hd of ts.enemyHounds) { if (!(hd.lungeTimer && hd.lungeTimer > 0)) applyHit(hd); }
  if (hitCount < maxHits) for (const l of ts.enemyLichs) applyHit(l);
  if (hitCount < maxHits) for (const sa of ts.enemyShadowAssassins) { if (sa.stealthTimer <= 0) applyHit(sa); }
  if (hitCount < maxHits) for (const fc of ts.enemyFlameCallers) applyHit(fc);
  if (hitCount < maxHits) for (const cs of ts.enemyCorruptedSentinels) applyHit(cs as any);
  if (hitCount < maxHits) for (const dr of ts.enemyDungeonRats) applyHit(dr);
  if (hitCount < maxHits) for (const fi of ts.enemyFireImps) applyHit(fi);
  if (hitCount < maxHits) for (const ck of ts.enemyCursedKnights) applyHit(ck as any);
  if (hitCount < maxHits && ts.boss && ts.boss.health > 0) applyHit(ts.boss);

  return hitCount === 0; // false = consumed (hit something), true = keep alive (missed)
}

function handleHeroArrowHit(ts: TickState, p: { x: number; y: number; targetX: number; damage: number }): boolean {
  if (p.x < p.targetX - 10) return true; // not yet arrived (arrow still approaching)
  if (p.x > p.targetX + 50) return false; // overshot

  const hitX = p.targetX;
  const hitRadius = 25;
  let hit = false;

  const applyHit = (enemy: { x: number; health: number; maxHealth: number; lastDamageTime?: number; markedTimer?: number; poisonStacks?: number; poisonTimer?: number; lastHitByHero?: boolean; defense?: number }) => {
    if (hit) return;
    if (Math.abs(enemy.x - hitX) > hitRadius) return;
    let dmg = p.damage;
    if ((enemy.markedTimer || 0) > 0) dmg = Math.floor(dmg * 1.3);
    if (enemy.defense) dmg = Math.max(1, dmg - enemy.defense);
    if (ts.boss && enemy === ts.boss) dmg = absorbBossShield(ts.boss, dmg);
    enemy.health -= dmg;
    enemy.lastDamageTime = ts.frame;
    enemy.lastHitByHero = true;
    // Poison Tips: apply DOT
    if (tickHasSkill(ts, 'poisonTips')) {
      enemy.poisonStacks = Math.min(5, (enemy.poisonStacks || 0) + 1);
      enemy.poisonTimer = 300; // 5 seconds
    }
    const critText = dmg > p.damage ? ' CRIT!' : '';
    ts.particles.push(makeParticle(enemy.x + 12, GROUND_Y - 30, `-${dmg}${critText}`, '#4a8f3f'));
    hit = true;
  };

  // Check all enemy types
  for (const e of ts.enemies) applyHit(e);
  if (!hit) for (const a of ts.enemyArchers) applyHit(a);
  if (!hit) for (const w of ts.enemyWraiths) applyHit(w);
  if (!hit) for (const hd of ts.enemyHounds) { if (!(hd.lungeTimer && hd.lungeTimer > 0)) applyHit(hd); }
  if (!hit) for (const l of ts.enemyLichs) applyHit(l);
  if (!hit && ts.boss && ts.boss.health > 0) applyHit(ts.boss);

  return !hit; // false = consumed, true = keep alive
}

/** @deprecated — cooldowns now handled by skill system (processSkillCooldowns) */
export function processCooldowns(_ts: TickState): void {
  // No-op: fireball/recall cooldowns replaced by heroSkills.skillCooldowns
}

/** Auto-cast fireball when enabled and ready */
export function processAutoFireball(ts: TickState): void {
  if (!ts.autoFireball) return;
  const heroLevel = ts.runUpgrades?.hero || 0;
  if (heroLevel < 6) return;
  if ((ts.hero.fireballCooldown || 0) < 600) return;

  const hero = ts.hero;
  const fireballDamage = Math.floor(hero.damage * 1.2);
  const target = ts.enemies.find(e => e.x - hero.x > 50 && e.x - hero.x < 230) ||
    ts.enemyArchers.find(a => a.x - hero.x > 50 && a.x - hero.x < 230) ||
    ts.enemyWraiths.find(w => w.x - hero.x > 50 && w.x - hero.x < 230) ||
    ts.enemyHounds.find(hd => hd.x - hero.x > 50 && hd.x - hero.x < 230 && !(hd.lungeTimer && hd.lungeTimer > 0)) ||
    ts.enemyLichs.find(l => l.x - hero.x > 50 && l.x - hero.x < 230) ||
    (ts.boss && ts.boss.health > 0 && ts.boss.x - hero.x > 50 && ts.boss.x - hero.x < 230 ? ts.boss : null);

  if (!target) return;

  hero.fireballCooldown = 0;
  ts.projectiles.push({ id: uid(), x: hero.x + 20, y: hero.y + 5, targetX: target.x, speed: -10, damage: fireballDamage, type: 'fireball', aoeRadius: 51 });
}

/** Move projectiles and remove expired ones */
export function processProjectileMovement(ts: TickState): void {
  let write = 0;
  for (let i = 0; i < ts.projectiles.length; i++) {
    const p = ts.projectiles[i];
    // Move
    if (p.type === 'laser' || p.type === 'spectralBlast' || p.type === 'healBeam' || p.type === 'darkHeal' || p.type === 'chainLightning') {
      p.duration = (p.duration ?? 30) - 1;
    } else if (p.type === 'meteorStrike') {
      p.delayFrames = (p.delayFrames ?? 0) - 1;
      p.duration = (p.duration ?? 60) - 1;
    } else if (p.type === 'bombardShot' && p.startX !== undefined) {
      p.x -= p.speed;
      const totalDist = p.targetX - p.startX;
      const t = totalDist !== 0 ? Math.min(1, Math.max(0, (p.x - p.startX) / totalDist)) : 1;
      const arcH = p.arcHeight || 85;
      p.y = (p.startY ?? GROUND_Y - 10) + arcH * 4 * t * (t - 1);
    } else {
      p.x -= p.speed;
    }
    // Cull
    let alive = true;
    if (p.type === 'laser' || p.type === 'spectralBlast' || p.type === 'healBeam' || p.type === 'darkHeal' || p.type === 'chainLightning' || p.type === 'meteorStrike') {
      alive = (p.duration ?? 0) > 0;
    } else if (p.type === 'arrow') {
      alive = p.x > p.targetX - 100 && p.x > 0 && p.x < 100000;
    } else if (p.type === 'allyArrow') {
      alive = p.x < p.targetX + 100 && p.x > 0;
    } else if (p.type === 'bombardShot') {
      alive = p.x < p.targetX + 10;
    } else {
      alive = p.x > 0 && p.x < 100000;
    }
    if (alive) ts.projectiles[write++] = p;
  }
  ts.projectiles.length = write;
}

/** Check projectile collisions with hero and allies */
export function processProjectileHits(ts: TickState): void {
  const { hero } = ts;
  const allies = ts.nonPetAllies;

  ts.projectiles = ts.projectiles.filter(p => {
    // Ally arrows: check collision with enemies on arrival
    if (p.type === 'allyArrow') return handleAllyArrowHit(ts, p);
    if (p.type === 'clericBolt') return handleClericBoltHit(ts, p);
    if (p.type === 'wizardBeam') return handleWizardBeamHit(ts, p);
    if (p.type === 'fireball') return handleFireballHit(ts, p);
    if (p.type === 'crystalBolt') return handleCrystalBoltHit(ts, p);

    // Bombard shot: AOE splash damage on landing
    if (p.type === 'bombardShot') {
      if (p.x < p.targetX - 5) return true; // still in flight
      const splashR = p.aoeRadius || 38;
      const hitX = p.targetX;
      let hitCount = 0;
      const su = ts.shardUpgrades;
      const shrapnel = su.bombard_shrapnel > 0 && Math.random() < 0.5;
      const bleedDmg = shrapnel ? Math.max(1, Math.floor(p.damage * 0.15)) : 0;
      forEachEnemy(ts, (enemy: any) => {
        if (enemy.stealthTimer !== undefined && enemy.stealthTimer > 0) return;
        if (Math.abs(enemy.x - hitX) > splashR) return;
        let dmg = p.damage;
        if ((enemy.markedTimer || 0) > 0) dmg = Math.floor(dmg * 1.3);
        if (enemy.defense) dmg = Math.max(1, dmg - enemy.defense);
        if (enemy === ts.boss) dmg = absorbBossShield(ts.boss!, dmg);
        enemy.health -= dmg;
        enemy.lastDamageTime = ts.frame;
        if (shrapnel) { enemy.burnTimer = 240; enemy.burnDamage = bleedDmg; }
        hitCount++;
      });
      const label = shrapnel ? `💥🩸-${p.damage}` : (hitCount > 0 ? `💥-${p.damage}` : '💥');
      ts.particles.push(makeParticle(hitX, GROUND_Y - 30, label, shrapnel ? '#cc2222' : '#8b6914'));
      return false;
    }

    if (p.type === 'heroArrow') return handleHeroArrowHit(ts, p);
    if (p.type === 'healBeam' || p.type === 'darkHeal') return (p.duration ?? 0) > 0;
    if (p.type === 'laser' || p.type === 'spectralBlast') return true;
    // Ice ball: AOE damage + slow on arrival (barricade blocks it)
    if (p.type === 'iceball') {
      const iceBarricade = ts.barricades[0];
      if (iceBarricade && Math.abs(p.x - iceBarricade.x) < 18) {
        iceBarricade.health -= Math.max(1, p.damage - iceBarricade.defense);
        return false;
      }
      if (p.x <= p.targetX + 10) {
        const aoeRadius = 60;
        if (Math.abs(hero.x - p.targetX) < aoeRadius) {
          const dmg = dealDamageToHero(ts, p.damage, ' \u2744\uFE0F', '#88ccff');
          if (dmg > 0) hero.slowTimer = 180;
        }
        allies.forEach(a => {
          if (Math.abs(a.x - p.targetX) < aoeRadius) {
            dealDamageToAlly(ts, a, p.damage, ' ❄️', '#88ccff');
            if (!tryAbsorbDebuff(ts, a)) a.slowTimer = 180;
          }
        });
        // Hit crystal turrets in AOE
        ts.crystalTurrets.forEach(t => {
          if (t.health > 0 && Math.abs(t.x - p.targetX) < aoeRadius) {
            t.health -= Math.max(1, p.damage - t.defense);
            if (t.health <= 0) ts.particles.push(makeParticle(t.x, t.y - 10, '💎💥', '#55ddcc'));
          }
        });
        return false;
      }
      return true;
    }

    // Hit barricade? (enemy projectiles moving left hit the watchtower)
    const barricade = ts.barricades[0];
    if (barricade && p.speed > 0 && Math.abs(p.x - barricade.x) < 18) {
      barricade.health -= Math.max(1, p.damage - barricade.defense);
      return false;
    }

    // Hit hero?
    if (Math.abs(p.x - hero.x) < 25 && Math.abs(p.y - hero.y) < 30) {
      const heroColor = p.type === 'boss' ? '#ff0000' : '#ffaa00';
      dealDamageToHero(ts, p.damage, '', heroColor);
      return false;
    }

    // Hit ally?
    const hitAlly = allies.find(a => Math.abs(p.x - a.x) < 20 && Math.abs(p.y - a.y) < 25);
    if (hitAlly && p.damage > 0) {
      // Apprentice shield: absorb first hit completely
      if ((hitAlly.shieldHP || 0) > 0) {
        hitAlly.shieldHP = 0;
        ts.particles.push(makeParticle(hitAlly.x + 10, hitAlly.y, '🛡️ BLOCKED', '#a855f7'));
        return false;
      }
      // Knight bulwark: invulnerable during active window
      if ((hitAlly.bulwarkActive || 0) > 0) {
        ts.particles.push(makeParticle(hitAlly.x + 10, hitAlly.y, '🛡️ BULWARK', '#ffd700'));
        return false;
      }
      // Archer distance: 20% dodge chance, leap back
      const su = ts.shardUpgrades;
      if (hitAlly.unitType === 'archer' && su.archer_distance > 0 && (hitAlly.dodgeCooldown || 0) <= 0 && Math.random() < 0.2) {
        hitAlly.x -= hitAlly.attackRange;
        hitAlly.dodgeCooldown = 120;
        ts.particles.push(makeParticle(hitAlly.x + 10, hitAlly.y, '💨 DODGE', '#7fff4a'));
        return false;
      }
      const allyColor = p.type === 'boss' ? '#ff0000' : '#ffaa00';
      dealDamageToAlly(ts, hitAlly, p.damage, '', allyColor);
      return false;
    }

    // Hit crystal turret? (enemy projectiles)
    if (p.speed > 0) {
      const hitTurret = ts.crystalTurrets.find(t => t.health > 0 && Math.abs(p.x - t.x) < 18);
      if (hitTurret) {
        hitTurret.health -= Math.max(1, p.damage - hitTurret.defense);
        if (hitTurret.health <= 0) {
          ts.particles.push(makeParticle(hitTurret.x, hitTurret.y - 10, '💎💥', '#55ddcc'));
        }
        return false;
      }
    }

    return true;
  });
}

/** Hero's Edge dagger synergy (econPair4): auto-throw a dagger every 2s at closest enemy within 200px */
export function processHeroEdgeDagger(ts: TickState): void {
  if (!tickHasSynergy(ts, 'econPair4')) return;
  // Auto-throw dagger every 2s (120 ticks)
  ts.hero.daggerCooldown = (ts.hero.daggerCooldown || 0) + 1;
  if (ts.hero.daggerCooldown < 120) return;

  // Find closest enemy within 200px
  let closestX = -1;
  let closestDist = 200;
  const checkEnemy = (e: { x: number; y: number; health: number }) => {
    if (e.health <= 0) return;
    const d = e.x - ts.hero.x;
    if (d > 0 && d < closestDist) { closestDist = d; closestX = e.x; }
  };
  ts.enemies.forEach(checkEnemy);
  ts.enemyArchers.forEach(checkEnemy);
  if (ts.boss && ts.boss.health > 0) checkEnemy(ts.boss);

  if (closestX < 0) return;
  ts.hero.daggerCooldown = 0;
  const dmg = Math.floor(ts.hero.damage * 1.5);
  ts.projectiles.push({ id: uid(), x: ts.hero.x + 20, y: ts.hero.y + 5, targetX: closestX, speed: -12, damage: dmg, type: 'heroArrow' });
}

/** Fireball+ relic: removed */
export function processRelicFireball(_ts: TickState): void {
  // Relic removed — function kept as no-op for compatibility
}
