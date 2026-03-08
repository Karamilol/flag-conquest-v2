import { useState } from 'react';
import { COLORS } from '../../constants';
import { ANCIENT_RELIC_DEFS, FORGE_COST, forgeAncientRelic, getAncientRelicLevel } from '../../ancientRelics';
import { SpriteIcon } from '../sprites/SpriteIcon';

interface Props {
  ancientFragments: number;
  ancientRelicsOwned: string[];
  ancientRelicCopies: Record<string, number>;
  onForge: (relicId: string) => void;
  onClose: () => void;
}

export function ForgePanel({ ancientFragments, ancientRelicsOwned, ancientRelicCopies, onForge, onClose }: Props) {
  const [justForged, setJustForged] = useState<string | null>(null);
  const [forgeAnim, setForgeAnim] = useState(false);

  const canForge = ancientFragments >= FORGE_COST;

  const handleForge = () => {
    if (!canForge) return;
    setForgeAnim(true);
    setTimeout(() => {
      const relicId = forgeAncientRelic(ancientRelicsOwned);
      if (relicId) {
        onForge(relicId);
        setJustForged(relicId);
      }
      setForgeAnim(false);
    }, 800);
  };

  const forgedDef = justForged ? ANCIENT_RELIC_DEFS.find(r => r.id === justForged) : null;

  const catColors: Record<string, string> = {
    combat: '#ff6666',
    hero: '#66aaff',
    economy: '#ffd700',
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(30,12,50,0.98) 0%, rgba(15,8,25,0.98) 100%)',
      border: '2px solid #8a4adf',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-start', borderRadius: '8px', zIndex: 10,
      padding: '20px', overflowY: 'auto', maxHeight: '85vh',
      boxShadow: '0 0 16px rgba(138,74,223,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '10px' }}>
        <span style={{ color: '#aa44ff', fontSize: '15px', fontWeight: 'bold' }}>{'\u{1F525}'} ANCIENT FORGE</span>
        <button onClick={onClose} style={{
          padding: '4px 12px', fontSize: '11px', fontFamily: 'inherit',
          background: 'rgba(20,15,30,0.85)', color: '#aaa', border: '1px solid rgba(138,74,223,0.3)', borderRadius: '4px', cursor: 'pointer',
        }}>CLOSE</button>
      </div>

      <div style={{ color: '#cc88ff', fontSize: '11px', marginBottom: '10px' }}>
        <span style={{ cursor: 'help' }} title="Ancient Fragments — earned from dungeon enemies. Spend to forge ancient relics.">{'\u{1F9E9}'} {ancientFragments} Fragments</span> | Cost: {FORGE_COST} | {ancientRelicsOwned.length}/{ANCIENT_RELIC_DEFS.length} owned
      </div>

      {/* Relic grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px',
        width: '100%', marginBottom: '10px',
      }}>
        {ANCIENT_RELIC_DEFS.map(relic => {
          const owned = (ancientRelicsOwned || []).includes(relic.id);
          const isNew = justForged === relic.id;
          const copies = ancientRelicCopies[relic.id] || 0;
          const level = getAncientRelicLevel(copies);
          const nextThresholds = [1, 3, 5, 7, 9];
          const nextThreshold = nextThresholds.find(t => t > copies);
          return (
            <div key={relic.id} style={{
              background: isNew ? 'rgba(170,68,255,0.2)' : owned ? 'rgba(20,15,35,0.6)' : 'rgba(10,5,15,0.5)',
              border: isNew ? '2px solid #aa44ff' : owned ? '1px solid rgba(138,74,223,0.3)' : '1px solid rgba(138,74,223,0.15)',
              borderRadius: '4px', padding: '6px', opacity: owned ? 1 : 0.4,
              transition: 'all 0.3s',
            }}>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '2px' }}>
                <SpriteIcon path={`relics/${relic.id}`} size={18} fallback={relic.icon} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: owned ? '#fff' : '#666', fontSize: '9px', fontWeight: 'bold' }}>{relic.name}</div>
                  <div style={{ color: catColors[relic.category] || '#888', fontSize: '8px' }}>{relic.category.toUpperCase()}</div>
                </div>
                {owned && <div style={{ color: '#aa44ff', fontSize: '9px', fontWeight: 'bold' }}>Lv{level}{nextThreshold ? ` (${copies}/${nextThreshold})` : ' MAX'}</div>}
              </div>
              <div style={{ color: owned ? '#aaa' : '#555', fontSize: '8px', lineHeight: '1.3' }}>{relic.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Forge reveal animation */}
      {forgeAnim && (
        <div style={{
          color: '#aa44ff', fontSize: '17px', textAlign: 'center',
          marginBottom: '12px', animation: 'pulse 0.5s infinite',
        }}>
          {'\u{1F525}'} FORGING... {'\u{1F525}'}
        </div>
      )}

      {/* Just forged reveal */}
      {forgedDef && !forgeAnim && (
        <div style={{
          background: 'rgba(170,68,255,0.15)', border: '2px solid #aa44ff',
          borderRadius: '6px', padding: '10px', textAlign: 'center',
          marginBottom: '10px', width: '100%',
        }}>
          <div style={{ marginBottom: '4px' }}><SpriteIcon path={`relics/${forgedDef.id}`} size={30} fallback={forgedDef.icon} /></div>
          <div style={{ color: '#dd88ff', fontSize: '12px', fontWeight: 'bold', marginBottom: '3px' }}>
            {forgedDef.name}
            {(ancientRelicCopies[forgedDef.id] || 0) > 1 && <span style={{ color: '#aa88ff', fontSize: '9px' }}> (DUPLICATE - Lv{getAncientRelicLevel(ancientRelicCopies[forgedDef.id] || 1)})</span>}
          </div>
          <div style={{ color: '#aaa', fontSize: '9px' }}>{forgedDef.desc}</div>
        </div>
      )}

      {/* Forge button */}
      <button onClick={handleForge} disabled={!canForge || forgeAnim} style={{
        padding: '10px 24px', fontSize: '12px', fontFamily: 'inherit', fontWeight: 'bold',
        background: canForge && !forgeAnim ? '#aa44ff' : 'rgba(20,15,30,0.85)',
        color: canForge && !forgeAnim ? '#fff' : '#666',
        border: canForge && !forgeAnim ? '2px solid #cc66ff' : '2px solid rgba(138,74,223,0.3)',
        borderRadius: '6px', cursor: canForge && !forgeAnim ? 'pointer' : 'not-allowed',
        width: '100%',
      }}>
        {ancientRelicsOwned.length >= ANCIENT_RELIC_DEFS.length
          ? `${'\u{1F525}'} FORGE DUPLICATE (${FORGE_COST} ${'\u{1F9E9}'})`
          : `${'\u{1F525}'} FORGE RELIC (${FORGE_COST} ${'\u{1F9E9}'})`}
      </button>
    </div>
  );
}
