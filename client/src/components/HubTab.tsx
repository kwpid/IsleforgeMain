import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { ScrollIndicatorTabs } from './NewsModal';
import { useGameStore } from '@/lib/gameStore';
import { formatNumber, Vendor, VendorItem, Blueprint, BlueprintRequirement, getPickaxeTier, getPickaxeSpeedMultiplier, PICKAXE_TIERS, GameItem } from '@/lib/gameTypes';
import { getItemById, getItemsByType, getSpecialItems, BLOCK_ITEMS, TOOL_ITEMS, ARMOR_ITEMS, POTION_ITEMS, FOOD_ITEMS, MATERIAL_ITEMS, SPECIAL_ITEMS, MINERAL_ITEMS, SEED_ITEMS, BOOSTER_ITEMS } from '@/lib/items';
import { GENERATORS } from '@/lib/generators';
import { MINEABLE_BLOCKS, selectRandomBlock, getBreakTime, canReceiveItem } from '@/lib/mining';
import { PixelIcon } from './PixelIcon';
import { ItemTooltip } from './ItemTooltip';
import { useItemAcquisitionStore } from './ItemAcquisitionPopup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
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
  Coins,
  Pickaxe,
  Info,
  BarChart3,
  Boxes,
  Sword,
  Shield,
  FlaskConical,
  UtensilsCrossed,
  Gem,
  Sparkles,
  Minus,
  Plus,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BANK_UPGRADES, VAULT_UPGRADES, formatNumber as fmt } from '@/lib/gameTypes';

type MarketplaceCategory = 'all' | 'blocks' | 'tools' | 'armor' | 'potions' | 'food' | 'materials' | 'ores' | 'seeds';
type SortOption = 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'rarity_asc' | 'rarity_desc';

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'limited', 'mythic'];

const SORT_LABELS: Record<SortOption, string> = {
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  name_asc: 'Name: A to Z',
  name_desc: 'Name: Z to A',
  rarity_asc: 'Rarity: Common First',
  rarity_desc: 'Rarity: Rare First',
};

const CATEGORY_ICONS: Record<MarketplaceCategory, typeof Store> = {
  all: Store,
  blocks: Boxes,
  tools: Hammer,
  armor: Shield,
  potions: FlaskConical,
  food: UtensilsCrossed,
  materials: Gem,
  ores: Gem,
  seeds: Sparkles,
};

const CATEGORY_LABELS: Record<MarketplaceCategory, string> = {
  all: 'All Items',
  blocks: 'Building Blocks',
  tools: 'Tools & Weapons',
  armor: 'Armor & Protection',
  potions: 'Potions & Elixirs',
  food: 'Food & Provisions',
  materials: 'Crafting Materials',
  ores: 'Ores & Minerals',
  seeds: 'Seeds & Farming',
};

function getPermanentVendorItems(category: MarketplaceCategory): VendorItem[] {
  let items: typeof BLOCK_ITEMS = [];
  let priceMultiplier = 2.0;
  
  switch (category) {
    case 'blocks':
      items = BLOCK_ITEMS;
      break;
    case 'tools':
      items = TOOL_ITEMS;
      break;
    case 'armor':
      items = ARMOR_ITEMS;
      break;
    case 'potions':
      items = POTION_ITEMS;
      break;
    case 'food':
      items = FOOD_ITEMS.filter(item => !item.isSpecial);
      break;
    case 'materials':
      items = MATERIAL_ITEMS.filter(item => !item.isSpecial);
      break;
    case 'ores':
      items = MINERAL_ITEMS;
      priceMultiplier = 5.0;
      break;
    case 'seeds':
      const wateringCan = TOOL_ITEMS.find(t => t.id === 'watering_can');
      items = [...SEED_ITEMS, ...(wateringCan ? [wateringCan] : [])];
      priceMultiplier = 3.0;
      break;
    case 'all':
    default:
      items = [...BLOCK_ITEMS, ...TOOL_ITEMS, ...ARMOR_ITEMS, ...POTION_ITEMS, ...FOOD_ITEMS.filter(i => !i.isSpecial), ...MATERIAL_ITEMS.filter(i => !i.isSpecial), ...SEED_ITEMS];
  }
  
  return items.map(item => ({
    itemId: item.id,
    stock: 999,
    priceMultiplier: category === 'ores' ? 5.0 : (category === 'seeds' ? 3.0 : 2.0),
    unlimitedStock: true,
  }));
}

const DEFAULT_VENDORS: Vendor[] = [
  {
    id: 'farmer',
    name: 'Farmer Flora',
    description: 'Sells farming supplies and equipment',
    type: 'seeds',
    icon: 'vendor_food',
    priceModifier: 1.0,
    items: [
      { itemId: 'watering_can', stock: 5, priceMultiplier: 2.0 },
      { itemId: 'wheat_seeds', stock: 50, priceMultiplier: 2.5 },
      { itemId: 'carrot_seeds', stock: 30, priceMultiplier: 2.5 },
      { itemId: 'potato_seeds', stock: 20, priceMultiplier: 2.5 },
      { itemId: 'melon_seeds', stock: 10, priceMultiplier: 3.0, isRotating: true },
      { itemId: 'pumpkin_seeds', stock: 10, priceMultiplier: 3.0, isRotating: true },
    ],
  },
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
  {
    id: 'enchanter',
    name: 'Enchanter Elara',
    description: 'Sells magical booster items with temporary power-ups',
    type: 'potions',
    icon: 'vendor_potions',
    priceModifier: 1.0,
    isSpecialBoosterVendor: true,
    items: BOOSTER_ITEMS.map(booster => ({
      itemId: booster.id,
      stock: 5,
      priceMultiplier: 3.0,
      isBooster: true,
    })),
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
  const types: Array<'tools' | 'armor' | 'food' | 'blocks' | 'materials' | 'potions' | 'rare' | 'boosters'> = 
    ['tools', 'armor', 'food', 'blocks', 'materials', 'potions', 'rare', 'boosters'];
  
  for (let i = 0; i < vendorCount; i++) {
    const vendorIndex = (seed + i * 7) % TRAVELLING_VENDOR_NAMES.length;
    const vendorInfo = TRAVELLING_VENDOR_NAMES[vendorIndex];
    const typeIndex = (seed + i * 3) % types.length;
    const type = types[typeIndex];
    const priceModifier = 0.7 + ((seed + i) % 4) * 0.1;
    
    const items: VendorItem[] = [];
    
    if (type === 'boosters') {
      const boosterCount = 1 + (seed + i) % BOOSTER_ITEMS.length;
      for (let j = 0; j < Math.min(boosterCount, BOOSTER_ITEMS.length); j++) {
        const boosterIndex = (seed + i + j * 2) % BOOSTER_ITEMS.length;
        const booster = BOOSTER_ITEMS[boosterIndex];
        items.push({
          itemId: booster.id,
          stock: 1 + (seed + j) % 3,
          priceMultiplier: 2.5 + ((seed + j) % 4) * 0.25,
          isBooster: true,
        });
      }
    } else {
      const itemType = type === 'rare' ? 'mineral' : 
                       type === 'blocks' ? 'block' : 
                       type === 'materials' ? 'material' : 
                       type === 'tools' ? 'tool' :
                       type === 'potions' ? 'potion' : type;
      const typeItems = getItemsByType(itemType as 'block' | 'mineral' | 'material' | 'food' | 'tool' | 'armor' | 'potion');
      const itemCount = 2 + (seed + i) % 4;
      
      for (let j = 0; j < Math.min(itemCount, typeItems.length); j++) {
        const itemIndex = (seed + i + j * 5) % typeItems.length;
        const item = typeItems[itemIndex];
        items.push({
          itemId: item.id,
          stock: 1 + (seed + j) % 10,
          priceMultiplier: 1.2 + ((seed + j) % 8) * 0.15,
        });
      }
    }
    
    const specialItems = SPECIAL_ITEMS;
    const specialItemCount = 1 + (seed + i) % 2;
    for (let j = 0; j < Math.min(specialItemCount, specialItems.length); j++) {
      const itemIndex = (seed + i + j * 3) % specialItems.length;
      const item = specialItems[itemIndex];
      items.push({
        itemId: item.id,
        stock: 1,
        priceMultiplier: 2.0,
        isSpecialItem: true,
      } as VendorItem & { isSpecialItem: boolean });
    }
    
    vendors.push({
      id: `travelling_${i}`,
      name: vendorInfo.name,
      description: vendorInfo.description,
      type: type === 'boosters' ? 'potions' : type,
      icon: type === 'boosters' ? 'vendor_potions' : `vendor_${type}`,
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
  cost: Math.floor(gen.unlockCost * 0.25),
  requirements: [
    { itemId: gen.outputItemId, quantity: Math.max(1, Math.floor((gen.unlockCost / 100 + 10) * 0.5)) },
    { itemId: 'cobblestone', quantity: Math.max(1, Math.floor((gen.unlockCost / 50 + 20) * 0.5)) },
  ],
  unlocked: false,
}));

export function HubTab() {
  const hubSubTab = useGameStore((s) => s.hubSubTab);

  return (
    <div className="h-full overflow-y-auto scrollbar-pixel p-4 md:p-6">
      {hubSubTab === 'marketplace' && <div key="marketplace" className="animate-subtab-content"><MarketplaceView /></div>}
      {hubSubTab === 'blueprints' && <div key="blueprints" className="animate-subtab-content"><BlueprintsView /></div>}
      {hubSubTab === 'bank' && <div key="bank" className="animate-subtab-content"><BankView /></div>}
      {hubSubTab === 'mines' && <div key="mines" className="animate-subtab-content"><MinesView /></div>}
      {hubSubTab === 'dungeons' && <div key="dungeons" className="animate-subtab-content"><DungeonsView /></div>}
    </div>
  );
}

type MarketplaceViewType = 'main' | 'sell' | 'special';

function MarketplaceView() {
  const [selectedCategory, setSelectedCategory] = useState<MarketplaceCategory>('all');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [confirmPurchase, setConfirmPurchase] = useState<{ item: VendorItem; quantity: number; price: number; isSpecialVendor?: boolean; baseVendorModifier?: number; isSpecialItem?: boolean; vendorId?: string } | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [marketplaceView, setMarketplaceView] = useState<MarketplaceViewType>('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('price_asc');
  
  const coins = useGameStore((s) => s.player.coins);
  const spendCoins = useGameStore((s) => s.spendCoins);
  const addItemToInventory = useGameStore((s) => s.addItemToInventory);
  const notificationSettings = useGameStore((s) => s.notificationSettings);
  const vendorStockPurchases = useGameStore((s) => s.vendorStockPurchases);
  const purchaseVendorItem = useGameStore((s) => s.purchaseVendorItem);
  const resetVendorStockIfNeeded = useGameStore((s) => s.resetVendorStockIfNeeded);
  const addItems = useItemAcquisitionStore((s) => s.addItems);
  
  const getVendorStockPurchased = (vendorId: string, itemId: string) => {
    return vendorStockPurchases[vendorId]?.[itemId] || 0;
  };
  
  const seed = useMemo(() => getRotationSeed(), []);
  const specialVendors = useMemo(() => generateTravellingVendors(seed).slice(0, 3), [seed]);
  
  useEffect(() => {
    resetVendorStockIfNeeded();
  }, [resetVendorStockIfNeeded]);
  const timeUntilRotation = getTimeUntilNextRotation();
  const { success, warning } = useGameNotifications();
  
  const permanentItems = useMemo(() => getPermanentVendorItems(selectedCategory), [selectedCategory]);

  const filteredAndSortedItems = useMemo(() => {
    let items = permanentItems
      .map((vendorItem) => {
        const item = getItemById(vendorItem.itemId);
        if (!item) return null;
        const price = Math.floor(item.sellPrice * vendorItem.priceMultiplier);
        return { vendorItem, item, price };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter(({ item }) => 
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.rarity.toLowerCase().includes(query)
      );
    }

    items.sort((a, b) => {
      switch (sortOption) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'name_asc':
          return a.item.name.localeCompare(b.item.name);
        case 'name_desc':
          return b.item.name.localeCompare(a.item.name);
        case 'rarity_asc':
          return RARITY_ORDER.indexOf(a.item.rarity) - RARITY_ORDER.indexOf(b.item.rarity);
        case 'rarity_desc':
          return RARITY_ORDER.indexOf(b.item.rarity) - RARITY_ORDER.indexOf(a.item.rarity);
        default:
          return 0;
      }
    });

    return items;
  }, [permanentItems, searchQuery, sortOption]);

  const handleBuyClick = (vendorItem: VendorItem, isSpecialVendor = false, vendorPriceModifier = 1.0, vendorId?: string) => {
    const item = getItemById(vendorItem.itemId);
    if (!item) return;
    
    const isSpecialItem = (vendorItem as any).isSpecialItem === true;
    const priceModifier = isSpecialItem ? 1.0 : vendorPriceModifier;
    const pricePerItem = Math.floor(item.sellPrice * vendorItem.priceMultiplier * priceModifier);
    setPurchaseQuantity(1);
    setConfirmPurchase({ item: vendorItem, quantity: 1, price: pricePerItem, isSpecialVendor, baseVendorModifier: vendorPriceModifier, isSpecialItem, vendorId });
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (!confirmPurchase) return;
    const item = getItemById(confirmPurchase.item.itemId);
    if (!item) return;
    
    const purchasedAlready = confirmPurchase.vendorId && confirmPurchase.isSpecialVendor 
      ? getVendorStockPurchased(confirmPurchase.vendorId, confirmPurchase.item.itemId) 
      : 0;
    const remainingStock = confirmPurchase.item.unlimitedStock ? 999 : Math.max(0, confirmPurchase.item.stock - purchasedAlready);
    const maxQuantity = remainingStock;
    const clampedQuantity = Math.max(1, Math.min(newQuantity, maxQuantity));
    const priceModifier = confirmPurchase.isSpecialItem ? 1.0 : (confirmPurchase.baseVendorModifier || 1.0);
    const pricePerItem = Math.floor(item.sellPrice * confirmPurchase.item.priceMultiplier * priceModifier);
    
    setPurchaseQuantity(clampedQuantity);
    setConfirmPurchase({
      ...confirmPurchase,
      quantity: clampedQuantity,
      price: pricePerItem * clampedQuantity,
    });
  };

  const handleConfirmPurchase = () => {
    if (!confirmPurchase) return;
    
    const { item, quantity, price, vendorId, isSpecialVendor } = confirmPurchase;
    const itemData = getItemById(item.itemId);
    if (!itemData) {
      setConfirmPurchase(null);
      return;
    }
    
    if (vendorId && isSpecialVendor) {
      const purchasedAlready = getVendorStockPurchased(vendorId, item.itemId);
      const remainingStock = item.unlimitedStock ? 999 : item.stock - purchasedAlready;
      if (quantity > remainingStock) {
        warning('Out of Stock', `Only ${remainingStock} available`);
        return;
      }
    }
    
    if (coins < price) {
      warning('Not Enough Coins', `You need ${formatNumber(price - coins)} more coins`);
      return;
    }
    
    if (spendCoins(price)) {
      const added = addItemToInventory(item.itemId, quantity);
      if (added) {
        if (vendorId && isSpecialVendor) {
          purchaseVendorItem(vendorId, item.itemId, quantity);
        }
        addItems([{
          item: itemData,
          quantity,
          source: 'purchase' as const,
        }]);
        if (notificationSettings.enabled && notificationSettings.itemPurchased) {
          success('Item Purchased!', `Bought ${quantity}x ${itemData.name} for ${formatNumber(price)} coins`);
        }
        setConfirmPurchase(null);
        setPurchaseQuantity(1);
      } else {
        warning('Inventory Full', 'Make room in your inventory first');
      }
    } else {
      warning('Purchase Failed', 'Unable to complete purchase');
    }
  };

  const CategoryIcon = CATEGORY_ICONS[selectedCategory];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="pixel-text text-xl text-foreground mb-2">Marketplace</h2>
          <p className="font-sans text-muted-foreground text-sm">
            Browse items by category. Unlimited stock on main vendors!
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-md pixel-border border-border overflow-x-auto scrollbar-none touch-scroll-x max-w-full">
          <Button
            variant={marketplaceView === 'main' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMarketplaceView('main')}
            className={cn(
              "pixel-text-sm text-[8px] md:text-[9px] font-bold flex-shrink-0 px-2 md:px-3",
              marketplaceView === 'main' && "bg-primary text-primary-foreground shadow-md"
            )}
            data-testid="button-main-marketplace"
          >
            <Store className="w-3 h-3 md:w-4 md:h-4 mr-1" />
            <span className="hidden xs:inline">Main </span>Shop
          </Button>
          <Button
            variant={marketplaceView === 'sell' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMarketplaceView('sell')}
            className={cn(
              "pixel-text-sm text-[8px] md:text-[9px] font-bold flex-shrink-0 px-2 md:px-3",
              marketplaceView === 'sell' && "bg-green-600 text-white shadow-md"
            )}
            data-testid="button-sell-marketplace"
          >
            <Coins className="w-3 h-3 md:w-4 md:h-4 mr-1" />
            Sell
          </Button>
          <Button
            variant={marketplaceView === 'special' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMarketplaceView('special')}
            className={cn(
              "pixel-text-sm text-[8px] md:text-[9px] font-bold flex-shrink-0 px-2 md:px-3",
              marketplaceView === 'special' && "bg-purple-600 text-white shadow-md"
            )}
            data-testid="button-special-vendors"
          >
            <Sparkles className="w-3 h-3 md:w-4 md:h-4 mr-1" />
            <span className="hidden xs:inline">Special </span>Vendors
          </Button>
        </div>
      </div>

      {marketplaceView === 'main' && (
        <>
          <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as MarketplaceCategory)} className="w-full">
            <ScrollIndicatorTabs className="bg-muted/30 p-1 rounded-md">
              <TabsList className="flex gap-1 h-auto w-max min-w-full bg-transparent">
                {(Object.keys(CATEGORY_LABELS) as MarketplaceCategory[]).map((cat) => {
                  const Icon = CATEGORY_ICONS[cat];
                  return (
                    <TabsTrigger
                      key={cat}
                      value={cat}
                      className="pixel-text-sm text-[7px] whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-shrink-0"
                      data-testid={`tab-category-${cat}`}
                    >
                      <Icon className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">{CATEGORY_LABELS[cat]}</span>
                      <span className="sm:hidden">{cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1, 5)}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </ScrollIndicatorTabs>
          </Tabs>

          <div className="marketplace-section">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
              <div className="flex items-center gap-2">
                <CategoryIcon className="w-5 h-5 text-primary" />
                <h3 className="pixel-text-sm text-[11px] text-foreground">{CATEGORY_LABELS[selectedCategory]}</h3>
                <Badge variant="secondary" className="pixel-text-sm text-[7px]">Unlimited Stock</Badge>
                <Badge variant="outline" className="pixel-text-sm text-[7px]">{filteredAndSortedItems.length} items</Badge>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search items by name, description, or rarity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pixel-text-sm text-[10px]"
                  data-testid="input-marketplace-search"
                />
              </div>
              <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                <SelectTrigger className="w-full sm:w-[200px] pixel-text-sm text-[9px]" data-testid="select-marketplace-sort">
                  <ArrowUpDown className="w-3.5 h-3.5 mr-2" />
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                    <SelectItem key={option} value={option} className="pixel-text-sm text-[9px]">
                      {SORT_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {filteredAndSortedItems.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="pixel-text-sm text-muted-foreground">No items found matching "{searchQuery}"</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSearchQuery('')}
                  className="mt-2 pixel-text-sm text-[8px]"
                >
                  Clear Search
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {filteredAndSortedItems.map(({ vendorItem, item, price }) => {
                  const canAfford = coins >= price;
                  
                  return (
                    <HoverCard key={vendorItem.itemId} openDelay={0} closeDelay={0}>
                      <HoverCardTrigger asChild>
                        <div 
                          className={cn(
                            "pixel-border border-card-border bg-card p-2 cursor-pointer hover-elevate active-elevate-2 overflow-visible",
                            item.isEnchanted && "enchanted-item",
                            item.isSpecial && "special-item"
                          )}
                          onClick={() => handleBuyClick(vendorItem)}
                          data-testid={`item-${vendorItem.itemId}`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <div className={cn(
                              'pixel-border p-1 bg-muted/30',
                              `rarity-${item.rarity}`
                            )}>
                              <PixelIcon icon={item.icon} size="md" />
                            </div>
                            <p className="pixel-text-sm text-[6px] truncate w-full text-center">{item.name}</p>
                            <div className="flex items-center gap-0.5">
                              <PixelIcon icon="coin" size="sm" />
                              <span className={cn(
                                "pixel-text-sm text-[7px]",
                                canAfford ? "text-game-coin" : "text-destructive"
                              )}>
                                {formatNumber(price)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent side="top" className="p-0 border-0 bg-transparent w-auto">
                        <ItemTooltip item={item} showUseButton={false} />
                      </HoverCardContent>
                    </HoverCard>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {marketplaceView === 'sell' && (
        <SellView />
      )}

      {marketplaceView === 'special' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-accent" />
              <h3 className="pixel-text-sm text-[11px] text-foreground">Special Rotating Vendors</h3>
              <Badge variant="outline" className="pixel-text-sm text-[7px]">Limited Stock</Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground pixel-border border-border bg-card px-3 py-1.5">
              <Clock className="w-4 h-4" />
              <span className="pixel-text-sm text-[8px]">Rotates in: {timeUntilRotation}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {specialVendors.map((vendor) => (
              <Card 
                key={vendor.id}
                className="pixel-border border-accent/50 cursor-pointer hover-elevate active-elevate-2 overflow-visible"
                onClick={() => setSelectedVendor(vendor)}
                data-testid={`special-vendor-${vendor.id}`}
              >
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="pixel-border p-2 bg-accent/20 border-accent">
                      <PixelIcon icon={vendor.icon} size="lg" />
                    </div>
                    <div>
                      <CardTitle className="pixel-text-sm text-[9px]">{vendor.name}</CardTitle>
                      <p className="font-sans text-xs text-muted-foreground">{vendor.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {vendor.items.slice(0, 4).map((vi) => {
                      const vItem = getItemById(vi.itemId);
                      return vItem ? (
                        <div key={vi.itemId} className={cn(
                          "pixel-border p-1 bg-muted/30",
                          `rarity-${vItem.rarity}`,
                          vItem.isEnchanted && "enchanted-item"
                        )}>
                          <PixelIcon icon={vItem.icon} size="sm" />
                        </div>
                      ) : null;
                    })}
                    {vendor.items.length > 4 && (
                      <span className="pixel-text-sm text-[7px] text-muted-foreground self-center">
                        +{vendor.items.length - 4} more
                      </span>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full pixel-text-sm text-[8px]"
                  >
                    Browse Items <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

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
                  <Badge className="ml-auto pixel-text-sm text-[7px]" variant="outline">Special</Badge>
                </div>
              </DialogHeader>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {selectedVendor.items.map((vendorItem) => {
                  const item = getItemById(vendorItem.itemId);
                  if (!item) return null;
                  
                  const priceModifier = (vendorItem as any).isSpecialItem ? 1.0 : selectedVendor.priceModifier;
                  const price = Math.floor(item.sellPrice * vendorItem.priceMultiplier * priceModifier);
                  const canAfford = coins >= price;
                  const purchasedAlready = getVendorStockPurchased(selectedVendor.id, vendorItem.itemId);
                  const remainingStock = Math.max(0, vendorItem.stock - purchasedAlready);
                  const outOfStock = remainingStock <= 0;
                  
                  return (
                    <HoverCard key={vendorItem.itemId} openDelay={0} closeDelay={0}>
                      <HoverCardTrigger asChild>
                        <div className={cn(
                          "pixel-border border-card-border bg-card p-3",
                          item.isEnchanted && "enchanted-item",
                          outOfStock && "opacity-50"
                        )}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn(
                              'pixel-border p-1.5 bg-muted/30',
                              `rarity-${item.rarity}`
                            )}>
                              <PixelIcon icon={item.icon} size="md" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="pixel-text-sm text-[8px] truncate">{item.name}</p>
                              <p className={cn(
                                "pixel-text-sm text-[7px]",
                                outOfStock ? "text-destructive" : "text-muted-foreground"
                              )}>
                                {outOfStock ? "SOLD OUT" : `Stock: ${remainingStock}/${vendorItem.stock}`}
                              </p>
                            </div>
                          </div>
                          
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBuyClick(vendorItem, true, selectedVendor.priceModifier, selectedVendor.id);
                            }}
                            disabled={!canAfford || outOfStock}
                            size="sm"
                            className="w-full pixel-text-sm text-[8px]"
                            data-testid={`button-buy-${vendorItem.itemId}`}
                          >
                            <PixelIcon icon="coin" size="sm" />
                            {formatNumber(price)}
                          </Button>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent side="top" className="p-0 border-0 bg-transparent w-auto">
                        <ItemTooltip item={item} showUseButton={false} />
                      </HoverCardContent>
                    </HoverCard>
                  );
                })}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmPurchase} onOpenChange={() => { setConfirmPurchase(null); setPurchaseQuantity(1); }}>
        <AlertDialogContent className="pixel-border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="pixel-text text-sm">Confirm Purchase</AlertDialogTitle>
            <AlertDialogDescription className="font-sans" asChild>
              <div>
                {confirmPurchase && (() => {
                  const item = getItemById(confirmPurchase.item.itemId);
                  const pricePerItem = Math.floor((item?.sellPrice || 0) * confirmPurchase.item.priceMultiplier);
                  const purchasedAlready = confirmPurchase.vendorId && confirmPurchase.isSpecialVendor 
                    ? getVendorStockPurchased(confirmPurchase.vendorId, confirmPurchase.item.itemId) 
                    : 0;
                  const maxQty = confirmPurchase.item.unlimitedStock ? 999 : Math.max(0, confirmPurchase.item.stock - purchasedAlready);
                  return item ? (
                    <div className="flex flex-col items-center gap-4 py-4">
                      <div className={cn(
                        'pixel-border p-3 bg-muted/30',
                        `rarity-${item.rarity}`,
                        item.isEnchanted && "enchanted-item"
                      )}>
                        <PixelIcon icon={item.icon} size="xl" />
                      </div>
                      <div className="text-center">
                        <p className="pixel-text-sm text-[12px] text-foreground mb-1">{item.name}</p>
                        <p className="text-muted-foreground text-sm">{item.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-3 pixel-border border-border bg-muted/20 p-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleQuantityChange(purchaseQuantity - 1)}
                          disabled={purchaseQuantity <= 1}
                          data-testid="button-decrease-qty"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          value={purchaseQuantity}
                          onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                          className="w-20 text-center pixel-text-sm"
                          min={1}
                          max={maxQty}
                          data-testid="input-purchase-qty"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleQuantityChange(purchaseQuantity + 1)}
                          disabled={purchaseQuantity >= maxQty}
                          data-testid="button-increase-qty"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="pixel-text-sm text-[9px] text-muted-foreground">
                          {formatNumber(pricePerItem)} each
                        </span>
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
              </div>
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
              Buy {purchaseQuantity}x
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SellView() {
  const inventory = useGameStore((s) => s.inventory);
  const addCoins = useGameStore((s) => s.addCoins);
  const removeItemFromInventory = useGameStore((s) => s.removeItemFromInventory);
  const notificationSettings = useGameStore((s) => s.notificationSettings);
  const { success, warning } = useGameNotifications();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sellQuantities, setSellQuantities] = useState<Record<string, number>>({});
  
  const sellableItems = useMemo(() => {
    return inventory.items
      .map((inv) => {
        const item = getItemById(inv.itemId);
        if (!item) return null;
        if (item.type === 'tool' || item.type === 'armor') return null;
        if (item.sellPrice <= 0) return null;
        return { inv, item };
      })
      .filter(Boolean) as { inv: { itemId: string; quantity: number }; item: GameItem }[];
  }, [inventory.items]);
  
  const filteredItems = useMemo(() => {
    if (!searchQuery) return sellableItems;
    const q = searchQuery.toLowerCase();
    return sellableItems.filter(({ item }) => 
      item.name.toLowerCase().includes(q) || 
      item.description.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q)
    );
  }, [sellableItems, searchQuery]);
  
  const getSellQty = (itemId: string) => sellQuantities[itemId] || 1;
  const setSellQty = (itemId: string, qty: number) => {
    setSellQuantities(prev => ({ ...prev, [itemId]: Math.max(1, qty) }));
  };
  
  const handleSell = (itemId: string, quantity: number, item: GameItem) => {
    const inv = inventory.items.find(i => i.itemId === itemId);
    if (!inv) return;
    
    const actualQty = Math.min(quantity, inv.quantity);
    const totalValue = item.sellPrice * actualQty;
    
    removeItemFromInventory(itemId, actualQty);
    addCoins(totalValue);
    
    if (notificationSettings.enabled && notificationSettings.itemSold) {
      success('Item Sold!', `Sold ${actualQty}x ${item.name} for ${formatNumber(totalValue)} coins`);
    }
    
    setSellQuantities(prev => {
      const newQties = { ...prev };
      delete newQties[itemId];
      return newQties;
    });
  };
  
  const handleSellAll = (itemId: string, item: GameItem) => {
    const inv = inventory.items.find(i => i.itemId === itemId);
    if (!inv) return;
    handleSell(itemId, inv.quantity, item);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Coins className="w-5 h-5 text-green-500" />
          <h3 className="pixel-text-sm text-[11px] text-foreground">Sell Your Items</h3>
          <Badge variant="outline" className="pixel-text-sm text-[7px] bg-green-500/10 border-green-500/30">
            {filteredItems.length} sellable items
          </Badge>
        </div>
      </div>
      
      <div className="pixel-border border-border bg-muted/20 p-4">
        <div className="flex items-start gap-3">
          <div className="pixel-border p-2 bg-green-500/10 border-green-500/30">
            <Coins className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <p className="pixel-text-sm text-[10px] text-foreground mb-1">Sell Items for Coins</p>
            <p className="font-sans text-sm text-muted-foreground">
              Sell minerals, blocks, and crops here. Tools cannot be sold.
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search items to sell..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pixel-text-sm text-[10px]"
          data-testid="input-sell-search"
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-12 pixel-border border-border bg-card">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="pixel-text text-foreground mb-2">No Sellable Items</p>
          <p className="font-sans text-sm text-muted-foreground">
            {searchQuery ? `No items match "${searchQuery}"` : 'Collect minerals, blocks, or crops to sell them here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredItems.map(({ inv, item }) => {
            const sellQty = Math.min(getSellQty(inv.itemId), inv.quantity);
            const totalValue = item.sellPrice * sellQty;
            
            return (
              <Card 
                key={inv.itemId}
                className="pixel-border overflow-visible"
                data-testid={`sell-item-${inv.itemId}`}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col items-center gap-2">
                    <HoverCard openDelay={0} closeDelay={0}>
                      <HoverCardTrigger asChild>
                        <div className={cn(
                          "pixel-border p-2 bg-muted/30 cursor-pointer",
                          `rarity-${item.rarity}`
                        )}>
                          <PixelIcon icon={item.icon} size="lg" />
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent side="top" className="p-0 border-0 bg-transparent w-auto">
                        <ItemTooltip item={item} quantity={inv.quantity} />
                      </HoverCardContent>
                    </HoverCard>
                    
                    <div className="text-center w-full">
                      <p className="pixel-text-sm text-[7px] truncate">{item.name}</p>
                      <p className="pixel-text-sm text-[6px] text-muted-foreground">x{formatNumber(inv.quantity)}</p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5"
                        onClick={() => setSellQty(inv.itemId, sellQty - 1)}
                        disabled={sellQty <= 1}
                        data-testid={`button-decrease-sell-${inv.itemId}`}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="pixel-text-sm text-[8px] w-8 text-center">{sellQty}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5"
                        onClick={() => setSellQty(inv.itemId, sellQty + 1)}
                        disabled={sellQty >= inv.quantity}
                        data-testid={`button-increase-sell-${inv.itemId}`}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <PixelIcon icon="coin" size="sm" />
                      <span className="pixel-text-sm text-[8px] text-game-coin">{formatNumber(totalValue)}</span>
                    </div>
                    
                    <div className="flex gap-1 w-full">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSellAll(inv.itemId, item)}
                        className="flex-1 pixel-text-sm text-[6px]"
                        data-testid={`button-sell-all-${inv.itemId}`}
                      >
                        All
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSell(inv.itemId, sellQty, item)}
                        className="flex-1 pixel-text-sm text-[6px] bg-green-600 hover:bg-green-700"
                        data-testid={`button-sell-${inv.itemId}`}
                      >
                        <Coins className="w-3 h-3 mr-0.5" />
                        Sell
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
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
                      
                      <div className="pixel-border border-accent/30 bg-accent/5 p-3">
                        <p className="pixel-text-sm text-[8px] text-muted-foreground mb-3">
                          Materials Needed (Preview)
                        </p>
                        <div className="space-y-2">
                          {selectedBlueprint.requirements.map((req) => {
                            const item = getItemById(req.itemId);
                            const storageItem = storage.items.find(i => i.itemId === req.itemId);
                            const currentQty = storageItem?.quantity || 0;
                            const hasEnough = currentQty >= req.quantity;
                            
                            return item ? (
                              <div key={req.itemId} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <PixelIcon icon={item.icon} size="sm" />
                                  <span className="pixel-text-sm text-[8px]">{item.name}</span>
                                </div>
                                <span className={cn(
                                  'pixel-text-sm text-[8px] tabular-nums',
                                  hasEnough ? 'text-primary' : 'text-muted-foreground'
                                )}>
                                  {currentQty}/{req.quantity}
                                </span>
                              </div>
                            ) : null;
                          })}
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
                <div className="grid grid-cols-6 gap-3">
                  {Array.from({ length: vault.maxSlots }).map((_, index) => {
                    const slot = vault.slots[index];
                    const item = slot ? getItemById(slot.itemId) : null;
                    
                    return (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <div 
                            className={cn(
                              'item-slot-vault',
                              slot ? `item-slot-filled rarity-${item?.rarity}` : '',
                              slot && 'hover-elevate cursor-pointer',
                              item?.isEnchanted && 'enchanted-item',
                              item?.isSpecial && 'special-item',
                              item?.isLimited && item?.limitedEffect === 'blue_flame' && 'blue-flame-item'
                            )}
                            draggable={!!slot}
                            onDragStart={(e) => slot && handleDragStart(e, slot.itemId, slot.quantity, 'vault')}
                            onDragEnd={handleDragEnd}
                            onClick={() => slot && removeItemFromVault(slot.itemId, slot.quantity)}
                            data-testid={`vault-slot-${index}`}
                          >
                            {item && (
                              <>
                                <PixelIcon icon={item.icon} size="lg" />
                                {slot && slot.quantity > 1 && (
                                  <span className="absolute bottom-0 right-0.5 pixel-text-sm text-[7px] text-foreground tabular-nums drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
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
                <div className="grid grid-cols-6 gap-3">
                  {inventory.items.map((inv, index) => {
                    const item = getItemById(inv.itemId);
                    if (!item) return null;
                    
                    return (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <div 
                            className={cn(
                              'item-slot-vault item-slot-filled cursor-pointer hover-elevate',
                              `rarity-${item.rarity}`,
                              item.isEnchanted && 'enchanted-item',
                              item.isSpecial && 'special-item',
                              item.isLimited && item.limitedEffect === 'blue_flame' && 'blue-flame-item'
                            )}
                            draggable
                            onDragStart={(e) => handleDragStart(e, inv.itemId, inv.quantity, 'inventory')}
                            onDragEnd={handleDragEnd}
                            onClick={() => addItemToVault(inv.itemId, inv.quantity)}
                            data-testid={`inv-to-vault-${inv.itemId}`}
                          >
                            <PixelIcon icon={item.icon} size="lg" />
                            {inv.quantity > 1 && (
                              <span className="absolute bottom-0 right-0.5 pixel-text-sm text-[7px] text-foreground tabular-nums drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
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
                    <p className="col-span-6 text-center pixel-text-sm text-[9px] text-muted-foreground py-4">
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

function MinesView() {
  const [currentBlock, setCurrentBlock] = useState(selectRandomBlock());
  const [miningProgress, setMiningProgress] = useState(0);
  const [isMining, setIsMining] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showBlockIndex, setShowBlockIndex] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  
  const miningIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const isHoldingRef = useRef(false);
  const miningAreaRef = useRef<HTMLDivElement>(null);
  
  const equipment = useGameStore((s) => s.equipment);
  const equipmentDurability = useGameStore((s) => s.equipmentDurability);
  const miningStats = useGameStore((s) => s.miningStats);
  const storage = useGameStore((s) => s.storage);
  const getStorageUsed = useGameStore((s) => s.getStorageUsed);
  const addItemToStorage = useGameStore((s) => s.addItemToStorage);
  const addBlockMined = useGameStore((s) => s.addBlockMined);
  const usePickaxeDurability = useGameStore((s) => s.usePickaxeDurability);
  const addMiningXp = useGameStore((s) => s.addMiningXp);
  const getEquippedPickaxe = useGameStore((s) => s.getEquippedPickaxe);
  const isEquipmentBroken = useGameStore((s) => s.isEquipmentBroken);
  
  const { success, warning } = useGameNotifications();
  
  // Get the actual equipped mainHand item (even if broken)
  const mainHandItemId = equipment.mainHand;
  const mainHandItem = mainHandItemId ? getItemById(mainHandItemId) : null;
  const isPickaxeBroken = mainHandItem?.toolType === 'pickaxe' && isEquipmentBroken('mainHand');
  
  // getEquippedPickaxe returns null for broken pickaxes
  const equippedPickaxe = getEquippedPickaxe();
  const pickaxeItem = equippedPickaxe ? getItemById(equippedPickaxe) : null;
  const pickaxeTier = equippedPickaxe ? getPickaxeTier(equippedPickaxe) : 0;
  const miningSpeed = pickaxeItem?.stats?.mining_speed || 0;
  
  const blockItem = getItemById(currentBlock.itemId);
  const breakTime = equippedPickaxe ? getBreakTime(currentBlock, pickaxeTier, miningSpeed) : currentBlock.breakTime * 5;
  const canReceive = equippedPickaxe ? canReceiveItem(currentBlock, pickaxeTier) : false;
  
  const storageUsed = getStorageUsed();
  const storageFull = storageUsed >= storage.capacity;
  
  const currentDurability = equipmentDurability.mainHand;
  const maxDurability = pickaxeItem?.stats?.durability || 0;

  const startMiningBlock = useCallback((block: typeof currentBlock, blockBreakTime: number, canReceiveBlock: boolean) => {
    setIsMining(true);
    startTimeRef.current = Date.now();
    
    if (miningIntervalRef.current) {
      clearInterval(miningIntervalRef.current);
    }
    
    miningIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min((elapsed / blockBreakTime) * 100, 100);
      setMiningProgress(progress);
      
      if (progress >= 100) {
        if (miningIntervalRef.current) {
          clearInterval(miningIntervalRef.current);
          miningIntervalRef.current = null;
        }
        
        const stillHasDurability = usePickaxeDurability();
        const blockItemInfo = getItemById(block.itemId);
        
        if (canReceiveBlock) {
          addItemToStorage(block.itemId, 1);
          addBlockMined(block.itemId);
          addMiningXp(block.xpReward);
        } else {
          addBlockMined(block.itemId);
        }
        
        setMiningProgress(0);
        setIsMining(false);
        
        const newBlock = selectRandomBlock();
        setCurrentBlock(newBlock);
        
        if (!stillHasDurability) {
          warning('Pickaxe Broken!', 'Your pickaxe has broken and needs repair! Equip a new pickaxe to continue mining.');
          setIsHolding(false);
          isHoldingRef.current = false;
          return;
        }
        
        const currentStorageUsed = useGameStore.getState().getStorageUsed();
        const currentStorageCapacity = useGameStore.getState().storage.capacity;
        const isStorageFull = currentStorageUsed >= currentStorageCapacity;
        
        if (isStorageFull) {
          warning('Storage Full', 'Clear some storage space before mining.');
          setIsHolding(false);
          isHoldingRef.current = false;
          return;
        }
        
        if (isHoldingRef.current) {
          const currentEquippedPickaxe = useGameStore.getState().getEquippedPickaxe();
          if (!currentEquippedPickaxe) {
            setIsHolding(false);
            isHoldingRef.current = false;
            return;
          }
          
          const currentPickaxeItem = getItemById(currentEquippedPickaxe);
          const currentPickaxeTier = getPickaxeTier(currentEquippedPickaxe);
          const currentMiningSpeed = currentPickaxeItem?.stats?.mining_speed || 0;
          const newBreakTime = getBreakTime(newBlock, currentPickaxeTier, currentMiningSpeed);
          const newCanReceive = canReceiveItem(newBlock, currentPickaxeTier);
          
          setTimeout(() => {
            if (isHoldingRef.current) {
              startMiningBlock(newBlock, newBreakTime, newCanReceive);
            }
          }, 50);
        }
      }
    }, 50);
  }, [usePickaxeDurability, addItemToStorage, addBlockMined, addMiningXp, warning]);
  
  const handleMiningStart = useCallback(() => {
    if (isPickaxeBroken) {
      warning('Pickaxe Broken', 'Your pickaxe is broken and needs to be repaired!');
      return;
    }
    
    if (!equippedPickaxe) {
      warning('No Pickaxe', 'You need a pickaxe to mine! Buy one from the Marketplace.');
      return;
    }
    
    if (storageFull) {
      warning('Storage Full', 'Clear some storage space before mining.');
      return;
    }
    
    setIsHolding(true);
    isHoldingRef.current = true;
    startMiningBlock(currentBlock, breakTime, canReceive);
  }, [isPickaxeBroken, equippedPickaxe, storageFull, breakTime, canReceive, currentBlock, startMiningBlock, warning]);
  
  const handleMiningStop = useCallback(() => {
    isHoldingRef.current = false;
    setIsHolding(false);
    
    if (miningIntervalRef.current) {
      clearInterval(miningIntervalRef.current);
      miningIntervalRef.current = null;
    }
    setIsMining(false);
    setMiningProgress(0);
    setCursorPosition(null);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isMining || isHolding) {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    }
  }, [isMining, isHolding]);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (isMining || isHolding) {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    }
  }, [isMining, isHolding]);

  const handleMouseLeave = useCallback(() => {
    handleMiningStop();
  }, [handleMiningStop]);
  
  useEffect(() => {
    return () => {
      if (miningIntervalRef.current) {
        clearInterval(miningIntervalRef.current);
      }
    };
  }, []);
  
  const breakStage = Math.floor(miningProgress / 20);
  
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
          <h2 className="pixel-text text-xl text-foreground">Manual Mines</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(true)}
              data-testid="button-mining-stats"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Stats
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBlockIndex(true)}
              data-testid="button-block-index"
            >
              <Info className="w-4 h-4 mr-1" />
              Block Index
            </Button>
          </div>
        </div>
        <p className="font-sans text-muted-foreground text-base mb-4">
          Mine blocks manually to gather resources. Better pickaxes mine faster and unlock rarer drops!
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 pixel-border border-card-border overflow-visible">
          <CardHeader className="pb-2">
            <CardTitle className="pixel-text text-sm flex items-center gap-2">
              <Pickaxe className="w-4 h-4" />
              Mining Area
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 py-8 relative">
            {(isMining || isHolding) && cursorPosition && pickaxeItem && (
              <div 
                className="fixed pointer-events-none z-50"
                style={{ 
                  left: cursorPosition.x - 16, 
                  top: cursorPosition.y - 16,
                  transform: isMining ? `rotate(${-20 + breakStage * 8}deg)` : 'rotate(-15deg)',
                  transition: 'transform 0.1s ease-out'
                }}
              >
                <PixelIcon icon={pickaxeItem.icon} size="lg" />
              </div>
            )}
            <div 
              ref={miningAreaRef}
              className={cn(
                "relative w-32 h-32 pixel-border border-border select-none transition-transform",
                isMining && "scale-95",
                (!equippedPickaxe || isPickaxeBroken) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              )}
              onMouseDown={handleMiningStart}
              onMouseUp={handleMiningStop}
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleMiningStart}
              onTouchEnd={handleMiningStop}
              data-testid="mining-block"
            >
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                <PixelIcon icon={currentBlock.itemId} size="xl" />
              </div>
              
              {isMining && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div 
                    className="absolute inset-0 border-4 border-white/50 animate-pulse"
                    style={{ opacity: breakStage * 0.2 }}
                  />
                  <div className="grid grid-cols-3 grid-rows-3 gap-0.5 w-full h-full p-2">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "bg-black/30 transition-opacity duration-100",
                          i < breakStage * 2 && "bg-black/60"
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {!canReceive && equippedPickaxe && (
                <div className="absolute -top-2 -right-2 z-10">
                  <Badge variant="destructive" className="pixel-text-sm text-[8px]">
                    LOW TIER
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="text-center">
              <p className="pixel-text text-sm mb-1">{blockItem?.name || 'Unknown Block'}</p>
              <p className="pixel-text-sm text-[9px] text-muted-foreground">
                {canReceive ? 'Click and hold to mine' : `Requires Tier ${currentBlock.minPickaxeTier} pickaxe`}
              </p>
            </div>
            
            <div className="w-full max-w-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="pixel-text-sm text-[9px] text-muted-foreground">Mining Progress</span>
                <span className="pixel-text-sm text-[9px]">{Math.floor(miningProgress)}%</span>
              </div>
              <Progress value={miningProgress} className="h-3" />
            </div>
            
            {isPickaxeBroken && (
              <div className="pixel-border border-amber-500/50 bg-amber-500/10 p-4 text-center">
                <p className="pixel-text-sm text-amber-600 dark:text-amber-400">Pickaxe is broken!</p>
                <p className="font-sans text-[10px] text-muted-foreground mt-1">
                  Your pickaxe has no durability left. Equip a new pickaxe or wait for the repair feature.
                </p>
              </div>
            )}
            
            {!equippedPickaxe && !isPickaxeBroken && (
              <div className="pixel-border border-destructive/50 bg-destructive/10 p-4 text-center">
                <p className="pixel-text-sm text-destructive">No pickaxe equipped!</p>
                <p className="font-sans text-[10px] text-muted-foreground mt-1">
                  Visit the Marketplace to buy a pickaxe, then equip it from your Inventory (TAB).
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="pixel-border border-card-border overflow-visible">
          <CardHeader className="pb-2">
            <CardTitle className="pixel-text text-sm">Equipment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="pixel-border border-border bg-muted/20 p-4">
              <p className="pixel-text-sm text-[9px] text-muted-foreground mb-2">Current Pickaxe</p>
              {(pickaxeItem || (mainHandItem?.toolType === 'pickaxe' && isPickaxeBroken)) ? (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <PixelIcon icon={(pickaxeItem || mainHandItem)?.icon || ''} size="lg" />
                    {isPickaxeBroken && (
                      <div className="absolute -top-1 -right-1">
                        <Badge variant="destructive" className="pixel-text-sm text-[6px] px-1 py-0">
                          BROKEN
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className={cn(
                      "pixel-text-sm text-[10px]",
                      isPickaxeBroken && "text-muted-foreground line-through"
                    )}>
                      {(pickaxeItem || mainHandItem)?.name}
                    </p>
                    {isPickaxeBroken ? (
                      <p className="pixel-text-sm text-[8px] text-amber-600 dark:text-amber-400">
                        Needs repair
                      </p>
                    ) : (
                      <p className="pixel-text-sm text-[8px] text-muted-foreground">
                        Tier {pickaxeTier} | Speed: {miningSpeed}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="pixel-text-sm text-[10px] text-muted-foreground">None equipped</p>
              )}
            </div>
            
            {(pickaxeItem || (mainHandItem?.toolType === 'pickaxe' && isPickaxeBroken)) && (
              <div className="pixel-border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="pixel-text-sm text-[9px] text-muted-foreground">Durability</p>
                  <p className={cn(
                    "pixel-text-sm text-[9px]",
                    isPickaxeBroken && "text-destructive"
                  )}>
                    {currentDurability ?? 0} / {mainHandItem?.stats?.durability || maxDurability}
                  </p>
                </div>
                <Progress 
                  value={((currentDurability ?? 0) / (mainHandItem?.stats?.durability || maxDurability || 1)) * 100} 
                  className={cn(
                    "h-2",
                    (currentDurability ?? 0) / (mainHandItem?.stats?.durability || maxDurability || 1) < 0.2 && "[&>div]:bg-destructive"
                  )} 
                />
              </div>
            )}
            
            <div className="pixel-border border-border bg-muted/20 p-4">
              <p className="pixel-text-sm text-[9px] text-muted-foreground mb-2">Storage</p>
              <div className="flex items-center justify-between">
                <span className="pixel-text-sm text-[10px]">{storageUsed} / {storage.capacity}</span>
                {storageFull && (
                  <Badge variant="destructive" className="pixel-text-sm text-[8px]">FULL</Badge>
                )}
              </div>
              <Progress value={(storageUsed / storage.capacity) * 100} className="h-2 mt-2" />
            </div>
            
            <div className="pixel-border border-accent/30 bg-accent/5 p-3">
              <p className="pixel-text-sm text-[8px] text-center text-muted-foreground">
                Coming Soon: Tiered Mines with better blocks!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={showStats} onOpenChange={setShowStats}>
        <DialogContent className="pixel-border border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="pixel-text text-sm">Mining Statistics</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="pixel-border border-border bg-muted/20 p-4">
              <p className="pixel-text-sm text-[9px] text-muted-foreground mb-1">Total Blocks Mined</p>
              <p className="pixel-text text-lg">{formatNumber(miningStats.totalBlocksMined)}</p>
            </div>
            
            <div className="space-y-2">
              <p className="pixel-text-sm text-[10px]">Blocks by Type</p>
              {Object.entries(miningStats.blocksMined).length === 0 ? (
                <p className="font-sans text-muted-foreground text-sm">No blocks mined yet!</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto scrollbar-pixel">
                  {Object.entries(miningStats.blocksMined)
                    .sort((a, b) => b[1] - a[1])
                    .map(([itemId, count]) => {
                      const item = getItemById(itemId);
                      return (
                        <div key={itemId} className="pixel-border border-border bg-card p-2 flex items-center gap-2">
                          <PixelIcon icon={itemId} size="sm" />
                          <div>
                            <p className="pixel-text-sm text-[8px]">{item?.name || itemId}</p>
                            <p className="pixel-text-sm text-[10px] text-muted-foreground">{formatNumber(count)}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showBlockIndex} onOpenChange={setShowBlockIndex}>
        <DialogContent className="pixel-border border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="pixel-text text-sm">Block Index</DialogTitle>
            <DialogDescription className="font-sans text-muted-foreground">
              All blocks available in the mines and their requirements.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto scrollbar-pixel pr-2">
            {MINEABLE_BLOCKS.map((block) => {
              const item = getItemById(block.itemId);
              const tierNames = ['Wood', 'Stone', 'Iron', 'Diamond', 'Netherite'];
              return (
                <div 
                  key={block.itemId}
                  className={cn(
                    "pixel-border border-border bg-card p-3 flex items-start gap-3",
                    pickaxeTier >= block.minPickaxeTier && "border-primary/50"
                  )}
                >
                  <PixelIcon icon={block.itemId} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="pixel-text-sm text-[10px]">{item?.name || block.itemId}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="pixel-text-sm text-[7px]">
                        {block.spawnChance}% chance
                      </Badge>
                      <Badge 
                        variant={pickaxeTier >= block.minPickaxeTier ? "default" : "secondary"}
                        className="pixel-text-sm text-[7px]"
                      >
                        {tierNames[block.minPickaxeTier - 1]} Tier+
                      </Badge>
                    </div>
                    <p className="pixel-text-sm text-[8px] text-muted-foreground mt-1">
                      XP: {block.xpReward} | Time: {parseFloat((block.breakTime / 1000).toFixed(2))}s
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
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
