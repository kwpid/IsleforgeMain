import { ItemDefinition } from '../gameTypes';
import { BLOCK_ITEMS } from './blocks';
import { MINERAL_ITEMS } from './minerals';
import { MATERIAL_ITEMS } from './materials';
import { FOOD_ITEMS } from './food';
import { TOOL_ITEMS } from './tools';
import { ARMOR_ITEMS } from './armor';
import { POTION_ITEMS } from './potions';
import { SPECIAL_ITEMS } from './special';
import { SEED_ITEMS, CROP_ITEMS } from './seeds';

export const ALL_ITEMS: ItemDefinition[] = [
  ...BLOCK_ITEMS,
  ...MINERAL_ITEMS,
  ...MATERIAL_ITEMS,
  ...FOOD_ITEMS,
  ...TOOL_ITEMS,
  ...ARMOR_ITEMS,
  ...POTION_ITEMS,
  ...SPECIAL_ITEMS,
  ...SEED_ITEMS,
  ...CROP_ITEMS,
];

export const ITEMS_BY_ID: Record<string, ItemDefinition> = ALL_ITEMS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<string, ItemDefinition>
);

export function getItemById(id: string): ItemDefinition | undefined {
  return ITEMS_BY_ID[id];
}

export function getItemsByType(type: ItemDefinition['type']): ItemDefinition[] {
  return ALL_ITEMS.filter(item => item.type === type);
}

export function getItemsByRarity(rarity: ItemDefinition['rarity']): ItemDefinition[] {
  return ALL_ITEMS.filter(item => item.rarity === rarity);
}

export function getSpecialItems(): ItemDefinition[] {
  return ALL_ITEMS.filter(item => item.isSpecial);
}

export function getEnchantedItems(): ItemDefinition[] {
  return ALL_ITEMS.filter(item => item.isEnchanted);
}

export { BLOCK_ITEMS, MINERAL_ITEMS, MATERIAL_ITEMS, FOOD_ITEMS, TOOL_ITEMS, ARMOR_ITEMS, POTION_ITEMS, SPECIAL_ITEMS, SEED_ITEMS, CROP_ITEMS };
