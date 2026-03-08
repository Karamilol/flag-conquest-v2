// ── Void Entity Dialogue System ──────────────────────────────────────
// Quips spoken by the mysterious cloaked figure in the death realm.
// Context-aware: references bosses, zones, flags, gold, retreats, class.

export interface VoidContext {
  playerName: string;
  bossesDefeated: number;
  flagsCaptured: number;
  currentZone: number;
  enemiesKilled: number;
  retreated: boolean;
  highestZone: number;
  highestFlags: number;
  heroClass: string;
  goldEarned: number;
}

export interface VoidQuip {
  text: string;
  weight: number;
  condition?: (ctx: VoidContext) => boolean;
}

export const VOID_QUIPS: VoidQuip[] = [
  // ── Snark (generic, always available) ─────────────────────────────
  { text: "Back so soon, [Name]? I'd say I'm surprised, but I'd be lying.", weight: 1 },
  { text: "I've been watching you fight. 'Fight' is generous.", weight: 1 },
  { text: "The corruption didn't even have to try that time.", weight: 1 },
  { text: "Do you want advice, or do you prefer learning through repeated failure?", weight: 1 },
  { text: "That last death was almost artistic. Almost.", weight: 1 },
  { text: "You're very consistent, [Name]. Consistently disappointing.", weight: 1 },
  { text: "The enemies are starting to recognize you. That's not a compliment.", weight: 1 },
  { text: "Another glorious defeat for the history books.", weight: 1 },
  { text: "I'd clap, but I don't have hands. Allegedly.", weight: 1 },

  // ── Snark (conditional) ───────────────────────────────────────────
  { text: "You know, most commanders at least make it past the first flag before dying.", weight: 1,
    condition: ctx => ctx.flagsCaptured === 0 },

  // ── Lore (time loop hints, entity nature) ─────────────────────────
  { text: "I've watched so many commanders stand where you stand. Most forget they were ever here.", weight: 1 },
  { text: "Time is... generous here. It always gives you another chance. Have you wondered why?", weight: 1 },
  { text: "The corruption didn't start as corruption, you know. It was a gift, once.", weight: 1 },
  { text: "This place between death and life... I've been here longer than I can remember.", weight: 1 },
  { text: "You won't remember this conversation. None of them do.", weight: 1 },
  { text: "The kingdom fell because someone made a deal they didn't understand.", weight: 1 },
  { text: "Every time you return, I feel it. Like a heartbeat.", weight: 1 },
  { text: "The bosses you fight were commanders too. Before the loop broke them.", weight: 1 },
  { text: "I wonder sometimes if you're the one who finally breaks the cycle. Then you die again.", weight: 1 },
  { text: "Don't worry about dying, [Name]. You've done it before.", weight: 1 },

  // ── Meta (4th wall) ───────────────────────────────────────────────
  { text: "Don't mind me. Just the mysterious floating figure in the death realm. Totally normal.", weight: 0.8 },
  { text: "You could just... close the game. I'd still be here.", weight: 0.8 },
  { text: "I've been floating here for quite some time. My legs fell asleep eons ago.", weight: 0.8 },
  { text: "Is someone watching us? I feel like someone is watching us.", weight: 0.8 },
  { text: "If you're waiting for my tragic backstory, you'll be here a while.", weight: 0.8 },
  { text: "Yes, I float. No, I won't explain how.", weight: 0.8 },
  { text: "Between you and me, the shop prices are a bit steep.", weight: 0.8 },
  { text: "I wonder what it's like on the other side of the screen.", weight: 0.8 },

  // ── Retreat-specific ──────────────────────────────────────────────
  { text: "Retreated? Smart. The last commander who stayed died screaming. Well, you all die screaming.", weight: 1.2,
    condition: ctx => ctx.retreated },
  { text: "A tactical withdrawal. That's what we'll call it.", weight: 1.2,
    condition: ctx => ctx.retreated },
  { text: "Running away is an underrated survival strategy, [Name].", weight: 1.2,
    condition: ctx => ctx.retreated },
  { text: "You lived. Barely. I suppose that counts as progress.", weight: 1.2,
    condition: ctx => ctx.retreated },
  { text: "The brave die fast. The clever die slow. You chose slow.", weight: 1.2,
    condition: ctx => ctx.retreated },

  // ── Boss-kill reactions ───────────────────────────────────────────
  { text: "You actually killed one. I'll admit I didn't see that coming.", weight: 1,
    condition: ctx => ctx.bossesDefeated >= 1 },
  { text: "One boss down. They'll send something worse next time. They always do.", weight: 1,
    condition: ctx => ctx.bossesDefeated >= 1 },
  { text: "Two bosses. You're either getting stronger or they're getting weaker. Probably the second one.", weight: 1,
    condition: ctx => ctx.bossesDefeated >= 2 },
  { text: "Three bosses, [Name]. The corruption is starting to notice you. That's... not good for you.", weight: 1,
    condition: ctx => ctx.bossesDefeated >= 3 },
  { text: "Four bosses fallen. You're becoming a problem for the other side. I like problems.", weight: 1,
    condition: ctx => ctx.bossesDefeated >= 4 },
  { text: "Five bosses? You're not supposed to get this far. Not in the plan.", weight: 1,
    condition: ctx => ctx.bossesDefeated >= 5 },
  { text: "Six bosses, [Name]. I'm starting to think you might actually be different.", weight: 1,
    condition: ctx => ctx.bossesDefeated >= 6 },

  // ── Zone / progress reactions ─────────────────────────────────────
  { text: "You didn't even capture a single flag. Impressive, in the worst way.", weight: 1,
    condition: ctx => ctx.currentZone === 0 && ctx.flagsCaptured === 0 },
  { text: "Zero flags. Zero. I don't even have a sarcastic comment for that.", weight: 1,
    condition: ctx => ctx.currentZone === 0 && ctx.flagsCaptured === 0 },
  { text: "You made it to the caves. It only gets darker from here.", weight: 1,
    condition: ctx => ctx.currentZone >= 2 },
  { text: "The nordic wastes. Most commanders never see the snow.", weight: 1,
    condition: ctx => ctx.currentZone >= 4 },
  { text: "The volcanic reaches. You've gone further than almost anyone.", weight: 1,
    condition: ctx => ctx.currentZone >= 6 },
  { text: "Ten flags. The land is starting to remember what it was.", weight: 1,
    condition: ctx => ctx.flagsCaptured >= 10 },
  { text: "Twenty flags, [Name]. The corruption is losing ground. Literally.", weight: 1,
    condition: ctx => ctx.flagsCaptured >= 20 },

  // ── Gold milestone reactions ──────────────────────────────────────
  { text: "Five million gold and you still couldn't buy your way out of dying.", weight: 1.5,
    condition: ctx => ctx.goldEarned >= 5_000_000 },
  { text: "Fifty million. You could buy a kingdom. Oh wait, this one's already broken.", weight: 1.5,
    condition: ctx => ctx.goldEarned >= 50_000_000 },
  { text: "Half a billion gold, [Name]. You hoard like a dragon. Die like one too, apparently.", weight: 1.5,
    condition: ctx => ctx.goldEarned >= 500_000_000 },
  { text: "Five billion. At this point the gold is just decorative, isn't it?", weight: 1.5,
    condition: ctx => ctx.goldEarned >= 5_000_000_000 },
  { text: "Fifty billion gold. You've outearned the kingdom's entire treasury. Before it fell, obviously.", weight: 1.5,
    condition: ctx => ctx.goldEarned >= 50_000_000_000 },

  // ── Progress comparison ───────────────────────────────────────────
  { text: "You've been further before. Zone [HZ]. This run was... less impressive.", weight: 1,
    condition: ctx => ctx.highestZone >= 5 && ctx.currentZone < ctx.highestZone },

  // ── Ranger-specific ───────────────────────────────────────────────
  { text: "An archer. Keeping your distance from everything, including victory.", weight: 1,
    condition: ctx => ctx.heroClass === 'ranger' },
  { text: "Arrows are elegant. Dying with a quiver full of them, less so.", weight: 1,
    condition: ctx => ctx.heroClass === 'ranger' },

  // ── Easter Eggs (rare) ────────────────────────────────────────────
  { text: "...Did you know that if you capture 100 flags, absolutely nothing special happens? I checked.", weight: 0.15 },
  { text: "Sometimes I dream I'm a tutorial NPC. Horrifying.", weight: 0.15 },
  { text: "The real treasure was the friends you\u2014 no. No it wasn't. It was the gems.", weight: 0.15 },
  { text: "Fun fact: I've been wearing this cloak for 3,000 years. It doesn't even have pockets.", weight: 0.15 },
  { text: "I once tried to leave this void. Walked for a thousand years. Ended up right back here.", weight: 0.15 },
  { text: "Plot twist: I'm the final boss. ...Just kidding. Unless?", weight: 0.15 },
  { text: "I had a name once. Can't remember it. Something with an 'A' maybe.", weight: 0.15 },
  { text: "You know what the worst part about being immortal is? No weekends.", weight: 0.15 },
];

/** Pick a random quip index from eligible quips, weighted, avoiding previous. */
export function pickVoidQuip(ctx: VoidContext, previousIndex: number): number {
  const eligible: { idx: number; weight: number }[] = [];
  for (let i = 0; i < VOID_QUIPS.length; i++) {
    if (i === previousIndex) continue;
    const q = VOID_QUIPS[i];
    if (q.condition && !q.condition(ctx)) continue;
    eligible.push({ idx: i, weight: q.weight });
  }
  if (eligible.length === 0) return 0; // fallback

  const totalWeight = eligible.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const e of eligible) {
    roll -= e.weight;
    if (roll <= 0) return e.idx;
  }
  return eligible[eligible.length - 1].idx;
}

/** Substitute [Name] and [HZ] placeholders. */
export function formatQuip(text: string, ctx: VoidContext): string {
  return text
    .replace(/\[Name\]/g, ctx.playerName)
    .replace(/\[HZ\]/g, String(ctx.highestZone + 1));
}
