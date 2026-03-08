import { COLORS } from '../../constants';
import type { GameState } from '../../types';

interface Props {
  game: GameState;
  onFireball: () => void;
  onRecall: () => void;
}

export function GameControls({ game, onFireball, onRecall }: Props) {
  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '12px 20px', fontSize: '15px', fontFamily: 'inherit',
    borderRadius: '8px', cursor: active ? 'pointer' : 'not-allowed',
  });

  const fireballReady = (game.hero?.fireballCooldown || 0) >= 600;
  const recallReady = (game.hero?.recallCooldown || 0) >= 4800;

  const hasFireball = (game.runUpgrades?.hero || 0) >= 6;
  const hasRecall = (game.runUpgrades?.hero || 0) >= 15;

  if (!hasFireball && !hasRecall) return null;

  return (
    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
      {hasFireball && (
        <button onClick={onFireball} disabled={!fireballReady} style={{ ...btnStyle(fireballReady), background: fireballReady ? '#ff4400' : '#555', color: fireballReady ? '#fff' : '#888', border: '3px solid ' + (fireballReady ? '#cc3300' : '#444') }}>
          🔥 {fireballReady ? 'FIRE' : Math.ceil((600 - (game.hero?.fireballCooldown || 0)) / 60) + 's'}
        </button>
      )}
      {hasRecall && (
        <button onClick={onRecall} disabled={!recallReady} style={{ ...btnStyle(recallReady), background: recallReady ? '#4488ff' : '#555', color: recallReady ? '#fff' : '#888', border: '3px solid ' + (recallReady ? '#2266dd' : '#444') }}>
          🌀 {recallReady ? 'RECALL' : Math.ceil((4800 - (game.hero?.recallCooldown || 0)) / 60) + 's'}
        </button>
      )}
    </div>
  );
}
