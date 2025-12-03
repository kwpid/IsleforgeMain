import { getItemById } from './items';

export interface CraftingRecipe {
  id: string;
  resultItemId: string;
  resultQuantity: number;
  ingredients: { itemId: string; quantity: number }[];
  craftTime: number;
  category: 'tools' | 'armor' | 'materials' | 'blocks' | 'food' | 'potions';
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'craft_stick',
    resultItemId: 'stick',
    resultQuantity: 4,
    ingredients: [
      { itemId: 'oak_planks', quantity: 2 },
    ],
    craftTime: 1000,
    category: 'materials',
  },
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
    id: 'craft_wooden_pickaxe',
    resultItemId: 'wooden_pickaxe',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'oak_planks', quantity: 3 },
      { itemId: 'stick', quantity: 2 },
    ],
    craftTime: 3000,
    category: 'tools',
  },
  {
    id: 'craft_stone_pickaxe',
    resultItemId: 'stone_pickaxe',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'cobblestone', quantity: 3 },
      { itemId: 'stick', quantity: 2 },
    ],
    craftTime: 4000,
    category: 'tools',
  },
  {
    id: 'craft_iron_pickaxe',
    resultItemId: 'iron_pickaxe',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'iron_ingot', quantity: 3 },
      { itemId: 'stick', quantity: 2 },
    ],
    craftTime: 5000,
    category: 'tools',
  },
  {
    id: 'craft_diamond_pickaxe',
    resultItemId: 'diamond_pickaxe',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'diamond', quantity: 3 },
      { itemId: 'stick', quantity: 2 },
    ],
    craftTime: 8000,
    category: 'tools',
  },
  {
    id: 'craft_iron_sword',
    resultItemId: 'iron_sword',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'iron_ingot', quantity: 2 },
      { itemId: 'stick', quantity: 1 },
    ],
    craftTime: 4000,
    category: 'tools',
  },
  {
    id: 'craft_diamond_sword',
    resultItemId: 'diamond_sword',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'diamond', quantity: 2 },
      { itemId: 'stick', quantity: 1 },
    ],
    craftTime: 7000,
    category: 'tools',
  },
  {
    id: 'craft_iron_axe',
    resultItemId: 'iron_axe',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'iron_ingot', quantity: 3 },
      { itemId: 'stick', quantity: 2 },
    ],
    craftTime: 5000,
    category: 'tools',
  },
  {
    id: 'craft_leather_helmet',
    resultItemId: 'leather_helmet',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'leather', quantity: 5 },
    ],
    craftTime: 4000,
    category: 'armor',
  },
  {
    id: 'craft_leather_chestplate',
    resultItemId: 'leather_chestplate',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'leather', quantity: 8 },
    ],
    craftTime: 5000,
    category: 'armor',
  },
  {
    id: 'craft_iron_helmet',
    resultItemId: 'iron_helmet',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'iron_ingot', quantity: 5 },
    ],
    craftTime: 6000,
    category: 'armor',
  },
  {
    id: 'craft_iron_chestplate',
    resultItemId: 'iron_chestplate',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'iron_ingot', quantity: 8 },
    ],
    craftTime: 7000,
    category: 'armor',
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
  {
    id: 'craft_blaze_powder',
    resultItemId: 'blaze_powder',
    resultQuantity: 2,
    ingredients: [
      { itemId: 'blaze_rod', quantity: 1 },
    ],
    craftTime: 2000,
    category: 'materials',
  },
  {
    id: 'craft_bread',
    resultItemId: 'bread',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'wheat', quantity: 3 },
    ],
    craftTime: 3000,
    category: 'food',
  },
  {
    id: 'craft_golden_apple',
    resultItemId: 'golden_apple',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'apple', quantity: 1 },
      { itemId: 'gold_ingot', quantity: 8 },
    ],
    craftTime: 10000,
    category: 'food',
  },
];

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

export function canCraftRecipe(
  recipe: CraftingRecipe,
  storageItems: { itemId: string; quantity: number }[],
  coins: number,
  quantity: number = 1
): { canCraft: boolean; missingIngredients: { itemId: string; have: number; need: number }[]; cost: number; maxCraftable: number } {
  const costPerItem = getCraftingCost(recipe);
  const totalCost = costPerItem * quantity;
  const missingIngredients: { itemId: string; have: number; need: number }[] = [];
  
  let maxCraftable = Math.floor(coins / costPerItem);
  
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
