// Hero Skills — class-agnostic skill definitions
// Skills are shared mechanics that any class can reference with different names/icons.

export const SKILL_UNLOCK_LEVELS = [6, 18, 32, 58];

export type SkillType = 'active' | 'passive' | 'triggered';

export interface SkillDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  type: SkillType;
  cooldownFrames: number;     // 0 for passives
  buffFrames: number;         // 0 for instant/passive
  buttonColor: string;        // For active skill button bg
  buttonColorReady: string;   // For active skill button border when ready
  range?: number;             // Effective range in px (for visual indicator on hover)
}

export const SKILL_POOL: SkillDef[] = [
  { id: 'weaponThrow', name: 'Weapon Throw', icon: '🪓', desc: 'Hurl a weapon for 1.2x AOE damage', type: 'active', cooldownFrames: 600, buffFrames: 0, buttonColor: '#ff4400', buttonColorReady: '#ff8844' },
  { id: 'march', name: 'March!', icon: '🥁', desc: 'Allies gain 1.3x speed & attack speed for 15s', type: 'active', cooldownFrames: 10800, buffFrames: 900, buttonColor: '#22aa44', buttonColorReady: '#44cc66' },
  { id: 'battleCry', name: 'Battle Cry', icon: '📯', desc: 'Allies deal 1.3x damage for 15s', type: 'active', cooldownFrames: 9000, buffFrames: 900, buttonColor: '#cc4444', buttonColorReady: '#ee6666' },
  { id: 'harvest', name: 'Harvest', icon: '🌾', desc: '1.5x gold from all sources for 15s', type: 'active', cooldownFrames: 12600, buffFrames: 900, buttonColor: '#cc9900', buttonColorReady: '#eebb22' },
  { id: 'lastStand', name: 'Last Stand', icon: '🩸', desc: 'Allies below 30% HP deal 1.5x damage', type: 'passive', cooldownFrames: 0, buffFrames: 0, buttonColor: '', buttonColorReady: '' },
  { id: 'secondWind', name: 'Second Wind', icon: '💨', desc: 'Auto-heal hero to 70% HP at 20% threshold', type: 'passive', cooldownFrames: 7200, buffFrames: 0, buttonColor: '', buttonColorReady: '' },
  { id: 'intimidate', name: 'Intimidate', icon: '😤', desc: 'Enemies within 150px deal 10% less damage', type: 'passive', cooldownFrames: 0, buffFrames: 0, buttonColor: '', buttonColorReady: '', range: 150 },
  { id: 'regroup', name: 'Regroup', icon: '🌀', desc: 'Teleport all allies to portal + full heal', type: 'active', cooldownFrames: 9000, buffFrames: 0, buttonColor: '#4488ff', buttonColorReady: '#66aaff' },
  { id: 'bloodlust', name: 'Bloodlust', icon: '🗡️', desc: 'Hero +2 dmg per kill (max 10), decays over time', type: 'passive', cooldownFrames: 0, buffFrames: 0, buttonColor: '', buttonColorReady: '' },
  { id: 'shieldWall', name: 'Shield Wall', icon: '🛡️', desc: 'Hero + allies within 150px take 40% less damage for 8s', type: 'active', cooldownFrames: 7200, buffFrames: 480, buttonColor: '#6666cc', buttonColorReady: '#8888ee', range: 150 },
  { id: 'heroicPresence', name: 'Heroic Presence', icon: '👑', desc: 'Allies within 120px attack 10% faster', type: 'passive', cooldownFrames: 0, buffFrames: 0, buttonColor: '', buttonColorReady: '', range: 120 },
  { id: 'pinDown', name: 'Pin Down', icon: '\u{1F4CC}', desc: 'All enemies move at 0.4x speed for 6s', type: 'active', cooldownFrames: 7200, buffFrames: 360, buttonColor: '#aa6622', buttonColorReady: '#cc8844' },
  // Ranger skills
  { id: 'powerShot', name: 'Power Shot', icon: '\u{1F3AF}', desc: '10% chance to fire a 3x dmg arrow', type: 'passive', cooldownFrames: 0, buffFrames: 0, buttonColor: '', buttonColorReady: '' },
  { id: 'volley', name: 'Volley', icon: '\u{1F327}\uFE0F', desc: 'Rain 0.7x dmg arrows on all enemies in 120px', type: 'active', cooldownFrames: 960, buffFrames: 0, buttonColor: '#3a7f2f', buttonColorReady: '#5a9f4f', range: 120 },
  { id: 'birdsEye', name: "Bird's Eye", icon: '\u{1F985}', desc: 'Scout: 10% chance to mark enemies, marked take 30% more dmg', type: 'active', cooldownFrames: 3600, buffFrames: 600, buttonColor: '#8a6f2f', buttonColorReady: '#aa8f4f' },
  { id: 'snareTrap', name: 'Snare Trap', icon: '\u{1FAA4}', desc: 'Root enemies within 90px for 3s', type: 'active', cooldownFrames: 1800, buffFrames: 180, buttonColor: '#6a5f2f', buttonColorReady: '#8a7f4f', range: 90 },
  { id: 'eagleEye', name: 'Eagle Eye', icon: '\u{1F441}\uFE0F', desc: 'All allies +10% range & attack speed for 15s', type: 'active', cooldownFrames: 10800, buffFrames: 900, buttonColor: '#2a6f4f', buttonColorReady: '#4a8f6f' },
  { id: 'smokeScreen', name: 'Smoke Screen', icon: '\u{1F4A8}', desc: 'Hero + allies within 150px immune to damage for 3s', type: 'active', cooldownFrames: 14400, buffFrames: 180, buttonColor: '#5a5a6a', buttonColorReady: '#7a7a8a', range: 150 },
  { id: 'fallBack', name: 'Fall Back!', icon: '\u{1F3C3}', desc: 'Teleport allies to portal + 50% heal', type: 'active', cooldownFrames: 9000, buffFrames: 0, buttonColor: '#4488ff', buttonColorReady: '#66aaff' },
  { id: 'poisonTips', name: 'Poison Tips', icon: '\u{1F9EA}', desc: 'Hero attacks apply DOT (0.8% maxHP/s, 5s, stack 5x)', type: 'passive', cooldownFrames: 0, buffFrames: 0, buttonColor: '', buttonColorReady: '' },
  { id: 'keenEye', name: 'Keen Eye', icon: '\u{1F441}\uFE0F', desc: 'Hero crits 2x on enemies above 90% HP', type: 'passive', cooldownFrames: 0, buffFrames: 0, buttonColor: '', buttonColorReady: '' },
  { id: 'pathfinder', name: 'Pathfinder', icon: '\u{1F97E}', desc: 'Allies within 120px move 15% faster', type: 'passive', cooldownFrames: 0, buffFrames: 0, buttonColor: '', buttonColorReady: '', range: 120 },
  { id: 'scavenger', name: 'Scavenger', icon: '\u{1F99D}', desc: '50% more gold from kills by the hero', type: 'passive', cooldownFrames: 0, buffFrames: 0, buttonColor: '', buttonColorReady: '' },
  { id: 'naturesGrace', name: "Nature's Grace", icon: '\u{1F33F}', desc: 'At 30% HP, heal to 50% + 2s invulnerability', type: 'triggered', cooldownFrames: 5400, buffFrames: 0, buttonColor: '#2a8f4f', buttonColorReady: '#4aaf6f' },
  // Mage skills
  { id: 'thunderstrike', name: 'Thunderstrike', icon: '\u26A1', desc: 'Nuke highest HP enemy for 5x damage', type: 'active', cooldownFrames: 900, buffFrames: 0, buttonColor: '#8855cc', buttonColorReady: '#aa77ee' },
  { id: 'manaShield', name: 'Mana Shield', icon: '\u{1F52E}', desc: 'At 30% HP, absorb the next 3 hits', type: 'triggered', cooldownFrames: 5400, buffFrames: 0, buttonColor: '#6644aa', buttonColorReady: '#8866cc' },
  { id: 'channelIgnite', name: 'Channel Ignite', icon: '\u{1F525}', desc: 'Channel 8s: burn all enemies within 400px', type: 'active', cooldownFrames: 3600, buffFrames: 480, buttonColor: '#cc4400', buttonColorReady: '#ee6622', range: 400 },
  { id: 'channelBlizzard', name: 'Channel Blizzard', icon: '\u2744\uFE0F', desc: 'Channel 10s: slow all enemies within 200px by 50%', type: 'active', cooldownFrames: 5400, buffFrames: 600, buttonColor: '#4488cc', buttonColorReady: '#66aaee', range: 200 },
  { id: 'arcaneIntellect', name: 'Arcane Intellect', icon: '\u{1F4D6}', desc: 'Each attack reduces all skill cooldowns by 5%', type: 'passive', cooldownFrames: 0, buffFrames: 0, buttonColor: '', buttonColorReady: '' },
  { id: 'summonMeteor', name: 'Summon Meteor', icon: '\u2604\uFE0F', desc: 'Channel 5s then drop 3x dmg AOE nuke in 120px', type: 'active', cooldownFrames: 7200, buffFrames: 300, buttonColor: '#cc4400', buttonColorReady: '#ee6622', range: 120 },
  { id: 'barrier', name: 'Barrier', icon: '\u{1F6E1}\uFE0F', desc: 'Shield whole army with 20% maxHP barrier for 8s', type: 'active', cooldownFrames: 9000, buffFrames: 480, buttonColor: '#4466cc', buttonColorReady: '#6688ee' },
  { id: 'blink', name: 'Blink', icon: '\u{1F4AB}', desc: 'Teleport to flag + full heal', type: 'active', cooldownFrames: 3600, buffFrames: 0, buttonColor: '#8855cc', buttonColorReady: '#aa77ee' },
  { id: 'productionMagic', name: 'Production Magic', icon: '\u{1F4B0}', desc: 'Conjure a gold chest', type: 'active', cooldownFrames: 7200, buffFrames: 0, buttonColor: '#cc9900', buttonColorReady: '#eebb22' },
  { id: 'arcaneFamiliar', name: 'Arcane Familiar', icon: '\u{1F47B}', desc: 'Summon a familiar that auto-attacks for 0.5x hero dmg', type: 'passive', cooldownFrames: 0, buffFrames: 0, buttonColor: '', buttonColorReady: '' },
  { id: 'chargedZap', name: 'Charged Zap', icon: '\u{1F329}\uFE0F', desc: 'Zap can crit; on crit, extend bounce by +1', type: 'passive', cooldownFrames: 0, buffFrames: 0, buttonColor: '', buttonColorReady: '' },
  { id: 'highAmps', name: 'High Amps', icon: '\u{1F50C}', desc: 'All zap bounces can crit', type: 'passive', cooldownFrames: 0, buffFrames: 0, buttonColor: '', buttonColorReady: '' },
];

export function getSkillDef(id: string): SkillDef | undefined {
  return SKILL_POOL.find(s => s.id === id);
}
