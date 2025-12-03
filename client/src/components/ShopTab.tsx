import { useMemo } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { formatNumber, ItemDefinition } from '@/lib/gameTypes';
import { ALL_ITEMS, getItemById } from '@/lib/items/index';
import { PixelIcon } from './PixelIcon';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Sparkles, Clock, Coins, Tag, Lock, ShoppingCart } from 'lucide-react';
import { useGameNotifications } from '@/hooks/useGameNotifications';

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

function DailyShop() {
  const player = useGameStore((s) => s.player);
  const addUniversalPoints = useGameStore((s) => s.addUniversalPoints);
  const addItemToInventory = useGameStore((s) => s.addItemToInventory);
  const { notify, error: showError } = useGameNotifications();

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
    const selected = indexedItems.slice(0, 6).map(i => i.item);

    const discountIndex = Math.floor(seededRandom(42) * 6);

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

  const handlePurchase = (item: ItemDefinition, upPrice: number) => {
    if (player.universalPoints < upPrice) {
      showError('Not Enough UP', `You need ${upPrice} UP to purchase this item.`);
      return;
    }

    const success = addItemToInventory(item.id, 1);
    if (success) {
      addUniversalPoints(-upPrice);
      notify({
        type: 'item',
        title: 'Item Purchased!',
        message: `You bought ${item.name} for ${upPrice} UP`,
        icon: item.icon,
      });
    } else {
      showError('Inventory Full', 'Make room in your inventory first.');
    }
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

      <div className="flex items-center gap-2 mb-4">
        <PixelIcon icon="universal_point" size="sm" />
        <span className="pixel-text text-sm">Your UP: {player.universalPoints}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dailyItems.map(({ item, upPrice, originalPrice, isDiscounted }) => (
          <Card 
            key={item.id} 
            className={cn(
              'pixel-border relative overflow-visible',
              isDiscounted ? 'border-primary bg-primary/5' : 'border-card-border'
            )}
            data-testid={`shop-item-${item.id}`}
          >
            {isDiscounted && (
              <div className="absolute -top-2 -right-2 z-10">
                <Badge className="bg-primary text-primary-foreground pixel-text-sm text-[8px] gap-1">
                  <Tag className="w-3 h-3" />
                  30% OFF
                </Badge>
              </div>
            )}
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 flex items-center justify-center bg-muted/50 pixel-border border-border">
                  <PixelIcon icon={item.icon} size="md" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'pixel-text-sm text-[9px] truncate',
                    `text-rarity-${item.rarity}`
                  )}>
                    {item.name}
                  </p>
                  <p className="font-sans text-xs text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <PixelIcon icon="universal_point" size="sm" />
                  <span className={cn(
                    'pixel-text-sm',
                    isDiscounted ? 'text-primary' : ''
                  )}>
                    {upPrice} UP
                  </span>
                  {isDiscounted && (
                    <span className="pixel-text-sm text-[8px] text-muted-foreground line-through ml-1">
                      {originalPrice} UP
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => handlePurchase(item, upPrice)}
                  disabled={player.universalPoints < upPrice}
                  className="pixel-text-sm text-[8px]"
                  data-testid={`button-buy-${item.id}`}
                >
                  Buy
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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
}

function CoinsShop() {
  const player = useGameStore((s) => s.player);
  const addCoins = useGameStore((s) => s.addCoins);
  const addUniversalPoints = useGameStore((s) => s.addUniversalPoints);
  const { notify, error: showError } = useGameNotifications();

  const coinPackages: CoinPackage[] = useMemo(() => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const seededRandom = (n: number) => {
      const x = Math.sin(seed + n * 100) * 10000;
      return x - Math.floor(x);
    };

    const saleIndex = Math.floor(seededRandom(77) * 7);
    const salePercent = [10, 15, 20, 25][Math.floor(seededRandom(99) * 4)];

    const packages: CoinPackage[] = [
      { id: 'coins_100k', coins: 100000, upCost: 1, isOnSale: false },
      { id: 'coins_250k', coins: 250000, upCost: 2, isOnSale: false },
      { id: 'coins_500k', coins: 500000, upCost: 4, isOnSale: false },
      { id: 'coins_1m', coins: 1000000, upCost: 8, isOnSale: false },
      { id: 'coins_5m', coins: 5000000, upCost: 35, isOnSale: false },
      { id: 'coins_25m', coins: 25000000, upCost: 150, isOnSale: false },
      { id: 'coins_100m', coins: 100000000, upCost: 500, isOnSale: false },
    ];

    return packages.map((pkg, index) => {
      if (index === saleIndex) {
        const discountedCost = Math.ceil(pkg.upCost * (1 - salePercent / 100));
        return {
          ...pkg,
          isOnSale: true,
          salePercent,
          originalUpCost: pkg.upCost,
          upCost: discountedCost,
        };
      }
      return pkg;
    });
  }, []);

  const handlePurchase = (pkg: CoinPackage) => {
    if (player.universalPoints < pkg.upCost) {
      showError('Not Enough UP', `You need ${pkg.upCost} UP to purchase this package.`);
      return;
    }

    addUniversalPoints(-pkg.upCost);
    addCoins(pkg.coins);
    notify({
      type: 'coin',
      title: 'Coins Purchased!',
      message: `You received ${formatNumber(pkg.coins)} coins for ${pkg.upCost} UP`,
    });
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
          <Coins className="w-6 h-6 text-game-coin" />
          <h2 className="pixel-text text-lg text-foreground">
            Coin Exchange
          </h2>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="pixel-text-sm">Sales reset in {getTimeUntilReset()}</span>
        </div>
      </div>

      <Card className="pixel-border border-card-border mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <PixelIcon icon="universal_point" size="sm" />
                <span className="pixel-text text-sm">{player.universalPoints} UP</span>
              </div>
              <div className="text-muted-foreground">|</div>
              <div className="flex items-center gap-2">
                <PixelIcon icon="coin" size="sm" />
                <span className="pixel-text text-sm">{formatNumber(player.coins)} Coins</span>
              </div>
            </div>
            <p className="font-sans text-xs text-muted-foreground">
              1 UP = 100,000 Coins
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {coinPackages.map((pkg) => (
          <Card 
            key={pkg.id}
            className={cn(
              'pixel-border relative overflow-visible',
              pkg.isOnSale ? 'border-game-coin bg-game-coin/5' : 'border-card-border'
            )}
            data-testid={`coin-package-${pkg.id}`}
          >
            {pkg.isOnSale && (
              <div className="absolute -top-2 -right-2 z-10">
                <Badge className="bg-game-coin text-game-coin-foreground pixel-text-sm text-[8px] gap-1">
                  <Tag className="w-3 h-3" />
                  {pkg.salePercent}% OFF
                </Badge>
              </div>
            )}
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <PixelIcon icon="coin" size="md" />
                <span className="pixel-text text-lg text-game-coin">
                  {formatNumber(pkg.coins)}
                </span>
              </div>
              
              <p className="font-sans text-sm text-muted-foreground mb-4">
                {pkg.coins.toLocaleString()} coins
              </p>

              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-1">
                  <PixelIcon icon="universal_point" size="sm" />
                  <span className={cn(
                    'pixel-text-sm',
                    pkg.isOnSale ? 'text-game-coin' : ''
                  )}>
                    {pkg.upCost} UP
                  </span>
                  {pkg.isOnSale && pkg.originalUpCost && (
                    <span className="pixel-text-sm text-[8px] text-muted-foreground line-through ml-1">
                      {pkg.originalUpCost} UP
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => handlePurchase(pkg)}
                  disabled={player.universalPoints < pkg.upCost}
                  className="pixel-text-sm text-[8px] w-full"
                  data-testid={`button-buy-${pkg.id}`}
                >
                  Purchase
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="pixel-border border-border/50 bg-muted/20">
        <CardContent className="p-4">
          <p className="font-sans text-xs text-muted-foreground text-center">
            Universal Points (UP) can be earned by leveling up. Each level grants 1 UP.
            Use UP to purchase coins or exclusive items from the shop.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
