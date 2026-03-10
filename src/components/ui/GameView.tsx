import { useRef, useEffect, useCallback, useState } from 'react';
import type { GameState, CameraMode, Artifact, PermanentUpgrades, ShardUpgrades, ChallengeCompletions } from '../../types';
import type { RelicCollection } from '../../relics';
import type { Regalia, RegaliaSlot } from '../../regalias';
import type { KeyBindings, ActionId } from '../../keybindings';
import { VIEWPORT_W, VIEWPORT_H, DISPLAY_W, DISPLAY_H, COLORS, GROUND_Y, UNIT_STATS } from '../../constants';
import { computeFullUnitStats, type UnitType } from '../../utils/unitStats';
import { drawEntities } from '../../canvasRenderer';
import { TileCache } from '../../rendering/tileRenderer';
import { PixiRenderer } from '../../rendering/pixiRenderer';
import { getSkillDef } from '../../skills';
import { ACTION_ORDER, ACTION_LABELS, DEFAULT_KEYBINDINGS, displayKey } from '../../keybindings';
import GameHUD from './GameHUD';
import { ArtifactPicker } from './ArtifactPicker';
import { SkillPicker } from './SkillPicker';
import { RelicPicker } from './RelicPicker';
import { TutorialOverlay } from '../../tutorial/TutorialOverlay';
import { ShopPanel, ShopTabs } from './ShopPanel';
import { DungeonShopPanel } from './DungeonShopPanel';
import { BackpackPanel } from './BackpackPanel';
import { AchievementPanel } from './AchievementPanel';
import { RelicPanel } from './RelicPanel';
import { TrackSelector } from './TrackSelector';

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
  setCameraMode: React.Dispatch<React.SetStateAction<CameraMode>>;
  onOpenSettings: () => void;
  onOpenAchievements: () => void;
  onOpenRelics: () => void;
  musicTrack: string;
  musicPaused: boolean;
  onMusicNext: () => void;
  onMusicPrev: () => void;
  onMusicToggle: () => void;
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
  onConfirmRoll: () => void;
  onReroll: () => void;
  extraRerolls: number;
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
  hideNotifications: boolean;
  setHideNotifications: (v: boolean) => void;
  keybindings: KeyBindings;
  setKeybindings: React.Dispatch<React.SetStateAction<KeyBindings>>;
  rebindingAction: ActionId | null;
  setRebindingAction: React.Dispatch<React.SetStateAction<ActionId | null>>;
  gems: number;
  setGems: React.Dispatch<React.SetStateAction<number>>;
  shards: number;
  setShards: React.Dispatch<React.SetStateAction<number>>;
  // In-game panels
  showBackpack: boolean;
  setShowBackpack: React.Dispatch<React.SetStateAction<boolean>>;
  showAchievements: boolean;
  setShowAchievements: React.Dispatch<React.SetStateAction<boolean>>;
  showRelics: boolean;
  setShowRelics: React.Dispatch<React.SetStateAction<boolean>>;
  backpack: import('../../types').Backpack;
  achievementProgress: import('../../achievements').AchievementProgress[];
  onClaimAchievement: (id: string, tier: number) => void;
  onUseConsumable: (id: import('../../types').ConsumableId) => void;
  ancientFragments: number;
  dungeonUnlocked: boolean;
  // Music / track selector
  musicClicks: number;
  onMusicClick: () => void;
  trackSelectorOpen: boolean;
  setTrackSelectorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  blockedTracks: string[];
  setBlockedTracks: React.Dispatch<React.SetStateAction<string[]>>;
  allTracks: { menu: string[]; death: string[]; boss: string[]; forest: string[]; cave: string[]; nordic: string[]; volcanic: string[] };
  playTrack: (path: string) => void;
  activeBiome?: string;
  // FPS counter
  showFps?: boolean;
  setShowFps?: (v: boolean) => void;
  fpsValue?: number;
  // Dev spawn callbacks
  devSpawnArtifact?: () => void;
  devSpawnRegalia?: (rarity?: string) => void;
  devSpawnRelic?: () => void;
  devWarpZone?: (zone: number) => void;
  devEnterWaveDungeon?: () => void;
  devEnterTimedDungeon?: () => void;
  onEnterDungeon?: () => void;
  onEnterTimedDungeon?: () => void;
  // Dungeon shop callbacks
  dungeonBuyUnit?: () => void;
  dungeonBuyMeleeBoost?: () => void;
  dungeonBuyRangedBoost?: () => void;
  dungeonBuyMagicBoost?: () => void;
  dungeonBuyMetaUpgrade?: (key: keyof import('../../types').DungeonMetaUpgrades) => void;
  dungeonSetAllyMode?: (mode: 'advance' | 'hold' | 'retreat') => void;
  tutorialHighlights?: { roll?: boolean; heroUpgrade?: boolean; income?: boolean; portalTab?: boolean; retreatButton?: boolean; forwardButton?: boolean; backButton?: boolean };
  tutorialDialogue?: import('../../tutorial/tutorialData').TutorialDialogue | null;
  tutorialDialogueIndex?: number;
  tutorialPlayerName?: string;
  tutorialDarkOverlay?: boolean;
  onTutorialAdvance?: () => void;
  onTutorialNameSubmit?: (name: string) => void;
}

export default function GameView({
  gameRef, frameRef, showHpNumbers, killParticles, heroClass, modalTick, shopTick,
  cameraMode, onCycleCameraMode, setCameraMode, onOpenSettings, onOpenAchievements, onOpenRelics,
  musicTrack, musicPaused, onMusicNext, onMusicPrev, onMusicToggle,
  shopTab, setShopTab, upgrades, shardUpgrades, challengeCompletions,
  relicCollection, ancientRelicsOwned, ancientRelicCopies, highestZone, highestFlags,
  buyRunUpgrade, buyRunUpgradeMulti, onRoll, onConfirmRoll, onReroll, extraRerolls, movePortalForward, toggleAutoPortal, onReturnHome,
  regaliaEquipped,
  settingsOpen, volume, setVolume, sfxVolume, setSfxVolume, setShowHpNumbers, setKillParticles, hideNotifications, setHideNotifications,
  keybindings, setKeybindings, rebindingAction, setRebindingAction,
  gems, setGems, shards, setShards,
  showBackpack, setShowBackpack, showAchievements, setShowAchievements, showRelics, setShowRelics,
  backpack, achievementProgress, onClaimAchievement, onUseConsumable,
  ancientFragments, dungeonUnlocked,
  musicClicks, onMusicClick, trackSelectorOpen, setTrackSelectorOpen,
  blockedTracks, setBlockedTracks, allTracks, playTrack, activeBiome,
  showFps, setShowFps, fpsValue,
  devSpawnArtifact, devSpawnRegalia, devSpawnRelic, devWarpZone,
  devEnterWaveDungeon, devEnterTimedDungeon, onEnterDungeon, onEnterTimedDungeon,
  dungeonBuyUnit, dungeonBuyMeleeBoost, dungeonBuyRangedBoost, dungeonBuyMagicBoost, dungeonBuyMetaUpgrade, dungeonSetAllyMode,
  tutorialHighlights,
  tutorialDialogue, tutorialDialogueIndex, tutorialPlayerName, tutorialDarkOverlay,
  onTutorialAdvance, onTutorialNameSubmit,
}: GameViewProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const tileCacheRef = useRef(new TileCache());
  const pixiRef = useRef<PixiRenderer | null>(null);
  const [settingsTab, setSettingsTab] = useState<'audio' | 'controls' | 'dev'>('audio');

  // Refresh shop at ~30fps so gold/costs stay current (throttled from 60fps to reduce React reconciliation)
  const [, setShopRefresh] = useState(0);
  useEffect(() => {
    let running = true;
    let rafId = 0;
    let frameSkip = 0;
    const tick = () => {
      if (!running) return;
      if (++frameSkip >= 2) { // every 2nd rAF ≈ 30fps
        frameSkip = 0;
        setShopRefresh(n => (n + 1) | 0);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(rafId); };
  }, []);

  // Pixi WebGL + Canvas2D overlay draw loop
  // Pixi handles all game rendering (environment, units, projectiles, world objects, particles).
  // Canvas2D overlay handles screen-space post-effects (atmosphere, weather, explosions)
  // that need to composite on top of everything with specific blend modes.
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    let rafId = 0;
    let running = true;
    let pixi: PixiRenderer | null = null;

    // Canvas2D overlay for screen-space post-effects (atmosphere, explosions)
    const canvas2d = document.createElement('canvas');
    canvas2d.style.position = 'absolute';
    canvas2d.style.top = '0';
    canvas2d.style.left = '0';
    canvas2d.style.width = `${DISPLAY_W}px`;
    canvas2d.style.height = `${DISPLAY_H}px`;
    canvas2d.style.imageRendering = 'pixelated';
    canvas2d.style.zIndex = '1';
    canvas2d.style.pointerEvents = 'none';
    const dpr = window.devicePixelRatio || 1;
    canvas2d.width = DISPLAY_W * dpr;
    canvas2d.height = DISPLAY_H * dpr;
    container.appendChild(canvas2d);
    const ctx = canvas2d.getContext('2d')!;

    // Init Pixi (async)
    const renderer = new PixiRenderer();
    let pixiFrameCount = 0; // Track frames rendered by Pixi before Canvas2D yields
    let pixiInitTime = 0;   // Timestamp when Pixi first became ready

    // Loading overlay — covers black flash during Pixi init
    const loadingOverlay = document.createElement('div');
    loadingOverlay.style.cssText = `position:absolute;top:0;left:0;width:${DISPLAY_W}px;height:${DISPLAY_H}px;background:#111;z-index:5;display:flex;align-items:center;justify-content:center;color:#888;font:14px monospace;transition:opacity 0.35s;pointer-events:none;`;
    loadingOverlay.textContent = 'Loading...';
    container.appendChild(loadingOverlay);

    renderer.init(container).then(() => {
      pixi = renderer;
      pixiRef.current = renderer;
      pixiInitTime = performance.now();
      if (renderer.canvas) {
        renderer.canvas.style.zIndex = '0';
        renderer.canvas.style.touchAction = 'none';
      }
    });

    const draw = () => {
      if (!running) return;

      const game = gameRef.current;
      if (game) {
        const camX = game.cameraX || 0;
        const frame = game.frame || 0;
        const tc = tileCacheRef.current;

        // Let Pixi render several frames before Canvas2D yields, to avoid black flash.
        // Require both frame count (GPU has processed draws) AND wall-clock time
        // (browser has composited at least a couple of paint cycles).
        const pixiInited = pixi?.isReady;
        if (pixiInited) {
          pixi!.render(game, camX, frame, { showHpNumbers, heroClass, killParticles, hideNotifications, tileCache: tc });
          pixiFrameCount++;
        }
        const pixiReady = pixiInited && pixiFrameCount > 10 && (performance.now() - pixiInitTime) > 200;

        // Fade out loading overlay once Pixi is warmed up
        if (pixiReady && loadingOverlay.parentNode) {
          loadingOverlay.style.opacity = '0';
          setTimeout(() => loadingOverlay.remove(), 350);
        }

        // Canvas2D draws screen-space post-effects (atmosphere, explosions)
        // All skip flags true when Pixi is warmed up — only overlays + explosions remain
        drawEntities(ctx, game, camX, frame, showHpNumbers, heroClass, killParticles, tc, pixiReady, pixiReady, pixiReady, pixiReady, hideNotifications || pixiReady);
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      pixiRef.current = null;
      renderer.destroy();
      if (canvas2d.parentNode) canvas2d.parentNode.removeChild(canvas2d);
      if (loadingOverlay.parentNode) loadingOverlay.remove();
    };
  }, [gameRef, showHpNumbers, heroClass, killParticles, hideNotifications]);

  // === Camera drag ===
  const DRAG_THRESHOLD = 5;
  const dragRef = useRef<{ startScreenX: number; startCamX: number; isDragging: boolean; pointerId: number } | null>(null);

  const getMaxCam = useCallback(() => {
    const g = gameRef.current;
    if (!g) return 0;
    if (g.inDungeon && g.dungeonType === 'timed') return Math.max(0, 1050 - VIEWPORT_W);
    const flags = g.flags;
    const lastFlag = flags[flags.length - 1];
    const worldEnd = lastFlag ? lastFlag.x + 300 : 2000;
    return Math.max(0, worldEnd - VIEWPORT_W);
  }, [gameRef]);

  const screenToGameX = useCallback((screenDeltaX: number) => {
    const container = canvasContainerRef.current;
    if (!container) return 0;
    const rect = container.getBoundingClientRect();
    return screenDeltaX * (VIEWPORT_W / rect.width);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = {
      startScreenX: e.clientX,
      startCamX: gameRef.current?.cameraX || 0,
      isDragging: false,
      pointerId: e.pointerId,
    };
    (e.target as Element).setPointerCapture(e.pointerId);
  }, [gameRef]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startScreenX;
    const dist = Math.abs(dx);

    if (!dragRef.current.isDragging && dist > DRAG_THRESHOLD) {
      dragRef.current.isDragging = true;
      setCameraMode('manual');
    }

    if (dragRef.current.isDragging) {
      const deltaScreen = dragRef.current.startScreenX - e.clientX;
      const deltaGame = screenToGameX(deltaScreen);
      const newCam = Math.max(0, Math.min(getMaxCam(), dragRef.current.startCamX + deltaGame));
      const g = gameRef.current;
      if (g) g.cameraX = newCam;
    }
  }, [screenToGameX, getMaxCam, gameRef, setCameraMode]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const wasDragging = dragRef.current.isDragging;
    dragRef.current = null;

    // Click-to-collect / portal entry: if it wasn't a drag
    if (!wasDragging) {
      const g = gameRef.current;
      if (!g) return;
      const container = canvasContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) * (VIEWPORT_W / rect.width) + (g.cameraX || 0);
      const clickY = (e.clientY - rect.top) * (VIEWPORT_H / rect.height);

      // Portal click detection (before chest check so portals take priority)
      if (!g.inDungeon) {
        const PORTAL_RADIUS = 40;
        // Wave dungeon portal
        if (g.dungeonPortalTimer > 0 && g.dungeonPortalFlagId >= 0 && onEnterDungeon) {
          const portalFlag = g.flags.find(f => f.id === g.dungeonPortalFlagId);
          if (portalFlag) {
            const portalX = portalFlag.x + 40;
            const portalY = GROUND_Y - 20;
            if (Math.hypot(clickX - portalX, clickY - portalY) < PORTAL_RADIUS) {
              onEnterDungeon();
              return;
            }
          }
        }
        // Timed dungeon portal
        if (g.timedDungeonPortalTimer > 0 && g.timedDungeonPortalFlagId >= 0 && onEnterTimedDungeon) {
          const portalFlag = g.flags.find(f => f.id === g.timedDungeonPortalFlagId);
          if (portalFlag) {
            const portalX = portalFlag.x + 40;
            const portalY = GROUND_Y - 20;
            if (Math.hypot(clickX - portalX, clickY - portalY) < PORTAL_RADIUS) {
              onEnterTimedDungeon();
              return;
            }
          }
        }
      }

      // Click-to-collect chests
      if (g.chests?.length) {
        const CHEST_RADIUS = 35;
        let closestIdx = -1;
        let closestDist = CHEST_RADIUS;
        for (let i = 0; i < g.chests.length; i++) {
          const c = g.chests[i];
          const d = Math.hypot(c.x + 10 - clickX, c.y + 10 - clickY);
          if (d < closestDist) { closestDist = d; closestIdx = i; }
        }
        if (closestIdx >= 0) {
          g.chests[closestIdx].x = g.hero.x;
        }
      }
    }
  }, [gameRef, onEnterDungeon, onEnterTimedDungeon]);

  // === Movement callbacks ===
  const onMovePrev = useCallback(() => {
    const game = gameRef.current;
    if (!game || game.gameOver) return;
    game.hero.targetFlagIndex = Math.max(-1, game.hero.targetFlagIndex - 1);
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

  const [purchaseMode, setPurchaseMode] = useState<'1x' | '10x' | 'MAX'>('1x');
  const cyclePurchaseMode = useCallback(() => {
    setPurchaseMode(prev => prev === '1x' ? '10x' : prev === '10x' ? 'MAX' : '1x');
  }, []);

  const F = '"Press Start 2P", monospace';

  return (
    <div style={{ width: '100%', background: '#1a1a2e' }}>
      {/* Game frame */}
      <div style={{
        position: 'relative', width: '100%', height: DISPLAY_H, overflow: 'hidden',
        isolation: 'isolate' as any,
      }}>
        <div
          ref={canvasContainerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            position: 'absolute', top: 0, left: 0,
            width: DISPLAY_W, height: DISPLAY_H,
            zIndex: 0,
            touchAction: 'none',
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
          onOpenShop={() => setShowBackpack(p => !p)}
          onOpenAchievements={() => setShowAchievements(p => !p)}
          onOpenRelics={() => setShowRelics(p => !p)}
          musicTrack={musicTrack}
          musicPaused={musicPaused}
          onMusicNext={onMusicNext}
          onMusicPrev={onMusicPrev}
          onMusicToggle={onMusicToggle}
          onMusicClick={onMusicClick}
          musicClicks={musicClicks}
          onOpenTrackSelector={() => setTrackSelectorOpen(p => !p)}
          keybindings={keybindings}
          onUseConsumable={onUseConsumable}
          tutorialHighlightForward={tutorialHighlights?.forwardButton}
          tutorialHighlightBack={tutorialHighlights?.backButton}
        />

        {/* Track selector overlay */}
        {trackSelectorOpen && musicClicks >= 5 && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 27 }}>
            <TrackSelector
              highestZone={highestZone}
              currentTrack={musicTrack}
              allTracks={allTracks}
              onSelectTrack={playTrack}
              blockedTracks={blockedTracks}
              onToggleBlock={(path) => setBlockedTracks(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path])}
              onClose={() => setTrackSelectorOpen(false)}
              activeBiome={activeBiome}
              onToggleBiomeMute={(tracks) => setBlockedTracks(prev => {
                const allMuted = tracks.every(t => prev.includes(t));
                if (allMuted) return prev.filter(t => !tracks.includes(t));
                return [...prev, ...tracks.filter(t => !prev.includes(t))];
              })}
            />
          </div>
        )}

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
            relicCollection={relicCollection}
          />
        )}

        {/* Reroll overlay */}
        {game?.pendingRoll && (() => {
          const unit = game.pendingRoll;
          const stats = UNIT_STATS[unit.unitType as keyof typeof UNIT_STATS] as any;
          const unitIcons: Record<string, string> = { soldier: '\u{1F5E1}\uFE0F', archer: '\u{1F3F9}', knight: '\u{1F6E1}\uFE0F', halberd: '\u{1F531}', wizard: '\u{1F9D9}', cleric: '\u{1FA7A}', conjurer: '\u{1F537}', bombard: '\u{1F4A3}' };
          const unitIcon = unitIcons[unit.unitType] || '\u{2753}';
          const starTiers: Record<string, string> = { soldier: '\u2605', archer: '\u2605\u2605', halberd: '\u2605\u2605', knight: '\u2605\u2605\u2605', wizard: '\u2605\u2605\u2605', cleric: '\u2605\u2605\u2605', conjurer: '\u2605\u2605\u2605\u2605', bombard: '\u2605\u2605\u2605\u2605' };
          const starTier = starTiers[unit.unitType] || '\u2605\u2605';
          const maxRerolls = 1 + extraRerolls;
          const rerollsRemaining = maxRerolls - unit.rerollCount;
          const rerollCost = unit.rerollCount + 1;
          const hasFreeReroll = (game.freeRerolls || 0) > 0;
          const hasVoucher = !hasFreeReroll && (backpack?.rerollVoucher || 0) > 0;
          const canReroll = rerollsRemaining > 0 && (hasFreeReroll || hasVoucher || gems >= rerollCost);
          const artifactIds = (game.artifacts || []).map((a: any) => a.id);
          const bldgs = (game.flags || []).filter((f: any) => f.captured && f.buildingType).map((f: any) => f.buildingType!);
          const computed = computeFullUnitStats(unit.unitType as UnitType, {
            runLevel: game.runUpgrades?.[unit.unitType] || 0,
            shardUpgrades, challengeCompletions, artifacts: artifactIds,
            relicCollection, buildings: bldgs, bossesDefeated: game.bossesDefeated || 0,
            challengeId: game.challengeId, equippedRegalias: regaliaEquipped,
          });
          const { health: computedHp, damage: computedDmg, defense: computedDef, attackRate: computedAtkRate } = computed.final;
          return (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 30,
            }}>
              <div style={{
                width: '85%', maxWidth: '340px',
                background: 'linear-gradient(135deg, rgba(30,12,50,0.98) 0%, rgba(15,8,25,0.98) 100%)',
                border: '2px solid #8a4adf', borderRadius: '8px',
                padding: '16px 14px', textAlign: 'center',
                boxShadow: '0 0 24px rgba(138,74,223,0.5), 0 8px 24px rgba(0,0,0,0.6)',
              }}>
                <div style={{ fontSize: '13px', color: '#ffd700', marginBottom: '10px', textShadow: '0 0 8px rgba(255,215,0,0.5)' }}>
                  {'\u{1F3B2}'} UNIT ROLLED!
                </div>
                <div style={{ fontSize: '32px', marginBottom: '4px' }}>{unitIcon}</div>
                <div style={{ fontSize: '15px', color: stats.color || '#fff', fontWeight: 'bold', marginBottom: '2px' }}>
                  {stats.name || unit.unitType.charAt(0).toUpperCase() + unit.unitType.slice(1)}
                </div>
                <div style={{ fontSize: '10px', color: '#ffd700', marginBottom: '10px' }}>{starTier}</div>
                <div style={{ fontSize: '11px', color: '#ccc', marginBottom: '14px', lineHeight: '1.8' }}>
                  {'\u2764\uFE0F'}{computedHp}{'  '}{'\u2694\uFE0F'}{computedDmg}{'  '}{'\u{1F6E1}\uFE0F'}{computedDef}{'  '}{'\u26A1'}{(60 / computedAtkRate).toFixed(1)}/s
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button onClick={onConfirmRoll} style={{
                    padding: '10px 20px', fontSize: '13px', fontFamily: 'inherit', fontWeight: 'bold',
                    background: stats.color || COLORS.heroBlue, color: '#000', border: 'none',
                    borderRadius: '6px', cursor: 'pointer',
                  }}>
                    {'\u2705'} KEEP
                  </button>
                  {rerollsRemaining > 0 && (
                    <button onClick={onReroll} disabled={!canReroll} style={{
                      padding: '10px 20px', fontSize: '13px', fontFamily: 'inherit', fontWeight: 'bold',
                      background: canReroll ? '#a855f7' : 'rgba(20,15,30,0.85)', color: canReroll ? '#fff' : '#666',
                      border: canReroll ? 'none' : '1px solid rgba(138,74,223,0.3)', borderRadius: '6px', cursor: canReroll ? 'pointer' : 'not-allowed',
                    }}>
                      {'\u{1F3B2}'} REROLL {hasFreeReroll ? '(FREE!)' : hasVoucher ? '(Voucher)' : `(${rerollCost}\u{1F48E})`}
                    </button>
                  )}
                </div>
                {rerollsRemaining <= 0 && (
                  <div style={{ color: '#a855f7', fontSize: '10px', marginTop: '8px' }}>{maxRerolls > 1 ? 'All rerolls used!' : 'Reroll used!'}</div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Tutorial overlay */}
        {tutorialDialogue && onTutorialAdvance && onTutorialNameSubmit && (
          <TutorialOverlay
            dialogue={tutorialDialogue}
            dialogueIndex={tutorialDialogueIndex ?? 0}
            playerName={tutorialPlayerName ?? ''}
            darkOverlay={tutorialDarkOverlay ?? false}
            onAdvance={onTutorialAdvance}
            onNameSubmit={onTutorialNameSubmit}
          />
        )}

        {/* Backpack panel overlay */}
        {showBackpack && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 26, overflow: 'auto' }}>
            <BackpackPanel
              backpack={backpack}
              gems={gems}
              shards={shards}
              onClose={() => setShowBackpack(false)}
              onUseConsumable={onUseConsumable}
              canUseMidRun={!game?.gameOver}
              dungeonUnlocked={dungeonUnlocked}
              inDungeon={game?.inDungeon}
            />
          </div>
        )}

        {/* Achievements panel overlay */}
        {showAchievements && game && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 26, overflow: 'auto' }}>
            <AchievementPanel
              achievementProgress={achievementProgress}
              stats={{
                totalRuns: 0, totalFlagsCaptured: game.flagsCaptured || 0,
                highestZone: (game.currentZone || 0) + 1, totalBossesDefeated: game.bossesDefeated || 0,
                totalDistance: Math.floor((game.hero?.x || 0) / 50), totalPlayTime: 0,
                totalRetreats: 0, musicClicks: 0,
              }}
              onClaim={onClaimAchievement}
              onClose={() => setShowAchievements(false)}
            />
          </div>
        )}

        {/* Relics panel overlay */}
        {showRelics && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 26, overflow: 'auto' }}>
            <RelicPanel
              relicCollection={relicCollection}
              onClose={() => setShowRelics(false)}
              ancientFragments={ancientFragments}
              dungeonUnlocked={dungeonUnlocked}
              ancientRelicsOwned={ancientRelicsOwned}
              ancientRelicCopies={ancientRelicCopies}
            />
          </div>
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
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 6 }}>
                <input type="checkbox" checked={hideNotifications} onChange={e => setHideNotifications(e.target.checked)} style={{ accentColor: COLORS.heroBlue, width: 14, height: 14 }} />
                <span style={{ color: '#ccc', fontSize: 10 }}>Hide floating text</span>
              </label>
              {setShowFps && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 6 }}>
                  <input type="checkbox" checked={!!showFps} onChange={e => setShowFps(e.target.checked)} style={{ accentColor: COLORS.heroBlue, width: 14, height: 14 }} />
                  <span style={{ color: '#ccc', fontSize: 10 }}>Show FPS counter</span>
                  {showFps && <span style={{ color: COLORS.gold, fontSize: 10, fontWeight: 'bold' }}>{fpsValue} FPS</span>}
                </label>
              )}
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
                  <button onClick={() => { const g = gameRef.current; if (g) { g.backpack.healingPotion += 5; g.backpack.rerollVoucher += 5; g.backpack.artifactKey += 5; g.backpack.regaliaKey += 5; g.backpack.challengeKey += 5; } }} style={{ padding: '3px 6px', fontSize: 9, fontFamily: F, background: 'rgba(20,15,30,0.85)', color: '#ccc', border: '1px solid rgba(138,74,223,0.3)', borderRadius: 3, cursor: 'pointer' }}>+5 Items</button>
                  <button onClick={() => { const g = gameRef.current; if (g) g.devSpawnMult = g.devSpawnMult === 0.2 ? 1 : 0.2; }} style={{ padding: '3px 6px', fontSize: 9, fontFamily: F, background: game?.devSpawnMult === 0.2 ? 'rgba(255,120,0,0.3)' : 'rgba(20,15,30,0.85)', color: game?.devSpawnMult === 0.2 ? '#ff8844' : '#ccc', border: `1px solid ${game?.devSpawnMult === 0.2 ? '#ff6600' : 'rgba(138,74,223,0.3)'}`, borderRadius: 3, cursor: 'pointer' }}>{game?.devSpawnMult === 0.2 ? '5x Spawns ON' : '5x Spawns'}</button>
                </div>
                {/* Spawn row */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                  <span style={{ color: '#888', fontSize: 9, alignSelf: 'center' }}>Spawn:</span>
                  {devSpawnArtifact && <button onClick={devSpawnArtifact} style={{ padding: '3px 6px', fontSize: 9, fontFamily: F, background: 'rgba(20,15,30,0.85)', color: '#ccc', border: '1px solid rgba(138,74,223,0.3)', borderRadius: 3, cursor: 'pointer' }}>Artifact</button>}
                  {devSpawnRegalia && <button onClick={() => devSpawnRegalia()} style={{ padding: '3px 6px', fontSize: 9, fontFamily: F, background: 'rgba(20,15,30,0.85)', color: '#ccc', border: '1px solid rgba(138,74,223,0.3)', borderRadius: 3, cursor: 'pointer' }}>Regalia</button>}
                  {devSpawnRegalia && <button onClick={() => devSpawnRegalia('legendary')} style={{ padding: '3px 6px', fontSize: 9, fontFamily: F, background: 'rgba(20,15,30,0.85)', color: '#ffcc44', border: '1px solid rgba(255,200,0,0.4)', borderRadius: 3, cursor: 'pointer' }}>Legendary Regalia</button>}
                  {devSpawnRelic && <button onClick={devSpawnRelic} style={{ padding: '3px 6px', fontSize: 9, fontFamily: F, background: 'rgba(20,15,30,0.85)', color: '#ccc', border: '1px solid rgba(138,74,223,0.3)', borderRadius: 3, cursor: 'pointer' }}>Relic</button>}
                  <button onClick={() => {
                    const g = gameRef.current; if (!g || g.boss) return;
                    const bossFlag = g.flags.find(f => f.isBossFlag && !f.captured);
                    if (!bossFlag) return;
                    const z = g.currentZone;
                    const hp = Math.floor((300 + z * 250) * Math.pow(1.45, z * Math.pow(0.975, z)));
                    const dmg = Math.floor(20 * Math.pow(1.4, z * Math.pow(0.975, z)));
                    const bossType = z % 7;
                    g.boss = { x: bossFlag.x, y: GROUND_Y - 70, health: hp, maxHealth: hp, damage: dmg, speed: 0, attackRate: 120, attackRange: 120, zone: z, bossType, frame: 0, attackCooldown: 60, isAttacking: false, laserWarning: 0 } as any;
                  }} style={{ padding: '3px 6px', fontSize: 9, fontFamily: F, background: game?.boss ? 'rgba(255,60,60,0.3)' : 'rgba(20,15,30,0.85)', color: game?.boss ? '#ff8888' : '#ccc', border: `1px solid ${game?.boss ? '#ff4444' : 'rgba(138,74,223,0.3)'}`, borderRadius: 3, cursor: 'pointer' }}>{game?.boss ? 'Boss Active' : 'Spawn Boss'}</button>
                  <button onClick={() => {
                    const g = gameRef.current; if (!g) return;
                    const z = g.currentZone;
                    const baseHp = Math.floor((50 + z * 40) * Math.pow(1.35, z * Math.pow(0.975, z)));
                    const baseDmg = Math.floor(8 * Math.pow(1.3, z * Math.pow(0.975, z)));
                    for (let i = 0; i < 100; i++) {
                      g.enemies.push({ id: Date.now() + i, x: g.hero.x + 30 + Math.random() * 100, y: GROUND_Y, health: baseHp, maxHealth: baseHp, damage: baseDmg, speed: 0.3 + Math.random() * 0.3, attackRate: 90, attackRange: 40, attackCooldown: Math.floor(Math.random() * 60), frame: 0, isAttacking: false } as any);
                    }
                  }} style={{ padding: '3px 6px', fontSize: 9, fontFamily: F, background: 'rgba(20,15,30,0.85)', color: '#ff8844', border: '1px solid rgba(255,120,60,0.4)', borderRadius: 3, cursor: 'pointer' }}>+100 Mobs</button>
                </div>
                {/* Zone warp row */}
                {devWarpZone && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                    <span style={{ color: '#888', fontSize: 9, alignSelf: 'center' }}>Warp:</span>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map(z => (
                      <button key={z} onClick={() => devWarpZone(z)} style={{ padding: '3px 6px', fontSize: 9, fontFamily: F, background: game?.currentZone === z ? 'rgba(74,159,255,0.3)' : 'rgba(20,15,30,0.85)', color: game?.currentZone === z ? '#7abfff' : '#ccc', border: `1px solid ${game?.currentZone === z ? '#4a9fff' : 'rgba(138,74,223,0.3)'}`, borderRadius: 3, cursor: 'pointer' }}>Z{z}</button>
                    ))}
                  </div>
                )}
                {/* Dungeon warp row */}
                {(devEnterWaveDungeon || devEnterTimedDungeon) && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                    <span style={{ color: '#888', fontSize: 9, alignSelf: 'center' }}>Dungeon:</span>
                    {devEnterWaveDungeon && (
                      <button onClick={devEnterWaveDungeon} style={{ padding: '3px 6px', fontSize: 9, fontFamily: F, background: game?.inDungeon && game?.dungeonType === 'wave' ? 'rgba(170,68,255,0.3)' : 'rgba(20,15,30,0.85)', color: game?.inDungeon && game?.dungeonType === 'wave' ? '#cc88ff' : '#ccc', border: `1px solid ${game?.inDungeon && game?.dungeonType === 'wave' ? '#aa44ff' : 'rgba(138,74,223,0.3)'}`, borderRadius: 3, cursor: 'pointer' }}>Wave</button>
                    )}
                    {devEnterTimedDungeon && (
                      <button onClick={devEnterTimedDungeon} style={{ padding: '3px 6px', fontSize: 9, fontFamily: F, background: game?.inDungeon && game?.dungeonType === 'timed' ? 'rgba(255,102,51,0.3)' : 'rgba(20,15,30,0.85)', color: game?.inDungeon && game?.dungeonType === 'timed' ? '#ff8844' : '#ccc', border: `1px solid ${game?.inDungeon && game?.dungeonType === 'timed' ? '#ff6633' : 'rgba(138,74,223,0.3)'}`, borderRadius: 3, cursor: 'pointer' }}>Timed</button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          );
        })()}

        {/* Game over popup removed — v2 auto-transitions to void screen like v1 */}
      </div>

      {/* Shop panel — always visible during gameplay (matches old project) */}
      {game && (
        <div style={{ width: DISPLAY_W, fontFamily: F }}>
          {game.inDungeon && game.dungeonType === 'wave' && dungeonBuyUnit && dungeonBuyMeleeBoost && dungeonBuyRangedBoost && dungeonBuyMagicBoost && dungeonBuyMetaUpgrade && dungeonSetAllyMode ? (
            <DungeonShopPanel
              game={game}
              unlockedUnits={upgrades.unlockedUnits as string[]}
              onBuyUnit={dungeonBuyUnit}
              onBuyMeleeBoost={dungeonBuyMeleeBoost}
              onBuyRangedBoost={dungeonBuyRangedBoost}
              onBuyMagicBoost={dungeonBuyMagicBoost}
              onBuyMetaUpgrade={dungeonBuyMetaUpgrade}
              onSetAllyMode={dungeonSetAllyMode}
            />
          ) : (
            <>
              <ShopTabs
                game={game}
                shopTab={shopTab}
                setShopTab={setShopTab}
                purchaseMode={purchaseMode}
                cycleMode={cyclePurchaseMode}
                tutorialHighlightPortal={tutorialHighlights?.portalTab}
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
                  purchaseMode={purchaseMode}
                  tutorialHighlights={tutorialHighlights}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
