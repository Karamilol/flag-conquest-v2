import { useEffect, useRef, useCallback, useState } from 'react';
import { VIEWPORT_W, getBiome } from '../constants';
import type { GameState, GameScreen } from '../types';
import type { Biome } from '../constants';

// ---- Playlist definitions ----

const MENU_TRACKS = [
  'music/Menu/Bounce It.mp3',
  'music/Menu/Secretly Vibing.mp3',
  'music/Menu/Welcome To Flag Conquest.mp3',
];

const BOSS_TRACKS = [
  'music/Boss/Hit It.mp3',
  'music/Boss/In The Forest.mp3',
  'music/Boss/Pixel Hellscape.mp3',
  'music/Boss/Uh Oh!.mp3',
];

const DEATH_TRACKS = [
  'music/Death Screen/Between.mp3',
  'music/Death Screen/Drifting.mp3',
  'music/Death Screen/Hope.mp3',
  'music/Death Screen/Time To Rest.mp3',
];

export const BIOME_TRACKS: Record<Biome, string[]> = {
  forest: [
    'music/Forest/Clearing.mp3',
    'music/Forest/Deep Green Cinema.mp3',
    'music/Forest/Dusk March.mp3',
    'music/Forest/Goblin Country.mp3',
    'music/Forest/Moss & Stone.mp3',
    'music/Forest/Sunlit Canopy.mp3',
    'music/Forest/The Flag Road.mp3',
    'music/Forest/Undergrowth.mp3',
  ],
  cave: [
    'music/Cave/Cavern Entrance.mp3',
    'music/Cave/Crystal Hollow.mp3',
    'music/Cave/Descent.mp3',
    'music/Cave/Hollow Light.mp3',
    'music/Cave/Stalactite.mp3',
    'music/Cave/Ore Road.mp3',
    'music/Cave/Wraith Territory.mp3',
    'music/Cave/Deep Resonance.mp3',
  ],
  nordic: [
    "music/Nordic/Channel N' March.mp3",
    'music/Nordic/Hearth In The Cold.mp3',
    'music/Nordic/Nornveil.mp3',
    'music/Nordic/Rimewood Hymn.mp3',
    'music/Nordic/Skydrift Runechant.mp3',
    'music/Nordic/Something In The Snow.mp3',
    'music/Nordic/Thinking About Warmth.mp3',
    'music/Nordic/Winter Waltz.mp3',
  ],
  volcanic: [], // Placeholder — falls back to nordic tracks until volcanic music is added
};

// ---- Constants ----

const CROSSFADE_MS = 500;
const TRANSITION_MS = 800;
const MENU_VOLUME = 0.45;
const GAME_VOLUME = 0.45;
const BOSS_VOLUME = 0.55;

// ---- Helpers ----

function shuffleIndices(length: number): number[] {
  const a = Array.from({ length }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Track active fades per element so we can cancel previous ones
const activeFades = new Map<HTMLAudioElement, ReturnType<typeof setInterval>>();

function fadeAudio(audio: HTMLAudioElement, targetVol: number, durationMs: number) {
  // Cancel any existing fade on this element first
  const existing = activeFades.get(audio);
  if (existing) { clearInterval(existing); activeFades.delete(audio); }

  const startVol = audio.volume;
  const diff = targetVol - startVol;
  if (Math.abs(diff) < 0.01) { audio.volume = targetVol; if (targetVol === 0) audio.pause(); return; }
  const steps = Math.max(1, Math.floor(durationMs / 30));
  const stepSize = diff / steps;
  let step = 0;
  const interval = setInterval(() => {
    step++;
    if (step >= steps) {
      audio.volume = targetVol;
      clearInterval(interval);
      activeFades.delete(audio);
      if (targetVol === 0) audio.pause();
    } else {
      audio.volume = Math.max(0, Math.min(1, startVol + stepSize * step));
    }
  }, 30);
  activeFades.set(audio, interval);
}

/** Extract a display name from a track path or full URL: "music/Forest/Forest Canopy.mp3" -> "Forest Canopy" */
function trackDisplayName(src: string): string {
  try {
    const decoded = decodeURIComponent(src);
    const filename = decoded.split('/').pop() ?? decoded;
    return filename.replace(/\.mp3$/i, '');
  } catch {
    const filename = src.split('/').pop() ?? src;
    return filename.replace(/\.mp3$/i, '').replace(/%20/g, ' ').replace(/%27/g, "'").replace(/%26/g, '&');
  }
}

// ---- Hook ----

export function useMusicManager(gameState: GameScreen, game: GameState, volume: number = 1, blockedTracks: string[] = []) {
  // Audio element refs
  const menuAudio = useRef<HTMLAudioElement | null>(null);
  const gameAudio = useRef<HTMLAudioElement | null>(null);
  const bossAudio = useRef<HTMLAudioElement | null>(null);
  const blockedRef = useRef(blockedTracks);
  blockedRef.current = blockedTracks;

  // Playlist state refs
  const menuOrder = useRef<number[]>(shuffleIndices(MENU_TRACKS.length));
  const menuIndex = useRef(0);

  const currentBiome = useRef<Biome>('forest');
  const gameOrder = useRef<number[]>(shuffleIndices(BIOME_TRACKS.forest.length));
  const gameTrackIndex = useRef(0);

  const bossOrder = useRef<number[]>(shuffleIndices(BOSS_TRACKS.length));
  const bossTrackIndex = useRef(0);

  const deathOrder = useRef<number[]>(shuffleIndices(DEATH_TRACKS.length));
  const deathIndex = useRef(0);

  // Boss/biome transition state
  const wasBossVisible = useRef(false);
  const savedGameTime = useRef(0);
  const prevScreen = useRef<GameScreen>('menu');
  const initialized = useRef(false);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Active channel tracking for display name
  const activeChannel = useRef<'menu' | 'game' | 'boss' | 'death'>('menu');
  // Track current boss src to avoid resetting playback
  const currentBossSrc = useRef('');

  // Audio readiness state — triggers effects after first user gesture creates audio elements
  const [audioReady, setAudioReady] = useState(false);

  // Pause state
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);

  // Current track name for UI (reactive)
  const [currentTrack, setCurrentTrack] = useState('');

  // Active biome for UI (reactive — lets TrackSelector show which biome is playing)
  const [activeBiome, setActiveBiome] = useState<Biome>('forest');

  // ---- Helpers to get current track src ----

  const getCurrentGameSrc = useCallback((): string => {
    const biome = currentBiome.current;
    const tracks = BIOME_TRACKS[biome].length > 0 ? BIOME_TRACKS[biome] : BIOME_TRACKS.nordic;
    const idx = gameOrder.current[gameTrackIndex.current % gameOrder.current.length];
    return tracks[idx];
  }, []);

  const getCurrentMenuSrc = useCallback((): string => {
    const idx = menuOrder.current[menuIndex.current % menuOrder.current.length];
    return MENU_TRACKS[idx];
  }, []);

  const getCurrentBossSrc = useCallback((): string => {
    const idx = bossOrder.current[bossTrackIndex.current % bossOrder.current.length];
    return BOSS_TRACKS[idx];
  }, []);

  const getCurrentDeathSrc = useCallback((): string => {
    const idx = deathOrder.current[deathIndex.current % deathOrder.current.length];
    return DEATH_TRACKS[idx];
  }, []);

  // ---- Update the display name based on what is audible ----

  const updateTrackName = useCallback(() => {
    const ch = activeChannel.current;
    if (ch === 'boss' && bossAudio.current?.src) {
      setCurrentTrack(trackDisplayName(bossAudio.current.src));
    } else if (ch === 'game' && gameAudio.current?.src) {
      setCurrentTrack(trackDisplayName(gameAudio.current.src));
    } else if ((ch === 'menu' || ch === 'death') && menuAudio.current?.src) {
      setCurrentTrack(trackDisplayName(menuAudio.current.src));
    }
  }, []);

  // ---- Advance functions ----

  const advanceMenuTrack = useCallback(() => {
    const menu = menuAudio.current;
    if (!menu) return;
    for (let attempt = 0; attempt < MENU_TRACKS.length; attempt++) {
      menuIndex.current++;
      if (menuIndex.current >= menuOrder.current.length) {
        menuOrder.current = shuffleIndices(MENU_TRACKS.length);
        menuIndex.current = 0;
      }
      if (!blockedRef.current.includes(getCurrentMenuSrc())) break;
    }
    menu.src = getCurrentMenuSrc();
    menu.volume = MENU_VOLUME * volumeRef.current;
    menu.play().catch(() => {});
    updateTrackName();
  }, [getCurrentMenuSrc, updateTrackName]);

  const advanceDeathTrack = useCallback(() => {
    const menu = menuAudio.current;
    if (!menu) return;
    for (let attempt = 0; attempt < DEATH_TRACKS.length; attempt++) {
      deathIndex.current++;
      if (deathIndex.current >= deathOrder.current.length) {
        deathOrder.current = shuffleIndices(DEATH_TRACKS.length);
        deathIndex.current = 0;
      }
      if (!blockedRef.current.includes(getCurrentDeathSrc())) break;
    }
    menu.src = getCurrentDeathSrc();
    menu.volume = MENU_VOLUME * volumeRef.current;
    menu.play().catch(() => {});
    updateTrackName();
  }, [getCurrentDeathSrc, updateTrackName]);

  const advanceGameTrack = useCallback(() => {
    const ga = gameAudio.current;
    if (!ga) return;
    // Don't auto-advance game music during boss fight
    if (wasBossVisible.current) return;
    const biomeLen = (BIOME_TRACKS[currentBiome.current].length || BIOME_TRACKS.nordic.length);
    for (let attempt = 0; attempt < biomeLen; attempt++) {
      gameTrackIndex.current++;
      if (gameTrackIndex.current >= gameOrder.current.length) {
        gameOrder.current = shuffleIndices(biomeLen);
        gameTrackIndex.current = 0;
      }
      if (!blockedRef.current.includes(getCurrentGameSrc())) break;
    }
    ga.src = getCurrentGameSrc();
    ga.volume = 0;
    ga.play().catch(() => {});
    fadeAudio(ga, GAME_VOLUME * volumeRef.current, 1500);
    updateTrackName();
  }, [getCurrentGameSrc, updateTrackName]);

  const advanceBossTrack = useCallback(() => {
    const boss = bossAudio.current;
    if (!boss) return;
    // Don't advance if boss fight is over (boss died / left view)
    if (!wasBossVisible.current || activeChannel.current !== 'boss') return;
    for (let attempt = 0; attempt < BOSS_TRACKS.length; attempt++) {
      bossTrackIndex.current++;
      if (bossTrackIndex.current >= bossOrder.current.length) {
        bossOrder.current = shuffleIndices(BOSS_TRACKS.length);
        bossTrackIndex.current = 0;
      }
      if (!blockedRef.current.includes(getCurrentBossSrc())) break;
    }
    const newSrc = getCurrentBossSrc();
    boss.src = newSrc;
    currentBossSrc.current = newSrc;
    boss.volume = BOSS_VOLUME * volumeRef.current;
    boss.play().catch(() => {});
    updateTrackName();
  }, [getCurrentBossSrc, updateTrackName]);

  // ---- Init audio elements ----

  const initAudio = useCallback(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Menu audio
    const menu = new Audio(getCurrentMenuSrc());
    menu.loop = false;
    menu.volume = MENU_VOLUME * volumeRef.current;
    menuAudio.current = menu;
    menu.onended = () => setTimeout(() => {
      if (activeChannel.current === 'death' || gameStateRef.current === 'gameover') advanceDeathTrack();
      else advanceMenuTrack();
    }, 3000);
    activeChannel.current = 'menu';
    // Don't play here — let screen transition effect start the right music
    // based on current gameState (prevents menu music leaking into gameplay
    // when "Start Game" is the first user gesture)
    updateTrackName();

    // Game audio
    const ingame = new Audio(getCurrentGameSrc());
    ingame.volume = 0;
    gameAudio.current = ingame;

    // Fade out near end of track, then advance
    ingame.addEventListener('timeupdate', () => {
      if (ingame.duration && ingame.currentTime > ingame.duration - 2) {
        const remaining = ingame.duration - ingame.currentTime;
        ingame.volume = Math.max(0, (remaining / 2) * GAME_VOLUME * volumeRef.current);
      }
    });
    ingame.addEventListener('ended', () => setTimeout(advanceGameTrack, 3000));

    // Boss audio
    const boss = new Audio(getCurrentBossSrc());
    boss.loop = false;
    boss.volume = 0;
    bossAudio.current = boss;
    boss.addEventListener('ended', () => setTimeout(advanceBossTrack, 3000));

    // Signal readiness — triggers screen transition effect to start appropriate music
    setAudioReady(true);
  }, [getCurrentMenuSrc, getCurrentGameSrc, getCurrentBossSrc, advanceMenuTrack, advanceGameTrack, advanceBossTrack]);

  // ---- Volume changes ----

  useEffect(() => {
    if (!initialized.current) return;
    const menu = menuAudio.current;
    const ga = gameAudio.current;
    const boss = bossAudio.current;

    if (menu && !menu.paused) menu.volume = MENU_VOLUME * volume;
    if (ga && !ga.paused && ga.volume > 0) ga.volume = GAME_VOLUME * volume;
    if (boss && !boss.paused && boss.volume > 0) boss.volume = BOSS_VOLUME * volume;
  }, [volume]);

  // ---- Lazy init on first user interaction ----

  useEffect(() => {
    const kickstart = () => {
      initAudio();
      document.removeEventListener('click', kickstart);
      document.removeEventListener('keydown', kickstart);
    };
    document.addEventListener('click', kickstart);
    document.addEventListener('keydown', kickstart);
    return () => {
      document.removeEventListener('click', kickstart);
      document.removeEventListener('keydown', kickstart);
    };
  }, [initAudio, updateTrackName]);

  // ---- Screen transitions ----

  useEffect(() => {
    if (!audioReady || !initialized.current) return;
    const menu = menuAudio.current;
    const ga = gameAudio.current;
    const boss = bossAudio.current;
    if (!menu || !ga || !boss) return;

    const v = volumeRef.current;
    const prev = prevScreen.current;
    prevScreen.current = gameState;

    if (gameState === 'playing' && prev !== 'playing') {
      // Entering gameplay: stop menu, start game music
      menu.pause();
      menu.volume = 0;
      const existingMenuFade = activeFades.get(menu);
      if (existingMenuFade) { clearInterval(existingMenuFade); activeFades.delete(menu); }

      // Determine starting biome
      const biome = getBiome(game.currentZone);
      currentBiome.current = biome;
      setActiveBiome(biome);
      gameOrder.current = shuffleIndices(BIOME_TRACKS[biome].length || BIOME_TRACKS.nordic.length);
      gameTrackIndex.current = 0;

      ga.src = getCurrentGameSrc();
      ga.volume = 0;
      ga.play().catch(() => {});
      fadeAudio(ga, GAME_VOLUME * v, TRANSITION_MS);

      // Reset boss state
      wasBossVisible.current = false;
      boss.pause();
      boss.volume = 0;
      bossOrder.current = shuffleIndices(BOSS_TRACKS.length);
      bossTrackIndex.current = 0;

      activeChannel.current = 'game';
      updateTrackName();
    } else if (gameState !== 'playing' && prev === 'playing') {
      // Leaving gameplay: fade out game/boss
      fadeAudio(ga, 0, TRANSITION_MS);
      fadeAudio(boss, 0, TRANSITION_MS);
      wasBossVisible.current = false;

      if (gameState === 'gameover') {
        // Death screen: play death tracks
        deathOrder.current = shuffleIndices(DEATH_TRACKS.length);
        deathIndex.current = 0;
        menu.src = getCurrentDeathSrc();
        menu.volume = 0;
        menu.play().catch(() => {});
        fadeAudio(menu, MENU_VOLUME * v, TRANSITION_MS);
        menu.onended = () => setTimeout(advanceDeathTrack, 3000);
        activeChannel.current = 'death';
      } else {
        // Menu / other screens: play menu tracks
        menuOrder.current = shuffleIndices(MENU_TRACKS.length);
        menuIndex.current = 0;
        menu.src = getCurrentMenuSrc();
        menu.volume = 0;
        menu.play().catch(() => {});
        fadeAudio(menu, MENU_VOLUME * v, TRANSITION_MS);
        menu.onended = () => setTimeout(advanceMenuTrack, 3000);
        activeChannel.current = 'menu';
      }
      updateTrackName();
    } else if (gameState === 'gameover' && prev !== 'gameover' && prev !== 'playing') {
      // Transitioning to gameover from a non-playing screen (e.g. upgrade → gameover)
      deathOrder.current = shuffleIndices(DEATH_TRACKS.length);
      deathIndex.current = 0;
      menu.src = getCurrentDeathSrc();
      menu.volume = MENU_VOLUME * v;
      menu.play().catch(() => {});
      menu.onended = () => setTimeout(advanceDeathTrack, 3000);
      activeChannel.current = 'death';
      updateTrackName();
    } else if (gameState !== 'playing' && gameState !== 'gameover' && activeChannel.current === 'death') {
      // Left death screen back to menu: switch to menu tracks
      menuOrder.current = shuffleIndices(MENU_TRACKS.length);
      menuIndex.current = 0;
      menu.src = getCurrentMenuSrc();
      menu.volume = MENU_VOLUME * v;
      menu.play().catch(() => {});
      menu.onended = () => setTimeout(advanceMenuTrack, 3000);
      activeChannel.current = 'menu';
      updateTrackName();
    } else if (gameState !== 'playing' && gameState !== 'gameover' && menu.paused) {
      // Audio just initialized on a non-playing screen — start menu music
      menu.volume = MENU_VOLUME * v;
      menu.play().catch(() => {});
      activeChannel.current = 'menu';
      updateTrackName();
    }
  }, [gameState, audioReady]);

  // ---- Biome transitions (based on currentZone) ----

  useEffect(() => {
    if (!initialized.current || gameState !== 'playing') return;
    const ga = gameAudio.current;
    if (!ga) return;
    if (wasBossVisible.current) return; // Don't switch biomes during boss fight

    const newBiome = getBiome(game.currentZone);
    if (newBiome === currentBiome.current) return;

    // Biome changed: crossfade to new playlist
    currentBiome.current = newBiome;
    setActiveBiome(newBiome);
    gameOrder.current = shuffleIndices(BIOME_TRACKS[newBiome].length || BIOME_TRACKS.nordic.length);
    gameTrackIndex.current = 0;

    const v = volumeRef.current;
    fadeAudio(ga, 0, CROSSFADE_MS);

    setTimeout(() => {
      ga.src = getCurrentGameSrc();
      ga.volume = 0;
      ga.play().catch(() => {});
      fadeAudio(ga, GAME_VOLUME * v, CROSSFADE_MS);
      updateTrackName();
    }, CROSSFADE_MS);
  }, [game.currentZone, gameState, getCurrentGameSrc, updateTrackName]);

  // ---- Boss visibility: crossfade between game and boss music ----

  useEffect(() => {
    if (!initialized.current || gameState !== 'playing') return;
    const ga = gameAudio.current;
    const boss = bossAudio.current;
    if (!ga || !boss) return;

    const v = volumeRef.current;
    const bossVisible = !!(
      game.boss && game.boss.health > 0
      && game.boss.x >= game.cameraX
      && game.boss.x <= game.cameraX + VIEWPORT_W
    );

    if (bossVisible && !wasBossVisible.current) {
      // Boss entered view: save game position, crossfade to boss
      wasBossVisible.current = true;
      savedGameTime.current = ga.currentTime;
      fadeAudio(ga, 0, CROSSFADE_MS);

      // Only assign src if it changed — prevents resetting playback position
      const newBossSrc = getCurrentBossSrc();
      if (currentBossSrc.current !== newBossSrc) {
        boss.src = newBossSrc;
        currentBossSrc.current = newBossSrc;
      }
      boss.volume = 0;
      boss.play().catch(() => {});
      fadeAudio(boss, BOSS_VOLUME * v, CROSSFADE_MS);
      activeChannel.current = 'boss';
      updateTrackName();
    } else if (!bossVisible && wasBossVisible.current) {
      // Boss left view or died
      wasBossVisible.current = false;
      fadeAudio(boss, 0, CROSSFADE_MS);

      // Check if biome changed during boss fight (boss defeated → zone advanced)
      const newBiome = getBiome(game.currentZone);
      if (newBiome !== currentBiome.current) {
        // Biome changed: start new biome playlist instead of resuming old track
        currentBiome.current = newBiome;
        setActiveBiome(newBiome);
        gameOrder.current = shuffleIndices(BIOME_TRACKS[newBiome].length || BIOME_TRACKS.nordic.length);
        gameTrackIndex.current = 0;
        ga.src = getCurrentGameSrc();
      } else {
        // Same biome: resume where we left off
        ga.currentTime = savedGameTime.current;
      }

      ga.volume = 0;
      if (ga.paused) ga.play().catch(() => {});
      fadeAudio(ga, GAME_VOLUME * v, CROSSFADE_MS);
      activeChannel.current = 'game';
      updateTrackName();
    }
  }, [game.boss, game.cameraX, gameState, getCurrentBossSrc, updateTrackName]);

  // ---- Cleanup on unmount ----

  useEffect(() => {
    return () => {
      menuAudio.current?.pause();
      gameAudio.current?.pause();
      bossAudio.current?.pause();
    };
  }, []);

  // ---- Player controls ----

  const getActiveAudio = useCallback((): HTMLAudioElement | null => {
    const boss = bossAudio.current;
    const ga = gameAudio.current;
    const menu = menuAudio.current;

    if (boss && !boss.paused && boss.volume > 0) return boss;
    if (ga && !ga.paused && ga.volume > 0) return ga;
    if (menu && !menu.paused && menu.volume > 0) return menu;
    return null;
  }, []);

  const getActiveCategory = useCallback((): 'boss' | 'game' | 'menu' | 'death' | null => {
    return activeChannel.current;
  }, []);

  const nextTrack = useCallback(() => {
    // Force death tracks on gameover screen regardless of activeChannel state
    if (gameStateRef.current === 'gameover') { advanceDeathTrack(); activeChannel.current = 'death'; return; }
    const cat = getActiveCategory();
    if (cat === 'boss') advanceBossTrack();
    else if (cat === 'game') advanceGameTrack();
    else if (cat === 'death') advanceDeathTrack();
    else if (cat === 'menu') advanceMenuTrack();
  }, [getActiveCategory, advanceBossTrack, advanceGameTrack, advanceDeathTrack, advanceMenuTrack]);

  const prevTrack = useCallback(() => {
    // Force death tracks on gameover screen regardless of activeChannel state
    if (gameStateRef.current === 'gameover') {
      const menu = menuAudio.current;
      if (!menu) return;
      deathIndex.current = (deathIndex.current - 2 + deathOrder.current.length) % deathOrder.current.length;
      advanceDeathTrack();
      activeChannel.current = 'death';
      return;
    }
    const cat = getActiveCategory();
    if (cat === 'boss') {
      const boss = bossAudio.current;
      if (!boss) return;
      bossTrackIndex.current = (bossTrackIndex.current - 2 + bossOrder.current.length) % bossOrder.current.length;
      advanceBossTrack();
    } else if (cat === 'game') {
      const ga = gameAudio.current;
      if (!ga) return;
      gameTrackIndex.current = (gameTrackIndex.current - 2 + gameOrder.current.length) % gameOrder.current.length;
      advanceGameTrack();
    } else if (cat === 'death') {
      const menu = menuAudio.current;
      if (!menu) return;
      deathIndex.current = (deathIndex.current - 2 + deathOrder.current.length) % deathOrder.current.length;
      advanceDeathTrack();
    } else if (cat === 'menu') {
      const menu = menuAudio.current;
      if (!menu) return;
      menuIndex.current = (menuIndex.current - 2 + menuOrder.current.length) % menuOrder.current.length;
      advanceMenuTrack();
    }
  }, [getActiveCategory, advanceBossTrack, advanceGameTrack, advanceDeathTrack, advanceMenuTrack]);

  const togglePause = useCallback(() => {
    const ch = activeChannel.current;
    const audio = ch === 'boss' ? bossAudio.current : ch === 'game' ? gameAudio.current : menuAudio.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
      isPausedRef.current = false;
      setIsPaused(false);
    } else {
      audio.pause();
      isPausedRef.current = true;
      setIsPaused(true);
    }
  }, []);

  const playTrack = useCallback((path: string) => {
    const ch = activeChannel.current;
    const audio = ch === 'boss' ? bossAudio.current : ch === 'game' ? gameAudio.current : menuAudio.current;
    if (!audio) return;
    audio.src = path;
    audio.play().catch(() => {});
    isPausedRef.current = false;
    setIsPaused(false);
    setCurrentTrack(trackDisplayName(path));
  }, []);

  const allTracks = {
    menu: MENU_TRACKS,
    death: DEATH_TRACKS,
    boss: BOSS_TRACKS,
    forest: BIOME_TRACKS.forest,
    cave: BIOME_TRACKS.cave,
    nordic: BIOME_TRACKS.nordic,
    volcanic: BIOME_TRACKS.volcanic,
  };

  return {
    currentTrack,
    nextTrack,
    prevTrack,
    togglePause,
    isPaused,
    playTrack,
    allTracks,
    activeBiome,
  };
}
