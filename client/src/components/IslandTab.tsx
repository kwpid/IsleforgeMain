import { useState, useMemo, useEffect } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { GENERATORS } from '@/lib/generators';
import { GeneratorCard } from './GeneratorCard';
import { StorageView } from './StorageView';
import { CRAFTING_RECIPES, CraftingRecipe, getCraftingCost, canCraftRecipe } from '@/lib/crafting';
import { getItemById, SEED_ITEMS } from '@/lib/items';
import { formatNumber, FARM_TIER_UPGRADES, FARM_UNLOCK_COSTS, WATERING_CAN_TIERS } from '@/lib/gameTypes';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Hammer, Search, Package, Coins, Check, X, ArrowRight, Sparkles, Wand2, Boxes, Shield, UtensilsCrossed, FlaskConical, Plus, Minus, Sprout, Clock, Leaf, Droplets, HelpCircle, Lock } from 'lucide-react';
import { useGameNotifications } from '@/hooks/useGameNotifications';

export function IslandTab() {
  const islandSubTab = useGameStore((s) => s.islandSubTab);

  return (
    <div className="h-full overflow-y-auto scrollbar-pixel p-6">
      {islandSubTab === 'generators' && <div key="generators" className="animate-subtab-content"><GeneratorsView /></div>}
      {islandSubTab === 'storage' && <div key="storage" className="animate-subtab-content"><StorageView /></div>}
      {islandSubTab === 'crafting' && <div key="crafting" className="animate-subtab-content"><CraftingView /></div>}
      {islandSubTab === 'farming' && <div key="farming" className="animate-subtab-content"><FarmingView /></div>}
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

function FarmingView() {
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  const [seedGuideOpen, setSeedGuideOpen] = useState(false);
  const inventory = useGameStore((s) => s.inventory);
  const storage = useGameStore((s) => s.storage);
  const farming = useGameStore((s) => s.farming);
  const plantCrop = useGameStore((s) => s.plantCrop);
  const waterCrop = useGameStore((s) => s.waterCrop);
  const harvestCrop = useGameStore((s) => s.harvestCrop);
  const harvestAllCrops = useGameStore((s) => s.harvestAllCrops);
  const upgradeFarm = useGameStore((s) => s.upgradeFarm);
  const unlockFarm = useGameStore((s) => s.unlockFarm);
  const setSelectedFarm = useGameStore((s) => s.setSelectedFarm);
  const tickFarming = useGameStore((s) => s.tickFarming);
  const refillWateringCan = useGameStore((s) => s.refillWateringCan);
  const getBestWateringCan = useGameStore((s) => s.getBestWateringCan);
  const coins = useGameStore((s) => s.player.coins);
  
  const { success, warning } = useGameNotifications();
  
  const allItems = [...inventory.items, ...storage.items];
  
  const ownedSeeds = useMemo(() => {
    const seedMap = new Map<string, number>();
    allItems.forEach(item => {
      const seed = SEED_ITEMS.find(s => s.id === item.itemId);
      if (seed) {
        seedMap.set(item.itemId, (seedMap.get(item.itemId) || 0) + item.quantity);
      }
    });
    return Array.from(seedMap.entries()).map(([itemId, quantity]) => {
      const seed = SEED_ITEMS.find(s => s.id === itemId);
      return { itemId, quantity, seed };
    }).filter(item => item.seed);
  }, [allItems]);

  useEffect(() => {
    const interval = setInterval(() => {
      useGameStore.getState().tickFarming();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedSeed && !ownedSeeds.some(s => s.itemId === selectedSeed && s.quantity > 0)) {
      setSelectedSeed(null);
    }
  }, [ownedSeeds, selectedSeed]);

  const selectedFarm = farming.farms.find(f => f.id === farming.selectedFarmId);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getGrowthProgress = (crop: { plantedAt: number; growthTime: number; watered: boolean; growthStage: number; maxGrowthStage: number }) => {
    const elapsedMs = Date.now() - crop.plantedAt;
    const elapsedSeconds = elapsedMs / 1000;
    const growthSpeedMultiplier = crop.watered ? 2.0 : 1.0;
    const adjustedGrowthTime = crop.growthTime / growthSpeedMultiplier;
    const progress = Math.min(100, (elapsedSeconds / adjustedGrowthTime) * 100);
    return progress;
  };

  const handlePlotClick = (slotIndex: number) => {
    if (!selectedFarm) return;
    
    const slot = selectedFarm.slots[slotIndex];
    
    if (slot === null) {
      if (selectedSeed) {
        const planted = plantCrop(selectedFarm.id, slotIndex, selectedSeed);
        if (planted) {
          const seed = SEED_ITEMS.find(s => s.id === selectedSeed);
          success('Crop Planted!', `Planted ${seed?.name || 'seed'}`);
        } else {
          warning('Cannot Plant', 'No seeds available or plot occupied');
        }
      } else {
        warning('Select a Seed', 'Click a seed from your inventory first');
      }
    } else if (slot.growthStage >= slot.maxGrowthStage) {
      const harvested = harvestCrop(selectedFarm.id, slotIndex);
      if (harvested) {
        success('Crop Harvested!', 'Harvested crop and gained farming XP');
      }
    } else {
      if (farming.wateringCanUses > 0 && !slot.watered) {
        const watered = waterCrop(selectedFarm.id, slotIndex);
        if (watered) {
          success('Crop Watered!', 'Growth speed doubled');
        }
      } else if (slot.watered) {
        warning('Already Watered', 'This crop has already been watered');
      } else {
        warning('No Water', 'Refill your watering can at the well');
      }
    }
  };

  const handleHarvestAll = () => {
    if (!selectedFarm) return;
    const count = harvestAllCrops(selectedFarm.id);
    if (count > 0) {
      success('Harvested All!', `Harvested ${count} crops`);
    } else {
      warning('Nothing to Harvest', 'No crops are ready for harvest');
    }
  };

  const handleUpgradeFarm = () => {
    if (!selectedFarm) return;
    const upgraded = upgradeFarm(selectedFarm.id);
    if (upgraded) {
      success('Farm Upgraded!', 'More slots available');
    } else {
      warning('Cannot Upgrade', 'Not enough coins or max tier reached');
    }
  };

  const handleUnlockFarm = (farmId: string) => {
    const unlocked = unlockFarm(farmId);
    if (unlocked) {
      success('Farm Unlocked!', 'New farm is ready for planting');
    } else {
      warning('Cannot Unlock', 'Not enough coins');
    }
  };

  const handleRefillWateringCan = () => {
    const currentBestCan = getBestWateringCan();
    if (!currentBestCan) {
      warning('No Watering Can', 'Purchase a watering can from the marketplace');
      return;
    }
    if (coins < currentBestCan.refillCost) {
      warning('Not Enough Coins', `You need ${formatNumber(currentBestCan.refillCost)} coins to refill`);
      return;
    }
    const result = refillWateringCan();
    if (result.success) {
      success('Watering Can Refilled!', `${result.capacity} uses available (cost: ${formatNumber(result.cost || 0)} coins)`);
    } else if (result.reason === 'no_can') {
      warning('No Watering Can', 'Purchase a watering can from the marketplace');
    } else if (result.reason === 'already_full') {
      warning('Already Full', 'Your watering can is already full');
    } else if (result.reason === 'no_coins') {
      warning('Not Enough Coins', 'You need more coins to refill');
    }
  };

  const bestWateringCan = getBestWateringCan();
  const hasWateringCan = bestWateringCan !== null;
  const maxWaterCapacity = hasWateringCan ? bestWateringCan.capacity : 0;
  const refillCost = hasWateringCan ? bestWateringCan.refillCost : 0;
  const canAffordRefill = coins >= refillCost;
  const readyCrops = selectedFarm?.slots.filter(s => s && s.growthStage >= s.maxGrowthStage).length || 0;
  
  const nextUpgrade = selectedFarm ? FARM_TIER_UPGRADES.find(u => u.tier === selectedFarm.tier + 1) : null;
  const canUpgrade = nextUpgrade && coins >= nextUpgrade.cost;

  const getUnlockCost = (farmId: string) => {
    const unlockInfo = FARM_UNLOCK_COSTS.find(u => u.farmId === farmId);
    return unlockInfo?.cost || 0;
  };

  return (
    <div className="animate-content-fade">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="pixel-text text-lg text-foreground mb-2 flex items-center gap-2">
            <Sprout className="w-5 h-5 text-green-500" />
            Farming
          </h2>
          <p className="font-sans text-muted-foreground text-sm">
            Plant seeds to grow crops! Click a seed, then click an empty plot to plant.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={seedGuideOpen} onOpenChange={setSeedGuideOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="pixel-text-sm text-[8px]" data-testid="button-seed-guide">
                <HelpCircle className="w-3 h-3 mr-1" />
                Seed Guide
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] pixel-border border-border" data-testid="dialog-seed-guide">
              <DialogHeader>
                <DialogTitle className="pixel-text text-lg flex items-center gap-2" data-testid="text-seed-guide-title">
                  <Sprout className="w-5 h-5 text-green-500" />
                  Seed Guide
                </DialogTitle>
                <DialogDescription className="font-sans text-muted-foreground">
                  Learn about all available seeds and their growth times
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SEED_ITEMS.map((seed) => {
                    const cropItem = getItemById(seed.cropItemId || '');
                    const growthProgress = 100;
                    return (
                      <div 
                        key={seed.id}
                        className="pixel-border border-border bg-muted/20 p-3 flex items-center gap-3"
                      >
                        <div className="flex items-center gap-2">
                          <PixelIcon icon={seed.icon} size="md" />
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <PixelIcon icon={cropItem?.icon || 'wheat'} size="md" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="pixel-text-sm text-[9px] truncate">{seed.name}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className={cn("pixel-text-sm text-[6px]", `rarity-${seed.rarity}`)}>
                              {seed.rarity}
                            </Badge>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span className="pixel-text-sm text-[7px]">{formatTime(seed.growthTime || 0)}</span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <Progress value={growthProgress} className="h-1.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
          {hasWateringCan ? (
            <Badge variant="outline" className="pixel-text-sm text-[8px] flex items-center gap-1">
              <Droplets className="w-3 h-3 text-blue-500" />
              {farming.wateringCanUses}/{maxWaterCapacity} Water
            </Badge>
          ) : (
            <Badge variant="outline" className="pixel-text-sm text-[8px] flex items-center gap-1 text-muted-foreground">
              <Droplets className="w-3 h-3" />
              No Watering Can
            </Badge>
          )}
          {hasWateringCan && farming.wateringCanUses < maxWaterCapacity && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleRefillWateringCan} 
              disabled={!canAffordRefill}
              className="pixel-text-sm text-[8px]" 
              data-testid="button-refill-watering-can"
            >
              Refill
              <PixelIcon icon="coin" size="sm" className="ml-1" />
              {formatNumber(refillCost)}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="pixel-border lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="pixel-text text-sm flex items-center gap-2">
              <Package className="w-4 h-4" />
              Your Seeds
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ownedSeeds.length === 0 ? (
              <div className="text-center py-8">
                <Leaf className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="pixel-text-sm text-muted-foreground text-[9px]">
                  No seeds in inventory
                </p>
                <p className="font-sans text-xs text-muted-foreground mt-2">
                  Visit the Marketplace to purchase seeds
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {ownedSeeds.map(({ itemId, quantity, seed }) => (
                  <HoverCard key={itemId} openDelay={0} closeDelay={0}>
                    <HoverCardTrigger asChild>
                      <div 
                        className={cn(
                          "item-slot-lg item-slot-filled cursor-pointer hover-elevate active-elevate-2",
                          `rarity-${seed?.rarity}`,
                          selectedSeed === itemId && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        )}
                        onClick={() => setSelectedSeed(selectedSeed === itemId ? null : itemId)}
                        data-testid={`seed-item-${itemId}`}
                      >
                        <PixelIcon icon={seed?.icon || itemId} size="lg" />
                        {quantity > 1 && (
                          <span className="absolute bottom-0 right-0.5 pixel-text-sm text-[7px] text-foreground tabular-nums drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                            {formatNumber(quantity)}
                          </span>
                        )}
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64 p-3 pixel-border border-border">
                      {seed && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <PixelIcon icon={seed.icon} size="md" />
                            <div>
                              <p className="pixel-text-sm text-[10px] text-foreground">{seed.name}</p>
                              <Badge variant="outline" className={cn("pixel-text-sm text-[6px]", `rarity-${seed.rarity}`)}>
                                {seed.rarity}
                              </Badge>
                            </div>
                          </div>
                          <p className="font-sans text-xs text-muted-foreground mb-2">{seed.description}</p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[8px]">
                              <span className="pixel-text-sm text-muted-foreground">Growth Time</span>
                              <span className="pixel-text-sm text-foreground">{formatTime(seed.growthTime || 0)}</span>
                            </div>
                            <div className="w-full">
                              <div className="flex items-center justify-between text-[7px] mb-1">
                                <span className="text-muted-foreground">Full Growth</span>
                                <span className="text-green-500">{formatTime(seed.growthTime || 0)}</span>
                              </div>
                              <Progress value={100} className="h-2" />
                            </div>
                            <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
                              <Package className="w-3 h-3" />
                              <span>Owned: {quantity}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </div>
            )}
            {selectedSeed && ownedSeeds.some(s => s.itemId === selectedSeed && s.quantity > 0) && (
              <div className="mt-4 p-2 bg-primary/10 rounded-md">
                <p className="pixel-text-sm text-[8px] text-center">
                  Selected: {SEED_ITEMS.find(s => s.id === selectedSeed)?.name}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="pixel-border lg:col-span-2">
          <CardHeader className="pb-3 flex-row items-center justify-between gap-2">
            <CardTitle className="pixel-text text-sm flex items-center gap-2">
              <Leaf className="w-4 h-4 text-green-500" />
              {selectedFarm?.name || 'Farm'} (Tier {selectedFarm?.tier || 1})
            </CardTitle>
            <div className="flex items-center gap-2">
              {readyCrops > 0 && (
                <Button size="sm" onClick={handleHarvestAll} className="pixel-text-sm text-[8px]" data-testid="button-harvest-all">
                  <Check className="w-3 h-3 mr-1" />
                  Harvest All ({readyCrops})
                </Button>
              )}
              {nextUpgrade && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleUpgradeFarm} 
                  disabled={!canUpgrade}
                  className="pixel-text-sm text-[8px]" 
                  data-testid="button-upgrade-farm"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Upgrade
                  <PixelIcon icon="coin" size="sm" className="ml-1" />
                  {formatNumber(nextUpgrade.cost)}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={farming.selectedFarmId} onValueChange={setSelectedFarm} className="mb-4">
              <TabsList className="flex flex-wrap gap-1 h-auto bg-muted/30 p-1">
                {farming.farms.map((farm) => {
                  const unlockCost = getUnlockCost(farm.id);
                  const canAffordFarm = coins >= unlockCost;
                  return (
                    <TabsTrigger
                      key={farm.id}
                      value={farm.id}
                      className={cn(
                        "pixel-text-sm text-[7px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                        !farm.unlocked && "border border-dashed border-muted-foreground/50",
                        !farm.unlocked && !canAffordFarm && "opacity-50",
                        !farm.unlocked && canAffordFarm && "border-green-500/50"
                      )}
                      data-testid={`tab-farm-${farm.id}`}
                    >
                      {farm.unlocked ? farm.name : (
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <PixelIcon icon="coin" size="sm" />
                          {formatNumber(unlockCost)}
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>

            {selectedFarm?.unlocked ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {selectedFarm.slots.map((slot, idx) => {
                  const seed = slot ? SEED_ITEMS.find(s => s.id === slot.seedId) : null;
                  const isReady = slot && slot.growthStage >= slot.maxGrowthStage;
                  const progress = slot ? (slot.growthStage / slot.maxGrowthStage) * 100 : 0;
                  const growthProgress = slot ? getGrowthProgress(slot) : 0;
                  
                  return (
                    <HoverCard key={idx} openDelay={0} closeDelay={0}>
                      <HoverCardTrigger asChild>
                        <div
                          className={cn(
                            "item-slot-xl cursor-pointer hover-elevate active-elevate-2 relative",
                            slot === null && "bg-muted/30 border-dashed",
                            slot && !isReady && "bg-green-900/20",
                            isReady && "bg-amber-500/30 border-amber-500"
                          )}
                          onClick={() => handlePlotClick(idx)}
                          data-testid={`farm-slot-${idx}`}
                        >
                          {slot === null ? (
                            <Plus className="w-6 h-6 text-muted-foreground" />
                          ) : (
                            <>
                              <PixelIcon 
                                icon={isReady ? (seed?.grownIcon || seed?.icon || 'wheat_grown') : (seed?.plantedIcon || 'planted')} 
                                size="lg" 
                              />
                              {slot.watered && (
                                <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                                  <Droplets className="w-2 h-2 text-white" />
                                </div>
                              )}
                              {!isReady && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted rounded-b overflow-hidden">
                                  <div className="h-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-56 p-3 pixel-border border-border">
                        {slot === null ? (
                          <div className="text-center">
                            <p className="pixel-text-sm text-[9px] text-muted-foreground">
                              {selectedSeed ? 'Click to plant selected seed' : 'Select a seed first'}
                            </p>
                          </div>
                        ) : isReady ? (
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <PixelIcon icon={seed?.grownIcon || seed?.icon || 'wheat'} size="md" />
                              <p className="pixel-text-sm text-[10px] text-foreground">{seed?.name?.replace(' Seeds', '')}</p>
                            </div>
                            <Badge className="pixel-text-sm text-[7px] bg-amber-500">Ready to Harvest!</Badge>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <PixelIcon icon={seed?.icon || 'wheat_seeds'} size="md" />
                              <p className="pixel-text-sm text-[10px] text-foreground">{seed?.name}</p>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[8px]">
                                <span className="pixel-text-sm text-muted-foreground">Growth Progress</span>
                                <span className="pixel-text-sm text-green-500">{Math.round(growthProgress)}%</span>
                              </div>
                              <Progress value={growthProgress} className="h-2" />
                              {slot.watered && (
                                <div className="flex items-center gap-1 text-[8px] text-blue-400">
                                  <Droplets className="w-3 h-3" />
                                  <span>Watered (2x speed)</span>
                                </div>
                              )}
                              {!slot.watered && farming.wateringCanUses > 0 && (
                                <p className="text-[8px] text-blue-400">Click to water (2x speed)</p>
                              )}
                            </div>
                          </div>
                        )}
                      </HoverCardContent>
                    </HoverCard>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="pixel-text text-foreground mb-2">Farm Locked</p>
                <p className="font-sans text-sm text-muted-foreground mb-4">
                  Unlock this farm to expand your farming operation
                </p>
                <Button 
                  onClick={() => handleUnlockFarm(selectedFarm?.id || '')} 
                  disabled={coins < getUnlockCost(selectedFarm?.id || '')}
                  className="pixel-text-sm" 
                  data-testid="button-unlock-farm"
                >
                  <Coins className="w-4 h-4 mr-2" />
                  Unlock
                  <PixelIcon icon="coin" size="sm" className="ml-1" />
                  {formatNumber(getUnlockCost(selectedFarm?.id || ''))}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
