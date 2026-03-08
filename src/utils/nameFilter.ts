// ---- Player Name Profanity Filter ----
// Blocklist + leetspeak normalization. No dependencies.

const BLOCKED_WORDS = [
  // Slurs & hate speech
  'nigger', 'nigga', 'nigg', 'n1gger', 'n1gga', 'faggot', 'fag', 'f4g',
  'retard', 'retarded', 'tranny', 'chink', 'spic', 'kike', 'coon',
  'wetback', 'beaner', 'gook', 'raghead', 'towelhead', 'cracker',
  // Sexual
  'fuck', 'fuk', 'fck', 'fuq', 'shit', 'sh1t', 'sht', 'ass', 'a55',
  'bitch', 'b1tch', 'btch', 'cunt', 'c0ck', 'cock', 'dick', 'd1ck',
  'pussy', 'puss', 'tits', 'boob', 'penis', 'vagina', 'dildo',
  'whore', 'slut', 'hoe', 'cum', 'jizz', 'wank', 'porn',
  // Other
  'nazi', 'hitler', 'holocaust', 'rape', 'molest', 'pedo', 'paedo',
  'kill yourself', 'kys',
];

// Normalize leetspeak: 0→o, 1→i, 3→e, 4→a, 5→s, 7→t, @→a, $→s
function normalizeLeet(s: string): string {
  return s
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's');
}

// Strip non-alphanumeric (catches separators like n_i_g_g_a)
function stripNonAlpha(s: string): string {
  return s.replace(/[^a-z0-9]/g, '');
}

/** Returns true if the name contains profanity */
export function containsProfanity(name: string): boolean {
  const lower = name.toLowerCase();
  const normalized = normalizeLeet(lower);
  const stripped = stripNonAlpha(normalized);
  const strippedRaw = stripNonAlpha(lower);

  for (const word of BLOCKED_WORDS) {
    const w = word.replace(/\s+/g, '');
    if (stripped.includes(w)) return true;
    if (strippedRaw.includes(w)) return true;
  }
  return false;
}

const FALLBACK_NAMES = [
  'Adventurer', 'Wanderer', 'Champion', 'Recruit', 'Vagabond',
  'Pilgrim', 'Nomad', 'Outlander', 'Drifter', 'Wayfarer',
];

/** Sanitize a player name — returns a fallback if profane, trims + caps length */
export function sanitizeName(name: string, maxLength = 16): string {
  const trimmed = name.trim().slice(0, maxLength);
  if (!trimmed) return '';
  if (containsProfanity(trimmed)) {
    return FALLBACK_NAMES[Math.floor(Math.random() * FALLBACK_NAMES.length)];
  }
  return trimmed;
}
