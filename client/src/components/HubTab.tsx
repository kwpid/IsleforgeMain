import { useState, useMemo } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { formatNumber, Vendor, VendorItem, Blueprint, BlueprintRequirement } from '@/lib/gameTypes';
import { getItemById, getItemsByType } from '@/lib/items';
import { GENERATORS } from '@/lib/generators';
import { PixelIcon } from './PixelIcon';
import { ItemTooltip } from './ItemTooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Clock, Store, Package, Hammer, ChevronRight, Check, Lock } from 'lucide-react';

const DEFAULT_VENDORS: Vendor[] = [
  {
    id: 'blacksmith',
    name: 'Blacksmith Bronson',
    description: 'Forges quality tools and weapons',
    type: 'tools',
    icon: 'vendor_tools',
    priceModifier: 1.0,
    items: [
      { itemId: 'wooden_pickaxe', stock: 10, priceMultiplier: 2.0 },
      { itemId: 'stone_pickaxe', stock: 5, priceMultiplier: 2.2 },
      { itemId: 'iron_pickaxe', stock: 3, priceMultiplier: 2.5, isRotating: true },
      { itemId: 'iron_sword', stock: 2, priceMultiplier: 2.5, isRotating: true },
    ],
  },
  {
    id: 'armorer',
    name: 'Armorsmith Ada',
    description: 'Crafts protective gear for adventurers',
    type: 'armor',
    icon: 'vendor_armor',
    priceModifier: 1.1,
    items: [
      { itemId: 'leather_helmet', stock: 8, priceMultiplier: 2.0 },
      { itemId: 'leather_chestplate', stock: 6, priceMultiplier: 2.0 },
      { itemId: 'iron_helmet', stock: 3, priceMultiplier: 2.5, isRotating: true },
      { itemId: 'iron_chestplate', stock: 2, priceMultiplier: 2.8, isRotating: true },
    ],
  },
  {
    id: 'alchemist',
    name: 'Alchemist Aria',
    description: 'Brews potent potions and elixirs',
    type: 'potions',
    icon: 'vendor_potions',
    priceModifier: 1.2,
    items: [
      { itemId: 'potion_healing', stock: 15, priceMultiplier: 2.0 },
      { itemId: 'potion_speed', stock: 10, priceMultiplier: 2.2 },
      { itemId: 'potion_strength', stock: 5, priceMultiplier: 2.5, isRotating: true },
      { itemId: 'potion_regeneration', stock: 3, priceMultiplier: 3.0, isRotating: true },
    ],
  },
  {
    id: 'baker',
    name: 'Baker Betty',
    description: 'Provides fresh food and provisions',
    type: 'food',
    icon: 'vendor_food',
    priceModifier: 0.9,
    items: [
      { itemId: 'bread', stock: 50, priceMultiplier: 1.5 },
      { itemId: 'apple', stock: 30, priceMultiplier: 1.5 },
      { itemId: 'cooked_beef', stock: 20, priceMultiplier: 2.0 },
      { itemId: 'golden_apple', stock: 2, priceMultiplier: 5.0, isRotating: true },
    ],
  },
];

const TRAVELLING_VENDOR_NAMES = [
  { name: 'Wandering Wilbur', description: 'A mysterious trader from distant lands' },
  { name: 'Mystic Mira', description: 'Deals in rare and enchanted goods' },
  { name: 'Captain Cargo', description: 'Sailor with exotic wares from overseas' },
  { name: 'Nomad Nina', description: 'Desert trader with unique finds' },
  { name: 'Frost Merchant Felix', description: 'Brings goods from frozen territories' },
  { name: 'Jungle Jules', description: 'Explorer with treasures from the wilds' },
  { name: 'Shadow Seller Sam', description: 'Deals in rare and unusual items' },
];

function getRotationSeed(): number {
  const now = new Date();
  const estOffset = -5;
  const utcHours = now.getUTCHours();
  const estHours = (utcHours + estOffset + 24) % 24;
  const isAMRotation = estHours < 12;
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return dayOfYear * 2 + (isAMRotation ? 0 : 1);
}

function getTimeUntilNextRotation(): string {
  const now = new Date();
  const estOffset = -5;
  const utcHours = now.getUTCHours();
  const estHours = (utcHours + estOffset + 24) % 24;
  const hoursUntilNext = estHours < 12 ? 12 - estHours : 24 - estHours;
  const minutesUntilNext = 60 - now.getMinutes();
  return `${hoursUntilNext}h ${minutesUntilNext}m`;
}

function generateTravellingVendors(seed: number): Vendor[] {
  const vendorCount = 4 + (seed % 4);
  const vendors: Vendor[] = [];
  const types: Array<'tools' | 'armor' | 'food' | 'blocks' | 'materials' | 'potions' | 'rare'> = 
    ['tools', 'armor', 'food', 'blocks', 'materials', 'potions', 'rare'];
  
  for (let i = 0; i < vendorCount; i++) {
    const vendorIndex = (seed + i * 7) % TRAVELLING_VENDOR_NAMES.length;
    const vendorInfo = TRAVELLING_VENDOR_NAMES[vendorIndex];
    const typeIndex = (seed + i * 3) % types.length;
    const type = types[typeIndex];
    const priceModifier = 0.8 + ((seed + i) % 5) * 0.15;
    
    const itemType = type === 'rare' ? 'mineral' : 
                     type === 'blocks' ? 'block' : 
                     type === 'materials' ? 'material' : 
                     type === 'tools' ? 'tool' :
                     type === 'potions' ? 'potion' : type;
    const typeItems = getItemsByType(itemType as 'block' | 'mineral' | 'material' | 'food' | 'tool' | 'armor' | 'potion');
    const itemCount = 2 + (seed + i) % 4;
    const items: VendorItem[] = [];
    
    for (let j = 0; j < Math.min(itemCount, typeItems.length); j++) {
      const itemIndex = (seed + i + j * 5) % typeItems.length;
      const item = typeItems[itemIndex];
      items.push({
        itemId: item.id,
        stock: 1 + (seed + j) % 10,
        priceMultiplier: 1.5 + ((seed + j) % 10) * 0.2,
      });
    }
    
    vendors.push({
      id: `travelling_${i}`,
      name: vendorInfo.name,
      description: vendorInfo.description,
      type,
      icon: `vendor_${type}`,
      priceModifier,
      items,
      isTravelling: true,
    });
  }
  
  return vendors;
}

const BLUEPRINTS: Blueprint[] = GENERATORS.slice(1).map((gen) => ({
  id: `blueprint_${gen.id}`,
  generatorId: gen.id,
  name: `${gen.name} Blueprint`,
  description: `Learn to build: ${gen.description}`,
  icon: 'blueprint',
  cost: Math.floor(gen.unlockCost * 0.5),
  requirements: [
    { itemId: gen.outputItemId, quantity: Math.floor(gen.unlockCost / 100) + 10 },
    { itemId: 'cobblestone', quantity: Math.floor(gen.unlockCost / 50) + 20 },
  ],
  unlocked: false,
}));

export function HubTab() {
  const hubSubTab = useGameStore((s) => s.hubSubTab);

  return (
    <div className="h-full overflow-y-auto scrollbar-pixel p-6">
      {hubSubTab === 'marketplace' && <MarketplaceView />}
      {hubSubTab === 'blueprints' && <BlueprintsView />}
      {hubSubTab === 'dungeons' && <DungeonsView />}
    </div>
  );
}

function MarketplaceView() {
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const coins = useGameStore((s) => s.player.coins);
  const spendCoins = useGameStore((s) => s.spendCoins);
  const addItemToInventory = useGameStore((s) => s.addItemToInventory);
  
  const seed = useMemo(() => getRotationSeed(), []);
  const travellingVendors = useMemo(() => generateTravellingVendors(seed), [seed]);
  const timeUntilRotation = getTimeUntilNextRotation();

  const handleBuyItem = (vendorItem: VendorItem, vendor: Vendor) => {
    const item = getItemById(vendorItem.itemId);
    if (!item) return;
    
    const price = Math.floor(item.sellPrice * vendorItem.priceMultiplier * vendor.priceModifier);
    if (spendCoins(price)) {
      addItemToInventory(vendorItem.itemId, 1);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="pixel-text text-lg text-foreground mb-2">Marketplace</h2>
        <p className="font-sans text-muted-foreground mb-6">
          Browse and purchase items from vendors. Prices vary by merchant.
        </p>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-4">
          <Store className="w-5 h-5 text-primary" />
          <h3 className="pixel-text-sm text-foreground">Default Vendors</h3>
          <Badge variant="secondary" className="pixel-text-sm text-[7px]">Always Available</Badge>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {DEFAULT_VENDORS.map((vendor) => (
            <VendorCard 
              key={vendor.id} 
              vendor={vendor} 
              onClick={() => setSelectedVendor(vendor)}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-accent" />
            <h3 className="pixel-text-sm text-foreground">Travelling Vendors</h3>
            <Badge variant="outline" className="pixel-text-sm text-[7px]">Limited Time</Badge>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="pixel-text-sm text-[8px]">Next rotation: {timeUntilRotation}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {travellingVendors.map((vendor) => (
            <VendorCard 
              key={vendor.id} 
              vendor={vendor} 
              onClick={() => setSelectedVendor(vendor)}
            />
          ))}
        </div>
      </div>

      <Dialog open={!!selectedVendor} onOpenChange={() => setSelectedVendor(null)}>
        <DialogContent className="pixel-border border-border max-w-2xl">
          {selectedVendor && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <PixelIcon icon={selectedVendor.icon} size="lg" />
                  <div>
                    <DialogTitle className="pixel-text text-sm">
                      {selectedVendor.name}
                    </DialogTitle>
                    <DialogDescription className="font-sans">
                      {selectedVendor.description}
                    </DialogDescription>
                  </div>
                  {selectedVendor.isTravelling && (
                    <Badge className="ml-auto pixel-text-sm text-[7px]">Travelling</Badge>
                  )}
                </div>
              </DialogHeader>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {selectedVendor.items.map((vendorItem) => {
                  const item = getItemById(vendorItem.itemId);
                  if (!item) return null;
                  
                  const price = Math.floor(item.sellPrice * vendorItem.priceMultiplier * selectedVendor.priceModifier);
                  const canAfford = coins >= price;
                  
                  return (
                    <div 
                      key={vendorItem.itemId}
                      className="pixel-border border-card-border bg-card p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={cn(
                              'pixel-border p-1.5 bg-muted/30',
                              `rarity-${item.rarity}`
                            )}>
                              <PixelIcon icon={item.icon} size="md" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="p-0 border-0 bg-transparent">
                            <ItemTooltip item={item} />
                          </TooltipContent>
                        </Tooltip>
                        <div className="flex-1 min-w-0">
                          <p className="pixel-text-sm text-[8px] truncate">{item.name}</p>
                          <p className="pixel-text-sm text-[7px] text-muted-foreground">
                            Stock: {vendorItem.stock}
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleBuyItem(vendorItem, selectedVendor)}
                        disabled={!canAfford || vendorItem.stock <= 0}
                        size="sm"
                        className="w-full pixel-text-sm text-[8px]"
                        data-testid={`button-buy-${vendorItem.itemId}`}
                      >
                        <PixelIcon icon="coin" size="sm" />
                        {formatNumber(price)}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface VendorCardProps {
  vendor: Vendor;
  onClick: () => void;
}

function VendorCard({ vendor, onClick }: VendorCardProps) {
  const priceLabel = vendor.priceModifier < 1 ? 'Low Prices' : 
                     vendor.priceModifier > 1.1 ? 'Premium' : 'Fair Prices';
  
  return (
    <Card 
      className="pixel-border border-card-border cursor-pointer hover-elevate active-elevate-2 overflow-visible"
      onClick={onClick}
      data-testid={`vendor-card-${vendor.id}`}
    >
      <CardHeader className="p-3 pb-0">
        <div className="flex justify-center">
          <div className={cn(
            'pixel-border p-2 bg-muted/30',
            vendor.isTravelling ? 'border-accent' : 'border-primary'
          )}>
            <PixelIcon icon={vendor.icon} size="xl" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 text-center">
        <CardTitle className="pixel-text-sm text-[9px] mb-1">
          {vendor.name}
        </CardTitle>
        <p className="font-sans text-[10px] text-muted-foreground mb-2 line-clamp-2">
          {vendor.description}
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="pixel-text-sm text-[6px]">
            {vendor.items.length} items
          </Badge>
          <Badge 
            variant={vendor.priceModifier < 1 ? 'default' : 'secondary'} 
            className="pixel-text-sm text-[6px]"
          >
            {priceLabel}
          </Badge>
        </div>
        <Button 
          size="sm" 
          variant="ghost" 
          className="w-full mt-2 pixel-text-sm text-[8px]"
        >
          Browse <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

function BlueprintsView() {
  const ownedBlueprints = useGameStore((s) => s.ownedBlueprints);
  const builtGenerators = useGameStore((s) => s.builtGenerators);
  const storage = useGameStore((s) => s.storage);
  const coins = useGameStore((s) => s.player.coins);
  const spendCoins = useGameStore((s) => s.spendCoins);
  const addOwnedBlueprint = useGameStore((s) => s.addOwnedBlueprint);
  const addBuiltGenerator = useGameStore((s) => s.addBuiltGenerator);
  const removeItemFromStorage = useGameStore((s) => s.removeItemFromStorage);
  const unlockGeneratorFree = useGameStore((s) => s.unlockGeneratorFree);
  
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);

  const checkRequirements = (blueprint: Blueprint) => {
    return blueprint.requirements.every((req) => {
      const storageItem = storage.items.find(i => i.itemId === req.itemId);
      return storageItem && storageItem.quantity >= req.quantity;
    });
  };

  const handlePurchaseBlueprint = (blueprint: Blueprint) => {
    if (spendCoins(blueprint.cost)) {
      addOwnedBlueprint(blueprint.id);
    }
  };

  const handleBuildGenerator = (blueprint: Blueprint) => {
    for (const req of blueprint.requirements) {
      removeItemFromStorage(req.itemId, req.quantity);
    }
    
    unlockGeneratorFree(blueprint.generatorId);
    addBuiltGenerator(blueprint.generatorId);
    
    setSelectedBlueprint(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="pixel-text text-lg text-foreground mb-2">Blueprints</h2>
        <p className="font-sans text-muted-foreground mb-6">
          Purchase blueprints to learn how to build new generators. Gather materials and construct them on your island.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {BLUEPRINTS.map((blueprint) => {
          const isOwned = ownedBlueprints.includes(blueprint.id);
          const isBuilt = builtGenerators.includes(blueprint.generatorId);
          const canAfford = coins >= blueprint.cost;
          
          return (
            <Card 
              key={blueprint.id}
              className={cn(
                'pixel-border cursor-pointer hover-elevate active-elevate-2 overflow-visible',
                isBuilt ? 'border-primary/50 opacity-75' : 'border-card-border'
              )}
              onClick={() => !isBuilt && setSelectedBlueprint(blueprint)}
              data-testid={`blueprint-card-${blueprint.id}`}
            >
              <CardHeader className="p-3 pb-0">
                <div className="flex justify-center relative">
                  <div className={cn(
                    'pixel-border p-2 bg-muted/30',
                    isOwned ? 'border-primary' : 'border-border'
                  )}>
                    <PixelIcon icon={blueprint.icon} size="xl" />
                  </div>
                  {isBuilt && (
                    <div className="absolute -top-1 -right-1 bg-primary rounded-full p-1">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  {!isOwned && !isBuilt && (
                    <div className="absolute -top-1 -right-1 bg-muted rounded-full p-1">
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-3 text-center">
                <CardTitle className="pixel-text-sm text-[9px] mb-1">
                  {blueprint.name}
                </CardTitle>
                {isBuilt ? (
                  <Badge variant="default" className="pixel-text-sm text-[7px]">
                    Built
                  </Badge>
                ) : isOwned ? (
                  <Badge variant="secondary" className="pixel-text-sm text-[7px]">
                    Owned - Ready to Build
                  </Badge>
                ) : (
                  <div className="flex items-center justify-center gap-1">
                    <PixelIcon icon="coin" size="sm" />
                    <span className={cn(
                      'pixel-text-sm text-[9px] tabular-nums',
                      canAfford ? 'text-game-coin' : 'text-destructive'
                    )}>
                      {formatNumber(blueprint.cost)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedBlueprint} onOpenChange={() => setSelectedBlueprint(null)}>
        <DialogContent className="pixel-border border-border max-w-md">
          {selectedBlueprint && (() => {
            const isOwned = ownedBlueprints.includes(selectedBlueprint.id);
            const canAfford = coins >= selectedBlueprint.cost;
            const hasResources = checkRequirements(selectedBlueprint);
            
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <PixelIcon icon={selectedBlueprint.icon} size="lg" />
                    <div>
                      <DialogTitle className="pixel-text text-sm">
                        {selectedBlueprint.name}
                      </DialogTitle>
                      <DialogDescription className="font-sans">
                        {selectedBlueprint.description}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                  {!isOwned ? (
                    <>
                      <p className="font-sans text-sm text-muted-foreground mb-4">
                        Purchase this blueprint to learn how to build this generator. Once purchased, gather the required materials to construct it on your island.
                      </p>
                      
                      <div className="pixel-border border-border bg-muted/30 p-3">
                        <p className="pixel-text-sm text-[8px] text-muted-foreground mb-2">
                          Purchase Cost
                        </p>
                        <div className="flex items-center gap-2">
                          <PixelIcon icon="coin" size="md" />
                          <span className="pixel-text-sm text-game-coin">
                            {formatNumber(selectedBlueprint.cost)}
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handlePurchaseBlueprint(selectedBlueprint)}
                        disabled={!canAfford}
                        className="w-full pixel-text-sm"
                        data-testid="button-purchase-blueprint"
                      >
                        {canAfford ? 'Purchase Blueprint' : 'Not Enough Coins'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="pixel-border border-border bg-muted/30 p-3">
                        <p className="pixel-text-sm text-[8px] text-muted-foreground mb-3">
                          Required Materials
                        </p>
                        <div className="space-y-2">
                          {selectedBlueprint.requirements.map((req) => {
                            const item = getItemById(req.itemId);
                            const storageItem = storage.items.find(i => i.itemId === req.itemId);
                            const hasEnough = storageItem && storageItem.quantity >= req.quantity;
                            const currentQty = storageItem?.quantity || 0;
                            
                            return item ? (
                              <div key={req.itemId} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <PixelIcon icon={item.icon} size="sm" />
                                  <span className="pixel-text-sm text-[8px]">{item.name}</span>
                                </div>
                                <span className={cn(
                                  'pixel-text-sm text-[8px] tabular-nums',
                                  hasEnough ? 'text-primary' : 'text-destructive'
                                )}>
                                  {currentQty}/{req.quantity}
                                </span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleBuildGenerator(selectedBlueprint)}
                        disabled={!hasResources}
                        className="w-full pixel-text-sm"
                        data-testid="button-build-generator"
                      >
                        <Hammer className="w-4 h-4 mr-2" />
                        {hasResources ? 'Build Generator' : 'Gather Materials'}
                      </Button>
                    </>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DungeonsView() {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-center">
      <div className="pixel-border-thick border-dashed border-muted p-12 bg-muted/10">
        <PixelIcon icon="dungeon" size="xl" className="mx-auto mb-6 opacity-50" />
        <h2 className="pixel-text text-xl text-muted-foreground mb-4">
          DUNGEONS
        </h2>
        <p className="font-sans text-muted-foreground max-w-md">
          Explore dangerous dungeons, fight powerful enemies, and collect rare loot.
          This feature is coming in a future update!
        </p>
        <div className="mt-6 pixel-border bg-accent/20 border-accent px-4 py-2 inline-block">
          <span className="pixel-text-sm text-accent-foreground">COMING SOON</span>
        </div>
      </div>
    </div>
  );
}
