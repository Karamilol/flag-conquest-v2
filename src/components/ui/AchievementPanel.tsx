import { COLORS } from '../../constants';
import { ACHIEVEMENTS, CATEGORY_ORDER, CATEGORY_LABELS, type AchievementProgress } from '../../achievements';

interface Props {
  achievementProgress: AchievementProgress[];
  stats: Record<string, number>;
  onClaim: (achievementId: string, tier: number) => void;
  onClose: () => void;
}

const TIER_COLORS = ['#cd7f32', '#c0c0c0', '#ffd700'];
const TIER_LABELS = ['BRONZE', 'SILVER', 'GOLD'];

export function AchievementPanel({ achievementProgress, stats, onClaim, onClose }: Props) {
  // Group achievements by category
  const grouped = CATEGORY_ORDER.map(cat => {
    const defs = ACHIEVEMENTS.filter(def => {
      if (def.category !== cat) return false;
      // Hide hidden achievements unless unlocked
      if (def.hidden) {
        const p = achievementProgress.find(p => p.id === def.id);
        return (p?.unlockedTier || 0) > 0;
      }
      return true;
    });
    return { category: cat, label: CATEGORY_LABELS[cat], defs };
  }).filter(g => g.defs.length > 0);

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(30,12,50,0.98) 0%, rgba(15,8,25,0.98) 100%)',
      borderRadius: '8px', zIndex: 20, display: 'flex', flexDirection: 'column',
      padding: '8px', overflow: 'hidden', border: '2px solid #8a4adf',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ color: COLORS.gold, fontSize: '12px' }}>{'\u{1F3C6}'} ACHIEVEMENTS</span>
        <button onClick={onClose} style={{ padding: '3px 10px', fontSize: '10px', fontFamily: 'inherit', background: 'rgba(20,15,30,0.85)', color: '#aaa', border: '1px solid rgba(138,74,223,0.3)', borderRadius: '3px', cursor: 'pointer' }}>CLOSE</button>
      </div>

      {/* Rows grouped by category */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {grouped.map(group => (
          <div key={group.category}>
            {/* Category header */}
            <div style={{
              fontSize: '9px', color: '#888', letterSpacing: '1px',
              padding: '6px 4px 3px', marginTop: '4px',
              borderBottom: '1px solid rgba(138,74,223,0.25)',
            }}>
              {group.label}
            </div>
            {group.defs.map(def => {
              const progress = achievementProgress.find(p => p.id === def.id)
                || { id: def.id, unlockedTier: 0, claimedTier: 0 };
              const value = stats[def.statKey] || 0;

              // Find the current active tier (next one to unlock or claim)
              const activeTierIdx = progress.claimedTier < 3 ? progress.claimedTier : 2;
              const tier = def.tiers[activeTierIdx];
              const threshold = tier.threshold;
              const isComplete = def.singleTier ? progress.claimedTier >= 1 : progress.claimedTier >= 3;
              const canClaim = progress.unlockedTier > progress.claimedTier;
              const tierColor = def.singleTier ? '#ffd700' : TIER_COLORS[activeTierIdx];
              const tierLabel = def.singleTier ? '' : TIER_LABELS[activeTierIdx];

              // Reward text
              const rewardParts: string[] = [];
              if (tier.reward.gems) rewardParts.push(`+${tier.reward.gems}\u{1F48E}`);
              if (tier.reward.shards) rewardParts.push(`+${tier.reward.shards}\u{1F52E}`);

              return (
                <div
                  key={def.id}
                  onClick={canClaim ? () => onClaim(def.id, progress.claimedTier + 1) : undefined}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '6px 8px', borderRadius: '4px',
                    background: canClaim ? 'rgba(255,215,0,0.1)' : 'rgba(20,15,35,0.6)',
                    border: `1px solid ${canClaim ? tierColor : isComplete ? 'rgba(138,74,223,0.15)' : 'rgba(138,74,223,0.2)'}`,
                    cursor: canClaim ? 'pointer' : 'default',
                    opacity: isComplete ? 0.5 : 1,
                  }}
                >
                  {/* Icon */}
                  <span style={{ fontSize: '15px', width: '20px', textAlign: 'center' }}>{def.icon}</span>

                  {/* Name + description + tier label */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '10px', color: isComplete ? '#666' : '#ddd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {def.name}
                    </div>
                    <div style={{ fontSize: '8px', color: '#777' }}>
                      {def.description}
                    </div>
                    {(tierLabel || isComplete) && <div style={{ fontSize: '8px', color: tierColor, opacity: 0.8 }}>
                      {isComplete ? 'COMPLETE' : tierLabel}
                    </div>}
                  </div>

                  {/* Progress box */}
                  <div style={{
                    padding: '3px 8px', borderRadius: '3px', fontSize: '10px', fontWeight: 'bold',
                    background: canClaim ? tierColor : 'rgba(20,15,30,0.7)',
                    color: canClaim ? '#000' : value >= threshold ? '#4aff4a' : '#888',
                    whiteSpace: 'nowrap', minWidth: '50px', textAlign: 'center',
                  }}>
                    {isComplete ? (def.singleTier ? '\u2713' : '\u2713\u2713\u2713') : canClaim ? rewardParts.join(' ') : `${def.formatValue(value)}/${def.formatValue(threshold)}`}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
