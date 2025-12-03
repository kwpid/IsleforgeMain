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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useGameNotifications } from '@/hooks/useGameNotifications';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  Clock, 
  Store, 
  Package, 
  Hammer, 
  ChevronRight, 
  Check, 
  Lock,
  Landmark,
  ArrowDownToLine,
  ArrowUpFromLine,
  Vault,
  TrendingUp,
  History,
  Coins
} from 'lucide-react';
import { BANK_UPGRADES, VAULT_UPGRADES, formatNumber as fmt } from '@/lib/gameTypes';

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
      {hubSubTab === 'bank' && <BankView />}
      {hubSubTab === 'dungeons' && <DungeonsView />}
    </div>
  );
}

function MarketplaceView() {
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [confirmPurchase, setConfirmPurchase] = useState<{ item: VendorItem; vendor: Vendor; price: number } | null>(null);
  const coins = useGameStore((s) => s.player.coins);
  const spendCoins = useGameStore((s) => s.spendCoins);
  const addItemToInventory = useGameStore((s) => s.addItemToInventory);
  const notificationSettings = useGameStore((s) => s.notificationSettings);
  
  const seed = useMemo(() => getRotationSeed(), []);
  const travellingVendors = useMemo(() => generateTravellingVendors(seed), [seed]);
  const timeUntilRotation = getTimeUntilNextRotation();
  const { success, warning } = useGameNotifications();

  const handleBuyClick = (vendorItem: VendorItem, vendor: Vendor) => {
    const item = getItemById(vendorItem.itemId);
    if (!item) return;
    
    const price = Math.floor(item.sellPrice * vendorItem.priceMultiplier * vendor.priceModifier);
    setConfirmPurchase({ item: vendorItem, vendor, price });
  };

  const handleConfirmPurchase = () => {
    if (!confirmPurchase) return;
    
    const { item, vendor } = confirmPurchase;
    const itemData = getItemById(item.itemId);
    if (!itemData) {
      setConfirmPurchase(null);
      return;
    }
    
    const currentPrice = Math.floor(itemData.sellPrice * item.priceMultiplier * vendor.priceModifier);
    
    if (coins < currentPrice) {
      warning('Not Enough Coins', `You need ${formatNumber(currentPrice - coins)} more coins`);
      return;
    }
    
    if (spendCoins(currentPrice)) {
      const added = addItemToInventory(item.itemId, 1);
      if (added) {
        if (notificationSettings.enabled && notificationSettings.itemPurchased) {
          success('Item Purchased!', `Bought ${itemData.name} for ${formatNumber(currentPrice)} coins`);
        }
        setConfirmPurchase(null);
      } else {
        warning('Inventory Full', 'Make room in your inventory first');
      }
    } else {
      warning('Purchase Failed', 'Unable to complete purchase');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="pixel-text text-xl text-foreground mb-2">Marketplace</h2>
        <p className="font-sans text-muted-foreground text-base mb-6">
          Browse and purchase items from vendors. Prices vary by merchant.
        </p>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-4">
          <Store className="w-5 h-5 text-primary" />
          <h3 className="pixel-text-sm text-[11px] text-foreground">Default Vendors</h3>
          <Badge variant="secondary" className="pixel-text-sm text-[8px]">Always Available</Badge>
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
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-accent" />
            <h3 className="pixel-text-sm text-[11px] text-foreground">Travelling Vendors</h3>
            <Badge variant="outline" className="pixel-text-sm text-[8px]">Limited Time</Badge>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground pixel-border border-border bg-card px-3 py-1.5">
            <Clock className="w-4 h-4" />
            <span className="pixel-text-sm text-[9px]">Rotates in: {timeUntilRotation}</span>
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
                        onClick={() => handleBuyClick(vendorItem, selectedVendor)}
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

      <AlertDialog open={!!confirmPurchase} onOpenChange={() => setConfirmPurchase(null)}>
        <AlertDialogContent className="pixel-border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="pixel-text text-sm">Confirm Purchase</AlertDialogTitle>
            <AlertDialogDescription className="font-sans">
              {confirmPurchase && (() => {
                const item = getItemById(confirmPurchase.item.itemId);
                return item ? (
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className={cn(
                      'pixel-border p-3 bg-muted/30',
                      `rarity-${item.rarity}`
                    )}>
                      <PixelIcon icon={item.icon} size="xl" />
                    </div>
                    <div className="text-center">
                      <p className="pixel-text-sm text-[12px] text-foreground mb-1">{item.name}</p>
                      <p className="text-muted-foreground text-sm">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-2 pixel-border border-primary/50 bg-primary/10 px-4 py-2">
                      <PixelIcon icon="coin" size="md" />
                      <span className="pixel-text text-lg text-game-coin">{formatNumber(confirmPurchase.price)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your balance: {formatNumber(coins)} coins
                    </p>
                  </div>
                ) : null;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="pixel-text-sm" data-testid="button-cancel-purchase">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmPurchase} 
              className="pixel-text-sm"
              disabled={confirmPurchase ? coins < confirmPurchase.price : true}
              data-testid="button-confirm-purchase"
            >
              Buy Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-center">
          <div className={cn(
            'pixel-border p-3 bg-muted/30',
            vendor.isTravelling ? 'border-accent' : 'border-primary'
          )}>
            <PixelIcon icon={vendor.icon} size="xl" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 text-center">
        <CardTitle className="pixel-text-sm text-[10px] mb-2">
          {vendor.name}
        </CardTitle>
        <p className="font-sans text-sm text-muted-foreground mb-3 line-clamp-2">
          {vendor.description}
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Badge variant="outline" className="pixel-text-sm text-[7px]">
            {vendor.items.length} items
          </Badge>
          <Badge 
            variant={vendor.priceModifier < 1 ? 'default' : 'secondary'} 
            className="pixel-text-sm text-[7px]"
          >
            {priceLabel}
          </Badge>
        </div>
        <Button 
          size="sm" 
          variant="ghost" 
          className="w-full mt-3 pixel-text-sm text-[9px]"
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

function BankView() {
  const [bankSubView, setBankSubView] = useState<'account' | 'vault' | 'history' | 'stats'>('account');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [draggedItem, setDraggedItem] = useState<{ itemId: string; quantity: number; source: 'inventory' | 'vault' } | null>(null);
  const [isDraggingOverVault, setIsDraggingOverVault] = useState(false);
  const [isDraggingOverInventory, setIsDraggingOverInventory] = useState(false);
  
  const coins = useGameStore((s) => s.player.coins);
  const bank = useGameStore((s) => s.bank);
  const vault = useGameStore((s) => s.vault);
  const inventory = useGameStore((s) => s.inventory);
  const player = useGameStore((s) => s.player);
  const depositToBank = useGameStore((s) => s.depositToBank);
  const withdrawFromBank = useGameStore((s) => s.withdrawFromBank);
  const upgradeBank = useGameStore((s) => s.upgradeBank);
  const upgradeVault = useGameStore((s) => s.upgradeVault);
  const addItemToVault = useGameStore((s) => s.addItemToVault);
  const removeItemFromVault = useGameStore((s) => s.removeItemFromVault);
  const calculateNetWorth = useGameStore((s) => s.calculateNetWorth);
  const notificationSettings = useGameStore((s) => s.notificationSettings);
  const { success, warning } = useGameNotifications();
  
  const nextBankUpgrade = BANK_UPGRADES.find(u => u.level === bank.upgradeLevel + 1);
  const nextVaultUpgrade = VAULT_UPGRADES.find(u => u.level === vault.upgradeLevel + 1);
  const netWorth = calculateNetWorth();
  
  const handleDeposit = () => {
    const amount = parseInt(depositAmount);
    if (!isNaN(amount) && amount > 0) {
      if (depositToBank(amount)) {
        setDepositAmount('');
      }
    }
  };
  
  const handleWithdraw = () => {
    const amount = parseInt(withdrawAmount);
    if (!isNaN(amount) && amount > 0) {
      if (withdrawFromBank(amount)) {
        setWithdrawAmount('');
      }
    }
  };
  
  const handleDepositMax = () => {
    const maxDeposit = Math.min(coins, bank.capacity - bank.balance);
    if (maxDeposit > 0) {
      depositToBank(maxDeposit);
    }
  };
  
  const handleWithdrawMax = () => {
    if (bank.balance > 0) {
      withdrawFromBank(bank.balance);
    }
  };
  
  const handleDragStart = (e: React.DragEvent, itemId: string, quantity: number, source: 'inventory' | 'vault') => {
    setDraggedItem({ itemId, quantity, source });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
  };
  
  const handleDragEnd = () => {
    setDraggedItem(null);
    setIsDraggingOverVault(false);
    setIsDraggingOverInventory(false);
  };
  
  const handleVaultDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverVault(true);
  };
  
  const handleVaultDragLeave = () => {
    setIsDraggingOverVault(false);
  };
  
  const handleVaultDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedItem && draggedItem.source === 'inventory') {
      const itemData = getItemById(draggedItem.itemId);
      const existingSlot = vault.slots.find(s => s.itemId === draggedItem.itemId);
      
      if (vault.slots.length >= vault.maxSlots && !existingSlot) {
        warning('Vault Full', 'Upgrade your vault to store more items');
        setDraggedItem(null);
        setIsDraggingOverVault(false);
        return;
      }
      
      const result = addItemToVault(draggedItem.itemId, draggedItem.quantity);
      if (result && itemData) {
        if (notificationSettings.enabled) {
          success('Stored in Vault', `${itemData.name} x${draggedItem.quantity} secured`);
        }
      }
    }
    setDraggedItem(null);
    setIsDraggingOverVault(false);
  };
  
  const handleInventoryDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverInventory(true);
  };
  
  const handleInventoryDragLeave = () => {
    setIsDraggingOverInventory(false);
  };
  
  const handleInventoryDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedItem && draggedItem.source === 'vault') {
      const itemData = getItemById(draggedItem.itemId);
      const result = removeItemFromVault(draggedItem.itemId, draggedItem.quantity);
      if (result && itemData) {
        if (notificationSettings.enabled) {
          success('Retrieved from Vault', `${itemData.name} x${draggedItem.quantity} returned`);
        }
      } else if (!result) {
        warning('Inventory Full', 'Make room in your inventory first');
      }
    }
    setDraggedItem(null);
    setIsDraggingOverInventory(false);
  };

  const bankSubTabs = [
    { id: 'account' as const, label: 'Account', icon: Landmark },
    { id: 'vault' as const, label: 'Vault', icon: Vault },
    { id: 'history' as const, label: 'History', icon: History },
    { id: 'stats' as const, label: 'Stats', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="pixel-text text-xl text-foreground mb-2">Isle Bank</h2>
        <p className="font-sans text-muted-foreground text-base mb-6">
          Securely store your coins and valuable items. Upgrade capacity for larger deposits.
        </p>
      </div>
      
      <div className="flex gap-2 mb-6 flex-wrap">
        {bankSubTabs.map((tab) => (
          <Button
            key={tab.id}
            variant={bankSubView === tab.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBankSubView(tab.id)}
            className="pixel-text-sm text-[9px] gap-1.5"
            data-testid={`button-bank-tab-${tab.id}`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </Button>
        ))}
      </div>
      
      {bankSubView === 'account' && (
        <div className="space-y-6">
          <Card className="pixel-border border-primary/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-primary" />
                  <CardTitle className="pixel-text-sm text-[12px]">Account Balance</CardTitle>
                </div>
                <Badge variant="outline" className="pixel-text-sm text-[8px]">
                  Lvl {bank.upgradeLevel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="pixel-border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <PixelIcon icon="coin" size="lg" />
                  <span className="pixel-text text-2xl text-game-coin">
                    {formatNumber(bank.balance)}
                  </span>
                </div>
                <Progress 
                  value={(bank.balance / bank.capacity) * 100} 
                  className="h-2"
                />
                <p className="pixel-text-sm text-[8px] text-center text-muted-foreground mt-2">
                  {formatNumber(bank.balance)} / {formatNumber(bank.capacity)} capacity
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="pixel-text-sm text-[9px] text-muted-foreground">Deposit</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Amount"
                      className="flex-1 pixel-border border-border bg-muted/30 px-3 py-2 pixel-text-sm text-[10px] min-w-0"
                      data-testid="input-deposit-amount"
                    />
                    <Button 
                      size="sm" 
                      onClick={handleDeposit}
                      disabled={!depositAmount || parseInt(depositAmount) <= 0 || parseInt(depositAmount) > coins}
                      data-testid="button-deposit"
                    >
                      <ArrowDownToLine className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full pixel-text-sm text-[8px]"
                    onClick={handleDepositMax}
                    disabled={coins === 0 || bank.balance >= bank.capacity}
                    data-testid="button-deposit-max"
                  >
                    Deposit Max
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <p className="pixel-text-sm text-[9px] text-muted-foreground">Withdraw</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Amount"
                      className="flex-1 pixel-border border-border bg-muted/30 px-3 py-2 pixel-text-sm text-[10px] min-w-0"
                      data-testid="input-withdraw-amount"
                    />
                    <Button 
                      size="sm" 
                      onClick={handleWithdraw}
                      disabled={!withdrawAmount || parseInt(withdrawAmount) <= 0 || parseInt(withdrawAmount) > bank.balance}
                      data-testid="button-withdraw"
                    >
                      <ArrowUpFromLine className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full pixel-text-sm text-[8px]"
                    onClick={handleWithdrawMax}
                    disabled={bank.balance === 0}
                    data-testid="button-withdraw-max"
                  >
                    Withdraw All
                  </Button>
                </div>
              </div>
              
              {nextBankUpgrade && (
                <div className="pixel-border border-accent/50 bg-accent/10 p-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <p className="pixel-text-sm text-[9px]">Upgrade Capacity</p>
                      <p className="pixel-text-sm text-[8px] text-muted-foreground">
                        {formatNumber(bank.capacity)} to {formatNumber(nextBankUpgrade.capacity)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={upgradeBank}
                      disabled={coins < nextBankUpgrade.cost}
                      className="pixel-text-sm text-[8px]"
                      data-testid="button-upgrade-bank"
                    >
                      <PixelIcon icon="coin" size="sm" />
                      {formatNumber(nextBankUpgrade.cost)}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="pixel-border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-game-coin" />
              <span className="pixel-text-sm text-[10px]">Wallet Balance</span>
            </div>
            <div className="flex items-center gap-2">
              <PixelIcon icon="coin" size="md" />
              <span className="pixel-text text-lg text-game-coin">{formatNumber(coins)}</span>
            </div>
          </div>
        </div>
      )}
      
      {bankSubView === 'vault' && (
        <div className="space-y-6">
          <Card className="pixel-border border-accent/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Vault className="w-5 h-5 text-accent" />
                  <CardTitle className="pixel-text-sm text-[12px]">Secure Vault</CardTitle>
                </div>
                <Badge variant="outline" className="pixel-text-sm text-[8px]">
                  {vault.slots.length}/{vault.maxSlots} slots
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-sans text-sm text-muted-foreground">
                Store valuable items safely in your vault. Items in the vault are protected.
              </p>
              
              <div 
                className={cn(
                  "pixel-border bg-muted/20 p-3 transition-colors",
                  isDraggingOverVault && draggedItem?.source === 'inventory' 
                    ? "border-primary bg-primary/10" 
                    : "border-border"
                )}
                onDragOver={handleVaultDragOver}
                onDragLeave={handleVaultDragLeave}
                onDrop={handleVaultDrop}
              >
                <p className="pixel-text-sm text-[9px] text-muted-foreground mb-3">
                  Vault Contents {isDraggingOverVault && draggedItem?.source === 'inventory' && <span className="text-primary">(Drop here)</span>}
                </p>
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({ length: vault.maxSlots }).map((_, index) => {
                    const slot = vault.slots[index];
                    const item = slot ? getItemById(slot.itemId) : null;
                    
                    return (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <div 
                            className={cn(
                              'aspect-square pixel-border flex items-center justify-center relative cursor-pointer',
                              slot ? `rarity-${item?.rarity} bg-muted/50` : 'border-border bg-muted/20',
                              slot && 'hover-elevate overflow-visible'
                            )}
                            draggable={!!slot}
                            onDragStart={(e) => slot && handleDragStart(e, slot.itemId, slot.quantity, 'vault')}
                            onDragEnd={handleDragEnd}
                            onClick={() => slot && removeItemFromVault(slot.itemId, slot.quantity)}
                            data-testid={`vault-slot-${index}`}
                          >
                            {item && (
                              <>
                                <PixelIcon icon={item.icon} size="md" />
                                {slot && slot.quantity > 1 && (
                                  <span className="absolute bottom-0 right-0 pixel-text-sm text-[7px] bg-background/80 px-0.5">
                                    {slot.quantity}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </TooltipTrigger>
                        {item && (
                          <TooltipContent side="top" className="p-0 border-0 bg-transparent">
                            <ItemTooltip item={item} quantity={slot?.quantity} />
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
              
              <div 
                className={cn(
                  "pixel-border bg-muted/20 p-3 transition-colors",
                  isDraggingOverInventory && draggedItem?.source === 'vault' 
                    ? "border-accent bg-accent/10" 
                    : "border-border"
                )}
                onDragOver={handleInventoryDragOver}
                onDragLeave={handleInventoryDragLeave}
                onDrop={handleInventoryDrop}
              >
                <p className="pixel-text-sm text-[9px] text-muted-foreground mb-3">
                  From Inventory (drag to vault or click) {isDraggingOverInventory && draggedItem?.source === 'vault' && <span className="text-accent">(Drop here)</span>}
                </p>
                <div className="grid grid-cols-6 gap-2">
                  {inventory.items.map((inv, index) => {
                    const item = getItemById(inv.itemId);
                    if (!item) return null;
                    
                    return (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <div 
                            className={cn(
                              'aspect-square pixel-border flex items-center justify-center relative cursor-pointer hover-elevate overflow-visible',
                              `rarity-${item.rarity} bg-muted/50`
                            )}
                            draggable
                            onDragStart={(e) => handleDragStart(e, inv.itemId, inv.quantity, 'inventory')}
                            onDragEnd={handleDragEnd}
                            onClick={() => addItemToVault(inv.itemId, inv.quantity)}
                            data-testid={`inv-to-vault-${inv.itemId}`}
                          >
                            <PixelIcon icon={item.icon} size="md" />
                            {inv.quantity > 1 && (
                              <span className="absolute bottom-0 right-0 pixel-text-sm text-[7px] bg-background/80 px-0.5">
                                {inv.quantity}
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="p-0 border-0 bg-transparent">
                          <ItemTooltip item={item} quantity={inv.quantity} />
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                  {inventory.items.length === 0 && (
                    <p className="col-span-6 text-center pixel-text-sm text-[8px] text-muted-foreground py-4">
                      Inventory is empty
                    </p>
                  )}
                </div>
              </div>
              
              {nextVaultUpgrade && (
                <div className="pixel-border border-accent/50 bg-accent/10 p-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <p className="pixel-text-sm text-[9px]">Upgrade Vault</p>
                      <p className="pixel-text-sm text-[8px] text-muted-foreground">
                        {vault.maxSlots} to {nextVaultUpgrade.slots} slots
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={upgradeVault}
                      disabled={coins < nextVaultUpgrade.cost}
                      className="pixel-text-sm text-[8px]"
                      data-testid="button-upgrade-vault"
                    >
                      <PixelIcon icon="coin" size="sm" />
                      {formatNumber(nextVaultUpgrade.cost)}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {bankSubView === 'history' && (
        <Card className="pixel-border border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="pixel-text-sm text-[12px]">Transaction History</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {bank.transactions.length === 0 ? (
              <p className="text-center pixel-text-sm text-[10px] text-muted-foreground py-8">
                No transactions yet
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-pixel">
                {bank.transactions.map((txn) => (
                  <div 
                    key={txn.id}
                    className="flex items-center justify-between pixel-border border-border bg-muted/20 p-2"
                  >
                    <div className="flex items-center gap-2">
                      {txn.type === 'deposit' ? (
                        <ArrowDownToLine className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpFromLine className="w-4 h-4 text-destructive" />
                      )}
                      <div>
                        <p className="pixel-text-sm text-[9px]">
                          {txn.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                        </p>
                        <p className="pixel-text-sm text-[7px] text-muted-foreground">
                          {new Date(txn.timestamp).toLocaleDateString()} {new Date(txn.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        'pixel-text-sm text-[10px]',
                        txn.type === 'deposit' ? 'text-primary' : 'text-destructive'
                      )}>
                        {txn.type === 'deposit' ? '+' : '-'}{formatNumber(txn.amount)}
                      </p>
                      <p className="pixel-text-sm text-[7px] text-muted-foreground">
                        Balance: {formatNumber(txn.balance)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {bankSubView === 'stats' && (
        <div className="space-y-4">
          <Card className="pixel-border border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <CardTitle className="pixel-text-sm text-[12px]">Financial Stats</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="pixel-border border-border bg-muted/20 p-3">
                  <p className="pixel-text-sm text-[8px] text-muted-foreground mb-1">Net Worth</p>
                  <div className="flex items-center gap-1">
                    <PixelIcon icon="coin" size="sm" />
                    <span className="pixel-text-sm text-[12px] text-game-coin">{formatNumber(netWorth)}</span>
                  </div>
                </div>
                
                <div className="pixel-border border-border bg-muted/20 p-3">
                  <p className="pixel-text-sm text-[8px] text-muted-foreground mb-1">Peak Bank Balance</p>
                  <div className="flex items-center gap-1">
                    <PixelIcon icon="coin" size="sm" />
                    <span className="pixel-text-sm text-[12px] text-game-coin">{formatNumber(bank.peakBalance)}</span>
                  </div>
                </div>
                
                <div className="pixel-border border-border bg-muted/20 p-3">
                  <p className="pixel-text-sm text-[8px] text-muted-foreground mb-1">Total Coins Earned</p>
                  <div className="flex items-center gap-1">
                    <PixelIcon icon="coin" size="sm" />
                    <span className="pixel-text-sm text-[12px] text-game-coin">{formatNumber(player.totalCoinsEarned)}</span>
                  </div>
                </div>
                
                <div className="pixel-border border-border bg-muted/20 p-3">
                  <p className="pixel-text-sm text-[8px] text-muted-foreground mb-1">Items Sold</p>
                  <span className="pixel-text-sm text-[12px]">{formatNumber(player.totalItemsSold)}</span>
                </div>
              </div>
              
              <div className="pixel-border border-primary/30 bg-primary/5 p-4">
                <p className="pixel-text-sm text-[10px] text-center mb-2">Current Wealth Distribution</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="pixel-text-sm text-[8px] text-muted-foreground">Wallet</span>
                    <span className="pixel-text-sm text-[9px]">{formatNumber(coins)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="pixel-text-sm text-[8px] text-muted-foreground">Bank</span>
                    <span className="pixel-text-sm text-[9px]">{formatNumber(bank.balance)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="pixel-text-sm text-[8px] text-muted-foreground">Assets Value</span>
                    <span className="pixel-text-sm text-[9px]">{formatNumber(netWorth - coins - bank.balance)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
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
