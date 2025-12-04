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
  customImage?: string;
  animatedImage?: string;
  isSpecial?: boolean;
  isEnchanted?: boolean;
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

export interface SkillStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export interface PlayerStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  universalPoints: number;
  totalCoinsEarned: number;
  totalItemsSold: number;
  miningSkill: SkillStats;
  farmingSkill: SkillStats;
  dungeonSkill: SkillStats;
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

export type VendorType = 'tools' | 'armor' | 'food' | 'blocks' | 'materials' | 'potions' | 'rare';

export interface VendorItem {
  itemId: string;
  stock: number;
  priceMultiplier: number;
  isRotating?: boolean;
  unlimitedStock?: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  description: string;
  type: VendorType;
  icon: string;
  priceModifier: number;
  items: VendorItem[];
  isTravelling?: boolean;
}

export interface BlueprintRequirement {
  itemId: string;
  quantity: number;
}

export interface Blueprint {
  id: string;
  generatorId: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  requirements: BlueprintRequirement[];
  unlocked: boolean;
}

export interface BankTransaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'interest' | 'purchase' | 'sell';
  amount: number;
  timestamp: number;
  balance: number;
  source?: string;
}

export interface PlayerBank {
  balance: number;
  capacity: number;
  upgradeLevel: number;
  peakBalance: number;
  transactions: BankTransaction[];
}

export interface VaultSlot {
  itemId: string;
  quantity: number;
}

export interface PlayerVault {
  slots: VaultSlot[];
  maxSlots: number;
  upgradeLevel: number;
}

export interface BuildingProject {
  blueprintId: string;
  startedAt: number;
  completedAt: number;
  materialsDeposited: { itemId: string; quantity: number }[];
  isComplete: boolean;
}

export interface VendorStockPurchases {
  [vendorId: string]: {
    [itemId: string]: number;
  };
}

export interface GameState {
  player: PlayerStats;
  storage: PlayerStorage;
  inventory: PlayerInventory;
  equipment: PlayerEquipment;
  equipmentDurability: EquipmentDurability;
  generators: OwnedGenerator[];
  unlockedGenerators: string[];
  ownedBlueprints: string[];
  builtGenerators: string[];
  bank: PlayerBank;
  vault: PlayerVault;
  currentBuilding: BuildingProject | null;
  lastSave: number;
  playTime: number;
  notificationSettings: NotificationSettings;
  miningStats: MiningStats;
  vendorStockPurchases: VendorStockPurchases;
  vendorStockSeed: number;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  storageFull: true,
  itemPurchased: true,
  itemSold: true,
  levelUp: true,
  generatorPaused: true,
  bankDeposit: true,
  bankWithdraw: true,
};

export type MainTab = 'island' | 'hub' | 'shop' | 'settings';
export type IslandSubTab = 'generators' | 'storage' | 'crafting';
export type HubSubTab = 'marketplace' | 'blueprints' | 'bank' | 'mines' | 'dungeons';
export type ShopSubTab = 'limited' | 'daily' | 'coins';
export type SettingsSubTab = 'general' | 'audio' | 'controls' | 'notifications' | 'info';

export interface MiningStats {
  totalBlocksMined: number;
  blocksMined: Record<string, number>;
}

export interface EquipmentDurability {
  mainHand: number | null;
  offHand: number | null;
}

export interface MineableBlock {
  itemId: string;
  spawnChance: number;
  breakTime: number;
  minPickaxeTier: number;
  xpReward: number;
}

export const PICKAXE_TIERS: Record<string, number> = {
  'wooden_pickaxe': 1,
  'stone_pickaxe': 2,
  'iron_pickaxe': 3,
  'diamond_pickaxe': 4,
  'netherite_pickaxe': 5,
  'winter_pickaxe': 6,
};

export function getPickaxeTier(pickaxeId: string): number {
  return PICKAXE_TIERS[pickaxeId] || 0;
}

export function getPickaxeSpeedMultiplier(pickaxeId: string): number {
  const tier = PICKAXE_TIERS[pickaxeId] || 0;
  return 1 + (tier * 0.3);
}

export interface NotificationSettings {
  enabled: boolean;
  storageFull: boolean;
  itemPurchased: boolean;
  itemSold: boolean;
  levelUp: boolean;
  generatorPaused: boolean;
  bankDeposit: boolean;
  bankWithdraw: boolean;
}

export type KeybindAction = 'openInventory' | 'quickSave' | 'islandTab' | 'hubTab' | 'shopTab' | 'settingsTab' | 'prevSubTab' | 'nextSubTab';

export interface Keybinds {
  openInventory: string;
  quickSave: string;
  islandTab: string;
  hubTab: string;
  shopTab: string;
  settingsTab: string;
  prevSubTab: string;
  nextSubTab: string;
}

export const DEFAULT_KEYBINDS: Keybinds = {
  openInventory: 'Tab',
  quickSave: 'KeyS',
  islandTab: 'Digit1',
  hubTab: 'Digit2',
  shopTab: 'Digit3',
  settingsTab: 'Digit4',
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
  { level: 0, capacity: 500, cost: 0 },
  { level: 1, capacity: 1500, cost: 2500 },
  { level: 2, capacity: 5000, cost: 10000 },
  { level: 3, capacity: 15000, cost: 35000 },
  { level: 4, capacity: 35000, cost: 75000 },
  { level: 5, capacity: 75000, cost: 175000 },
  { level: 6, capacity: 150000, cost: 400000 },
  { level: 7, capacity: 300000, cost: 1000000 },
  { level: 8, capacity: 500000, cost: 2500000 },
];

export interface BankUpgrade {
  level: number;
  capacity: number;
  cost: number;
}

export const BANK_UPGRADES: BankUpgrade[] = [
  { level: 0, capacity: 10000, cost: 0 },
  { level: 1, capacity: 50000, cost: 5000 },
  { level: 2, capacity: 200000, cost: 25000 },
  { level: 3, capacity: 1000000, cost: 100000 },
  { level: 4, capacity: 5000000, cost: 500000 },
  { level: 5, capacity: 25000000, cost: 2500000 },
];

export interface VaultUpgrade {
  level: number;
  slots: number;
  cost: number;
}

export const VAULT_UPGRADES: VaultUpgrade[] = [
  { level: 0, slots: 9, cost: 0 },
  { level: 1, slots: 18, cost: 10000 },
  { level: 2, slots: 27, cost: 50000 },
  { level: 3, slots: 36, cost: 250000 },
  { level: 4, slots: 54, cost: 1000000 },
];

export function getXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function getSkillXpForLevel(level: number): number {
  return Math.floor(50 * Math.pow(1.4, level - 1));
}

export function createDefaultSkillStats(): SkillStats {
  return {
    level: 1,
    xp: 0,
    xpToNextLevel: getSkillXpForLevel(1),
  };
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
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '') + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(2).replace(/\.?0+$/, '') + 'K';
  if (Number.isInteger(num)) return num.toString();
  return parseFloat(num.toFixed(2)).toString();
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
      miningSkill: createDefaultSkillStats(),
      farmingSkill: createDefaultSkillStats(),
      dungeonSkill: createDefaultSkillStats(),
    },
    storage: {
      capacity: 500,
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
    equipmentDurability: {
      mainHand: null,
      offHand: null,
    },
    generators: [
      { generatorId: 'cobblestone_generator', tier: 1, lastTick: Date.now(), isActive: true },
    ],
    unlockedGenerators: ['cobblestone_generator'],
    ownedBlueprints: [],
    builtGenerators: ['cobblestone_generator'],
    bank: {
      balance: 0,
      capacity: 10000,
      upgradeLevel: 0,
      peakBalance: 0,
      transactions: [],
    },
    vault: {
      slots: [],
      maxSlots: 9,
      upgradeLevel: 0,
    },
    currentBuilding: null,
    lastSave: Date.now(),
    playTime: 0,
    notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS },
    miningStats: {
      totalBlocksMined: 0,
      blocksMined: {},
    },
    vendorStockPurchases: {},
    vendorStockSeed: Math.floor(Date.now() / (1000 * 60 * 60 * 24)),
  };
}
