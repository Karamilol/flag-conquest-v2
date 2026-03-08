import { useState } from 'react';
import { COLORS, UNIT_STATS } from '../../constants';
import type { UnitSlot } from '../../types';

type SortMode = 'purchase' | 'alpha' | 'type';
const SORT_LABELS: Record<SortMode, string> = { purchase: 'Order', alpha: 'A-Z', type: 'Type' };
const SORT_CYCLE: SortMode[] = ['purchase', 'alpha', 'type'];

const TYPE_ORDER: Record<string, number> = { soldier: 0, archer: 1, halberd: 2, knight: 3, wizard: 4, cleric: 5 };

interface Props {
  unitSlots: UnitSlot[];
}

export function ArmyDisplay({ unitSlots }: Props) {
  const [sortMode, setSortMode] = useState<SortMode>('purchase');

  const sorted = [...(unitSlots || [])].map((slot, i) => ({ slot, origIdx: i }));
  if (sortMode === 'alpha') {
    sorted.sort((a, b) => a.slot.type.localeCompare(b.slot.type));
  } else if (sortMode === 'type') {
    sorted.sort((a, b) => (TYPE_ORDER[a.slot.type] ?? 99) - (TYPE_ORDER[b.slot.type] ?? 99));
  }

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
        {SORT_CYCLE.map(mode => (
          <button key={mode} onClick={() => setSortMode(mode)} style={{
            padding: '1px 6px', fontSize: '7px', fontFamily: 'inherit',
            background: sortMode === mode ? 'rgba(138,74,223,0.3)' : 'rgba(20,15,30,0.6)',
            color: sortMode === mode ? COLORS.gold : '#777',
            border: sortMode === mode ? '1px solid rgba(138,74,223,0.5)' : '1px solid rgba(138,74,223,0.15)',
            borderRadius: '3px', cursor: 'pointer',
          }}>{SORT_LABELS[mode]}</button>
        ))}
      </div>
      <div style={{ padding: '8px 16px', background: COLORS.panel, borderRadius: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {sorted.map(({ slot, origIdx }) => {
          const stats = UNIT_STATS[slot.type as keyof typeof UNIT_STATS] as any;
          if (!stats) return null;
          const isAlive = slot.alive;
          const respawnPct = isAlive ? 100 : Math.max(0, 100 - (slot.respawnTimer / stats.respawnTime) * 100);
          const respawnSec = Math.ceil(slot.respawnTimer / 60);
          const almostReady = !isAlive && respawnPct > 80;
          return (
            <div key={origIdx} style={{ position: 'relative', height: '28px', borderRadius: '4px', overflow: 'hidden', fontSize: '10px', flexShrink: 0, opacity: isAlive ? 1 : 0.8, border: almostReady ? `1px solid ${stats.color}` : '1px solid transparent', transition: 'border-color 0.3s' }}>
              <div style={{ position: 'absolute', inset: 0, background: isAlive ? stats.color : '#333' }} />
              {!isAlive && (
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${respawnPct}%`, background: stats.color, opacity: almostReady ? 0.7 : 0.5, transition: 'width 0.3s, opacity 0.3s' }} />
              )}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: isAlive ? '#000' : '#ccc', fontWeight: 'bold', whiteSpace: 'nowrap', padding: '0 8px' }}>
                {stats.name}
                {!isAlive && <span style={{ fontSize: '10px', marginLeft: '3px', color: almostReady ? '#fff' : '#aaa' }}>{respawnSec}s</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
