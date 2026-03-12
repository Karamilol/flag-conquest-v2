import { useState } from 'react';
import { COLORS } from '../../constants';
import { CONSUMABLE_DEFS } from '../../consumables';
import type { Backpack, ConsumableId } from '../../types';
import { HealthPotionIconHTML } from '../sprites/HealthPotionIcon';
import { SpriteIcon } from '../sprites/SpriteIcon';

type SelectedItem = ConsumableId | 'gems' | 'shards';

const CURRENCY_DEFS: { id: 'gems' | 'shards'; icon: string; name: string; desc: string }[] = [
  { id: 'gems', icon: '\u{1F48E}', name: 'Gems', desc: 'Spent on rerolls when recruiting units.' },
  { id: 'shards', icon: '\u{1F52E}', name: 'Shards', desc: 'Rare currency for powerful permanent upgrades.' },
];

const CELL = 30;
const GAP = 4;
const COLS = 4;

interface Props {
  backpack: Backpack;
  gems: number;
  shards: number;
  onClose: () => void;
  onUseConsumable?: (id: ConsumableId) => void;
  canUseMidRun?: boolean;
  dungeonUnlocked?: boolean;
  inDungeon?: boolean;
}

export function BackpackPanel({ backpack, gems, shards, onClose, onUseConsumable, canUseMidRun, dungeonUnlocked, inDungeon }: Props) {
  const [selected, setSelected] = useState<SelectedItem | null>(null);

  // Resolve selected item info
  const isCurrency = selected === 'gems' || selected === 'shards';
  const selectedConsumableDef = !isCurrency && selected ? CONSUMABLE_DEFS.find(d => d.id === selected) : null;
  const selectedCurrencyDef = isCurrency ? CURRENCY_DEFS.find(d => d.id === selected) : null;
  const selectedQty = (() => {
    if (selected === 'gems') return gems;
    if (selected === 'shards') return shards;
    if (selected) return backpack[selected] || 0;
    return 0;
  })();

  const canUseSelected = (() => {
    if (isCurrency || !selected || !selectedConsumableDef || selectedQty <= 0 || !canUseMidRun || !onUseConsumable) return false;
    // Artifact/Regalia keys are used at Dungeon Gates, not from backpack
    if (selected === 'artifactKey') return false;
    if (selected === 'regaliaKey') return false;
    if (selectedConsumableDef.usage === 'midRun') return !inDungeon;
    return false;
  })();

  const currencyAmounts: Record<string, number> = { gems, shards };

  // All grid items: currencies first, then consumables
  const gridItems: { key: string; icon: string; qty: number; selectId: SelectedItem }[] = [
    ...CURRENCY_DEFS.map(c => ({ key: c.id, icon: c.icon, qty: currencyAmounts[c.id], selectId: c.id as SelectedItem })),
    ...CONSUMABLE_DEFS.map(def => ({ key: def.id, icon: def.icon, qty: backpack[def.id] || 0, selectId: def.id as SelectedItem })),
  ];

  const gridW = COLS * CELL + (COLS - 1) * GAP;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0,
        zIndex: 20, pointerEvents: 'auto',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '80px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, rgba(30,12,50,0.98) 0%, rgba(15,8,25,0.98) 100%)',
          border: '2px solid #8a4adf',
          borderRadius: '10px', padding: '14px 16px',
          fontFamily: '"Press Start 2P", "Courier New", monospace',
          boxShadow: '0 0 16px rgba(138,74,223,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ color: COLORS.gold, fontSize: '12px' }}>BACKPACK</span>
          <button onClick={onClose} style={{
            padding: '2px 8px', fontSize: '8px', fontFamily: 'inherit',
            background: 'rgba(20,15,30,0.85)', color: '#aaa', border: '1px solid rgba(138,74,223,0.3)', borderRadius: '3px', cursor: 'pointer',
          }}>X</button>
        </div>

        {/* Inventory grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`, gap: `${GAP}px`,
          marginBottom: '8px', justifyContent: 'center',
        }}>
          {gridItems.map(item => {
            const isSelected = selected === item.selectId;
            return (
              <div
                key={item.key}
                onClick={() => setSelected(isSelected ? null : item.selectId)}
                style={{
                  width: `${CELL}px`, height: `${CELL}px`, position: 'relative',
                  background: isSelected ? 'rgba(255,215,0,0.12)' : 'rgba(20,15,35,0.6)',
                  border: `2px solid ${isSelected ? COLORS.gold : item.qty > 0 ? 'rgba(138,74,223,0.4)' : 'rgba(138,74,223,0.15)'}`,
                  borderRadius: '5px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: item.qty > 0 ? 1 : 0.35,
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <span style={{ fontSize: '15px' }}>{item.key === 'healingPotion' ? <HealthPotionIconHTML size={18} /> : <SpriteIcon path={`backpack/${item.key}`} size={18} fallback={item.icon} />}</span>
                {item.qty > 0 && (
                  <span style={{
                    position: 'absolute', bottom: '0px', right: '2px',
                    fontSize: '7px', color: '#44ffaa', fontFamily: 'inherit',
                  }}>x{item.qty}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected item detail */}
        {(selectedConsumableDef || selectedCurrencyDef) ? (
          <div style={{
            padding: '7px', background: 'rgba(20,15,35,0.6)', borderRadius: '5px',
            border: '1px solid rgba(138,74,223,0.25)', minHeight: '40px',
            maxWidth: `${gridW}px`,
          }}>
            <div style={{ fontSize: '10px', color: '#ddd', fontWeight: 'bold', marginBottom: '3px' }}>
              {selected === 'healingPotion' ? <HealthPotionIconHTML size={12} /> : <SpriteIcon path={`backpack/${selected}`} size={14} fallback={(selectedConsumableDef || selectedCurrencyDef)!.icon} />} {(selectedConsumableDef || selectedCurrencyDef)!.name}
              <span style={{ color: selectedQty > 0 ? '#44ffaa' : '#666', marginLeft: '6px' }}>x{selectedQty}</span>
            </div>
            <div style={{ fontSize: '8px', color: '#999', marginBottom: '5px', lineHeight: 1.4 }}>
              {(selectedConsumableDef || selectedCurrencyDef)!.desc}
            </div>
            {canUseSelected && (
              <button
                onClick={() => { onUseConsumable!(selected as ConsumableId); if (selectedQty <= 1) setSelected(null); }}
                style={{
                  padding: '4px 14px', fontSize: '9px', fontFamily: 'inherit',
                  background: '#4a9eff', color: '#fff', border: 'none', borderRadius: '4px',
                  cursor: 'pointer', width: '100%',
                }}
              >USE</button>
            )}
          </div>
        ) : (
          <div style={{
            padding: '7px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            maxWidth: `${gridW}px`,
          }}>
            <span style={{ fontSize: '8px', color: '#555' }}>Click an item to inspect</span>
          </div>
        )}
      </div>
    </div>
  );
}
