import { COLORS } from '../../constants';

interface Props {
  highestZone: number;
  currentTrack: string;
  allTracks: { menu: string[]; death: string[]; boss: string[]; forest: string[]; cave: string[]; nordic: string[]; volcanic: string[] };
  onSelectTrack: (path: string) => void;
  blockedTracks: string[];
  onToggleBlock: (path: string) => void;
  onClose: () => void;
  activeBiome?: string;
  onToggleBiomeMute?: (tracks: string[]) => void;
}

/** Extract display name from path: "music/Forest/Forest Canopy.mp3" -> "Forest Canopy" */
function displayName(path: string): string {
  try {
    const decoded = decodeURIComponent(path);
    const filename = decoded.split('/').pop() ?? decoded;
    return filename.replace(/\.mp3$/i, '');
  } catch {
    const filename = path.split('/').pop() ?? path;
    return filename.replace(/\.mp3$/i, '').replace(/%20/g, ' ').replace(/%27/g, "'").replace(/%26/g, '&');
  }
}

const CATEGORIES: { key: keyof Props['allTracks']; label: string; icon: string; minZone: number }[] = [
  { key: 'menu', label: 'Menu', icon: '\u{1F3E0}', minZone: -1 },
  { key: 'death', label: 'Death Screen', icon: '\u{1F480}', minZone: -1 },
  { key: 'forest', label: 'Forest', icon: '\u{1F332}', minZone: -1 },
  { key: 'cave', label: 'Cave', icon: '\u{1FAA8}', minZone: 2 },
  { key: 'nordic', label: 'Nordic', icon: '\u{2744}\uFE0F', minZone: 4 },
  { key: 'volcanic', label: 'Volcanic', icon: '\u{1F30B}', minZone: 6 },
  { key: 'boss', label: 'Boss', icon: '\u{2694}\uFE0F', minZone: -1 },
];

export function TrackSelector({ highestZone, currentTrack, allTracks, onSelectTrack, blockedTracks, onToggleBlock, onClose, activeBiome, onToggleBiomeMute }: Props) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(135deg, rgba(30,12,50,0.98) 0%, rgba(15,8,25,0.98) 100%)',
      borderRadius: '8px', zIndex: 20, display: 'flex', flexDirection: 'column',
      padding: '12px', overflow: 'hidden', border: '2px solid #8a4adf',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ color: COLORS.gold, fontSize: '12px' }}>{'\u{1F3B5}'} TRACK SELECTOR</span>
        <button onClick={onClose} style={{
          padding: '3px 10px', fontSize: '10px', fontFamily: 'inherit',
          background: 'rgba(20,15,30,0.85)', color: '#aaa', border: '1px solid rgba(138,74,223,0.3)', borderRadius: '3px', cursor: 'pointer',
        }}>CLOSE</button>
      </div>

      {/* Track list */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {CATEGORIES.map(cat => {
          const unlocked = highestZone >= cat.minZone;
          const tracks = allTracks[cat.key];
          const isBiomeCat = cat.key === 'forest' || cat.key === 'cave' || cat.key === 'nordic' || cat.key === 'volcanic';
          const isActive = !isBiomeCat || cat.key === activeBiome;

          const allMuted = unlocked && isBiomeCat && tracks.every(t => blockedTracks.includes(t));

          return (
            <div key={cat.key}>
              {/* Category header */}
              <div style={{
                fontSize: '9px', color: unlocked ? (isActive ? COLORS.gold : '#666') : '#555',
                marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '1px',
                display: 'flex', alignItems: 'center', gap: '4px',
                borderBottom: '1px solid rgba(138,74,223,0.2)', paddingBottom: '3px',
              }}>
                {cat.icon} {cat.label} {!unlocked && '\u{1F512}'}
                {unlocked && isBiomeCat && (
                  <span
                    onClick={() => onToggleBiomeMute?.(tracks)}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    title={allMuted ? 'Unmute all tracks' : 'Mute all tracks'}
                  >
                    {allMuted ? '\u{1F507}' : isActive ? '\u{1F50A}' : '\u{1F509}'}
                  </span>
                )}
              </div>

              {/* Tracks */}
              {tracks.map((path, i) => {
                const name = displayName(path);
                const isPlaying = currentTrack === name;
                const isBlocked = blockedTracks.includes(path);

                if (!unlocked) {
                  return (
                    <div key={i} style={{
                      padding: '4px 8px', fontSize: '10px', color: '#444',
                      borderRadius: '3px', background: 'rgba(20,15,35,0.4)',
                      marginBottom: '2px',
                    }}>
                      ???
                    </div>
                  );
                }

                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '4px 8px', fontSize: '10px',
                      borderRadius: '3px',
                      background: isPlaying ? 'rgba(255,215,0,0.1)' : 'rgba(20,15,35,0.4)',
                      border: `1px solid ${isPlaying ? COLORS.gold : 'transparent'}`,
                      marginBottom: '2px',
                      opacity: isBlocked ? 0.4 : !isActive ? 0.35 : 1,
                    }}
                  >
                    {/* Track name — click to play */}
                    <div
                      onClick={() => onSelectTrack(path)}
                      style={{
                        flex: 1, cursor: 'pointer',
                        color: isPlaying ? COLORS.gold : isBlocked ? '#666' : '#ccc',
                        textDecoration: isBlocked ? 'line-through' : 'none',
                      }}
                    >
                      {isPlaying ? '\u{25B6}\uFE0F ' : ''}{name}
                    </div>
                    {/* Cross-off toggle */}
                    <div
                      onClick={(e) => { e.stopPropagation(); onToggleBlock(path); }}
                      style={{
                        cursor: 'pointer', fontSize: '9px', padding: '1px 4px',
                        borderRadius: '2px', userSelect: 'none',
                        color: isBlocked ? '#ff6666' : '#555',
                      }}
                      title={isBlocked ? 'Unblock track' : 'Block from shuffle'}
                    >
                      {isBlocked ? '\u{2716}' : '\u{2014}'}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
