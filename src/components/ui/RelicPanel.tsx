import { COLORS } from '../../constants';
import {
  RELIC_DEFS, RELIC_SETS, getRelicLevel, getSetPieceCount,
  copiesForNextLevel, getRelicCount, perLevelProgress, scaledRelicDesc,
  type RelicCollection, type RelicDef, type RelicSetDef,
} from '../../relics';
import { ANCIENT_RELIC_DEFS, getAncientRelicLevel, getAncientRelicDesc } from '../../ancientRelics';
import { SpriteIcon } from '../sprites/SpriteIcon';

interface Props {
  relicCollection: RelicCollection;
  onClose: () => void;
  ancientFragments?: number;
  dungeonUnlocked?: boolean;
  onOpenForge?: () => void;
  ancientRelicsOwned?: string[];
  ancientRelicCopies?: Record<string, number>;
  inline?: boolean;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#aaa',
  rare: '#4a9fff',
  legendary: '#ffd700',
};

function RelicIcon({ relic, copies }: { relic: RelicDef; copies: number }) {
  const level = getRelicLevel(copies);
  const locked = copies === 0;
  const color = RARITY_COLORS[relic.rarity];
  const plp = perLevelProgress(copies);

  if (locked) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        padding: '1px 2px', opacity: 0.4,
      }} title={`${relic.name} — defeat bosses to collect`}>
        <span style={{ fontSize: '13px', flexShrink: 0 }}>{'\u2753'}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '10px', color: '#555', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{relic.name}</div>
          <div style={{ fontSize: '9px', color: '#444' }}>Boss drops</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '4px',
      padding: '1px 2px',
    }} title={`${relic.name}: ${scaledRelicDesc(relic, copies)}`}>
      <SpriteIcon path={`relics/${relic.id}`} size={16} fallback={relic.icon} style={{ flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '10px', color, fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {relic.name}
          {level > 0 && <span style={{ color: '#4aff4a' }}> L{level}</span>}
          <span style={{ color: '#666', fontWeight: 'normal' }}>
            {level < 5 ? ` ${plp.current}/${plp.needed}` : ' MAX'}
          </span>
        </div>
        <div style={{ fontSize: '9px', color: '#777' }}>
          {scaledRelicDesc(relic, copies)}
        </div>
      </div>
    </div>
  );
}

function SetBox({ setDef, collection }: { setDef: RelicSetDef; collection: RelicCollection }) {
  const pieceCount = getSetPieceCount(setDef, collection);
  const totalPieces = setDef.relics.length;
  const relics = setDef.relics.map(id => RELIC_DEFS.find(r => r.id === id)!);
  const anyOwned = pieceCount > 0;

  // Highest rarity in set for border color
  const rarityOrder = { common: 0, rare: 1, legendary: 2 } as const;
  const highestRarity = relics.reduce<'common' | 'rare' | 'legendary'>((best, r) =>
    rarityOrder[r.rarity] > rarityOrder[best] ? r.rarity : best, 'common');
  const borderColor = anyOwned ? RARITY_COLORS[highestRarity] : 'rgba(138,74,223,0.25)';

  // Progress: fraction of unique pieces collected
  const progressFraction = pieceCount / totalPieces;

  return (
    <div style={{
      border: `1px solid ${borderColor}`, borderRadius: '4px',
      background: 'rgba(20,15,35,0.6)', overflow: 'hidden',
    }}>
      {/* Set header */}
      <div style={{
        padding: '3px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(15,10,25,0.5)', borderBottom: '1px solid rgba(138,74,223,0.2)',
      }}>
        <span style={{ fontSize: '11px', fontWeight: 'bold', color: anyOwned ? borderColor : '#555' }}>
          {setDef.name}
        </span>
        <span style={{ fontSize: '10px', color: pieceCount >= totalPieces ? '#4aff4a' : '#888' }}>
          {pieceCount}/{totalPieces}
        </span>
      </div>

      {/* Relic icons */}
      <div style={{ padding: '2px 4px' }}>
        {relics.map(r => (
          <RelicIcon key={r.id} relic={r} copies={collection[r.id] || 0} />
        ))}
      </div>

      {/* Set bonuses */}
      {setDef.bonuses.map(bonus => {
        const active = pieceCount >= bonus.pieces;
        return (
          <div key={bonus.pieces} style={{
            padding: '1px 6px', fontSize: '9px',
            color: active ? '#4aff4a' : '#555',
            fontStyle: 'italic',
          }}>
            ({bonus.pieces}pc) {bonus.name}: {bonus.desc}
          </div>
        );
      })}

      {/* Progress bar */}
      <div style={{ padding: '2px 6px 4px' }}>
        <div style={{ height: '5px', background: '#1a0e2a', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            width: `${Math.floor(progressFraction * 100)}%`, height: '100%',
            background: pieceCount >= totalPieces ? '#4aff4a' : borderColor, borderRadius: '3px',
          }} />
        </div>
      </div>
    </div>
  );
}

export function RelicPanel({ relicCollection, onClose, ancientFragments, dungeonUnlocked, onOpenForge, ancientRelicsOwned = [], ancientRelicCopies = {}, inline }: Props) {
  const totalRelics = getRelicCount(relicCollection);
  const unclassifiedRelics = RELIC_DEFS.filter(r => r.setId === null);

  return (
    <div style={inline ? {
      background: 'transparent', display: 'flex', flexDirection: 'column',
      padding: '6px', overflow: 'visible',
    } : {
      position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(30,12,50,0.98) 0%, rgba(15,8,25,0.98) 100%)',
      borderRadius: '8px', zIndex: 20, display: 'flex', flexDirection: 'column',
      padding: '6px', overflow: 'hidden', border: '2px solid #8a4adf',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ color: COLORS.gold, fontSize: '13px' }}>RELICS ({totalRelics})</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {onOpenForge && (
            <button onClick={onOpenForge} title="Ancient Fragments — earned from dungeon enemies. Spend to forge ancient relics." style={{ padding: '4px 10px', fontSize: '12px', fontFamily: 'inherit', background: 'rgba(106,58,170,0.6)', color: '#d8b0ff', border: '1px solid #8a5aca', borderRadius: '3px', cursor: 'pointer' }}>FORGE ({ancientFragments ?? 0})</button>
          )}
          <button onClick={onClose} style={{ padding: '4px 10px', fontSize: '12px', fontFamily: 'inherit', background: 'rgba(20,15,30,0.85)', color: '#aaa', border: '1px solid rgba(138,74,223,0.3)', borderRadius: '3px', cursor: 'pointer' }}>CLOSE</button>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {/* Sets in 2-column grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px',
        }}>
          {RELIC_SETS.map(setDef => (
            <SetBox key={setDef.id} setDef={setDef} collection={relicCollection} />
          ))}
        </div>

        {/* Unclassified */}
        {unclassifiedRelics.length > 0 && (
          <div style={{
            border: '1px solid rgba(138,74,223,0.25)', borderRadius: '4px', marginTop: '4px',
            background: 'rgba(20,15,35,0.6)', overflow: 'hidden',
          }}>
            <div style={{
              padding: '3px 6px', fontSize: '11px', fontWeight: 'bold', color: '#888',
              background: 'rgba(15,10,25,0.5)', borderBottom: '1px solid rgba(138,74,223,0.2)',
            }}>
              Unclassified
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '2px 4px' }}>
              {unclassifiedRelics.map(r => (
                <RelicIcon key={r.id} relic={r} copies={relicCollection[r.id] || 0} />
              ))}
            </div>
          </div>
        )}

        {/* Ancient Relics (from Forge) */}
        {dungeonUnlocked && (
          <div style={{
            border: '1px solid rgba(138,74,223,0.4)', borderRadius: '4px', marginTop: '4px',
            background: 'rgba(25,12,45,0.7)', overflow: 'hidden',
          }}>
            <div style={{
              padding: '3px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(40,20,70,0.5)', borderBottom: '1px solid rgba(138,74,223,0.3)',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#aa44ff' }}>
                {'\u{1F525}'} Ancient ({ancientRelicsOwned.length}/{ANCIENT_RELIC_DEFS.length})
              </span>
              <span style={{ fontSize: '10px', color: '#cc88ff', cursor: 'help' }} title="Ancient Fragments — earned from dungeon enemies. Spend to forge ancient relics.">
                {'\u{1F9E9}'} {ancientFragments ?? 0}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '2px 4px', gap: '2px' }}>
              {ANCIENT_RELIC_DEFS.map(relic => {
                const owned = (ancientRelicsOwned || []).includes(relic.id);
                const copies = ancientRelicCopies[relic.id] || 0;
                const level = getAncientRelicLevel(copies);
                const catColors: Record<string, string> = { combat: '#ff6666', hero: '#66aaff', economy: '#ffd700' };
                const thresholds = [1, 3, 5, 7, 9];
                const prevThresh = level > 0 ? thresholds[level - 1] : 0;
                const nextThresh = level < 5 ? thresholds[level] : null;
                const plCurrent = nextThresh ? copies - prevThresh : 0;
                const plNeeded = nextThresh ? nextThresh - prevThresh : 0;
                return (
                  <div key={relic.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '4px',
                    padding: '1px 2px', opacity: owned ? 1 : 0.3,
                  }} title={owned ? `${relic.name}: ${getAncientRelicDesc(relic.id, level)}` : '???'}>
                    <span style={{ fontSize: '13px', flexShrink: 0 }}>{owned ? <SpriteIcon path={`relics/${relic.id}`} size={16} fallback={relic.icon} /> : '\u2753'}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '10px', color: owned ? (catColors[relic.category] || '#aa44ff') : '#444', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {owned ? relic.name : '???'}
                        {owned && <span style={{ color: '#aa44ff' }}> Lv{level}{nextThresh ? ` ${plCurrent}/${plNeeded}` : ' MAX'}</span>}
                      </div>
                      <div style={{ fontSize: '9px', color: owned ? '#777' : '#444' }}>
                        {owned ? getAncientRelicDesc(relic.id, level) : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
