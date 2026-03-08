import { COLORS, UNIT_STATS } from '../../constants';
import type { GameState, DungeonMetaUpgrades } from '../../types';

interface Props {
  game: GameState;
  unlockedUnits: string[];
  onBuyUnit: () => void;
  onBuyMeleeBoost: () => void;
  onBuyRangedBoost: () => void;
  onBuyMagicBoost: () => void;
  onBuyMetaUpgrade: (key: keyof DungeonMetaUpgrades) => void;
  onSetAllyMode: (mode: 'advance' | 'hold' | 'retreat') => void;
}

// Unit roll cost: 1, 2, 3, 4, 5, ...
function unitRollCost(rolled: number): number {
  return rolled + 1;
}

// Linear cost for meta upgrades: 1, 2, 3, 4, 5, ...
function linearCost(level: number): number {
  return level + 1;
}

const META_COSTS: Record<keyof DungeonMetaUpgrades, { label: string; desc: string; icon: string }> = {
  headStart: { label: 'Head Start', desc: '+1 starting medal per level', icon: '\u{1F3C5}' },
  efficientMining: { label: 'Efficient Mining', desc: 'Mine 1s faster per level', icon: '\u26CF\uFE0F' },
  eliteBounty: { label: 'Elite Bounty', desc: '+1 medal from elite waves', icon: '\u{1F480}' },
};

export function DungeonShopPanel({ game, unlockedUnits, onBuyUnit, onBuyMeleeBoost, onBuyRangedBoost, onBuyMagicBoost, onBuyMetaUpgrade, onSetAllyMode }: Props) {
  const medals = game.dungeonMedals;
  const meleeBoost = game.dungeonMeleeBoost || 0;
  const rangedBoost = game.dungeonRangedBoost || 0;
  const magicBoost = game.dungeonMagicBoost || 0;
  const meta = game.dungeonMetaUpgrades;
  const allyMode = game.dungeonAllyMode || 'advance';
  const unitsRolled = game.dungeonUnitsRolled || 0;

  const unitCost = unitRollCost(unitsRolled);
  const meleeCost = meleeBoost + 1;
  const rangedCost = rangedBoost + 1;
  const magicCost = magicBoost + 1;

  const btnStyle = (canAfford: boolean): React.CSSProperties => ({
    padding: '5px 8px', fontSize: '9px', fontFamily: 'inherit', fontWeight: 'bold',
    background: canAfford ? '#4a2a7a' : 'rgba(20,15,30,0.85)', color: canAfford ? '#fff' : '#666',
    border: canAfford ? '2px solid #6a4a9a' : '2px solid rgba(138,74,223,0.2)', borderRadius: '4px',
    cursor: canAfford ? 'pointer' : 'not-allowed', width: '100%',
  });

  const metaBtnStyle = (canAfford: boolean): React.CSSProperties => ({
    padding: '4px 8px', fontSize: '9px', fontFamily: 'inherit', fontWeight: 'bold',
    background: canAfford ? '#2a5a2a' : 'rgba(20,15,30,0.85)', color: canAfford ? '#aaffaa' : '#666',
    border: canAfford ? '2px solid #4a8a4a' : '2px solid rgba(138,74,223,0.2)', borderRadius: '4px',
    cursor: canAfford ? 'pointer' : 'not-allowed', width: '100%',
  });

  const modeBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 10px', fontSize: '10px', fontFamily: 'inherit', fontWeight: 'bold',
    background: active ? '#3a6a9a' : 'rgba(20,15,35,0.6)', color: active ? '#fff' : '#888',
    border: active ? '2px solid #5a8aba' : '1px solid rgba(138,74,223,0.2)', borderRadius: '4px',
    cursor: 'pointer', flex: 1,
  });

  return (
    <div style={{
      width: '100%', maxWidth: '480px',
      background: 'linear-gradient(135deg, rgba(30,12,50,0.97) 0%, rgba(15,8,25,0.97) 100%)',
      border: '2px solid #8a4adf', borderRadius: '8px', padding: '10px',
      marginTop: '6px',
      boxShadow: '0 0 16px rgba(138,74,223,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ color: '#dd88ff', fontSize: '13px', fontWeight: 'bold' }}>{'\u{1F6D2}'} DUNGEON SHOP</span>
        <span style={{ color: '#ffd700', fontSize: '11px', cursor: 'help' }} title="Medals — earned from dungeon waves. Spend on dungeon upgrades.">{'\u{1F3C5}'} {medals} Medals</span>
      </div>

      {/* Army Controls */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ color: '#88aaff', fontSize: '10px', marginBottom: '3px' }}>ARMY ORDERS</div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => onSetAllyMode('advance')} style={modeBtnStyle(allyMode === 'advance')}>
            {'\u2694\uFE0F'} Advance
          </button>
          <button onClick={() => onSetAllyMode('hold')} style={modeBtnStyle(allyMode === 'hold')}>
            {'\u{1F6E1}\uFE0F'} Hold
          </button>
          <button onClick={() => onSetAllyMode('retreat')} style={modeBtnStyle(allyMode === 'retreat')}>
            {'\u{1F3C3}'} Retreat
          </button>
        </div>
      </div>

      {/* Recruit Unit + Category Boosts in a compact row */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
        <button onClick={onBuyUnit} disabled={medals < unitCost} style={btnStyle(medals >= unitCost)}>
          {'\u{1F3B2}'} Unit ({unitCost})
        </button>
        <button onClick={onBuyMeleeBoost} disabled={medals < meleeCost} style={btnStyle(medals >= meleeCost)}>
          {'\u2694\uFE0F'} Melee +{meleeBoost + 1} ({meleeCost})
        </button>
        <button onClick={onBuyRangedBoost} disabled={medals < rangedCost} style={btnStyle(medals >= rangedCost)}>
          {'\u{1F3F9}'} Rng +{rangedBoost + 1} ({rangedCost})
        </button>
        <button onClick={onBuyMagicBoost} disabled={medals < magicCost} style={btnStyle(medals >= magicCost)}>
          {'\u{1F9D9}'} Mag +{magicBoost + 1} ({magicCost})
        </button>
      </div>

      {/* Meta Upgrades (permanent) */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {(Object.keys(META_COSTS) as (keyof DungeonMetaUpgrades)[]).map(key => {
          const def = META_COSTS[key];
          const level = meta[key] || 0;
          const cost = linearCost(level);
          const canAfford = medals >= cost;
          return (
            <button key={key} onClick={() => onBuyMetaUpgrade(key)} disabled={!canAfford}
              style={{ ...metaBtnStyle(canAfford), textAlign: 'center' }}>
              {def.icon} {def.label} {level} ({cost})
            </button>
          );
        })}
      </div>
    </div>
  );
}
