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
import { Hammer, Search, Package, Coins, Check, X, ArrowRight, Sparkles, Wand2, Boxes, Shield, UtensilsCrossed, FlaskConical } from 'lucide-react';
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
  const [craftingRecipe, setCraftingRecipe] = useState<CraftingRecipe | null>(null);
  const [craftingProgress, setCraftingProgress] = useState(0);
  const [isCrafting, setIsCrafting] = useState(false);
  
  const storage = useGameStore((s) => s.storage);
  const coins = useGameStore((s) => s.player.coins);
  const craftItem = useGameStore((s) => s.craftItem);
  
  const { success, warning } = useGameNotifications();

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

  const handleCraft = (recipe: CraftingRecipe) => {
    const craftCheck = canCraftRecipe(recipe, storage.items, coins);
    
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
    
    setCraftingRecipe(recipe);
    setIsCrafting(true);
    setCraftingProgress(0);
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / recipe.craftTime) * 100, 100);
      setCraftingProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        const crafted = craftItem(recipe.id);
        if (crafted) {
          const item = getItemById(recipe.resultItemId);
          success('Crafted!', `Created ${recipe.resultQuantity}x ${item?.name || recipe.resultItemId}`);
        }
        setIsCrafting(false);
        setCraftingRecipe(null);
        setCraftingProgress(0);
      }
    }, 50);
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
        <div className="flex items-center gap-2">
          <PixelIcon icon="coin" size="sm" />
          <span className="pixel-text-sm text-game-coin">{formatNumber(coins)}</span>
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

      {isCrafting && craftingRecipe && (
        <Card className="pixel-border border-primary/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="pixel-border p-2 bg-muted/30">
                <PixelIcon icon={getItemById(craftingRecipe.resultItemId)?.icon || 'lock'} size="lg" />
              </div>
              <div className="flex-1">
                <p className="pixel-text-sm text-[10px] mb-2">
                  Crafting {getItemById(craftingRecipe.resultItemId)?.name}...
                </p>
                <Progress value={craftingProgress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredRecipes.map((recipe) => {
          const resultItem = getItemById(recipe.resultItemId);
          if (!resultItem) return null;
          
          const craftCheck = canCraftRecipe(recipe, storage.items, coins);
          const cost = getCraftingCost(recipe);
          
          return (
            <Card 
              key={recipe.id}
              className={cn(
                "pixel-border cursor-pointer hover-elevate active-elevate-2 overflow-visible",
                !craftCheck.canCraft && "opacity-60"
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
                    <HoverCardContent side="top" className="p-0 border-0 bg-transparent w-auto">
                      <ItemTooltip item={resultItem} />
                    </HoverCardContent>
                  </HoverCard>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="pixel-text-sm text-[8px] truncate">
                      {resultItem.name}
                    </CardTitle>
                    {recipe.resultQuantity > 1 && (
                      <Badge variant="secondary" className="pixel-text-sm text-[6px] mt-0.5">
                        x{recipe.resultQuantity}
                      </Badge>
                    )}
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
                        const hasEnough = have >= ing.quantity;
                        
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
                                  {have}/{ing.quantity}
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
                  
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-1">
                      <PixelIcon icon="coin" size="sm" />
                      <span className={cn(
                        "pixel-text-sm text-[7px]",
                        coins >= cost ? "text-game-coin" : "text-destructive"
                      )}>
                        {formatNumber(cost)}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCraft(recipe)}
                      disabled={!craftCheck.canCraft || isCrafting}
                      className="pixel-text-sm text-[7px]"
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
