// ============================================================
// Pet System — entity spawning, active effects, passive stat bonuses
// ============================================================

import { getPetDef, isPetPassive, type PetEffectType } from '../pets';
import { makeParticle, uid } from '../utils/helpers';
import { GROUND_Y } from '../constants';
import type { TickState } from './tickState';

const PET_GROUND_Y = GROUND_Y - 12; // pets are ~14px tall, feet on ground

/**
 * Process one tick of pet logic — ensure entity exists + active effect cooldowns.
 * Movement is handled in ai.ts alongside other ally AI.
 */
export function processPetTick(ts: TickState): void {
  const petDef = ts.equippedPet ? getPetDef(ts.equippedPet) : null;

  // Remove pet entity if no pet equipped or wrong type
  const existingPet = ts.allies.find(a => a.isPet);
  if (!petDef) {
    if (existingPet) ts.allies = ts.allies.filter(a => !a.isPet);
    return;
  }
  if (existingPet && existingPet.petType !== ts.equippedPet) {
    ts.allies = ts.allies.filter(a => !a.isPet);
  }

  // Ensure pet entity exists — creates one if missing (zone transition, new run, etc.)
  let petAlly = ts.allies.find(a => a.isPet);
  if (!petAlly) {
    petAlly = {
      id: uid(),
      slotIndex: -1,
      unitType: 'pet',
      x: ts.hero.x - 25,
      y: PET_GROUND_Y,
      health: 1,
      maxHealth: 1,
      damage: 0,
      defense: 0,
      speed: 0.5,
      attackRate: 9999,
      attackRange: 0,
      frame: ts.frame,
      attackCooldown: 0,
      lane: 0,
      isPet: true,
      petType: ts.equippedPet,
      slimeDir: 1,
    };
    ts.allies.push(petAlly);
  }

  // Keep pet y on the ground
  petAlly.y = PET_GROUND_Y;
  petAlly.frame = ts.frame;

  // --- Active effects (cooldown-based, excluding 'attack' which is handled by AI) ---
  if (!isPetPassive(petDef.effectType) && petDef.effectType !== 'attack' && petDef.effectCooldown > 0) {
    ts.petCooldown--;
    if (ts.petCooldown <= 0) {
      ts.petCooldown = petDef.effectCooldown;
      fireActiveEffect(ts, petAlly.x, petDef.effectType, petDef.effectValue);
    }
  }

  // --- Passive tick effects (regen) ---
  if (petDef.effectType === 'regen' && ts.frame % 300 === 0) {
    const regenAmount = Math.max(1, Math.floor(ts.hero.maxHealth * (petDef.effectValue / 100)));
    ts.hero.health = Math.min(ts.hero.maxHealth, ts.hero.health + regenAmount);
    ts.particles.push(makeParticle(petAlly.x, ts.hero.y - 10, `+${regenAmount}`, '#44ff44'));
  }
}

function fireActiveEffect(ts: TickState, petX: number, effectType: PetEffectType, effectValue: number): void {
  switch (effectType) {
    case 'goldDrop': {
      const runMinutes = Math.max(1, ts.frame / 3600);
      const goldPerMin = ts.totalGoldEarned / runMinutes;
      const dropAmount = Math.max(1, Math.floor(goldPerMin * (effectValue / 100)));
      ts.goldEarned += dropAmount;
      ts.totalGoldEarned += dropAmount;
      ts.particles.push(makeParticle(petX, ts.hero.y - 5, `+${dropAmount}g`, '#ffd700'));
      break;
    }
    case 'gemDrop': {
      ts.gemsThisRun += effectValue;
      ts.particles.push(makeParticle(petX, ts.hero.y - 5, `+${effectValue}\u{1F48E}`, '#a855f7'));
      break;
    }
    case 'heal': {
      const healAmount = Math.max(1, Math.floor(ts.hero.maxHealth * (effectValue / 100)));
      ts.hero.health = Math.min(ts.hero.maxHealth, ts.hero.health + healAmount);
      ts.particles.push(makeParticle(petX, ts.hero.y - 5, `+${healAmount}\u2764`, '#ff4444'));
      break;
    }
  }
}

/**
 * Get passive stat bonuses from the equipped pet.
 * Called during hero stat calculation.
 */
export function getPetPassiveBonuses(equippedPetId: string): {
  maxHpPercent: number;
  moveSpeed: number;
  defense: number;
  goldBonus: number;
  attackSpeed: number;
  slowAura: number;
  slowOnHitChance: number;
} {
  const defaults = { maxHpPercent: 0, moveSpeed: 0, defense: 0, goldBonus: 0, attackSpeed: 0, slowAura: 0, slowOnHitChance: 0 };
  if (!equippedPetId) return defaults;
  const petDef = getPetDef(equippedPetId);
  if (!petDef) return defaults;

  switch (petDef.effectType) {
    case 'maxHpPercent': return { ...defaults, maxHpPercent: petDef.effectValue };
    case 'moveSpeed': return { ...defaults, moveSpeed: petDef.effectValue };
    case 'defense': return { ...defaults, defense: petDef.effectValue };
    case 'goldBonus': return { ...defaults, goldBonus: petDef.effectValue };
    case 'attackSpeed': return { ...defaults, attackSpeed: petDef.effectValue };
    case 'slowAura': return { ...defaults, slowAura: petDef.effectValue };
    case 'slowOnHit': return { ...defaults, slowOnHitChance: petDef.effectValue };
    default: return defaults;
  }
}
