// Tutorial step definitions - Phase 1: Steps 1-9 + Skill prompts
// Each step has an id, persistAs (written to upgrades.tutorialStep), dialogues,
// highlight keys, and advance conditions.

export interface TutorialDialogue {
  speaker: string;          // e.g. "Advisor"
  text: string;             // supports [Name] substitution
  hasNameInput?: boolean;   // Step 1: shows name input field
}

export type HighlightKey =
  | 'roll'
  | 'heroUpgrade'
  | 'income'
  | 'portalTab'
  | 'forwardButton'
  | 'backButton'
  | 'skillButton'
  | 'retreatButton';

export interface TutorialStep {
  id: string;
  persistAs: number;        // value written to upgrades.tutorialStep when step begins
  dialogues: TutorialDialogue[];
  highlights: HighlightKey[];
  darkOverlay?: boolean;    // Step 1: near-opaque dark background
  autoComplete?: boolean;   // Event prompts: auto-clear after last dialogue (no waitingForAction)
}

// ── Step definitions ─────────────────────────────────────────────────
// Order follows the spec: intro → hire → forward → battleWarning → economy → upgrade → secondUnit → pushToFlag

export const STEPS: Record<string, TutorialStep> = {
  // Step 1 - First Contact (fresh start, dark screen)
  intro: {
    id: 'intro',
    persistAs: 1,
    darkOverlay: true,
    highlights: [],
    dialogues: [
      { speaker: 'Advisor', text: "Another one. Wonderful." },
      { speaker: 'Advisor', text: "The kingdom fell. The land is corrupted. Everyone who tried to fix it is dead, or worse. I'll be guiding you. Not out of kindness; I simply have nothing better to do." },
      { speaker: 'Advisor', text: "What do they call you, Commander?", hasNameInput: true },
      { speaker: 'Advisor', text: "[Name]. I'll try to remember that. The last one didn't survive long enough for it to matter." },
    ],
  },

  // Step 2 - Hiring First Unit
  hire: {
    id: 'hire',
    persistAs: 2,
    highlights: ['roll'],
    dialogues: [
      { speaker: 'Advisor', text: "You can't reclaim anything alone. You'll need soldiers. Expendable ones." },
      { speaker: 'Advisor', text: "Hire one. They'll fight for you, die for you, and not complain about either." },
    ],
  },

  // Step 3 - Push Forward (includes hire reaction line)
  forward: {
    id: 'forward',
    persistAs: 3,
    highlights: ['forwardButton'],
    dialogues: [
      { speaker: 'Advisor', text: "They won't last. None of them do. But they'll buy you time, and time is all you need." },
      { speaker: 'Advisor', text: "Now move. The corruption won't reclaim itself." },
    ],
  },

  // Brief reaction after player moves forward (before battle warning)
  combatStarted: {
    id: 'combatStarted',
    persistAs: 4,
    highlights: [],
    dialogues: [
      { speaker: 'Advisor', text: "Good. Keep pushing. The enemy rallies around their flags, the further you go, the more you'll face." },
    ],
  },

  // Step 4 - Retreat Warning (HP <= 70%, branches)
  battleWarning: {
    id: 'battleWarning',
    persistAs: 5,
    highlights: ['backButton'],
    dialogues: [
      { speaker: 'Advisor', text: "You're bleeding, [Name]. I've seen that look before. Usually right before someone stops breathing." },
      { speaker: 'Advisor', text: "Fall back. Dying on your first push would be embarrassing for both of us." },
    ],
  },

  // Step 4b - Player ignored retreat warning and kept pushing
  stubbornWarning: {
    id: 'stubbornWarning',
    persistAs: 5,
    highlights: [],
    dialogues: [
      { speaker: 'Advisor', text: "Stubborn. The last Commander was too." },
    ],
  },

  // Step 5 - First Economy Upgrade (player retreated, highlight income)
  economy: {
    id: 'economy',
    persistAs: 6,
    highlights: ['income'],
    dialogues: [
      { speaker: 'Advisor', text: "While you're still alive; spend your gold. Upgrade your income. Wars are won by those who can afford to keep fighting." },
      { speaker: 'Advisor', text: "Every coin you invest now means more soldiers later. Think of it as buying yourself time, a little bit longer before death gets you." },
    ],
  },

  // Step 6 - In-Run Unit Upgrade (includes economy reaction)
  upgrade: {
    id: 'upgrade',
    persistAs: 7,
    highlights: ['heroUpgrade'],
    dialogues: [
      { speaker: 'Advisor', text: "See? Already smarter than the last one." },
      { speaker: 'Advisor', text: "Your soldiers fight, but they don't improve on their own. Spend gold to sharpen their blades." },
    ],
  },

  // Step 7 - Second Unit (includes upgrade reaction)
  secondUnit: {
    id: 'secondUnit',
    persistAs: 8,
    highlights: ['roll'],
    dialogues: [
      { speaker: 'Advisor', text: "Stronger. Not strong enough, but we'll get there." },
      { speaker: 'Advisor', text: "Now hire another once you got the gold. One soldier is a sacrifice. Two is the beginning of an army." },
    ],
  },

  // Step 8 - Push for First Flag (includes secondUnit reaction)
  pushToFlag: {
    id: 'pushToFlag',
    persistAs: 9,
    highlights: [],
    dialogues: [
      { speaker: 'Advisor', text: "Don't get attached." },
      { speaker: 'Advisor', text: "You see that flag ahead? It's an anchor point. The corruption uses it to hold this territory and spawn its forces." },
      { speaker: 'Advisor', text: "Take it. Plant your banner. Push the rot back." },
    ],
  },

  // Step 8alt - Early Flag Capture (player got flag before warning)
  earlyCapture: {
    id: 'earlyCapture',
    persistAs: 10,
    highlights: [],
    dialogues: [
      { speaker: 'Advisor', text: "I see, you're already a step ahead of the rest. For that, let me give you a little something." },
    ],
  },

  // Step 9 - Flag Captured
  flagCaptured: {
    id: 'flagCaptured',
    persistAs: 10,
    highlights: [],
    dialogues: [
      { speaker: 'Advisor', text: "One flag down. The land remembers what it used to be, even if only for a moment." },
      { speaker: 'Advisor', text: "It won't last, of course. Nothing does. But you knew that already, or have you forgotten?" },
    ],
  },

  // Step 10 - Portal Repositioning (2nd flag captured, portal not moved)
  portal: {
    id: 'portal',
    persistAs: 11,
    highlights: ['portalTab'],
    dialogues: [
      { speaker: 'Advisor', text: "We've captured enough ground that our portal is far behind." },
      { speaker: 'Advisor', text: "Switch to the PORTAL tab and move the portal forward. This is where your troops will respawn." },
    ],
  },

  // ── Event-driven prompts (autoComplete, independent of linear tutorial) ──

  // First active skill equipped
  firstActiveSkill: {
    id: 'firstActiveSkill',
    persistAs: -1,
    autoComplete: true,
    highlights: ['skillButton'],
    dialogues: [
      { speaker: 'Advisor', text: "You've learned something new. Use it - then wait. Power like that doesn't come cheap." },
    ],
  },

  // First passive/triggered skill equipped
  firstPassiveSkill: {
    id: 'firstPassiveSkill',
    persistAs: -1,
    autoComplete: true,
    highlights: [],
    dialogues: [
      { speaker: 'Advisor', text: "This one works on its own. No effort required. Enjoy it - most things here aren't that generous." },
    ],
  },

  // First boss killed
  firstBossKill: {
    id: 'firstBossKill',
    persistAs: -1,
    autoComplete: true,
    darkOverlay: true,
    highlights: [],
    dialogues: [
      { speaker: 'Advisor', text: "...They were like you once. Before the corruption hollowed them out and wore them like armor." },
      { speaker: 'Advisor', text: "The land feels it. One less chain holding the rot together." },
    ],
  },

  // First regalia collected
  regaliaPickup: {
    id: 'regaliaPickup',
    persistAs: -1,
    autoComplete: true,
    highlights: [],
    dialogues: [
      { speaker: 'Advisor', text: "Regalia. Forged in the space between death and return. You can only equip it in limbo - the living world rejects it." },
    ],
  },

  // First artifact selected
  artifactPickup: {
    id: 'artifactPickup',
    persistAs: -1,
    autoComplete: true,
    highlights: [],
    dialogues: [
      { speaker: 'Advisor', text: "Artifacts hold power from this cycle only. Fragments of what the corruption was hoarding. Pair the right ones and they amplify each other - choose wisely." },
    ],
  },

  // First relic picked up
  relicPickup: {
    id: 'relicPickup',
    persistAs: -1,
    autoComplete: true,
    highlights: [],
    dialogues: [
      { speaker: 'Advisor', text: "Relics are echoes. They persist between cycles, like you do. Collect a set and they remember what they were part of." },
    ],
  },

  // First dungeon entry
  dungeonEntry: {
    id: 'dungeonEntry',
    persistAs: -1,
    autoComplete: true,
    highlights: [],
    dialogues: [
      { speaker: 'Advisor', text: "Stop. This place is different. A scar the corruption carved out of the world. Your power out there doesn't reach you here - only fragments bleed through." },
      { speaker: 'Advisor', text: "That mining camp pulls fragments from the void - artifact pieces. Collect enough and you can forge weapons from a realm the corruption can't touch." },
      { speaker: 'Advisor', text: "The corruption here comes in waves. Each one worse than the last. Buy soldiers, upgrade them, and hold for as long as you can." },
      { speaker: 'Advisor', text: "Spend your medals wisely. Every wave hits harder than the last." },
    ],
  },

  // ── Boss first-encounter dialogues (spawn + kill) ──────────────

  bossSpawn_forestGuardian: {
    id: 'bossSpawn_forestGuardian', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Forest Guardian', text: "Ghrrl... trespass... this grove... is MINE..." }],
  },
  bossKill_forestGuardian: {
    id: 'bossKill_forestGuardian', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Advisor', text: "That thing used to guard this forest, atleast until the corruption offered it a better deal." }],
  },
  bossSpawn_wildHuntsman: {
    id: 'bossSpawn_wildHuntsman', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Wild Huntsman', text: "Hrrn... the hunt... never ends... hunt never..." }],
  },
  bossKill_wildHuntsman: {
    id: 'bossKill_wildHuntsman', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Advisor', text: "He used to be a legend, the finest tracker in the realm, 100's of years ago... He rode into the forest to find the malice we face, but instead, it found him..." }],
  },
  bossSpawn_wraithKing: {
    id: 'bossSpawn_wraithKing', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Wraith King', text: "Nn'ghol... my kingdom... my... poor.. kingdom..." }],
  },
  bossKill_wraithKing: {
    id: 'bossKill_wraithKing', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Advisor', text: "[Name]... that's the king. Our king, well whats left of him. The corruption now sits in his throne." }],
  },
  bossSpawn_broodmother: {
    id: 'bossSpawn_broodmother', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Broodmother', text: "Hhhrrrr... hungry... always... my babies..." }],
  },
  bossKill_broodmother: {
    id: 'bossKill_broodmother', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Advisor', text: "That thing was here before the corruption. Before the kingdom. There was books written on its existance... " }],
  },
  bossSpawn_dungeonLich: {
    id: 'bossSpawn_dungeonLich', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Dungeon Lich', text: "Vol'thrn... I sought the cure... khrr... I became it..." }],
  },
  bossKill_dungeonLich: {
    id: 'bossKill_dungeonLich', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Advisor', text: "The royal arcanist. Spent decades studying the slow spread of the corruption. He thought he had a cure, but instead he only made it spread faster... " }],
  },
  bossSpawn_iceConjurer: {
    id: 'bossSpawn_iceConjurer', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Ice Conjurer', text: "...cold... kkhrr... keeps it... contained... CONTAINED..." }],
  },
  bossKill_iceConjurer: {
    id: 'bossKill_iceConjurer', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Advisor', text: "She tried to wall off the corruption with ice. Sealed the entire Nordic pass. Worked too, until well... someone, opened the front door." }],
  },
  bossSpawn_snowNinja: {
    id: 'bossSpawn_snowNinja', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Snow Ninja', text: "..." }],
  },
  bossKill_snowNinja: {
    id: 'bossKill_snowNinja', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Advisor', text: "He was sent an assassin to break the ice seal. It worked. The corruption poured through. It got both of them. What a fool..." }],
  },

  // ── Elite first-encounter dialogues (spawn + kill) ─────────────

  eliteSpawn_warchief: {
    id: 'eliteSpawn_warchief', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Warchief', text: "Grakh... horde... HORDE rises..." }],
  },
  eliteKill_warchief: {
    id: 'eliteKill_warchief', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Advisor', text: "They're trying to speak. Whatever's left of them, the corruption hasn't finished chewing through it. Don't listen too closely, [Name]. Some words have teeth." }],
  },
  eliteSpawn_deadeye: {
    id: 'eliteSpawn_deadeye', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Deadeye', text: "Ssk... still... hold still..." }],
  },
  eliteKill_deadeye: {
    id: 'eliteKill_deadeye', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Advisor', text: "A ranger who watched the forest die. The corruption took their eyes but gave them something far worse." }],
  },
  eliteSpawn_revenant: {
    id: 'eliteSpawn_revenant', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Revenant', text: "Nn'ghol... vrrn... died once... wasn't enough..." }],
  },
  eliteKill_revenant: {
    id: 'eliteKill_revenant', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Advisor', text: "The first to fall and the first to refuse to stay down. More corruption than person at this point." }],
  },
  eliteSpawn_packleader: {
    id: 'eliteSpawn_packleader', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Packleader', text: "Hhhrr... hunt... we hunt..." }],
  },
  eliteKill_packleader: {
    id: 'eliteKill_packleader', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Advisor', text: "The alpha fled underground. The caves changed the whole pack into something else entirely." }],
  },
  eliteSpawn_archlich: {
    id: 'eliteSpawn_archlich', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Archlich', text: "...the deep remembers what the surface forgot..." }],
  },
  eliteKill_archlich: {
    id: 'eliteKill_archlich', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Advisor', text: "A scholar who dug too deep. Found answers. The corruption likes speaking through the educated ones." }],
  },
  eliteSpawn_phantomBlade: {
    id: 'eliteSpawn_phantomBlade', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Phantom Blade', text: "...behind..." }],
  },
  eliteKill_phantomBlade: {
    id: 'eliteKill_phantomBlade', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Advisor', text: "Walked into the blizzard. Came back as something else. The cold took everything but the blade." }],
  },
  eliteSpawn_infernoHerald: {
    id: 'eliteSpawn_infernoHerald', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Inferno Herald', text: "Rrch'kaal... burns... all burns..." }],
  },
  eliteKill_infernoHerald: {
    id: 'eliteKill_infernoHerald', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Advisor', text: "The corruption found fire and became something older than language." }],
  },
  eliteSpawn_colossus: {
    id: 'eliteSpawn_colossus', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Colossus', text: "...stood... nnh... still standing..." }],
  },
  eliteKill_colossus: {
    id: 'eliteKill_colossus', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Advisor', text: "Was a guardian once. The corruption filled the armor and kept walking. Nothing left inside but force." }],
  },
  eliteSpawn_plagueKing: {
    id: 'eliteSpawn_plagueKing', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Plague King', text: "Khrr... breathe... breathe deep..." }],
  },
  eliteKill_plagueKing: {
    id: 'eliteKill_plagueKing', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Advisor', text: "The rats had a king. The corruption gave it a crown made of a plague. Generous, in its way." }],
  },
  eliteSpawn_magmaLord: {
    id: 'eliteSpawn_magmaLord', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Magma Lord', text: "Tzrr... ground rejects... you..." }],
  },
  eliteKill_magmaLord: {
    id: 'eliteKill_magmaLord', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Advisor', text: "Something that comes far deeper than the dungeon, some who believe in Hell would say it comes from there." }],
  },
  eliteSpawn_deathKnight: {
    id: 'eliteSpawn_deathKnight', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Death Knight', text: "...oath... tzraakh... unbroken..." }],
  },
  eliteKill_deathKnight: {
    id: 'eliteKill_deathKnight', persistAs: -1, autoComplete: true, highlights: [],
    dialogues: [{ speaker: 'Advisor', text: "A knight who swore an oath that outlived everything else about them. The corruption just... honored the contract." }],
  },

  // Stagnation reset - nudge player to retreat after no progress
  stagnationReset: {
    id: 'stagnationReset',
    persistAs: -1,
    highlights: ['retreatButton'],
    dialogues: [
      { speaker: 'Advisor', text: "You're not moving, [Name]. Sometimes the smart thing isn't pushing forward - it's knowing when to fall back and come back stronger." },
    ],
  },

  // First death — introduce the 3 key prestige shop tabs
  firstDeath: {
    id: 'firstDeath',
    persistAs: -1,
    highlights: [],
    autoComplete: true,
    dialogues: [
      { speaker: 'Void Entity', text: "So... you died. Don't feel bad, [Name]. They all die the first time." },
      { speaker: 'Void Entity', text: "The void will send you back. But you should prepare before you go." },
      { speaker: 'Void Entity', text: "See the \u2694\uFE0F UNITS tab below? Spend your gems to unlock troops and grow your army." },
      { speaker: 'Void Entity', text: "The \uD83D\uDCB0 INCOME tab. Invest in gold generation \u2014 it grows stronger every run." },
      { speaker: 'Void Entity', text: "And \u2728 SHARDS. Permanent power for your soldiers. Small cost, big returns." },
      { speaker: 'Void Entity', text: "Now go. And try not to die so quickly this time." },
    ],
  },
};

// Step ordering for linear progression (excluding branches)
export const STEP_ORDER = [
  'intro', 'hire', 'forward', 'combatStarted', 'battleWarning',
  'economy', 'upgrade', 'secondUnit', 'pushToFlag', 'flagCaptured',
  'portal',
] as const;

// persistAs value that means "tutorial complete"
export const TUTORIAL_DONE = 99;
