import React, { useState, useRef, useEffect } from 'react';
import { COLORS, UNIT_STATS } from '../../constants';
import type { PermanentUpgrades, ShardUpgrades, ChallengeCompletions } from '../../types';
import { gemUpgradeCost } from '../../utils/economy';
import { getUpgradesForUnit, shardUpgradeCost, SHARD_UPGRADES, UNIT_ICONS, type ShardUpgradeDef } from '../../shardUpgrades';
import { computePermanentUnitStats, type UnitType, type StatBonus } from '../../utils/unitStats';
import { COSMETICS, RARITY_COLORS, type CosmeticDef, type CosmeticCategory } from '../../cosmetics';
import { PETS, type PetDef, type PetState } from '../../pets';

interface Props {
  gems: number;
  shards: number;
  upgrades: PermanentUpgrades;
  shardUpgrades: ShardUpgrades;
  challengeCompletions: ChallengeCompletions;
  buyUpgrade: (type: string, cost: number) => void;
  buyUnitUnlock: (unitType: string, cost: number) => void;
  buyUnitToggle: (unitType: string, cost: number) => void;
  toggleUnitPool: (unitType: string) => void;
  buyShardUpgrade: (key: string, cost: number) => void;
  buyCosmetic: (id: string, cost: number) => void;
  equipCosmetic: (id: string, category: CosmeticCategory) => void;
  buyPet: (id: string, cost: number) => void;
  equipPet: (id: string) => void;
  petState: PetState;
  onBack: () => void;
  seenShopTabs: Set<string>;
  onTabSeen: (tab: string) => void;
  forceTab?: ShopTab;
}

type ShopTab = 'units' | 'income' | 'misc' | 'shards' | 'cosmetics';

const TAB_DEFS: { key: ShopTab; label: string; color: string }[] = [
  { key: 'units', label: '\u2694\uFE0F UNITS', color: COLORS.heroBlue },
  { key: 'income', label: '\u{1F4B0} INCOME', color: '#8f8' },
  { key: 'misc', label: '\u{1F381} MISC', color: '#ffaa44' },
  { key: 'shards', label: '\u{1F52E} SHARDS', color: '#a855f7' },
  { key: 'cosmetics', label: '\u2728 COSMETICS', color: '#ff44ff' },
];

// Shared row bg/border styles
const ROW_BG = 'rgba(20,15,35,0.6)';
const ROW_BORDER = '1px solid rgba(138,74,223,0.2)';
const DISABLED_BG = 'rgba(20,15,30,0.85)';

export function PrestigeShop({ gems, shards, upgrades, shardUpgrades, challengeCompletions, buyUpgrade, buyUnitUnlock, buyUnitToggle, toggleUnitPool, buyShardUpgrade, buyCosmetic, equipCosmetic, buyPet, equipPet, petState, onBack, seenShopTabs, onTabSeen, forceTab }: Props) {
  const [tab, setTab] = useState<ShopTab>('units');

  useEffect(() => {
    if (forceTab) setTab(forceTab);
  }, [forceTab]);

  const handleTabClick = (tabKey: ShopTab) => {
    onTabSeen(tab);
    setTab(tabKey);
  };

  const handleBack = () => {
    onTabSeen(tab);
    onBack();
  };

  const tabBadges: Record<ShopTab, boolean> = {
    units: UNIT_UNLOCK_ORDER.some(u => u.cost > 0 && !(upgrades.unlockedUnits as string[] || []).includes(u.key) && gems >= u.cost),
    income: INCOME_TIER_UNLOCKS.some(t => !((upgrades[t.key] as number) || 0) && gems >= t.cost),
    misc: (!((upgrades.startingArtifact as number) || 0) && gems >= 75) || (!((upgrades.autoPortal as number) || 0) && gems >= 30) || (((upgrades.freeStartingUnit as number) || 0) < 3 && gems >= [50, 100, 200][(upgrades.freeStartingUnit as number) || 0]) || (!((upgrades.extraRerolls as number) || 0) && gems >= 40) || gems >= gemUpgradeCost(3, (upgrades.startingGold as number) || 0) || gems >= gemUpgradeCost(3, (upgrades.startingIncome as number) || 0),
    shards: SHARD_UPGRADES.some(def => (upgrades.unlockedUnits as string[] || []).includes(def.unitType) && (shardUpgrades[def.key] || 0) < def.maxLevel && shards >= shardUpgradeCost(def, shardUpgrades[def.key] || 0)),
    cosmetics: COSMETICS.some(c => !(upgrades.ownedCosmetics as string[] || []).includes(c.id) && gems >= c.gemCost) || PETS.some(p => p.source === 'store' && !p.locked && !(petState.ownedPets || []).includes(p.id) && gems >= p.gemCost),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Header bar */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30,12,50,0.95) 0%, rgba(15,8,25,0.95) 100%)',
        padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', flexShrink: 0,
      }}>
        <span style={{ color: COLORS.gold, fontSize: '14px', fontWeight: 'bold' }}>{'\u{1F3EA}'} SHOP</span>
        <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
          <span title="Gems — earned from flags, bosses & chests. Spend on permanent upgrades." style={{ color: '#a855f7', cursor: 'help' }}>{'\u{1F48E}'} {gems}</span>
          <span title="Prestige Shards — earned at end of run. Spend on unit-specific upgrades." style={{ color: '#c084fc', cursor: 'help' }}>{'\u{1F52E}'} {shards}</span>
        </div>
        <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.4), transparent)' }} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid rgba(138,74,223,0.3)', flexShrink: 0 }}>
        {TAB_DEFS.map(t => (
          <button key={t.key} onClick={() => handleTabClick(t.key)} style={{
            flex: 1, padding: '5px 6px', fontSize: '11px', fontFamily: 'inherit',
            background: tab === t.key ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: tab === t.key ? t.color : '#666',
            border: 'none', borderBottom: tab === t.key ? `3px solid ${t.color}` : '3px solid transparent',
            cursor: 'pointer', whiteSpace: 'nowrap', position: 'relative',
          }}>
            {t.label}
            {tabBadges[t.key] && !seenShopTabs.has(t.key) && (
              <span style={{
                position: 'absolute', top: '3px', right: '3px',
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#ff4a4a',
              }} />
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: '6px' }}>
        {tab === 'units' && <UnitsTab gems={gems} upgrades={upgrades} shardUpgrades={shardUpgrades} challengeCompletions={challengeCompletions} buyUnitUnlock={buyUnitUnlock} buyUnitToggle={buyUnitToggle} toggleUnitPool={toggleUnitPool} buyUpgrade={buyUpgrade} tabSeen={seenShopTabs.has('units')} />}
        {tab === 'income' && <IncomeTiersTab gems={gems} upgrades={upgrades} buyUpgrade={buyUpgrade} tabSeen={seenShopTabs.has('income')} />}
        {tab === 'misc' && <MiscTab gems={gems} upgrades={upgrades} buyUpgrade={buyUpgrade} />}
        {tab === 'shards' && <ShardsTab shards={shards} shardUpgrades={shardUpgrades} unlockedUnits={upgrades.unlockedUnits} onBuy={buyShardUpgrade} />}
        {tab === 'cosmetics' && <CosmeticsTab gems={gems} upgrades={upgrades} petState={petState} buyCosmetic={buyCosmetic} equipCosmetic={equipCosmetic} buyPet={buyPet} equipPet={equipPet} />}
      </div>
    </div>
  );
}

// ============ UNITS TAB ============

const UNIT_UNLOCK_ORDER = [
  { key: 'soldier', name: 'Soldier', icon: '\u{1F5E1}\uFE0F', color: UNIT_STATS.soldier.color, cost: 0, desc: 'Balanced melee fighter. Fast respawn.' },
  { key: 'archer', name: 'Archer', icon: '\u{1F3F9}', color: UNIT_STATS.archer.color, cost: 15, desc: 'Ranged attacker. Fragile but deadly.' },
  { key: 'halberd', name: 'Halberd', icon: '\u{1F531}', color: UNIT_STATS.halberd.color, cost: 30, desc: 'Polearm fighter. Cleaves all nearby enemies.' },
  { key: 'knight', name: 'Knight', icon: '\u{1F6E1}\uFE0F', color: UNIT_STATS.knight.color, cost: 60, desc: 'Heavy tank. High HP and defense.' },
  { key: 'wizard', name: 'Apprentice', icon: '\u{1F9D9}', color: UNIT_STATS.wizard.color, cost: 75, desc: 'AoE magic damage. Glass cannon.' },
  { key: 'cleric', name: 'Cleric', icon: '\u26EA', color: UNIT_STATS.cleric.color, cost: 100, desc: 'Ranged healer. Heals nearby allies.' },
  { key: 'conjurer', name: 'Conjurer', icon: '\u{1F537}', color: UNIT_STATS.conjurer.color, cost: 150, desc: 'Summons crystal turrets. Turrets inherit stats.' },
  { key: 'bombard', name: 'Bombard', icon: '\u{1F4A3}', color: UNIT_STATS.bombard.color, cost: 175, desc: 'Arcing cannonball. AOE splash damage.' },
] as const;

function StatVal({ icon, base, final: fin, isFaster, decimals, suffix }: { icon: string; base: number; final: number; isFaster?: boolean; decimals?: number; suffix?: string }) {
  const buffed = isFaster ? fin < base : fin > base;
  const display = decimals ? fin.toFixed(decimals) : String(fin);
  return (
    <span style={{ marginRight: '5px' }}>
      {icon}<span style={{ color: buffed ? '#4aff4a' : COLORS.text, fontSize: '10px' }}>{display}{suffix || ''}</span>
      {buffed && <span style={{ color: '#4aff4a', fontSize: '7px' }}>{'\u2191'}</span>}
    </span>
  );
}

function BonusBreakdown({ bonuses }: { bonuses: StatBonus[] }) {
  if (bonuses.length === 0) return null;
  const statLabels: Record<string, string> = { health: 'HP', damage: 'DMG', defense: 'DEF', speed: 'SPD', attackRate: 'ATK SPD', range: 'RNG' };
  return (
    <div style={{ fontSize: '10px', marginTop: '4px', borderTop: ROW_BORDER, paddingTop: '4px', background: 'rgba(138,74,223,0.08)', borderRadius: '3px', padding: '4px 5px' }}>
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

function UnitsTab({ gems, upgrades, shardUpgrades, challengeCompletions, buyUnitUnlock, buyUnitToggle, toggleUnitPool, buyUpgrade, tabSeen }: { gems: number; upgrades: PermanentUpgrades; shardUpgrades: ShardUpgrades; challengeCompletions: ChallengeCompletions; buyUnitUnlock: (t: string, c: number) => void; buyUnitToggle: (t: string, c: number) => void; toggleUnitPool: (t: string) => void; buyUpgrade: (t: string, c: number) => void; tabSeen: boolean }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const hasExpanded = useRef(false);
  const doExpand = (key: string) => { hasExpanded.current = true; setExpanded(expanded === key ? null : key); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ fontSize: '9px', color: '#888', textAlign: 'center', padding: '3px', background: 'rgba(138,74,223,0.08)', borderRadius: '3px', marginBottom: '1px' }}>
        Unlocked units are added to the roll pool
      </div>
      {UNIT_UNLOCK_ORDER.map((unit) => {
        const isUnlocked = (upgrades.unlockedUnits as string[] || []).includes(unit.key);
        const canAfford = gems >= unit.cost;
        const stats = UNIT_STATS[unit.key as keyof typeof UNIT_STATS] as any;
        const { base, final, bonuses } = computePermanentUnitStats(unit.key as UnitType, shardUpgrades, challengeCompletions);
        const isExpanded = expanded === unit.key && bonuses.length > 0;

        return (
          <div key={unit.key} style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: isExpanded ? '1px solid rgba(74,255,74,0.25)' : '1px solid rgba(138,74,223,0.15)' }}>
            <div
              style={{ flex: '0 0 82%', padding: '6px 8px', background: isExpanded ? 'rgba(74,255,74,0.05)' : ROW_BG, borderRight: ROW_BORDER, cursor: bonuses.length > 0 ? 'pointer' : 'default', transition: 'background 0.15s' }}
              onClick={() => bonuses.length > 0 && doExpand(unit.key)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                <span style={{ fontSize: '14px' }}>{unit.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: isUnlocked ? unit.color : '#888' }}>{unit.name}</span>
                {isUnlocked && <span style={{ fontSize: '8px', color: '#4aff4a', background: 'rgba(74,255,74,0.15)', padding: '1px 4px', borderRadius: '2px' }}>UNLOCKED</span>}
                {!isUnlocked && canAfford && unit.cost > 0 && !tabSeen && <span style={{ fontSize: '8px', color: '#ff4a4a', background: 'rgba(255,74,74,0.2)', padding: '1px 4px', borderRadius: '2px' }}>NEW</span>}
                {bonuses.length > 0 && <span style={{ fontSize: '10px', color: '#4aff4a', marginLeft: 'auto' }}>{isExpanded ? '\u25B2' : '\u25BC'}</span>}
              </div>
              <div style={{ fontSize: '9px', color: '#888', marginBottom: '2px' }}>{unit.desc}</div>
              <div style={{ fontSize: '9px', color: COLORS.text, opacity: 0.8 }}>
                <StatVal icon={'\u2764\uFE0F'} base={base.health} final={final.health} />
                <StatVal icon={'\u2694\uFE0F'} base={base.damage} final={final.damage} />
                {final.defense > 0 && <StatVal icon={'\u{1F6E1}\uFE0F'} base={base.defense} final={final.defense} />}
                <StatVal icon={'\u26A1'} base={+(60 / base.attackRate).toFixed(1)} final={+(60 / final.attackRate).toFixed(1)} decimals={1} suffix="/s" />
                <StatVal icon={'\u{1F3C3}'} base={base.speed} final={final.speed} decimals={1} />
                <StatVal icon={'\u{1F3AF}'} base={Math.round(base.critChance * 100)} final={Math.round(final.critChance * 100)} suffix="%" />
                {bonuses.length > 0 && !isExpanded && !hasExpanded.current && <span style={{ fontSize: '8px', color: '#666', marginLeft: '3px' }}>tap for details</span>}
              </div>
              {isExpanded && <BonusBreakdown bonuses={bonuses} />}
            </div>
            <div style={{
              flex: '0 0 18%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
              background: 'rgba(15,10,25,0.5)',
            }}>
              {isUnlocked && unit.key === 'soldier' ? (
                <span style={{ fontSize: '14px' }}>{'\u2705'}</span>
              ) : isUnlocked ? (
                (upgrades.unitTogglePurchased as string[] || []).includes(unit.key) ? (
                  <button onClick={() => toggleUnitPool(unit.key)} style={{
                    width: '90%', padding: '3px 2px', fontSize: '10px', fontFamily: 'inherit', fontWeight: 'bold',
                    background: (upgrades.disabledUnits as string[] || []).includes(unit.key) ? '#ff4444' : '#4aff4a',
                    color: '#000', border: 'none', borderRadius: '3px', cursor: 'pointer',
                  }}>
                    {(upgrades.disabledUnits as string[] || []).includes(unit.key) ? 'OFF' : 'ON'}
                  </button>
                ) : (
                  <button onClick={() => buyUnitToggle(unit.key, unit.cost)} disabled={gems < unit.cost} style={{
                    width: '90%', padding: '3px 2px', fontSize: '10px', fontFamily: 'inherit', fontWeight: 'bold',
                    background: gems >= unit.cost ? '#a855f7' : DISABLED_BG, color: gems >= unit.cost ? '#fff' : '#555',
                    border: `1px solid ${gems >= unit.cost ? '#a855f7' : 'rgba(138,74,223,0.3)'}`, borderRadius: '3px', cursor: gems >= unit.cost ? 'pointer' : 'not-allowed',
                  }}>
                    {'\u{1F504}'} {unit.cost}{'\u{1F48E}'}
                  </button>
                )
              ) : unit.cost === 0 ? (
                <span style={{ fontSize: '14px' }}>{'\u2705'}</span>
              ) : (
                <button onClick={() => buyUnitUnlock(unit.key, unit.cost)} disabled={!canAfford} style={{
                  width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '4px 2px', fontSize: '11px', fontFamily: 'inherit', fontWeight: 'bold',
                  background: canAfford ? unit.color : DISABLED_BG, color: canAfford ? '#000' : '#555',
                  border: canAfford ? 'none' : '1px solid rgba(138,74,223,0.3)', cursor: canAfford ? 'pointer' : 'not-allowed',
                }}>
                  {unit.cost}{'\u{1F48E}'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============ INCOME TAB ============

const INCOME_TIER_UNLOCKS = [
  { key: 'incomeTier2', label: '\u{1F332} Scouting the Forests', desc: 'Unlock Tier 2 income (10s timer)', cost: 15, color: '#ff8' },
  { key: 'incomeTier3', label: '\u{1F4E6} Delivering Resources', desc: 'Unlock Tier 3 income (1min timer)', cost: 30, color: '#f8f' },
  { key: 'incomeTier4', label: '\u2692\uFE0F Smithing The Swords', desc: 'Unlock Tier 4 income (3min timer)', cost: 60, color: '#f84' },
  { key: 'incomeTier5', label: '\u{1F3F0} Reinforcing Barricades', desc: 'Unlock Tier 5 income (5min timer)', cost: 80, color: '#ff4' },
  { key: 'incomeTier6', label: '\u{1F4DC} Enchanting The Scrolls', desc: 'Unlock Tier 6 income (10min timer)', cost: 100, color: '#a8f' },
  { key: 'incomeTier7', label: '\u{1F6E1}\uFE0F Training Militia', desc: 'Unlock Tier 7 income (20min timer)', cost: 150, color: '#f88' },
  { key: 'incomeTier8', label: '\u{1F30D} Expanding Territories', desc: 'Unlock Tier 8 income (30min timer)', cost: 250, color: '#8ff' },
] as const;

function IncomeTiersTab({ gems, upgrades, buyUpgrade, tabSeen }: { gems: number; upgrades: PermanentUpgrades; buyUpgrade: (t: string, c: number) => void; tabSeen: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ fontSize: '9px', color: '#888', textAlign: 'center', padding: '3px', background: 'rgba(138,74,223,0.08)', borderRadius: '3px', marginBottom: '1px' }}>
        Unlock higher income tiers for in-game gold generation
      </div>
      {INCOME_TIER_UNLOCKS.map(({ key, label, desc, cost, color }) => {
        const isUnlocked = !!((upgrades[key] as number) || 0);
        const canAfford = gems >= cost;
        // Split label into icon + name (e.g. "🌲 Scouting the Forests" → icon="🌲", name="Scouting the Forests")
        const spaceIdx = label.indexOf(' ');
        const icon = spaceIdx > 0 ? label.slice(0, spaceIdx) : '';
        const name = spaceIdx > 0 ? label.slice(spaceIdx + 1) : label;
        return (
          <div key={key} style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(138,74,223,0.15)' }}>
            <div style={{ flex: '0 0 82%', padding: '6px 8px', background: ROW_BG, borderRight: ROW_BORDER, borderLeft: `3px solid ${color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                <span style={{ fontSize: '14px' }}>{icon}</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: isUnlocked ? color : '#888' }}>{name}</span>
                {isUnlocked && <span style={{ fontSize: '8px', color: '#4aff4a', background: 'rgba(74,255,74,0.15)', padding: '1px 4px', borderRadius: '2px' }}>UNLOCKED</span>}
                {!isUnlocked && canAfford && !tabSeen && <span style={{ fontSize: '8px', color: '#ff4a4a', background: 'rgba(255,74,74,0.2)', padding: '1px 4px', borderRadius: '2px' }}>NEW</span>}
              </div>
              <div style={{ fontSize: '9px', color: '#888' }}>{desc}</div>
            </div>
            <div style={{ flex: '0 0 18%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,10,25,0.5)' }}>
              {isUnlocked ? (
                <span style={{ fontSize: '14px' }}>{'\u2705'}</span>
              ) : (
                <button onClick={() => buyUpgrade(key, cost)} disabled={!canAfford} style={{
                  width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '4px 2px', fontSize: '11px', fontFamily: 'inherit', fontWeight: 'bold',
                  background: canAfford ? color : DISABLED_BG, color: canAfford ? '#000' : '#555',
                  border: canAfford ? 'none' : '1px solid rgba(138,74,223,0.3)', cursor: canAfford ? 'pointer' : 'not-allowed',
                }}>
                  {cost}{'\u{1F48E}'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============ MISC TAB ============

function MiscUpgradeRow({ icon, name, desc, color, isUnlocked, cost, canAfford, onBuy }: {
  icon: string; name: string; desc: string; color: string; isUnlocked: boolean; cost: number; canAfford: boolean; onBuy: () => void;
  level?: number; levelLabel?: string;
}) {
  return (
    <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(138,74,223,0.15)' }}>
      <div style={{ flex: '0 0 82%', padding: '6px 8px', background: ROW_BG, borderRight: ROW_BORDER, borderLeft: `3px solid ${color}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
          <span style={{ fontSize: '14px' }}>{icon}</span>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: isUnlocked ? color : '#888' }}>{name}</span>
          {isUnlocked && <span style={{ fontSize: '8px', color: '#4aff4a', background: 'rgba(74,255,74,0.15)', padding: '1px 4px', borderRadius: '2px' }}>UNLOCKED</span>}
        </div>
        <div style={{ fontSize: '9px', color: '#888' }}>{desc}</div>
      </div>
      <div style={{ flex: '0 0 18%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,10,25,0.5)' }}>
        {isUnlocked ? (
          <span style={{ fontSize: '14px' }}>{'\u2705'}</span>
        ) : (
          <button onClick={onBuy} disabled={!canAfford} style={{
            width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '4px 2px', fontSize: '11px', fontFamily: 'inherit', fontWeight: 'bold',
            background: canAfford ? color : DISABLED_BG, color: canAfford ? (color === '#a855f7' ? '#fff' : '#000') : '#555',
            border: canAfford ? 'none' : '1px solid rgba(138,74,223,0.3)', cursor: canAfford ? 'pointer' : 'not-allowed',
          }}>
            {cost}{'\u{1F48E}'}
          </button>
        )}
      </div>
    </div>
  );
}

function MiscTab({ gems, upgrades, buyUpgrade }: { gems: number; upgrades: PermanentUpgrades; buyUpgrade: (t: string, c: number) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ fontSize: '9px', color: '#888', textAlign: 'center', padding: '3px', background: 'rgba(138,74,223,0.08)', borderRadius: '3px', marginBottom: '1px' }}>
        Miscellaneous permanent upgrades
      </div>

      <MiscUpgradeRow icon={'\u{1F3C6}'} name="Starting Artifact" desc="Begin every run with a common artifact chest" color="#B8860B"
        isUnlocked={!!((upgrades.startingArtifact as number) || 0)} cost={75} canAfford={gems >= 75}
        onBuy={() => buyUpgrade('startingArtifact', 75)} />

      <MiscUpgradeRow icon={'\u{1F300}'} name="Auto Portal" desc="Portal auto-advances to the latest captured flag" color="#a855f7"
        isUnlocked={!!((upgrades.autoPortal as number) || 0)} cost={30} canAfford={gems >= 30}
        onBuy={() => buyUpgrade('autoPortal', 30)} />

      <MiscUpgradeRow icon={'\u{1F3B2}'} name="Extra Reroll" desc="Get 2 rerolls per unit roll instead of 1 (2nd costs 2 gems)" color="#a855f7"
        isUnlocked={!!((upgrades.extraRerolls as number) || 0)} cost={40} canAfford={gems >= 40}
        onBuy={() => buyUpgrade('extraRerolls', 40)} />

      {/* Coffers — leveled */}
      {(() => {
        const goldLevel = (upgrades.startingGold as number) || 0;
        const goldCost = gemUpgradeCost(3, goldLevel);
        const goldCanAfford = gems >= goldCost;
        return (
          <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(138,74,223,0.15)' }}>
            <div style={{ flex: '0 0 82%', padding: '6px 8px', background: ROW_BG, borderRight: ROW_BORDER, borderLeft: '3px solid #ffd700' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                <span style={{ fontSize: '14px' }}>{'\u{1F4B0}'}</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffd700' }}>Coffers</span>
                {goldLevel > 0 && <span style={{ fontSize: '8px', color: '#ffd700', background: 'rgba(255,215,0,0.15)', padding: '1px 4px', borderRadius: '2px' }}>Lv {goldLevel}</span>}
              </div>
              <div style={{ fontSize: '9px', color: '#888' }}>Start each run with +{(goldLevel + 1) * 100} gold (currently +{goldLevel * 100})</div>
            </div>
            <div style={{ flex: '0 0 18%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,10,25,0.5)' }}>
              <button onClick={() => buyUpgrade('startingGold', goldCost)} disabled={!goldCanAfford} style={{
                width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '4px 2px', fontSize: '11px', fontFamily: 'inherit', fontWeight: 'bold',
                background: goldCanAfford ? '#ffd700' : DISABLED_BG, color: goldCanAfford ? '#000' : '#555',
                border: goldCanAfford ? 'none' : '1px solid rgba(138,74,223,0.3)', cursor: goldCanAfford ? 'pointer' : 'not-allowed',
              }}>
                {goldCost}{'\u{1F48E}'}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Starting Income — leveled */}
      {(() => {
        const incomeLevel = (upgrades.startingIncome as number) || 0;
        const incomeCost = gemUpgradeCost(3, incomeLevel);
        const incomeCanAfford = gems >= incomeCost;
        return (
          <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(138,74,223,0.15)' }}>
            <div style={{ flex: '0 0 82%', padding: '6px 8px', background: ROW_BG, borderRight: ROW_BORDER, borderLeft: '3px solid #88ff88' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                <span style={{ fontSize: '14px' }}>{'\u{1F4C8}'}</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#88ff88' }}>Starting Income</span>
                {incomeLevel > 0 && <span style={{ fontSize: '8px', color: '#88ff88', background: 'rgba(136,255,136,0.15)', padding: '1px 4px', borderRadius: '2px' }}>Lv {incomeLevel}</span>}
              </div>
              <div style={{ fontSize: '9px', color: '#888' }}>+{(incomeLevel + 1) * 5} gold/sec from the start (currently +{incomeLevel * 5}/sec)</div>
            </div>
            <div style={{ flex: '0 0 18%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,10,25,0.5)' }}>
              <button onClick={() => buyUpgrade('startingIncome', incomeCost)} disabled={!incomeCanAfford} style={{
                width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '4px 2px', fontSize: '11px', fontFamily: 'inherit', fontWeight: 'bold',
                background: incomeCanAfford ? '#88ff88' : DISABLED_BG, color: incomeCanAfford ? '#000' : '#555',
                border: incomeCanAfford ? 'none' : '1px solid rgba(138,74,223,0.3)', cursor: incomeCanAfford ? 'pointer' : 'not-allowed',
              }}>
                {incomeCost}{'\u{1F48E}'}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Free Starting Unit — leveled */}
      {(() => {
        const freeUnitLevel = (upgrades.freeStartingUnit as number) || 0;
        const maxLevel = 3;
        const tierLabels = ['\u2B50 Soldier', '\u2B50\u2B50 Archer/Halberd', '\u2B50\u2B50\u2B50 Knight/Wizard/Cleric'];
        const tierCosts = [50, 100, 200];
        const isMaxed = freeUnitLevel >= maxLevel;
        const nextCost = isMaxed ? 0 : tierCosts[freeUnitLevel];
        const canAfford = gems >= nextCost;
        return (
          <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(138,74,223,0.15)' }}>
            <div style={{ flex: '0 0 82%', padding: '6px 8px', background: ROW_BG, borderRight: ROW_BORDER, borderLeft: '3px solid #4a9fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                <span style={{ fontSize: '14px' }}>{'\u2694\uFE0F'}</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: freeUnitLevel > 0 ? '#4a9fff' : '#888' }}>Free Starting Unit</span>
                {freeUnitLevel > 0 && <span style={{ fontSize: '8px', color: '#ffd700', background: 'rgba(255,215,0,0.15)', padding: '1px 4px', borderRadius: '2px' }}>Lv {freeUnitLevel}</span>}
              </div>
              <div style={{ fontSize: '9px', color: '#888' }}>
                {freeUnitLevel === 0 ? 'Start each run with a free unit' : `Current: ${tierLabels[freeUnitLevel - 1]}`}
                {!isMaxed && freeUnitLevel > 0 && ` \u2192 Next: ${tierLabels[freeUnitLevel]}`}
                {isMaxed && ' (MAX)'}
              </div>
            </div>
            <div style={{ flex: '0 0 18%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,10,25,0.5)' }}>
              {isMaxed ? (
                <span style={{ fontSize: '14px' }}>{'\u2705'}</span>
              ) : (
                <button onClick={() => buyUpgrade('freeStartingUnit', nextCost)} disabled={!canAfford} style={{
                  width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '4px 2px', fontSize: '11px', fontFamily: 'inherit', fontWeight: 'bold',
                  background: canAfford ? '#4a9fff' : DISABLED_BG, color: canAfford ? '#000' : '#555',
                  border: canAfford ? 'none' : '1px solid rgba(138,74,223,0.3)', cursor: canAfford ? 'pointer' : 'not-allowed',
                }}>
                  {nextCost}{'\u{1F48E}'}
                </button>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ============ SHARDS TAB ============

const UNIT_TABS = [
  { key: 'soldier', name: 'Soldier', color: '#4a7fff' },
  { key: 'archer', name: 'Archer', color: '#7fff4a' },
  { key: 'halberd', name: 'Halberd', color: '#cc6b2e' },
  { key: 'knight', name: 'Knight', color: '#ffd700' },
  { key: 'wizard', name: 'Apprentice', color: '#a855f7' },
  { key: 'cleric', name: 'Cleric', color: '#ff88cc' },
  { key: 'conjurer', name: 'Conjurer', color: '#44ccbb' },
  { key: 'bombard', name: 'Bombard', color: '#8b6914' },
];

function ShardsTab({ shards, shardUpgrades, unlockedUnits, onBuy }: { shards: number; shardUpgrades: ShardUpgrades; unlockedUnits: string[]; onBuy: (key: string, cost: number) => void }) {
  const availableTabs = UNIT_TABS.filter(t => (unlockedUnits || []).includes(t.key));
  const [selectedUnit, setSelectedUnit] = useState(availableTabs[0]?.key || 'soldier');
  const unitUpgrades = getUpgradesForUnit(selectedUnit);
  const tabInfo = UNIT_TABS.find(t => t.key === selectedUnit);
  const tabBarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = tabBarRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => { e.preventDefault(); el.scrollLeft += e.deltaY; };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* Unit sub-tabs */}
      <div ref={tabBarRef} style={{ display: 'flex', overflowX: 'auto', overflowY: 'hidden', borderRadius: '4px', border: '1px solid rgba(138,74,223,0.3)', scrollbarWidth: 'none' }}>
        {availableTabs.map(t => (
          <button key={t.key} onClick={() => setSelectedUnit(t.key)} style={{
            flexShrink: 0, padding: '5px 6px', fontSize: '10px', fontFamily: 'inherit',
            background: selectedUnit === t.key ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: selectedUnit === t.key ? t.color : '#666',
            border: 'none', borderBottom: selectedUnit === t.key ? `2px solid ${t.color}` : '2px solid transparent',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            {UNIT_ICONS[t.key]} {t.name.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ fontSize: '9px', color: '#888', textAlign: 'center', padding: '3px', background: 'rgba(138,74,223,0.08)', borderRadius: '3px' }}>
        Shard upgrades are permanent and apply every run
      </div>
      {unitUpgrades.map(def => (
        <ShardUpgradeRow key={def.key} def={def} level={shardUpgrades[def.key] || 0} shards={shards} unitColor={tabInfo?.color || '#888'} onBuy={onBuy} />
      ))}
    </div>
  );
}

function ShardUpgradeRow({ def, level, shards, unitColor, onBuy }: { def: ShardUpgradeDef; level: number; shards: number; unitColor: string; onBuy: (key: string, cost: number) => void }) {
  const isInfinite = !isFinite(def.maxLevel);
  const isMaxed = !isInfinite && level >= def.maxLevel;
  const cost = isMaxed ? 0 : shardUpgradeCost(def, level);
  const canAfford = !isMaxed && shards >= cost;
  const nextDesc = isMaxed ? 'MAXED'
    : def.descriptionFn ? def.descriptionFn(level)
    : def.description[level] || def.description[def.description.length - 1];

  const pips = [];
  if (isInfinite) {
    // Show level number instead of pips for infinite upgrades
    pips.push(
      <span key="lvl" style={{ fontSize: '9px', fontWeight: 'bold', color: level > 0 ? unitColor : '#555' }}>
        Lv {level}
      </span>
    );
  } else {
    for (let i = 0; i < def.maxLevel; i++) {
      pips.push(
        <span key={i} style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: i < level ? unitColor : '#2a1a3a', border: `1px solid ${i < level ? unitColor : 'rgba(138,74,223,0.4)'}`, marginRight: '1px' }} />
      );
    }
  }

  return (
    <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(138,74,223,0.15)' }}>
      <div style={{ flex: '0 0 78%', padding: '6px 8px', background: ROW_BG, borderRight: ROW_BORDER, borderLeft: `3px solid ${isMaxed ? '#4aff4a' : unitColor}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
          <span style={{ fontSize: '13px' }}>{def.icon}</span>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: isMaxed ? '#4aff4a' : COLORS.text }}>{def.name}</span>
          <span style={{ marginLeft: 'auto' }}>{pips}</span>
        </div>
        <div style={{ fontSize: '9px', color: isMaxed ? '#4aff4a' : '#c084fc', marginBottom: '1px' }}>{nextDesc}</div>
      </div>
      <div style={{ flex: '0 0 22%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,10,25,0.5)' }}>
        {isMaxed ? (
          <span style={{ fontSize: '12px', color: '#4aff4a' }}>{'\u2705'}</span>
        ) : (
          <button onClick={() => onBuy(def.key, cost)} disabled={!canAfford} style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '4px 2px', fontSize: '11px', fontFamily: 'inherit', fontWeight: 'bold',
            background: canAfford ? unitColor : DISABLED_BG, color: canAfford ? '#000' : '#555',
            border: canAfford ? 'none' : '1px solid rgba(138,74,223,0.3)', cursor: canAfford ? 'pointer' : 'not-allowed',
          }}>
            {cost}{'\u{1F52E}'}
          </button>
        )}
      </div>
    </div>
  );
}

// ============ COSMETICS TAB ============

type CosmeticSection = 'skins' | 'banners' | 'pets';

function CosmeticsTab({ gems, upgrades, petState, buyCosmetic, equipCosmetic, buyPet, equipPet }: {
  gems: number;
  upgrades: PermanentUpgrades;
  petState: PetState;
  buyCosmetic: (id: string, cost: number) => void;
  equipCosmetic: (id: string, category: CosmeticCategory) => void;
  buyPet: (id: string, cost: number) => void;
  equipPet: (id: string) => void;
}) {
  const [section, setSection] = useState<CosmeticSection>('skins');
  const ownedCosmetics = (upgrades.ownedCosmetics as string[]) || [];
  const equippedHeroSkin = (upgrades.equippedHeroSkin as string) || 'default';
  const equippedUnitSkins: Record<string, string> = {};
  for (const ut of ['soldier', 'archer', 'knight']) {
    const v = upgrades[`unitSkin_${ut}`] as string;
    if (v) equippedUnitSkins[ut] = v;
  }
  const equippedBanner = (upgrades.equippedBanner as string) || 'default';

  const sectionDefs: { key: CosmeticSection; label: string }[] = [
    { key: 'skins', label: 'Skins' },
    { key: 'banners', label: 'Banners' },
    { key: 'pets', label: 'Pets' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* Sub-section tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {sectionDefs.map(s => (
          <button key={s.key} onClick={() => setSection(s.key)} style={{
            flex: 1, padding: '4px 6px', fontSize: '10px', fontFamily: 'inherit', fontWeight: 'bold',
            background: section === s.key ? 'rgba(255,68,255,0.15)' : 'rgba(20,15,35,0.4)',
            color: section === s.key ? '#ff44ff' : '#888',
            border: section === s.key ? '1px solid rgba(255,68,255,0.4)' : '1px solid rgba(138,74,223,0.15)',
            borderRadius: '4px', cursor: 'pointer',
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {section === 'skins' && (() => {
        const rarityOrder = { common: 0, rare: 1, legendary: 2 };
        const sortByRarity = (a: CosmeticDef, b: CosmeticDef) => rarityOrder[a.rarity] - rarityOrder[b.rarity];
        const unitTypes = [...new Set(COSMETICS.filter(c => c.category === 'unitSkin').map(c => c.unitType!))];
        return (
          <>
            <div style={{ fontSize: '9px', color: '#c084fc', fontWeight: 'bold', padding: '3px 6px', background: 'rgba(138,74,223,0.08)', borderRadius: '3px' }}>HERO SKINS</div>
            {COSMETICS.filter(c => c.category === 'heroSkin').sort(sortByRarity).map(c => (
              <CosmeticRow key={c.id} cosmetic={c} owned={(ownedCosmetics || []).includes(c.id)} equipped={equippedHeroSkin === c.id}
                gems={gems} onBuy={() => buyCosmetic(c.id, c.gemCost)} onEquip={() => equipCosmetic(c.id, 'heroSkin')} onUnequip={() => equipCosmetic('default', 'heroSkin')} />
            ))}
            {unitTypes.map(ut => (
              <React.Fragment key={ut}>
                <div style={{ fontSize: '9px', color: '#c084fc', fontWeight: 'bold', padding: '3px 6px', background: 'rgba(138,74,223,0.08)', borderRadius: '3px', marginTop: '4px' }}>{ut.toUpperCase()} SKINS</div>
                {COSMETICS.filter(c => c.category === 'unitSkin' && c.unitType === ut).sort(sortByRarity).map(c => (
                  <CosmeticRow key={c.id} cosmetic={c} owned={(ownedCosmetics || []).includes(c.id)} equipped={equippedUnitSkins[c.unitType!] === c.id}
                    gems={gems} onBuy={() => buyCosmetic(c.id, c.gemCost)} onEquip={() => equipCosmetic(c.id, 'unitSkin')} onUnequip={() => equipCosmetic(`default_${c.unitType}`, 'unitSkin')} />
                ))}
              </React.Fragment>
            ))}
          </>
        );
      })()}

      {section === 'banners' && (
        <>
          <div style={{ fontSize: '9px', color: '#888', textAlign: 'center', padding: '3px', background: 'rgba(138,74,223,0.08)', borderRadius: '3px', marginBottom: '2px' }}>
            Banners change the look of captured flags
          </div>
          {COSMETICS.filter(c => c.category === 'banner').map(c => (
            <CosmeticRow key={c.id} cosmetic={c} owned={(ownedCosmetics || []).includes(c.id)} equipped={equippedBanner === c.id}
              gems={gems} onBuy={() => buyCosmetic(c.id, c.gemCost)} onEquip={() => equipCosmetic(c.id, 'banner')} onUnequip={() => equipCosmetic('default', 'banner')} />
          ))}
        </>
      )}

      {section === 'pets' && (
        <>
          <div style={{ fontSize: '9px', color: '#888', textAlign: 'center', padding: '3px', background: 'rgba(138,74,223,0.08)', borderRadius: '3px', marginBottom: '2px' }}>
            Equip 1 pet — it follows your hero with a passive effect
          </div>
          <div style={{ fontSize: '9px', color: '#c084fc', fontWeight: 'bold', padding: '3px 6px', background: 'rgba(138,74,223,0.08)', borderRadius: '3px' }}>BOSS PETS (20% drop per kill)</div>
          {PETS.filter(p => p.source === 'boss').map(p => (
            <PetRow key={p.id} pet={p} owned={(petState.ownedPets || []).includes(p.id)} equipped={petState.equippedPet === p.id}
              gems={gems} onBuy={() => buyPet(p.id, p.gemCost)} onEquip={() => equipPet(p.id)} />
          ))}
          <div style={{ fontSize: '9px', color: '#c084fc', fontWeight: 'bold', padding: '3px 6px', background: 'rgba(138,74,223,0.08)', borderRadius: '3px', marginTop: '4px' }}>STORE PETS</div>
          {PETS.filter(p => p.source === 'store').map(p => (
            <PetRow key={p.id} pet={p} owned={(petState.ownedPets || []).includes(p.id)} equipped={petState.equippedPet === p.id}
              gems={gems} onBuy={() => buyPet(p.id, p.gemCost)} onEquip={() => equipPet(p.id)} />
          ))}
          <div style={{ fontSize: '9px', color: '#c084fc', fontWeight: 'bold', padding: '3px 6px', background: 'rgba(138,74,223,0.08)', borderRadius: '3px', marginTop: '4px' }}>ACHIEVEMENT PETS</div>
          {PETS.filter(p => p.source === 'achievement').map(p => (
            <PetRow key={p.id} pet={p} owned={(petState.ownedPets || []).includes(p.id)} equipped={petState.equippedPet === p.id}
              gems={gems} onBuy={() => buyPet(p.id, p.gemCost)} onEquip={() => equipPet(p.id)} />
          ))}
        </>
      )}
    </div>
  );
}

function CosmeticRow({ cosmetic, owned, equipped, gems, onBuy, onEquip, onUnequip }: {
  cosmetic: CosmeticDef; owned: boolean; equipped: boolean; gems: number;
  onBuy: () => void; onEquip: () => void; onUnequip?: () => void;
}) {
  const canAfford = gems >= cosmetic.gemCost;
  const rarityColor = RARITY_COLORS[cosmetic.rarity];

  return (
    <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: `1px solid ${equipped ? rarityColor : 'rgba(138,74,223,0.15)'}`, borderLeft: `3px solid ${rarityColor}` }}>
      <div style={{ flex: '0 0 78%', padding: '6px 8px', background: equipped ? 'rgba(255,68,255,0.06)' : ROW_BG }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
          <span style={{ fontSize: '14px' }}>{cosmetic.icon}</span>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: owned ? '#fff' : '#888' }}>{cosmetic.name}</span>
          {cosmetic.unitType && <span style={{ fontSize: '8px', color: '#aaa', background: 'rgba(255,255,255,0.06)', padding: '0 3px', borderRadius: '2px', textTransform: 'capitalize' }}>{cosmetic.unitType}</span>}
          <span style={{ fontSize: '8px', color: rarityColor, textTransform: 'uppercase' }}>{cosmetic.rarity}</span>
        </div>
        <div style={{ fontSize: '9px', color: '#888' }}>{cosmetic.description}</div>
      </div>
      <div style={{ flex: '0 0 22%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,10,25,0.5)' }}>
        {equipped ? (
          <button onClick={onUnequip} style={{
            width: '100%', height: '100%', padding: '4px 2px', fontSize: '10px', fontFamily: 'inherit', fontWeight: 'bold',
            background: 'rgba(74,255,74,0.1)', color: '#4aff4a', border: '1px solid rgba(74,255,74,0.3)', cursor: 'pointer',
          }}>UNEQUIP</button>
        ) : owned ? (
          <button onClick={onEquip} style={{
            width: '100%', height: '100%', padding: '4px 2px', fontSize: '10px', fontFamily: 'inherit', fontWeight: 'bold',
            background: 'rgba(255,68,255,0.2)', color: '#ff44ff', border: '1px solid rgba(255,68,255,0.4)', cursor: 'pointer',
          }}>EQUIP</button>
        ) : (
          <button onClick={onBuy} disabled={!canAfford} style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '4px 2px', fontSize: '11px', fontFamily: 'inherit', fontWeight: 'bold',
            background: canAfford ? rarityColor : DISABLED_BG, color: canAfford ? '#000' : '#555',
            border: canAfford ? 'none' : '1px solid rgba(138,74,223,0.3)', cursor: canAfford ? 'pointer' : 'not-allowed',
          }}>
            {cosmetic.gemCost}{'\u{1F48E}'}
          </button>
        )}
      </div>
    </div>
  );
}

const BOSS_NAMES: Record<number, string> = {
  0: 'Forest Guardian', 1: 'Wild Huntsman', 2: 'Wraith King',
  3: 'Broodmother', 4: 'Dungeon Lich', 5: 'Ice Conjurer', 6: 'White Ninja',
};

function PetRow({ pet, owned, equipped, gems, onBuy, onEquip }: {
  pet: PetDef; owned: boolean; equipped: boolean; gems: number;
  onBuy: () => void; onEquip: () => void;
}) {
  const canAfford = gems >= pet.gemCost && pet.gemCost > 0;
  const rarityColor = RARITY_COLORS[pet.rarity];
  const isBoss = pet.source === 'boss';
  const isLocked = pet.locked;

  return (
    <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: `1px solid ${equipped ? rarityColor : 'rgba(138,74,223,0.15)'}`, borderLeft: `3px solid ${rarityColor}`, opacity: isLocked ? 0.5 : 1 }}>
      <div style={{ flex: '0 0 78%', padding: '6px 8px', background: equipped ? 'rgba(255,68,255,0.06)' : ROW_BG }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
          <span style={{ fontSize: '14px' }}>{pet.icon}</span>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: owned ? '#fff' : '#888' }}>{pet.name}</span>
          <span style={{ fontSize: '8px', color: rarityColor, textTransform: 'uppercase' }}>{pet.rarity}</span>
        </div>
        <div style={{ fontSize: '9px', color: '#aaa', marginBottom: '1px' }}>{pet.effectDescription}</div>
        <div style={{ fontSize: '8px', color: '#666' }}>
          {isBoss && `Drop: ${BOSS_NAMES[pet.bossType!] || 'Unknown Boss'}`}
          {pet.source === 'achievement' && 'Earned: Hunting Slimes Lv.60'}
          {isLocked && 'Coming Soon'}
        </div>
      </div>
      <div style={{ flex: '0 0 22%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,10,25,0.5)' }}>
        {isLocked ? (
          <span style={{ fontSize: '10px', color: '#555' }}>{'\u{1F512}'}</span>
        ) : equipped ? (
          <span style={{ fontSize: '10px', color: '#4aff4a', fontWeight: 'bold' }}>EQUIPPED</span>
        ) : owned ? (
          <button onClick={onEquip} style={{
            width: '100%', height: '100%', padding: '4px 2px', fontSize: '10px', fontFamily: 'inherit', fontWeight: 'bold',
            background: 'rgba(255,68,255,0.2)', color: '#ff44ff', border: '1px solid rgba(255,68,255,0.4)', cursor: 'pointer',
          }}>EQUIP</button>
        ) : pet.source === 'store' && pet.gemCost > 0 ? (
          <button onClick={onBuy} disabled={!canAfford} style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '4px 2px', fontSize: '11px', fontFamily: 'inherit', fontWeight: 'bold',
            background: canAfford ? rarityColor : DISABLED_BG, color: canAfford ? '#000' : '#555',
            border: canAfford ? 'none' : '1px solid rgba(138,74,223,0.3)', cursor: canAfford ? 'pointer' : 'not-allowed',
          }}>
            {pet.gemCost}{'\u{1F48E}'}
          </button>
        ) : (
          <span style={{ fontSize: '9px', color: '#666' }}>{isBoss ? '20%' : '—'}</span>
        )}
      </div>
    </div>
  );
}
