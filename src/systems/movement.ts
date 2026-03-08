import type { TickState } from './tickState';
import { getClassDef } from '../classes';

/** Process hero movement toward target flag, with collision detection */
export function processHeroMovement(ts: TickState): void {
  const { hero, flags, enemies, enemyArchers, enemyWraiths, enemyHounds, boss } = ts;

  // Slow debuff
  if ((hero.slowTimer || 0) > 0) hero.slowTimer!--;
  const slowMult = (hero.slowTimer || 0) > 0 ? 0.5 : 1;

  // Momentum synergy: hero speed bonus from kills
  const momentumBonus = (hero.momentumStacks || 0) * 0.03;
  const effectiveSpeed = (hero.speed + momentumBonus) * slowMult;

  // Build valid positions list
  const homePos = ts.inDungeon && ts.dungeonType === 'wave' ? ts.dungeonArenaLeftX + 80
    : ts.inDungeon && ts.dungeonType === 'timed' ? 40 : 80;

  // During early tutorial (intro/hire), lock hero at home
  const tutStep = (ts.upgrades?.tutorialStep as number) || 0;
  if (tutStep > 0 && tutStep < 3) {
    hero.targetFlagIndex = -1;
    hero.x = homePos;
    return;
  }

  // Channeling lock — mage can't move during channels
  if ((hero.channeling || 0) > 0) return;

  // Hero planted — stay in place, still attacks
  if (hero.planted) return;

  const capturedFlagPositions = flags.filter(f => f.captured).map(f => f.x);
  const nextUncaptured = flags.find(f => !f.captured);
  const validPositions = [homePos, ...capturedFlagPositions];
  if (nextUncaptured) validPositions.push(nextUncaptured.x);
  validPositions.sort((a, b) => a - b);

  // Check if hero is blocked by enemies ahead (melee proximity)
  let heroBlocked =
    enemies.some(e => { const d = e.x - hero.x; return d > 0 && d < 50; }) ||
    enemyArchers.some(a => { const d = a.x - hero.x; return d > 0 && d < 40; }) ||
    enemyWraiths.some(w => { const d = w.x - hero.x; return d > 0 && d < 55; }) ||
    enemyHounds.some(hd => { const d = hd.x - hero.x; return d > 0 && d < 35 && !(hd.lungeTimer && hd.lungeTimer > 0); }) ||
    ts.enemyShadowAssassins.some(sa => { const d = sa.x - hero.x; return d > 0 && d < 40 && sa.stealthTimer <= 0; }) ||
    ts.enemyFlameCallers.some(fc => { const d = fc.x - hero.x; return d > 0 && d < 40; }) ||
    ts.enemyCorruptedSentinels.some(cs => { const d = cs.x - hero.x; return d > 0 && d < 40; }) ||
    ts.enemyDungeonRats.some(dr => { const d = dr.x - hero.x; return d > 0 && d < 40; }) ||
    ts.enemyFireImps.some(fi => { const d = fi.x - hero.x; return d > 0 && d < 40; }) ||
    ts.enemyCursedKnights.some(ck => { const d = ck.x - hero.x; return d > 0 && d < 40; }) ||
    ts.enemyLichs.some(l => { const d = l.x - hero.x; return d > 0 && d < 40; }) ||
    (boss && boss.health > 0 && boss.x - hero.x > 0 && boss.x - hero.x < 70) ||
    ts.iceWalls.some(w => w.health > 0 && w.x - hero.x > 0 && w.x - hero.x < 30);

  // Ranged heroes: also stop when enemies are within attack range
  const classDef = getClassDef(ts.heroClass);
  if (classDef.attackType === 'ranged' && !heroBlocked) {
    const range = classDef.attackRange;
    heroBlocked =
      enemies.some(e => e.x - hero.x > 0 && e.x - hero.x < range) ||
      enemyArchers.some(a => a.x - hero.x > 0 && a.x - hero.x < range) ||
      enemyWraiths.some(w => w.x - hero.x > 0 && w.x - hero.x < range) ||
      enemyHounds.some(hd => hd.x - hero.x > 0 && hd.x - hero.x < range && !(hd.lungeTimer && hd.lungeTimer > 0)) ||
      ts.enemyLichs.some(l => l.x - hero.x > 0 && l.x - hero.x < range) ||
      ts.enemyShadowAssassins.some(sa => sa.x - hero.x > 0 && sa.x - hero.x < range && sa.stealthTimer <= 0) ||
      ts.enemyFlameCallers.some(fc => fc.x - hero.x > 0 && fc.x - hero.x < range) ||
      ts.enemyCorruptedSentinels.some(cs => cs.x - hero.x > 0 && cs.x - hero.x < range) ||
      ts.enemyDungeonRats.some(dr => dr.x - hero.x > 0 && dr.x - hero.x < range) ||
      ts.enemyFireImps.some(fi => fi.x - hero.x > 0 && fi.x - hero.x < range) ||
      ts.enemyCursedKnights.some(ck => ck.x - hero.x > 0 && ck.x - hero.x < range) ||
      !!(boss && boss.health > 0 && boss.x - hero.x > 0 && boss.x - hero.x < range);
  }

  // Check if hero is blocked by enemies behind
  const heroBlockedLeft =
    enemies.some(e => { const d = hero.x - e.x; return d > 0 && d < 50; }) ||
    enemyArchers.some(a => { const d = hero.x - a.x; return d > 0 && d < 40; }) ||
    enemyWraiths.some(w => { const d = hero.x - w.x; return d > 0 && d < 55; }) ||
    enemyHounds.some(hd => { const d = hero.x - hd.x; return d > 0 && d < 35 && !(hd.lungeTimer && hd.lungeTimer > 0); }) ||
    ts.enemyLichs.some(l => { const d = hero.x - l.x; return d > 0 && d < 40; }) ||
    ts.enemyShadowAssassins.some(sa => { const d = hero.x - sa.x; return d > 0 && d < 40 && sa.stealthTimer <= 0; }) ||
    ts.enemyFlameCallers.some(fc => { const d = hero.x - fc.x; return d > 0 && d < 40; }) ||
    ts.enemyCorruptedSentinels.some(cs => { const d = hero.x - cs.x; return d > 0 && d < 40; }) ||
    ts.enemyDungeonRats.some(dr => { const d = hero.x - dr.x; return d > 0 && d < 40; }) ||
    ts.enemyFireImps.some(fi => { const d = hero.x - fi.x; return d > 0 && d < 40; }) ||
    ts.enemyCursedKnights.some(ck => { const d = hero.x - ck.x; return d > 0 && d < 40; }) ||
    (boss && boss.health > 0 && hero.x - boss.x > 0 && hero.x - boss.x < 70);

  // Move toward target flag position
  const portalMinX = ts.portalFlagIndex >= 0 ? (flags[ts.portalFlagIndex]?.x || 40) : 40;
  const heroXBefore = hero.x;

  if (hero.targetFlagIndex >= -1) {
    const targetX = hero.targetFlagIndex === -1 ? homePos :
      (validPositions[hero.targetFlagIndex + 1] || hero.x);
    const dx = targetX - hero.x;

    if (Math.abs(dx) > effectiveSpeed) {
      if ((dx > 0 && !heroBlocked) || (dx < 0 && !heroBlockedLeft)) {
        hero.x += Math.sign(dx) * effectiveSpeed;
      }
    } else {
      hero.x = targetX;
    }
  }

  // Wave dungeon arena bounds enforcement (impassable wall at penultimate flag)
  if (ts.inDungeon && ts.dungeonType === 'wave') {
    const wallX = ts.dungeonArenaSpawnX - 1; // Just before enemy spawn point
    hero.x = Math.max(ts.dungeonArenaLeftX, Math.min(wallX, hero.x));
    return;
  }

  // Portal enforcement
  if (hero.x < portalMinX) {
    if (heroXBefore >= portalMinX) {
      // Was at/ahead of portal, tried to go backward → hard clamp
      hero.x = portalMinX;
    } else {
      // Was already behind portal (portal moved forward) → walk gradually
      hero.x = heroXBefore + Math.min(effectiveSpeed, portalMinX - heroXBefore);
    }
  }
}
