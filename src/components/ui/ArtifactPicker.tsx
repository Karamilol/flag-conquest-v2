import { COLORS } from '../../constants';
import type { Artifact } from '../../types';
import { ARTIFACT_PARTNER, ARTIFACT_BY_ID, PAIR_BY_ID, CATEGORY_COLORS, CATEGORY_LABELS } from '../../artifacts';
import { SpriteIcon } from '../sprites/SpriteIcon';
import { TrophyIconHTML } from '../sprites/GameIcons';
import type { ArtifactCategory } from '../../artifacts';

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

interface Props {
  artifacts: Artifact[];
  ownedArtifactIds: string[];
  onSelect: (artifact: Artifact) => void;
  heroClass?: string;
}

export function ArtifactPicker({ artifacts, ownedArtifactIds, onSelect, heroClass }: Props) {
  const ownedSet = new Set(ownedArtifactIds);

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(30,12,50,0.98) 0%, rgba(15,8,25,0.98) 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 30, padding: '8px 10px',
    }}>
      <div style={{ color: COLORS.gold, fontSize: '13px', marginBottom: '3px', textAlign: 'center' }}>
        <TrophyIconHTML size={14} /> ARTIFACT FOUND!
      </div>
      <div style={{ color: COLORS.text, fontSize: '11px', marginBottom: '10px', textAlign: 'center' }}>
        Choose an artifact:
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '480px' }}>
        {artifacts.map(artifact => {
          const rarityColor = RARITY_COLORS[artifact.rarity] || '#6a6a8e';
          const isLegendary = artifact.rarity === 'legendary';
          const catColor = CATEGORY_COLORS[artifact.category as ArtifactCategory] || '#888';
          const catLabel = CATEGORY_LABELS[artifact.category as ArtifactCategory] || 'MISC';

          // Synergy hint: does the player already own the partner?
          const partnerId = ARTIFACT_PARTNER[artifact.id];
          const partnerOwned = partnerId ? ownedSet.has(partnerId) : false;
          const def = ARTIFACT_BY_ID[artifact.id];
          const pair = def ? PAIR_BY_ID[def.pairId] : undefined;

          // If picking this completes a synergy, show golden glow
          const completeSynergy = partnerOwned && pair;
          const borderColor = completeSynergy ? '#ffd700' : rarityColor;

          return (
            <button key={artifact.id} onClick={() => onSelect(artifact)} style={{
              padding: '8px 6px', background: completeSynergy
                ? 'linear-gradient(180deg, rgba(60,50,20,0.95) 0%, rgba(40,30,10,0.95) 100%)'
                : 'linear-gradient(180deg, rgba(40,20,65,0.95) 0%, rgba(25,12,45,0.95) 100%)',
              border: `2px solid ${borderColor}`, borderRadius: '10px', cursor: 'pointer',
              width: '145px', textAlign: 'center', fontFamily: 'inherit',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              boxShadow: completeSynergy
                ? '0 0 16px rgba(255, 215, 0, 0.5), inset 0 0 8px rgba(255, 215, 0, 0.1)'
                : isLegendary ? `0 0 12px ${rarityColor}40` : undefined,
            }}>
              {/* Category badge */}
              <div style={{
                display: 'inline-block', padding: '1px 4px', borderRadius: '3px',
                background: catColor + '30', border: `1px solid ${catColor}60`,
                color: catColor, fontSize: '7px', letterSpacing: '1px',
                textTransform: 'uppercase', marginBottom: '4px',
              }}>
                {catLabel}
              </div>

              <div style={{ marginBottom: '4px' }}><SpriteIcon path={`artifacts/${artifact.id}`} size={28} fallback={artifact.icon} /></div>
              <div style={{ color: COLORS.gold, fontSize: '10px', marginBottom: '2px' }}>{artifact.name}</div>
              <div style={{ color: rarityColor, fontSize: '8px', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {RARITY_LABELS[artifact.rarity] || 'Common'}
              </div>
              <div style={{ color: COLORS.text, fontSize: '9px', lineHeight: '1.2', marginBottom: completeSynergy ? '4px' : '0' }}>
                {artifact.desc}
              </div>

              {/* Synergy completion hint */}
              {completeSynergy && pair && (
                <div style={{
                  marginTop: '3px', padding: '2px 4px', borderRadius: '4px',
                  background: 'rgba(255, 215, 0, 0.15)', border: '1px solid rgba(255, 215, 0, 0.4)',
                }}>
                  <div style={{ color: '#ffd700', fontSize: '7px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                    COMPLETES SYNERGY
                  </div>
                  <div style={{ color: '#ffcc44', fontSize: '8px', marginTop: '2px' }}>
                    {pair.synergyName}: {pair.id === 'heroPair2' && heroClass
                      ? (heroClass === 'warlord'
                        ? 'Hero kills grant +0.01 speed +1% attack speed for 5s (stacks 8x)'
                        : 'Hero kills grant +0.03 speed +3% attack speed for 5s (stacks 8x)')
                      : pair.synergyDesc}
                  </div>
                </div>
              )}

              {/* Partner hint (not completing, but partner exists) */}
              {!completeSynergy && pair && partnerId && (
                <div style={{ color: '#666', fontSize: '8px', marginTop: '4px', fontStyle: 'italic' }}>
                  Pair: {ARTIFACT_BY_ID[partnerId]?.name || '???'}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
