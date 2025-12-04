import { z } from "zod";

export const raritySchema = z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary', 'limited', 'mythic']);
export type Rarity = z.infer<typeof raritySchema>;

export const itemTypeSchema = z.enum(['block', 'mineral', 'material', 'food', 'tool', 'armor', 'potion']);
export type ItemType = z.infer<typeof itemTypeSchema>;

export const inventoryItemSchema = z.object({
  itemId: z.string(),
  quantity: z.number().int().positive(),
});
export type InventoryItem = z.infer<typeof inventoryItemSchema>;

export const playerStatsSchema = z.object({
  level: z.number().int().positive(),
  xp: z.number().int().nonnegative(),
  xpToNextLevel: z.number().int().positive(),
  coins: z.number().int().nonnegative(),
  universalPoints: z.number().int().nonnegative(),
  totalCoinsEarned: z.number().int().nonnegative(),
  totalItemsSold: z.number().int().nonnegative(),
});
export type PlayerStats = z.infer<typeof playerStatsSchema>;

export const ownedGeneratorSchema = z.object({
  generatorId: z.string(),
  tier: z.number().int().min(1).max(5),
  lastTick: z.number(),
  isActive: z.boolean(),
});
export type OwnedGenerator = z.infer<typeof ownedGeneratorSchema>;

export const playerStorageSchema = z.object({
  capacity: z.number().int().positive(),
  upgradeLevel: z.number().int().nonnegative(),
  items: z.array(inventoryItemSchema),
});
export type PlayerStorage = z.infer<typeof playerStorageSchema>;

export const playerEquipmentSchema = z.object({
  helmet: z.string().nullable(),
  chestplate: z.string().nullable(),
  leggings: z.string().nullable(),
  boots: z.string().nullable(),
  mainHand: z.string().nullable(),
  offHand: z.string().nullable(),
});
export type PlayerEquipment = z.infer<typeof playerEquipmentSchema>;

export const playerInventorySchema = z.object({
  items: z.array(inventoryItemSchema),
  maxSlots: z.number().int().positive(),
});
export type PlayerInventory = z.infer<typeof playerInventorySchema>;

export const gameStateSchema = z.object({
  player: playerStatsSchema,
  storage: playerStorageSchema,
  inventory: playerInventorySchema,
  equipment: playerEquipmentSchema,
  generators: z.array(ownedGeneratorSchema),
  unlockedGenerators: z.array(z.string()),
  lastSave: z.number(),
  playTime: z.number(),
});
export type GameState = z.infer<typeof gameStateSchema>;
