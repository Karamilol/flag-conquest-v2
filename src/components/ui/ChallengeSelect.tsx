import { COLORS } from '../../constants';
import { CHALLENGE_DEFS, MAX_CHALLENGE_LEVEL, getChallengeShardsPerLevel } from '../../challenges';
import type { ChallengeId, ChallengeCompletions } from '../../types';

interface Props {
  onSelect: (id: ChallengeId) => void;
  onBack: () => void;
  keysAvailable: number;
  completions: ChallengeCompletions;
}

export function ChallengeSelect({ onSelect, onBack, keysAvailable, completions }: Props) {
  const noKeys = keysAvailable <= 0;

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(30,12,50,0.98) 0%, rgba(15,8,25,0.98) 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      zIndex: 100, padding: '12px', overflowY: 'auto',
    }}>
      <div style={{ color: COLORS.gold, fontSize: '15px', marginBottom: '4px', textAlign: 'center' }}>
        CHALLENGE RUNS
      </div>
      <div style={{ color: noKeys ? '#ff6666' : COLORS.text, fontSize: '10px', marginBottom: '12px', textAlign: 'center' }}>
        {noKeys ? 'No Challenge Keys! Earn them from bosses.' : `Keys: ${keysAvailable} | Select a challenge:`}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', maxWidth: '460px' }}>
        {CHALLENGE_DEFS.map(ch => {
          const level = completions[ch.id] || 0;
          const maxed = level >= MAX_CHALLENGE_LEVEL;
          const hasProgress = level > 0;
          const shardsPerLevel = getChallengeShardsPerLevel(ch.stars);
          const nextLevelShards = level < MAX_CHALLENGE_LEVEL ? shardsPerLevel : 0;
          return (
            <button
              key={ch.id}
              onClick={() => !noKeys && onSelect(ch.id)}
              disabled={noKeys}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px',
                background: maxed ? 'linear-gradient(180deg, rgba(40,35,10,0.95) 0%, rgba(25,20,5,0.95) 100%)' : hasProgress ? 'linear-gradient(180deg, rgba(20,40,30,0.95) 0%, rgba(12,25,18,0.95) 100%)' : 'linear-gradient(180deg, rgba(40,20,65,0.95) 0%, rgba(25,12,45,0.95) 100%)',
                border: `2px solid ${maxed ? '#ffd700' : hasProgress ? '#4a8' : noKeys ? 'rgba(138,74,223,0.2)' : '#6a4a9a'}`,
                borderRadius: '8px', cursor: noKeys ? 'default' : 'pointer',
                opacity: noKeys ? 0.5 : 1, textAlign: 'left', fontFamily: 'inherit', width: '100%',
              }}
            >
              <div style={{ fontSize: '23px', width: '32px', textAlign: 'center', flexShrink: 0 }}>
                {ch.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span style={{ color: COLORS.gold, fontSize: '12px' }}>{ch.name}</span>
                  <span style={{ color: '#ffaa00', fontSize: '10px', letterSpacing: '1px' }}>
                    {Array.from({ length: 5 }, (_, i) => i < ch.stars ? '\u2605' : '\u2606').join('')}
                  </span>
                  {hasProgress && (
                    <span style={{ color: maxed ? '#ffd700' : '#4aff4a', fontSize: '10px' }}>
                      LV.{level}{maxed ? ' MAX' : ''} {'✓'.repeat(level)}
                    </span>
                  )}
                </div>
                <div style={{ color: COLORS.text, fontSize: '10px', marginBottom: '2px' }}>{ch.desc}</div>
                <div style={{ color: hasProgress ? '#4a8' : '#888', fontSize: '9px' }}>
                  Reward: {ch.rewardName} — {ch.rewardDesc}
                  {nextLevelShards > 0 && <span style={{ color: '#c084fc', marginLeft: '6px' }}>{'\u{1F52E}'}+{nextLevelShards} shards (LV.{level + 1})</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button onClick={onBack} style={{
        marginTop: '12px', padding: '8px 24px', background: 'rgba(20,15,30,0.85)',
        border: '2px solid #6a4a9a', borderRadius: '6px', color: COLORS.text,
        fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit',
      }}>
        BACK
      </button>
    </div>
  );
}
