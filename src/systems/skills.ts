import { SKILL_UNLOCK_LEVELS, SKILL_POOL, getSkillDef } from '../skills';
import { getClassDef } from '../classes';
import { GROUND_Y } from '../constants';
import { makeParticle, makeCritParticle, uid } from '../utils/helpers';
import type { TickState } from './tickState';
import { tickHasSkill, tickSkillBuffActive, forEachEnemy, absorbBossShield } from './tickState';

/** Tick UP all equipped active/triggered skill cooldowns toward their max */
export function processSkillCooldowns(ts: TickState): void {
  for (const skillId of ts.heroSkills.equippedSkills) {
    const def = getSkillDef(skillId);
    if (!def || def.cooldownFrames <= 0) continue;
    const current = ts.heroSkills.skillCooldowns[skillId] || 0;
    if (current < def.cooldownFrames) {
      ts.heroSkills.skillCooldowns[skillId] = current + 1;
    }
  }
}

/** Count DOWN all active buff timers */
export function processSkillBuffTimers(ts: TickState): void {
  for (const skillId of Object.keys(ts.heroSkills.skillBuffTimers)) {
    if (ts.heroSkills.skillBuffTimers[skillId] > 0) {
      ts.heroSkills.skillBuffTimers[skillId]--;
    }
  }
}

/** Check if hero level crossed a skill unlock threshold, offer choose-1-of-3 */
export function processSkillUnlockCheck(ts: TickState): void {
  const heroLevel = ts.runUpgrades?.hero || 0;
  const currentSlots = ts.heroSkills.equippedSkills.length;
  let slotsForLevel = 0;
  for (const threshold of SKILL_UNLOCK_LEVELS) {
    if (heroLevel >= threshold) slotsForLevel++;
  }
  if (slotsForLevel > currentSlots && !ts.pendingSkillChoice) {
    const classDef = getClassDef(ts.heroClass);
    const available = SKILL_POOL.filter(s => classDef.skillPoolIds.includes(s.id) && !ts.heroSkills.equippedSkills.includes(s.id));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    ts.pendingSkillChoice = shuffled.slice(0, 3).map(s => s.id);
  }
}

/** Bloodlust: +2 hero dmg per kill stack (max 10), decay 1 stack per 5s without kills */
export function processBloodlust(ts: TickState): void {
  if (!tickHasSkill(ts, 'bloodlust')) return;
  if (ts.killsThisTick > 0) {
    ts.heroSkills.bloodlustStacks = Math.min(10, ts.heroSkills.bloodlustStacks + ts.killsThisTick);
    ts.heroSkills.bloodlustLastKillFrame = ts.frame;
  }
  if (ts.heroSkills.bloodlustStacks > 0 && ts.frame - ts.heroSkills.bloodlustLastKillFrame >= 300) {
    ts.heroSkills.bloodlustStacks--;
    ts.heroSkills.bloodlustLastKillFrame = ts.frame;
  }
}

/** Second Wind: auto-heal hero to 70% HP when hitting 20% threshold */
export function processSecondWind(ts: TickState): void {
  if (!tickHasSkill(ts, 'secondWind')) return;
  const cd = ts.heroSkills.skillCooldowns['secondWind'] || 0;
  const def = getSkillDef('secondWind')!;
  if (cd < def.cooldownFrames) return;
  if (ts.hero.health <= ts.hero.maxHealth * 0.2 && ts.hero.health > 0) {
    ts.hero.health = Math.floor(ts.hero.maxHealth * 0.7);
    ts.heroSkills.skillCooldowns['secondWind'] = 0;
    ts.particles.push(makeParticle(ts.hero.x, ts.hero.y - 30, '💨 SECOND WIND!', '#44aaff'));
  }
}

/** Auto-cast Weapon Throw when autoFireball is enabled */
export function processAutoWeaponThrow(ts: TickState): void {
  if (!ts.autoFireball) return;
  if (!tickHasSkill(ts, 'weaponThrow')) return;
  const cd = ts.heroSkills.skillCooldowns['weaponThrow'] || 0;
  if (cd < 600) return;

  const hero = ts.hero;
  const fireballDamage = Math.floor(hero.damage * 1.2);
  const target = ts.enemies.find(e => e.x - hero.x > 50 && e.x - hero.x < 230) ||
    ts.enemyArchers.find(a => a.x - hero.x > 50 && a.x - hero.x < 230) ||
    ts.enemyWraiths.find(w => w.x - hero.x > 50 && w.x - hero.x < 230) ||
    ts.enemyHounds.find(hd => hd.x - hero.x > 50 && hd.x - hero.x < 230 && !(hd.lungeTimer && hd.lungeTimer > 0)) ||
    ts.enemyLichs.find(l => l.x - hero.x > 50 && l.x - hero.x < 230) ||
    (ts.boss && ts.boss.health > 0 && ts.boss.x - hero.x > 50 && ts.boss.x - hero.x < 230 ? ts.boss : null);
  if (!target) return;

  ts.heroSkills.skillCooldowns['weaponThrow'] = 0;
  ts.projectiles.push({ id: uid(), x: hero.x + 20, y: hero.y + 5, targetX: target.x, speed: -10, damage: fireballDamage, type: 'fireball', aoeRadius: 51 });
}

/** Auto-cast Power Shot when autoFireball is enabled (Ranger) */
export function processAutoPowerShot(ts: TickState): void {
  if (!ts.autoFireball) return;
  if (!tickHasSkill(ts, 'powerShot')) return;
  const cd = ts.heroSkills.skillCooldowns['powerShot'] || 0;
  if (cd < 480) return;

  const hero = ts.hero;
  const range = 230;
  // Find furthest enemy in range
  const allTargets: Array<{ x: number; health: number; maxHealth: number }> = [];
  forEachEnemy(ts, (e: any) => {
    if (e.x - hero.x > 30 && e.x - hero.x < range && !(e.lungeTimer && e.lungeTimer > 0)) allTargets.push(e);
  });
  if (allTargets.length === 0) return;

  // Furthest target
  allTargets.sort((a, b) => b.x - a.x);
  const target = allTargets[0];

  ts.heroSkills.skillCooldowns['powerShot'] = 0;
  const shotDmg = Math.floor(hero.damage * 3);
  ts.projectiles.push({ id: uid(), x: hero.x + 20, y: hero.y + 5, targetX: target.x, speed: -8, damage: shotDmg, type: 'heroArrow' });
  ts.particles.push(makeParticle(hero.x + 30, hero.y - 10, '\u{1F3AF} POWER SHOT!', '#6aaf5f'));
}

/** Poison DOT: tick damage on poisoned enemies */
export function processPoisonTicks(ts: TickState): void {
  const tick = (e: { health: number; maxHealth: number; poisonStacks?: number; poisonTimer?: number }) => {
    if ((e.poisonStacks || 0) > 0 && (e.poisonTimer || 0) > 0) {
      e.poisonTimer!--;
      // 0.8% maxHP per second per stack = per frame
      const dmg = Math.max(1, Math.floor(e.maxHealth * 0.008 * e.poisonStacks! / 60));
      e.health -= dmg;
      if (e.poisonTimer! <= 0) {
        e.poisonStacks = 0;
      }
    }
  };
  forEachEnemy(ts, tick);
}

/** Decrement marked timers on all enemies */
export function processMarkedTimers(ts: TickState): void {
  forEachEnemy(ts, (e: any) => {
    if ((e.markedTimer || 0) > 0) e.markedTimer--;
  });
}

/** Bird's Eye: while buff active, 10% chance per second to mark each enemy */
export function processBirdsEye(ts: TickState): void {
  if (!tickSkillBuffActive(ts, 'birdsEye')) return;
  const chancePerFrame = 0.10 / 60;
  forEachEnemy(ts, (e: any) => {
    if (!e.markedTimer || e.markedTimer <= 0) {
      if (Math.random() < chancePerFrame) {
        e.markedTimer = 600; // 10s mark
      }
    }
  });
}

/** Snare Trap: while buff active, root enemies near hero */
export function processSnareTrap(ts: TickState): void {
  if (!tickSkillBuffActive(ts, 'snareTrap')) return;
  forEachEnemy(ts, (e: any) => {
    if (Math.abs(e.x - ts.hero.x) < 90) {
      e.rootTimer = Math.max(e.rootTimer || 0, 180); // 3s root
    }
  });
}

/** Process manual skill uses from UI — drains pendingSkillUses queue */
export function processManualSkillUses(ts: TickState): void {
  if (!ts.pendingSkillUses || ts.pendingSkillUses.length === 0) return;
  const pending = [...ts.pendingSkillUses];
  ts.pendingSkillUses = [];
  // Process by temporarily pushing into autoSkills (reuses same logic)
  for (const skillId of pending) {
    if (!tickHasSkill(ts, skillId)) continue;
    const def = getSkillDef(skillId);
    if (!def || def.cooldownFrames <= 0) continue;
    const cd = ts.heroSkills.skillCooldowns[skillId] || 0;
    if (cd < def.cooldownFrames) continue;
    // Execute skill using same logic as autoSkills
    executeSkill(ts, skillId, def);
  }
}

/** Execute a single skill — shared by auto-cast and manual use */
function executeSkill(ts: TickState, skillId: string, def: ReturnType<typeof getSkillDef>): boolean {
  if (!def) return false;
  const hero = ts.hero;

  // Weapon Throw: find target, shoot projectile
  if (skillId === 'weaponThrow') {
    const fireballDamage = Math.floor(hero.damage * 1.2);
    const target = findNearestEnemy(ts, 50, 230);
    if (!target) return false;
    ts.heroSkills.skillCooldowns[skillId] = 0;
    ts.projectiles.push({ id: uid(), x: hero.x + 20, y: hero.y + 5, targetX: target.x, speed: -10, damage: fireballDamage, type: 'fireball', aoeRadius: 51 });
    return true;
  }

  // Power Shot: find furthest target, shoot piercing arrow
  if (skillId === 'powerShot') {
    const allTargets: Array<{ x: number }> = [];
    forEachEnemy(ts, (e: any) => {
      if (e.x - hero.x > 30 && e.x - hero.x < 230 && !(e.lungeTimer && e.lungeTimer > 0)) allTargets.push(e);
    });
    if (allTargets.length === 0) return false;
    allTargets.sort((a, b) => b.x - a.x);
    ts.heroSkills.skillCooldowns[skillId] = 0;
    const shotDmg = Math.floor(hero.damage * 3);
    ts.projectiles.push({ id: uid(), x: hero.x + 20, y: hero.y + 5, targetX: allTargets[0].x, speed: -8, damage: shotDmg, type: 'heroArrow' });
    ts.particles.push(makeParticle(hero.x + 30, hero.y - 10, '\u{1F3AF} POWER SHOT!', '#6aaf5f'));
    return true;
  }

  // Volley: AOE damage to all enemies near target
  if (skillId === 'volley') {
    const target = findNearestEnemy(ts, 30, 230);
    if (!target) return false;
    const volleyDmg = Math.floor(hero.damage * 0.7);
    let hitCount = 0;
    forEachEnemy(ts, (e: any) => {
      if (Math.abs(e.x - target.x) < 120) {
        const def2 = e.defense || 0;
        e.health -= Math.max(1, volleyDmg - def2);
        hitCount++;
      }
    });
    if (ts.boss && ts.boss.health > 0 && Math.abs(ts.boss.x - target.x) < 120) { ts.boss.health -= volleyDmg; hitCount++; }
    ts.heroSkills.skillCooldowns[skillId] = 0;
    ts.particles.push(makeParticle(target.x, GROUND_Y - 50, `\u{1F327}\uFE0F VOLLEY! -${volleyDmg}x${hitCount}`, '#5a9f4f'));
    return true;
  }

  // Fall Back: teleport allies to portal + 50% heal
  if (skillId === 'fallBack') {
    const portalX = ts.portalFlagIndex >= 0 ? (ts.flags[ts.portalFlagIndex]?.x || 80) : 80;
    for (const a of ts.allies) { a.x = portalX + Math.random() * 30; a.health = Math.max(a.health, Math.floor(a.maxHealth * 0.5)); }
    ts.heroSkills.skillCooldowns[skillId] = 0;
    ts.particles.push(makeParticle(portalX + 40, GROUND_Y - 60, '\u{1F3C3} FALL BACK!', '#66aaff'));
    return true;
  }

  // Regroup: teleport allies to portal + full heal
  if (skillId === 'regroup') {
    const portalX = ts.portalFlagIndex >= 0 ? (ts.flags[ts.portalFlagIndex]?.x || 80) : 80;
    for (const a of ts.allies) { a.x = portalX + Math.random() * 30; a.health = a.maxHealth; }
    ts.heroSkills.skillCooldowns[skillId] = 0;
    ts.particles.push(makeParticle(portalX + 40, GROUND_Y - 60, '\u{1F300} REGROUPED!', '#4488ff'));
    return true;
  }

  // Thunderstrike: single-target nuke on highest HP enemy (5x dmg)
  if (skillId === 'thunderstrike') {
    let bestTarget: any = null;
    let bestHp = 0;
    forEachEnemy(ts, (e: any) => {
      if (e.health > bestHp && e.x - hero.x > 0 && e.x - hero.x < 300) {
        bestHp = e.health; bestTarget = e;
      }
    });
    if (ts.boss && ts.boss.health > 0 && ts.boss.health > bestHp && ts.boss.x - hero.x > 0 && ts.boss.x - hero.x < 300) {
      bestTarget = ts.boss;
    }
    if (!bestTarget) return false;
    let dmg = Math.floor(hero.damage * 5);
    if (bestTarget.defense) dmg = Math.max(1, dmg - bestTarget.defense);
    if (ts.boss && bestTarget === ts.boss) dmg = absorbBossShield(ts.boss, dmg);
    bestTarget.health -= dmg;
    bestTarget.lastDamageTime = ts.frame;
    ts.heroSkills.skillCooldowns[skillId] = 0;
    ts.particles.push(makeParticle(bestTarget.x, (bestTarget.y || GROUND_Y - 15) - 15, `\u26A1 THUNDERSTRIKE! -${dmg}`, '#aa77ee'));
    ts.projectiles.push({
      id: uid(), x: bestTarget.x, y: 0, targetX: bestTarget.x,
      speed: 0, damage: 0, type: 'chainLightning', duration: 25,
      chainTargets: [{ x: bestTarget.x, y: 0 }, { x: bestTarget.x, y: (bestTarget.y || GROUND_Y - 15) + ((bestTarget as any).lane || 0) }],
    });
    return true;
  }

  // Channel Ignite: start channeling burn DOT
  if (skillId === 'channelIgnite') {
    if ((hero.channeling || 0) > 0) return false;
    hero.channeling = 480;
    hero.channelingSkill = 'channelIgnite';
    ts.heroSkills.skillCooldowns[skillId] = 0;
    ts.heroSkills.skillBuffTimers[skillId] = 480;
    ts.particles.push(makeParticle(hero.x, hero.y - 30, '\u{1F525} IGNITE!', '#ee6622'));
    return true;
  }

  // Channel Blizzard: start channeling slow
  if (skillId === 'channelBlizzard') {
    if ((hero.channeling || 0) > 0) return false;
    hero.channeling = 600;
    hero.channelingSkill = 'channelBlizzard';
    ts.heroSkills.skillCooldowns[skillId] = 0;
    ts.heroSkills.skillBuffTimers[skillId] = 600;
    ts.particles.push(makeParticle(hero.x, hero.y - 30, '\u2744\uFE0F BLIZZARD!', '#66aaee'));
    return true;
  }

  // Summon Meteor: start channeling, nuke on completion
  if (skillId === 'summonMeteor') {
    if ((hero.channeling || 0) > 0) return false;
    hero.channeling = 300;
    hero.channelingSkill = 'summonMeteor';
    ts.heroSkills.skillCooldowns[skillId] = 0;
    ts.heroSkills.skillBuffTimers[skillId] = 300;
    ts.particles.push(makeParticle(hero.x, hero.y - 30, '\u2604\uFE0F SUMMONING METEOR...', '#ee6622'));
    return true;
  }

  // Barrier: shield whole army with 20% maxHP barrier for 8s
  if (skillId === 'barrier') {
    ts.hero.invulnTimer = Math.max(ts.hero.invulnTimer || 0, 0);
    for (const a of ts.allies) {
      a.barrierHp = Math.floor(a.maxHealth * 0.2);
      a.barrierTimer = 480;
    }
    ts.heroSkills.skillCooldowns[skillId] = 0;
    ts.heroSkills.skillBuffTimers[skillId] = 480;
    ts.particles.push(makeParticle(hero.x, hero.y - 30, '\u{1F6E1}\uFE0F BARRIER!', '#6688ee'));
    return true;
  }

  // Blink: teleport to flag + full heal
  if (skillId === 'blink') {
    const portalX = ts.portalFlagIndex >= 0 ? (ts.flags[ts.portalFlagIndex]?.x || 80) : 80;
    ts.particles.push(makeParticle(hero.x, hero.y - 10, '\u{1F4AB}', '#aa77ee'));
    hero.x = portalX;
    hero.health = hero.maxHealth;
    ts.heroSkills.skillCooldowns[skillId] = 0;
    ts.particles.push(makeParticle(hero.x, hero.y - 30, '\u{1F4AB} BLINK!', '#aa77ee'));
    return true;
  }

  // Production Magic: conjure a gold chest
  if (skillId === 'productionMagic') {
    const goldAmount = Math.floor(50 + (ts.currentZone || 0) * 30);
    ts.chests.push({ id: uid(), x: hero.x + 20, y: GROUND_Y - 10, type: 'gold', value: goldAmount, age: 0 });
    ts.heroSkills.skillCooldowns[skillId] = 0;
    ts.particles.push(makeParticle(hero.x, hero.y - 30, `\u{1F4B0} +${goldAmount}g`, '#eebb22'));
    return true;
  }

  // Buff skills: just activate the buff timer
  if (def.buffFrames > 0) {
    ts.heroSkills.skillBuffTimers[skillId] = def.buffFrames;
    ts.heroSkills.skillCooldowns[skillId] = 0;
    ts.particles.push(makeParticle(hero.x, hero.y - 30, `${def.icon} ${def.name}!`, def.buttonColorReady));
    return true;
  }

  return false;
}

/** Generic auto-cast: fires any skill in autoSkills when its cooldown is ready */
export function processAutoSkills(ts: TickState): void {
  if (ts.autoSkills.length === 0) return;
  for (const skillId of ts.autoSkills) {
    if (!tickHasSkill(ts, skillId)) continue;
    const def = getSkillDef(skillId);
    if (!def || def.cooldownFrames <= 0) continue;
    const cd = ts.heroSkills.skillCooldowns[skillId] || 0;
    if (cd < def.cooldownFrames) continue;
    executeSkill(ts, skillId, def);
  }
}

/** Find nearest enemy in range of hero */
function findNearestEnemy(ts: TickState, minDist: number, maxDist: number): { x: number } | null {
  let best: { x: number } | null = null;
  let bestDist = Infinity;
  forEachEnemy(ts, (e: any) => {
    const d = e.x - ts.hero.x;
    if (d > minDist && d < maxDist && !(e.lungeTimer && e.lungeTimer > 0) && !(e.stealthTimer && e.stealthTimer > 0)) {
      if (d < bestDist) { bestDist = d; best = e; }
    }
  });
  if (ts.boss && ts.boss.health > 0) {
    const d = ts.boss.x - ts.hero.x;
    if (d > minDist && d < maxDist && d < bestDist) best = ts.boss;
  }
  return best;
}

/** Nature's Grace: auto-heal at 30% HP + invulnerability */
export function processNaturesGrace(ts: TickState): void {
  if (!tickHasSkill(ts, 'naturesGrace')) return;
  if (!ts.heroSkills.naturesGraceAvailable) return;
  const cd = ts.heroSkills.skillCooldowns['naturesGrace'] || 0;
  const def = getSkillDef('naturesGrace')!;
  if (cd < def.cooldownFrames) return;
  if (ts.hero.health <= ts.hero.maxHealth * 0.3 && ts.hero.health > 0) {
    ts.hero.health = Math.floor(ts.hero.maxHealth * 0.5);
    ts.hero.invulnTimer = 120; // 2 seconds
    ts.heroSkills.naturesGraceAvailable = false;
    ts.heroSkills.skillCooldowns['naturesGrace'] = 0;
    ts.particles.push(makeParticle(ts.hero.x, ts.hero.y - 30, '\u{1F33F} NATURE\'S GRACE!', '#4aaf6f'));
  }
}

// ---- Mage skill processors ----

/** Mana Shield: at 30% HP, activate 3-charge shield that absorbs hits */
export function processManaShield(ts: TickState): void {
  if (!tickHasSkill(ts, 'manaShield')) return;
  const hero = ts.hero;

  // If charges are active, nothing to do here (absorption handled in dealDamageToHero)
  if ((hero.manaShieldCharges || 0) > 0) return;

  // Check if cooldown is ready to arm the shield
  const cd = ts.heroSkills.skillCooldowns['manaShield'] || 0;
  const def = getSkillDef('manaShield')!;
  if (cd < def.cooldownFrames) return;

  // Trigger at 30% HP
  if (hero.health > 0 && hero.health <= hero.maxHealth * 0.3 && (hero.manaShieldReady !== false)) {
    hero.manaShieldCharges = 3;
    hero.manaShieldReady = false;
    ts.heroSkills.skillCooldowns['manaShield'] = 0; // start CD for next activation
    ts.particles.push(makeParticle(hero.x, hero.y - 30, '\u{1F52E} MANA SHIELD! (3)', '#8866cc'));
  }
}

/** Process channeling tick — apply channel effects each frame */
export function processChanneling(ts: TickState): void {
  const hero = ts.hero;
  if ((hero.channeling || 0) <= 0) return;

  hero.channeling!--;
  const skill = hero.channelingSkill;

  if (skill === 'channelIgnite') {
    // Apply burn DOT to all enemies within 400px every 30 frames (twice per second)
    if (hero.channeling! % 30 === 0) {
      forEachEnemy(ts, (e: any) => {
        if (Math.abs(e.x - hero.x) < 400 && e.health > 0) {
          e.burnTimer = Math.max(e.burnTimer || 0, 300); // 5s burn
          e.burnDamage = Math.max(e.burnDamage || 0, Math.max(1, Math.floor(e.maxHealth * 0.01)));
        }
      });
      if (ts.boss && ts.boss.health > 0 && Math.abs(ts.boss.x - hero.x) < 400) {
        (ts.boss as any).burnTimer = Math.max((ts.boss as any).burnTimer || 0, 300);
        (ts.boss as any).burnDamage = Math.max((ts.boss as any).burnDamage || 0, Math.max(1, Math.floor(ts.boss.maxHealth * 0.01)));
      }
    }
    // Periodic fire particle
    if (hero.channeling! % 15 === 0) {
      ts.particles.push(makeParticle(hero.x + (Math.random() - 0.5) * 40, hero.y - 5, '\u{1F525}', '#ff6622'));
    }
  }

  if (skill === 'channelBlizzard') {
    // Apply slow to all enemies within 200px every frame
    forEachEnemy(ts, (e: any) => {
      if (Math.abs(e.x - hero.x) < 200 && e.health > 0) {
        e.slowTimer = Math.max(e.slowTimer || 0, 30); // refresh 0.5s slow
      }
    });
    if (ts.boss && ts.boss.health > 0 && Math.abs(ts.boss.x - hero.x) < 200) {
      (ts.boss as any).slowTimer = Math.max((ts.boss as any).slowTimer || 0, 30);
    }
    // Periodic frost particle
    if (hero.channeling! % 20 === 0) {
      ts.particles.push(makeParticle(hero.x + (Math.random() - 0.5) * 40, hero.y - 5, '\u2744\uFE0F', '#88ccff'));
    }
  }

  if (skill === 'summonMeteor') {
    // Charging particles
    if (hero.channeling! % 30 === 0) {
      ts.particles.push(makeParticle(hero.x, hero.y - 20, '\u2604\uFE0F', '#ff8844'));
    }
    // On completion: drop meteor at frontline
    if (hero.channeling! <= 0) {
      // Find frontline position (nearest enemy or next flag)
      let meteorX = hero.x + 150;
      const target = findNearestEnemy(ts, 0, 400);
      if (target) meteorX = target.x;
      const meteorDmg = Math.floor(hero.damage * 3);

      // Spawn visual meteor
      ts.projectiles.push({
        id: uid(), x: meteorX, y: 0, targetX: meteorX,
        speed: 0, damage: meteorDmg, type: 'meteorStrike',
        duration: 30, delayFrames: 0, aoeRadius: 120,
      });

      // Apply AOE damage immediately
      forEachEnemy(ts, (e: any) => {
        if (Math.abs(e.x - meteorX) < 120 && e.health > 0) {
          let dmg = meteorDmg;
          if (e.defense) dmg = Math.max(1, dmg - e.defense);
          e.health -= dmg;
          e.lastDamageTime = ts.frame;
          ts.particles.push(makeParticle(e.x, (e.y || GROUND_Y - 15) - 10, `-${dmg}`, '#ff6622'));
        }
      });
      if (ts.boss && ts.boss.health > 0 && Math.abs(ts.boss.x - meteorX) < 120) {
        let dmg = absorbBossShield(ts.boss, meteorDmg);
        ts.boss.health -= dmg;
        ts.boss.lastDamageTime = ts.frame;
        ts.particles.push(makeParticle(ts.boss.x, GROUND_Y - 60, `-${dmg}`, '#ff6622'));
      }
      ts.particles.push(makeParticle(meteorX, GROUND_Y - 50, '\u2604\uFE0F METEOR IMPACT!', '#ff4400'));
    }
  }

  // Clear channeling when done
  if (hero.channeling! <= 0) {
    hero.channeling = 0;
    hero.channelingSkill = '';
  }
}

/** Arcane Familiar: passive auto-attacking familiar */
export function processArcaneFamiliar(ts: TickState): void {
  if (!tickHasSkill(ts, 'arcaneFamiliar')) return;
  const hero = ts.hero;

  // Position familiar near hero
  hero.familiarX = hero.x + 30;

  // Attack timer
  hero.familiarCooldown = (hero.familiarCooldown || 0) + 1;
  if (hero.familiarCooldown < 60) return; // 1s attack rate

  // Find closest enemy within 150px of familiar
  const famX = hero.familiarX;
  let bestTarget: any = null;
  let bestDist = 150;
  forEachEnemy(ts, (e: any) => {
    if (e.health <= 0) return;
    const d = Math.abs(e.x - famX);
    if (d < bestDist) { bestDist = d; bestTarget = e; }
  });
  if (ts.boss && ts.boss.health > 0 && Math.abs(ts.boss.x - famX) < bestDist) {
    bestTarget = ts.boss;
  }
  if (!bestTarget) return;

  hero.familiarCooldown = 0;
  let dmg = Math.floor(hero.damage * 0.5);
  if (bestTarget.defense) dmg = Math.max(1, dmg - bestTarget.defense);
  if (ts.boss && bestTarget === ts.boss) dmg = absorbBossShield(ts.boss, dmg);
  bestTarget.health -= dmg;
  bestTarget.lastDamageTime = ts.frame;
  ts.particles.push(makeParticle(bestTarget.x, (bestTarget.y || GROUND_Y - 15) - 10, `-${dmg}`, '#bb88ff'));
}

/** Barrier timer: tick down barrier on all allies + hero */
export function processBarrierTimers(ts: TickState): void {
  for (const a of ts.allies) {
    if ((a.barrierTimer || 0) > 0) {
      a.barrierTimer!--;
      if (a.barrierTimer! <= 0) { a.barrierHp = 0; a.barrierTimer = 0; }
    }
  }
}
