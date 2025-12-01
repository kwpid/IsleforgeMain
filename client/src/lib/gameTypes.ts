export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type ItemType = 'block' | 'mineral' | 'material' | 'food' | 'tool' | 'armor' | 'potion';
export type ToolType = 'pickaxe' | 'axe' | 'sword' | 'shovel' | 'hoe';
export type ArmorSlot = 'helmet' | 'chestplate' | 'leggings' | 'boots';

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: Rarity;
  sellPrice: number;
  stackable: boolean;
  maxStack: number;
  icon: string;
  toolType?: ToolType;
  armorSlot?: ArmorSlot;
  stats?: Record<string, number>;
}

export interface InventoryItem {
  itemId: string;
  quantity: number;
}

export interface GeneratorTier {
  tier: number;
  romanNumeral: string;
  outputMultiplier: number;
  speedMultiplier: number;
  upgradeCost: number;
}

export interface GeneratorDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  baseOutput: number;
  baseInterval: number;
  outputItemId: string;
  unlockCost: number;
  tiers: GeneratorTier[];
}

export interface OwnedGenerator {
  generatorId: string;
  tier: number;
  lastTick: number;
  isActive: boolean;
}

export interface PlayerStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  universalPoints: number;
  totalCoinsEarned: number;
  totalItemsSold: number;
}

export interface StorageUpgrade {
  level: number;
  capacity: number;
  cost: number;
}

export interface PlayerStorage {
  capacity: number;
  upgradeLevel: number;
  items: InventoryItem[];
}

export interface PlayerEquipment {
  helmet: string | null;
  chestplate: string | null;
  leggings: string | null;
  boots: string | null;
  mainHand: string | null;
  offHand: string | null;
}

export interface PlayerInventory {
  items: InventoryItem[];
  maxSlots: number;
}

export interface GameState {
  player: PlayerStats;
  storage: PlayerStorage;
  inventory: PlayerInventory;
  equipment: PlayerEquipment;
  generators: OwnedGenerator[];
  unlockedGenerators: string[];
  lastSave: number;
  playTime: number;
}

export type MainTab = 'island' | 'hub' | 'settings';
export type IslandSubTab = 'generators' | 'storage';
export type HubSubTab = 'marketplace' | 'dungeons';
export type SettingsSubTab = 'general' | 'audio' | 'controls';

export type KeybindAction = 'openInventory' | 'quickSave' | 'islandTab' | 'hubTab' | 'settingsTab' | 'prevSubTab' | 'nextSubTab';

export interface Keybinds {
  openInventory: string;
  quickSave: string;
  islandTab: string;
  hubTab: string;
  settingsTab: string;
  prevSubTab: string;
  nextSubTab: string;
}

export const DEFAULT_KEYBINDS: Keybinds = {
  openInventory: 'Tab',
  quickSave: 'KeyS',
  islandTab: 'Digit1',
  hubTab: 'Digit2',
  settingsTab: 'Digit3',
  prevSubTab: 'ArrowLeft',
  nextSubTab: 'ArrowRight',
};

export function getKeyDisplayName(code: string): string {
  const displayNames: Record<string, string> = {
    'Tab': 'TAB',
    'KeyS': 'S',
    'Digit1': '1',
    'Digit2': '2',
    'Digit3': '3',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'Space': 'SPACE',
    'Enter': 'ENTER',
    'Escape': 'ESC',
    'Backspace': 'BACKSPACE',
    'ShiftLeft': 'L-SHIFT',
    'ShiftRight': 'R-SHIFT',
    'ControlLeft': 'L-CTRL',
    'ControlRight': 'R-CTRL',
    'AltLeft': 'L-ALT',
    'AltRight': 'R-ALT',
  };
  
  if (displayNames[code]) return displayNames[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return code.toUpperCase();
}

export const TIER_NUMERALS: Record<number, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
};

export const STORAGE_UPGRADES: StorageUpgrade[] = [
  { level: 0, capacity: 100, cost: 0 },
  { level: 1, capacity: 200, cost: 1000 },
  { level: 2, capacity: 400, cost: 5000 },
  { level: 3, capacity: 800, cost: 25000 },
  { level: 4, capacity: 1600, cost: 100000 },
  { level: 5, capacity: 3200, cost: 500000 },
];

export function getXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function getRarityColor(rarity: Rarity): string {
  const colors: Record<Rarity, string> = {
    common: 'text-rarity-common',
    uncommon: 'text-rarity-uncommon',
    rare: 'text-rarity-rare',
    epic: 'text-rarity-epic',
    legendary: 'text-rarity-legendary',
    mythic: 'text-rarity-mythic',
  };
  return colors[rarity];
}

export function getRarityBorderClass(rarity: Rarity): string {
  return `rarity-${rarity}`;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
}

export function createDefaultGameState(): GameState {
  return {
    player: {
      level: 1,
      xp: 0,
      xpToNextLevel: getXpForLevel(1),
      coins: 0,
      universalPoints: 0,
      totalCoinsEarned: 0,
      totalItemsSold: 0,
    },
    storage: {
      capacity: 100,
      upgradeLevel: 0,
      items: [],
    },
    inventory: {
      items: [],
      maxSlots: 36,
    },
    equipment: {
      helmet: null,
      chestplate: null,
      leggings: null,
      boots: null,
      mainHand: null,
      offHand: null,
    },
    generators: [
      { generatorId: 'cobblestone_generator', tier: 1, lastTick: Date.now(), isActive: true },
    ],
    unlockedGenerators: ['cobblestone_generator'],
    lastSave: Date.now(),
    playTime: 0,
  };
}
