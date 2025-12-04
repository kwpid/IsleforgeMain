import { useMemo, useState } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { formatNumber, ItemDefinition } from '@/lib/gameTypes';
import { ALL_ITEMS, getItemById } from '@/lib/items/index';
import { PixelIcon } from './PixelIcon';
import { ItemTooltip } from './ItemTooltip';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import { Sparkles, Clock, Coins, Tag, Lock, ShoppingCart, Loader2, Check, X } from 'lucide-react';
import { useGameNotifications } from '@/hooks/useGameNotifications';
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

export function ShopTab() {
  const shopSubTab = useGameStore((s) => s.shopSubTab);

  return (
    <div className="h-full overflow-y-auto scrollbar-pixel p-6">
      {shopSubTab === 'limited' && <LimitedShop />}
      {shopSubTab === 'daily' && <DailyShop />}
      {shopSubTab === 'coins' && <CoinsShop />}
    </div>
  );
}

function LimitedShop() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-6 h-6 text-rarity-legendary" />
        <h2 className="pixel-text text-lg text-foreground">
          Limited Shop
        </h2>
      </div>

      <Card className="pixel-border border-rarity-legendary/30 bg-rarity-legendary/5">
        <CardContent className="p-8 text-center">
          <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="pixel-text text-foreground mb-2">Coming Soon</p>
          <p className="font-sans text-sm text-muted-foreground">
            Exclusive limited-time items will appear here. Check back later for rare finds!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface DailyItem {
  item: ItemDefinition;
  upPrice: number;
  originalPrice: number;
  isDiscounted: boolean;
}

function DailyShop() {
  const player = useGameStore((s) => s.player);
  const addUniversalPoints = useGameStore((s) => s.addUniversalPoints);
  const addItemToInventory = useGameStore((s) => s.addItemToInventory);
  const { notify, error: showError } = useGameNotifications();
  
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; item: DailyItem | null }>({
    open: false,
    item: null,
  });
  const [isPurchasing, setIsPurchasing] = useState(false);

  const dailyItems = useMemo(() => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    
    const expensiveItems = ALL_ITEMS.filter(item => 
      item.sellPrice >= 500 && 
      (item.type === 'tool' || item.type === 'armor' || item.type === 'material')
    );

    const seededRandom = (n: number) => {
      const x = Math.sin(seed + n) * 10000;
      return x - Math.floor(x);
    };

    const indexedItems = expensiveItems.map((item, idx) => ({
      item,
      sortKey: seededRandom(idx)
    }));
    
    indexedItems.sort((a, b) => a.sortKey - b.sortKey);
    const selected = indexedItems.slice(0, 4).map(i => i.item);

    const hasSale = seededRandom(42) < 0.5;
    const discountIndex = hasSale ? Math.floor(seededRandom(99) * 4) : -1;

    return selected.map((item, index) => {
      const baseUpPrice = Math.ceil(item.sellPrice / 10000) + 1;
      const isDiscounted = index === discountIndex;
      const upPrice = isDiscounted ? Math.ceil(baseUpPrice * 0.7) : baseUpPrice;
      
      return {
        item,
        upPrice,
        originalPrice: baseUpPrice,
        isDiscounted,
      };
    });
  }, []);

  const handlePurchaseClick = (dailyItem: DailyItem) => {
    setConfirmDialog({ open: true, item: dailyItem });
  };

  const handleConfirmPurchase = async () => {
    if (!confirmDialog.item) return;
    
    const { item, upPrice } = confirmDialog.item;
    
    if (player.universalPoints < upPrice) {
      showError('Not Enough UP', `You need U$${upPrice} to purchase this item.`);
      setConfirmDialog({ open: false, item: null });
      return;
    }

    setIsPurchasing(true);
    
    await new Promise(resolve => setTimeout(resolve, 600));

    const success = addItemToInventory(item.id, 1);
    if (success) {
      addUniversalPoints(-upPrice);
      notify({
        type: 'item',
        title: 'Item Purchased!',
        message: `You bought ${item.name} for U$${upPrice}`,
        icon: item.icon,
      });
    } else {
      showError('Inventory Full', 'Make room in your inventory first.');
    }
    
    setIsPurchasing(false);
    setConfirmDialog({ open: false, item: null });
  };

  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-primary" />
          <h2 className="pixel-text text-lg text-foreground">
            Daily Deals
          </h2>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="pixel-text-sm">Resets in {getTimeUntilReset()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {dailyItems.map(({ item, upPrice, originalPrice, isDiscounted }) => (
          <Card 
            key={item.id} 
            className={cn(
              'pixel-border relative overflow-visible group transition-all duration-200',
              isDiscounted 
                ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5' 
                : 'border-card-border bg-gradient-to-br from-card to-muted/20'
            )}
            data-testid={`shop-item-${item.id}`}
          >
            {isDiscounted && (
              <div className="absolute -top-3 -right-3 z-10">
                <Badge className="bg-primary text-primary-foreground pixel-text-sm text-[10px] gap-1 px-2 py-1">
                  <Tag className="w-3 h-3" />
                  30% OFF
                </Badge>
              </div>
            )}
            <CardContent className="p-5">
              <div className="flex items-start gap-4 mb-4">
                <HoverCard openDelay={0} closeDelay={0}>
                  <HoverCardTrigger asChild>
                    <div className={cn(
                      "w-16 h-16 flex items-center justify-center pixel-border rounded-sm overflow-visible cursor-pointer",
                      `bg-rarity-${item.rarity}/10 border-rarity-${item.rarity}/30`,
                      item.isEnchanted && "enchanted-item",
                      item.isSpecial && "special-item"
                    )}>
                      <PixelIcon icon={item.icon} size="lg" />
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent side="top" className="p-0 border-0 bg-transparent w-auto">
                    <ItemTooltip item={item} />
                  </HoverCardContent>
                </HoverCard>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'pixel-text text-sm mb-1',
                    `text-rarity-${item.rarity}`
                  )}>
                    {item.name}
                  </p>
                  <div className="flex items-center gap-1 flex-wrap mb-2">
                    <Badge variant="outline" className="pixel-text-sm text-[8px]">
                      {item.rarity.toUpperCase()}
                    </Badge>
                    {item.isEnchanted && (
                      <Badge className="bg-purple-500/80 text-white pixel-text-sm text-[8px] gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        Enchanted
                      </Badge>
                    )}
                    {item.isSpecial && !item.isEnchanted && (
                      <Badge className="bg-amber-500/80 text-black pixel-text-sm text-[8px] gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        Special
                      </Badge>
                    )}
                  </div>
                  <p className="font-sans text-xs text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <PixelIcon icon="universal_point" size="sm" />
                  <span className={cn(
                    'pixel-text text-sm font-bold',
                    isDiscounted ? 'text-primary' : 'text-game-up'
                  )}>
                    U${upPrice}
                  </span>
                  {isDiscounted && (
                    <span className="pixel-text-sm text-[10px] text-muted-foreground line-through">
                      U${originalPrice}
                    </span>
                  )}
                </div>
                <Button
                  onClick={() => handlePurchaseClick({ item, upPrice, originalPrice, isDiscounted })}
                  disabled={player.universalPoints < upPrice}
                  className="pixel-text-sm"
                  data-testid={`button-buy-${item.id}`}
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Buy
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !isPurchasing && setConfirmDialog({ open, item: open ? confirmDialog.item : null })}>
        <AlertDialogContent className="pixel-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="pixel-text flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Confirm Purchase
            </AlertDialogTitle>
            <AlertDialogDescription className="font-sans">
              {confirmDialog.item && (
                <div className="flex items-center gap-3 mt-3 p-3 bg-muted/50 rounded-sm">
                  <PixelIcon icon={confirmDialog.item.item.icon} size="md" />
                  <div>
                    <p className={cn('pixel-text-sm', `text-rarity-${confirmDialog.item.item.rarity}`)}>
                      {confirmDialog.item.item.name}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <PixelIcon icon="universal_point" size="sm" />
                      <span className="text-game-up font-bold">U${confirmDialog.item.upPrice}</span>
                    </p>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPurchasing} className="pixel-text-sm">
              <X className="w-4 h-4 mr-1" />
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPurchase} disabled={isPurchasing} className="pixel-text-sm">
              {isPurchasing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Confirm
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface CoinPackage {
  id: string;
  coins: number;
  upCost: number;
  isOnSale: boolean;
  salePercent?: number;
  originalUpCost?: number;
  label: string;
  featured?: boolean;
}

function CoinsShop() {
  const player = useGameStore((s) => s.player);
  const addCoins = useGameStore((s) => s.addCoins);
  const addUniversalPoints = useGameStore((s) => s.addUniversalPoints);
  const { notify, error: showError } = useGameNotifications();
  
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; pkg: CoinPackage | null }>({
    open: false,
    pkg: null,
  });
  const [isPurchasing, setIsPurchasing] = useState(false);

  const coinPackages: CoinPackage[] = useMemo(() => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const seededRandom = (n: number) => {
      const x = Math.sin(seed + n * 100) * 10000;
      return x - Math.floor(x);
    };

    const hasSale = seededRandom(77) < 0.5;
    const saleIndex = hasSale ? Math.floor(seededRandom(88) * 6) : -1;

    const packages: CoinPackage[] = [
      { id: 'coins_10k', coins: 10000, upCost: 1, isOnSale: false, label: '10K' },
      { id: 'coins_100k', coins: 100000, upCost: 10, isOnSale: false, label: '100K' },
      { id: 'coins_500k', coins: 500000, upCost: 50, isOnSale: false, label: '500K', featured: true },
      { id: 'coins_1m', coins: 1000000, upCost: 100, isOnSale: false, label: '1M', featured: true },
      { id: 'coins_5m', coins: 5000000, upCost: 500, isOnSale: false, label: '5M' },
      { id: 'coins_10m', coins: 10000000, upCost: 1000, isOnSale: false, label: '10M' },
    ];

    return packages.map((pkg, index) => {
      if (index === saleIndex) {
        const discountedCost = Math.ceil(pkg.upCost * 0.7);
        return {
          ...pkg,
          isOnSale: true,
          salePercent: 30,
          originalUpCost: pkg.upCost,
          upCost: discountedCost,
        };
      }
      return pkg;
    });
  }, []);

  const handlePurchaseClick = (pkg: CoinPackage) => {
    setConfirmDialog({ open: true, pkg });
  };

  const handleConfirmPurchase = async () => {
    if (!confirmDialog.pkg) return;
    
    const pkg = confirmDialog.pkg;
    
    if (player.universalPoints < pkg.upCost) {
      showError('Not Enough UP', `You need U$${pkg.upCost} to purchase this package.`);
      setConfirmDialog({ open: false, pkg: null });
      return;
    }

    setIsPurchasing(true);
    
    await new Promise(resolve => setTimeout(resolve, 600));

    addUniversalPoints(-pkg.upCost);
    addCoins(pkg.coins);
    notify({
      type: 'coin',
      title: 'Coins Purchased!',
      message: `You received ${formatNumber(pkg.coins)} coins for U$${pkg.upCost}`,
    });
    
    setIsPurchasing(false);
    setConfirmDialog({ open: false, pkg: null });
  };

  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <PixelIcon icon="coin" size="md" />
          <h2 className="pixel-text text-lg text-foreground">
            Coin Exchange
          </h2>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="pixel-text-sm">Sales reset in {getTimeUntilReset()}</span>
        </div>
      </div>

      <Card className="pixel-border border-game-coin/30 bg-gradient-to-r from-game-coin/5 to-transparent mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PixelIcon icon="universal_point" size="sm" />
              <span className="font-sans text-sm text-muted-foreground">Exchange Rate:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="pixel-text text-sm text-game-up">U$1</span>
              <span className="text-muted-foreground">=</span>
              <PixelIcon icon="coin" size="sm" />
              <span className="pixel-text text-sm text-game-coin">10,000 Coins</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {coinPackages.map((pkg) => (
          <Card 
            key={pkg.id}
            className={cn(
              'pixel-border relative overflow-visible transition-all duration-200',
              pkg.isOnSale 
                ? 'border-game-coin bg-gradient-to-br from-game-coin/15 to-game-coin/5' 
                : pkg.featured 
                  ? 'border-primary/50 bg-gradient-to-br from-primary/10 to-muted/30'
                  : 'border-card-border bg-gradient-to-br from-card to-muted/20'
            )}
            data-testid={`coin-package-${pkg.id}`}
          >
            {pkg.isOnSale && (
              <div className="absolute -top-3 -right-3 z-10">
                <Badge className="bg-game-coin text-black pixel-text-sm text-[10px] gap-1 px-2 py-1">
                  <Tag className="w-3 h-3" />
                  {pkg.salePercent}% OFF
                </Badge>
              </div>
            )}
            {pkg.featured && !pkg.isOnSale && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <Badge className="bg-primary text-primary-foreground pixel-text-sm text-[8px] px-2">
                  POPULAR
                </Badge>
              </div>
            )}
            <CardContent className="p-5">
              <div className="flex flex-col items-center text-center">
                <div className={cn(
                  "w-16 h-16 flex items-center justify-center mb-3 pixel-border rounded-sm",
                  pkg.isOnSale 
                    ? "bg-game-coin/20 border-game-coin/40" 
                    : "bg-muted/50 border-border"
                )}>
                  <PixelIcon icon="coin" size="lg" />
                </div>
                
                <span className={cn(
                  "pixel-text text-2xl mb-1",
                  pkg.isOnSale ? "text-game-coin" : "text-foreground"
                )}>
                  {pkg.label}
                </span>
                <p className="font-sans text-xs text-muted-foreground mb-4">
                  {pkg.coins.toLocaleString()} coins
                </p>

                <div className="w-full pt-3 border-t border-border/50">
                  <div className="flex items-center justify-center gap-1 mb-3">
                    <PixelIcon icon="universal_point" size="sm" />
                    <span className={cn(
                      'pixel-text text-sm font-bold',
                      pkg.isOnSale ? 'text-game-coin' : 'text-game-up'
                    )}>
                      U${pkg.upCost}
                    </span>
                    {pkg.isOnSale && pkg.originalUpCost && (
                      <span className="pixel-text-sm text-[10px] text-muted-foreground line-through ml-1">
                        U${pkg.originalUpCost}
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={() => handlePurchaseClick(pkg)}
                    disabled={player.universalPoints < pkg.upCost}
                    className={cn(
                      "pixel-text-sm w-full",
                      pkg.isOnSale && "bg-game-coin text-black hover:bg-game-coin/90"
                    )}
                    data-testid={`button-buy-${pkg.id}`}
                  >
                    <Coins className="w-4 h-4 mr-1" />
                    Purchase
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="pixel-border border-border/50 bg-muted/20">
        <CardContent className="p-4">
          <p className="font-sans text-xs text-muted-foreground text-center">
            Universal Points (U$) can be earned by leveling up. Each level grants 1 U$.
            Use U$ to purchase coins or exclusive items from the shop.
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !isPurchasing && setConfirmDialog({ open, pkg: open ? confirmDialog.pkg : null })}>
        <AlertDialogContent className="pixel-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="pixel-text flex items-center gap-2">
              <Coins className="w-5 h-5 text-game-coin" />
              Confirm Purchase
            </AlertDialogTitle>
            <AlertDialogDescription className="font-sans">
              {confirmDialog.pkg && (
                <div className="flex items-center gap-3 mt-3 p-3 bg-muted/50 rounded-sm">
                  <PixelIcon icon="coin" size="md" />
                  <div>
                    <p className="pixel-text text-game-coin">
                      {confirmDialog.pkg.label} Coins
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {confirmDialog.pkg.coins.toLocaleString()} coins
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <PixelIcon icon="universal_point" size="sm" />
                      <span className="text-game-up font-bold">U${confirmDialog.pkg.upCost}</span>
                    </p>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPurchasing} className="pixel-text-sm">
              <X className="w-4 h-4 mr-1" />
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPurchase} disabled={isPurchasing} className="pixel-text-sm">
              {isPurchasing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Confirm
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
