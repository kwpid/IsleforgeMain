import { getItemById, ALL_ITEMS } from './items';
import { CraftingIngredient, ItemRecipe, StorageUnit, PlayerStorageSystem, PlayerStorage } from './gameTypes';

export interface CraftingRecipe {
  id: string;
  resultItemId: string;
  resultQuantity: number;
  ingredients: CraftingIngredient[];
  craftTime: number;
  category: 'tools' | 'armor' | 'materials' | 'blocks' | 'food' | 'potions';
}

const ADDITIONAL_RECIPES: CraftingRecipe[] = [
  {
    id: 'craft_oak_planks',
    resultItemId: 'oak_planks',
    resultQuantity: 4,
    ingredients: [
      { itemId: 'oak_log', quantity: 1 },
    ],
    craftTime: 1000,
    category: 'materials',
  },
  {
    id: 'craft_iron_ingot',
    resultItemId: 'iron_ingot',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'iron_ore', quantity: 1 },
      { itemId: 'coal', quantity: 1 },
    ],
    craftTime: 5000,
    category: 'materials',
  },
  {
    id: 'craft_gold_ingot',
    resultItemId: 'gold_ingot',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'gold_ore', quantity: 1 },
      { itemId: 'coal', quantity: 1 },
    ],
    craftTime: 6000,
    category: 'materials',
  },
];

function buildAllRecipes(): readonly CraftingRecipe[] {
  const recipeMap = new Map<string, CraftingRecipe>();
  
  for (const item of ALL_ITEMS) {
    if (item.recipe) {
      const id = `craft_${item.id}`;
      recipeMap.set(id, {
        id,
        resultItemId: item.id,
        resultQuantity: item.recipe.resultQuantity,
        ingredients: item.recipe.ingredients,
        craftTime: item.recipe.craftTime,
        category: item.recipe.category,
      });
    }
  }
  
  for (const recipe of ADDITIONAL_RECIPES) {
    if (!recipeMap.has(recipe.id)) {
      recipeMap.set(recipe.id, recipe);
    }
  }
  
  return Object.freeze(Array.from(recipeMap.values()));
}

export const CRAFTING_RECIPES: readonly CraftingRecipe[] = buildAllRecipes();

export function getRecipeById(recipeId: string): CraftingRecipe | undefined {
  return CRAFTING_RECIPES.find(r => r.id === recipeId);
}

export function getRecipesByCategory(category: CraftingRecipe['category']): CraftingRecipe[] {
  return CRAFTING_RECIPES.filter(r => r.category === category);
}

export function getCraftingCost(recipe: CraftingRecipe): number {
  const resultItem = getItemById(recipe.resultItemId);
  if (!resultItem) return 0;
  return Math.floor(resultItem.sellPrice * recipe.resultQuantity * 0.5);
}

export function getAllStorageItems(
  legacyStorage: PlayerStorage,
  storageSystem: PlayerStorageSystem
): { itemId: string; quantity: number }[] {
  const itemMap = new Map<string, number>();
  
  for (const item of legacyStorage.items) {
    itemMap.set(item.itemId, (itemMap.get(item.itemId) || 0) + item.quantity);
  }
  
  for (const unit of storageSystem.units) {
    for (const item of unit.items) {
      itemMap.set(item.itemId, (itemMap.get(item.itemId) || 0) + item.quantity);
    }
  }
  
  return Array.from(itemMap.entries()).map(([itemId, quantity]) => ({ itemId, quantity }));
}

export function canCraftRecipe(
  recipe: CraftingRecipe,
  storageItems: { itemId: string; quantity: number }[],
  coins: number,
  quantity: number = 1
): { canCraft: boolean; missingIngredients: { itemId: string; have: number; need: number }[]; cost: number; maxCraftable: number } {
  const costPerItem = getCraftingCost(recipe);
  const totalCost = costPerItem * quantity;
  const missingIngredients: { itemId: string; have: number; need: number }[] = [];
  
  let maxCraftable = costPerItem > 0 ? Math.floor(coins / costPerItem) : 999999;
  
  for (const ingredient of recipe.ingredients) {
    const storageItem = storageItems.find(i => i.itemId === ingredient.itemId);
    const haveQuantity = storageItem?.quantity || 0;
    const needQuantity = ingredient.quantity * quantity;
    
    const craftableFromIngredient = Math.floor(haveQuantity / ingredient.quantity);
    maxCraftable = Math.min(maxCraftable, craftableFromIngredient);
    
    if (haveQuantity < needQuantity) {
      missingIngredients.push({
        itemId: ingredient.itemId,
        have: haveQuantity,
        need: needQuantity,
      });
    }
  }
  
  const hasEnoughCoins = coins >= totalCost;
  
  return {
    canCraft: missingIngredients.length === 0 && hasEnoughCoins,
    missingIngredients,
    cost: totalCost,
    maxCraftable: Math.max(0, maxCraftable),
  };
}
