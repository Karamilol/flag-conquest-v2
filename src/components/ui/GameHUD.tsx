import { useState, useEffect, useCallback, memo } from 'react';
import type { GameState, CameraMode, Artifact, UnitSlot } from '../../types';
import { DISPLAY_W, DISPLAY_H, UNIT_STATS } from '../../constants';
import { formatNumber } from '../../utils/helpers';
import { getSkillDef } from '../../skills';

interface GameHUDProps {
  gameRef: React.MutableRefObject<GameState>;
  frameRef: React.MutableRefObject<number>;
  cameraMode: CameraMode;
  onCycleCameraMode: () => void;
  onMovePrev: () => void;
  onMoveNext: () => void;
  onToggleHold: () => void;
  onOpenSettings: () => void;
  onOpenShop: () => void;
  onOpenAchievements: () => void;
  onOpenRelics: () => void;
  onTogglePlanted: () => void;
  musicTrack: string;
  musicPaused: boolean;
  onMusicNext: () => void;
  onMusicPrev: () => void;
  onMusicToggle: () => void;
}

interface SkillHUDData {
  id: string;
  icon: string;
  cooldown: number;
  maxCooldown: number;
  isPassive: boolean;
  buttonColor: string;
  buttonColorReady: string;
  isAuto: boolean;
}

interface HUDValues {
  zone: number;
  flagsCaptured: number;
  gold: number;
  frame: number;
  gameOver: boolean;
  armyHoldMode: boolean;
  planted: boolean;
  inDungeon: boolean;
  unitSlots: UnitSlot[];
  artifacts: Artifact[];
  skills: SkillHUDData[];
  challengeId: string | null;
  challengeComplete: boolean;
  heroHp: number;
  heroMaxHp: number;
}

function snapshotHUD(game: GameState): HUDValues {
  const skills: SkillHUDData[] = (game.heroSkills?.equippedSkills || []).map(id => {
    const def = getSkillDef(id);
    return {
      id,
      icon: def?.icon || '?',
      cooldown: game.heroSkills?.skillCooldowns[id] || 0,
      maxCooldown: def?.cooldownFrames || 0,
      isPassive: def?.type === 'passive' || def?.type === 'triggered',
      buttonColor: def?.buttonColor || '#333',
      buttonColorReady: def?.buttonColorReady || '#555',
      isAuto: (game.autoSkills || []).includes(id),
    };
  });

  return {
    zone: game.currentZone,
    flagsCaptured: game.flagsCaptured,
    gold: game.goldEarned,
    frame: game.frame,
    gameOver: game.gameOver,
    armyHoldMode: game.armyHoldMode || false,
    planted: game.hero.planted || false,
    inDungeon: game.inDungeon || false,
    unitSlots: game.unitSlots || [],
    artifacts: game.artifacts || [],
    skills,
    challengeId: game.challengeId || null,
    challengeComplete: game.challengeComplete || false,
    heroHp: game.hero.health,
    heroMaxHp: game.hero.maxHealth,
  };
}

const F = '"Press Start 2P", monospace';

// === Top HUD bar — zone info left, music + settings + camera right ===
const TopBar = memo(({ hud, cameraMode, onCycleCameraMode, onOpenSettings,
  musicTrack, musicPaused, onMusicNext, onMusicPrev, onMusicToggle,
}: {
  hud: HUDValues;
  cameraMode: CameraMode;
  onCycleCameraMode: () => void;
  onOpenSettings: () => void;
  musicTrack: string; musicPaused: boolean;
  onMusicNext: () => void; onMusicPrev: () => void; onMusicToggle: () => void;
}) => {
  const m = Math.floor(hud.frame / 3600);
  const s = Math.floor((hud.frame % 3600) / 60);
  const timer = `${m}:${s.toString().padStart(2, '0')}`;

  const camIcon = cameraMode === 'hero' ? '👁' : cameraMode === 'furthest' ? '⚔' : '✋';
  const camText = cameraMode === 'hero' ? 'HERO' : cameraMode === 'furthest' ? 'FRONT' : 'FREE';
  const camBg = cameraMode === 'manual' ? '#553300' : cameraMode === 'furthest' ? '#333355' : 'rgba(20,20,40,0.6)';
  const camBdr = cameraMode === 'manual' ? '#886600' : cameraMode === 'furthest' ? '#5555aa' : '#4a7adb';

  const musicBtnStyle: React.CSSProperties = {
    background: 'none', border: 'none', color: '#aaa',
    cursor: 'pointer', fontSize: 8, padding: '0 1px',
    fontFamily: F, lineHeight: 1,
  };
  const label = musicTrack.length > 16 ? musicTrack.slice(0, 15) + '…' : musicTrack;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%',
      background: 'linear-gradient(180deg, rgba(30,12,50,0.95), rgba(15,8,25,0.95))',
      borderBottom: '1px solid #8a4adf',
      padding: '3px 6px',
      fontFamily: F, color: '#aaccff',
      zIndex: 10,
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    }}>
      {/* Left: game info */}
      <div style={{ pointerEvents: 'none' }}>
        <div style={{ fontSize: 10, lineHeight: '14px' }}>
          ZONE: {hud.zone + 1} | FLAGS: {hud.flagsCaptured} | {timer}
        </div>
        <div style={{ fontSize: 10, color: '#ffd700', lineHeight: '14px' }}>
          GOLD: {formatNumber(hud.gold)}
        </div>
      </div>

      {/* Right: settings, camera, music */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        {/* Row 1: settings gear + camera mode */}
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <button onClick={onOpenSettings} style={{
            width: 20, height: 18, border: '1px solid #B8860B',
            background: 'rgba(20,20,40,0.6)', borderRadius: 3,
            color: '#aaa', fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0,
          }}>⚙</button>
          <button onClick={onCycleCameraMode} style={{
            height: 18, border: `1px solid ${camBdr}`,
            background: camBg, borderRadius: 3,
            color: '#fff', fontSize: 7, cursor: 'pointer',
            padding: '0 4px', fontFamily: F, whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 2,
          }}><span style={{ fontSize: 9 }}>{camIcon}</span> {camText}</button>
        </div>

        {/* Row 2: music controls */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 1,
          height: 14, borderRadius: 3,
          background: 'rgba(15,15,30,0.5)',
          border: '1px solid #4a4a6e',
          padding: '0 3px',
        }}>
          <button onClick={onMusicPrev} style={musicBtnStyle}>◀</button>
          <button onClick={onMusicToggle} style={{ ...musicBtnStyle, color: '#ffd700' }}>
            {musicPaused ? '▶' : '⏸'}
          </button>
          <button onClick={onMusicNext} style={musicBtnStyle}>▶</button>
          <span style={{
            fontSize: 6, color: '#888', fontFamily: F,
            marginLeft: 2, whiteSpace: 'nowrap', maxWidth: 100,
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{label || 'No track'}</span>
        </div>
      </div>
    </div>
  );
});

// === Right sidebar icon buttons ===
const SidebarIcons = memo(({
  onOpenShop, onOpenAchievements, onOpenRelics,
}: {
  onOpenShop: () => void;
  onOpenAchievements: () => void;
  onOpenRelics: () => void;
}) => {
  const iconStyle: React.CSSProperties = {
    width: 24, height: 24, borderRadius: 4,
    background: 'rgba(15,10,25,0.85)',
    border: '1px solid #6a4a9a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, cursor: 'pointer', padding: 0,
    lineHeight: 1,
  };

  return (
    <div style={{
      position: 'absolute', top: 52, right: 4,
      display: 'flex', flexDirection: 'column', gap: 3, zIndex: 10,
    }}>
      <button onClick={onOpenShop} style={iconStyle} title="Backpack">🎒</button>
      <button onClick={onOpenRelics} style={iconStyle} title="Relics">🏺</button>
      <button onClick={onOpenAchievements} style={iconStyle} title="Achievements">🏆</button>
    </div>
  );
});

// === Artifact row ===
const ArtifactRow = memo(({ artifacts }: { artifacts: Artifact[] }) => {
  if (artifacts.length === 0) return null;
  return (
    <div style={{
      position: 'absolute', top: 40, left: 6,
      display: 'flex', gap: 2, zIndex: 10,
      pointerEvents: 'none',
    }}>
      {artifacts.map((a, i) => (
        <div key={i} style={{
          width: 20, height: 20, borderRadius: 3,
          background: a.rarity === 'legendary' ? '#2a1a10' : a.rarity === 'rare' ? '#1a1a2e' : '#1e1e2e',
          border: `1px solid ${a.rarity === 'legendary' ? '#ffd700' : a.rarity === 'rare' ? '#6688cc' : '#555'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, opacity: 0.9,
        }}>{a.icon}</div>
      ))}
    </div>
  );
});

// === Army unit roster ===
const ArmyRoster = memo(({ unitSlots }: { unitSlots: UnitSlot[] }) => {
  if (unitSlots.length === 0) return null;
  return (
    <div style={{
      position: 'absolute', top: 64, left: 5,
      display: 'flex', flexWrap: 'wrap', width: 34, gap: 2, zIndex: 10,
      pointerEvents: 'none',
    }}>
      {unitSlots.map((u, i) => {
        const stats = UNIT_STATS[u.type as keyof typeof UNIT_STATS] as any;
        const color = stats?.color || '#888';
        const alive = u.alive !== false;
        return (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: 2,
            background: alive ? color : '#333',
            border: `1px solid ${alive ? '#fff' : '#555'}`,
            opacity: alive ? 0.9 : 0.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 7, color: color, fontWeight: 'bold',
            fontFamily: F,
          }}>
            {!alive && u.respawnTimer > 0 ? Math.ceil(u.respawnTimer / 60) : ''}
          </div>
        );
      })}
    </div>
  );
});

// === Active skill buttons ===
const SkillButtons = memo(({
  skills, gameRef,
}: {
  skills: SkillHUDData[];
  gameRef: React.MutableRefObject<GameState>;
}) => {
  const activeSkills = skills.filter(s => !s.isPassive);
  const passiveSkills = skills.filter(s => s.isPassive);

  if (activeSkills.length === 0 && passiveSkills.length === 0) return null;

  const h = 28;
  const btnW = 28;
  const centerX = DISPLAY_W / 2;
  const arrowBlockW = 130;

  return (
    <>
      {activeSkills.map((s, i) => {
        const ready = s.cooldown >= s.maxCooldown;
        const cdSec = ready ? 0 : Math.ceil((s.maxCooldown - s.cooldown) / 60);
        const x = centerX - arrowBlockW / 2 - (i + 1) * (btnW + 3);

        return (
          <button
            key={s.id}
            onClick={() => {
              const g = gameRef.current;
              if (g && !g.gameOver) {
                g.pendingSkillUses = [...(g.pendingSkillUses || []), s.id];
              }
            }}
            style={{
              position: 'absolute',
              left: x, bottom: 4,
              width: btnW, height: h,
              borderRadius: 4,
              background: ready ? s.buttonColor : '#333',
              border: `1px solid ${ready ? s.buttonColorReady : '#555'}`,
              color: '#fff', cursor: 'pointer',
              fontFamily: F, padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column',
              fontSize: 13,
              opacity: ready ? 1 : 0.7,
              zIndex: 10,
              boxShadow: s.isAuto ? '0 0 4px #00ffaa' : 'none',
            }}
          >
            <span>{s.icon}</span>
            {!ready && (
              <span style={{
                fontSize: 6, position: 'absolute', bottom: 1,
                color: '#ccc',
              }}>{cdSec}s</span>
            )}
          </button>
        );
      })}

      {passiveSkills.map((s, i) => {
        const x = centerX + arrowBlockW / 2 + 3 + i * (btnW + 3);
        return (
          <div
            key={s.id}
            style={{
              position: 'absolute',
              left: x, bottom: 4,
              width: btnW, height: h,
              borderRadius: 4,
              background: 'rgba(42,42,78,0.8)',
              border: '1px solid #ffd700',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13,
              opacity: 0.85,
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            {s.icon}
          </div>
        );
      })}
    </>
  );
});

// === Bottom controls bar ===
const BottomBar = memo(({
  armyHoldMode, planted, inDungeon,
  onMovePrev, onMoveNext, onToggleHold, onTogglePlanted,
}: {
  armyHoldMode: boolean; planted: boolean; inDungeon: boolean;
  onMovePrev: () => void; onMoveNext: () => void;
  onToggleHold: () => void; onTogglePlanted: () => void;
}) => {
  const h = 28;
  const base: React.CSSProperties = {
    height: h, border: '1px solid #4a4a6e',
    background: '#2a2a4e', borderRadius: 3,
    color: '#fff', cursor: 'pointer',
    fontFamily: F, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    padding: 0,
  };
  const pBg = planted ? 'rgba(180,140,30,0.5)' : '#2a2a4e';
  const pBdr = planted ? '#dda520' : '#4a4a6e';

  return (
    <div style={{
      position: 'absolute', bottom: 4, left: 0, width: '100%',
      display: 'flex', justifyContent: 'center', gap: 3,
      zIndex: 10,
    }}>
      <button onClick={onMovePrev} style={{
        ...base, width: 30, fontSize: 13,
        background: pBg, borderColor: pBdr,
      }}>◀</button>

      <button onClick={onTogglePlanted} style={{
        ...base, width: 50, fontSize: 7,
        background: pBg, borderColor: pBdr,
      }}>{planted ? '🌿PLANT' : '🏃MOVE'}</button>

      {!inDungeon && (
        <button onClick={onToggleHold} style={{
          ...base, width: 60, fontSize: 8,
          background: armyHoldMode ? 'rgba(160,50,50,0.85)' : 'rgba(50,110,50,0.8)',
          borderColor: armyHoldMode ? '#ff6666' : '#66cc66',
        }}>{armyHoldMode ? '🛡️Defend' : '⚔ Attack'}</button>
      )}

      <button onClick={onMoveNext} style={{
        ...base, width: 30, fontSize: 13,
        background: pBg, borderColor: pBdr,
      }}>▶</button>
    </div>
  );
});

// === Main HUD ===
export default function GameHUD(props: GameHUDProps) {
  const { gameRef, cameraMode, onCycleCameraMode, onMovePrev, onMoveNext,
    onToggleHold, onOpenSettings, onOpenShop, onOpenAchievements, onOpenRelics, onTogglePlanted,
    musicTrack, musicPaused, onMusicNext, onMusicPrev, onMusicToggle } = props;

  const [hud, setHud] = useState<HUDValues>(() => snapshotHUD(gameRef.current));

  useEffect(() => {
    const iv = setInterval(() => {
      const g = gameRef.current;
      if (g) setHud(snapshotHUD(g));
    }, 100);
    return () => clearInterval(iv);
  }, [gameRef]);

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0,
      width: DISPLAY_W, height: DISPLAY_H,
      pointerEvents: 'none',
      zIndex: 5,
      transform: 'translateZ(0)',
    }}>
      <div style={{ pointerEvents: 'auto' }}>
        <TopBar
          hud={hud}
          cameraMode={cameraMode}
          onCycleCameraMode={onCycleCameraMode}
          onOpenSettings={onOpenSettings}
          musicTrack={musicTrack}
          musicPaused={musicPaused}
          onMusicNext={onMusicNext}
          onMusicPrev={onMusicPrev}
          onMusicToggle={onMusicToggle}
        />
      </div>

      <div style={{ pointerEvents: 'auto' }}>
        <SidebarIcons
          onOpenShop={onOpenShop}
          onOpenAchievements={onOpenAchievements}
          onOpenRelics={onOpenRelics}
        />
      </div>

      <ArtifactRow artifacts={hud.artifacts} />
      <ArmyRoster unitSlots={hud.unitSlots} />

      <div style={{ pointerEvents: 'auto' }}>
        <SkillButtons skills={hud.skills} gameRef={gameRef} />
      </div>

      <div style={{ pointerEvents: 'auto' }}>
        <BottomBar
          armyHoldMode={hud.armyHoldMode}
          planted={hud.planted}
          inDungeon={hud.inDungeon}
          onMovePrev={onMovePrev}
          onMoveNext={onMoveNext}
          onToggleHold={onToggleHold}
          onTogglePlanted={onTogglePlanted}
        />
      </div>
    </div>
  );
}
