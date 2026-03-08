import { useRef, useEffect, useCallback, useState } from 'react';
import type { GameState, CameraMode, Artifact, PermanentUpgrades, ShardUpgrades, ChallengeCompletions } from '../../types';
import type { RelicCollection } from '../../relics';
import type { Regalia, RegaliaSlot } from '../../regalias';
import type { KeyBindings, ActionId } from '../../keybindings';
import { VIEWPORT_W, VIEWPORT_H, DISPLAY_W, DISPLAY_H, COLORS } from '../../constants';
import { drawEntities } from '../../canvasRenderer';
import { TileCache } from '../../rendering/tileRenderer';
import { getSkillDef } from '../../skills';
import { ACTION_ORDER, ACTION_LABELS, DEFAULT_KEYBINDINGS, displayKey } from '../../keybindings';
import GameHUD from './GameHUD';
import { ArtifactPicker } from './ArtifactPicker';
import { SkillPicker } from './SkillPicker';
import { RelicPicker } from './RelicPicker';
import { ShopPanel, ShopTabs } from './ShopPanel';

interface GameViewProps {
  gameRef: React.MutableRefObject<GameState>;
  frameRef: React.MutableRefObject<number>;
  showHpNumbers: boolean;
  killParticles: boolean;
  heroClass: string;
  modalTick: number;
  shopTick: number;
  cameraMode: CameraMode;
  onCycleCameraMode: () => void;
  onOpenSettings: () => void;
  onOpenAchievements: () => void;
  onOpenRelics: () => void;
  musicTrack: string;
  musicPaused: boolean;
  onMusicNext: () => void;
  onMusicPrev: () => void;
  onMusicToggle: () => void;
  onGameOver: () => void;
  shopTab: string;
  setShopTab: (tab: string) => void;
  upgrades: PermanentUpgrades;
  shardUpgrades: ShardUpgrades;
  challengeCompletions: ChallengeCompletions;
  relicCollection: RelicCollection;
  ancientRelicsOwned: string[];
  ancientRelicCopies: Record<string, number>;
  highestZone: number;
  highestFlags: number;
  buyRunUpgrade: (type: string, cost: number) => void;
  buyRunUpgradeMulti: (type: string, totalCost: number, levels: number) => void;
  onRoll: () => void;
  movePortalForward: () => void;
  toggleAutoPortal: () => void;
  onReturnHome: () => void;
  regaliaEquipped: Record<RegaliaSlot, Regalia | null>;
  settingsOpen: boolean;
  volume: number;
  setVolume: (v: number) => void;
  sfxVolume: number;
  setSfxVolume: (v: number) => void;
  setShowHpNumbers: (v: boolean) => void;
  setKillParticles: (v: boolean) => void;
  keybindings: KeyBindings;
  setKeybindings: React.Dispatch<React.SetStateAction<KeyBindings>>;
  rebindingAction: ActionId | null;
  setRebindingAction: React.Dispatch<React.SetStateAction<ActionId | null>>;
  gems: number;
  setGems: React.Dispatch<React.SetStateAction<number>>;
  shards: number;
  setShards: React.Dispatch<React.SetStateAction<number>>;
}

export default function GameView({
  gameRef, frameRef, showHpNumbers, killParticles, heroClass, modalTick, shopTick,
  cameraMode, onCycleCameraMode, onOpenSettings, onOpenAchievements, onOpenRelics,
  musicTrack, musicPaused, onMusicNext, onMusicPrev, onMusicToggle, onGameOver,
  shopTab, setShopTab, upgrades, shardUpgrades, challengeCompletions,
  relicCollection, ancientRelicsOwned, ancientRelicCopies, highestZone, highestFlags,
  buyRunUpgrade, buyRunUpgradeMulti, onRoll, movePortalForward, toggleAutoPortal, onReturnHome,
  regaliaEquipped,
  settingsOpen, volume, setVolume, sfxVolume, setSfxVolume, setShowHpNumbers, setKillParticles,
  keybindings, setKeybindings, rebindingAction, setRebindingAction,
  gems, setGems, shards, setShards,
}: GameViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tileCacheRef = useRef(new TileCache());
  const [settingsTab, setSettingsTab] = useState<'audio' | 'controls' | 'dev'>('audio');

  // Refresh shop at 60fps so gold/costs stay current (cheap — only React reconciliation, no canvas work)
  const [, setShopRefresh] = useState(0);
  useEffect(() => {
    let running = true;
    let rafId = 0;
    const tick = () => {
      if (!running) return;
      setShopRefresh(n => (n + 1) | 0);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(rafId); };
  }, []);

  // Canvas draw loop — canvasRenderer handles DISPLAY_SCALE internally
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Size buffer to device pixels for crisp rendering.
    // Re-adapts on browser zoom via matchMedia DPR listener.
    let currentDpr = window.devicePixelRatio || 1;
    const resizeBuffer = () => {
      currentDpr = window.devicePixelRatio || 1;
      canvas.width = DISPLAY_W * currentDpr;
      canvas.height = DISPLAY_H * currentDpr;
    };
    resizeBuffer();

    // Listen for DPR changes (browser zoom)
    let dprQuery = matchMedia(`(resolution: ${currentDpr}dppx)`);
    const onDprChange = () => {
      resizeBuffer();
      // Re-attach listener for the new DPR value
      dprQuery.removeEventListener('change', onDprChange);
      dprQuery = matchMedia(`(resolution: ${currentDpr}dppx)`);
      dprQuery.addEventListener('change', onDprChange);
    };
    dprQuery.addEventListener('change', onDprChange);

    let rafId = 0;
    let running = true;

    const draw = () => {
      if (!running) return;

      const game = gameRef.current;
      if (game) {
        drawEntities(ctx, game, game.cameraX || 0, game.frame || 0, showHpNumbers, heroClass, killParticles, tileCacheRef.current);
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      dprQuery.removeEventListener('change', onDprChange);
    };
  }, [gameRef, showHpNumbers, heroClass, killParticles]);

  // === Movement callbacks ===
  const onMovePrev = useCallback(() => {
    const game = gameRef.current;
    if (!game || game.gameOver) return;
    game.hero.targetFlagIndex = Math.max(0, game.hero.targetFlagIndex - 1);
  }, [gameRef]);

  const onMoveNext = useCallback(() => {
    const game = gameRef.current;
    if (!game || game.gameOver) return;
    game.hero.targetFlagIndex = Math.min(game.flags.length - 1, game.hero.targetFlagIndex + 1);
  }, [gameRef]);

  const onToggleHold = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    game.armyHoldMode = !game.armyHoldMode;
  }, [gameRef]);

  const onTogglePlanted = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    game.hero.planted = !game.hero.planted;
  }, [gameRef]);

  // === Modal callbacks ===
  const onSelectArtifact = useCallback((artifact: Artifact) => {
    const game = gameRef.current;
    if (!game) return;
    game.artifacts = [...(game.artifacts || []), artifact];
    game.pendingArtifactChoice = null;
  }, [gameRef]);

  const onSelectSkill = useCallback((skillId: string) => {
    const game = gameRef.current;
    if (!game) return;
    const def = getSkillDef(skillId);
    game.heroSkills.equippedSkills = [...game.heroSkills.equippedSkills, skillId];
    if (def && def.cooldownFrames > 0) {
      game.heroSkills.skillCooldowns = { ...game.heroSkills.skillCooldowns, [skillId]: def.cooldownFrames };
    }
    game.pendingSkillChoice = null;
  }, [gameRef]);

  const onSelectRelic = useCallback((relic: { id: string }) => {
    const game = gameRef.current;
    if (!game) return;
    game.relicDrops = [...(game.relicDrops || []), relic.id];
    game.pendingRelicChoice = null;
  }, [gameRef]);

  const game = gameRef.current;
  const showArtifactPicker = !!(game?.pendingArtifactChoice);
  const showSkillPicker = !!(game?.pendingSkillChoice);
  const showRelicPicker = !!(game?.pendingRelicChoice);
  const showGameOver = !!(game?.gameOver);

  const purchaseModeRef = useRef<'1x' | '10x' | 'MAX'>('1x');
  const cyclePurchaseMode = useCallback(() => {
    purchaseModeRef.current = purchaseModeRef.current === '1x' ? '10x' : purchaseModeRef.current === '10x' ? 'MAX' : '1x';
  }, []);

  const F = '"Press Start 2P", monospace';

  return (
    <div style={{ width: DISPLAY_W + 4, margin: '0 auto', background: '#1a1a2e' }}>
      {/* Game frame */}
      <div style={{
        position: 'relative', width: DISPLAY_W, height: DISPLAY_H, overflow: 'hidden',
        border: '2px solid #8a4adf',
        borderRadius: 4,
        isolation: 'isolate' as any,
      }}>
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute', top: 0, left: 0,
            width: DISPLAY_W, height: DISPLAY_H,
            imageRendering: 'pixelated',
            zIndex: 0,
          }}
        />

        {/* HUD overlay — sized to display frame */}
        <GameHUD
          gameRef={gameRef}
          frameRef={frameRef}
          cameraMode={cameraMode}
          onCycleCameraMode={onCycleCameraMode}
          onMovePrev={onMovePrev}
          onMoveNext={onMoveNext}
          onToggleHold={onToggleHold}
          onOpenSettings={onOpenSettings}
          onOpenShop={() => {}}
          onOpenAchievements={onOpenAchievements}
          onOpenRelics={onOpenRelics}
          onTogglePlanted={onTogglePlanted}
          musicTrack={musicTrack}
          musicPaused={musicPaused}
          onMusicNext={onMusicNext}
          onMusicPrev={onMusicPrev}
          onMusicToggle={onMusicToggle}
        />

        {/* Modal overlays */}
        {showArtifactPicker && game.pendingArtifactChoice && (
          <ArtifactPicker
            artifacts={game.pendingArtifactChoice}
            ownedArtifactIds={(game.artifacts || []).map(a => a.id)}
            onSelect={onSelectArtifact}
            heroClass={heroClass}
          />
        )}

        {showSkillPicker && game.pendingSkillChoice && (
          <SkillPicker
            skillIds={game.pendingSkillChoice}
            onSelect={onSelectSkill}
          />
        )}

        {showRelicPicker && game.pendingRelicChoice && (
          <RelicPicker
            relics={game.pendingRelicChoice}
            onSelect={onSelectRelic}
          />
        )}

        {/* Settings overlay */}
        {settingsOpen && (() => {
          const isDev = typeof location !== 'undefined' && location.hostname === 'localhost';
          const tabs = ['audio', 'controls', ...(isDev ? ['dev'] : [])] as ('audio' | 'controls' | 'dev')[];
          return (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            background: 'linear-gradient(135deg, rgba(30,12,50,0.98) 0%, rgba(15,8,25,0.98) 100%)',
            borderRadius: 8, padding: 16, zIndex: 25, border: '2px solid #8a4adf',
            fontFamily: F,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ color: COLORS.gold, fontSize: 13 }}>SETTINGS</span>
              <button onClick={onOpenSettings} style={{ padding: '4px 10px', fontSize: 11, fontFamily: F, background: 'rgba(20,15,30,0.85)', color: '#aaa', border: '1px solid rgba(138,74,223,0.3)', borderRadius: 4, cursor: 'pointer' }}>CLOSE</button>
            </div>
            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
              {tabs.map(tab => (
                <button key={tab} onClick={() => setSettingsTab(tab)} style={{
                  padding: '4px 10px', fontSize: 10, fontFamily: F,
                  background: settingsTab === tab ? 'rgba(138,74,223,0.35)' : 'rgba(20,15,30,0.85)',
                  color: settingsTab === tab ? COLORS.gold : '#aaa',
                  border: `1px solid ${settingsTab === tab ? '#8a4adf' : 'rgba(138,74,223,0.3)'}`,
                  borderRadius: 4, cursor: 'pointer', textTransform: 'uppercase',
                }}>{tab === 'audio' ? 'Audio' : tab === 'controls' ? 'Controls' : 'Dev'}</button>
              ))}
            </div>
            {/* Audio tab */}
            {settingsTab === 'audio' && (<>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#ccc', fontSize: 11, marginBottom: 6 }}>MUSIC: {Math.round(volume * 100)}%</div>
                <input type="range" min="0" max="100" value={Math.round(volume * 100)} onChange={e => setVolume(Number(e.target.value) / 100)} style={{ width: '100%', accentColor: COLORS.heroBlue }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#ccc', fontSize: 11, marginBottom: 6 }}>SFX: {Math.round(sfxVolume * 100)}%</div>
                <input type="range" min="0" max="100" value={Math.round(sfxVolume * 100)} onChange={e => setSfxVolume(Number(e.target.value) / 100)} style={{ width: '100%', accentColor: COLORS.gold }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={showHpNumbers} onChange={e => setShowHpNumbers(e.target.checked)} style={{ accentColor: COLORS.heroBlue, width: 14, height: 14 }} />
                <span style={{ color: '#ccc', fontSize: 10 }}>Show HP numbers on units</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 6 }}>
                <input type="checkbox" checked={killParticles} onChange={e => setKillParticles(e.target.checked)} style={{ accentColor: COLORS.heroBlue, width: 14, height: 14 }} />
                <span style={{ color: '#ccc', fontSize: 10 }}>Kill particles</span>
              </label>
            </>)}
            {/* Controls tab */}
            {settingsTab === 'controls' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ACTION_ORDER.map(action => (
                  <div key={action} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#ccc', fontSize: 10, width: 80, flexShrink: 0 }}>{ACTION_LABELS[action]}</span>
                    <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                      {keybindings[action].map((k, i) => (
                        <span key={i} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 2,
                          padding: '2px 6px', fontSize: 9, fontFamily: F,
                          background: 'rgba(20,15,30,0.85)', color: COLORS.gold,
                          border: '1px solid rgba(138,74,223,0.5)', borderRadius: 3,
                        }}>
                          {displayKey(k)}
                          <span onClick={() => setKeybindings(prev => ({ ...prev, [action]: prev[action].filter((_: string, j: number) => j !== i) }))} style={{ cursor: 'pointer', color: '#ff6666', fontSize: 8, marginLeft: 2 }}>{'\u00d7'}</span>
                        </span>
                      ))}
                    </div>
                    {rebindingAction === action ? (
                      <span style={{ color: '#ffaa44', fontSize: 9 }}>Press a key... <span onClick={() => setRebindingAction(null)} style={{ cursor: 'pointer', color: '#aaa', textDecoration: 'underline' }}>Cancel</span></span>
                    ) : (
                      <button onClick={() => setRebindingAction(action)} style={{
                        padding: '2px 8px', fontSize: 9, fontFamily: F,
                        background: 'rgba(20,15,30,0.85)', color: '#aaa',
                        border: '1px solid rgba(138,74,223,0.3)', borderRadius: 3, cursor: 'pointer',
                      }}>Rebind</button>
                    )}
                  </div>
                ))}
                <button onClick={() => setKeybindings({ ...DEFAULT_KEYBINDINGS })} style={{
                  marginTop: 8, padding: '4px 12px', fontSize: 9, fontFamily: F,
                  background: 'rgba(255,60,60,0.15)', color: '#ff6666',
                  border: '1px solid rgba(255,60,60,0.4)', borderRadius: 3, cursor: 'pointer', alignSelf: 'flex-start',
                }}>RESET DEFAULTS</button>
              </div>
            )}
            {/* Dev tab */}
            {settingsTab === 'dev' && (
              <div style={{ marginTop: 12, borderTop: '1px solid rgba(138,74,223,0.25)', paddingTop: 8 }}>
                <div style={{ color: '#ff6644', fontSize: 10, marginBottom: 6 }}>DEV TOOLS</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <button onClick={() => { setGems(p => p + 100); }} style={{ padding: '3px 6px', fontSize: 9, fontFamily: F, background: 'rgba(20,15,30,0.85)', color: '#ccc', border: '1px solid rgba(138,74,223,0.3)', borderRadius: 3, cursor: 'pointer' }}>+100 Gems</button>
                  <button onClick={() => { setShards(p => p + 100); }} style={{ padding: '3px 6px', fontSize: 9, fontFamily: F, background: 'rgba(20,15,30,0.85)', color: '#ccc', border: '1px solid rgba(138,74,223,0.3)', borderRadius: 3, cursor: 'pointer' }}>+100 Shards</button>
                  <button onClick={() => { const g = gameRef.current; if (g) g.goldEarned += 100_000_000_000_000; }} style={{ padding: '3px 6px', fontSize: 9, fontFamily: F, background: 'rgba(20,15,30,0.85)', color: '#ccc', border: '1px solid rgba(138,74,223,0.3)', borderRadius: 3, cursor: 'pointer' }}>+100T Gold</button>
                  <button onClick={() => { const g = gameRef.current; if (g) g.devSpawnsDisabled = !g.devSpawnsDisabled; }} style={{ padding: '3px 6px', fontSize: 9, fontFamily: F, background: game?.devSpawnsDisabled ? 'rgba(255,60,60,0.3)' : 'rgba(20,15,30,0.85)', color: game?.devSpawnsDisabled ? '#ff8888' : '#ccc', border: `1px solid ${game?.devSpawnsDisabled ? '#ff4444' : 'rgba(138,74,223,0.3)'}`, borderRadius: 3, cursor: 'pointer' }}>{game?.devSpawnsDisabled ? 'Spawns OFF' : 'Spawns ON'}</button>
                  <button onClick={() => { const g = gameRef.current; if (g) g.devPaused = !g.devPaused; }} style={{ padding: '3px 6px', fontSize: 9, fontFamily: F, background: game?.devPaused ? 'rgba(255,200,0,0.3)' : 'rgba(20,15,30,0.85)', color: game?.devPaused ? '#ffcc44' : '#ccc', border: `1px solid ${game?.devPaused ? '#ffcc00' : 'rgba(138,74,223,0.3)'}`, borderRadius: 3, cursor: 'pointer' }}>{game?.devPaused ? '\u25B6 RESUME' : '\u23F8 PAUSE'}</button>
                  <button onClick={() => { const g = gameRef.current; if (g) { g.devGodMode = !g.devGodMode; if (g.devGodMode) g.hero.health = g.hero.maxHealth; } }} style={{ padding: '3px 6px', fontSize: 9, fontFamily: F, background: game?.devGodMode ? 'rgba(0,255,100,0.3)' : 'rgba(20,15,30,0.85)', color: game?.devGodMode ? '#44ff88' : '#ccc', border: `1px solid ${game?.devGodMode ? '#00ff66' : 'rgba(138,74,223,0.3)'}`, borderRadius: 3, cursor: 'pointer' }}>{game?.devGodMode ? '\u{1F49A} GOD MODE' : 'Stay Full HP'}</button>
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {showGameOver && !showArtifactPicker && !showSkillPicker && !showRelicPicker && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(30,12,50,0.98) 0%, rgba(15,8,25,0.98) 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            zIndex: 30, fontFamily: F,
          }}>
            <div style={{ color: '#ff4444', fontSize: 18, marginBottom: 12 }}>GAME OVER</div>
            <div style={{ color: '#aaccff', fontSize: 9, marginBottom: 5 }}>
              Zone: {(game.currentZone || 0) + 1} | Flags: {game.flagsCaptured || 0}
            </div>
            <div style={{ color: '#ffd700', fontSize: 9, marginBottom: 5 }}>
              Gold earned: {game.goldEarned || 0}
            </div>
            <div style={{ color: '#88ff88', fontSize: 9, marginBottom: 5 }}>
              Gems: +{game.gemsThisRun || 0} | Shards: +{game.shardsThisRun || 0}
            </div>
            <div style={{ color: '#aaa', fontSize: 7, marginBottom: 16 }}>
              {Math.floor((game.frame || 0) / 3600)}m {Math.floor(((game.frame || 0) % 3600) / 60)}s
            </div>
            <button
              onClick={onGameOver}
              style={{
                padding: '8px 28px', fontSize: 11,
                background: '#4a9fff', color: '#fff', border: 'none',
                borderRadius: 4, cursor: 'pointer', fontFamily: F,
              }}
            >
              CONTINUE
            </button>
          </div>
        )}
      </div>

      {/* Shop panel — always visible during gameplay (matches old project) */}
      {game && (
        <div style={{ width: DISPLAY_W, fontFamily: F }}>
          <ShopTabs
            game={game}
            shopTab={shopTab}
            setShopTab={setShopTab}
            purchaseMode={purchaseModeRef.current}
            cycleMode={cyclePurchaseMode}
          />
          <div className="hide-scrollbar" style={{ maxHeight: 400, overflowY: 'auto', overflowX: 'hidden' }}>
            <ShopPanel
              game={game}
              upgrades={upgrades}
              shardUpgrades={shardUpgrades}
              challengeCompletions={challengeCompletions}
              relicCollection={relicCollection}
              ancientRelicsOwned={ancientRelicsOwned}
              ancientRelicCopies={ancientRelicCopies}
              shopTab={shopTab}
              setShopTab={setShopTab}
              buyRunUpgrade={buyRunUpgrade}
              buyRunUpgradeMulti={buyRunUpgradeMulti}
              movePortalForward={movePortalForward}
              toggleAutoPortal={toggleAutoPortal}
              onRoll={onRoll}
              onReturnHome={onReturnHome}
              highestZone={highestZone}
              highestFlags={highestFlags}
              equippedRegalias={regaliaEquipped}
            />
          </div>
        </div>
      )}
    </div>
  );
}
