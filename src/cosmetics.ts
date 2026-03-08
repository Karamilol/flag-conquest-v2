// ============================================================
// Cosmetics System — skins, banners, visual customization
// ============================================================

export type CosmeticCategory = 'heroSkin' | 'unitSkin' | 'banner';
export type CosmeticRarity = 'common' | 'rare' | 'legendary';

export interface CosmeticDef {
  id: string;
  category: CosmeticCategory;
  name: string;
  icon: string;
  description: string;
  gemCost: number;
  unitType?: string;       // for unitSkin only
  rarity: CosmeticRarity;
  colors?: Record<string, string>;
}

export const COSMETICS: CosmeticDef[] = [
  // ---- Hero Skins ----
  { id: 'hero_crimson', category: 'heroSkin', name: 'Crimson Berserker', icon: '\u{1F534}', description: 'Blood-red armor, no shield',
    gemCost: 50, rarity: 'common', colors: { armor: '#8b1a1a', accent: '#ff4444', cape: '#6a0a0a' } },
  { id: 'hero_shadow', category: 'heroSkin', name: 'Shadow Knight', icon: '\u{1F311}', description: 'Dark armor with purple accents',
    gemCost: 80, rarity: 'rare', colors: { armor: '#1a0a2e', accent: '#8844cc', cape: '#2a1040' } },
  { id: 'hero_frost', category: 'heroSkin', name: 'Frost Warden', icon: '\u{2744}\u{FE0F}', description: 'Ice-forged plate with crystal cape',
    gemCost: 80, rarity: 'rare', colors: { armor: '#2a4a6a', accent: '#44ddff', cape: '#1a3a5a' } },
  { id: 'hero_golden', category: 'heroSkin', name: 'Golden Champion', icon: '\u{1F451}', description: 'Gilded armor of the ancient kings',
    gemCost: 120, rarity: 'legendary', colors: { armor: '#8b6914', accent: '#ffd700', cape: '#6a5010' } },

  // ---- Unit Skins ----
  { id: 'soldier_undead', category: 'unitSkin', unitType: 'soldier', name: 'Undead Soldier', icon: '\u{1F480}', description: 'Skeletal warrior',
    gemCost: 30, rarity: 'common', colors: { body: '#aaa898', accent: '#44ff44' } },
  { id: 'archer_shadow', category: 'unitSkin', unitType: 'archer', name: 'Shadow Archer', icon: '\u{1F311}', description: 'Dark hood, purple arrows',
    gemCost: 30, rarity: 'common', colors: { body: '#2a1040', accent: '#8844cc' } },
  { id: 'soldier_royal', category: 'unitSkin', unitType: 'soldier', name: 'Royal Guard', icon: '\u{1F451}', description: 'Gold and white armor',
    gemCost: 50, rarity: 'rare', colors: { body: '#ffd700', accent: '#fff' } },
  { id: 'knight_obsidian', category: 'unitSkin', unitType: 'knight', name: 'Obsidian Knight', icon: '\u{1F5A4}', description: 'Black armor, red eyes',
    gemCost: 50, rarity: 'rare', colors: { body: '#1a1a1a', accent: '#ff2222' } },

  // ---- Banners (flag cosmetics) ----
  { id: 'banner_dragon', category: 'banner', name: 'Dragon Banner', icon: '\u{1F409}', description: 'A fierce dragon crest',
    gemCost: 20, rarity: 'common' },
  { id: 'banner_skull', category: 'banner', name: 'Skull Banner', icon: '\u{1F480}', description: 'Fear the reaper',
    gemCost: 20, rarity: 'common' },
  { id: 'banner_phoenix', category: 'banner', name: 'Phoenix Banner', icon: '\u{1F525}', description: 'Rise from the ashes',
    gemCost: 40, rarity: 'rare' },
];

/** Rarity → border color for UI display */
export const RARITY_COLORS: Record<CosmeticRarity, string> = {
  common: '#aaaaaa',
  rare: '#4488ff',
  legendary: '#ffd700',
};
