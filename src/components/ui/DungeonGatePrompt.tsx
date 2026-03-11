// ── Dungeon Gate Prompt ──────────────────────────────────────────────
// Shows when clicking a dungeon gate on a captured flag.
// If locked: choose which key to use (artifact/regalia), or leave.
// If unlocked: choose to enter artifact or regalia dungeon, or leave.

interface Props {
  gateType: 'artifact' | 'regalia';
  locked: boolean;
  artifactKeys: number;
  regaliaKeys: number;
  onUnlock: (keyType: 'artifact' | 'regalia') => void;
  onEnter: () => void;
  onLeave: () => void;
}

export function DungeonGatePrompt({ gateType, locked, artifactKeys, regaliaKeys, onUnlock, onEnter, onLeave }: Props) {
  const F = '"Press Start 2P", monospace';

  const gateLabel = gateType === 'artifact' ? 'Artifact Dungeon' : 'Regalia Dungeon';
  const gateIcon = gateType === 'artifact' ? '🗿' : '🔥';
  const gateColor = gateType === 'artifact' ? '#a855f7' : '#f97316';
  const gateGlow = gateType === 'artifact' ? 'rgba(168,85,247,0.4)' : 'rgba(249,115,22,0.4)';

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(135deg, rgba(15,10,25,0.97) 0%, rgba(5,5,12,0.97) 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 30, padding: '8px',
    }}>
      {/* Gate icon */}
      <div style={{ fontSize: '28px', marginBottom: '4px' }}>{locked ? '🔒' : gateIcon}</div>
      <div style={{
        color: gateColor, fontSize: '10px', fontFamily: F,
        textShadow: `0 0 12px ${gateGlow}`,
        marginBottom: '4px', textAlign: 'center',
      }}>
        {locked ? 'SEALED DUNGEON GATE' : gateLabel.toUpperCase()}
      </div>

      <div style={{
        color: '#aaa', fontSize: '6.5px', fontFamily: F,
        textAlign: 'center', maxWidth: '320px', lineHeight: '1.6',
        marginBottom: '10px', opacity: 0.8, fontStyle: 'italic',
      }}>
        {locked
          ? 'Ancient runes seal this gateway. A key is required to break the ward.'
          : `The gate stands open. Dark energy pulses from within the ${gateType === 'artifact' ? 'ancient vault' : 'burning arena'}.`}
      </div>

      {locked ? (
        // Locked: show key options
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%', maxWidth: '340px' }}>
          <button
            onClick={() => onUnlock('artifact')}
            disabled={artifactKeys <= 0}
            style={{
              padding: '7px 10px', cursor: artifactKeys > 0 ? 'pointer' : 'not-allowed',
              background: artifactKeys > 0
                ? 'linear-gradient(180deg, rgba(30,15,50,0.9) 0%, rgba(10,8,4,0.9) 100%)'
                : 'rgba(20,15,10,0.5)',
              border: `1.5px solid ${artifactKeys > 0 ? '#a855f7' : '#444'}`,
              borderRadius: '6px',
              display: 'flex', flexDirection: 'column', gap: '2px',
              opacity: artifactKeys > 0 ? 1 : 0.45,
              transition: 'border-color 0.15s, box-shadow 0.15s',
              textAlign: 'left',
            }}
            onMouseEnter={e => { if (artifactKeys > 0) { e.currentTarget.style.borderColor = '#cc88ff'; e.currentTarget.style.boxShadow = '0 0 10px rgba(160,80,255,0.3)'; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = artifactKeys > 0 ? '#a855f7' : '#444'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span style={{ color: artifactKeys > 0 ? '#cc88ff' : '#666', fontSize: '7px', fontFamily: F, fontWeight: 'bold' }}>
                🗝️ Use Artifact Key
              </span>
              <span style={{ color: artifactKeys > 0 ? '#cc88ff' : '#666', fontSize: '6px', fontFamily: F }}>
                {artifactKeys} key{artifactKeys !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ color: artifactKeys > 0 ? '#bbb' : '#555', fontSize: '6px', fontFamily: F, lineHeight: '1.5' }}>
              Open as an Artifact Dungeon — survive waves for powerful artifacts.
            </div>
          </button>

          <button
            onClick={() => onUnlock('regalia')}
            disabled={regaliaKeys <= 0}
            style={{
              padding: '7px 10px', cursor: regaliaKeys > 0 ? 'pointer' : 'not-allowed',
              background: regaliaKeys > 0
                ? 'linear-gradient(180deg, rgba(40,20,10,0.9) 0%, rgba(10,8,4,0.9) 100%)'
                : 'rgba(20,15,10,0.5)',
              border: `1.5px solid ${regaliaKeys > 0 ? '#f97316' : '#444'}`,
              borderRadius: '6px',
              display: 'flex', flexDirection: 'column', gap: '2px',
              opacity: regaliaKeys > 0 ? 1 : 0.45,
              transition: 'border-color 0.15s, box-shadow 0.15s',
              textAlign: 'left',
            }}
            onMouseEnter={e => { if (regaliaKeys > 0) { e.currentTarget.style.borderColor = '#ffaa44'; e.currentTarget.style.boxShadow = '0 0 10px rgba(249,115,22,0.3)'; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = regaliaKeys > 0 ? '#f97316' : '#444'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span style={{ color: regaliaKeys > 0 ? '#ffaa44' : '#666', fontSize: '7px', fontFamily: F, fontWeight: 'bold' }}>
                🗝️ Use Regalia Key
              </span>
              <span style={{ color: regaliaKeys > 0 ? '#ffaa44' : '#666', fontSize: '6px', fontFamily: F }}>
                {regaliaKeys} key{regaliaKeys !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ color: regaliaKeys > 0 ? '#bbb' : '#555', fontSize: '6px', fontFamily: F, lineHeight: '1.5' }}>
              Open as a Regalia Dungeon — race against time for legendary regalia.
            </div>
          </button>
        </div>
      ) : (
        // Unlocked: just enter
        <button
          onClick={onEnter}
          style={{
            padding: '8px 20px', cursor: 'pointer',
            background: `linear-gradient(180deg, ${gateType === 'artifact' ? 'rgba(30,15,50,0.9)' : 'rgba(40,20,10,0.9)'} 0%, rgba(10,8,4,0.9) 100%)`,
            border: `1.5px solid ${gateColor}`,
            borderRadius: '6px',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = gateType === 'artifact' ? '#cc88ff' : '#ffaa44'; e.currentTarget.style.boxShadow = `0 0 12px ${gateGlow}`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = gateColor; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <span style={{ color: gateColor, fontSize: '8px', fontFamily: F, fontWeight: 'bold' }}>
            ENTER {gateLabel.toUpperCase()}
          </span>
        </button>
      )}

      {/* Leave button */}
      <button
        onClick={onLeave}
        style={{
          marginTop: '8px', padding: '4px 16px', cursor: 'pointer',
          background: 'rgba(60,50,30,0.3)', border: '1px solid #5a4a33',
          borderRadius: '4px', color: '#8a7a55', fontSize: '7px', fontFamily: F,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#c4a862'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#8a7a55'; }}
      >
        LEAVE
      </button>
    </div>
  );
}
