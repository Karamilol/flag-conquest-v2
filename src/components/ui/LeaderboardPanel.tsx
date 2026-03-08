import { useState, useEffect } from 'react';
import { COLORS } from '../../constants';
import { fetchLeaderboard, fetchDailyLeaderboard, type LeaderboardRow } from '../../firebase';

type Tab = 'daily' | 'allTime';

interface Props {
  onClose: () => void;
  highlightName?: string;
}

export function LeaderboardPanel({ onClose, highlightName }: Props) {
  const [tab, setTab] = useState<Tab>('allTime');
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const fetcher = tab === 'daily' ? fetchDailyLeaderboard : fetchLeaderboard;
    fetcher().then(data => {
      if (cancelled) return;
      setRows(data);
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setError(true);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [tab]);

  const tabStyle = (t: Tab) => ({
    flex: 1,
    padding: '5px 0',
    fontSize: '10px',
    fontFamily: 'inherit' as const,
    background: tab === t ? 'rgba(138,74,223,0.25)' : 'rgba(20,15,30,0.6)',
    color: tab === t ? COLORS.gold : '#777',
    border: tab === t ? '1px solid rgba(138,74,223,0.5)' : '1px solid rgba(138,74,223,0.15)',
    borderRadius: '4px',
    cursor: 'pointer' as const,
    fontWeight: tab === t ? 'bold' as const : 'normal' as const,
  });

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(135deg, rgba(30,12,50,0.98) 0%, rgba(15,8,25,0.98) 100%)',
      borderRadius: '8px', zIndex: 20, display: 'flex', flexDirection: 'column',
      padding: '10px', overflow: 'hidden', border: '2px solid #8a4adf',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '6px',
      }}>
        <span style={{ color: COLORS.gold, fontSize: '12px', fontWeight: 'bold' }}>
          LEADERBOARD
        </span>
        <button onClick={onClose} style={{
          padding: '3px 10px', fontSize: '10px', fontFamily: 'inherit',
          background: 'rgba(20,15,30,0.85)', color: '#aaa', border: '1px solid rgba(138,74,223,0.3)', borderRadius: '3px',
          cursor: 'pointer',
        }}>CLOSE</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
        <button onClick={() => setTab('allTime')} style={tabStyle('allTime')}>ALL TIME</button>
        <button onClick={() => setTab('daily')} style={tabStyle('daily')}>DAILY</button>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'flex', gap: '4px', padding: '2px 4px', fontSize: '8px',
        color: COLORS.textDim, borderBottom: '1px solid rgba(138,74,223,0.25)', marginBottom: '2px',
      }}>
        <span style={{ width: '30px', textAlign: 'center' }}>RANK</span>
        <span style={{ flex: 1, minWidth: 0 }}>PLAYER</span>
        <span style={{ width: '60px', textAlign: 'right' }}>FLAGS</span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {loading && (
          <div style={{ color: COLORS.textDim, fontSize: '11px', textAlign: 'center', marginTop: '40px' }}>
            Loading...
          </div>
        )}
        {error && (
          <div style={{ color: '#ff6666', fontSize: '11px', textAlign: 'center', marginTop: '40px' }}>
            Could not load leaderboard.
          </div>
        )}
        {!loading && !error && rows.length === 0 && (
          <div style={{ color: COLORS.textDim, fontSize: '11px', textAlign: 'center', marginTop: '40px' }}>
            {tab === 'daily' ? 'No entries yet today. Play a round!' : 'No entries yet. Be the first!'}
          </div>
        )}
        {rows.map(row => {
          const isMe = highlightName && row.playerName === highlightName;
          return (
            <div key={row.id} style={{
              display: 'flex', gap: '4px', alignItems: 'center',
              padding: '3px 4px', fontSize: '10px',
              background: isMe ? 'rgba(74, 159, 255, 0.12)' : 'transparent',
              borderLeft: isMe ? '2px solid ' + COLORS.heroBlue : '2px solid transparent',
              borderRadius: '2px',
            }}>
              <span style={{
                width: '30px', textAlign: 'center',
                color: row.rank === 1 ? '#ffd700' : row.rank === 2 ? '#c0c0c0' : row.rank === 3 ? '#cd7f32' : COLORS.textDim,
                fontWeight: row.rank <= 3 ? 'bold' : 'normal',
              }}>
                #{row.rank}
              </span>
              <span style={{
                flex: 1, minWidth: 0, color: isMe ? COLORS.heroBlue : COLORS.text,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontWeight: isMe ? 'bold' : 'normal',
              }}>
                {row.playerName}
              </span>
              <span style={{ width: '60px', textAlign: 'right', color: COLORS.gold }}>
                {row.flagsCaptured} {'\u{1F6A9}'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
