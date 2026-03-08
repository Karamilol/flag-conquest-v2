import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, PermanentUpgrades, GameScreen } from '../types';
import { STEPS, TUTORIAL_DONE, type HighlightKey } from './tutorialData';
import type { TutorialDialogue } from './tutorialData';
import { getSkillDef } from '../skills';

export interface TutorialHighlights {
  roll: boolean;
  heroUpgrade: boolean;
  income: boolean;
  retreatButton: boolean;
  portalTab: boolean;
  forwardButton: boolean;
  backButton: boolean;
  skillButton: boolean;
}

const NO_HIGHLIGHTS: TutorialHighlights = {
  roll: false, heroUpgrade: false, income: false, retreatButton: false,
  portalTab: false, forwardButton: false, backButton: false, skillButton: false,
};

export interface TutorialEngineState {
  currentStepId: string | null;
  dialogueIndex: number;
  showingDialogue: boolean;
  waitingForAction: boolean;
  highlights: TutorialHighlights;
  currentDialogue: TutorialDialogue | null;
  darkOverlay: boolean;
}

interface EngineActions {
  advanceDialogue: () => void;
  submitName: (name: string) => void;
}

/**
 * Tutorial engine hook — manages the full tutorial state machine.
 *
 * Spec order: intro → hire → forward → battleWarning → economy → upgrade → secondUnit → pushToFlag
 *
 * Reads `upgrades.tutorialStep` to know where the player is.
 * Writes to `setUpgrades` to persist progress.
 * Sets `tutorialDialogueVisible` on game state to pause the game during dialogues.
 */
export function useTutorialEngine(
  gameScreen: GameScreen,
  game: GameState,
  upgrades: PermanentUpgrades,
  setGame: React.Dispatch<React.SetStateAction<GameState>>,
  setUpgrades: (fn: (prev: PermanentUpgrades) => PermanentUpgrades) => void,
  setPlayerName: (name: string) => void,
  setShopTab?: (tab: string) => void,
  regaliaCount: number = 0,
): [TutorialEngineState, EngineActions] {
  const tutorialStep = upgrades.tutorialStep as number;

  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [showingDialogue, setShowingDialogue] = useState(false);
  const [waitingForAction, setWaitingForAction] = useState(false);

  // Track previous game values for transition detection
  const prevRef = useRef({
    unitCount: 0,
    heroLevel: 0,
    flagsCaptured: 0,
    heroHpRatio: 1,
    incomeLevel: 0,
    retreated: false,
    portalFlagIndex: -1,
    skillEquipped: 0,
    targetFlagIndex: -1,
    bossesDefeated: 0,
    artifactCount: 0,
    activeEliteVariant: null as string | null,
    eliteKills: 0,
  });

  // ── Utility: start a step ────────────────────────────────────
  const startStep = useCallback((stepId: string) => {
    const step = STEPS[stepId];
    if (!step) return;
    setCurrentStepId(stepId);
    setDialogueIndex(0);
    setShowingDialogue(step.dialogues.length > 0);
    setWaitingForAction(false);
    // Persist step
    setUpgrades(prev => ({ ...prev, tutorialStep: step.persistAs }));
    // Pause game during dialogue
    if (step.dialogues.length > 0) {
      setGame(prev => ({ ...prev, tutorialDialogueVisible: true }));
    }
    // Auto-switch shop tab for relevant steps
    if (stepId === 'economy' && setShopTab) {
      setShopTab('income');
    } else if (stepId === 'upgrade' && setShopTab) {
      setShopTab('units');
    }
  }, [setUpgrades, setGame, setShopTab]);

  // ── Utility: start an event prompt (doesn't write tutorialStep) ──
  const startEventPrompt = useCallback((stepId: string) => {
    const step = STEPS[stepId];
    if (!step) return;
    setCurrentStepId(stepId);
    setDialogueIndex(0);
    setShowingDialogue(step.dialogues.length > 0);
    setWaitingForAction(false);
    // Pause game during dialogue
    if (step.dialogues.length > 0) {
      setGame(prev => ({ ...prev, tutorialDialogueVisible: true }));
    }
  }, [setGame]);

  const finishDialogues = useCallback(() => {
    setShowingDialogue(false);
    setWaitingForAction(true);
    setGame(prev => ({ ...prev, tutorialDialogueVisible: false }));
  }, [setGame]);

  const completeTutorial = useCallback(() => {
    setCurrentStepId(null);
    setShowingDialogue(false);
    setWaitingForAction(false);
    setUpgrades(prev => ({ ...prev, tutorialStep: TUTORIAL_DONE }));
    setGame(prev => ({ ...prev, tutorialDialogueVisible: false }));
  }, [setUpgrades, setGame]);

  // ── Advance dialogue (tap to continue) ───────────────────────
  const advanceDialogue = useCallback(() => {
    if (!currentStepId || !showingDialogue) return;
    const step = STEPS[currentStepId];
    if (!step) return;

    const nextIdx = dialogueIndex + 1;
    if (nextIdx < step.dialogues.length) {
      setDialogueIndex(nextIdx);
    } else {
      // All dialogues done
      if (step.autoComplete) {
        // Event prompts: clear entirely, no waitingForAction
        setCurrentStepId(null);
        setShowingDialogue(false);
        setWaitingForAction(false);
        setGame(prev => ({ ...prev, tutorialDialogueVisible: false, bossDeathFlash: false }));
      } else if (currentStepId === 'combatStarted') {
        // combatStarted is a brief reaction — finish and go to awaitBattle
        finishDialogues();
        setCurrentStepId('awaitBattle');
        setWaitingForAction(true);
      } else {
        finishDialogues();
      }
    }
  }, [currentStepId, dialogueIndex, showingDialogue, finishDialogues, setGame]);

  // ── Name submission (Step 1) ─────────────────────────────────
  const submitName = useCallback((name: string) => {
    setPlayerName(name);
    setUpgrades(prev => ({ ...prev, playerName: name }));
    setGame(prev => ({ ...prev, playerName: name }));
    // Advance past the name input dialogue
    advanceDialogue();
  }, [setPlayerName, setUpgrades, setGame, advanceDialogue]);

  // ── Step 1 trigger: fresh save starts playing ────────────────
  useEffect(() => {
    if (gameScreen !== 'playing') return;
    if (tutorialStep === 0 && upgrades.playerName === '') {
      // Fresh save — start intro
      startStep('intro');
    } else if (tutorialStep === 0 && upgrades.playerName !== '') {
      // Returning player who played before tutorial existed — skip
      setUpgrades(prev => ({ ...prev, tutorialStep: TUTORIAL_DONE }));
    }
  }, [gameScreen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Transition detection: watch game state for step advances ─
  useEffect(() => {
    if (gameScreen !== 'playing' || tutorialStep >= TUTORIAL_DONE) return;
    if (showingDialogue) return; // Don't advance while dialogues are showing

    const prev = prevRef.current;
    const unitCount = game.unitSlots.length;
    const heroLevel = game.runUpgrades.hero;
    const flagsCaptured = game.flagsCaptured;
    const heroHpRatio = game.hero.maxHealth > 0 ? game.hero.health / game.hero.maxHealth : 1;
    const incomeLevel = game.runUpgrades.passiveIncome;
    const retreated = game.retreated;
    const portalFlagIndex = game.portalFlagIndex;
    const skillEquipped = game.heroSkills.equippedSkills.length;
    const targetFlagIndex = game.hero.targetFlagIndex;

    // After intro finishes → hire
    if (currentStepId === 'intro' && waitingForAction) {
      startStep('hire');
    }
    // Step 2: Player hired first unit → forward
    else if (currentStepId === 'hire' && waitingForAction && unitCount > prev.unitCount && unitCount >= 1) {
      startStep('forward');
    }
    // Step 3: Player moved forward → combatStarted reaction
    else if (currentStepId === 'forward' && waitingForAction && targetFlagIndex >= 0 && prev.targetFlagIndex < 0) {
      startStep('combatStarted');
    }
    // awaitBattle: watch for HP drop, flag capture, or death
    else if (currentStepId === 'awaitBattle' && waitingForAction) {
      if (flagsCaptured > prev.flagsCaptured && flagsCaptured >= 1) {
        // Player captured flag before battle warning — early capture path
        startStep('earlyCapture');
      } else if (heroHpRatio <= 0.7 && heroHpRatio < prev.heroHpRatio) {
        startStep('battleWarning');
      }
    }
    // Step 4 branching: after battle warning dialogues
    else if (currentStepId === 'battleWarning' && waitingForAction) {
      if (flagsCaptured > prev.flagsCaptured && flagsCaptured >= 1) {
        startStep('earlyCapture');
      } else if (targetFlagIndex < prev.targetFlagIndex) {
        startStep('economy');
      } else if (game.gameOver) {
        completeTutorial();
      } else if (heroHpRatio <= 0.5 && heroHpRatio < prev.heroHpRatio) {
        startStep('stubbornWarning');
      }
    }
    // After stubborn warning: same branches as battle warning
    else if (currentStepId === 'stubbornWarning' && waitingForAction) {
      if (flagsCaptured > prev.flagsCaptured && flagsCaptured >= 1) {
        startStep('earlyCapture');
      } else if (targetFlagIndex < prev.targetFlagIndex) {
        startStep('economy');
      } else if (game.gameOver) {
        completeTutorial();
      }
    }
    // Step 5: Player bought income → upgrade
    else if (currentStepId === 'economy' && waitingForAction && incomeLevel > prev.incomeLevel) {
      startStep('upgrade');
    }
    // Step 6: Player upgraded hero → secondUnit
    else if (currentStepId === 'upgrade' && waitingForAction && heroLevel > prev.heroLevel) {
      startStep('secondUnit');
    }
    // Step 7: Player hired second unit → pushToFlag
    else if (currentStepId === 'secondUnit' && waitingForAction && unitCount > prev.unitCount) {
      startStep('pushToFlag');
    }
    // Step 8: Player captured first flag → flagCaptured
    else if (currentStepId === 'pushToFlag' && waitingForAction && flagsCaptured > prev.flagsCaptured && flagsCaptured >= 1) {
      startStep('flagCaptured');
    }
    // After flag captured: check for 2nd flag + portal
    else if ((currentStepId === 'flagCaptured' || currentStepId === 'earlyCapture') && waitingForAction) {
      if (flagsCaptured >= 2 && portalFlagIndex <= 0) {
        startStep('portal');
      }
    }
    // Step 10: Player moved portal → tutorial complete
    else if (currentStepId === 'portal' && waitingForAction && portalFlagIndex > prev.portalFlagIndex && portalFlagIndex >= 1) {
      completeTutorial();
    }

    // Update prev ref
    prevRef.current = {
      unitCount,
      heroLevel,
      flagsCaptured,
      heroHpRatio,
      incomeLevel,
      retreated,
      portalFlagIndex,
      skillEquipped,
      targetFlagIndex,
      bossesDefeated: game.bossesDefeated,
      artifactCount: game.artifacts.length,
      activeEliteVariant: game.activeEliteVariant,
      eliteKills: game.eliteKills,
    };
  }); // runs every render to catch game state changes

  // ── Event prompt detection (independent of linear tutorial) ──
  useEffect(() => {
    if (gameScreen !== 'playing' && gameScreen !== 'gameover') return;

    // Dungeon tutorial can interrupt linear tutorial (dungeon is high-priority)
    if (game.inDungeon && !upgrades.dungeonTutorialShown && !showingDialogue) {
      startEventPrompt('dungeonEntry');
      setUpgrades(p => ({ ...p, dungeonTutorialShown: 1 }));
      return;
    }

    // Clear stagnation prompt once player retreats or captures a new flag
    if (currentStepId === 'stagnationReset' && waitingForAction) {
      if (gameScreen === 'gameover' || game.retreated || game.flagsCaptured > prevRef.current.flagsCaptured) {
        setCurrentStepId(null);
        setWaitingForAction(false);
      }
      return;
    }

    if (showingDialogue || currentStepId) return; // One prompt at a time

    // First death tutorial — introduce prestige shop tabs
    if (gameScreen === 'gameover' && !upgrades.firstDeathTutShown && tutorialStep >= TUTORIAL_DONE) {
      startEventPrompt('firstDeath');
      setUpgrades(p => ({ ...p, firstDeathTutShown: 1 }));
      return;
    }

    const prev = prevRef.current;

    // 1. First boss kill
    if (game.bossesDefeated >= 1 && !upgrades.firstBossKillShown) {
      setGame(g => ({ ...g, bossDeathFlash: true }));
      startEventPrompt('firstBossKill');
      setUpgrades(p => ({ ...p, firstBossKillShown: 1 }));
      return;
    }

    // 2. Skill type detection (active vs passive/triggered)
    const skillEquipped = game.heroSkills.equippedSkills.length;
    if (skillEquipped > prev.skillEquipped && skillEquipped >= 1) {
      const lastSkillId = game.heroSkills.equippedSkills[skillEquipped - 1];
      const skillDef = getSkillDef(lastSkillId);
      if (skillDef) {
        if (skillDef.type === 'active' && !upgrades.firstActiveSkillShown) {
          startEventPrompt('firstActiveSkill');
          setUpgrades(p => ({ ...p, firstActiveSkillShown: 1 }));
          return;
        } else if ((skillDef.type === 'passive' || skillDef.type === 'triggered') && !upgrades.firstPassiveSkillShown) {
          startEventPrompt('firstPassiveSkill');
          setUpgrades(p => ({ ...p, firstPassiveSkillShown: 1 }));
          return;
        }
      }
    }

    // 3. First regalia collected
    if (regaliaCount > 0 && !upgrades.regaliaPickupShown) {
      startEventPrompt('regaliaPickup');
      setUpgrades(p => ({ ...p, regaliaPickupShown: 1 }));
      return;
    }

    // 4. First artifact selected
    if (game.artifacts.length > 0 && game.artifacts.length > prev.artifactCount && !upgrades.artifactPickupShown) {
      startEventPrompt('artifactPickup');
      setUpgrades(p => ({ ...p, artifactPickupShown: 1 }));
      return;
    }

    // 5. First relic picked up
    if (game.relicDrops && game.relicDrops.length > 0 && !upgrades.relicPickupShown) {
      startEventPrompt('relicPickup');
      setUpgrades(p => ({ ...p, relicPickupShown: 1 }));
      return;
    }

    // 6. Stagnation reset — no flag captured for 90s after 5+ flags
    if (
      game.flagsCaptured >= 5 &&
      game.lastFlagCaptureFrame > 0 &&
      game.frame - game.lastFlagCaptureFrame >= 5400 &&
      !upgrades.stagnationResetShown
    ) {
      startEventPrompt('stagnationReset');
      setUpgrades(p => ({ ...p, stagnationResetShown: 1 }));
      return;
    }

    // 7. Boss first-encounter spawn dialogue (one-time per boss type)
    if (game.boss && game.boss.health > 0) {
      const bossDialogueMap: Record<number, string> = {
        0: 'forestGuardian', 1: 'wildHuntsman', 2: 'wraithKing', 3: 'broodmother',
        4: 'dungeonLich', 5: 'iceConjurer', 6: 'snowNinja',
      };
      const bossKey = bossDialogueMap[game.boss.bossType];
      if (bossKey) {
        const spawnFlag = `bossSpawn_${bossKey}Shown` as string;
        if (!(upgrades as any)[spawnFlag]) {
          startEventPrompt(`bossSpawn_${bossKey}`);
          setUpgrades(p => ({ ...p, [spawnFlag]: 1 }));
          return;
        }
      }
    }

    // 8. Boss first-encounter kill dialogue (fires when boss just died this render)
    if (game.bossesDefeated > prev.bossesDefeated && game.bossesDefeated >= 1) {
      // Figure out which boss was just killed (bossType cycles: [0,1,2,3,5,6])
      const BOSS_ROTATION = [0, 1, 2, 3, 5, 6];
      const killedZone = game.bossesDefeated - 1;
      const killedBossType = game.inDungeon && game.dungeonType === 'timed' ? 4 : BOSS_ROTATION[killedZone % 6];
      const bossDialogueMap: Record<number, string> = {
        0: 'forestGuardian', 1: 'wildHuntsman', 2: 'wraithKing', 3: 'broodmother',
        4: 'dungeonLich', 5: 'iceConjurer', 6: 'snowNinja',
      };
      const bossKey = bossDialogueMap[killedBossType];
      if (bossKey) {
        const killFlag = `bossKill_${bossKey}Shown` as string;
        if (!(upgrades as any)[killFlag]) {
          startEventPrompt(`bossKill_${bossKey}`);
          setUpgrades(p => ({ ...p, [killFlag]: 1 }));
          return;
        }
      }
    }

    // 9. Elite first-encounter spawn dialogue (one-time per variant)
    if (game.activeEliteVariant) {
      const spawnFlag = `eliteSpawn_${game.activeEliteVariant}Shown` as string;
      if (!(upgrades as any)[spawnFlag]) {
        startEventPrompt(`eliteSpawn_${game.activeEliteVariant}`);
        setUpgrades(p => ({ ...p, [spawnFlag]: 1 }));
        return;
      }
    }

    // 10. Elite first-encounter kill dialogue (fires when active elite was cleared = just killed)
    if (prev.activeEliteVariant && !game.activeEliteVariant && game.eliteKills > prev.eliteKills) {
      const killFlag = `eliteKill_${prev.activeEliteVariant}Shown` as string;
      if (!(upgrades as any)[killFlag]) {
        startEventPrompt(`eliteKill_${prev.activeEliteVariant}`);
        setUpgrades(p => ({ ...p, [killFlag]: 1 }));
        return;
      }
    }

  }); // runs every render

  // ── Resume tutorial after page refresh ───────────────────────
  useEffect(() => {
    if (gameScreen !== 'playing') return;
    if (tutorialStep >= TUTORIAL_DONE || tutorialStep === 0) return;
    if (currentStepId) return; // Already running

    // Map persistAs back to a step to resume from
    // After a refresh, we don't re-show dialogues — just set waitingForAction
    if (tutorialStep === 1) {
      if (upgrades.playerName === '') {
        startStep('intro');
      } else {
        setCurrentStepId('hire');
        setWaitingForAction(true);
      }
    } else if (tutorialStep === 2) {
      setCurrentStepId('hire');
      setWaitingForAction(true);
    } else if (tutorialStep === 3) {
      setCurrentStepId('forward');
      setWaitingForAction(true);
    } else if (tutorialStep === 4) {
      // combatStarted — resume as awaitBattle
      setCurrentStepId('awaitBattle');
      setWaitingForAction(true);
    } else if (tutorialStep === 5) {
      // battleWarning/stubbornWarning — resume as awaitBattle
      setCurrentStepId('awaitBattle');
      setWaitingForAction(true);
    } else if (tutorialStep === 6) {
      setCurrentStepId('economy');
      setWaitingForAction(true);
    } else if (tutorialStep === 7) {
      setCurrentStepId('upgrade');
      setWaitingForAction(true);
    } else if (tutorialStep === 8) {
      setCurrentStepId('secondUnit');
      setWaitingForAction(true);
    } else if (tutorialStep === 9) {
      setCurrentStepId('pushToFlag');
      setWaitingForAction(true);
    } else if (tutorialStep === 10) {
      // flagCaptured/earlyCapture — check if portal needed
      if (game.flagsCaptured >= 2 && game.portalFlagIndex <= 0) {
        setCurrentStepId('portal');
        setWaitingForAction(true);
      } else {
        setCurrentStepId('flagCaptured');
        setWaitingForAction(true);
      }
    } else if (tutorialStep >= 11) {
      // Portal done or beyond — tutorial complete
      completeTutorial();
    }
  }, [gameScreen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Compute highlights ───────────────────────────────────────
  const step = currentStepId ? STEPS[currentStepId] : null;
  const highlights: TutorialHighlights = { ...NO_HIGHLIGHTS };
  if (step && waitingForAction) {
    for (const key of step.highlights) {
      highlights[key] = true;
    }
  }
  // Also highlight forward button during 'forward' step even while showing dialogue
  if (currentStepId === 'forward' && step) {
    highlights.forwardButton = true;
  }
  // Event prompts with autoComplete: show highlights while dialogue is showing
  if (step?.autoComplete && showingDialogue) {
    for (const key of step.highlights) {
      highlights[key] = true;
    }
  }

  // ── Build current dialogue ───────────────────────────────────
  const currentDialogue = (step && showingDialogue && dialogueIndex < step.dialogues.length)
    ? step.dialogues[dialogueIndex]
    : null;

  const state: TutorialEngineState = {
    currentStepId,
    dialogueIndex,
    showingDialogue,
    waitingForAction,
    highlights,
    currentDialogue,
    darkOverlay: step?.darkOverlay || false,
  };

  return [state, { advanceDialogue, submitName }];
}
