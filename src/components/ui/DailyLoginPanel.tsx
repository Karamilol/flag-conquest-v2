import { COLORS } from '../../constants';
import { DAILY_REWARDS } from '../../dailyLogin';
import { HealthPotionIconHTML } from '../sprites/HealthPotionIcon';

interface Props {
  currentDay: number;
  canClaim: boolean;
  onClaim: () => void;
  onClose: () => void;
}

export function DailyLoginPanel({ currentDay, canClaim, onClaim, onClose }: Props) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 20,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '15%',
    }}>
    <div style={{
      width: '88%', maxWidth: '440px',
      background: 'linear-gradient(135deg, rgba(30,12,50,0.98) 0%, rgba(15,8,25,0.98) 100%)',
      borderRadius: '8px', display: 'flex', flexDirection: 'column',
      padding: '8px 8px 6px', border: '2px solid #8a4adf',
      boxShadow: '0 0 30px rgba(138,74,223,0.4), 0 8px 32px rgba(0,0,0,0.6)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
        <span style={{ color: COLORS.gold, fontSize: '11px' }}>{'\u{1F4C5}'} DAILY LOGIN</span>
        <button onClick={onClose} style={{
          padding: '2px 8px', fontSize: '9px', fontFamily: 'inherit',
          background: 'rgba(20,15,30,0.85)', color: '#aaa',
          border: '1px solid rgba(138,74,223,0.3)', borderRadius: '3px', cursor: 'pointer',
        }}>CLOSE</button>
      </div>

      {/* Subtitle */}
      <div style={{ color: '#a89cc8', fontSize: '11px', textAlign: 'center', marginBottom: '5px' }}>
        Thank you for playing! A gift for you.
      </div>

      {/* 7-day grid — 4 on top row, 3 on bottom row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {[DAILY_REWARDS.slice(0, 4), DAILY_REWARDS.slice(4, 7)].map((row, rowIdx) => (
          <div key={rowIdx} style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
            {row.map((reward, colIdx) => {
              const dayIdx = rowIdx === 0 ? colIdx : colIdx + 4;
              const isClaimed = dayIdx < currentDay;
              const isCurrent = dayIdx === currentDay;
              const isFuture = dayIdx > currentDay;

              return (
                <div key={dayIdx} style={{
                  flex: '1 1 0',
                  maxWidth: '25%',
                  background: isCurrent && canClaim
                    ? 'rgba(255,215,0,0.08)'
                    : 'rgba(20,15,35,0.6)',
                  border: isCurrent && canClaim
                    ? '2px solid #ffd700'
                    : isCurrent
                      ? '2px solid rgba(255,215,0,0.3)'
                      : isFuture
                        ? '1px solid rgba(138,74,223,0.15)'
                        : '1px solid rgba(138,74,223,0.2)',
                  borderRadius: '5px',
                  padding: '4px 2px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
                  opacity: isFuture ? 0.4 : 1,
                }}>
                  {/* Day label */}
                  <div style={{
                    fontSize: '9px', fontFamily: 'inherit',
                    color: isCurrent && canClaim ? COLORS.gold : isClaimed ? '#66cc66' : '#888',
                  }}>
                    DAY {dayIdx + 1}
                  </div>

                  {/* Icon */}
                  <div style={{ fontSize: '16px', lineHeight: 1 }}>
                    {reward.icon === '\u{1F9EA}' ? <HealthPotionIconHTML size={18} /> : reward.icon}
                  </div>

                  {/* Label */}
                  <div style={{
                    fontSize: '9px', fontFamily: 'inherit',
                    color: isCurrent && canClaim ? '#fff' : isClaimed ? '#888' : '#999',
                    textAlign: 'center', lineHeight: '1.2',
                  }}>
                    {reward.label}
                  </div>

                  {/* Claimed text — only on actually claimed past days */}
                  {isClaimed && (
                    <div style={{ fontSize: '8px', color: '#66cc66' }}>
                      {'\u2714'} Claimed
                    </div>
                  )}

                  {/* Claim button */}
                  {isCurrent && canClaim && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onClaim(); }}
                      style={{
                        marginTop: '1px', padding: '2px 8px', fontSize: '10px',
                        fontFamily: 'inherit', fontWeight: 'bold',
                        background: COLORS.gold, color: '#333',
                        border: '2px solid #b8960e', borderRadius: '3px',
                        cursor: 'pointer',
                      }}
                    >
                      CLAIM
                    </button>
                  )}

                  {/* Current day but already claimed today — show "tomorrow" hint */}
                  {isCurrent && !canClaim && (
                    <div style={{ fontSize: '7px', color: '#888' }}>
                      Tomorrow
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Cycle info */}
      <div style={{ color: '#666', fontSize: '8px', textAlign: 'center', marginTop: '4px' }}>
        Rewards cycle every 7 days
      </div>
    </div>
    </div>
  );
}
