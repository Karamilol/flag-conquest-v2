import { useState, useEffect, useCallback, useRef, memo } from 'react';
import type { GameState, CameraMode, Artifact, UnitSlot } from '../../types';
import type { KeyBindings } from '../../keybindings';
import { displayKey } from '../../keybindings';
import { DISPLAY_W, DISPLAY_H, UNIT_STATS } from '../../constants';
import { formatNumber } from '../../utils/helpers';
import { SpriteIcon } from '../sprites/SpriteIcon';
import { getSkillDef } from '../../skills';
import { HealthPotionIconHTML } from '../sprites/HealthPotionIcon';
import { MapIconHTML } from '../sprites/MapIcon';
import { BackpackIconHTML, RelicIconHTML, TrophyIconHTML } from '../sprites/GameIcons';
import { getModifierDef, getCurseDef } from '../../modifiers';

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
  onOpenMap: () => void;
  hasMap: boolean;
  musicTrack: string;
  musicPaused: boolean;
  onMusicNext: () => void;
  onMusicPrev: () => void;
  onMusicToggle: () => void;
  onMusicClick?: () => void;
  musicClicks?: number;
  onOpenTrackSelector?: () => void;
  keybindings: KeyBindings;
  onUseConsumable?: (id: import('../../types').ConsumableId) => void;
  tutorialHighlightForward?: boolean;
  tutorialHighlightBack?: boolean;
  gems?: number;
}

interface SkillHUDData {
  id: string;
  icon: string;
  name: string;
  desc: string;
  cooldown: number;
  maxCooldown: number;
  isPassive: boolean;
  buttonColor: string;
  buttonColorReady: string;
  isAuto: boolean;
  range?: number;
}

interface TooltipData {
  text: string;
  x: number;
  y: number;
}

interface HUDValues {
  zone: number;
  flagsCaptured: number;
  gold: number;
  frame: number;
  gameOver: boolean;
  armyHoldMode: boolean;
  inDungeon: boolean;
  unitSlots: UnitSlot[];
  artifacts: Artifact[];
  skills: SkillHUDData[];
  challengeId: string | null;
  challengeComplete: boolean;
  heroHp: number;
  heroMaxHp: number;
  potionCount: number;
  eliteVariant: string | null;
  eliteTimeLeft: number; // frames remaining
  activeModifiers: string[];
  activeCurse: string | null;
  gemsThisRun: number;
}

function snapshotHUD(game: GameState): HUDValues {
  const skills: SkillHUDData[] = (game.heroSkills?.equippedSkills || []).map(id => {
    const def = getSkillDef(id);
    return {
      id,
      icon: def?.icon || '?',
      name: def?.name || id,
      desc: def?.desc || '',
      cooldown: game.heroSkills?.skillCooldowns[id] || 0,
      maxCooldown: def?.cooldownFrames || 0,
      isPassive: def?.type === 'passive' || def?.type === 'triggered',
      buttonColor: def?.buttonColor || '#333',
      buttonColorReady: def?.buttonColorReady || '#555',
      isAuto: (game.autoSkills || []).includes(id),
      range: def?.range,
    };
  });

  return {
    zone: game.currentZone,
    flagsCaptured: game.flagsCaptured,
    gold: game.goldEarned,
    frame: game.frame,
    gameOver: game.gameOver,
    armyHoldMode: game.armyHoldMode || false,
    inDungeon: game.inDungeon || false,
    unitSlots: game.unitSlots || [],
    artifacts: game.artifacts || [],
    skills,
    challengeId: game.challengeId || null,
    challengeComplete: game.challengeComplete || false,
    heroHp: game.hero.health,
    heroMaxHp: game.hero.maxHealth,
    potionCount: game.backpack?.healingPotion || 0,
    eliteVariant: game.activeEliteVariant || null,
    eliteTimeLeft: game.activeEliteId != null
      ? Math.max(0, 10800 - (game.frame - (game.eliteLastSpawnFrame || 0)))
      : 0,
    activeModifiers: game.activeModifiers || [],
    activeCurse: game.activeCurse || null,
    gemsThisRun: game.gemsThisRun || 0,
  };
}

const F = '"Press Start 2P", monospace';

// === Top HUD bar — zone info left, music + settings + camera right ===
const TopBar = memo(({ hud, cameraMode, onCycleCameraMode, onOpenSettings,
  musicTrack, musicPaused, onMusicNext, onMusicPrev, onMusicToggle,
  onMusicClick, musicClicks, onOpenTrackSelector,
  showTooltip, hideTooltip, gems,
}: {
  hud: HUDValues;
  cameraMode: CameraMode;
  onCycleCameraMode: () => void;
  onOpenSettings: () => void;
  musicTrack: string; musicPaused: boolean;
  onMusicNext: () => void; onMusicPrev: () => void; onMusicToggle: () => void;
  onMusicClick?: () => void; musicClicks?: number; onOpenTrackSelector?: () => void;
  showTooltip: (text: string, x: number, y: number) => void;
  hideTooltip: () => void;
  gems?: number;
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
        {(() => {
          const z = hud.zone;
          const hasFracture = hud.activeModifiers.length > 0 || !!hud.activeCurse;
          const posMods = hud.activeModifiers.filter(id => getModifierDef(id)?.category === 'positive');
          const negMods = hud.activeModifiers.filter(id => getModifierDef(id)?.category === 'negative');
          const curseDef = hud.activeCurse ? getCurseDef(hud.activeCurse) : null;

          const buildTooltip = () => {
            const enemyScale = Math.pow(1.3, z * Math.pow(0.98, z));
            const passiveMult = 1 + z * 0.05;
            const killMult = 1 + z * (z - 1) * 5;
            const lines: string[] = [
              `── Zone ${z + 1} ──`,
              `Enemy stats: x${enemyScale.toFixed(2)}`,
              `Passive income: x${passiveMult.toFixed(2)}`,
              `Kill gold: x${killMult.toFixed(0)}`,
            ];
            if (hasFracture) {
              lines.push('', '── Fracture Modifiers ──');
              for (const id of posMods) { const d = getModifierDef(id); if (d) lines.push(`${d.icon} ${d.name}: ${d.description}`); }
              for (const id of negMods) { const d = getModifierDef(id); if (d) lines.push(`${d.icon} ${d.name}: ${d.description}`); }
              if (curseDef) {
                lines.push('', `⛧ CURSE: ${curseDef.name}`);
                lines.push(`  ${curseDef.downside}`);
                lines.push(`  ✨ ${curseDef.reward}`);
              }
            }
            return lines.join('\n');
          };

          return (
            <>
              <div style={{ fontSize: 10, lineHeight: '14px' }}>
                <span
                  style={{ pointerEvents: 'auto', cursor: 'pointer', color: '#cc99ff', background: 'rgba(138,74,223,0.15)', padding: '0 3px', borderRadius: 2 }}
                  onPointerEnter={() => showTooltip(buildTooltip(), 6, 40)}
                  onPointerLeave={hideTooltip}
                >ZONE: {z + 1}</span> | FLAGS: {hud.flagsCaptured} | {timer}
                {hasFracture && (
                  <span style={{ marginLeft: 4 }}>
                    {posMods.map(id => {
                      const d = getModifierDef(id);
                      return d ? <span key={id} style={{ fontSize: 9 }}>{d.icon}</span> : null;
                    })}
                    {negMods.map(id => {
                      const d = getModifierDef(id);
                      return d ? <span key={id} style={{ fontSize: 9 }}>{d.icon}</span> : null;
                    })}
                    {curseDef && <span style={{ fontSize: 9, color: '#ff2244' }}>⛧</span>}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10, color: '#ffd700', lineHeight: '14px' }}>
                GOLD: {formatNumber(hud.gold)}
                <span style={{ marginLeft: 8, color: '#cc88ff' }}>💎 {gems ?? 0}</span>
                {hud.gemsThisRun > 0 && (
                  <span style={{ marginLeft: 4, color: '#88cc88' }}>(+{hud.gemsThisRun})</span>
                )}
              </div>
            </>
          );
        })()}
      </div>

      {/* Center: elite timer */}
      {hud.eliteVariant && hud.eliteTimeLeft > 0 && (() => {
        const sec = Math.ceil(hud.eliteTimeLeft / 60);
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        const urgent = sec <= 30;
        return (
          <div style={{
            position: 'absolute', top: 3, left: '50%', transform: 'translateX(-50%)',
            background: urgent ? 'rgba(120,20,20,0.9)' : 'rgba(60,20,80,0.9)',
            border: `1px solid ${urgent ? '#ff4444' : '#aa66dd'}`,
            borderRadius: 4, padding: '2px 8px',
            fontSize: 9, textAlign: 'center', pointerEvents: 'none',
            color: urgent ? '#ff6666' : '#ddaaff',
            animation: urgent ? 'pulse 1s infinite' : undefined,
          }}>
            <div style={{ fontSize: 8, color: urgent ? '#ff8888' : '#bb88dd', marginBottom: 1 }}>
              ELITE: {hud.eliteVariant.toUpperCase()}
            </div>
            <div>{m}:{s.toString().padStart(2, '0')}</div>
          </div>
        );
      })()}

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
            marginLeft: 2, whiteSpace: 'nowrap', width: 80,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: 'inline-block', textAlign: 'left',
          }}>{label || 'No track'}</span>
          <button onClick={() => { onMusicClick?.(); if ((musicClicks ?? 0) >= 4) onOpenTrackSelector?.(); }} style={{
            ...musicBtnStyle, fontSize: 9, marginLeft: 2,
            color: (musicClicks ?? 0) >= 5 ? '#ffd700' : '#666',
          }} title={(musicClicks ?? 0) >= 5 ? 'Track selector' : `Click ${5 - (musicClicks ?? 0)} more times`}>🎵</button>
        </div>
      </div>
    </div>
  );
});

// === Right sidebar icon buttons ===
const SidebarIcons = memo(({
  onOpenShop, onOpenAchievements, onOpenRelics, onOpenMap, hasMap,
}: {
  onOpenShop: () => void;
  onOpenAchievements: () => void;
  onOpenRelics: () => void;
  onOpenMap: () => void;
  hasMap: boolean;
}) => {
  const iconStyle: React.CSSProperties = {
    width: 28, height: 28, borderRadius: 4,
    background: 'rgba(15,10,25,0.85)',
    border: '1px solid #6a4a9a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, cursor: 'pointer', padding: 0,
    lineHeight: 1,
  };

  return (
    <div style={{
      position: 'absolute', top: 52, right: 4,
      display: 'flex', flexDirection: 'column', gap: 3, zIndex: 10,
    }}>
      <button onClick={onOpenShop} style={iconStyle} title="Backpack"><BackpackIconHTML size={18} /></button>
      <button onClick={onOpenRelics} style={iconStyle} title="Relics"><RelicIconHTML size={18} /></button>
      <button onClick={onOpenAchievements} style={iconStyle} title="Achievements"><TrophyIconHTML size={18} /></button>
      {hasMap && (
        <button onClick={onOpenMap} style={{ ...iconStyle, borderColor: '#a855f7' }} title="Fractured Map"><MapIconHTML size={18} /></button>
      )}
      <button onClick={() => window.open('https://discord.gg/UXASDwwqKe', '_blank')} style={{ ...iconStyle, borderColor: '#5865F2' }} title="Join Discord">
        <svg width="16" height="12" viewBox="0 0 71 55" fill="#5865F2" xmlns="http://www.w3.org/2000/svg">
          <path d="M60.1 4.9A58.5 58.5 0 0045.4.5a.2.2 0 00-.2.1 40.8 40.8 0 00-1.8 3.7 54 54 0 00-16.2 0A37.3 37.3 0 0025.4.6a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.9a.2.2 0 00-.1.1C1.5 18.7-.9 32.2.3 45.5v.2a58.9 58.9 0 0017.7 9 .2.2 0 00.3-.1 42.1 42.1 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.7.2.2 0 01 0-.4l1.1-.9a.2.2 0 01.2 0 42 42 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.4 36.4 0 01-5.5 2.7.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1A58.7 58.7 0 0070.5 45.7v-.2c1.4-15-2.3-28-9.8-39.6a.2.2 0 00-.1-.1zM23.7 37.3c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.1 6.3 7-2.8 7-6.3 7zm23.2 0c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.1 6.3 7-2.8 7-6.3 7z"/>
        </svg>
      </button>
    </div>
  );
});

// === Artifact row ===
const ArtifactRow = memo(({ artifacts, showTooltip, moveTooltip, hideTooltip }: {
  artifacts: Artifact[];
  showTooltip: (text: string, x: number, y: number) => void;
  moveTooltip: (e: React.PointerEvent) => void;
  hideTooltip: () => void;
}) => {
  if (artifacts.length === 0) return null;
  return (
    <div style={{
      position: 'absolute', top: 44, left: 4,
      display: 'flex', gap: 2, zIndex: 10,
    }}>
      {artifacts.map((a, i) => (
        <div key={i}
          onPointerEnter={() => showTooltip(`${a.name}: ${a.desc}`, 22 + i * 22, 64)}
          onPointerMove={moveTooltip}
          onPointerLeave={hideTooltip}
          style={{
            width: 24, height: 24, borderRadius: 3,
            background: a.rarity === 'legendary' ? '#2a1a10' : a.rarity === 'rare' ? '#1a1a2e' : '#1e1e2e',
            border: `1px solid ${a.rarity === 'legendary' ? '#ffd700' : a.rarity === 'rare' ? '#6688cc' : '#555'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, opacity: 0.9, cursor: 'pointer',
          }}><SpriteIcon path={`artifacts/${a.id}`} size={17} fallback={a.icon} /></div>
      ))}
    </div>
  );
});

// === Army unit roster ===
const UNIT_TYPE_ORDER: Record<string, number> = { soldier: 0, archer: 1, halberd: 2, knight: 3, wizard: 4, conjurer: 5, cleric: 6, bombard: 7 };

const ArmyRoster = memo(({ unitSlots, showTooltip, moveTooltip, hideTooltip }: {
  unitSlots: UnitSlot[];
  showTooltip: (text: string, x: number, y: number) => void;
  moveTooltip: (e: React.PointerEvent) => void;
  hideTooltip: () => void;
}) => {
  const [sortMode, setSortMode] = useState<'order' | 'alpha' | 'type'>('order');
  if (unitSlots.length === 0) return null;

  const indexed = unitSlots.map((slot, i) => ({ slot, idx: i }));
  if (sortMode === 'alpha') indexed.sort((a, b) => a.slot.type.localeCompare(b.slot.type));
  else if (sortMode === 'type') indexed.sort((a, b) => (UNIT_TYPE_ORDER[a.slot.type] ?? 99) - (UNIT_TYPE_ORDER[b.slot.type] ?? 99));

  return (
    <div style={{
      position: 'absolute', top: 76, left: 5,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', zIndex: 10,
    }}>
      <div
        onClick={() => setSortMode(m => m === 'order' ? 'alpha' : m === 'alpha' ? 'type' : 'order')}
        style={{ fontSize: 6, color: '#888', cursor: 'pointer', userSelect: 'none', fontFamily: F, marginBottom: 2 }}
      >{sortMode === 'order' ? 'Order' : sortMode === 'alpha' ? 'A-Z' : 'Type'} ▼</div>
      <div style={{
        display: 'flex', flexWrap: 'wrap', width: 34, gap: 2,
        maxHeight: DISPLAY_H - 90 - 38, overflow: 'hidden',
      }}>
      {indexed.map(({ slot: u, idx }, vi) => {
        const stats = UNIT_STATS[u.type as keyof typeof UNIT_STATS] as any;
        const color = stats?.color || '#888';
        const alive = u.alive !== false;
        const respawnSec = alive ? 0 : Math.ceil(u.respawnTimer / 60);
        const row = Math.floor(vi / 2);
        const sy = 78 + row * 16;
        return (
          <div key={idx}
            onPointerEnter={() => showTooltip(
              `${stats?.name || u.type}${alive ? '' : ` (${respawnSec}s)`}`,
              40, sy
            )}
            onPointerMove={moveTooltip}
            onPointerLeave={hideTooltip}
            style={{
              width: 14, height: 14, borderRadius: 2,
              background: alive ? color : '#333',
              border: `1px solid ${alive ? '#fff' : '#555'}`,
              opacity: alive ? 0.9 : 0.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 7, color: color, fontWeight: 'bold',
              fontFamily: F, cursor: 'pointer',
            }}>
            {!alive && u.respawnTimer > 0 ? Math.ceil(u.respawnTimer / 60) : ''}
          </div>
        );
      })}
      </div>
    </div>
  );
});

// === Bottom controls bar (matches v1 layout) ===
// Layout: [potion] [active skills...] [◀] [defend/attack] [▶] [passive indicators...]
const BottomBar = memo(({
  armyHoldMode, inDungeon, skills, potionCount, gameRef, frameRef,
  onMovePrev, onMoveNext, onToggleHold, onUseConsumable,
  showTooltip, moveTooltip, hideTooltip, keybindings, tutorialHighlightForward, tutorialHighlightBack,
}: {
  armyHoldMode: boolean; inDungeon: boolean;
  skills: SkillHUDData[]; potionCount: number;
  gameRef: React.MutableRefObject<GameState>;
  frameRef: React.MutableRefObject<number>;
  onMovePrev: () => void; onMoveNext: () => void;
  onToggleHold: () => void;
  onUseConsumable?: (id: import('../../types').ConsumableId) => void;
  showTooltip: (text: string, x: number, y: number) => void;
  moveTooltip: (e: React.PointerEvent) => void;
  hideTooltip: () => void;
  keybindings: KeyBindings;
  tutorialHighlightForward?: boolean;
  tutorialHighlightBack?: boolean;
}) => {
  const h = 28;
  const btnW = 28;
  const base: React.CSSProperties = {
    height: h, border: '1px solid #4a4a6e',
    background: '#2a2a4e', borderRadius: 3,
    color: '#fff', cursor: 'pointer',
    fontFamily: F, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    padding: 0,
  };

  const activeSkills = skills.filter(s => !s.isPassive);
  const passiveSkills = skills.filter(s => s.isPassive);

  // Center block: [◀] [hold] [▶]
  const showHoldBtn = !inDungeon;
  const centerW = 30 + 3 + (showHoldBtn ? 60 + 3 : 0) + 30;
  const centerX = DISPLAY_W / 2;
  const leftArrowX = centerX - centerW / 2;
  const holdX = leftArrowX + 33;
  const rightArrowX = showHoldBtn ? holdX + 63 : leftArrowX + 33;

  // Active skills go left of center block
  // Potion goes left of active skills
  const skillStartX = leftArrowX - 3;

  return (
    <div style={{
      position: 'absolute', bottom: 4, left: 0, width: '100%',
      height: h, zIndex: 10,
    }}>
      {/* Healing potion */}
      {potionCount > 0 && (
        <button
          onClick={() => {
            if (onUseConsumable) onUseConsumable('healingPotion');
          }}
          onPointerEnter={(e) => {
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const parent = (e.currentTarget as HTMLElement).offsetParent as HTMLElement;
            const pr = parent?.getBoundingClientRect() || r;
            showTooltip(`Healing Potion (${potionCount})\nHeals hero for 60% of max HP`, r.left - pr.left + 14, DISPLAY_H - 62);
          }}
          onPointerMove={moveTooltip}
          onPointerLeave={hideTooltip}
          style={{
            ...base,
            position: 'absolute',
            left: skillStartX - (activeSkills.length + 1) * (btnW + 3),
            width: btnW,
            borderRadius: 4,
            background: 'rgba(180,40,40,0.7)',
            borderColor: '#ff6666',
          }}
        >
          <HealthPotionIconHTML size={18} />
          <span style={{
            position: 'absolute', bottom: 1, right: 2,
            fontSize: 7, color: '#fff',
          }}>{potionCount}</span>
          {keybindings.healPotion[0] && (
            <span style={{
              position: 'absolute', top: -1, left: 1,
              fontSize: 6, color: '#ffcc44', opacity: 0.85,
              textShadow: '0 0 2px #000',
            }}>{displayKey(keybindings.healPotion[0])}</span>
          )}
        </button>
      )}

      {/* Active skill buttons */}
      {activeSkills.map((s, i) => {
        const ready = s.cooldown >= s.maxCooldown;
        const cdSec = ready ? 0 : Math.ceil((s.maxCooldown - s.cooldown) / 60);
        const x = skillStartX - (i + 1) * (btnW + 3);
        return (
          <button
            key={s.id}
            onClick={() => {
              const g = gameRef.current;
              if (g && !g.gameOver) {
                g.pendingSkillUses = [...(g.pendingSkillUses || []), s.id];
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              const g = gameRef.current;
              if (g) {
                const auto = g.autoSkills || [];
                g.autoSkills = auto.includes(s.id)
                  ? auto.filter(id => id !== s.id)
                  : [...auto, s.id];
              }
            }}
            onPointerEnter={() => {
              const rangeStr = s.range ? ` (${s.range}px)` : '';
              const autoStr = s.isAuto ? ' [AUTO]' : ' | Right-click: auto';
              showTooltip(`${s.name}: ${s.desc}${rangeStr}${autoStr}`, x + 14, DISPLAY_H - 62);
            }}
            onPointerMove={moveTooltip}
            onPointerLeave={hideTooltip}
            style={{
              ...base,
              position: 'absolute',
              left: x,
              width: btnW,
              borderRadius: 4,
              background: ready ? s.buttonColor : '#333',
              borderColor: s.isAuto ? '#00ffaa' : ready ? s.buttonColorReady : '#555',
              borderWidth: s.isAuto ? 2 : 1,
              flexDirection: 'column',
              fontSize: 13,
              opacity: ready ? 1 : 0.7,
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
            {(() => {
              const action = (`skill${i + 1}`) as keyof KeyBindings;
              const key = keybindings[action]?.[0];
              return key ? (
                <span style={{
                  position: 'absolute', top: -1, left: 1,
                  fontSize: 6, color: '#ffcc44', opacity: 0.85,
                  textShadow: '0 0 2px #000',
                }}>{displayKey(key)}</span>
              ) : null;
            })()}
          </button>
        );
      })}

      {/* ◀ arrow */}
      <button onClick={onMovePrev} style={{
        ...base, position: 'absolute',
        left: leftArrowX, width: 30, fontSize: 13,
        ...(tutorialHighlightBack ? {
          borderColor: '#ffcc44',
          boxShadow: '0 0 8px #ffcc44, 0 0 16px #ffcc4466',
          animation: 'tutorialGlow 1.2s ease-in-out infinite',
        } : {}),
      }}>◀</button>

      {/* Defend/Attack toggle */}
      {showHoldBtn && (
        <button onClick={onToggleHold} style={{
          ...base, position: 'absolute',
          left: holdX, width: 60, fontSize: 8,
          background: armyHoldMode ? 'rgba(160,50,50,0.85)' : 'rgba(50,110,50,0.8)',
          borderColor: armyHoldMode ? '#ff6666' : '#66cc66',
        }}>{armyHoldMode ? '🛡️Defend' : '⚔️Attack'}</button>
      )}

      {/* ▶ arrow */}
      <button onClick={onMoveNext} style={{
        ...base, position: 'absolute',
        left: rightArrowX, width: 30, fontSize: 13,
        ...(tutorialHighlightForward ? {
          borderColor: '#ffcc44',
          boxShadow: '0 0 8px #ffcc44, 0 0 16px #ffcc4466',
          animation: 'tutorialGlow 1.2s ease-in-out infinite',
        } : {}),
      }}>▶</button>

      {/* Passive skill indicators — rotating dash border like v1 */}
      {passiveSkills.map((s, i) => {
        const x = rightArrowX + 30 + 3 + i * (btnW + 3);
        const dashOffset = (frameRef.current * 0.5) % 80;
        return (
          <div
            key={s.id}
            onPointerEnter={() => {
              const rangeStr = s.range ? ` (${s.range}px)` : '';
              showTooltip(`${s.name}: ${s.desc}${rangeStr}`, x + 14, DISPLAY_H - 62);
            }}
            onPointerMove={moveTooltip}
            onPointerLeave={hideTooltip}
            style={{
              position: 'absolute',
              left: x, top: 0,
              width: btnW, height: h,
              borderRadius: 5,
              background: 'rgba(42,42,78,0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13,
              opacity: 0.85,
              cursor: 'pointer',
            }}
          >
            <svg
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible' }}
              viewBox={`0 0 ${btnW} ${h}`}
            >
              <rect
                x={0.75} y={0.75}
                width={btnW - 1.5} height={h - 1.5}
                rx={5} ry={5}
                fill="none"
                stroke="#ffd700"
                strokeWidth={1.5}
                strokeDasharray="10 10"
                strokeDashoffset={dashOffset}
              />
            </svg>
            {s.icon}
          </div>
        );
      })}
    </div>
  );
});

// === Main HUD ===
export default function GameHUD(props: GameHUDProps) {
  const { gameRef, frameRef, cameraMode, onCycleCameraMode, onMovePrev, onMoveNext,
    onToggleHold, onOpenSettings, onOpenShop, onOpenAchievements, onOpenRelics, onOpenMap, hasMap,
    musicTrack, musicPaused, onMusicNext, onMusicPrev, onMusicToggle,
    onMusicClick, musicClicks, onOpenTrackSelector, keybindings, onUseConsumable, tutorialHighlightForward, tutorialHighlightBack, gems } = props;

  const [hud, setHud] = useState<HUDValues>(() => snapshotHUD(gameRef.current));

  useEffect(() => {
    const iv = setInterval(() => {
      const g = gameRef.current;
      if (g) setHud(snapshotHUD(g));
    }, 100);
    return () => clearInterval(iv);
  }, [gameRef]);

  // Tooltip state
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipTextRef = useRef<string | null>(null);

  const showTooltip = useCallback((text: string, x: number, y: number) => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    tooltipTextRef.current = text;
    setTooltip({ text, x, y });
  }, []);

  const moveTooltip = useCallback((e: React.PointerEvent) => {
    if (tooltipTextRef.current) {
      const el = e.currentTarget.closest('[data-hud-root]') as HTMLElement | null;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) * (DISPLAY_W / rect.width);
      const py = (e.clientY - rect.top) * (DISPLAY_H / rect.height);
      setTooltip({ text: tooltipTextRef.current, x: px, y: py });
    }
  }, []);

  const hideTooltip = useCallback(() => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    tooltipTextRef.current = null;
    tooltipTimer.current = setTimeout(() => setTooltip(null), 300);
  }, []);

  return (
    <div data-hud-root style={{
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
          onMusicClick={onMusicClick}
          musicClicks={musicClicks}
          onOpenTrackSelector={onOpenTrackSelector}
          showTooltip={showTooltip}
          hideTooltip={hideTooltip}
          gems={gems}
        />
      </div>

      <div style={{ pointerEvents: 'auto' }}>
        <SidebarIcons
          onOpenShop={onOpenShop}
          onOpenAchievements={onOpenAchievements}
          onOpenRelics={onOpenRelics}
          onOpenMap={onOpenMap}
          hasMap={hasMap}
        />
      </div>

      <div style={{ pointerEvents: 'auto' }}>
        <ArtifactRow artifacts={hud.artifacts}
          showTooltip={showTooltip} moveTooltip={moveTooltip} hideTooltip={hideTooltip} />
      </div>
      <div style={{ pointerEvents: 'auto' }}>
        <ArmyRoster unitSlots={hud.unitSlots}
          showTooltip={showTooltip} moveTooltip={moveTooltip} hideTooltip={hideTooltip} />
      </div>

      <div style={{ pointerEvents: 'auto' }}>
        <BottomBar
          armyHoldMode={hud.armyHoldMode}
          inDungeon={hud.inDungeon}
          skills={hud.skills}
          potionCount={hud.potionCount}
          gameRef={gameRef}
          frameRef={frameRef}
          onMovePrev={onMovePrev}
          onMoveNext={onMoveNext}
          onToggleHold={onToggleHold}
          showTooltip={showTooltip}
          moveTooltip={moveTooltip}
          hideTooltip={hideTooltip}
          keybindings={keybindings}
          onUseConsumable={onUseConsumable}
          tutorialHighlightForward={tutorialHighlightForward}
          tutorialHighlightBack={tutorialHighlightBack}
        />
      </div>

      {/* Hover tooltip */}
      {tooltip && (() => {
        const maxW = 280;
        const padX = 5;
        const padY = 3;
        const lines = tooltip.text.split('\n');
        const longestLine = Math.max(...lines.map(l => l.length));
        const boxW = Math.min(maxW, longestLine * 6 + padX * 2);
        const boxH = lines.length * 12 + padY * 2;
        let tx = Math.max(4, Math.min(tooltip.x - boxW / 2, DISPLAY_W - boxW - 4));
        let ty = tooltip.y + 10;
        if (ty + boxH > DISPLAY_H - 2) ty = tooltip.y - boxH - 6;
        if (ty < 4) ty = 4;
        return (
          <div
            style={{
              position: 'absolute',
              left: tx, top: ty,
              width: boxW, minHeight: boxH,
              background: 'rgba(10,10,15,0.95)',
              border: '1px solid #B8860B',
              borderRadius: 3,
              padding: `${padY}px ${padX}px`,
              pointerEvents: 'none',
              zIndex: 100,
              color: '#ddd',
              fontSize: 8,
              lineHeight: '12px',
              letterSpacing: '-0.5px',
              whiteSpace: 'pre-line',
              fontFamily: F,
            }}
          >
            {tooltip.text}
          </div>
        );
      })()}
    </div>
  );
}
