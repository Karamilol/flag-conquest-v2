import { useState, useRef, useMemo } from 'react';
import { COLORS, UNIT_STATS } from '../../constants';
import { SwordsIconHTML, GoldIconHTML, PortalIconHTML } from '../sprites/GameIcons';
import type { GameState, PermanentUpgrades, ShardUpgrades, ChallengeCompletions } from '../../types';
import type { RelicCollection } from '../../relics';
import { getClassDef } from '../../classes';
import { getRelicLevel, hasSetBonus, RELIC_SETS } from '../../relics';
import { getAncientEffect, getAncientRelicLevel } from '../../ancientRelics';
import { goldUpgradeCost, goldDropUpgradeCost, heroUpgradeCost, heroTotalHp, heroTotalDmg, unitHpMult, unitDmgMult, goldDropMult, slimesCost, forestsCost, deliveryCost, smithCost, barricadeCost, enchantingCost, militiaCost, territoryCost, huntingSlimesIncome, scoutingForestsPayout, deliveringResourcesPayout, smithingSwordsPayout, reinforcingBarricadesPayout, enchantingScrollsPayout, trainingMilitiaPayout, expandingTerritoriesPayout, getTier, prestigeShardReward } from '../../utils/economy';
import { formatNumber } from '../../utils/helpers';
import { computeFullUnitStats, type UnitType, type StatBonus } from '../../utils/unitStats';
import { type RegaliaSlot, type Regalia, LEVEL_MULTS } from '../../regalias';
// Modifier cost helpers (inline since we have GameState, not TickState)
function getModUnitCostMult(mods: string[]): number {
  let m = 1;
  if (mods.includes('qualityMaterials')) m *= 0.90;
  if (mods.includes('inflation')) m *= 1.15;
  return m;
}
function getModEconCostMult(mods: string[]): number {
  let m = 1;
  if (mods.includes('logistics')) m *= 0.90;
  if (mods.includes('inflation')) m *= 1.15;
  return m;
}
function getModRollCostMult(mods: string[]): number {
  return mods.includes('expensiveLabor') ? 1.20 : 1;
}

type PurchaseMode = '1x' | '10x' | 'MAX';
const PURCHASE_MODES: PurchaseMode[] = ['1x', '10x', 'MAX'];

function computeMultiBuy(costFn: (level: number) => number, currentLevel: number, gold: number, mode: PurchaseMode, discount = 1): { levels: number; totalCost: number } {
  const df = (l: number) => Math.floor(costFn(l) * discount);
  if (mode === '1x') {
    const cost = df(currentLevel);
    return { levels: cost <= gold ? 1 : 0, totalCost: cost };
  }
  const maxLevels = mode === '10x' ? 10 : 1000;
  let totalCost = 0;
  let levels = 0;
  for (let i = 0; i < maxLevels; i++) {
    const cost = df(currentLevel + i);
    if (totalCost + cost > gold) break;
    totalCost += cost;
    levels++;
  }
  // Show cost of next level even if can't afford any
  if (levels === 0) return { levels: 0, totalCost: df(currentLevel) };
  return { levels, totalCost };
}

interface Props {
  game: GameState;
  upgrades: PermanentUpgrades;
  shardUpgrades: ShardUpgrades;
  challengeCompletions: ChallengeCompletions;
  relicCollection: RelicCollection;
  ancientRelicsOwned: string[];
  ancientRelicCopies: Record<string, number>;
  shopTab: string;
  setShopTab: (tab: string) => void;
  buyRunUpgrade: (type: string, cost: number) => void;
  buyRunUpgradeMulti: (type: string, totalCost: number, levels: number) => void;
  movePortalForward: () => void;
  toggleAutoPortal: () => void;
  onRoll: () => void;
  onReturnHome: () => void;
  highestZone: number;
  highestFlags: number;
  costDiscount?: number;
  equippedRegalias?: Record<RegaliaSlot, Regalia | null>;
  tutorialHighlights?: { roll?: boolean; heroUpgrade?: boolean; income?: boolean; portalTab?: boolean; retreatButton?: boolean };
}

export function ShopTabs({ game, shopTab, setShopTab, purchaseMode, cycleMode, tutorialHighlightPortal = false }: { game: GameState; shopTab: string; setShopTab: (tab: string) => void; purchaseMode: PurchaseMode; cycleMode: () => void; tutorialHighlightPortal?: boolean }) {
  const highlightPortalTab = tutorialHighlightPortal;

  return (
    <div style={{ display: 'flex', background: 'linear-gradient(135deg, rgba(30,12,50,0.95) 0%, rgba(15,8,25,0.95) 100%)', flexShrink: 0, borderBottom: '1px solid rgba(138,74,223,0.3)' }}>
      {(['units', 'income', 'portal'] as const)
        .filter(tab => !(tab === 'portal' && game.inDungeon && game.dungeonType === 'timed'))
        .map(tab => {
        const tabColor = tab === 'units' ? COLORS.heroBlue : tab === 'income' ? '#8f8' : '#a855f7';
        const active = shopTab === tab;
        return (
          <button key={tab} onClick={() => setShopTab(tab)} style={{ flex: 1, padding: '6px 10px', fontSize: '12px', fontFamily: 'inherit', background: active ? 'rgba(255,255,255,0.08)' : 'transparent', color: active ? tabColor : '#666', border: 'none', borderBottom: active ? `3px solid ${tabColor}` : '3px solid transparent', cursor: 'pointer', ...(tab === 'portal' && highlightPortalTab ? { boxShadow: '0 0 12px #B8860B, 0 0 4px #FFD700', outline: '2px solid #FFD700' } : {}) }}>
            {tab === 'units' ? <><SwordsIconHTML size={14} /> UNITS</> : tab === 'income' ? <><GoldIconHTML size={14} /> INCOME</> : <><PortalIconHTML size={14} /> PORTAL</>}
          </button>
        );
      })}
      {shopTab !== 'portal' && (
        <button onClick={cycleMode} style={{ padding: '6px 8px', fontSize: '12px', fontFamily: 'inherit', fontWeight: 'bold', background: purchaseMode === 'MAX' ? 'rgba(136,68,34,0.8)' : purchaseMode === '10x' ? 'rgba(68,102,136,0.8)' : 'rgba(20,15,30,0.85)', color: purchaseMode === '1x' ? '#888' : '#fff', border: 'none', borderLeft: '1px solid rgba(138,74,223,0.3)', cursor: 'pointer', minWidth: '38px' }}>
          {purchaseMode}
        </button>
      )}
    </div>
  );
}

export function ShopPanel({ game, upgrades, shardUpgrades, challengeCompletions, relicCollection, ancientRelicsOwned, ancientRelicCopies, shopTab, setShopTab, buyRunUpgrade, buyRunUpgradeMulti, movePortalForward, toggleAutoPortal, onRoll, onReturnHome, highestZone, highestFlags, purchaseMode: externalPurchaseMode, costDiscount = 1, equippedRegalias, tutorialHighlights }: Props & { purchaseMode?: PurchaseMode }) {
  const [internalPurchaseMode, setInternalPurchaseMode] = useState<PurchaseMode>('1x');
  const purchaseMode = externalPurchaseMode ?? internalPurchaseMode;
  const mods = game.activeModifiers || [];

  return (
    <div style={{ padding: '6px', background: 'linear-gradient(135deg, rgba(25,10,42,0.9) 0%, rgba(12,6,20,0.9) 100%)' }}>
      {shopTab === 'units' && (() => {
        // Recruitment Center: -3% unit upgrade costs per building (stacks)
        const rcCount = (game.flags || []).filter(f => f.captured && !f.corrupted && !f.contested && f.buildingType === 'recruitmentCenter').length;
        const blueprintsMult = getRelicLevel(relicCollection['blueprints'] || 0) > 0 ? 1.5 : 1;
        const unitDiscount = rcCount > 0 ? Math.pow(1 - 0.03 * blueprintsMult, rcCount) : 1;
        const modUnitMult = getModUnitCostMult(mods);
        return <UnitsTab game={game} upgrades={upgrades} shardUpgrades={shardUpgrades} challengeCompletions={challengeCompletions} relicCollection={relicCollection} ancientRelicsOwned={ancientRelicsOwned} ancientRelicCopies={ancientRelicCopies} buyRunUpgrade={buyRunUpgrade} buyRunUpgradeMulti={buyRunUpgradeMulti} purchaseMode={purchaseMode} onRoll={onRoll} discount={costDiscount * unitDiscount * modUnitMult} equippedRegalias={equippedRegalias} tutorialHighlights={tutorialHighlights} />;
      })()}
      {shopTab === 'income' && (() => {
        // Market: -3% income upgrade costs per building (stacks)
        const mktCount = (game.flags || []).filter(f => f.captured && !f.corrupted && !f.contested && f.buildingType === 'market').length;
        const blueprintsMult = getRelicLevel(relicCollection['blueprints'] || 0) > 0 ? 1.5 : 1;
        const incomeDiscount = mktCount > 0 ? Math.pow(1 - 0.03 * blueprintsMult, mktCount) : 1;
        const modEconMult = getModEconCostMult(mods);
        // Grand Design (Expansion 4pc): income upgrades 3% cheaper
        const expansionSet = RELIC_SETS.find(s => s.id === 'expansionSet')!;
        const grandDesignDiscount = hasSetBonus(expansionSet, relicCollection, 4) ? 0.97 : 1;
        return <IncomeTab game={game} upgrades={upgrades} relicCollection={relicCollection} ancientRelicsOwned={ancientRelicsOwned} ancientRelicCopies={ancientRelicCopies} challengeCompletions={challengeCompletions} buyRunUpgrade={buyRunUpgrade} buyRunUpgradeMulti={buyRunUpgradeMulti} purchaseMode={purchaseMode} discount={costDiscount * incomeDiscount * grandDesignDiscount * modEconMult} tutorialHighlights={tutorialHighlights} />;
      })()}
      {shopTab === 'portal' && <PortalTab game={game} upgrades={upgrades} movePortalForward={movePortalForward} toggleAutoPortal={toggleAutoPortal} onReturnHome={onReturnHome} highestZone={highestZone} highestFlags={highestFlags} highlightRetreat={tutorialHighlights?.retreatButton} />}
    </div>
  );
}

// Shared row component: 82% stats left, 18% buy button right
function UpgradeRow({ name, level, stats, cost, canAfford, color, onClick, buyLevels, highlight, statDeltas }: {
  name: string; level: number; stats: string; cost: number; canAfford: boolean; color: string; onClick: () => void; buyLevels?: number; highlight?: boolean; statDeltas?: { hp?: number; dmg?: number; def?: number };
}) {
  const [hovered, setHovered] = useState(false);
  const tier = getTier(level);
  // Build stats display with inline deltas on hover
  let statsDisplay = stats;
  if (hovered && statDeltas) {
    const { hp = 0, dmg = 0, def = 0 } = statDeltas;
    statsDisplay = statsDisplay
      .replace(/(❤️\d+)/, hp > 0 ? `$1(+${hp})` : '$1')
      .replace(/(⚔️\d+)/, dmg > 0 ? `$1(+${dmg})` : '$1')
      .replace(/(🛡️\d+)/, def > 0 ? `$1(+${def})` : '$1');
  }
  return (
    <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(138,74,223,0.15)', ...(highlight ? { boxShadow: '0 0 12px #B8860B, 0 0 4px #FFD700', outline: '2px solid #FFD700' } : {}) }}
      onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
      <div style={{ flex: '0 0 82%', padding: '6px 8px', background: 'rgba(20,15,35,0.6)', borderRight: '1px solid rgba(138,74,223,0.2)' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: color, marginBottom: '2px' }}>
          {name} <span style={{ color: COLORS.textDim, fontWeight: 'normal' }}>Lv.{level}</span>
          {tier > 0 && <span style={{ color: '#ffd700', fontSize: '10px', marginLeft: '4px' }}>T{tier}</span>}
        </div>
        <div style={{ fontSize: '10px', color: COLORS.text, opacity: 0.85 }}>{statsDisplay}</div>
      </div>
      <button onClick={onClick} disabled={!canAfford} style={{
        flex: '0 0 18%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '6px 2px', fontSize: '12px', fontFamily: 'inherit', fontWeight: 'bold',
        background: canAfford ? color : 'rgba(20,15,30,0.85)', color: canAfford ? '#000' : '#555',
        border: canAfford ? 'none' : '1px solid rgba(138,74,223,0.2)', cursor: canAfford ? 'pointer' : 'not-allowed',
      }}>
        {(buyLevels ?? 0) > 1 && <div style={{ fontSize: '10px', opacity: 0.8 }}>x{buyLevels}</div>}
        <div style={{ fontSize: '12px' }}>{formatNumber(cost)}g</div>
      </button>
    </div>
  );
}

function UnitBonusBreakdown({ bonuses }: { bonuses: StatBonus[] }) {
  if (bonuses.length === 0) return null;
  const statLabels: Record<string, string> = { health: 'HP', damage: 'DMG', defense: 'DEF', speed: 'SPD', attackRate: 'ATK SPD', range: 'RNG' };
  return (
    <div style={{ fontSize: '10px', marginTop: '4px', borderTop: '1px solid rgba(138,74,223,0.3)', paddingTop: '4px', background: 'rgba(10,5,20,0.4)', borderRadius: '3px', padding: '4px 6px' }}>
      {bonuses.map((b, i) => (
        <div key={i} style={{ marginBottom: '1px' }}>
          <span style={{ color: '#4aff4a', fontWeight: 'bold' }}>{b.value}</span>{' '}
          <span style={{ color: '#999' }}>{statLabels[b.stat] || b.stat} from</span>{' '}
          <span style={{ color: '#c084fc' }}>{b.source}</span>
        </div>
      ))}
    </div>
  );
}

function UnitsTab({ game, upgrades, shardUpgrades, challengeCompletions, relicCollection, ancientRelicsOwned, ancientRelicCopies = {}, buyRunUpgrade, buyRunUpgradeMulti, purchaseMode, onRoll, discount = 1, equippedRegalias, tutorialHighlights }: { game: GameState; upgrades: PermanentUpgrades; shardUpgrades: ShardUpgrades; challengeCompletions: ChallengeCompletions; relicCollection: RelicCollection; ancientRelicsOwned: string[]; ancientRelicCopies?: Record<string, number>; buyRunUpgrade: (t: string, c: number) => void; buyRunUpgradeMulti: (t: string, totalCost: number, levels: number) => void; purchaseMode: PurchaseMode; onRoll: () => void; discount?: number; equippedRegalias?: Record<RegaliaSlot, Regalia | null>; tutorialHighlights?: { roll?: boolean; heroUpgrade?: boolean } }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const hasExpanded = useRef(false);
  const doExpand = (key: string) => { hasExpanded.current = true; setExpanded(expanded === key ? null : key); };
  const heroLevel = game.runUpgrades?.hero || 0;
  const heroMulti = computeMultiBuy((l) => heroUpgradeCost(18, l), heroLevel, game.goldEarned, purchaseMode, discount);
  const heroCost = heroMulti.totalCost;
  const heroCanAfford = heroMulti.levels > 0;
  const cls = getClassDef(game.heroClass);
  const isRanged = cls.attackType === 'ranged';
  const hp = heroTotalHp(cls.baseStats.hp, heroLevel, isRanged);
  const dmg = heroTotalDmg(cls.baseStats.dmg, heroLevel, isRanged);
  const def = cls.baseStats.def + Math.floor(heroLevel / (isRanged ? 6 : 3));

  // Build context for full stat computation
  const artifactIds = (game.artifacts || []).map(a => a.id);
  const buildings = (game.flags || []).filter(f => f.captured && f.buildingType).map(f => f.buildingType!);
  const runCtx = {
    shardUpgrades,
    challengeCompletions,
    artifacts: artifactIds,
    relicCollection,
    buildings,
    bossesDefeated: game.bossesDefeated || 0,
    challengeId: game.challengeId,
    equippedRegalias,
  };

  const unitTypes = [
    { key: 'soldier', name: '\u{1F5E1}\uFE0F Soldier \u2605', color: UNIT_STATS.soldier.color, baseCost: 20 },
    { key: 'archer', name: '\u{1F3F9} Archer \u2605\u2605', color: UNIT_STATS.archer.color, baseCost: 23 },
    { key: 'halberd', name: '\u{1F531} Halberd \u2605\u2605', color: UNIT_STATS.halberd.color, baseCost: 22 },
    { key: 'knight', name: '\u{1F6E1}\uFE0F Knight \u2605\u2605\u2605', color: UNIT_STATS.knight.color, baseCost: 26 },
    { key: 'wizard', name: '\u{1F9D9} Apprentice \u2605\u2605\u2605', color: UNIT_STATS.wizard.color, baseCost: 28 },
    { key: 'cleric', name: '\u26EA Cleric \u2605\u2605\u2605', color: UNIT_STATS.cleric.color, baseCost: 25 },
    { key: 'conjurer', name: '\u{1F537} Conjurer \u2605\u2605\u2605\u2605', color: UNIT_STATS.conjurer.color, baseCost: 30 },
    { key: 'bombard', name: '\u{1F4A3} Bombard \u2605\u2605\u2605\u2605', color: UNIT_STATS.bombard.color, baseCost: 32 },
  ] as const;

  // Memoize all expensive computeMultiBuy + computeFullUnitStats calls.
  // These only change when gold, levels, purchaseMode, or discount change — not every frame.
  const gold = game.goldEarned;
  const runUpgrades = game.runUpgrades;
  const unitComputations = useMemo(() => {
    const results: Record<string, { multi: { levels: number; totalCost: number }; cur: ReturnType<typeof computeFullUnitStats>; next: ReturnType<typeof computeFullUnitStats> }> = {};
    for (const { key, baseCost } of unitTypes) {
      const isUnlocked = (upgrades.unlockedUnits as string[] || ['soldier']).includes(key);
      const hasActiveUnit = game.unitSlots.some(slot => slot.type === key);
      if (!isUnlocked || !hasActiveUnit) continue;
      const level = runUpgrades?.[key] || 0;
      const multi = computeMultiBuy((l) => goldUpgradeCost(baseCost, l), level, gold, purchaseMode, discount);
      const cur = computeFullUnitStats(key as UnitType, { ...runCtx, runLevel: level });
      const nl = level + Math.max(1, multi.levels);
      const next = computeFullUnitStats(key as UnitType, { ...runCtx, runLevel: nl });
      results[key] = { multi, cur, next };
    }
    return results;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gold, runUpgrades, purchaseMode, discount, game.bossesDefeated, game.challengeId, game.unitSlots]);

  const rollMult = getModRollCostMult(game.activeModifiers || []);
  const effectiveRollCost = Math.floor(game.rollCost * rollMult);
  const rollCanAfford = game.goldEarned >= effectiveRollCost;
  const highlightRoll = tutorialHighlights?.roll || false;
  const highlightHero = tutorialHighlights?.heroUpgrade || false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* Roll button — hidden in Lone Wolf */}
      {game.challengeId !== 'loneWolf' && (
        <button onClick={onRoll} disabled={!rollCanAfford} style={{
          padding: '7px 10px', fontSize: '13px', fontFamily: 'inherit', fontWeight: 'bold',
          background: rollCanAfford ? COLORS.gold : 'rgba(20,15,30,0.85)', color: rollCanAfford ? '#333' : '#666',
          border: rollCanAfford ? 'none' : '1px solid rgba(138,74,223,0.3)', borderRadius: '4px', cursor: rollCanAfford ? 'pointer' : 'not-allowed',
          marginBottom: '4px',
          ...(highlightRoll ? { boxShadow: '0 0 12px #B8860B, 0 0 4px #FFD700', outline: '2px solid #FFD700' } : {}),
        }}>
          {'\u{1F3B2}'} ROLL FOR UNIT ({formatNumber(effectiveRollCost)}g)
        </button>
      )}

      {/* Hero upgrade */}
      {(() => {
        const nl = heroLevel + Math.max(1, heroMulti.levels);
        const nextHp = heroTotalHp(cls.baseStats.hp, nl, isRanged);
        const nextDmg = heroTotalDmg(cls.baseStats.dmg, nl, isRanged);
        const nextDef = cls.baseStats.def + Math.floor(nl / (isRanged ? 6 : 3));
        const heroAtkRate = cls.attackCooldown;

        // Compute hero bonuses for breakdown
        const heroBonuses: StatBonus[] = [];
        if (heroLevel > 0) {
          heroBonuses.push({ source: `Level ${heroLevel}`, stat: 'health', value: `x${(hp / cls.baseStats.hp).toFixed(2)}` });
          heroBonuses.push({ source: `Level ${heroLevel}`, stat: 'damage', value: `x${(dmg / cls.baseStats.dmg).toFixed(2)}` });
          const baseDef = cls.baseStats.def;
          if (def > baseDef) heroBonuses.push({ source: `Level ${heroLevel}`, stat: 'defense', value: `+${def - baseDef}` });
        }
        // Masterwork Arms (Smithy 6pc) — hero +2 dmg/+1 def per boss; shown at runtime
        // Titan's Heart
        if ((ancientRelicsOwned || []).includes('titansHeart')) {
          const thEff = getAncientEffect('titansHeart', getAncientRelicLevel(ancientRelicCopies['titansHeart'] || 1));
          heroBonuses.push({ source: "Titan's Heart", stat: 'health', value: `+${Math.round((thEff.hpBonus || 0.15) * 100)}%` });
        }
        // Melee-specific bonuses
        if (!isRanged) {
          if (challengeCompletions.colosseum) {
            heroBonuses.push({ source: "Titan's Endurance", stat: 'health', value: '+15%' });
          }
          const gelLv = getRelicLevel(relicCollection['gel'] || 0);
          if (gelLv > 0) {
            heroBonuses.push({ source: `Gel Lv${gelLv}`, stat: 'health', value: `+${gelLv * 3}%` });
          }
        }
        // Challenge rewards
        if (challengeCompletions.glassCannon) {
          heroBonuses.push({ source: "Razor's Edge", stat: 'damage', value: '+10%' });
        }

        // Hero crit chance computation
        let heroCritChance = cls.baseStats.critChance;
        const knifeLv = getRelicLevel(relicCollection['knife'] || 0);
        if (knifeLv > 0) {
          heroCritChance += knifeLv * 0.03;
          heroBonuses.push({ source: `Knife Lv${knifeLv}`, stat: 'crit', value: `+${knifeLv * 3}%` });
        }
        const blueprintsMult = getRelicLevel(relicCollection['blueprints'] || 0) > 0 ? 1.5 : 1;
        let heroWsN = 0;
        for (const b of buildings) if (b === 'warShrine') heroWsN++;
        if (heroWsN > 0) {
          const wsVal = 0.03 * heroWsN * blueprintsMult;
          heroCritChance += wsVal;
          heroBonuses.push({ source: `War Shrine${heroWsN > 1 ? ` x${heroWsN}` : ''}`, stat: 'crit', value: `+${Math.round(wsVal * 100)}%` });
        }

        // Building bonuses for hero (forge, leatherworks, church, barracks)
        let heroForgeN = 0;
        let heroLwN = 0;
        let heroChurchN = 0;
        let heroBarracksN = 0;
        for (const b of buildings) {
          if (b === 'forge') heroForgeN++;
          else if (b === 'leatherworks') heroLwN++;
          else if (b === 'church') heroChurchN++;
          else if (b === 'barracks') heroBarracksN++;
        }
        if (heroForgeN > 0) {
          const val = Math.floor(2 * heroForgeN * blueprintsMult);
          heroBonuses.push({ source: `Forge${heroForgeN > 1 ? ` x${heroForgeN}` : ''}`, stat: 'damage', value: `+${val}` });
        }
        if (heroLwN > 0) {
          const val = Math.floor(1 * heroLwN * blueprintsMult);
          heroBonuses.push({ source: `Leatherworks${heroLwN > 1 ? ` x${heroLwN}` : ''}`, stat: 'defense', value: `+${val}` });
        }
        if (heroChurchN > 0) {
          heroBonuses.push({ source: `Church${heroChurchN > 1 ? ` x${heroChurchN}` : ''}`, stat: 'regen', value: `${(0.5 * heroChurchN * blueprintsMult).toFixed(1)}% HP/3s` });
        }
        if (heroBarracksN > 0) {
          const val = Math.round(5 * heroBarracksN * blueprintsMult);
          heroBonuses.push({ source: `Barracks${heroBarracksN > 1 ? ` x${heroBarracksN}` : ''}`, stat: 'attackRate', value: `+${val}% atk speed` });
        }

        // Artifact bonuses for hero
        const heroHasArt = (id: string) => artifactIds.includes(id);
        if (heroHasArt('regeneration')) heroBonuses.push({ source: 'Regeneration', stat: 'health', value: '2% HP/s regen' });
        if (heroHasArt('command')) heroBonuses.push({ source: 'Command', stat: 'attackRate', value: '+10% atk speed aura' });
        if (heroHasArt('collection')) {
          const bossBonus = (game.bossesDefeated || 0) * (game.heroClass === 'warlord' ? 1 : 3);
          if (bossBonus > 0) heroBonuses.push({ source: 'Collection', stat: 'damage', value: `+${bossBonus} (${game.bossesDefeated || 0} bosses)` });
        }
        if (heroHasArt('riches')) heroBonuses.push({ source: 'Riches', stat: 'damage', value: 'More consumable chests' });
        if (heroHasArt('swiftArmy')) heroBonuses.push({ source: 'Swift Army', stat: 'speed', value: '+0.1' });
        if (!isRanged && heroHasArt('endurance')) heroBonuses.push({ source: 'Endurance', stat: 'defense', value: '+1 (melee)' });
        if (!isRanged && heroHasArt('trainingManual')) heroBonuses.push({ source: 'Training Manual', stat: 'damage', value: '+2 (melee)' });
        if (!isRanged && heroHasArt('endurance') && heroHasArt('trainingManual')) heroBonuses.push({ source: 'Strike Back', stat: 'damage', value: '+5%/stack on hit (3x)' });
        if (!isRanged && heroHasArt('betterWeapons')) {
          const stacks = game.smithingBonusStacks || 0;
          heroBonuses.push({ source: 'Better Weapons', stat: 'damage', value: stacks > 0 ? `+${(stacks * 0.5).toFixed(1)} (${stacks}/4 procs)` : '+0.5/proc (max +2/zone)' });
        }
        if (heroHasArt('attrition')) heroBonuses.push({ source: 'Attrition', stat: 'defense', value: '+1 (boss active)' });

        // Regalia bonuses for hero
        if (equippedRegalias) {
          const regaliaHeroStats: { statId: string; label: string; suffix: string }[] = [
            { statId: 'heroHpFlat', label: 'health', suffix: ' HP' },
            { statId: 'heroHpPct', label: 'health', suffix: '% HP' },
            { statId: 'heroDamageFlat', label: 'damage', suffix: '' },
            { statId: 'heroDamagePct', label: 'damage', suffix: '%' },
            { statId: 'heroDefense', label: 'defense', suffix: '' },
            { statId: 'heroDefensePct', label: 'defense', suffix: '%' },
            { statId: 'heroAttackSpeed', label: 'attackRate', suffix: '% atk speed' },
            { statId: 'heroCritChance', label: 'crit', suffix: '% crit' },
            { statId: 'heroCritDamage', label: 'crit', suffix: '% crit dmg' },
            { statId: 'heroRegenPct', label: 'regen', suffix: '% HP/s' },
            { statId: 'heroMoveSpeed', label: 'speed', suffix: ' speed' },
          ];
          for (const { statId, label, suffix } of regaliaHeroStats) {
            let total = 0;
            for (const r of Object.values(equippedRegalias)) {
              if (!r) continue;
              const lvlMult = LEVEL_MULTS[r.level];
              for (const mod of r.modifiers) {
                if (mod.statId !== statId) continue;
                if (mod.target && mod.target !== 'hero') continue;
                total += mod.value * lvlMult * (1 + 0.15 * mod.stars);
              }
            }
            if (total > 0) {
              const display = suffix.includes('%') ? `+${total.toFixed(1)}${suffix}` : `+${Math.floor(total)}`;
              heroBonuses.push({ source: 'Regalia', stat: label, value: display });
            }
          }
        }

        // Use actual game hero stats for display (includes all bonuses from selectClass)
        const actualHp = game.hero.maxHealth;
        const actualDmg = game.hero.damage;
        const actualDef = game.hero.defense;
        const hpDelta = nextHp - hp;
        const dmgDelta = nextDmg - dmg;
        const defDelta = nextDef - def;
        const heroIsExpanded = expanded === 'hero' && heroBonuses.length > 0;
        const heroHasBonuses = heroBonuses.length > 0;
        const heroTier = getTier(heroLevel);

        return (
          <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: heroIsExpanded ? '1px solid #4aff4a44' : '1px solid rgba(138,74,223,0.15)', ...(highlightHero ? { boxShadow: '0 0 12px #B8860B, 0 0 4px #FFD700', outline: '2px solid #FFD700' } : {}) }}>
            <div
              style={{ flex: '0 0 82%', padding: '6px 8px', background: heroIsExpanded ? 'rgba(74,255,74,0.05)' : 'rgba(20,15,35,0.6)', borderRight: '1px solid rgba(138,74,223,0.2)', cursor: heroHasBonuses ? 'pointer' : 'default', transition: 'background 0.15s' }}
              onClick={() => heroHasBonuses && doExpand('hero')}
            >
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 'bold', color: COLORS.heroBlue, marginBottom: '2px' }}>
                {'\u{1F9B8}'} Hero <span style={{ color: COLORS.textDim, fontWeight: 'normal', marginLeft: '4px' }}>Lv.{heroLevel}</span>
                {heroTier > 0 && <span style={{ color: '#ffd700', fontSize: '10px', marginLeft: '4px' }}>T{heroTier}</span>}
                {heroHasBonuses && <span style={{ fontSize: '11px', color: '#4aff4a', marginLeft: 'auto' }}>{heroIsExpanded ? '\u25B2' : '\u25BC'}</span>}
              </div>
              <div style={{ fontSize: '10px', color: COLORS.text, opacity: 0.85 }}>
                {'\u2764\uFE0F'}{actualHp}{hpDelta > 0 ? `(+${hpDelta})` : ''}{'  '}
                {'\u2694\uFE0F'}{actualDmg}{dmgDelta > 0 ? `(+${dmgDelta})` : ''}{'  '}
                {'\u{1F6E1}\uFE0F'}{actualDef}{defDelta > 0 ? `(+${defDelta})` : ''}{'  '}
                {'\u26A1'}{(60 / heroAtkRate).toFixed(1)}/s{'  '}
                {'\u{1F3C3}'}{cls.baseStats.speed}{'  '}
                {'\u{1F4CF}'}{cls.attackRange}px{'  '}
                {'\u{1F3AF}'}{Math.round(heroCritChance * 100)}%
                {heroHasBonuses && !heroIsExpanded && !hasExpanded.current && <span style={{ fontSize: '9px', color: '#888', marginLeft: '4px' }}>tap for details</span>}
              </div>
              {heroIsExpanded && <UnitBonusBreakdown bonuses={heroBonuses} />}
            </div>
            <button onClick={() => buyRunUpgradeMulti('hero', heroMulti.totalCost, heroMulti.levels)} disabled={!heroCanAfford} style={{
              flex: '0 0 18%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '6px 2px', fontSize: '12px', fontFamily: 'inherit', fontWeight: 'bold',
              background: heroCanAfford ? COLORS.heroBlue : 'rgba(20,15,30,0.85)', color: heroCanAfford ? '#000' : '#555',
              border: heroCanAfford ? 'none' : '1px solid rgba(138,74,223,0.2)', cursor: heroCanAfford ? 'pointer' : 'not-allowed',
            }}>
              {(heroMulti.levels) > 1 && <div style={{ fontSize: '10px', opacity: 0.8 }}>x{heroMulti.levels}</div>}
              <div style={{ fontSize: '12px' }}>{formatNumber(heroCost)}g</div>
            </button>
          </div>
        );
      })()}

      {/* Unit upgrades - only show unlocked units, hidden in Lone Wolf */}
      {game.challengeId !== 'loneWolf' && unitTypes.map(({ key, name, color, baseCost }) => {
        const isUnlocked = (upgrades.unlockedUnits as string[] || ['soldier']).includes(key);
        const hasActiveUnit = game.unitSlots.some(slot => slot.type === key);
        if (!isUnlocked || !hasActiveUnit) {
          return (
            <div key={key} style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', opacity: 0.35 }}>
              <div style={{ flex: '0 0 82%', padding: '6px 8px', background: 'rgba(15,10,25,0.5)', borderRight: '1px solid rgba(138,74,223,0.15)' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '3px' }}>{'\u{1F512}'} {name}</div>
                <div style={{ fontSize: '11px', color: '#444' }}>{!isUnlocked ? '\u00A0' : 'No active units in army'}</div>
              </div>
              <div style={{ flex: '0 0 18%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,10,25,0.7)' }}>
                <span style={{ fontSize: '13px' }}>{'\u{1F512}'}</span>
              </div>
            </div>
          );
        }
        const level = game.runUpgrades?.[key] || 0;
        const computed = unitComputations[key];
        if (!computed) return null;
        const { multi, cur, next } = computed;
        const stats = UNIT_STATS[key as keyof typeof UNIT_STATS] as any;
        const canAfford = multi.levels > 0;
        const tier = getTier(level);
        const isExpanded = expanded === key && cur.bonuses.length > 0;
        const hasBonuses = cur.bonuses.length > 0;

        // Stat deltas for hover
        const hpDelta = next.final.health - cur.final.health;
        const dmgDelta = next.final.damage - cur.final.damage;
        const defDelta = next.final.defense - cur.final.defense;

        return (
          <div key={key} style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: isExpanded ? '1px solid #4aff4a44' : '1px solid rgba(138,74,223,0.15)' }}>
            <div
              style={{ flex: '0 0 82%', padding: '6px 8px', background: isExpanded ? 'rgba(74,255,74,0.05)' : 'rgba(20,15,35,0.6)', borderRight: '1px solid rgba(138,74,223,0.2)', cursor: hasBonuses ? 'pointer' : 'default', transition: 'background 0.15s' }}
              onClick={() => hasBonuses && doExpand(key)}
            >
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 'bold', color: color, marginBottom: '2px' }}>
                {name} <span style={{ color: COLORS.textDim, fontWeight: 'normal', marginLeft: '4px' }}>Lv.{level}</span>
                {tier > 0 && <span style={{ color: '#ffd700', fontSize: '10px', marginLeft: '4px' }}>T{tier}</span>}
                {hasBonuses && <span style={{ fontSize: '11px', color: '#4aff4a', marginLeft: 'auto' }}>{isExpanded ? '\u25B2' : '\u25BC'}</span>}
              </div>
              <div style={{ fontSize: '10px', color: COLORS.text, opacity: 0.85 }}>
                {'\u2764\uFE0F'}{cur.final.health}{hpDelta > 0 ? `(+${hpDelta})` : ''}{'  '}
                {'\u2694\uFE0F'}{cur.final.damage}{dmgDelta > 0 ? `(+${dmgDelta})` : ''}{'  '}
                {'\u{1F6E1}\uFE0F'}{cur.final.defense}{defDelta > 0 ? `(+${defDelta})` : ''}{'  '}
                {'\u26A1'}{(60 / cur.final.attackRate).toFixed(1)}/s{'  '}
                {'\u{1F3C3}'}{cur.final.speed.toFixed(1)}{'  '}
                {'\u{1F4CF}'}{cur.final.range}px{'  '}
                {'\u{1F3AF}'}{Math.round(cur.final.critChance * 100)}%{'  '}
                {'\u23F1\uFE0F'}{(stats.respawnTime / 60).toFixed(0)}s
                {hasBonuses && !isExpanded && !hasExpanded.current && <span style={{ fontSize: '9px', color: '#888', marginLeft: '4px' }}>tap for details</span>}
              </div>
              {isExpanded && <UnitBonusBreakdown bonuses={cur.bonuses} />}
            </div>
            <button onClick={() => buyRunUpgradeMulti(key, multi.totalCost, multi.levels)} disabled={!canAfford} style={{
              flex: '0 0 18%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '6px 2px', fontSize: '12px', fontFamily: 'inherit', fontWeight: 'bold',
              background: canAfford ? color : 'rgba(20,15,30,0.85)', color: canAfford ? '#000' : '#555',
              border: canAfford ? 'none' : '1px solid rgba(138,74,223,0.2)', cursor: canAfford ? 'pointer' : 'not-allowed',
            }}>
              {(multi.levels) > 1 && <div style={{ fontSize: '10px', opacity: 0.8 }}>x{multi.levels}</div>}
              <div style={{ fontSize: '12px' }}>{formatNumber(multi.totalCost)}g</div>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function IncomeBonusList({ bonuses }: { bonuses: { source: string; effect: string }[] }) {
  if (bonuses.length === 0) return null;
  return (
    <div style={{ fontSize: '10px', marginTop: '4px', borderTop: '1px solid rgba(138,74,223,0.3)', paddingTop: '4px', background: 'rgba(10,5,20,0.4)', borderRadius: '3px', padding: '4px 6px' }}>
      {bonuses.map((b, i) => (
        <div key={i} style={{ marginBottom: '1px' }}>
          <span style={{ color: '#4aff4a' }}>{b.effect}</span>{' '}
          <span style={{ color: '#888' }}>from</span>{' '}
          <span style={{ color: '#c084fc' }}>{b.source}</span>
        </div>
      ))}
    </div>
  );
}

function IncomeTab({ game, upgrades, relicCollection, ancientRelicsOwned, ancientRelicCopies = {}, challengeCompletions, buyRunUpgrade, buyRunUpgradeMulti, purchaseMode, discount = 1, tutorialHighlights }: { game: GameState; upgrades: PermanentUpgrades; relicCollection: RelicCollection; ancientRelicsOwned: string[]; ancientRelicCopies?: Record<string, number>; challengeCompletions: ChallengeCompletions; buyRunUpgrade: (t: string, c: number) => void; buyRunUpgradeMulti: (t: string, totalCost: number, levels: number) => void; purchaseMode: PurchaseMode; discount?: number; tutorialHighlights?: { income?: boolean } }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const hasExpanded = useRef(false);
  const [incomePerSec, setIncomePerSec] = useState(false);
  const doExpand = (key: string, hasBonuses: boolean) => { if (!hasBonuses) return; hasExpanded.current = true; setExpanded(expanded === key ? null : key); };

  // Compute global income bonuses
  const hasTimeWarp = (ancientRelicsOwned || []).includes('timeWarpCrystal');
  const hasGoldRush = false;
  const hasTaxHaven = !!challengeCompletions.noRetreat;
  const hasWarChest = false;
  const hasFamineReward = !!challengeCompletions.famine;
  const hasMidasTouch = (ancientRelicsOwned || []).includes('midasTouch');
  const largerBagsLv = getRelicLevel(relicCollection['largerBags'] || 0);

  // Per-tier relic levels (v2 IDs)
  const tierRelics = {
    t1: { speed: getRelicLevel(relicCollection['slimeBait'] || 0), payout: getRelicLevel(relicCollection['biggerNets'] || 0), speedName: 'Slime Bait', payoutName: 'Bigger Nets', payoutPct: 5 },
    t2: { speed: getRelicLevel(relicCollection['gaiters'] || 0), payout: getRelicLevel(relicCollection['rucksack'] || 0), speedName: 'Gaiters', payoutName: 'Rucksack', payoutPct: 5 },
    t3: { speed: getRelicLevel(relicCollection['carriage'] || 0), payout: getRelicLevel(relicCollection['trunks'] || 0), speedName: 'Carriage', payoutName: 'Trunks', payoutPct: 5 },
    t4: { speed: getRelicLevel(relicCollection['blacksmithHammer'] || 0), payout: getRelicLevel(relicCollection['betterIron'] || 0), speedName: "Blacksmith's Hammer", payoutName: 'Better Iron', payoutPct: 5 },
    t5: { speed: getRelicLevel(relicCollection['nails'] || 0), payout: getRelicLevel(relicCollection['reinforcedPlanks'] || 0), speedName: 'Nails', payoutName: 'Reinforced Planks', payoutPct: 5 },
    t6: { speed: getRelicLevel(relicCollection['quills'] || 0), payout: getRelicLevel(relicCollection['papyrus'] || 0), speedName: 'Quills', payoutName: 'Papyrus', payoutPct: 5 },
    t7: { speed: getRelicLevel(relicCollection['trainingDummy'] || 0), payout: getRelicLevel(relicCollection['warHorn'] || 0), speedName: 'Training Dummy', payoutName: 'War Horn', payoutPct: 5 },
    t8: { speed: getRelicLevel(relicCollection['warTable'] || 0), payout: getRelicLevel(relicCollection['diplomacy'] || 0), speedName: 'War Table', payoutName: 'Diplomacy', payoutPct: 5 },
  };

  // Compute effective timeWarp multiplier (timer advances faster, scales with ancient relic level)
  const twcDisplayEff = hasTimeWarp ? getAncientEffect('timeWarpCrystal', getAncientRelicLevel(ancientRelicCopies['timeWarpCrystal'] || 1)) : null;
  const timeWarpMult = (twcDisplayEff ? 1 + (twcDisplayEff.tickSpeed || 0.03) : 1) * (hasGoldRush ? 1.03 : 1) * (hasTaxHaven ? 1.10 : 1);

  // Effective threshold & payout helpers
  function effectiveThreshold(baseTicks: number, speedRelicLv: number): number {
    return Math.floor(baseTicks * Math.max(0.5, 1 - speedRelicLv * 0.05));
  }
  function effectivePayout(basePayout: number, payoutRelicLv: number, payoutPct: number): number {
    return Math.floor(basePayout * (1 + payoutRelicLv * payoutPct / 100));
  }
  function effectiveCountdown(timer: number, threshold: number): string {
    const remaining = Math.max(0, threshold - timer);
    const seconds = remaining / (timeWarpMult * 60);
    return seconds < 10 ? seconds.toFixed(1) : String(Math.floor(seconds));
  }
  function effectiveProgress(timer: number, threshold: number): number {
    return threshold > 0 ? Math.min(100, (timer / threshold) * 100) : 0;
  }

  const hasArt = (id: string) => game.artifacts.some(a => a.id === id);
  const hasSyn = (pairId: string) => {
    const pairs = game.artifacts.map(a => a.id);
    // Check both artifacts of the pair are owned
    const PAIR_MAP: Record<string, [string, string]> = {
      econPair1: ['friendlySlimes', 'cookedGoo'], econPair2: ['treasure', 'caltrops'],
      econPair3: ['courier', 'tips'], econPair4: ['betterWeapons', 'betterSmithies'],
      econPair5: ['holdTheLine', 'enhancedWood'], econPair6: ['empoweredGlyphs', 'featheredPens'],
      econPair7: ['warBanner', 'drillSergeant'], econPair8: ['tithe', 'decree'],
    };
    const p = PAIR_MAP[pairId];
    return p ? pairs.includes(p[0]) && pairs.includes(p[1]) : false;
  };

  function getTierBonuses(tierKey: keyof typeof tierRelics): { source: string; effect: string }[] {
    const r = tierRelics[tierKey];
    const bonuses: { source: string; effect: string }[] = [];
    if (r.speed > 0) bonuses.push({ source: `${r.speedName} Lv${r.speed}`, effect: `${r.speed * 5}% faster` });
    if (r.payout > 0) bonuses.push({ source: `${r.payoutName} Lv${r.payout}`, effect: `+${r.payout * r.payoutPct}% payout` });
    if (hasTimeWarp) bonuses.push({ source: 'Time Warp Crystal', effect: '10% faster' });
    if (hasGoldRush) bonuses.push({ source: 'Gold Rush', effect: '3% faster' });
    if (hasTaxHaven) bonuses.push({ source: 'Tax Haven', effect: '10% faster' });
    // Artifact bonuses per tier
    if (tierKey === 't1') {
      if (hasArt('cookedGoo')) bonuses.push({ source: 'Cooked Goo', effect: '10% faster' });
      if (hasArt('friendlySlimes')) bonuses.push({ source: 'Friendly Slimes', effect: '1% spawn slime ally' });
      if (hasSyn('econPair1')) bonuses.push({ source: 'Goonergy', effect: 'Per slime: hero -1% dmg taken' });
    }
    if (tierKey === 't2') {
      if (hasArt('treasure')) bonuses.push({ source: 'Treasure!', effect: 'Proc drops consumable chest' });
      if (hasArt('caltrops')) bonuses.push({ source: 'Caltrops', effect: '20% enemies spawn wounded' });
      if (hasSyn('econPair2')) bonuses.push({ source: 'Looking Ahead', effect: '+20% chest gold & gems' });
    }
    if (tierKey === 't3') {
      if (hasArt('tips')) bonuses.push({ source: 'Tips', effect: '+10% payout' });
      if (hasArt('courier')) bonuses.push({ source: 'Courier', effect: '50% spawn courier' });
      if (hasSyn('econPair3')) bonuses.push({ source: 'Make Way', effect: 'Couriers earn gold at flags' });
    }
    if (tierKey === 't4') {
      if (hasArt('betterSmithies')) bonuses.push({ source: 'Better Smithies', effect: '10% faster' });
      if (hasArt('betterWeapons')) bonuses.push({ source: 'Better Weapons', effect: 'Melee +0.5 dmg/proc (max +2/zone)' });
      if (hasSyn('econPair4')) bonuses.push({ source: "Hero's Edge", effect: 'Auto dagger every 2s' });
    }
    if (tierKey === 't5') {
      if (hasArt('enhancedWood')) bonuses.push({ source: 'Enhanced Wood', effect: '+10% payout' });
      if (hasArt('holdTheLine')) bonuses.push({ source: 'Hold The Line', effect: 'Build barricade at portal' });
      if (hasSyn('econPair5')) bonuses.push({ source: 'Rally Post', effect: 'Barricade grants speed buff' });
    }
    if (tierKey === 't6') {
      if (hasArt('featheredPens')) bonuses.push({ source: 'Feathered Pens', effect: '10% faster' });
      if (hasArt('empoweredGlyphs')) bonuses.push({ source: 'Empowered Glyphs', effect: 'Mages +8% dmg for 3min' });
      if (hasSyn('econPair6')) bonuses.push({ source: 'Extra Scrolls', effect: 'Produces reroll voucher' });
    }
    if (tierKey === 't7') {
      if (hasArt('drillSergeant')) bonuses.push({ source: 'Drill Sergeant', effect: '10% faster' });
      if (hasArt('warBanner')) bonuses.push({ source: 'War Banner', effect: 'Spawn 9 militia units' });
      if (hasSyn('econPair7')) bonuses.push({ source: 'Goliath', effect: '1% chance large melee spawn' });
    }
    if (tierKey === 't8') {
      if (hasArt('tithe')) bonuses.push({ source: 'Tithe', effect: '10% double purchase' });
      if (hasArt('decree')) bonuses.push({ source: 'Decree', effect: 'Next ally death respawns' });
      if (hasSyn('econPair8')) bonuses.push({ source: 'Expansion', effect: 'Tithe on unit upgrades too' });
    }
    const zone = game.currentZone || 0;
    if (zone > 0) bonuses.push({ source: `Zone ${zone + 1} Bonus`, effect: `+${zone * 5}% gold` });
    return bonuses;
  }

  function getGoldDropBonuses(): { source: string; effect: string }[] {
    const bonuses: { source: string; effect: string }[] = [];
    if (hasWarChest) bonuses.push({ source: 'War Chest', effect: '+15% kill gold' });
    if (hasFamineReward) bonuses.push({ source: "Scavenger's Bounty", effect: '+25% kill gold' });
    if (hasMidasTouch) bonuses.push({ source: 'Midas Touch', effect: '+10% all gold' });
    if (largerBagsLv > 0) bonuses.push({ source: `Larger Bags Lv${largerBagsLv}`, effect: `+${largerBagsLv * 10}% kill gold` });
    if (hasArt('riches')) bonuses.push({ source: 'Riches', effect: 'More consumable chests' });
    if (hasSyn('econPair2')) bonuses.push({ source: 'Looking Ahead', effect: '+20% chest gold & gems' });
    const zone = game.currentZone || 0;
    if (zone > 0) bonuses.push({ source: `Zone ${zone + 1} Bonus`, effect: `+${zone * 5}% gold` });
    return bonuses;
  }
  // Memoize all computeMultiBuy calls — only recalculate when gold/levels/mode change, not every frame
  const gold = game.goldEarned;
  const ru = game.runUpgrades;
  const level = ru?.passiveIncome || 0;
  const level2 = ru?.passiveIncome2 || 0;
  const level3 = ru?.passiveIncome3 || 0;
  const level4 = ru?.passiveIncome4 || 0;
  const level5 = ru?.passiveIncome5 || 0;
  const level6 = ru?.passiveIncome6 || 0;
  const level7 = ru?.passiveIncome7 || 0;
  const level8 = ru?.passiveIncome8 || 0;

  const incomeMultis = useMemo(() => ({
    multi1: computeMultiBuy(slimesCost, level, gold, purchaseMode, discount),
    multi2: computeMultiBuy(forestsCost, level2, gold, purchaseMode, discount),
    multi3: computeMultiBuy(deliveryCost, level3, gold, purchaseMode, discount),
    multi4: computeMultiBuy(smithCost, level4, gold, purchaseMode, discount),
    multi5: computeMultiBuy(barricadeCost, level5, gold, purchaseMode, discount),
    multi6: computeMultiBuy(enchantingCost, level6, gold, purchaseMode, discount),
    multi7: computeMultiBuy(militiaCost, level7, gold, purchaseMode, discount),
    multi8: computeMultiBuy(territoryCost, level8, gold, purchaseMode, discount),
  }), [gold, level, level2, level3, level4, level5, level6, level7, level8, purchaseMode, discount]);
  const { multi1, multi2, multi3, multi4, multi5, multi6, multi7, multi8 } = incomeMultis;

  // Tier 1: Hunting Slimes (1s = 60 ticks)
  const timer1 = game.incomeTimer || 0;
  const cookedGooMult = hasArt('cookedGoo') ? 0.9 : 1;
  const t1Thresh = Math.floor(effectiveThreshold(60, tierRelics.t1.speed) * cookedGooMult);
  const progress = level > 0 ? effectiveProgress(timer1, t1Thresh) : 0;
  const countdown1 = level > 0 ? effectiveCountdown(timer1, t1Thresh) : null;
  const incomeT1 = level > 0 ? effectivePayout(huntingSlimesIncome(level), tierRelics.t1.payout, tierRelics.t1.payoutPct) : 0;
  const nextIncomeT1 = effectivePayout(huntingSlimesIncome(level + Math.max(1, multi1.levels)), tierRelics.t1.payout, tierRelics.t1.payoutPct);

  // Tier 2: Scouting the Forests (10s = 600 ticks)
  const timer2 = game.incomeTimer2 || 0;
  const t2Thresh = effectiveThreshold(600, tierRelics.t2.speed);
  const progress2 = level2 > 0 ? effectiveProgress(timer2, t2Thresh) : 0;
  const countdown2 = level2 > 0 ? effectiveCountdown(timer2, t2Thresh) : null;
  const incomeT2 = level2 > 0 ? effectivePayout(scoutingForestsPayout(level2), tierRelics.t2.payout, tierRelics.t2.payoutPct) : 0;
  const nextIncomeT2 = effectivePayout(scoutingForestsPayout(level2 + Math.max(1, multi2.levels)), tierRelics.t2.payout, tierRelics.t2.payoutPct);
  const tier2Unlocked = !!(upgrades.incomeTier2) || level2 > 0;

  // Tier 3: Delivering Resources (1min = 3600 ticks)
  const timer3 = game.incomeTimer3 || 0;
  const t3Thresh = effectiveThreshold(3600, tierRelics.t3.speed);
  const progress3 = level3 > 0 ? effectiveProgress(timer3, t3Thresh) : 0;
  const countdown3 = level3 > 0 ? effectiveCountdown(timer3, t3Thresh) : null;
  const tipsMult = hasArt('tips') ? 1.10 : 1;
  const deliveryAmount = level3 > 0 ? Math.floor(effectivePayout(deliveringResourcesPayout(level3), tierRelics.t3.payout, tierRelics.t3.payoutPct) * tipsMult) : 0;
  const nextDelivery = Math.floor(effectivePayout(deliveringResourcesPayout(level3 + Math.max(1, multi3.levels)), tierRelics.t3.payout, tierRelics.t3.payoutPct) * tipsMult);
  const tier3Unlocked = !!(upgrades.incomeTier3) || level3 > 0;

  // Tier 4: Smithing The Swords (3min = 10800 ticks)
  const timer4 = game.incomeTimer4 || 0;
  const betterSmithiesMult = hasArt('betterSmithies') ? 0.9 : 1;
  const t4Thresh = Math.floor(effectiveThreshold(10800, tierRelics.t4.speed) * betterSmithiesMult);
  const progress4 = level4 > 0 ? effectiveProgress(timer4, t4Thresh) : 0;
  const countdown4 = level4 > 0 ? effectiveCountdown(timer4, t4Thresh) : null;
  const smithAmount = level4 > 0 ? effectivePayout(smithingSwordsPayout(level4), tierRelics.t4.payout, tierRelics.t4.payoutPct) : 0;
  const nextSmith = effectivePayout(smithingSwordsPayout(level4 + Math.max(1, multi4.levels)), tierRelics.t4.payout, tierRelics.t4.payoutPct);
  const tier4Unlocked = !!(upgrades.incomeTier4) || level4 > 0;

  // Tier 5: Reinforcing the Barricades (5min = 18000 ticks)
  const timer5 = game.incomeTimer5 || 0;
  const t5Thresh = effectiveThreshold(18000, tierRelics.t5.speed);
  const progress5 = level5 > 0 ? effectiveProgress(timer5, t5Thresh) : 0;
  const countdown5 = level5 > 0 ? effectiveCountdown(timer5, t5Thresh) : null;
  const enhancedWoodMult = hasArt('enhancedWood') ? 1.10 : 1;
  const barricadeAmount = level5 > 0 ? Math.floor(effectivePayout(reinforcingBarricadesPayout(level5), tierRelics.t5.payout, tierRelics.t5.payoutPct) * enhancedWoodMult) : 0;
  const nextBarricade = Math.floor(effectivePayout(reinforcingBarricadesPayout(level5 + Math.max(1, multi5.levels)), tierRelics.t5.payout, tierRelics.t5.payoutPct) * enhancedWoodMult);
  const tier5Unlocked = !!(upgrades.incomeTier5) || level5 > 0;

  // Tier 6: Enchanting The Scrolls (10min = 36000 ticks)
  const timer6 = game.incomeTimer6 || 0;
  const featheredPensMult = hasArt('featheredPens') ? 0.9 : 1;
  const t6Thresh = Math.floor(effectiveThreshold(36000, tierRelics.t6.speed) * featheredPensMult);
  const progress6 = level6 > 0 ? effectiveProgress(timer6, t6Thresh) : 0;
  const countdown6 = level6 > 0 ? effectiveCountdown(timer6, t6Thresh) : null;
  const enchantAmount = level6 > 0 ? effectivePayout(enchantingScrollsPayout(level6), tierRelics.t6.payout, tierRelics.t6.payoutPct) : 0;
  const nextEnchant = effectivePayout(enchantingScrollsPayout(level6 + Math.max(1, multi6.levels)), tierRelics.t6.payout, tierRelics.t6.payoutPct);
  const tier6Unlocked = !!(upgrades.incomeTier6) || level6 > 0;

  // Tier 7: Training Militia (20min = 72000 ticks)
  const timer7 = game.incomeTimer7 || 0;
  const drillSergeantMult = hasArt('drillSergeant') ? 0.9 : 1;
  const t7Thresh = Math.floor(effectiveThreshold(72000, tierRelics.t7.speed) * drillSergeantMult);
  const progress7 = level7 > 0 ? effectiveProgress(timer7, t7Thresh) : 0;
  const countdown7 = level7 > 0 ? effectiveCountdown(timer7, t7Thresh) : null;
  const militiaAmount = level7 > 0 ? effectivePayout(trainingMilitiaPayout(level7), tierRelics.t7.payout, tierRelics.t7.payoutPct) : 0;
  const nextMilitia = effectivePayout(trainingMilitiaPayout(level7 + Math.max(1, multi7.levels)), tierRelics.t7.payout, tierRelics.t7.payoutPct);
  const tier7Unlocked = !!(upgrades.incomeTier7) || level7 > 0;

  // Tier 8: Expanding Territories (30min = 108000 ticks)
  const timer8 = game.incomeTimer8 || 0;
  const t8Thresh = effectiveThreshold(108000, tierRelics.t8.speed);
  const progress8 = level8 > 0 ? effectiveProgress(timer8, t8Thresh) : 0;
  const countdown8 = level8 > 0 ? effectiveCountdown(timer8, t8Thresh) : null;
  const territoryAmount = level8 > 0 ? effectivePayout(expandingTerritoriesPayout(level8), tierRelics.t8.payout, tierRelics.t8.payoutPct) : 0;
  const nextTerritory = effectivePayout(expandingTerritoriesPayout(level8 + Math.max(1, multi8.levels)), tierRelics.t8.payout, tierRelics.t8.payoutPct);
  const tier8Unlocked = !!(upgrades.incomeTier8) || level8 > 0;

  const highlightIncome = tutorialHighlights?.income || false;


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <style>{`.inc-row .inc-delta{display:none}.inc-row:hover .inc-delta{display:inline}`}</style>
      {/* Passive Income Summary */}
      {game.challengeId !== 'famine' && (() => {
        const t1PerMin = level > 0 ? incomeT1 * 60 : 0;
        const t2PerMin = level2 > 0 ? Math.floor(incomeT2 * 6) : 0;
        const t3PerMin = level3 > 0 ? deliveryAmount : 0;
        const t4PerMin = level4 > 0 ? Math.floor(smithAmount / 3) : 0;
        const t5PerMin = level5 > 0 ? Math.floor(barricadeAmount / 5) : 0;
        const t6PerMin = level6 > 0 ? Math.floor(enchantAmount / 10) : 0;
        const t7PerMin = level7 > 0 ? Math.floor(militiaAmount / 20) : 0;
        const t8PerMin = level8 > 0 ? Math.floor(territoryAmount / 30) : 0;
        const totalPerMin = t1PerMin + t2PerMin + t3PerMin + t4PerMin + t5PerMin + t6PerMin + t7PerMin + t8PerMin;
        const totalPerSec = totalPerMin / 60;
        return (
          <div onClick={() => setIncomePerSec(!incomePerSec)} style={{ textAlign: 'center', padding: '6px', background: 'rgba(20,15,35,0.5)', borderRadius: '4px', border: '1px solid rgba(138,74,223,0.15)', cursor: 'pointer', userSelect: 'none' }}>
            <span style={{ fontSize: '11px', color: COLORS.textDim }}>
              Passive: +{incomePerSec ? `${formatNumber(totalPerSec)}g/sec` : `${formatNumber(totalPerMin)}g/min`}
            </span>
          </div>
        );
      })()}
      {/* Gold Drop */}
      {(() => {
        const gdLevel = game.runUpgrades?.goldBonus || 0;
        const gdMulti = computeMultiBuy((l) => goldDropUpgradeCost(l), gdLevel, game.goldEarned, purchaseMode, discount);
        const gdBonus = goldDropMult(gdLevel);
        const gdBonusNext = goldDropMult(gdLevel + Math.max(1, gdMulti.levels));
        const gdBonuses = getGoldDropBonuses();
        const gdExpanded = expanded === 'goldDrop' && gdBonuses.length > 0;
        return (
          <div className="inc-row" style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: gdExpanded ? '1px solid #4aff4a44' : '1px solid rgba(138,74,223,0.15)' }}>
            <div onClick={() => doExpand('goldDrop', gdBonuses.length > 0)} style={{ flex: '0 0 82%', padding: '6px 8px', background: gdExpanded ? 'rgba(74,255,74,0.05)' : 'rgba(20,15,35,0.6)', borderRight: '1px solid rgba(138,74,223,0.2)', cursor: gdBonuses.length > 0 ? 'pointer' : 'default', transition: 'background 0.15s' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffa', marginBottom: '3px' }}>
                {'\u{1F480}'} Gold Drop <span style={{ color: COLORS.textDim, fontWeight: 'normal' }}>Lv.{gdLevel}</span>
                {getTier(gdLevel) > 0 && <span style={{ color: '#ffd700', fontSize: '10px', marginLeft: '4px' }}>T{getTier(gdLevel)}</span>}
                {gdBonuses.length > 0 && <span style={{ fontSize: '11px', color: '#4aff4a', marginLeft: 'auto', float: 'right' }}>{gdExpanded ? '\u25B2' : '\u25BC'}</span>}
              </div>
              <div style={{ fontSize: '11px', color: COLORS.text, opacity: 0.85 }}>
                {gdBonus.toFixed(2)}x kill gold {'\u2192'} <span style={{ color: '#ffa' }}>{gdBonusNext.toFixed(2)}x</span> <span className="inc-delta" style={{ fontSize: '10px', color: '#aa8' }}>(+{((gdBonusNext - gdBonus) * 100).toFixed(1)}%)</span>
              </div>
              {game.frame >= 300 && (game.killGoldEarned || 0) > 0 && (() => {
                const snappedFrame = Math.floor(game.frame / 300) * 300; // Update every 5 seconds
                const gpm = Math.round((game.killGoldEarned || 0) / (snappedFrame / 3600));
                return (
                  <div style={{ fontSize: '10px', color: '#8c8', marginTop: '2px' }}>
                    Earning: {formatNumber(gpm)}g/min from kills
                  </div>
                );
              })()}
              {gdBonuses.length > 0 && !gdExpanded && !hasExpanded.current && <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>tap for bonus details</div>}
              {gdExpanded && <IncomeBonusList bonuses={gdBonuses} />}
            </div>
            <button onClick={() => buyRunUpgradeMulti('goldBonus', gdMulti.totalCost, gdMulti.levels)} disabled={gdMulti.levels <= 0} style={{
              flex: '0 0 18%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '6px 2px', fontSize: '12px', fontFamily: 'inherit', fontWeight: 'bold',
              background: gdMulti.levels > 0 ? '#ffa' : 'rgba(20,15,30,0.85)', color: gdMulti.levels > 0 ? '#000' : '#555',
              border: gdMulti.levels > 0 ? 'none' : '1px solid rgba(138,74,223,0.2)', cursor: gdMulti.levels > 0 ? 'pointer' : 'not-allowed',
            }}>
              {gdMulti.levels > 1 && <div style={{ fontSize: '10px', opacity: 0.8 }}>x{gdMulti.levels}</div>}
              {formatNumber(gdMulti.totalCost)}g
            </button>
          </div>
        );
      })()}

      {/* Famine: all passive income tiers locked */}
      {game.challengeId === 'famine' && (
        <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(50,10,10,0.5)', borderRadius: '4px', border: '1px solid rgba(138,74,223,0.3)' }}>
          <div style={{ color: '#ff6644', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>💀 FAMINE</div>
          <div style={{ color: '#888', fontSize: '11px' }}>All passive income is disabled. Gold from kills only.</div>
        </div>
      )}

      {game.challengeId !== 'famine' && (<>
      {/* Tier 1: Hunting Slimes */}
      {(() => { const t1b = getTierBonuses('t1'); const t1exp = expanded === 't1' && t1b.length > 0; return (
      <div className="inc-row" style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: t1exp ? '1px solid #4aff4a44' : '1px solid rgba(138,74,223,0.15)', ...(highlightIncome ? { boxShadow: '0 0 12px #B8860B, 0 0 4px #FFD700', outline: '2px solid #FFD700' } : {}) }}>
        <div onClick={() => doExpand('t1', t1b.length > 0)} style={{ flex: '0 0 82%', padding: '6px 8px', background: t1exp ? 'rgba(74,255,74,0.05)' : 'rgba(255,255,255,0.05)', borderRight: '1px solid #333', cursor: t1b.length > 0 ? 'pointer' : 'default', transition: 'background 0.15s' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#8f8', marginBottom: '4px' }}>
            {'\u{1F438}'} Hunting Slimes <span style={{ color: COLORS.textDim, fontWeight: 'normal' }}>Lv.{level}</span>
            {getTier(level) > 0 && <span style={{ color: '#ffd700', fontSize: '10px', marginLeft: '4px' }}>T{getTier(level)}</span>}
            {t1b.length > 0 && <span style={{ fontSize: '11px', color: '#4aff4a', float: 'right' }}>{t1exp ? '\u25B2' : '\u25BC'}</span>}
          </div>
          {level > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: COLORS.text }}>+{formatNumber(incomeT1)}g {'\u2192'} <span style={{ color: '#8f8' }}>+{formatNumber(nextIncomeT1)}g</span> <span className="inc-delta" style={{ fontSize: '10px', color: '#6a6' }}>(+{formatNumber(nextIncomeT1 - incomeT1)})</span></span>
                <span style={{ fontSize: '11px', color: '#8f8' }}>{'\u23F1'} {countdown1}s</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: '#1a0e2a', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #4a8, #8f8)', transition: 'none' }} />
              </div>
              {t1exp && <IncomeBonusList bonuses={t1b} />}
            </>
          ) : (
            <div style={{ fontSize: '11px', color: COLORS.textDim }}>Earn gold every 1s {'\u00B7'} <span style={{ color: '#8f8' }}>+{formatNumber(nextIncomeT1)}g</span></div>
          )}
        </div>
        <button onClick={() => buyRunUpgradeMulti('passiveIncome', multi1.totalCost, multi1.levels)} disabled={multi1.levels <= 0} style={{
          flex: '0 0 18%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '6px 2px', fontSize: '12px', fontFamily: 'inherit', fontWeight: 'bold',
          background: multi1.levels > 0 ? '#8f8' : 'rgba(20,15,30,0.85)', color: multi1.levels > 0 ? '#000' : '#555',
          border: multi1.levels > 0 ? 'none' : '1px solid rgba(138,74,223,0.2)', cursor: multi1.levels > 0 ? 'pointer' : 'not-allowed',
        }}>
          {multi1.levels > 1 && <div style={{ fontSize: '10px', opacity: 0.8 }}>x{multi1.levels}</div>}
          {formatNumber(multi1.totalCost)}g
        </button>
      </div>
      ); })()}

      {/* Tier 2: Scouting the Forests */}
      {(() => { const tb = getTierBonuses('t2'); const texp = expanded === 't2' && tb.length > 0; return (
      <div className="inc-row" style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', opacity: tier2Unlocked ? 1 : 0.5, border: texp ? '1px solid #4aff4a44' : '1px solid rgba(138,74,223,0.15)' }}>
        <div onClick={() => tier2Unlocked && doExpand('t2', tb.length > 0)} style={{ flex: '0 0 82%', padding: '6px 8px', background: texp ? 'rgba(74,255,74,0.05)' : 'rgba(20,15,35,0.6)', borderRight: '1px solid rgba(138,74,223,0.2)', cursor: tier2Unlocked && tb.length > 0 ? 'pointer' : 'default', transition: 'background 0.15s' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: tier2Unlocked ? '#ff8' : '#666', marginBottom: '4px' }}>
            {tier2Unlocked ? '\u{1F332}' : '\u{1F512}'} Scouting the Forests <span style={{ color: COLORS.textDim, fontWeight: 'normal' }}>Lv.{level2}</span>
            {getTier(level2) > 0 && <span style={{ color: '#ffd700', fontSize: '10px', marginLeft: '4px' }}>T{getTier(level2)}</span>}
            {tier2Unlocked && tb.length > 0 && <span style={{ fontSize: '11px', color: '#4aff4a', float: 'right' }}>{texp ? '\u25B2' : '\u25BC'}</span>}
          </div>
          {!tier2Unlocked ? (
            <div style={{ fontSize: '11px', color: '#666' }}>&nbsp;</div>
          ) : level2 > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: COLORS.text }}>+{formatNumber(incomeT2)}g {'\u2192'} <span style={{ color: '#ff8' }}>+{formatNumber(nextIncomeT2)}g</span> <span className="inc-delta" style={{ fontSize: '10px', color: '#aa6' }}>(+{formatNumber(nextIncomeT2 - incomeT2)})</span></span>
                <span style={{ fontSize: '11px', color: '#ff8' }}>{'\u23F1'} {countdown2}s</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: '#1a0e2a', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${progress2}%`, height: '100%', background: 'linear-gradient(90deg, #a84, #ff8)', transition: 'none' }} />
              </div>
              {texp && <IncomeBonusList bonuses={tb} />}
            </>
          ) : (
            <div style={{ fontSize: '11px', color: COLORS.textDim }}>Big payout every 10s {'\u00B7'} <span style={{ color: '#ff8' }}>+{formatNumber(nextIncomeT2)}g</span></div>
          )}
        </div>
        <button onClick={() => buyRunUpgradeMulti('passiveIncome2', multi2.totalCost, multi2.levels)} disabled={!tier2Unlocked || multi2.levels <= 0} style={{
          flex: '0 0 18%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '6px 2px', fontSize: '12px', fontFamily: 'inherit', fontWeight: 'bold',
          background: tier2Unlocked && multi2.levels > 0 ? '#ff8' : 'rgba(20,15,30,0.85)', color: tier2Unlocked && multi2.levels > 0 ? '#000' : '#555',
          border: tier2Unlocked && multi2.levels > 0 ? 'none' : '1px solid rgba(138,74,223,0.2)', cursor: tier2Unlocked && multi2.levels > 0 ? 'pointer' : 'not-allowed',
        }}>
          {tier2Unlocked ? <>{multi2.levels > 1 && <div style={{ fontSize: '10px', opacity: 0.8 }}>x{multi2.levels}</div>}{formatNumber(multi2.totalCost)}g</> : '\u{1F512}'}
        </button>
      </div>
      ); })()}

      {/* Tier 3: Delivering Resources */}
      {(() => { const tb = getTierBonuses('t3'); const texp = expanded === 't3' && tb.length > 0; return (
      <div className="inc-row" style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', opacity: tier3Unlocked ? 1 : 0.5, border: texp ? '1px solid #4aff4a44' : '1px solid rgba(138,74,223,0.15)' }}>
        <div onClick={() => tier3Unlocked && doExpand('t3', tb.length > 0)} style={{ flex: '0 0 82%', padding: '6px 8px', background: texp ? 'rgba(74,255,74,0.05)' : 'rgba(20,15,35,0.6)', borderRight: '1px solid rgba(138,74,223,0.2)', cursor: tier3Unlocked && tb.length > 0 ? 'pointer' : 'default', transition: 'background 0.15s' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: tier3Unlocked ? '#f8f' : '#666', marginBottom: '4px' }}>
            {tier3Unlocked ? '\u{1F4E6}' : '\u{1F512}'} Delivering Resources <span style={{ color: COLORS.textDim, fontWeight: 'normal' }}>Lv.{level3}</span>
            {getTier(level3) > 0 && <span style={{ color: '#ffd700', fontSize: '10px', marginLeft: '4px' }}>T{getTier(level3)}</span>}
            {tier3Unlocked && tb.length > 0 && <span style={{ fontSize: '11px', color: '#4aff4a', float: 'right' }}>{texp ? '\u25B2' : '\u25BC'}</span>}
          </div>
          {!tier3Unlocked ? (
            <div style={{ fontSize: '11px', color: '#666' }}>&nbsp;</div>
          ) : level3 > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: COLORS.text }}>+{formatNumber(deliveryAmount)}g {'\u2192'} <span style={{ color: '#f8f' }}>+{formatNumber(nextDelivery)}g</span> <span className="inc-delta" style={{ fontSize: '10px', color: '#a6a' }}>(+{formatNumber(nextDelivery - deliveryAmount)})</span></span>
                <span style={{ fontSize: '11px', color: '#f8f' }}>{'\u23F1'} {countdown3}s</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: '#1a0e2a', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${progress3}%`, height: '100%', background: 'linear-gradient(90deg, #84a, #f8f)', transition: 'none' }} />
              </div>
              {texp && <IncomeBonusList bonuses={tb} />}
            </>
          ) : (
            <div style={{ fontSize: '11px', color: COLORS.textDim }}>Massive payout every 1 min {'\u00B7'} <span style={{ color: '#f8f' }}>+{formatNumber(nextDelivery)}g</span></div>
          )}
        </div>
        <button onClick={() => buyRunUpgradeMulti('passiveIncome3', multi3.totalCost, multi3.levels)} disabled={!tier3Unlocked || multi3.levels <= 0} style={{
          flex: '0 0 18%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '6px 2px', fontSize: '12px', fontFamily: 'inherit', fontWeight: 'bold',
          background: tier3Unlocked && multi3.levels > 0 ? '#f8f' : 'rgba(20,15,30,0.85)', color: tier3Unlocked && multi3.levels > 0 ? '#000' : '#555',
          border: tier3Unlocked && multi3.levels > 0 ? 'none' : '1px solid rgba(138,74,223,0.2)', cursor: tier3Unlocked && multi3.levels > 0 ? 'pointer' : 'not-allowed',
        }}>
          {tier3Unlocked ? <>{multi3.levels > 1 && <div style={{ fontSize: '10px', opacity: 0.8 }}>x{multi3.levels}</div>}{formatNumber(multi3.totalCost)}g</> : '\u{1F512}'}
        </button>
      </div>
      ); })()}

      {/* Tier 4: Smithing The Swords */}
      {(() => { const tb = getTierBonuses('t4'); const texp = expanded === 't4' && tb.length > 0; return (
      <div className="inc-row" style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', opacity: tier4Unlocked ? 1 : 0.5, border: texp ? '1px solid #4aff4a44' : '1px solid rgba(138,74,223,0.15)' }}>
        <div onClick={() => tier4Unlocked && doExpand('t4', tb.length > 0)} style={{ flex: '0 0 82%', padding: '6px 8px', background: texp ? 'rgba(74,255,74,0.05)' : 'rgba(20,15,35,0.6)', borderRight: '1px solid rgba(138,74,223,0.2)', cursor: tier4Unlocked && tb.length > 0 ? 'pointer' : 'default', transition: 'background 0.15s' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: tier4Unlocked ? '#f84' : '#666', marginBottom: '4px' }}>
            {tier4Unlocked ? '\u2692\uFE0F' : '\u{1F512}'} Smithing The Swords <span style={{ color: COLORS.textDim, fontWeight: 'normal' }}>Lv.{level4}</span>
            {getTier(level4) > 0 && <span style={{ color: '#ffd700', fontSize: '10px', marginLeft: '4px' }}>T{getTier(level4)}</span>}
            {tier4Unlocked && tb.length > 0 && <span style={{ fontSize: '11px', color: '#4aff4a', float: 'right' }}>{texp ? '\u25B2' : '\u25BC'}</span>}
          </div>
          {!tier4Unlocked ? (
            <div style={{ fontSize: '11px', color: '#666' }}>&nbsp;</div>
          ) : level4 > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: COLORS.text }}>+{formatNumber(smithAmount)}g {'\u2192'} <span style={{ color: '#f84' }}>+{formatNumber(nextSmith)}g</span> <span className="inc-delta" style={{ fontSize: '10px', color: '#a64' }}>(+{formatNumber(nextSmith - smithAmount)})</span></span>
                <span style={{ fontSize: '11px', color: '#f84' }}>{'\u23F1'} {countdown4}s</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: '#1a0e2a', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${progress4}%`, height: '100%', background: 'linear-gradient(90deg, #a44, #f84)', transition: 'none' }} />
              </div>
              {texp && <IncomeBonusList bonuses={tb} />}
            </>
          ) : (
            <div style={{ fontSize: '11px', color: COLORS.textDim }}>Huge payout every 3 min {'\u00B7'} <span style={{ color: '#f84' }}>+{formatNumber(nextSmith)}g</span></div>
          )}
        </div>
        <button onClick={() => buyRunUpgradeMulti('passiveIncome4', multi4.totalCost, multi4.levels)} disabled={!tier4Unlocked || multi4.levels <= 0} style={{
          flex: '0 0 18%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '6px 2px', fontSize: '12px', fontFamily: 'inherit', fontWeight: 'bold',
          background: tier4Unlocked && multi4.levels > 0 ? '#f84' : 'rgba(20,15,30,0.85)', color: tier4Unlocked && multi4.levels > 0 ? '#000' : '#555',
          border: tier4Unlocked && multi4.levels > 0 ? 'none' : '1px solid rgba(138,74,223,0.2)', cursor: tier4Unlocked && multi4.levels > 0 ? 'pointer' : 'not-allowed',
        }}>
          {tier4Unlocked ? <>{multi4.levels > 1 && <div style={{ fontSize: '10px', opacity: 0.8 }}>x{multi4.levels}</div>}{formatNumber(multi4.totalCost)}g</> : '\u{1F512}'}
        </button>
      </div>
      ); })()}

      {/* Tier 5: Reinforcing the Barricades */}
      {(() => { const tb = getTierBonuses('t5'); const texp = expanded === 't5' && tb.length > 0; return (
      <div className="inc-row" style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', opacity: tier5Unlocked ? 1 : 0.5, border: texp ? '1px solid #4aff4a44' : '1px solid rgba(138,74,223,0.15)' }}>
        <div onClick={() => tier5Unlocked && doExpand('t5', tb.length > 0)} style={{ flex: '0 0 82%', padding: '6px 8px', background: texp ? 'rgba(74,255,74,0.05)' : 'rgba(20,15,35,0.6)', borderRight: '1px solid rgba(138,74,223,0.2)', cursor: tier5Unlocked && tb.length > 0 ? 'pointer' : 'default', transition: 'background 0.15s' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: tier5Unlocked ? '#ff4' : '#666', marginBottom: '4px' }}>
            {tier5Unlocked ? '\u{1F3F0}' : '\u{1F512}'} Reinforcing the Barricades <span style={{ color: COLORS.textDim, fontWeight: 'normal' }}>Lv.{level5}</span>
            {getTier(level5) > 0 && <span style={{ color: '#ffd700', fontSize: '10px', marginLeft: '4px' }}>T{getTier(level5)}</span>}
            {tier5Unlocked && tb.length > 0 && <span style={{ fontSize: '11px', color: '#4aff4a', float: 'right' }}>{texp ? '\u25B2' : '\u25BC'}</span>}
          </div>
          {!tier5Unlocked ? (
            <div style={{ fontSize: '11px', color: '#666' }}>&nbsp;</div>
          ) : level5 > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: COLORS.text }}>+{formatNumber(barricadeAmount)}g {'\u2192'} <span style={{ color: '#ff4' }}>+{formatNumber(nextBarricade)}g</span> <span className="inc-delta" style={{ fontSize: '10px', color: '#aa4' }}>(+{formatNumber(nextBarricade - barricadeAmount)})</span></span>
                <span style={{ fontSize: '11px', color: '#ff4' }}>{'\u23F1'} {countdown5}s</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: '#1a0e2a', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${progress5}%`, height: '100%', background: 'linear-gradient(90deg, #a84, #ff4)', transition: 'none' }} />
              </div>
              {texp && <IncomeBonusList bonuses={tb} />}
            </>
          ) : (
            <div style={{ fontSize: '11px', color: COLORS.textDim }}>Enormous payout every 5 min {'\u00B7'} <span style={{ color: '#ff4' }}>+{formatNumber(nextBarricade)}g</span></div>
          )}
        </div>
        <button onClick={() => buyRunUpgradeMulti('passiveIncome5', multi5.totalCost, multi5.levels)} disabled={!tier5Unlocked || multi5.levels <= 0} style={{
          flex: '0 0 18%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '6px 2px', fontSize: '12px', fontFamily: 'inherit', fontWeight: 'bold',
          background: tier5Unlocked && multi5.levels > 0 ? '#ff4' : 'rgba(20,15,30,0.85)', color: tier5Unlocked && multi5.levels > 0 ? '#000' : '#555',
          border: tier5Unlocked && multi5.levels > 0 ? 'none' : '1px solid rgba(138,74,223,0.2)', cursor: tier5Unlocked && multi5.levels > 0 ? 'pointer' : 'not-allowed',
        }}>
          {tier5Unlocked ? <>{multi5.levels > 1 && <div style={{ fontSize: '10px', opacity: 0.8 }}>x{multi5.levels}</div>}{formatNumber(multi5.totalCost)}g</> : '\u{1F512}'}
        </button>
      </div>
      ); })()}

      {/* Tier 6: Enchanting The Scrolls */}
      {(() => { const tb = getTierBonuses('t6'); const texp = expanded === 't6' && tb.length > 0; return (
      <div className="inc-row" style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', opacity: tier6Unlocked ? 1 : 0.5, border: texp ? '1px solid #4aff4a44' : '1px solid rgba(138,74,223,0.15)' }}>
        <div onClick={() => tier6Unlocked && doExpand('t6', tb.length > 0)} style={{ flex: '0 0 82%', padding: '6px 8px', background: texp ? 'rgba(74,255,74,0.05)' : 'rgba(20,15,35,0.6)', borderRight: '1px solid rgba(138,74,223,0.2)', cursor: tier6Unlocked && tb.length > 0 ? 'pointer' : 'default', transition: 'background 0.15s' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: tier6Unlocked ? '#a8f' : '#666', marginBottom: '4px' }}>
            {tier6Unlocked ? '\u{1F4DC}' : '\u{1F512}'} Enchanting The Scrolls <span style={{ color: COLORS.textDim, fontWeight: 'normal' }}>Lv.{level6}</span>
            {getTier(level6) > 0 && <span style={{ color: '#ffd700', fontSize: '10px', marginLeft: '4px' }}>T{getTier(level6)}</span>}
            {tier6Unlocked && tb.length > 0 && <span style={{ fontSize: '11px', color: '#4aff4a', float: 'right' }}>{texp ? '\u25B2' : '\u25BC'}</span>}
          </div>
          {!tier6Unlocked ? (
            <div style={{ fontSize: '11px', color: '#666' }}>&nbsp;</div>
          ) : level6 > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: COLORS.text }}>+{formatNumber(enchantAmount)}g {'\u2192'} <span style={{ color: '#a8f' }}>+{formatNumber(nextEnchant)}g</span> <span className="inc-delta" style={{ fontSize: '10px', color: '#86a' }}>(+{formatNumber(nextEnchant - enchantAmount)})</span></span>
                <span style={{ fontSize: '11px', color: '#a8f' }}>{'\u23F1'} {countdown6}s</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: '#1a0e2a', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${progress6}%`, height: '100%', background: 'linear-gradient(90deg, #648, #a8f)', transition: 'none' }} />
              </div>
              {texp && <IncomeBonusList bonuses={tb} />}
            </>
          ) : (
            <div style={{ fontSize: '11px', color: COLORS.textDim }}>Colossal payout every 10 min {'\u00B7'} <span style={{ color: '#a8f' }}>+{formatNumber(nextEnchant)}g</span></div>
          )}
        </div>
        <button onClick={() => buyRunUpgradeMulti('passiveIncome6', multi6.totalCost, multi6.levels)} disabled={!tier6Unlocked || multi6.levels <= 0} style={{
          flex: '0 0 18%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '6px 2px', fontSize: '12px', fontFamily: 'inherit', fontWeight: 'bold',
          background: tier6Unlocked && multi6.levels > 0 ? '#a8f' : 'rgba(20,15,30,0.85)', color: tier6Unlocked && multi6.levels > 0 ? '#000' : '#555',
          border: tier6Unlocked && multi6.levels > 0 ? 'none' : '1px solid rgba(138,74,223,0.2)', cursor: tier6Unlocked && multi6.levels > 0 ? 'pointer' : 'not-allowed',
        }}>
          {tier6Unlocked ? <>{multi6.levels > 1 && <div style={{ fontSize: '10px', opacity: 0.8 }}>x{multi6.levels}</div>}{formatNumber(multi6.totalCost)}g</> : '\u{1F512}'}
        </button>
      </div>
      ); })()}

      {/* Tier 7: Training Militia */}
      {(() => { const tb = getTierBonuses('t7'); const texp = expanded === 't7' && tb.length > 0; return (
      <div className="inc-row" style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', opacity: tier7Unlocked ? 1 : 0.5, border: texp ? '1px solid #4aff4a44' : '1px solid rgba(138,74,223,0.15)' }}>
        <div onClick={() => tier7Unlocked && doExpand('t7', tb.length > 0)} style={{ flex: '0 0 82%', padding: '6px 8px', background: texp ? 'rgba(74,255,74,0.05)' : 'rgba(20,15,35,0.6)', borderRight: '1px solid rgba(138,74,223,0.2)', cursor: tier7Unlocked && tb.length > 0 ? 'pointer' : 'default', transition: 'background 0.15s' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: tier7Unlocked ? '#f66' : '#666', marginBottom: '4px' }}>
            {tier7Unlocked ? '\u2694\uFE0F' : '\u{1F512}'} Training Militia <span style={{ color: COLORS.textDim, fontWeight: 'normal' }}>Lv.{level7}</span>
            {getTier(level7) > 0 && <span style={{ color: '#ffd700', fontSize: '10px', marginLeft: '4px' }}>T{getTier(level7)}</span>}
            {tier7Unlocked && tb.length > 0 && <span style={{ fontSize: '11px', color: '#4aff4a', float: 'right' }}>{texp ? '\u25B2' : '\u25BC'}</span>}
          </div>
          {!tier7Unlocked ? (
            <div style={{ fontSize: '11px', color: '#666' }}>&nbsp;</div>
          ) : level7 > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: COLORS.text }}>+{formatNumber(militiaAmount)}g {'\u2192'} <span style={{ color: '#f66' }}>+{formatNumber(nextMilitia)}g</span> <span className="inc-delta" style={{ fontSize: '10px', color: '#a44' }}>(+{formatNumber(nextMilitia - militiaAmount)})</span></span>
                <span style={{ fontSize: '11px', color: '#f66' }}>{'\u23F1'} {countdown7}s</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: '#1a0e2a', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${progress7}%`, height: '100%', background: 'linear-gradient(90deg, #a44, #f66)', transition: 'none' }} />
              </div>
              {texp && <IncomeBonusList bonuses={tb} />}
            </>
          ) : (
            <div style={{ fontSize: '11px', color: COLORS.textDim }}>Titanic payout every 20 min {'\u00B7'} <span style={{ color: '#f66' }}>+{formatNumber(nextMilitia)}g</span></div>
          )}
        </div>
        <button onClick={() => buyRunUpgradeMulti('passiveIncome7', multi7.totalCost, multi7.levels)} disabled={!tier7Unlocked || multi7.levels <= 0} style={{
          flex: '0 0 18%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '6px 2px', fontSize: '12px', fontFamily: 'inherit', fontWeight: 'bold',
          background: tier7Unlocked && multi7.levels > 0 ? '#f66' : 'rgba(20,15,30,0.85)', color: tier7Unlocked && multi7.levels > 0 ? '#000' : '#555',
          border: tier7Unlocked && multi7.levels > 0 ? 'none' : '1px solid rgba(138,74,223,0.2)', cursor: tier7Unlocked && multi7.levels > 0 ? 'pointer' : 'not-allowed',
        }}>
          {tier7Unlocked ? <>{multi7.levels > 1 && <div style={{ fontSize: '10px', opacity: 0.8 }}>x{multi7.levels}</div>}{formatNumber(multi7.totalCost)}g</> : '\u{1F512}'}
        </button>
      </div>
      ); })()}

      {/* Tier 8: Expanding Territories */}
      {(() => { const tb = getTierBonuses('t8'); const texp = expanded === 't8' && tb.length > 0; return (
      <div className="inc-row" style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', opacity: tier8Unlocked ? 1 : 0.5, border: texp ? '1px solid #4aff4a44' : '1px solid rgba(138,74,223,0.15)' }}>
        <div onClick={() => tier8Unlocked && doExpand('t8', tb.length > 0)} style={{ flex: '0 0 82%', padding: '6px 8px', background: texp ? 'rgba(74,255,74,0.05)' : 'rgba(20,15,35,0.6)', borderRight: '1px solid rgba(138,74,223,0.2)', cursor: tier8Unlocked && tb.length > 0 ? 'pointer' : 'default', transition: 'background 0.15s' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: tier8Unlocked ? '#4ff' : '#666', marginBottom: '4px' }}>
            {tier8Unlocked ? '\u{1F5FA}\uFE0F' : '\u{1F512}'} Expanding Territories <span style={{ color: COLORS.textDim, fontWeight: 'normal' }}>Lv.{level8}</span>
            {getTier(level8) > 0 && <span style={{ color: '#ffd700', fontSize: '10px', marginLeft: '4px' }}>T{getTier(level8)}</span>}
            {tier8Unlocked && tb.length > 0 && <span style={{ fontSize: '11px', color: '#4aff4a', float: 'right' }}>{texp ? '\u25B2' : '\u25BC'}</span>}
          </div>
          {!tier8Unlocked ? (
            <div style={{ fontSize: '11px', color: '#666' }}>&nbsp;</div>
          ) : level8 > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: COLORS.text }}>+{formatNumber(territoryAmount)}g {'\u2192'} <span style={{ color: '#4ff' }}>+{formatNumber(nextTerritory)}g</span> <span className="inc-delta" style={{ fontSize: '10px', color: '#2aa' }}>(+{formatNumber(nextTerritory - territoryAmount)})</span></span>
                <span style={{ fontSize: '11px', color: '#4ff' }}>{'\u23F1'} {countdown8}s</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: '#1a0e2a', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${progress8}%`, height: '100%', background: 'linear-gradient(90deg, #288, #4ff)', transition: 'none' }} />
              </div>
              {texp && <IncomeBonusList bonuses={tb} />}
            </>
          ) : (
            <div style={{ fontSize: '11px', color: COLORS.textDim }}>Legendary payout every 30 min {'\u00B7'} <span style={{ color: '#4ff' }}>+{formatNumber(nextTerritory)}g</span></div>
          )}
        </div>
        <button onClick={() => buyRunUpgradeMulti('passiveIncome8', multi8.totalCost, multi8.levels)} disabled={!tier8Unlocked || multi8.levels <= 0} style={{
          flex: '0 0 18%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '6px 2px', fontSize: '12px', fontFamily: 'inherit', fontWeight: 'bold',
          background: tier8Unlocked && multi8.levels > 0 ? '#4ff' : 'rgba(20,15,30,0.85)', color: tier8Unlocked && multi8.levels > 0 ? '#000' : '#555',
          border: tier8Unlocked && multi8.levels > 0 ? 'none' : '1px solid rgba(138,74,223,0.2)', cursor: tier8Unlocked && multi8.levels > 0 ? 'pointer' : 'not-allowed',
        }}>
          {tier8Unlocked ? <>{multi8.levels > 1 && <div style={{ fontSize: '10px', opacity: 0.8 }}>x{multi8.levels}</div>}{formatNumber(multi8.totalCost)}g</> : '\u{1F512}'}
        </button>
      </div>
      ); })()}

      </>)}
    </div>
  );
}

function PortalTab({ game, upgrades, movePortalForward, toggleAutoPortal, onReturnHome, highestZone, highestFlags, highlightRetreat }: { game: GameState; upgrades: PermanentUpgrades; movePortalForward: () => void; toggleAutoPortal: () => void; onReturnHome: () => void; highestZone: number; highestFlags: number; highlightRetreat?: boolean }) {
  const [confirmReturn, setConfirmReturn] = useState(false);
  const capturedFlagsArr = game.flags?.filter(f => f.captured) || [];
  const portalIndex = game.portalFlagIndex;
  const maxPortalIndex = capturedFlagsArr.length - 1;
  const canMoveForward = portalIndex < maxPortalIndex;
  const portalFlagName = portalIndex >= 0 ? `Flag ${portalIndex + 1}` : 'Home Base';
  const shardPreview = prestigeShardReward(game.bossesDefeated, game.flagsCaptured, highestZone, highestFlags);
  const hasNewProgress = shardPreview > 0;

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: '#a855f7', fontSize: '16px', marginBottom: '10px' }}>🌀 Unit Spawn Portal</div>
      <div style={{ color: COLORS.text, fontSize: '14px', marginBottom: '8px' }}>Current: {portalFlagName}</div>
      <div style={{ color: COLORS.textDim, fontSize: '12px', marginBottom: '14px', padding: '10px', background: 'rgba(168,85,247,0.1)', borderRadius: '4px', lineHeight: '1.4' }}>
        ⚠️ Units spawn at portal location.<br />Units cannot retreat behind the portal!
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: portalIndex === -1 ? '#a855f7' : 'rgba(20,15,30,0.85)', border: portalIndex === -1 ? 'none' : '1px solid rgba(138,74,223,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>🏠</div>
        {capturedFlagsArr.map((_, i) => (
          <div key={i} style={{ width: '28px', height: '28px', borderRadius: '4px', background: i === portalIndex ? '#a855f7' : i > maxPortalIndex ? '#661' : 'rgba(30,50,30,0.8)', border: i === portalIndex ? '2px solid #fff' : '1px solid rgba(138,74,223,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>{i > maxPortalIndex ? '⚔️' : '🚩'}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', justifyContent: 'center' }}>
        <button onClick={movePortalForward} disabled={!canMoveForward || game.autoPortalForward} style={{ padding: '12px 24px', fontSize: '14px', fontFamily: 'inherit', background: canMoveForward && !game.autoPortalForward ? '#a855f7' : 'rgba(20,15,30,0.85)', color: canMoveForward && !game.autoPortalForward ? '#fff' : '#666', border: canMoveForward && !game.autoPortalForward ? 'none' : '1px solid rgba(138,74,223,0.3)', borderRadius: '4px', cursor: canMoveForward && !game.autoPortalForward ? 'pointer' : 'not-allowed', flex: 1 }}>
          {game.autoPortalForward ? 'Auto-Forward ON' : canMoveForward ? '➡️ Move Portal Forward' : capturedFlagsArr.length < 2 ? 'Capture more flags!' : 'At max position'}
        </button>
        <button onClick={() => setConfirmReturn(true)} style={{ padding: '12px 16px', fontSize: '13px', fontFamily: 'inherit', background: 'rgba(85,51,17,0.8)', color: '#ffaa44', border: highlightRetreat ? '2px solid #FFD700' : '1px solid rgba(138,74,223,0.3)', borderRadius: '4px', cursor: 'pointer', animation: highlightRetreat ? 'stagnation-glow 1.5s ease-in-out infinite' : undefined, whiteSpace: 'nowrap' }}>
          🏳️ Retreat
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
        {((upgrades.autoPortal as number) || 0) > 0 ? (
          <button onClick={toggleAutoPortal} style={{ padding: '8px 16px', fontSize: '12px', fontFamily: 'inherit', background: game.autoPortalForward ? '#7c3aed' : 'rgba(20,15,30,0.85)', color: game.autoPortalForward ? '#fff' : '#888', border: `1px solid ${game.autoPortalForward ? '#a855f7' : 'rgba(138,74,223,0.3)'}`, borderRadius: '4px', cursor: 'pointer' }}>
            {game.autoPortalForward ? '🌀 Auto-Forward: ON' : '🌀 Auto-Forward: OFF'}
          </button>
        ) : (
          <div style={{ padding: '8px 16px', fontSize: '12px', color: '#666', border: '1px solid rgba(138,74,223,0.3)', borderRadius: '4px', background: 'rgba(20,15,30,0.85)' }}>
            🔒 Auto-Forward
          </div>
        )}
      </div>

      {/* Surrender confirmation */}
      {confirmReturn && (
        <div style={{ padding: '10px', background: hasNewProgress ? 'rgba(168,85,247,0.15)' : 'rgba(40,20,10,0.6)', borderRadius: '4px', border: `1px solid ${hasNewProgress ? '#7c3aed' : 'rgba(138,74,223,0.3)'}` }}>
          {hasNewProgress && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ color: '#c084fc', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>PRESTIGE REWARD</div>
              <div style={{ color: COLORS.gold, fontSize: '14px', marginBottom: '4px' }}>+{shardPreview} shards</div>
              <div style={{ fontSize: '10px', color: COLORS.textDim, lineHeight: '1.4' }}>
                ({Math.max(0, game.bossesDefeated - highestZone)} new zones x3) + ({Math.max(0, game.flagsCaptured - highestFlags)} new flags x0.8)
              </div>
            </div>
          )}
          {!hasNewProgress && game.bossesDefeated > 0 && (
            <div style={{ color: '#888', fontSize: '11px', marginBottom: '8px', lineHeight: '1.4' }}>
              No new progress beyond your best. Push further for prestige shards!
            </div>
          )}
          <div style={{ color: hasNewProgress ? '#c084fc' : '#ffaa44', fontSize: '12px', marginBottom: '8px' }}>
            Retreat from battle?{hasNewProgress ? ` You'll earn +${shardPreview} prestige shards.` : ' You will keep all gems and shards earned.'}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button onClick={() => { setConfirmReturn(false); onReturnHome(); }} style={{ padding: '8px 16px', fontSize: '13px', fontFamily: 'inherit', background: hasNewProgress ? '#7c3aed' : '#ff4422', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              {hasNewProgress ? 'Prestige' : 'Yes, Retreat'}
            </button>
            <button onClick={() => setConfirmReturn(false)} style={{ padding: '8px 16px', fontSize: '13px', fontFamily: 'inherit', background: 'rgba(20,15,30,0.85)', color: '#aaa', border: '1px solid rgba(138,74,223,0.3)', borderRadius: '4px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
