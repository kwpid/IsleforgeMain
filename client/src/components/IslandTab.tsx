import { useState, useMemo } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { GENERATORS } from '@/lib/generators';
import { GeneratorCard } from './GeneratorCard';
import { StorageView } from './StorageView';
import { CRAFTING_RECIPES, CraftingRecipe, getCraftingCost, canCraftRecipe } from '@/lib/crafting';
import { getItemById } from '@/lib/items';
import { formatNumber } from '@/lib/gameTypes';
import { PixelIcon } from './PixelIcon';
import { ItemTooltip } from './ItemTooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import { Hammer, Search, Package, Coins, Check, X, ArrowRight, Sparkles, Wand2, Boxes, Shield, UtensilsCrossed, FlaskConical, Plus, Minus } from 'lucide-react';
import { useGameNotifications } from '@/hooks/useGameNotifications';

export function IslandTab() {
  const islandSubTab = useGameStore((s) => s.islandSubTab);

  return (
    <div className="h-full overflow-y-auto scrollbar-pixel p-6">
      {islandSubTab === 'generators' && <GeneratorsView />}
      {islandSubTab === 'storage' && <StorageView />}
      {islandSubTab === 'crafting' && <CraftingView />}
    </div>
  );
}

function GeneratorsView() {
  const generators = useGameStore((s) => s.generators);
  const unlockedGenerators = useGameStore((s) => s.unlockedGenerators);
  const upgradeGenerator = useGameStore((s) => s.upgradeGenerator);

  const ownedGenerators = GENERATORS.filter((gen) => 
    unlockedGenerators.includes(gen.id)
  );

  return (
    <div>
      <h2 className="pixel-text text-lg text-foreground mb-2">
        Resource Generators
      </h2>
      <p className="font-sans text-muted-foreground text-sm mb-6">
        Your active generators producing resources. Build more from blueprints!
      </p>
      
      {ownedGenerators.length === 0 ? (
        <div className="pixel-border border-border bg-card p-8 text-center">
          <p className="pixel-text-sm text-muted-foreground">
            No generators yet. Visit the Hub to get blueprints and build your first generator!
          </p>
        </div>
      ) : (
        <div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          data-testid="generators-grid"
        >
          {ownedGenerators.map((generator) => {
            const owned = generators.find((g) => g.generatorId === generator.id);

            return (
              <GeneratorCard
                key={generator.id}
                generator={generator}
                owned={owned}
                onUnlock={() => {}}
                onUpgrade={() => upgradeGenerator(generator.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

type CraftingCategory = 'all' | 'tools' | 'armor' | 'materials' | 'food' | 'potions';

const CATEGORY_ICONS: Record<CraftingCategory, typeof Hammer> = {
  all: Package,
  tools: Hammer,
  armor: Shield,
  materials: Boxes,
  food: UtensilsCrossed,
  potions: FlaskConical,
};

const CATEGORY_LABELS: Record<CraftingCategory, string> = {
  all: 'All Recipes',
  tools: 'Tools',
  armor: 'Armor',
  materials: 'Materials',
  food: 'Food',
  potions: 'Potions',
};

function CraftingView() {
  const [selectedCategory, setSelectedCategory] = useState<CraftingCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [craftQuantities, setCraftQuantities] = useState<Record<string, number>>({});
  
  const storage = useGameStore((s) => s.storage);
  const coins = useGameStore((s) => s.player.coins);
  const craftItem = useGameStore((s) => s.craftItem);
  
  const { success, warning } = useGameNotifications();
  
  const getCraftQuantity = (recipeId: string) => craftQuantities[recipeId] || 1;
  const setCraftQuantity = (recipeId: string, quantity: number) => {
    setCraftQuantities(prev => ({ ...prev, [recipeId]: Math.max(1, quantity) }));
  };

  const filteredRecipes = useMemo(() => {
    let recipes = CRAFTING_RECIPES;
    
    if (selectedCategory !== 'all') {
      recipes = recipes.filter(r => r.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      recipes = recipes.filter(r => {
        const item = getItemById(r.resultItemId);
        return item?.name.toLowerCase().includes(query) || 
               r.resultItemId.toLowerCase().includes(query);
      });
    }
    
    return recipes;
  }, [selectedCategory, searchQuery]);

  const handleCraft = (recipe: CraftingRecipe, quantity: number = 1) => {
    const craftCheck = canCraftRecipe(recipe, storage.items, coins, quantity);
    
    if (!craftCheck.canCraft) {
      if (craftCheck.missingIngredients.length > 0) {
        const missing = craftCheck.missingIngredients.map(m => {
          const item = getItemById(m.itemId);
          return `${item?.name || m.itemId}: need ${m.need}, have ${m.have}`;
        }).join(', ');
        warning('Missing Ingredients', missing);
      } else {
        warning('Not Enough Coins', `You need ${formatNumber(craftCheck.cost)} coins`);
      }
      return;
    }
    
    const crafted = craftItem(recipe.id, quantity);
    if (crafted) {
      const item = getItemById(recipe.resultItemId);
      const totalOutput = recipe.resultQuantity * quantity;
      success('Crafted!', `Created ${totalOutput}x ${item?.name || recipe.resultItemId}`);
    }
  };
  
  const handleCraftMax = (recipe: CraftingRecipe) => {
    const craftCheck = canCraftRecipe(recipe, storage.items, coins, 1);
    if (craftCheck.maxCraftable > 0) {
      handleCraft(recipe, craftCheck.maxCraftable);
    } else {
      warning('Cannot Craft', 'Not enough materials or coins');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="pixel-text text-lg text-foreground mb-1">Crafting Station</h2>
          <p className="font-sans text-muted-foreground text-sm">
            Craft items using materials from your storage. Costs 50% of market value.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pixel-text-sm text-[9px]"
            data-testid="input-search-crafting"
          />
        </div>
        
        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as CraftingCategory)}>
          <TabsList className="flex flex-wrap gap-1 h-auto bg-muted/30 p-1">
            {(Object.keys(CATEGORY_LABELS) as CraftingCategory[]).map((cat) => {
              const Icon = CATEGORY_ICONS[cat];
              return (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="pixel-text-sm text-[7px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  data-testid={`tab-craft-category-${cat}`}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {CATEGORY_LABELS[cat]}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredRecipes.map((recipe) => {
          const resultItem = getItemById(recipe.resultItemId);
          if (!resultItem) return null;
          
          const craftQty = getCraftQuantity(recipe.id);
          const craftCheck = canCraftRecipe(recipe, storage.items, coins, craftQty);
          const costPerItem = getCraftingCost(recipe);
          const totalCost = costPerItem * craftQty;
          
          return (
            <Card 
              key={recipe.id}
              className={cn(
                "pixel-border hover-elevate active-elevate-2 overflow-visible",
                craftCheck.maxCraftable === 0 && "opacity-60"
              )}
              data-testid={`recipe-${recipe.id}`}
            >
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center gap-2">
                  <HoverCard openDelay={0} closeDelay={0}>
                    <HoverCardTrigger asChild>
                      <div className={cn(
                        "pixel-border p-1.5 bg-muted/30",
                        `rarity-${resultItem.rarity}`,
                        resultItem.isEnchanted && "enchanted-item",
                        resultItem.isSpecial && "special-item"
                      )}>
                        <PixelIcon icon={resultItem.icon} size="md" />
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent side="top" className="p-0 border-0 w-auto">
                      <ItemTooltip item={resultItem} />
                    </HoverCardContent>
                  </HoverCard>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="pixel-text-sm text-[8px] truncate">
                      {resultItem.name}
                    </CardTitle>
                    <div className="flex items-center gap-1 mt-0.5">
                      {recipe.resultQuantity > 1 && (
                        <Badge variant="secondary" className="pixel-text-sm text-[6px]">
                          x{recipe.resultQuantity}
                        </Badge>
                      )}
                      {craftCheck.maxCraftable > 0 && (
                        <Badge variant="outline" className="pixel-text-sm text-[6px]">
                          Max: {craftCheck.maxCraftable}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <p className="pixel-text-sm text-[6px] text-muted-foreground">Ingredients:</p>
                    <div className="flex flex-wrap gap-1">
                      {recipe.ingredients.map((ing) => {
                        const ingItem = getItemById(ing.itemId);
                        const storageItem = storage.items.find(i => i.itemId === ing.itemId);
                        const have = storageItem?.quantity || 0;
                        const need = ing.quantity * craftQty;
                        const hasEnough = have >= need;
                        
                        return (
                          <Tooltip key={ing.itemId} delayDuration={0}>
                            <TooltipTrigger asChild>
                              <div className={cn(
                                "pixel-border p-1 bg-muted/30 flex items-center gap-1",
                                !hasEnough && "border-destructive/50"
                              )}>
                                <PixelIcon icon={ingItem?.icon || 'lock'} size="sm" />
                                <span className={cn(
                                  "pixel-text-sm text-[6px]",
                                  hasEnough ? "text-foreground" : "text-destructive"
                                )}>
                                  {have}/{need}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="pixel-text-sm text-[8px]">{ingItem?.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-1 pt-2 border-t border-border">
                    <div className="flex items-center gap-1">
                      <PixelIcon icon="coin" size="sm" />
                      <span className={cn(
                        "pixel-text-sm text-[7px]",
                        coins >= totalCost ? "text-game-coin" : "text-destructive"
                      )}>
                        {formatNumber(totalCost)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => setCraftQuantity(recipe.id, craftQty - 1)}
                        disabled={craftQty <= 1}
                        data-testid={`button-decrease-${recipe.id}`}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="pixel-text-sm text-[8px] w-6 text-center">{craftQty}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => setCraftQuantity(recipe.id, craftQty + 1)}
                        disabled={craftQty >= craftCheck.maxCraftable}
                        data-testid={`button-increase-${recipe.id}`}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCraftMax(recipe)}
                      disabled={craftCheck.maxCraftable === 0}
                      className="pixel-text-sm text-[6px] flex-1"
                      data-testid={`button-craft-max-${recipe.id}`}
                    >
                      All
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleCraft(recipe, craftQty)}
                      disabled={!craftCheck.canCraft}
                      className="pixel-text-sm text-[7px] flex-1"
                      data-testid={`button-craft-${recipe.id}`}
                    >
                      <Hammer className="w-3 h-3 mr-1" />
                      Craft
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="pixel-border border-border bg-card p-8 text-center">
          <p className="pixel-text-sm text-muted-foreground">
            No recipes found. Try a different search or category.
          </p>
        </div>
      )}
    </div>
  );
}
