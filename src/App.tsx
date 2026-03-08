import { useState, useRef, useCallback, useEffect } from 'react';
import type { GameState, PermanentUpgrades, ShardUpgrades, GameScreen, CameraMode, Backpack, ChallengeCompletions, ChallengeId, ConsumableId } from './types';
import type { RelicCollection } from './relics';
import { rollRegalia, type Regalia, type RegaliaSlot, type RegaliaState } from './regalias';
import type { PetState } from './pets';
import type { HeroClassId } from './classes';
import type { CosmeticCategory } from './cosmetics';
import { createInitialState, generateZoneFlags, generateDungeonArena, generateTimedDungeonArena } from './state';
import { useGameLoop, type DungeonExitInfo } from './hooks/useGameLoop';
import { useMusicManager } from './hooks/useMusicManager';
import { preloadSprites } from './canvasRenderer';
import { getClassDef } from './classes';
import { heroTotalHp, heroTotalDmg, unitHpMult, unitDmgMult } from './utils/economy';
import { rollUnitType, COLORS, GROUND_Y } from './constants';
import { makeParticle, formatNumber, uid } from './utils/helpers';
import { SHARD_UPGRADES } from './shardUpgrades';
import { COSMETICS } from './cosmetics';
import { getSalvageRewards, getUpgradeCost, levelUpRegalia, getEnhanceCost, enhanceModifier, getMaxStars, getTotalStars, addStar, STAR_COST, MAX_STASH, findAutoSalvageTarget, RARITY_COLORS as REGALIA_RARITY_COLORS, SLOT_ICONS, getModDisplayText } from './regalias';
import { getChallengeDef, getChallengeShardsPerLevel } from './challenges';
import { DEFAULT_KEYBINDINGS, ACTION_ORDER, ACTION_LABELS, displayKey } from './keybindings';
import type { KeyBindings, ActionId } from './keybindings';
import { uploadCloudSave, downloadCloudSave } from './firebase';
import { getUnclaimedCount, ACHIEVEMENTS, checkAchievements } from './achievements';
import { totalConsumables, getConsumableDef } from './consumables';
import { canClaimDaily, getTodayString } from './dailyLogin';
import { ClassPicker } from './components/ui/ClassPicker';
import { ChallengeSelect } from './components/ui/ChallengeSelect';
import { PrestigeShop } from './components/ui/PrestigeShop';
import { RegaliaPanel } from './components/ui/RegaliaPanel';
import { RelicPanel } from './components/ui/RelicPanel';
import { AchievementPanel } from './components/ui/AchievementPanel';
import { BackpackPanel } from './components/ui/BackpackPanel';
import { DailyLoginPanel } from './components/ui/DailyLoginPanel';
import { LeaderboardPanel } from './components/ui/LeaderboardPanel';
import GameView from './components/ui/GameView';
import VoidScene from './components/ui/VoidScene';

const F = '"Press Start 2P", monospace';
const STORAGE_KEY = 'flag-conquest-save';
const CLOUD_SAVE_TS_KEY = 'flag-conquest-cloud-save-ts';
const CLOUD_SAVE_COOLDOWN = 8 * 60 * 60 * 1000;

function getCloudSaveCooldownRemaining(): number {
  try {
    const raw = localStorage.getItem(CLOUD_SAVE_TS_KEY);
    if (!raw) return 0;
    return Math.max(0, CLOUD_SAVE_COOLDOWN - (Date.now() - Number(raw)));
  } catch { return 0; }
}

function formatCooldown(ms: number): string {
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

// === Save/Load ===
function loadSave() {
  try {
    const raw = localStorage.getItem('flag-conquest-save');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem('flag-conquest-settings');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function loadRunState() {
  try {
    const raw = localStorage.getItem('flag-conquest-run-state');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export default function App() {
  // Cache localStorage parsing — only parse once on mount
  const initRef = useRef<{ saved: any; settings: any; savedRun: any } | null>(null);
  if (!initRef.current) initRef.current = { saved: loadSave(), settings: loadSettings(), savedRun: loadRunState() };
  const { saved, settings } = initRef.current;

  // === Persistent state (cross-run) ===
  const [gems, setGems] = useState(saved?.gems || 0);
  const [shards, setShards] = useState(saved?.shards || 0);
  const [upgrades, setUpgrades] = useState<PermanentUpgrades>(saved?.upgrades || {});
  const [shardUpgrades, setShardUpgrades] = useState<ShardUpgrades>(saved?.shardUpgrades || {});
  const [relicCollection, setRelicCollection] = useState<RelicCollection>(saved?.relicCollection || {});
  const [highestZone, setHighestZone] = useState(saved?.highestZone || 0);
  const [highestFlags, setHighestFlags] = useState(saved?.highestFlags || 0);

  // Cumulative stats
  const [totalRuns, setTotalRuns] = useState(saved?.totalRuns || 0);
  const [totalGemsEarned, setTotalGemsEarned] = useState(saved?.totalGemsEarned || 0);
  const [totalShardsEarned, setTotalShardsEarned] = useState(saved?.totalShardsEarned || 0);
  const [totalBossesDefeated, setTotalBossesDefeated] = useState(saved?.totalBossesDefeated || 0);
  const [totalFlagsCaptured, setTotalFlagsCaptured] = useState(saved?.totalFlagsCaptured || 0);
  const [totalDistance, setTotalDistance] = useState(saved?.totalDistance || 0);
  const [totalRetreats, setTotalRetreats] = useState(saved?.totalRetreats || 0);
  const [totalPlayTime, setTotalPlayTime] = useState(saved?.totalPlayTime || 0);
  const [achievementProgress, setAchievementProgress] = useState(saved?.achievementProgress || []);

  // Additional persistent systems
  const [ancientRelicsOwned, setAncientRelicsOwned] = useState<string[]>(saved?.ancientRelicsOwned || []);
  const [ancientRelicCopies, setAncientRelicCopies] = useState<Record<string, number>>(saved?.ancientRelicCopies || {});
  const [ancientFragments, setAncientFragments] = useState(saved?.ancientFragments || 0);
  const [backpack, setBackpack] = useState<Backpack>(saved?.backpack || { healingPotion: 0, rerollVoucher: 0, artifactKey: 0, regaliaKey: 0, challengeKey: 0 });
  const [challengeCompletions, setChallengeCompletions] = useState<ChallengeCompletions>(saved?.challengeCompletions || {});
  const [regaliaState, setRegaliaState] = useState<RegaliaState>(saved?.regaliaState || { stash: [], equipped: { sword: null, shield: null, necklace: null }, essence: 0 });
  const [petState, setPetState] = useState<PetState>(saved?.petState || { ownedPets: [], equippedPet: '' });
  const [dungeonUnlocked, setDungeonUnlocked] = useState(saved?.dungeonUnlocked || false);
  const [dungeonPityCounter, setDungeonPityCounter] = useState(saved?.dungeonPityCounter || 0);
  const [dungeonMetaUpgrades, setDungeonMetaUpgrades] = useState(saved?.dungeonMetaUpgrades || { headStart: 0, efficientMining: 0, eliteBounty: 0 });
  const [dungeonsEntered, setDungeonsEntered] = useState(saved?.dungeonsEntered || 0);

  // === UI state ===
  const [gameScreen, setGameScreen] = useState<GameScreen>('menu');
  const [cameraMode, setCameraMode] = useState<CameraMode>('hero');
  const cameraModeRef = useRef<CameraMode>(cameraMode);
  cameraModeRef.current = cameraMode;
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeId | null>(null);
  const settingsReturnTo = useRef<GameScreen>('menu');
  const [deathTab, setDeathTab] = useState<'shop' | 'regalia' | 'relics'>('shop');
  const [seenShopTabs] = useState(() => new Set<string>());
  const [mercyReward, setMercyReward] = useState<number | null>(null);

  // Daily login
  const [dailyLoginDay, setDailyLoginDay] = useState(saved?.dailyLoginDay ?? 0);
  const [lastDailyClaimDate, setLastDailyClaimDate] = useState(saved?.lastDailyClaimDate ?? '');
  const dailyClaimAvailable = canClaimDaily(lastDailyClaimDate);

  // Loot notifications
  const [regaliaNotif, setRegaliaNotif] = useState<Regalia | null>(null);
  const collectedRegaliaIds = useRef(new Set<string>());
  const regaliaNotifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [consumableNotif, setConsumableNotif] = useState<{ icon: string; name: string } | null>(null);
  const consumableNotifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Overlay panel toggles
  const [showAchievements, setShowAchievements] = useState(false);
  const [showBackpack, setShowBackpack] = useState(false);
  const [showRelics, setShowRelics] = useState(false);
  const [showDailyLogin, setShowDailyLogin] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Settings
  const [volume, setVolume] = useState(settings?.volume ?? 0.45);
  const [sfxVolume, setSfxVolume] = useState(settings?.sfxVolume ?? 0.5);
  const [showHpNumbers, setShowHpNumbers] = useState(settings?.showHpNumbers ?? true);
  const [killParticles, setKillParticles] = useState(settings?.killParticles ?? true);

  // Music / track selector
  const [musicClicks, setMusicClicks] = useState<number>(saved?.musicClicks ?? (saved?.upgrades?.musicClicks as number) ?? 0);
  const [trackSelectorOpen, setTrackSelectorOpen] = useState(false);
  const [blockedTracks, setBlockedTracks] = useState<string[]>(settings?.blockedTracks || []);

  // Keybindings
  const [keybindings, setKeybindings] = useState<KeyBindings>(() => {
    try {
      const raw = localStorage.getItem('flag-conquest-keybindings');
      if (raw) { const parsed = JSON.parse(raw); return { ...DEFAULT_KEYBINDINGS, ...parsed }; }
    } catch { /* */ }
    return { ...DEFAULT_KEYBINDINGS };
  });
  const [rebindingAction, setRebindingAction] = useState<ActionId | null>(null);

  // Leaderboard
  const [leaderboardOptIn, setLeaderboardOptIn] = useState<boolean>(() => {
    try { const v = localStorage.getItem('flag-conquest-leaderboard-optin'); return v === null ? true : v === 'true'; } catch { return true; }
  });

  // Save error
  const [saveError, setSaveError] = useState(false);

  // Splash screen
  const [splashPhase, setSplashPhase] = useState<'studio' | 'loading' | 'done'>('studio');
  const [splashOpacity, setSplashOpacity] = useState(0);

  // FPS counter
  const [showFps, setShowFps] = useState(false);
  const [fpsValue, setFpsValue] = useState(0);

  // Cloud save
  const [cloudSaveStatus, setCloudSaveStatus] = useState<'idle' | 'uploading' | 'downloading' | 'success' | 'error'>('idle');
  const [cloudSavePin, setCloudSavePin] = useState('');
  const [cloudSavePinInput, setCloudSavePinInput] = useState('');
  const [cloudSaveMessage, setCloudSaveMessage] = useState('');
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Persist settings to localStorage
  useEffect(() => {
    try { localStorage.setItem('flag-conquest-settings', JSON.stringify({ volume, sfxVolume, showHpNumbers, killParticles, blockedTracks })); } catch {}
  }, [volume, sfxVolume, showHpNumbers, killParticles, blockedTracks]);

  // Persist keybindings
  useEffect(() => {
    try { localStorage.setItem('flag-conquest-keybindings', JSON.stringify(keybindings)); } catch {}
  }, [keybindings]);

  // Persist leaderboard opt-in
  useEffect(() => {
    try { localStorage.setItem('flag-conquest-leaderboard-optin', String(leaderboardOptIn)); } catch {}
  }, [leaderboardOptIn]);

  // Rebind key listener
  useEffect(() => {
    if (!rebindingAction) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === 'Escape') { setRebindingAction(null); return; }
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      setKeybindings(prev => ({ ...prev, [rebindingAction]: [...prev[rebindingAction], key] }));
      setRebindingAction(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [rebindingAction]);

  // Splash screen sequence
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setSplashOpacity(1), 50));
    timers.push(setTimeout(() => setSplashOpacity(0), 1500));
    timers.push(setTimeout(() => setSplashPhase('loading'), 2000));
    document.fonts.ready.then(() => {
      timers.push(setTimeout(() => setSplashPhase('done'), 2200));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  // FPS counter
  useEffect(() => {
    if (!showFps) return;
    let rafCount = 0;
    let lastTime = performance.now();
    let rafId: number;
    const tick = () => {
      rafCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFpsValue(Math.round(rafCount * 1000 / (now - lastTime)));
        rafCount = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [showFps]);

  // === GAME STATE — lives in useRef, NOT useState ===
  const gameRef = useRef<GameState>(createInitialState(upgrades));

  // Modal event counter — incremented by game loop when overlays are needed
  // This is the ONLY thing that triggers React re-renders during gameplay
  const [modalTick, setModalTick] = useState(0);
  const onModalEvent = useCallback(() => {
    setModalTick(t => t + 1);
  }, []);

  // === Pet collection ===
  const collectPet = useCallback((petId: string) => {
    setPetState(prev => {
      if (prev.ownedPets.includes(petId)) return prev;
      return { ...prev, ownedPets: [...prev.ownedPets, petId] };
    });
  }, []);

  // === Music click (Audiophile achievement) ===
  const handleMusicClick = useCallback(() => {
    setMusicClicks((prev: number) => {
      const next = prev + 1;
      if (next === 5) {
        setAchievementProgress((ap: any[]) => checkAchievements({ musicClicks: next }, ap));
      }
      return next;
    });
  }, []);

  // === Consumable collection & usage ===
  const collectConsumable = useCallback((id: ConsumableId) => {
    setBackpack(prev => ({ ...prev, [id]: Math.min(99, prev[id] + 1) }));
    const cDef = getConsumableDef(id);
    setConsumableNotif({ icon: cDef.icon, name: cDef.name });
    if (consumableNotifTimer.current) clearTimeout(consumableNotifTimer.current);
    consumableNotifTimer.current = setTimeout(() => setConsumableNotif(null), 4000);
  }, []);

  const useConsumable = useCallback((id: ConsumableId) => {
    const g = gameRef.current;
    if (!g) return;
    if (id === 'healingPotion') {
      if (backpack.healingPotion <= 0) return;
      if (g.hero.health <= 0 || g.hero.health >= g.hero.maxHealth) return;
      const healPct = g.challengeId === 'cursedLands' ? 0.30 : 0.60;
      const heal = Math.floor(g.hero.maxHealth * healPct);
      const oldHp = g.hero.health;
      const newHp = Math.min(g.hero.maxHealth, g.hero.health + heal);
      g.hero.health = newHp;
      g.particles.push(makeParticle(g.hero.x, g.hero.y - 20, `+${newHp - oldHp} HP \u{1F9EA}`, '#4aff4a'));
      setBackpack(prev => ({ ...prev, healingPotion: prev.healingPotion - 1 }));
    }
    if (id === 'rerollVoucher') {
      if (backpack.rerollVoucher <= 0) return;
      g.freeRerolls = (g.freeRerolls || 0) + 1;
      g.particles.push(makeParticle(g.hero.x, g.hero.y - 20, 'FREE REROLL! \u{1F3B0}', '#a855f7'));
      setBackpack(prev => ({ ...prev, rerollVoucher: prev.rerollVoucher - 1 }));
    }
  }, [backpack]);

  // === Regalia collection ===
  const collectRegalia = useCallback((regalia: Regalia) => {
    if (collectedRegaliaIds.current.has(regalia.id)) return;
    collectedRegaliaIds.current.add(regalia.id);
    setRegaliaState(prev => {
      const newStash = [...prev.stash, regalia];
      if (newStash.length > MAX_STASH) {
        const idx = findAutoSalvageTarget(newStash);
        const salvaged = newStash[idx];
        const rewards = getSalvageRewards(salvaged.rarity);
        newStash.splice(idx, 1);
        return { ...prev, stash: newStash, essence: prev.essence + rewards.essence, stardust: (prev as any).stardust + rewards.stardust };
      }
      return { ...prev, stash: newStash };
    });
    setRegaliaNotif(regalia);
    if (regaliaNotifTimer.current) clearTimeout(regaliaNotifTimer.current);
    regaliaNotifTimer.current = setTimeout(() => setRegaliaNotif(null), 8000);
  }, []);

  // === Dungeon exit callback (React state updates) ===
  const onDungeonExit = useCallback((info: DungeonExitInfo) => {
    if (info.fragmentsEarned > 0) {
      setAncientFragments((f: number) => f + info.fragmentsEarned);
    }
    setDungeonMetaUpgrades({ ...info.metaUpgrades });
    setDungeonUnlocked(info.dungeonUnlocked);
    setDungeonPityCounter(info.pityCounter);
  }, []);

  // === Game loop ===
  const { frameRef } = useGameLoop(
    gameScreen, upgrades, shardUpgrades, relicCollection,
    gameRef, onModalEvent, cameraModeRef,
    ancientRelicsOwned, ancientRelicCopies, backpack,
    collectConsumable,
    challengeCompletions,
    regaliaState.equipped,
    collectRegalia,
    petState.equippedPet, petState.ownedPets,
    collectPet,
    onDungeonExit,
  );

  // === Music ===
  const [musicGame, setMusicGame] = useState(() => gameRef.current);
  useEffect(() => {
    const iv = setInterval(() => {
      const g = gameRef.current;
      if (!g) return;
      setMusicGame(prev => {
        const bossVisible = !!(g.boss && g.boss.health > 0);
        const prevBossVisible = !!(prev.boss && prev.boss.health > 0);
        if (g.currentZone !== prev.currentZone || bossVisible !== prevBossVisible) {
          return { ...g };
        }
        return prev;
      });
    }, 500);
    return () => clearInterval(iv);
  }, [gameRef]);
  const music = useMusicManager(gameScreen, musicGame, volume, blockedTracks);

  // Preload sprites on first play
  const spritesLoadedRef = useRef(false);

  // === Callbacks ===

  // Start game: either skip to class select (tutorial) or show mode select
  const startGame = useCallback(() => {
    if ((upgrades.tutorialStep as number) === 0 && upgrades.playerName === '') {
      selectClass('warlord');
      return;
    }
    setGameScreen('modeSelect');
  }, [upgrades]);

  const selectClass = useCallback((classId: HeroClassId) => {
    if (!spritesLoadedRef.current) {
      preloadSprites(String(upgrades.heroSkin || classId));
      spritesLoadedRef.current = true;
    }
    const newGame = createInitialState(upgrades, classId, selectedChallenge);
    // Starting Artifact
    if ((upgrades.startingArtifact as number) > 0) {
      newGame.chests.push({ id: Date.now(), x: newGame.hero.x + 30, y: GROUND_Y, type: 'artifactCommon', value: 0, age: 0 });
    }
    // Coffers
    const startingGoldLevel = (upgrades.startingGold as number) || 0;
    if (startingGoldLevel > 0) {
      newGame.goldEarned += startingGoldLevel * 100;
    }
    // Free Starting Unit
    const freeUnitLevel = (upgrades.freeStartingUnit as number) || 0;
    if (freeUnitLevel > 0 && selectedChallenge !== 'loneWolf') {
      const STAR_TIERS: string[][] = [['soldier'], ['archer', 'halberd'], ['knight', 'wizard', 'cleric']];
      const tier = Math.min(freeUnitLevel, STAR_TIERS.length) - 1;
      let pool: string[] = [];
      for (let t = tier; t >= 0 && pool.length === 0; t--) {
        pool = STAR_TIERS[t].filter(u => (upgrades.unlockedUnits as string[]).includes(u));
      }
      if (pool.length > 0) {
        const unitType = pool[Math.floor(Math.random() * pool.length)];
        newGame.unitSlots.push({ type: unitType, respawnTimer: 0, alive: true });
      }
    }
    gameRef.current = newGame;
    setSelectedChallenge(null);
    setShopTab(selectedChallenge === 'loneWolf' ? 'income' : 'units');
    setGameScreen('playing');
  }, [upgrades, selectedChallenge]);

  const cycleCameraMode = useCallback(() => {
    setCameraMode(m => m === 'hero' ? 'furthest' : m === 'furthest' ? 'manual' : 'hero');
  }, []);

  // === Settings state ===
  const [settingsOpen, setSettingsOpen] = useState(false);

  // === Shop state ===
  const [shopTab, setShopTab] = useState('units');
  const [shopTick, setShopTick] = useState(0);
  const refreshShop = useCallback(() => setShopTick(t => t + 1), []);

  // Periodic shop refresh so prices update as gold changes from combat/income
  useEffect(() => {
    if (gameScreen !== 'playing') return;
    const iv = setInterval(() => setShopTick(t => t + 1), 250);
    return () => clearInterval(iv);
  }, [gameScreen]);

  // === Shop callbacks — mutate gameRef directly ===
  const buyRunUpgrade = useCallback((type: string, cost: number) => {
    const game = gameRef.current;
    if (!game || game.goldEarned < cost) return;
    game.goldEarned -= cost;
    game.runUpgrades = { ...game.runUpgrades, [type]: (game.runUpgrades[type] || 0) + 1 };
    const hasTithe = game.artifacts.some((a: any) => a.id === 'tithe');
    if (hasTithe && type.startsWith('passiveIncome') && Math.random() < 0.10) {
      game.runUpgrades[type] = (game.runUpgrades[type] || 0) + 1;
    }
    const hasExpansion = hasTithe && game.artifacts.some((a: any) => a.id === 'decree');
    if (hasExpansion && type !== 'hero' && !type.startsWith('passiveIncome') && Math.random() < 0.10) {
      game.runUpgrades[type] = (game.runUpgrades[type] || 0) + 1;
    }
    if (type === 'hero') {
      const newLevel = game.runUpgrades.hero;
      const cls = getClassDef(game.heroClass);
      const isRanged = cls.attackType === 'ranged';
      const newMaxHp = heroTotalHp(cls.baseStats.hp, newLevel, isRanged);
      const newDmg = heroTotalDmg(cls.baseStats.dmg, newLevel, isRanged);
      const hpGain = newMaxHp - game.hero.maxHealth;
      game.hero.maxHealth = newMaxHp;
      game.hero.health += Math.max(0, hpGain);
      game.hero.damage = newDmg;
      game.hero.defense = cls.baseStats.def + Math.floor(newLevel / (isRanged ? 6 : 3));
    }
    if (type !== 'hero' && !type.startsWith('passiveIncome')) {
      const oldLevel = (game.runUpgrades[type] || 0) - 1;
      const newLevel = game.runUpgrades[type];
      const hpRatio = unitHpMult(newLevel) / unitHpMult(oldLevel);
      const dmgRatio = unitDmgMult(newLevel) / unitDmgMult(oldLevel);
      game.allies = game.allies.map((a: any) => {
        if (a.unitType !== type) return a;
        const newMaxHp = Math.floor(a.maxHealth * hpRatio);
        const hpGain = newMaxHp - a.maxHealth;
        return { ...a, maxHealth: newMaxHp, health: a.health + Math.max(0, hpGain), damage: Math.floor(a.damage * dmgRatio) };
      });
    }
    refreshShop();
  }, [gameRef, refreshShop]);

  const buyRunUpgradeMulti = useCallback((type: string, totalCost: number, levels: number) => {
    if (levels <= 0) return;
    const game = gameRef.current;
    if (!game || game.goldEarned < totalCost) return;
    game.goldEarned -= totalCost;
    const oldLevel = game.runUpgrades[type] || 0;
    game.runUpgrades = { ...game.runUpgrades, [type]: oldLevel + levels };
    const hasTithe = game.artifacts.some((a: any) => a.id === 'tithe');
    if (hasTithe && type.startsWith('passiveIncome') && Math.random() < 0.10) {
      game.runUpgrades[type] = (game.runUpgrades[type] || 0) + 1;
    }
    const hasExpansion = hasTithe && game.artifacts.some((a: any) => a.id === 'decree');
    if (hasExpansion && type !== 'hero' && !type.startsWith('passiveIncome') && Math.random() < 0.10) {
      game.runUpgrades[type] = (game.runUpgrades[type] || 0) + 1;
    }
    if (type === 'hero') {
      const newLevel = game.runUpgrades.hero;
      const cls = getClassDef(game.heroClass);
      const isRanged = cls.attackType === 'ranged';
      const newMaxHp = heroTotalHp(cls.baseStats.hp, newLevel, isRanged);
      const newDmg = heroTotalDmg(cls.baseStats.dmg, newLevel, isRanged);
      const hpGain = newMaxHp - game.hero.maxHealth;
      game.hero.maxHealth = newMaxHp;
      game.hero.health += Math.max(0, hpGain);
      game.hero.damage = newDmg;
      game.hero.defense = cls.baseStats.def + Math.floor(newLevel / (isRanged ? 6 : 3));
    }
    if (type !== 'hero' && !type.startsWith('passiveIncome')) {
      const newLevel = game.runUpgrades[type];
      const hpRatio = unitHpMult(newLevel) / unitHpMult(oldLevel);
      const dmgRatio = unitDmgMult(newLevel) / unitDmgMult(oldLevel);
      game.allies = game.allies.map((a: any) => {
        if (a.unitType !== type) return a;
        const newMaxHp = Math.floor(a.maxHealth * hpRatio);
        const hpGain = newMaxHp - a.maxHealth;
        return { ...a, maxHealth: newMaxHp, health: a.health + Math.max(0, hpGain), damage: Math.floor(a.damage * dmgRatio) };
      });
    }
    refreshShop();
  }, [gameRef, refreshShop]);

  const rollForUnit = useCallback(() => {
    const game = gameRef.current;
    if (!game || game.goldEarned < game.rollCost || game.pendingRoll) return;
    const allowed = (upgrades.unlockedUnits as string[]).filter((t: string) => !(upgrades.disabledUnits as string[] || []).includes(t));
    const randomType = rollUnitType(allowed);
    if (!randomType) return;
    game.goldEarned -= game.rollCost;
    game.pendingRoll = { unitType: randomType, rerollCount: 0 };
    game.unitSlots = [...game.unitSlots, { type: randomType, respawnTimer: 0, alive: true }];
    game.rollCost = Math.floor(game.rollCost * 2.45);
    game.rollCount = game.rollCount + 1;
    game.pendingRoll = null;
    refreshShop();
  }, [gameRef, upgrades, refreshShop]);

  const movePortalForward = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    if (game.challengeId === 'noRetreat') return;
    const maxPortalIndex = game.flags.filter((f: any) => f.captured).length - 1;
    if (maxPortalIndex < 0) return;
    const newPortalIndex = Math.min(game.portalFlagIndex + 1, maxPortalIndex);
    if (newPortalIndex === game.portalFlagIndex) return;
    if (game.hero.targetFlagIndex < newPortalIndex) {
      game.hero.targetFlagIndex = newPortalIndex;
    }
    game.portalFlagIndex = newPortalIndex;
    game.particles = [...game.particles, makeParticle(game.flags[newPortalIndex]?.x || 200, GROUND_Y - 50, 'Portal Moved!', '#a855f7')];
    refreshShop();
  }, [gameRef, refreshShop]);

  const toggleAutoPortal = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    game.autoPortalForward = !game.autoPortalForward;
    refreshShop();
  }, [gameRef, refreshShop]);

  const returnHome = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    game.gameOver = true;
    game.retreated = true;
    onModalEvent();
  }, [gameRef, onModalEvent]);

  // === Prestige shop callbacks ===
  const buyUpgrade = useCallback((type: string, cost: number) => {
    if (gems >= cost) { setGems((prev: number) => prev - cost); setUpgrades((prev: PermanentUpgrades) => ({ ...prev, [type]: ((prev[type] as number) || 0) + 1 })); }
  }, [gems]);

  const buyUnitUnlock = useCallback((unitType: string, cost: number) => {
    if (gems >= cost && !(upgrades.unlockedUnits as string[]).includes(unitType)) {
      setGems((prev: number) => prev - cost);
      setUpgrades((prev: PermanentUpgrades) => ({ ...prev, unlockedUnits: [...(prev.unlockedUnits as string[]), unitType] }));
    }
  }, [gems, upgrades.unlockedUnits]);

  const buyUnitToggle = useCallback((unitType: string, cost: number) => {
    if (gems >= cost && !(upgrades.unitTogglePurchased as string[]).includes(unitType) && unitType !== 'soldier') {
      setGems((prev: number) => prev - cost);
      setUpgrades((prev: PermanentUpgrades) => ({ ...prev, unitTogglePurchased: [...(prev.unitTogglePurchased as string[]), unitType] }));
    }
  }, [gems, upgrades.unitTogglePurchased]);

  const toggleUnitPool = useCallback((unitType: string) => {
    if (!(upgrades.unitTogglePurchased as string[]).includes(unitType) || unitType === 'soldier') return;
    setUpgrades((prev: PermanentUpgrades) => ({
      ...prev,
      disabledUnits: (prev.disabledUnits as string[]).includes(unitType)
        ? (prev.disabledUnits as string[]).filter(u => u !== unitType)
        : [...(prev.disabledUnits as string[]), unitType],
    }));
  }, [upgrades.unitTogglePurchased]);

  const buyShardUpgrade = useCallback((key: string, cost: number) => {
    if (shards >= cost) {
      const def = SHARD_UPGRADES.find(u => u.key === key);
      if (!def || (shardUpgrades[key] || 0) >= def.maxLevel) return;
      setShards((prev: number) => prev - cost);
      setShardUpgrades((prev: ShardUpgrades) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
    }
  }, [shards, shardUpgrades]);

  const buyCosmetic = useCallback((cosmeticId: string, gemCost: number) => {
    if (gems < gemCost) return;
    const owned = (upgrades.ownedCosmetics as string[]) || [];
    if (owned.includes(cosmeticId)) return;
    setGems((g: number) => g - gemCost);
    setUpgrades((prev: PermanentUpgrades) => ({ ...prev, ownedCosmetics: [...((prev.ownedCosmetics as string[]) || []), cosmeticId] }));
  }, [gems, upgrades.ownedCosmetics]);

  const equipCosmetic = useCallback((cosmeticId: string, category: string) => {
    if (category === 'heroSkin') {
      setUpgrades(prev => ({ ...prev, equippedHeroSkin: cosmeticId }));
    } else if (category === 'banner') {
      setUpgrades(prev => ({ ...prev, equippedBanner: cosmeticId }));
    } else if (category === 'unitSkin') {
      if (cosmeticId.startsWith('default_')) {
        const unitType = cosmeticId.slice(8);
        setUpgrades(prev => ({ ...prev, [`unitSkin_${unitType}`]: '' }));
      } else {
        const cosmetic = COSMETICS.find(c => c.id === cosmeticId);
        if (cosmetic?.unitType) {
          setUpgrades(prev => ({ ...prev, [`unitSkin_${cosmetic.unitType}`]: cosmeticId }));
        }
      }
    }
  }, []);

  const buyPet = useCallback((petId: string, gemCost: number) => {
    if (gems < gemCost) return;
    if (petState.ownedPets.includes(petId)) return;
    setGems((g: number) => g - gemCost);
    setPetState(prev => ({ ...prev, ownedPets: [...prev.ownedPets, petId] }));
  }, [gems, petState.ownedPets]);

  const equipPet = useCallback((petId: string) => {
    setPetState(prev => ({ ...prev, equippedPet: prev.equippedPet === petId ? '' : petId }));
  }, []);

  // === Regalia callbacks ===
  const regaliaEquip = useCallback((regalia: Regalia) => {
    setRegaliaState(prev => {
      const slot = regalia.slot;
      const oldEquipped = prev.equipped[slot];
      const newStash = prev.stash.filter(r => r.id !== regalia.id);
      if (oldEquipped) newStash.push(oldEquipped);
      return { ...prev, equipped: { ...prev.equipped, [slot]: regalia }, stash: newStash };
    });
  }, []);

  const regaliaUnequip = useCallback((slot: RegaliaSlot) => {
    setRegaliaState(prev => {
      const item = prev.equipped[slot];
      if (!item) return prev;
      return { ...prev, equipped: { ...prev.equipped, [slot]: null }, stash: [...prev.stash, item] };
    });
  }, []);

  const regaliaSalvage = useCallback((regaliaId: string) => {
    setRegaliaState(prev => {
      const item = prev.stash.find(r => r.id === regaliaId);
      if (!item) return prev;
      const rewards = getSalvageRewards(item.rarity);
      return { ...prev, stash: prev.stash.filter(r => r.id !== regaliaId), essence: prev.essence + rewards.essence, stardust: (prev as any).stardust + rewards.stardust };
    });
  }, []);

  const regaliaSalvageAllCommon = useCallback(() => {
    setRegaliaState(prev => {
      let essGain = 0;
      const newStash = prev.stash.filter(r => {
        if (r.rarity === 'common') { essGain += getSalvageRewards('common').essence; return false; }
        return true;
      });
      return { ...prev, stash: newStash, essence: prev.essence + essGain };
    });
  }, []);

  const regaliaUpgrade = useCallback((regaliaId: string) => {
    setRegaliaState(prev => {
      for (const slot of ['sword', 'shield', 'necklace'] as RegaliaSlot[]) {
        const r = prev.equipped[slot];
        if (r?.id === regaliaId) {
          const cost = getUpgradeCost(r.level);
          if (cost === null || prev.essence < cost) return prev;
          return { ...prev, equipped: { ...prev.equipped, [slot]: levelUpRegalia(r) }, essence: prev.essence - cost };
        }
      }
      return prev;
    });
  }, []);

  const regaliaEnhance = useCallback((regaliaId: string, modIndex: number) => {
    setRegaliaState(prev => {
      for (const slot of ['sword', 'shield', 'necklace'] as RegaliaSlot[]) {
        const r = prev.equipped[slot];
        if (r?.id === regaliaId) {
          const cost = getEnhanceCost(r.modifiers[modIndex]);
          if (!cost) return prev;
          if (prev.essence < cost.essence || (prev as any).stardust < cost.stardust) return prev;
          return { ...prev, equipped: { ...prev.equipped, [slot]: enhanceModifier(r, modIndex) }, essence: prev.essence - cost.essence, stardust: (prev as any).stardust - cost.stardust };
        }
      }
      return prev;
    });
  }, []);

  const regaliaAddStar = useCallback((regaliaId: string, modIndex: number) => {
    setRegaliaState(prev => {
      if ((prev as any).stardust < STAR_COST) return prev;
      for (const slot of ['sword', 'shield', 'necklace'] as RegaliaSlot[]) {
        const r = prev.equipped[slot];
        if (r?.id === regaliaId) {
          const maxStars = getMaxStars(r.rarity);
          if (getTotalStars(r) >= maxStars) return prev;
          return { ...prev, equipped: { ...prev.equipped, [slot]: addStar(r, modIndex) }, stardust: (prev as any).stardust - STAR_COST };
        }
      }
      return prev;
    });
  }, []);

  // === Cloud save handlers ===
  const handleCloudUpload = useCallback(async () => {
    const cooldown = getCloudSaveCooldownRemaining();
    if (cooldown > 0) {
      setCloudSaveMessage(`Please wait ${formatCooldown(cooldown)} before uploading again.`);
      setCloudSaveStatus('error');
      return;
    }
    setCloudSaveStatus('uploading');
    setCloudSaveMessage('');
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setCloudSaveMessage('No save data found.');
      setCloudSaveStatus('error');
      return;
    }
    const result = await uploadCloudSave(raw, (upgrades.playerName as string) || '', 'v2');
    if (result.success) {
      setCloudSavePin(result.pin);
      setCloudSaveStatus('success');
      setCloudSaveMessage('');
      try { localStorage.setItem(CLOUD_SAVE_TS_KEY, String(Date.now())); } catch { /* */ }
    } else {
      setCloudSaveMessage(result.error);
      setCloudSaveStatus('error');
    }
  }, [upgrades.playerName]);

  const handleCloudRestore = useCallback(async () => {
    const pin = cloudSavePinInput.trim();
    if (pin.length !== 6) {
      setCloudSaveMessage('PIN must be 6 characters.');
      setCloudSaveStatus('error');
      return;
    }
    setCloudSaveStatus('downloading');
    setCloudSaveMessage('');
    const result = await downloadCloudSave(pin);
    if (!result.success) {
      setCloudSaveMessage(result.error);
      setCloudSaveStatus('error');
      return;
    }
    try {
      const test = JSON.parse(result.saveData);
      if (!test || typeof test.gems !== 'number') throw new Error('invalid');
    } catch {
      setCloudSaveMessage('Save data is corrupted or invalid.');
      setCloudSaveStatus('error');
      return;
    }
    localStorage.setItem(STORAGE_KEY, result.saveData);
    setCloudSaveMessage(result.playerName !== 'Anonymous' ? `Save restored from ${result.playerName}'s backup!` : 'Save restored successfully!');
    setCloudSaveStatus('success');
    setConfirmRestore(false);
    setCloudSavePinInput('');
    // Reload to apply restored save
    location.reload();
  }, [cloudSavePinInput]);

  // === Achievement claim ===
  const claimAchievement = useCallback((id: string, tier: number) => {
    const def = ACHIEVEMENTS.find(a => a.id === id);
    const reward = def?.tiers[tier - 1]?.reward;
    if (!reward) return;
    if (reward.gems) { setGems((g: number) => g + reward.gems!); setTotalGemsEarned((g: number) => g + reward.gems!); }
    if (reward.shards) { setShards((s: number) => s + reward.shards!); setTotalShardsEarned((s: number) => s + reward.shards!); }
    const claimedTier = def?.singleTier ? 1 : tier;
    setAchievementProgress((prev: any[]) => prev.map((p: any) => p.id === id ? { ...p, claimedTier } : p));
  }, []);

  // === Daily login claim ===
  const claimDailyReward = useCallback(() => {
    if (!dailyClaimAvailable) return;
    const day = dailyLoginDay;
    switch (day) {
      case 0: setBackpack((prev: Backpack) => ({ ...prev, rerollVoucher: Math.min(99, prev.rerollVoucher + 15) })); break;
      case 1: setGems((prev: number) => prev + 30); setTotalGemsEarned((prev: number) => prev + 30); break;
      case 3: setBackpack((prev: Backpack) => {
        const next = { ...prev };
        const keys: ('artifactKey' | 'regaliaKey' | 'challengeKey')[] = ['artifactKey', 'regaliaKey', 'challengeKey'];
        for (let i = 0; i < 3; i++) { const k = keys[Math.floor(Math.random() * keys.length)]; next[k] = Math.min(99, next[k] + 1); }
        return next;
      }); break;
      case 4: setBackpack((prev: Backpack) => ({ ...prev, healingPotion: Math.min(99, prev.healingPotion + 10) })); break;
      case 5: setGems((prev: number) => prev + 50); setTotalGemsEarned((prev: number) => prev + 50); break;
      default: break;
    }
    setLastDailyClaimDate(getTodayString());
    setDailyLoginDay((day + 1) % 7);
  }, [dailyClaimAvailable, dailyLoginDay]);

  // === Game Over handler ===
  const handleGameOver = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;

    // Collect gems and shards from this run
    const gemsEarned = game.gemsThisRun || 0;
    const shardsEarned = game.shardsThisRun || 0;
    if (gemsEarned > 0) {
      setGems((g: number) => g + gemsEarned);
      setTotalGemsEarned((g: number) => g + gemsEarned);
    }
    if (shardsEarned > 0) {
      setShards((s: number) => s + shardsEarned);
      setTotalShardsEarned((s: number) => s + shardsEarned);
    }

    // Update records
    setTotalRuns((r: number) => r + 1);
    setTotalBossesDefeated((b: number) => b + (game.bossesDefeated || 0));
    setTotalFlagsCaptured((f: number) => f + (game.flagsCaptured || 0));
    setTotalPlayTime((t: number) => t + Math.floor((game.frame || 0) / 60));
    if ((game.currentZone || 0) > highestZone) setHighestZone(game.currentZone || 0);
    if ((game.flagsCaptured || 0) > highestFlags) setHighestFlags(game.flagsCaptured || 0);

    // Save to localStorage
    const saveData = {
      gems: gems + gemsEarned, shards: shards + shardsEarned,
      upgrades, shardUpgrades, relicCollection,
      highestZone: Math.max(highestZone, game.currentZone || 0),
      highestFlags: Math.max(highestFlags, game.flagsCaptured || 0),
      totalRuns: totalRuns + 1, totalGemsEarned: totalGemsEarned + gemsEarned,
      totalShardsEarned: totalShardsEarned + shardsEarned,
      totalBossesDefeated: totalBossesDefeated + (game.bossesDefeated || 0),
      totalFlagsCaptured: totalFlagsCaptured + (game.flagsCaptured || 0),
      totalDistance, totalRetreats, totalPlayTime: totalPlayTime + Math.floor((game.frame || 0) / 60),
      achievementProgress, ancientRelicsOwned, ancientRelicCopies, ancientFragments,
      backpack, challengeCompletions, regaliaState, petState,
      dungeonUnlocked, dungeonPityCounter, dungeonMetaUpgrades, dungeonsEntered,
      dailyLoginDay, lastDailyClaimDate, musicClicks,
    };
    try { localStorage.setItem('flag-conquest-save', JSON.stringify(saveData)); } catch {}

    // Mercy reward: consolation bonus when reaching a new personal best (only after first boss)
    if ((game.bossesDefeated || 0) > highestZone && highestZone >= 1) {
      setMercyReward(3);
    }

    // Go to game over screen (death hub)
    setDeathTab('shop');
    setGameScreen('gameover');
  }, [gameRef, gems, shards, upgrades, shardUpgrades, relicCollection,
      highestZone, highestFlags, totalRuns, totalGemsEarned, totalShardsEarned,
      totalBossesDefeated, totalFlagsCaptured, totalDistance, totalRetreats,
      totalPlayTime, achievementProgress, ancientRelicsOwned, ancientRelicCopies,
      ancientFragments, backpack, challengeCompletions, regaliaState, petState,
      dungeonUnlocked, dungeonPityCounter, dungeonMetaUpgrades, dungeonsEntered]);

  // Mercy reward claim
  const claimMercyReward = useCallback(() => {
    if (mercyReward) {
      setGems((g: number) => g + mercyReward);
      setTotalGemsEarned((g: number) => g + mercyReward);
    }
    setMercyReward(null);
  }, [mercyReward]);

  // Auto-transition to void screen on death (like v1 — no popup, direct transition)
  const gameOverFiredRef = useRef(false);
  useEffect(() => {
    const g = gameRef.current;
    if (g?.gameOver && gameScreen === 'playing' && !gameOverFiredRef.current) {
      gameOverFiredRef.current = true;
      // Brief delay before transitioning (lets death register visually)
      const timer = setTimeout(() => {
        handleGameOver();
        gameOverFiredRef.current = false;
      }, 1000);
      return () => { clearTimeout(timer); gameOverFiredRef.current = false; };
    }
  }, [modalTick, gameScreen, handleGameOver]);

  // === Save persistent state whenever it changes ===
  useEffect(() => {
    const saveData = {
      gems, shards, upgrades, shardUpgrades, relicCollection,
      highestZone, highestFlags, totalRuns, totalGemsEarned, totalShardsEarned,
      totalBossesDefeated, totalFlagsCaptured, totalDistance, totalRetreats,
      totalPlayTime, achievementProgress, ancientRelicsOwned, ancientRelicCopies,
      ancientFragments, backpack, challengeCompletions, regaliaState, petState,
      dungeonUnlocked, dungeonPityCounter, dungeonMetaUpgrades, dungeonsEntered,
      dailyLoginDay, lastDailyClaimDate, musicClicks,
    };
    try {
      localStorage.setItem('flag-conquest-save', JSON.stringify(saveData));
      if (saveError) setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [gems, shards, upgrades, shardUpgrades, relicCollection, highestZone, highestFlags,
      totalRuns, totalGemsEarned, totalShardsEarned, totalBossesDefeated, totalFlagsCaptured,
      totalDistance, totalRetreats, totalPlayTime, achievementProgress,
      ancientRelicsOwned, ancientRelicCopies, ancientFragments, backpack,
      challengeCompletions, regaliaState, petState, dungeonUnlocked,
      dungeonPityCounter, dungeonMetaUpgrades, dungeonsEntered,
      dailyLoginDay, lastDailyClaimDate, musicClicks]);

  // =============================================
  // SCREEN ROUTING
  // =============================================

  // --- Splash screen ---
  if (splashPhase === 'studio') {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
        <div style={{ opacity: splashOpacity, transition: 'opacity 0.5s ease-in-out', textAlign: 'center' }}>
          <div style={{ color: '#8a4adf', fontSize: '22px', fontWeight: 'bold', letterSpacing: '6px', textShadow: '0 0 20px rgba(138,74,223,0.6), 0 0 40px rgba(138,74,223,0.3)' }}>
            KARAMILABS
          </div>
          <div style={{ color: '#555', fontSize: '8px', marginTop: '10px', letterSpacing: '3px' }}>
            PRESENTS
          </div>
        </div>
      </div>
    );
  }
  if (splashPhase === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: '#1a1a2e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
        <h1 style={{ color: COLORS.gold, fontSize: '19px', marginBottom: '20px', textShadow: '3px 3px 0 #8b6914', letterSpacing: '2px' }}>FLAG CONQUEST</h1>
        <div style={{ color: '#ccc', fontSize: '13px' }}>Loading...</div>
      </div>
    );
  }

  const game = gameRef.current;

  // --- Playing ---
  if (gameScreen === 'playing') {
    return (
    <div style={{
      width: '100%', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-start',
      background: '#1a1a2e', color: '#fff',
      fontFamily: F,
      padding: '0 4px',
    }}>
      {saveError && (
        <div style={{ width: '100%', maxWidth: '506px', background: '#661111', color: '#ff8888', fontSize: '10px', textAlign: 'center', padding: '4px 8px', flexShrink: 0, fontFamily: F }}>
          {'\u26A0\uFE0F'} Save failed — storage full. Clear browser data or export your save.
        </div>
      )}
      <div style={{
        width: 631, maxWidth: '100%',
        border: `3px solid ${COLORS.panelBorder}`,
        boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
      }}>
      {showFps && (
        <div style={{ position: 'absolute', top: '4px', right: '4px', padding: '2px 6px', background: 'rgba(0,0,0,0.6)', borderRadius: '3px', color: fpsValue >= 50 ? '#44ff44' : fpsValue >= 30 ? '#ffaa00' : '#ff4444', fontSize: '10px', fontFamily: 'monospace', zIndex: 9998, pointerEvents: 'none' }}>{fpsValue} FPS</div>
      )}
      <GameView
        gameRef={gameRef}
        frameRef={frameRef}
        showHpNumbers={showHpNumbers}
        killParticles={killParticles}
        heroClass={String(upgrades.heroSkin || 'warlord')}
        modalTick={modalTick}
        shopTick={shopTick}
        cameraMode={cameraMode}
        onCycleCameraMode={cycleCameraMode}
        setCameraMode={setCameraMode}
        onOpenSettings={() => setSettingsOpen(o => !o)}
        onOpenAchievements={() => setShowAchievements(p => !p)}
        onOpenRelics={() => setShowRelics(p => !p)}
        musicTrack={music.currentTrack}
        musicPaused={music.isPaused}
        onMusicNext={music.nextTrack}
        onMusicPrev={music.prevTrack}
        onMusicToggle={music.togglePause}
        shopTab={shopTab}
        setShopTab={setShopTab}
        upgrades={upgrades}
        shardUpgrades={shardUpgrades}
        challengeCompletions={challengeCompletions}
        relicCollection={relicCollection}
        ancientRelicsOwned={ancientRelicsOwned}
        ancientRelicCopies={ancientRelicCopies}
        highestZone={highestZone}
        highestFlags={highestFlags}
        buyRunUpgrade={buyRunUpgrade}
        buyRunUpgradeMulti={buyRunUpgradeMulti}
        onRoll={rollForUnit}
        movePortalForward={movePortalForward}
        toggleAutoPortal={toggleAutoPortal}
        onReturnHome={returnHome}
        regaliaEquipped={regaliaState.equipped}
        settingsOpen={settingsOpen}
        volume={volume}
        setVolume={setVolume}
        sfxVolume={sfxVolume}
        setSfxVolume={setSfxVolume}
        setShowHpNumbers={setShowHpNumbers}
        setKillParticles={setKillParticles}
        showFps={showFps}
        setShowFps={setShowFps}
        fpsValue={fpsValue}
        keybindings={keybindings}
        setKeybindings={setKeybindings}
        rebindingAction={rebindingAction}
        setRebindingAction={setRebindingAction}
        gems={gems}
        setGems={setGems}
        shards={shards}
        setShards={setShards}
        showBackpack={showBackpack}
        setShowBackpack={setShowBackpack}
        showAchievements={showAchievements}
        setShowAchievements={setShowAchievements}
        showRelics={showRelics}
        setShowRelics={setShowRelics}
        backpack={backpack}
        achievementProgress={achievementProgress}
        onClaimAchievement={claimAchievement}
        onUseConsumable={useConsumable}
        ancientFragments={ancientFragments}
        dungeonUnlocked={dungeonUnlocked}
        musicClicks={musicClicks}
        onMusicClick={handleMusicClick}
        trackSelectorOpen={trackSelectorOpen}
        setTrackSelectorOpen={setTrackSelectorOpen}
        blockedTracks={blockedTracks}
        setBlockedTracks={setBlockedTracks}
        allTracks={music.allTracks}
        playTrack={music.playTrack}
        activeBiome={music.activeBiome}
        devSpawnArtifact={() => {
          const g = gameRef.current; if (!g) return;
          const tier = (['artifactCommon', 'artifactRare', 'artifactLegendary'] as const)[Math.floor(Math.random() * 3)];
          g.chests.push({ id: uid(), x: g.hero.x + 40, y: GROUND_Y - 20, type: tier, value: 0, age: 0 });
        }}
        devSpawnRegalia={(rarity) => {
          const g = gameRef.current; if (!g) return;
          const slots: RegaliaSlot[] = ['sword', 'shield', 'necklace'];
          const slot = slots[Math.floor(Math.random() * slots.length)];
          const r = (rarity as any) || (['common', 'rare', 'legendary'] as const)[Math.floor(Math.random() * 3)];
          const reg = rollRegalia(slot, (g.currentZone || 0) + 1, r);
          g.chests.push({ id: uid(), x: g.hero.x + 40, y: GROUND_Y - 20, type: 'regalia', value: 0, age: 0, regaliaData: reg });
        }}
        devSpawnRelic={() => {
          const g = gameRef.current; if (!g) return;
          const tier = (['relicCommon', 'relicRare', 'relicLegendary'] as const)[Math.floor(Math.random() * 3)];
          g.chests.push({ id: uid(), x: g.hero.x + 40, y: GROUND_Y - 20, type: tier, value: 0, age: 0 });
        }}
        devWarpZone={(z) => {
          const g = gameRef.current; if (!g) return;
          const flags = generateZoneFlags(z);
          g.currentZone = z; g.bossesDefeated = z; g.flagsCaptured = 0; g.flags = flags;
          g.hero.x = flags[0].x - 100; g.hero.health = g.hero.maxHealth; g.hero.targetFlagIndex = 0;
          g.enemies = []; g.enemyArchers = []; g.enemyWraiths = []; g.enemyHounds = []; g.enemyLichs = [];
          g.enemyShadowAssassins = []; g.enemyFlameCallers = []; g.enemyCorruptedSentinels = [];
          g.enemyDungeonRats = []; g.enemyFireImps = []; g.enemyCursedKnights = [];
          g.boss = null; g.projectiles = []; g.chests = []; g.banners = []; g.barricades = [];
          g.cameraX = Math.max(0, flags[0].x - 200); g.portalFlagIndex = -1;
        }}
        devEnterWaveDungeon={() => {
          const g = gameRef.current; if (!g || g.inDungeon) return;
          g.savedMainState = {
            flags: g.flags, enemies: g.enemies, enemyArchers: g.enemyArchers,
            enemyWraiths: g.enemyWraiths, enemyHounds: g.enemyHounds, enemyLichs: g.enemyLichs,
            enemyShadowAssassins: g.enemyShadowAssassins, enemyFlameCallers: g.enemyFlameCallers,
            enemyCorruptedSentinels: g.enemyCorruptedSentinels,
            boss: g.boss, currentZone: g.currentZone, bossesDefeated: g.bossesDefeated,
            goldEarned: g.goldEarned, totalGoldEarned: g.totalGoldEarned,
            flagsCaptured: g.flagsCaptured, lastFlagCaptureFrame: g.lastFlagCaptureFrame,
            portalFlagIndex: g.portalFlagIndex, armyHoldMode: g.armyHoldMode, cameraX: g.cameraX,
            incomeTimer: g.incomeTimer, incomeTimer2: g.incomeTimer2, incomeTimer3: g.incomeTimer3,
            incomeTimer4: g.incomeTimer4, incomeTimer5: g.incomeTimer5,
            incomeTimer6: g.incomeTimer6 || 0, incomeTimer7: g.incomeTimer7 || 0, incomeTimer8: g.incomeTimer8 || 0,
            projectiles: g.projectiles, chests: g.chests, banners: g.banners || [], barricades: g.barricades || [],
            crystalTurrets: g.crystalTurrets || [], iceWalls: g.iceWalls || [], iceTurrets: g.iceTurrets || [],
            smithingBonusStacks: g.smithingBonusStacks || 0,
            gemsThisRun: g.gemsThisRun, shardsThisRun: g.shardsThisRun, relicDrops: g.relicDrops,
            enemiesKilled: g.enemiesKilled, killGoldEarned: g.killGoldEarned || 0,
            eliteKills: g.eliteKills || 0, eliteLastSpawnFrame: g.eliteLastSpawnFrame ?? -99999,
            activeEliteId: g.activeEliteId ?? null, activeEliteVariant: g.activeEliteVariant ?? null,
            lastEliteVariants: g.lastEliteVariants ? [...g.lastEliteVariants] : [],
            unitSlots: g.unitSlots, allies: [...g.allies], hero: { ...g.hero },
            runUpgrades: { ...g.runUpgrades },
          };
          const dungeonFlags = generateDungeonArena();
          const arenaLeftX = dungeonFlags[0].x;
          const arenaRightX = dungeonFlags[3].x;
          const spawnX = arenaRightX + 30;
          const allySpawnX = arenaLeftX + 80;
          const cls = getClassDef(g.heroClass);
          const startingMedals = 1 + dungeonMetaUpgrades.headStart;
          g.inDungeon = true; g.dungeonType = 'wave'; g.armyHoldMode = false;
          g.flags = dungeonFlags;
          g.enemies = []; g.enemyArchers = []; g.enemyWraiths = []; g.enemyHounds = []; g.enemyLichs = [];
          g.enemyShadowAssassins = []; g.enemyFlameCallers = []; g.enemyCorruptedSentinels = [];
          g.enemyDungeonRats = []; g.enemyFireImps = []; g.enemyCursedKnights = [];
          g.boss = null; g.projectiles = []; g.chests = []; g.banners = []; g.barricades = [];
          g.dungeonTicksSpent = 0;
          g.hero.x = allySpawnX; g.hero.targetFlagIndex = -1;
          g.hero.maxHealth = cls.baseStats.hp; g.hero.health = cls.baseStats.hp;
          g.hero.damage = cls.baseStats.dmg; g.hero.defense = cls.baseStats.def; g.hero.speed = cls.baseStats.speed;
          g.runUpgrades = { ...g.runUpgrades, hero: 0, soldier: 0, archer: 0, halberd: 0, knight: 0, wizard: 0, cleric: 0, conjurer: 0, bombard: 0 };
          g.allies = []; g.unitSlots = []; g.portalFlagIndex = -1; g.cameraX = 0;
          g.dungeonWave = 0; g.dungeonWaveTimer = 0; g.dungeonMiningTimer = 0;
          g.dungeonMedals = startingMedals; g.dungeonFragmentsEarned = 0;
          g.dungeonEnemiesAlive = 0; g.dungeonEliteWaveNext = false; g.dungeonBonusMedalAwarded = false;
          g.dungeonArenaLeftX = arenaLeftX; g.dungeonArenaRightX = arenaRightX; g.dungeonArenaSpawnX = spawnX;
          g.dungeonShopOpen = false; g.dungeonTriggerZone = Math.max(g.currentZone, 1);
          g.dungeonTriggerFlags = g.flagsCaptured;
          g.dungeonPortalTimer = 0; g.dungeonPortalFlagId = -1; g.dungeonOver = false;
          g.dungeonMeleeBoost = 0; g.dungeonRangedBoost = 0; g.dungeonMagicBoost = 0;
          g.dungeonAllyMode = 'advance'; g.dungeonUnitsRolled = 0;
        }}
        devEnterTimedDungeon={() => {
          const g = gameRef.current; if (!g || g.inDungeon) return;
          g.savedMainState = {
            flags: g.flags, enemies: g.enemies, enemyArchers: g.enemyArchers,
            enemyWraiths: g.enemyWraiths, enemyHounds: g.enemyHounds, enemyLichs: g.enemyLichs,
            enemyShadowAssassins: g.enemyShadowAssassins, enemyFlameCallers: g.enemyFlameCallers,
            enemyCorruptedSentinels: g.enemyCorruptedSentinels,
            boss: g.boss, currentZone: g.currentZone, bossesDefeated: g.bossesDefeated,
            goldEarned: g.goldEarned, totalGoldEarned: g.totalGoldEarned,
            flagsCaptured: g.flagsCaptured, lastFlagCaptureFrame: g.lastFlagCaptureFrame,
            portalFlagIndex: g.portalFlagIndex, armyHoldMode: g.armyHoldMode, cameraX: g.cameraX,
            incomeTimer: g.incomeTimer, incomeTimer2: g.incomeTimer2, incomeTimer3: g.incomeTimer3,
            incomeTimer4: g.incomeTimer4, incomeTimer5: g.incomeTimer5,
            incomeTimer6: g.incomeTimer6 || 0, incomeTimer7: g.incomeTimer7 || 0, incomeTimer8: g.incomeTimer8 || 0,
            projectiles: g.projectiles, chests: g.chests, banners: g.banners || [], barricades: g.barricades || [],
            crystalTurrets: g.crystalTurrets || [], iceWalls: g.iceWalls || [], iceTurrets: g.iceTurrets || [],
            smithingBonusStacks: g.smithingBonusStacks || 0,
            gemsThisRun: g.gemsThisRun, shardsThisRun: g.shardsThisRun, relicDrops: g.relicDrops,
            enemiesKilled: g.enemiesKilled, killGoldEarned: g.killGoldEarned || 0,
            eliteKills: g.eliteKills || 0, eliteLastSpawnFrame: g.eliteLastSpawnFrame ?? -99999,
            activeEliteId: g.activeEliteId ?? null, activeEliteVariant: g.activeEliteVariant ?? null,
            lastEliteVariants: g.lastEliteVariants ? [...g.lastEliteVariants] : [],
            unitSlots: g.unitSlots, allies: [...g.allies], hero: { ...g.hero },
            runUpgrades: { ...g.runUpgrades },
          };
          const zone = g.currentZone;
          const timedFlags = generateTimedDungeonArena(zone);
          g.inDungeon = true; g.dungeonType = 'timed'; g.armyHoldMode = false;
          g.flags = timedFlags;
          g.enemies = []; g.enemyArchers = []; g.enemyWraiths = []; g.enemyHounds = []; g.enemyLichs = [];
          g.enemyShadowAssassins = []; g.enemyFlameCallers = []; g.enemyCorruptedSentinels = [];
          g.enemyDungeonRats = []; g.enemyFireImps = []; g.enemyCursedKnights = [];
          g.boss = null; g.projectiles = []; g.chests = []; g.banners = []; g.barricades = [];
          g.hero.x = 40; g.hero.targetFlagIndex = -1;
          g.allies = g.allies.map(a => ({ ...a, x: 40 + Math.random() * 30 }));
          g.portalFlagIndex = -1; g.cameraX = 0;
          g.timedDungeonTimer = 18000; g.timedDungeonVictory = false;
          g.timedDungeonPortalTimer = 0; g.timedDungeonPortalFlagId = -1;
          g.dungeonTicksSpent = 0; g.dungeonTriggerZone = zone; g.dungeonTriggerFlags = g.flagsCaptured;
          g.dungeonOver = false;
          g.dungeonWave = 0; g.dungeonWaveTimer = 0; g.dungeonMiningTimer = 0;
          g.dungeonMedals = 0; g.dungeonFragmentsEarned = 0; g.dungeonEnemiesAlive = 0;
          g.dungeonShopOpen = false; g.dungeonPortalTimer = 0; g.dungeonPortalFlagId = -1;
        }}
      />
      {/* Regalia loot notification */}
      {regaliaNotif && (
        <div style={{
          position: 'fixed', top: '40px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(10,5,20,0.95)', border: `2px solid ${REGALIA_RARITY_COLORS[regaliaNotif.rarity]}`,
          borderRadius: '6px', padding: '8px 12px', zIndex: 9999,
          maxWidth: '280px', width: '85%',
          boxShadow: `0 0 20px ${REGALIA_RARITY_COLORS[regaliaNotif.rarity]}66, 0 0 6px ${REGALIA_RARITY_COLORS[regaliaNotif.rarity]}aa`,
          fontFamily: '"Press Start 2P", "Courier New", monospace',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            <div style={{ color: REGALIA_RARITY_COLORS[regaliaNotif.rarity], fontSize: '13px', fontWeight: 'bold', textShadow: `0 0 8px ${REGALIA_RARITY_COLORS[regaliaNotif.rarity]}88` }}>
              {'\u2728'} REGALIA FOUND {'\u2728'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{ fontSize: '21px' }}>{SLOT_ICONS[regaliaNotif.slot]}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: REGALIA_RARITY_COLORS[regaliaNotif.rarity], fontSize: '10px', fontWeight: 'bold' }}>{regaliaNotif.name}</div>
              <div style={{ color: '#aaa', fontSize: '9px', textTransform: 'uppercase' }}>{regaliaNotif.rarity} {regaliaNotif.slot} — Zone {regaliaNotif.zone}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '6px', borderTop: `1px solid ${REGALIA_RARITY_COLORS[regaliaNotif.rarity]}44`, paddingTop: '4px' }}>
            {regaliaNotif.modifiers.map((mod, i) => (
              <div key={i} style={{ color: '#ddd', fontSize: '10px', background: 'rgba(255,255,255,0.06)', padding: '2px 4px', borderRadius: '2px' }}>
                {getModDisplayText(mod, 0)}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button onClick={() => { setRegaliaNotif(null); if (regaliaNotifTimer.current) clearTimeout(regaliaNotifTimer.current); }} style={{
              padding: '3px 14px', fontSize: '8px', fontFamily: 'inherit',
              background: REGALIA_RARITY_COLORS[regaliaNotif.rarity] + '33',
              color: REGALIA_RARITY_COLORS[regaliaNotif.rarity], border: `1px solid ${REGALIA_RARITY_COLORS[regaliaNotif.rarity]}88`,
              borderRadius: '3px', cursor: 'pointer',
            }}>OK</button>
          </div>
        </div>
      )}
      {/* Consumable loot notification */}
      {consumableNotif && (
        <div style={{
          position: 'fixed', top: regaliaNotif ? '180px' : '40px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(10,20,10,0.95)', border: '2px solid #44ffaa',
          transition: 'top 0.3s ease',
          borderRadius: '6px', padding: '8px 14px', zIndex: 9999,
          maxWidth: '220px', width: '70%',
          boxShadow: '0 0 20px #44ffaa44, 0 0 6px #44ffaa88',
          fontFamily: '"Press Start 2P", "Courier New", monospace',
          textAlign: 'center',
        }}>
          <div style={{ color: '#44ffaa', fontSize: '11px', fontWeight: 'bold', textShadow: '0 0 8px #44ffaa66', marginBottom: '4px' }}>
            ITEM FOUND
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span style={{ fontSize: '18px' }}>{consumableNotif.icon}</span>
            <span style={{ color: '#ddd', fontSize: '10px', fontWeight: 'bold' }}>{consumableNotif.name}</span>
          </div>
          <div style={{ marginTop: '6px' }}>
            <button onClick={() => { setConsumableNotif(null); if (consumableNotifTimer.current) clearTimeout(consumableNotifTimer.current); }} style={{
              padding: '3px 14px', fontSize: '8px', fontFamily: 'inherit',
              background: '#44ffaa33', color: '#44ffaa', border: '1px solid #44ffaa88',
              borderRadius: '3px', cursor: 'pointer',
            }}>OK</button>
          </div>
        </div>
      )}
      </div>
    </div>);
  }

  // --- All non-playing screens share this layout ---
  const hasRegalia = regaliaState.stash.length > 0 || Object.values(regaliaState.equipped).some(r => r !== null);
  const hasRelics = Object.keys(relicCollection).length > 0;

  return (
    <div style={{
      width: '100%', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-start',
      background: '#1a1a2e', color: '#fff',
      fontFamily: F,
      padding: '0 4px',
    }}>
      {/* Main content area — bordered game container */}
      <div style={{
        width: 631, maxWidth: '100%', flex: 1,
        display: 'flex', flexDirection: 'column',
        border: `3px solid ${COLORS.panelBorder}`,
        boxSizing: 'border-box',
      }}>

        {/* === MENU === */}
        {gameScreen === 'menu' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 }}>
            <h1 style={{ fontSize: 20, color: COLORS.gold, marginBottom: 20 }}>Flag Conquest</h1>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={startGame} style={{
                padding: '12px 24px', fontSize: 15, fontFamily: F,
                background: COLORS.heroBlue, color: 'white',
                border: `3px solid ${COLORS.heroLight}`, borderRadius: 4,
                cursor: 'pointer', boxShadow: '0 4px 0 #2a6fcc',
              }}>{'\u2694\uFE0F'} START GAME</button>
              <button onClick={() => { settingsReturnTo.current = 'menu'; setGameScreen('settings'); }} style={{
                padding: '12px 24px', fontSize: 15, fontFamily: F,
                background: 'rgba(30,15,50,0.9)', color: 'white',
                border: '3px solid #6a4a9a', borderRadius: 4,
                cursor: 'pointer', boxShadow: '0 4px 0 rgba(40,20,60,0.8)',
              }}>SETTINGS</button>
            </div>
            {/* Music controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 4, gap: 10 }}>
              <span style={{ color: '#777', fontSize: 9, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{music.currentTrack || 'No Track'}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                <span onClick={music.prevTrack} style={{ cursor: 'pointer', color: '#888', fontSize: 11 }}>{'\u25C0'}</span>
                <span onClick={music.togglePause} style={{ cursor: 'pointer', color: COLORS.gold, fontSize: 11 }}>{music.isPaused ? '\u25B6' : '\u23F8'}</span>
                <span onClick={music.nextTrack} style={{ cursor: 'pointer', color: '#888', fontSize: 11 }}>{'\u25B6'}</span>
              </div>
            </div>
          </div>
        )}

        {/* === MODE SELECT === */}
        {gameScreen === 'modeSelect' && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}>
            <div style={{ color: COLORS.gold, fontSize: 17, marginBottom: 6, textAlign: 'center' }}>
              {'\u2694\uFE0F'} GAME MODE
            </div>
            <div style={{ color: '#ccc', fontSize: 12, marginBottom: 20, textAlign: 'center' }}>
              Choose how you want to play:
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 500 }}>
              <button onClick={() => setGameScreen('classSelect')} style={{
                padding: '20px 14px', background: 'linear-gradient(180deg, #3a3a5e 0%, #2a2a4e 100%)',
                border: '3px solid #4a9eff', borderRadius: 10, cursor: 'pointer',
                width: 180, textAlign: 'center', fontFamily: F,
              }}>
                <div style={{ fontSize: 33, marginBottom: 8 }}>{'\u{1F3F0}'}</div>
                <div style={{ color: COLORS.gold, fontSize: 14, marginBottom: 4, fontWeight: 'bold' }}>Conquest</div>
                <div style={{ color: '#4a9eff', fontSize: 10, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>STANDARD</div>
                <div style={{ color: '#ccc', fontSize: 10, lineHeight: 1.5 }}>
                  March through zones, capture flags, defeat bosses, and grow your army.
                </div>
              </button>
              <button onClick={() => { if (backpack.challengeKey > 0) setGameScreen('challengeSelect'); }} style={{
                padding: '20px 14px', background: 'linear-gradient(180deg, #3a2a2e 0%, #2a1a1e 100%)',
                border: `3px solid ${backpack.challengeKey > 0 ? '#ff6644' : '#555'}`, borderRadius: 10,
                cursor: backpack.challengeKey > 0 ? 'pointer' : 'not-allowed',
                width: 180, textAlign: 'center', fontFamily: F,
                opacity: backpack.challengeKey > 0 ? 1 : 0.5, position: 'relative',
              }}>
                {backpack.challengeKey === 0 && (
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: 4,
                  }}>
                    <span style={{ fontSize: 20 }}>{'\u{1F512}'}</span>
                    <span style={{ color: '#888', fontSize: 10, fontFamily: F }}>LOCKED</span>
                    <span style={{ color: '#666', fontSize: 8, fontFamily: F }}>Find a Challenge Key</span>
                  </div>
                )}
                <div style={{ fontSize: 33, marginBottom: 8 }}>{'\u{1F525}'}</div>
                <div style={{ color: COLORS.gold, fontSize: 14, marginBottom: 4, fontWeight: 'bold' }}>Challenge Run</div>
                <div style={{ color: '#ff6644', fontSize: 10, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {backpack.challengeKey > 0 ? `${backpack.challengeKey} KEY${backpack.challengeKey > 1 ? 'S' : ''}` : 'NO KEYS'}
                </div>
                <div style={{ color: '#ccc', fontSize: 10, lineHeight: 1.5 }}>
                  Activate modifiers for unique rewards.
                </div>
              </button>
            </div>
            <button onClick={() => setGameScreen('menu')} style={{
              marginTop: 20, padding: '6px 16px', fontSize: 11, fontFamily: F,
              background: '#555', color: '#ccc', border: '2px solid #777', borderRadius: 4, cursor: 'pointer',
            }}>BACK</button>
          </div>
        )}

        {/* === CHALLENGE SELECT === */}
        {gameScreen === 'challengeSelect' && (
          <ChallengeSelect
            onSelect={(id) => {
              setBackpack(prev => ({ ...prev, challengeKey: Math.max(0, prev.challengeKey - 1) }));
              setSelectedChallenge(id);
              setGameScreen('classSelect');
            }}
            onBack={() => setGameScreen('modeSelect')}
            keysAvailable={backpack.challengeKey}
            completions={challengeCompletions}
          />
        )}

        {/* === CLASS SELECT === */}
        {gameScreen === 'classSelect' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <ClassPicker onSelect={selectClass} highestZone={highestZone} />
          </div>
        )}

        {/* === GAME OVER === */}
        {gameScreen === 'gameover' && (
          <>
            {/* Void scene container — stats + buttons overlaid on top (matches old project) */}
            <div style={{ position: 'relative', border: '2px solid #8a4adf', borderRadius: 4, overflow: 'hidden' }}>
              {/* Void scene background */}
              <VoidScene game={game} upgrades={upgrades} highestZone={highestZone} highestFlags={highestFlags} />

              {/* Overlay: stats + buttons (absolutely positioned over void scene) */}
              <div style={{ position: 'absolute', inset: 0, zIndex: 15, fontFamily: F, pointerEvents: 'none' }}>
                {/* Side icon buttons */}
                <div style={{ position: 'absolute', top: 80, right: 6, display: 'flex', flexDirection: 'column', gap: 5, pointerEvents: 'auto', zIndex: 1 }}>
                  <button onClick={() => setShowAchievements(prev => !prev)} style={{ background: 'rgba(20,15,30,0.85)', border: '1.5px solid #6a4a9a', borderRadius: 6, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 0, fontSize: 18, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }}>
                    {'\u{1F3C6}'}
                    {getUnclaimedCount(achievementProgress) > 0 && (
                      <span style={{ position: 'absolute', top: -4, right: -4, background: '#ff4444', color: '#fff', fontSize: 8, fontFamily: 'inherit', fontWeight: 'bold', borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fff' }}>{getUnclaimedCount(achievementProgress)}</span>
                    )}
                  </button>
                  {totalConsumables(backpack) > 0 && (
                    <button onClick={() => setShowBackpack(prev => !prev)} style={{ background: 'rgba(20,15,30,0.85)', border: '1.5px solid #6a4a9a', borderRadius: 6, width: 34, height: 34, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 0, fontSize: 18, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }}>
                      {'\u{1F392}'}
                      <span style={{ fontSize: 7, color: '#aaa', fontFamily: 'inherit', lineHeight: 1, marginTop: -2 }}>{totalConsumables(backpack)}</span>
                    </button>
                  )}
                  {highestZone >= 1 && (
                    <button onClick={() => setShowDailyLogin(prev => !prev)} style={{ background: dailyClaimAvailable ? 'rgba(40,30,10,0.9)' : 'rgba(20,15,30,0.85)', border: `1.5px solid ${dailyClaimAvailable ? '#ffd700' : '#6a4a9a'}`, borderRadius: 6, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 0, fontSize: 18, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }}>
                      {'\u{1F4C5}'}
                      {dailyClaimAvailable && (
                        <span style={{ position: 'absolute', top: -4, right: -4, background: '#ffd700', borderRadius: '50%', width: 10, height: 10, border: '1px solid #fff' }} />
                      )}
                    </button>
                  )}
                  <button onClick={() => setShowLeaderboard(true)} title="Leaderboard" style={{ background: 'rgba(20,15,30,0.85)', border: '1.5px solid #6a4a9a', borderRadius: 6, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontSize: 16, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))', opacity: 0.7 }}>
                    {'\u{1F4CA}'}
                  </button>
                </div>

                {/* Compact stats panel */}
                <div style={{ position: 'absolute', top: 6, left: 6, right: 6, pointerEvents: 'auto' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(30,12,50,0.95) 0%, rgba(15,8,25,0.95) 100%)',
                    border: '2px solid #8a4adf', borderRadius: 8, padding: '10px 14px',
                    position: 'relative', overflow: 'hidden',
                    boxShadow: '0 0 16px rgba(138,74,223,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 15% 40%, rgba(138,74,223,0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.4), transparent)', pointerEvents: 'none' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                      <div>
                        <div style={{
                          color: game.retreated ? '#ffaa44' : '#ff4444', fontSize: 16, fontWeight: 'bold', marginBottom: 4,
                          textShadow: `0 0 12px ${game.retreated ? 'rgba(255,170,68,0.4)' : 'rgba(255,68,68,0.4)'}`,
                        }}>{game.retreated ? 'RETREATED' : 'GAME OVER'}{(game.playerName || upgrades.playerName) ? `, ${game.playerName || upgrades.playerName}` : ''}</div>
                        <div style={{ color: '#ccc', fontSize: 10, lineHeight: 1.5 }}>
                          Zone {(game.currentZone || 0) + 1} | {game.flagsCaptured}{'\u{1F6A9}'} | {formatNumber(game.totalGoldEarned || game.goldEarned)}{'\u{1F4B0}'} | {game.enemiesKilled || 0}{'\u{1F480}'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#c084fc', fontSize: 11, fontWeight: 'bold', textShadow: '0 0 8px rgba(168,85,247,0.3)' }}>
                          <span title="Gems earned this run" style={{ cursor: 'help' }}>{'\u{1F48E}'}+{game.gemsThisRun || 0}</span>{'  '}
                          <span title="Prestige Shards earned this run" style={{ cursor: 'help' }}>{'\u{1F52E}'}+{(game.shardsThisRun || 0) + (game.prestigeShardsAwarded || 0)}</span>
                        </div>
                        {/* Music controls */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, gap: 8 }}>
                          <span style={{ color: '#777', fontSize: 8, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{music.currentTrack || 'No Track'}</span>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                            <span onClick={music.prevTrack} style={{ cursor: 'pointer', color: '#888', fontSize: 9 }}>{'\u25C0'}</span>
                            <span onClick={music.togglePause} style={{ cursor: 'pointer', color: COLORS.gold, fontSize: 9 }}>{music.isPaused ? '\u25B6' : '\u23F8'}</span>
                            <span onClick={music.nextTrack} style={{ cursor: 'pointer', color: '#888', fontSize: 9 }}>{'\u25B6'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {game.challengeId && game.challengeLevel > 0 && (
                      <div style={{ color: '#4aff4a', fontSize: 11, marginTop: 4, textShadow: '0 0 8px rgba(74,255,74,0.4)', fontWeight: 'bold' }}>
                        {getChallengeDef(game.challengeId).icon} CHALLENGE LV.{game.challengeLevel} COMPLETE! {getChallengeDef(game.challengeId).rewardName}
                        {(() => { const prevLv = challengeCompletions[game.challengeId!] || 0; if (game.challengeLevel <= prevLv) return null; const sp = getChallengeShardsPerLevel(getChallengeDef(game.challengeId!).stars); const delta = sp * (game.challengeLevel - prevLv); return delta > 0 ? <span style={{ color: '#c084fc', marginLeft: 6 }}>{'\u{1F52E}'}+{delta}</span> : null; })()}
                      </div>
                    )}
                    {game.challengeId && game.challengeLevel === 0 && (
                      <div style={{ color: '#ff6644', fontSize: 11, marginTop: 4 }}>
                        {getChallengeDef(game.challengeId).icon} Challenge Failed
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons (fixed below stats panel) */}
                <div style={{ position: 'absolute', top: 100, left: 0, right: 0, display: 'flex', gap: 8, justifyContent: 'center', pointerEvents: 'auto' }}>
                  <button onClick={startGame} style={{
                    padding: '6px 16px', fontSize: 13, fontFamily: F, fontWeight: 'bold',
                    background: COLORS.heroBlue, color: 'white',
                    border: `2px solid ${COLORS.heroLight}`, borderRadius: 5,
                    cursor: 'pointer', boxShadow: '0 0 10px rgba(59,130,246,0.3)',
                  }}>{'\u{1F504}'} PLAY AGAIN</button>
                  <button onClick={() => { settingsReturnTo.current = 'gameover'; setGameScreen('settings'); }} style={{
                    padding: '6px 16px', fontSize: 13, fontFamily: F,
                    background: 'rgba(30,15,50,0.9)', color: 'white',
                    border: '2px solid #6a4a9a', borderRadius: 5, cursor: 'pointer',
                  }}>SETTINGS</button>
                </div>

                {/* Overlay panels */}
                {showAchievements && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'auto', overflow: 'auto' }}>
                    <AchievementPanel
                      achievementProgress={achievementProgress}
                      stats={{ totalRuns, totalFlagsCaptured, highestZone, totalBossesDefeated, totalDistance, totalPlayTime, totalRetreats, musicClicks }}
                      onClaim={claimAchievement}
                      onClose={() => setShowAchievements(false)}
                    />
                  </div>
                )}
                {showBackpack && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'auto', overflow: 'auto' }}>
                    <BackpackPanel
                      backpack={backpack}
                      gems={gems}
                      shards={shards}
                      onClose={() => setShowBackpack(false)}
                      onUseConsumable={() => {}}
                      canUseMidRun={false}
                      dungeonUnlocked={dungeonUnlocked}
                      inDungeon={false}
                    />
                  </div>
                )}
                {showDailyLogin && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'auto', overflow: 'auto' }}>
                    <DailyLoginPanel
                      currentDay={dailyLoginDay}
                      canClaim={dailyClaimAvailable}
                      onClaim={claimDailyReward}
                      onClose={() => setShowDailyLogin(false)}
                    />
                  </div>
                )}
                {showLeaderboard && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'auto', overflow: 'auto' }}>
                    <LeaderboardPanel
                      onClose={() => setShowLeaderboard(false)}
                      highlightName={(upgrades.playerName as string) || ''}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Death hub tabs */}
            <div style={{
              display: 'flex', gap: 0,
              background: 'linear-gradient(135deg, rgba(30,12,50,0.95) 0%, rgba(15,8,25,0.95) 100%)',
              flexShrink: 0, borderTop: '1px solid rgba(138,74,223,0.3)',
            }}>
              {([
                { key: 'shop' as const, label: '\u{1F3EA} SHOP', color: COLORS.gold, locked: false },
                { key: 'regalia' as const, label: '\u{1F451} REGALIA', color: '#ff88cc', locked: !hasRegalia },
                { key: 'relics' as const, label: '\u{1F3FA} RELICS', color: '#c084fc', locked: !hasRelics },
              ]).map(t => (
                <button key={t.key} onClick={t.locked ? undefined : () => setDeathTab(t.key)} style={{
                  flex: 1, padding: '6px 10px', fontSize: 12, fontFamily: F, fontWeight: 'bold',
                  background: deathTab === t.key && !t.locked ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: t.locked ? '#333' : deathTab === t.key ? t.color : '#666',
                  border: 'none', borderBottom: deathTab === t.key && !t.locked ? `3px solid ${t.color}` : '3px solid transparent',
                  cursor: t.locked ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                  opacity: t.locked ? 0.5 : 1,
                }}>{t.locked ? '\u{1F512} ' + t.label : t.label}</button>
              ))}
            </div>

            {/* Death hub content */}
            <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'linear-gradient(180deg, rgba(20,10,35,0.95) 0%, rgba(12,6,20,0.95) 100%)' }}>
              {deathTab === 'shop' && (
                <PrestigeShop
                  gems={gems} shards={shards} upgrades={upgrades} shardUpgrades={shardUpgrades}
                  challengeCompletions={challengeCompletions}
                  buyUpgrade={buyUpgrade} buyUnitUnlock={buyUnitUnlock}
                  buyUnitToggle={buyUnitToggle} toggleUnitPool={toggleUnitPool}
                  buyShardUpgrade={buyShardUpgrade} onBack={() => {}}
                  seenShopTabs={seenShopTabs} onTabSeen={(tab) => seenShopTabs.add(tab)}
                  buyCosmetic={buyCosmetic} equipCosmetic={equipCosmetic}
                  buyPet={buyPet} equipPet={equipPet} petState={petState}
                />
              )}
              {deathTab === 'regalia' && (
                <RegaliaPanel
                  regaliaState={regaliaState}
                  onEquip={regaliaEquip}
                  onUnequip={regaliaUnequip}
                  onSalvage={regaliaSalvage}
                  onSalvageAllCommon={regaliaSalvageAllCommon}
                  onUpgrade={regaliaUpgrade}
                  onEnhance={regaliaEnhance}
                  onAddStar={regaliaAddStar}
                />
              )}
              {deathTab === 'relics' && (
                <RelicPanel
                  relicCollection={relicCollection}
                  onClose={() => {}}
                  ancientFragments={ancientFragments}
                  dungeonUnlocked={dungeonUnlocked}
                  onOpenForge={() => {}}
                  ancientRelicsOwned={ancientRelicsOwned}
                  ancientRelicCopies={ancientRelicCopies}
                  inline
                />
              )}
            </div>

            {/* Mercy reward modal */}
            {mercyReward !== null && (
              <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 100, fontFamily: F,
              }}>
                <div style={{
                  background: 'rgba(20,15,30,0.95)', border: '2px solid #B8860B',
                  borderRadius: 8, padding: '24px 32px', textAlign: 'center', maxWidth: 320,
                }}>
                  <div style={{ color: '#B8860B', fontSize: 14, marginBottom: 8 }}>ADVISOR</div>
                  <div style={{ color: '#a89cc8', fontSize: 11, lineHeight: '1.6', marginBottom: 16 }}>
                    You made it further than before... your effort was not in vain!
                  </div>
                  <div style={{ color: '#a855f7', fontSize: 19, marginBottom: 20 }}>
                    +{mercyReward} {'\u{1F48E}'}
                  </div>
                  <button onClick={claimMercyReward} style={{
                    padding: '12px 32px', fontSize: 14, fontFamily: F, fontWeight: 'bold',
                    background: '#B8860B', color: '#fff', border: '2px solid #8B6508',
                    borderRadius: 4, cursor: 'pointer',
                  }}>
                    CONTINUE
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* === SETTINGS === */}
        {gameScreen === 'settings' && (
          <div style={{ padding: 12, width: '100%', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ color: COLORS.gold, fontSize: 15 }}>SETTINGS</span>
              <button onClick={() => { setGameScreen(settingsReturnTo.current); setConfirmReset(false); }} style={{
                padding: '6px 16px', fontSize: 12, fontFamily: F,
                background: 'rgba(20,15,30,0.85)', color: '#aaa',
                border: '2px solid #6a4a9a', borderRadius: 4, cursor: 'pointer',
              }}>BACK</button>
            </div>

            {/* Music volume */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#ccc', fontSize: 12, marginBottom: 8 }}>MUSIC VOLUME: {Math.round(volume * 100)}%</div>
              <input type="range" min="0" max="100" value={Math.round(volume * 100)}
                onChange={e => setVolume(Number(e.target.value) / 100)}
                style={{ width: '100%', accentColor: COLORS.heroBlue }} />
            </div>

            {/* SFX volume */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#ccc', fontSize: 12, marginBottom: 8 }}>SFX VOLUME: {Math.round(sfxVolume * 100)}%</div>
              <input type="range" min="0" max="100" value={Math.round(sfxVolume * 100)}
                onChange={e => setSfxVolume(Number(e.target.value) / 100)}
                style={{ width: '100%', accentColor: COLORS.gold }} />
            </div>

            {/* Display */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#ccc', fontSize: 12, marginBottom: 8 }}>DISPLAY</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={showHpNumbers} onChange={e => setShowHpNumbers(e.target.checked)} style={{ accentColor: COLORS.heroBlue, width: 16, height: 16 }} />
                <span style={{ color: '#ccc', fontSize: 11 }}>Show HP numbers on units</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 6 }}>
                <input type="checkbox" checked={killParticles} onChange={e => setKillParticles(e.target.checked)} style={{ accentColor: COLORS.heroBlue, width: 16, height: 16 }} />
                <span style={{ color: '#ccc', fontSize: 11 }}>Kill particles</span>
              </label>
            </div>

            {/* Controls */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#ccc', fontSize: 12, marginBottom: 8 }}>CONTROLS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ACTION_ORDER.map(action => (
                  <div key={action} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#ccc', fontSize: 10, width: 85, flexShrink: 0 }}>{ACTION_LABELS[action]}</span>
                    <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                      {keybindings[action].map((k, i) => (
                        <span key={i} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 2,
                          padding: '2px 6px', fontSize: 10, fontFamily: F,
                          background: 'rgba(20,15,30,0.85)', color: COLORS.gold,
                          border: '1px solid rgba(138,74,223,0.5)', borderRadius: 3,
                        }}>
                          {displayKey(k)}
                          <span onClick={() => setKeybindings(prev => ({ ...prev, [action]: prev[action].filter((_: string, j: number) => j !== i) }))} style={{ cursor: 'pointer', color: '#ff6666', fontSize: 9, marginLeft: 2 }}>{'\u00d7'}</span>
                        </span>
                      ))}
                    </div>
                    {rebindingAction === action ? (
                      <span style={{ color: '#ffaa44', fontSize: 10 }}>Press a key... <span onClick={() => setRebindingAction(null)} style={{ cursor: 'pointer', color: '#aaa', textDecoration: 'underline' }}>Cancel</span></span>
                    ) : (
                      <button onClick={() => setRebindingAction(action)} style={{
                        padding: '2px 8px', fontSize: 10, fontFamily: F,
                        background: 'rgba(20,15,30,0.85)', color: '#aaa',
                        border: '1px solid rgba(138,74,223,0.3)', borderRadius: 3, cursor: 'pointer',
                      }}>Rebind</button>
                    )}
                  </div>
                ))}
                <button onClick={() => setKeybindings({ ...DEFAULT_KEYBINDINGS })} style={{
                  marginTop: 6, padding: '4px 12px', fontSize: 10, fontFamily: F,
                  background: 'rgba(255,60,60,0.15)', color: '#ff6666',
                  border: '1px solid rgba(255,60,60,0.4)', borderRadius: 3, cursor: 'pointer', alignSelf: 'flex-start',
                }}>RESET DEFAULTS</button>
              </div>
            </div>

            {/* Leaderboard */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#ccc', fontSize: 12, marginBottom: 8 }}>LEADERBOARD</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={leaderboardOptIn} onChange={e => setLeaderboardOptIn(e.target.checked)} style={{ accentColor: COLORS.heroBlue, width: 16, height: 16 }} />
                <span style={{ color: '#ccc', fontSize: 11 }}>Auto-submit runs to global leaderboard</span>
              </label>
              {!upgrades.playerName && leaderboardOptIn && (
                <div style={{ color: '#ffaa44', fontSize: 10, marginTop: 4 }}>Set a player name in Settings to appear on the leaderboard.</div>
              )}
            </div>

            {/* Cloud Save */}
            <div style={{ borderTop: '1px solid rgba(138,74,223,0.25)', paddingTop: 16, marginBottom: 16 }}>
              <div style={{ color: COLORS.gold, fontSize: 12, marginBottom: 12 }}>CLOUD SAVE</div>
              <div style={{ marginBottom: 12 }}>
                <button
                  onClick={handleCloudUpload}
                  disabled={cloudSaveStatus === 'uploading'}
                  style={{
                    padding: '8px 16px', fontSize: 11, fontFamily: F,
                    background: 'rgba(74,159,255,0.15)', color: COLORS.heroBlue,
                    border: '2px solid rgba(74,159,255,0.4)', borderRadius: 4,
                    cursor: cloudSaveStatus === 'uploading' ? 'default' : 'pointer',
                    opacity: cloudSaveStatus === 'uploading' ? 0.6 : 1,
                    width: '100%',
                  }}
                >
                  {cloudSaveStatus === 'uploading' ? 'UPLOADING...' : 'UPLOAD SAVE TO CLOUD'}
                </button>
                {cloudSaveStatus === 'success' && cloudSavePin && (
                  <div style={{ marginTop: 8, padding: 8, background: 'rgba(74,255,74,0.1)', border: '1px solid rgba(74,255,74,0.3)', borderRadius: 4, textAlign: 'center' }}>
                    <div style={{ color: '#66cc66', fontSize: 10, marginBottom: 4 }}>Your PIN code:</div>
                    <div style={{ color: COLORS.gold, fontSize: 18, letterSpacing: 4, fontFamily: F }}>{cloudSavePin}</div>
                    <div style={{ color: '#888', fontSize: 9, marginTop: 4 }}>Write this down! You need it to restore your save.</div>
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ color: '#ccc', fontSize: 11, marginBottom: 6 }}>Restore from PIN:</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    maxLength={6}
                    value={cloudSavePinInput}
                    onChange={e => setCloudSavePinInput(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ''))}
                    placeholder="XXXXXX"
                    style={{
                      flex: 1, padding: 8, fontSize: 14, fontFamily: F,
                      background: 'rgba(20,15,30,0.85)', color: '#ccc',
                      border: '2px solid #6a4a9a', borderRadius: 4,
                      letterSpacing: 4, textAlign: 'center',
                    }}
                  />
                  {!confirmRestore ? (
                    <button
                      onClick={() => {
                        if (cloudSavePinInput.trim().length === 6) setConfirmRestore(true);
                        else { setCloudSaveMessage('PIN must be 6 characters.'); setCloudSaveStatus('error'); }
                      }}
                      disabled={cloudSaveStatus === 'downloading'}
                      style={{
                        padding: '8px 16px', fontSize: 11, fontFamily: F,
                        background: 'rgba(255,170,68,0.15)', color: '#ffaa44',
                        border: '2px solid rgba(255,170,68,0.4)', borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      RESTORE
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={handleCloudRestore}
                        disabled={cloudSaveStatus === 'downloading'}
                        style={{
                          padding: '8px 12px', fontSize: 11, fontFamily: F,
                          background: '#ff4422', color: 'white',
                          border: '2px solid #ff6644', borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        {cloudSaveStatus === 'downloading' ? '...' : 'CONFIRM'}
                      </button>
                      <button
                        onClick={() => setConfirmRestore(false)}
                        style={{
                          padding: '8px 12px', fontSize: 11, fontFamily: F,
                          background: 'rgba(20,15,30,0.85)', color: '#aaa',
                          border: '2px solid #6a4a9a', borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        CANCEL
                      </button>
                    </div>
                  )}
                </div>
                {confirmRestore && (
                  <div style={{ color: '#ff6666', fontSize: 9, marginTop: 4 }}>
                    This will OVERWRITE your current save. Are you sure?
                  </div>
                )}
              </div>
              {cloudSaveMessage && (
                <div style={{
                  color: cloudSaveStatus === 'error' ? '#ff6666' : '#66cc66',
                  fontSize: 10, marginTop: 6,
                }}>
                  {cloudSaveMessage}
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div style={{ borderTop: '1px solid rgba(138,74,223,0.25)', paddingTop: 16 }}>
              <div style={{ color: '#ff6666', fontSize: 12, marginBottom: 8 }}>DANGER ZONE</div>
              {!confirmReset ? (
                <button onClick={() => setConfirmReset(true)} style={{
                  padding: '8px 16px', fontSize: 12, fontFamily: F,
                  background: '#661111', color: '#ff6666',
                  border: '2px solid #ff4444', borderRadius: 4, cursor: 'pointer',
                }}>RESET SAVE</button>
              ) : (
                <div>
                  <div style={{ color: '#ff6666', fontSize: 11, marginBottom: 8 }}>This will erase ALL progress (gems, upgrades, runs). Are you sure?</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => {
                      localStorage.removeItem(STORAGE_KEY);
                      localStorage.removeItem('flag-conquest-settings');
                      localStorage.removeItem('flag-conquest-keybindings');
                      localStorage.removeItem('flag-conquest-leaderboard-optin');
                      location.reload();
                    }} style={{
                      padding: '8px 16px', fontSize: 12, fontFamily: F,
                      background: '#ff2222', color: 'white',
                      border: '2px solid #ff4444', borderRadius: 4, cursor: 'pointer',
                    }}>YES, RESET</button>
                    <button onClick={() => setConfirmReset(false)} style={{
                      padding: '8px 16px', fontSize: 12, fontFamily: F,
                      background: 'rgba(20,15,30,0.85)', color: '#aaa',
                      border: '2px solid #6a4a9a', borderRadius: 4, cursor: 'pointer',
                    }}>CANCEL</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
