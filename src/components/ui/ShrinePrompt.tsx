// ── Allegiance Shrine Prompt ─────────────────────────────────────────
// 3 options per shrine: break (desecrate), small offering (gold), big offering (gems).
// Big stacks with small. Already-chosen shrines show "quiet" message.

import { getShrineDef } from '../../modifiers';
import type { ShrineOption } from '../../modifiers';

const OPTION_COLORS: Record<string, { border: string; bg: string; text: string; hover: string }> = {
  break: { border: '#8a3333', bg: 'rgba(60,15,15,0.9)', text: '#ff6666', hover: 'rgba(255,50,50,0.2)' },
  small: { border: '#8a7a44', bg: 'rgba(40,32,15,0.9)', text: '#ffd700', hover: 'rgba(255,215,0,0.2)' },
  big:   { border: '#6a44aa', bg: 'rgba(30,15,50,0.9)', text: '#cc88ff', hover: 'rgba(160,80,255,0.2)' },
};

interface Props {
  shrineUnitType: string;
  alreadyChosen: boolean;
  desecrationOnly: boolean;
  gold: number;
  gems: number;
  onPledge: (shrineChoice: string, cost?: { type: 'gold' | 'gems'; amount: number }) => void;
  onLeave: () => void;
}

export function ShrinePrompt({ shrineUnitType, alreadyChosen, desecrationOnly, gold, gems, onPledge, onLeave }: Props) {
  const F = '"Press Start 2P", monospace';
  const shrine = getShrineDef(shrineUnitType);

  // Already pledged — shrine is quiet
  if (alreadyChosen) {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(25,20,10,0.97) 0%, rgba(12,10,5,0.97) 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 30, padding: '16px',
      }}>
        <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏛️</div>
        <div style={{ color: '#8a7a55', fontSize: '10px', fontFamily: F, textAlign: 'center', marginBottom: '8px' }}>
          The shrine is quiet...
        </div>
        <div style={{ color: '#5a4a33', fontSize: '7px', fontFamily: F, textAlign: 'center', maxWidth: '280px', lineHeight: '1.6' }}>
          You have already sworn your allegiance. The ancient stones have nothing more to offer.
        </div>
        <button
          onClick={onLeave}
          style={{
            marginTop: '16px', padding: '6px 20px', cursor: 'pointer',
            background: 'rgba(100,80,40,0.3)', border: '1px solid #5a4a33',
            borderRadius: '4px', color: '#8a7a55', fontSize: '8px', fontFamily: F,
          }}
        >
          LEAVE
        </button>
      </div>
    );
  }

  if (!shrine) return null;

  // Another shrine was already purchased — only desecration allowed
  if (desecrationOnly) {
    const breakOpt = shrine.options.find(o => o.id === 'break')!;
    const colors = OPTION_COLORS.break;
    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(25,20,10,0.97) 0%, rgba(12,10,5,0.97) 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 30, padding: '16px',
      }}>
        <div style={{ fontSize: '22px', marginBottom: '2px' }}>{shrine.icon}</div>
        <div style={{ color: '#ffd700', fontSize: '10px', fontFamily: '"Press Start 2P", monospace', marginBottom: '4px', textAlign: 'center' }}>
          {shrine.name}
        </div>
        <div style={{ color: '#8a5a33', fontSize: '7px', fontFamily: '"Press Start 2P", monospace', textAlign: 'center', maxWidth: '280px', lineHeight: '1.6', marginBottom: '12px', fontStyle: 'italic' }}>
          Your allegiance is already sworn. This shrine's gift is beyond your reach.
        </div>
        <button
          onClick={() => onPledge(`${shrineUnitType}:${breakOpt.id}`, undefined)}
          style={{
            padding: '7px 10px', cursor: 'pointer', width: '100%', maxWidth: '340px',
            background: `linear-gradient(180deg, ${colors.bg} 0%, rgba(10,8,4,0.9) 100%)`,
            border: `1.5px solid ${colors.border}`, borderRadius: '6px',
            display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left',
          }}
        >
          <span style={{ color: colors.text, fontSize: '7px', fontFamily: '"Press Start 2P", monospace', fontWeight: 'bold' }}>{breakOpt.label}</span>
          <span style={{ color: '#bbb', fontSize: '6px', fontFamily: '"Press Start 2P", monospace', lineHeight: '1.5' }}>{breakOpt.description}</span>
        </button>
        <button
          onClick={onLeave}
          style={{
            marginTop: '8px', padding: '4px 16px', cursor: 'pointer',
            background: 'rgba(60,50,30,0.3)', border: '1px solid #5a4a33',
            borderRadius: '4px', color: '#8a7a55', fontSize: '7px', fontFamily: '"Press Start 2P", monospace',
          }}
        >
          LEAVE SHRINE
        </button>
      </div>
    );
  }

  const canAfford = (opt: ShrineOption) => {
    if (!opt.cost) return true;
    if (opt.cost.type === 'gold') return gold >= opt.cost.amount;
    return gems >= opt.cost.amount;
  };

  const handleClick = (opt: ShrineOption) => {
    if (!canAfford(opt)) return;
    onPledge(`${shrineUnitType}:${opt.id}`, opt.cost);
  };

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(135deg, rgba(25,20,10,0.97) 0%, rgba(12,10,5,0.97) 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 30, padding: '8px',
    }}>
      {/* Shrine icon + name */}
      <div style={{ fontSize: '22px', marginBottom: '2px' }}>{shrine.icon}</div>
      <div style={{
        color: '#ffd700', fontSize: '10px', fontFamily: F,
        textShadow: '0 0 12px rgba(255,215,0,0.4)',
        marginBottom: '4px', textAlign: 'center',
      }}>
        {shrine.name}
      </div>

      {/* Lore */}
      <div style={{
        color: '#c4a862', fontSize: '6.5px', fontFamily: F,
        textAlign: 'center', maxWidth: '320px', lineHeight: '1.6',
        marginBottom: '10px', opacity: 0.8, fontStyle: 'italic',
      }}>
        {shrine.lore}
      </div>

      {/* 3 options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%', maxWidth: '340px' }}>
        {shrine.options.map(opt => {
          const colors = OPTION_COLORS[opt.id] || OPTION_COLORS.small;
          const affordable = canAfford(opt);
          const costLabel = opt.cost
            ? `${opt.cost.amount} ${opt.cost.type === 'gold' ? 'g' : '💎'}`
            : null;

          return (
            <button
              key={opt.id}
              onClick={() => handleClick(opt)}
              disabled={!affordable}
              style={{
                padding: '7px 10px', cursor: affordable ? 'pointer' : 'not-allowed',
                background: `linear-gradient(180deg, ${colors.bg} 0%, rgba(10,8,4,0.9) 100%)`,
                border: `1.5px solid ${affordable ? colors.border : '#444'}`,
                borderRadius: '6px',
                display: 'flex', flexDirection: 'column', gap: '2px',
                opacity: affordable ? 1 : 0.45,
                transition: 'border-color 0.15s, box-shadow 0.15s',
                textAlign: 'left',
              }}
              onMouseEnter={e => { if (affordable) { e.currentTarget.style.borderColor = colors.text; e.currentTarget.style.boxShadow = `0 0 10px ${colors.hover}`; } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = affordable ? colors.border : '#444'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Option header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={{
                  color: affordable ? colors.text : '#666',
                  fontSize: '7px', fontFamily: F, fontWeight: 'bold',
                }}>
                  {opt.label}
                </span>
                {costLabel && (
                  <span style={{
                    color: affordable ? (opt.cost!.type === 'gold' ? '#ffd700' : '#cc88ff') : '#666',
                    fontSize: '6px', fontFamily: F,
                  }}>
                    {costLabel}
                  </span>
                )}
              </div>
              {/* Description */}
              <div style={{
                color: affordable ? '#bbb' : '#555',
                fontSize: '6px', fontFamily: F, lineHeight: '1.5',
              }}>
                {opt.description}
              </div>
            </button>
          );
        })}
      </div>

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
        LEAVE SHRINE
      </button>
    </div>
  );
}
