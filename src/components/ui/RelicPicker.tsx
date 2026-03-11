import { COLORS } from '../../constants';
import { RELIC_SETS, getRelicLevel } from '../../relics';
import type { RelicCollection } from '../../relics';
import { SpriteIcon } from '../sprites/SpriteIcon';
import { RelicIconHTML } from '../sprites/GameIcons';

const RARITY_COLORS: Record<string, string> = {
  common: '#888',
  rare: '#4a9fff',
  legendary: '#ffd700',
};

const RARITY_LABELS: Record<string, string> = {
  common: 'Common',
  rare: 'Rare',
  legendary: 'Legendary',
};

interface RelicChoice {
  id: string;
  name: string;
  icon: string;
  rarity: string;
  desc: string;
}

function getSetNameForRelic(relicId: string): string | null {
  const set = RELIC_SETS.find(s => s.relics.includes(relicId));
  return set ? set.name : null;
}

interface Props {
  relics: RelicChoice[];
  onSelect: (relic: RelicChoice) => void;
  relicCollection?: RelicCollection;
}

export function RelicPicker({ relics, onSelect, relicCollection }: Props) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(30,12,50,0.98) 0%, rgba(15,8,25,0.98) 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 30, padding: '8px 10px',
    }}>
      <div style={{ color: '#FFD700', fontSize: '13px', marginBottom: '3px', textAlign: 'center' }}>
        <RelicIconHTML size={14} /> RELIC DROP!
      </div>
      <div style={{ color: COLORS.text, fontSize: '11px', marginBottom: '10px', textAlign: 'center' }}>
        Choose a relic:
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '480px' }}>
        {relics.map(relic => {
          const borderColor = RARITY_COLORS[relic.rarity] || '#6a6a8e';
          const isLegendary = relic.rarity === 'legendary';
          return (
            <button key={relic.id} onClick={() => onSelect(relic)} style={{
              padding: '8px 6px', background: 'linear-gradient(180deg, rgba(20,30,50,0.95) 0%, rgba(12,20,40,0.95) 100%)',
              border: `2px solid ${borderColor}`, borderRadius: '10px', cursor: 'pointer',
              width: '145px', textAlign: 'center', fontFamily: 'inherit',
              transition: 'border-color 0.15s',
              boxShadow: isLegendary ? `0 0 12px ${borderColor}40` : undefined,
            }}>
              {(() => { const setName = getSetNameForRelic(relic.id); return setName ? (
                <div style={{ fontSize: '7px', color: '#8888cc', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{setName}</div>
              ) : null; })()}
              <div style={{ marginBottom: '5px' }}><SpriteIcon path={`relics/${relic.id}`} size={28} fallback={relic.icon} /></div>
              <div style={{ color: '#FFD700', fontSize: '10px', marginBottom: '3px' }}>{relic.name}</div>
              <div style={{ color: borderColor, fontSize: '9px', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {RARITY_LABELS[relic.rarity] || 'Common'}
              </div>
              {(() => {
                const copies = relicCollection?.[relic.id] || 0;
                const level = getRelicLevel(copies);
                if (copies === 0) return (
                  <div style={{ fontSize: '8px', color: '#ffcc44', marginBottom: '2px' }}>
                    {'\u2728'} NEW
                  </div>
                );
                return (
                  <div style={{ fontSize: '8px', color: '#aaddaa', marginBottom: '2px' }}>
                    Owned — Lv {level} ({copies} {copies === 1 ? 'copy' : 'copies'})
                  </div>
                );
              })()}
              <div style={{ color: COLORS.text, fontSize: '9px', lineHeight: '1.2' }}>{relic.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
