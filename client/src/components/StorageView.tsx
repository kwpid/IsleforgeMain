import { useState } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { formatNumber, STORAGE_UPGRADES } from '@/lib/gameTypes';
import { getItemById, ITEMS } from '@/lib/items';
import { PixelIcon } from './PixelIcon';
import { ItemTooltip } from './ItemTooltip';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, ArrowRightLeft } from 'lucide-react';

type SortOption = 'name' | 'quantity' | 'rarity' | 'value';
type DragSource = 'storage' | 'inventory';

export function StorageView() {
  const storage = useGameStore((s) => s.storage);
  const inventory = useGameStore((s) => s.inventory);
  const player = useGameStore((s) => s.player);
  const getStorageUsed = useGameStore((s) => s.getStorageUsed);
  const upgradeStorage = useGameStore((s) => s.upgradeStorage);
  const sellItem = useGameStore((s) => s.sellItem);
  const sellAllItems = useGameStore((s) => s.sellAllItems);
  const moveToInventory = useGameStore((s) => s.moveToInventory);
  const moveToStorage = useGameStore((s) => s.moveToStorage);
  
  const [sellConfirm, setSellConfirm] = useState<{ itemId: string; quantity: number } | null>(null);
  const [sellAllConfirm, setSellAllConfirm] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ itemId: string; source: DragSource } | null>(null);
  const [isDragOverSell, setIsDragOverSell] = useState(false);
  const [isDragOverStorage, setIsDragOverStorage] = useState(false);
  const [isDragOverInventory, setIsDragOverInventory] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('quantity');

  const storageUsed = getStorageUsed();
  const storageProgress = (storageUsed / storage.capacity) * 100;
  const nextUpgrade = STORAGE_UPGRADES.find(u => u.level === storage.upgradeLevel + 1);
  const canUpgrade = nextUpgrade && player.coins >= nextUpgrade.cost;

  const rarityOrder = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };

  const sortItems = (items: typeof storage.items) => {
    return [...items].sort((a, b) => {
      const itemA = getItemById(a.itemId);
      const itemB = getItemById(b.itemId);
      if (!itemA || !itemB) return 0;
      
      switch (sortBy) {
        case 'name':
          return itemA.name.localeCompare(itemB.name);
        case 'quantity':
          return b.quantity - a.quantity;
        case 'rarity':
          return rarityOrder[itemB.rarity] - rarityOrder[itemA.rarity];
        case 'value':
          return (itemB.sellPrice * b.quantity) - (itemA.sellPrice * a.quantity);
        default:
          return 0;
      }
    });
  };

  const handleDragStart = (itemId: string, source: DragSource) => {
    setDraggedItem({ itemId, source });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setIsDragOverSell(false);
    setIsDragOverStorage(false);
    setIsDragOverInventory(false);
  };

  const handleDropOnSell = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverSell(false);
    
    if (draggedItem && draggedItem.source === 'storage') {
      const item = storage.items.find(i => i.itemId === draggedItem.itemId);
      if (item) {
        setSellConfirm({ itemId: draggedItem.itemId, quantity: item.quantity });
      }
    }
    setDraggedItem(null);
  };

  const handleDropOnStorage = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverStorage(false);
    
    if (draggedItem && draggedItem.source === 'inventory') {
      const item = inventory.items.find(i => i.itemId === draggedItem.itemId);
      if (item) {
        moveToStorage(draggedItem.itemId, item.quantity);
      }
    }
    setDraggedItem(null);
  };

  const handleDropOnInventory = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverInventory(false);
    
    if (draggedItem && draggedItem.source === 'storage') {
      const item = storage.items.find(i => i.itemId === draggedItem.itemId);
      if (item) {
        moveToInventory(draggedItem.itemId, item.quantity);
      }
    }
    setDraggedItem(null);
  };

  const handleConfirmSell = () => {
    if (sellConfirm) {
      sellItem(sellConfirm.itemId, sellConfirm.quantity);
      setSellConfirm(null);
    }
  };

  const handleConfirmSellAll = () => {
    sellAllItems();
    setSellAllConfirm(false);
  };

  const totalValue = storage.items.reduce((sum, inv) => {
    const item = getItemById(inv.itemId);
    return sum + (item ? item.sellPrice * inv.quantity : 0);
  }, 0);

  const sortedStorageItems = sortItems(storage.items);
  const sortedInventoryItems = sortItems(inventory.items);

  return (
    <div className="animate-content-fade">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="pixel-text text-lg text-foreground">Storage & Inventory</h2>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="pixel-text-sm text-muted-foreground text-[8px]">Sort:</span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-24 h-8 pixel-text-sm text-[8px]" data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quantity" data-testid="sort-option-quantity">Qty</SelectItem>
                <SelectItem value="name" data-testid="sort-option-name">Name</SelectItem>
                <SelectItem value="rarity" data-testid="sort-option-rarity">Rarity</SelectItem>
                <SelectItem value="value" data-testid="sort-option-value">Value</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {nextUpgrade && (
            <Button
              onClick={upgradeStorage}
              disabled={!canUpgrade}
              size="sm"
              className="pixel-text-sm text-[8px]"
              data-testid="button-upgrade-storage"
            >
              Upgrade
              <PixelIcon icon="coin" size="sm" className="ml-1" />
              {formatNumber(nextUpgrade.cost)}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_200px] gap-4">
        <div 
          className={cn(
            'pixel-border border-card-border bg-card p-3 transition-all duration-200',
            isDragOverInventory && draggedItem?.source === 'storage' && 'border-primary bg-primary/10'
          )}
          onDragOver={(e) => {
            if (draggedItem?.source === 'storage') {
              e.preventDefault();
              setIsDragOverInventory(true);
            }
          }}
          onDragLeave={() => setIsDragOverInventory(false)}
          onDrop={handleDropOnInventory}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="pixel-text-sm text-muted-foreground text-[8px]">
              INVENTORY ({inventory.items.length}/{inventory.maxSlots})
            </h3>
            <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
          </div>
          
          <div className="grid grid-cols-4 gap-1.5" data-testid="inventory-panel-grid">
            {sortedInventoryItems.map((inv) => {
              const item = getItemById(inv.itemId);
              if (!item) return null;

              return (
                <Tooltip key={inv.itemId}>
                  <TooltipTrigger asChild>
                    <div
                      draggable
                      onDragStart={() => handleDragStart(inv.itemId, 'inventory')}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'item-slot-compact item-slot-filled cursor-grab hover-elevate active-elevate-2',
                        `rarity-${item.rarity}`,
                        draggedItem?.itemId === inv.itemId && draggedItem?.source === 'inventory' && 'opacity-50'
                      )}
                      data-testid={`inventory-panel-item-${inv.itemId}`}
                    >
                      <PixelIcon icon={item.icon} size="md" />
                      {inv.quantity > 1 && (
                        <span className="absolute bottom-0 right-0.5 pixel-text-sm text-[6px] text-foreground tabular-nums">
                          {formatNumber(inv.quantity)}
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
            
            {Array.from({ length: Math.max(0, 12 - inventory.items.length) }).map((_, i) => (
              <div key={`empty-inv-${i}`} className="item-slot-compact" />
            ))}
          </div>

          {inventory.items.length === 0 && (
            <p className="text-center py-2 font-sans text-xs text-muted-foreground">
              Drag items here from storage
            </p>
          )}
        </div>

        <div 
          className={cn(
            'pixel-border border-card-border bg-card p-3 transition-all duration-200',
            isDragOverStorage && draggedItem?.source === 'inventory' && 'border-primary bg-primary/10'
          )}
          onDragOver={(e) => {
            if (draggedItem?.source === 'inventory') {
              e.preventDefault();
              setIsDragOverStorage(true);
            }
          }}
          onDragLeave={() => setIsDragOverStorage(false)}
          onDrop={handleDropOnStorage}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="pixel-text-sm text-muted-foreground text-[8px]">
              STORAGE
            </h3>
            <div className="flex items-center gap-2">
              <span className="pixel-text-sm text-muted-foreground text-[6px]">
                {formatNumber(storageUsed)}/{formatNumber(storage.capacity)}
              </span>
              <Progress value={storageProgress} className="w-16 h-1.5" />
            </div>
          </div>
          
          <div 
            className="grid grid-cols-4 gap-1.5"
            data-testid="storage-grid"
          >
            {sortedStorageItems.map((inv) => {
              const item = getItemById(inv.itemId);
              if (!item) return null;

              return (
                <Tooltip key={inv.itemId}>
                  <TooltipTrigger asChild>
                    <div
                      draggable
                      onDragStart={() => handleDragStart(inv.itemId, 'storage')}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'item-slot-compact item-slot-filled cursor-grab hover-elevate active-elevate-2',
                        `rarity-${item.rarity}`,
                        draggedItem?.itemId === inv.itemId && draggedItem?.source === 'storage' && 'opacity-50'
                      )}
                      data-testid={`storage-item-${inv.itemId}`}
                    >
                      <PixelIcon icon={item.icon} size="md" />
                      {inv.quantity > 1 && (
                        <span className="absolute bottom-0 right-0.5 pixel-text-sm text-[6px] text-foreground tabular-nums">
                          {formatNumber(inv.quantity)}
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
            
            {Array.from({ length: Math.max(0, 12 - storage.items.length) }).map((_, i) => (
              <div key={`empty-storage-${i}`} className="item-slot-compact" />
            ))}
          </div>

          {storage.items.length === 0 && (
            <p className="text-center py-2 font-sans text-xs text-muted-foreground">
              Generators fill this automatically
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div
            onDragOver={(e) => {
              if (draggedItem?.source === 'storage') {
                e.preventDefault();
                setIsDragOverSell(true);
              }
            }}
            onDragLeave={() => setIsDragOverSell(false)}
            onDrop={handleDropOnSell}
            className={cn(
              'pixel-border-thick border-dashed min-h-28 flex flex-col items-center justify-center gap-2 p-3 transition-all duration-200',
              isDragOverSell
                ? 'border-primary bg-primary/20'
                : 'border-border bg-muted/30'
            )}
            data-testid="sell-zone"
          >
            <PixelIcon icon="coin" size="lg" className={cn(isDragOverSell && 'animate-bounce')} />
            <p className="pixel-text-sm text-center text-muted-foreground text-[7px]">
              Drag to sell
            </p>
          </div>

          {storage.items.length > 0 && (
            <div className="pixel-border border-border bg-card p-3">
              <div className="flex justify-between items-center mb-3">
                <span className="pixel-text-sm text-muted-foreground text-[7px]">Total</span>
                <div className="flex items-center gap-1">
                  <PixelIcon icon="coin" size="sm" />
                  <span className="pixel-text-sm text-game-coin tabular-nums text-[9px]">
                    {formatNumber(totalValue)}
                  </span>
                </div>
              </div>
              
              <Button
                onClick={() => setSellAllConfirm(true)}
                variant="destructive"
                size="sm"
                className="w-full pixel-text-sm text-[8px]"
                data-testid="button-sell-all"
              >
                Sell All
              </Button>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!sellConfirm} onOpenChange={() => setSellConfirm(null)}>
        <AlertDialogContent className="pixel-border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="pixel-text">Confirm Sale</AlertDialogTitle>
            <AlertDialogDescription className="font-sans">
              {sellConfirm && (() => {
                const item = getItemById(sellConfirm.itemId);
                if (!item) return null;
                const total = item.sellPrice * sellConfirm.quantity;
                return (
                  <span>
                    Sell {formatNumber(sellConfirm.quantity)}x {item.name} for{' '}
                    <span className="text-game-coin">{formatNumber(total)}</span> coins?
                  </span>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="pixel-text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmSell} 
              className="pixel-text-sm bg-primary"
              data-testid="button-confirm-sell"
            >
              Sell
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={sellAllConfirm} onOpenChange={setSellAllConfirm}>
        <AlertDialogContent className="pixel-border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="pixel-text">Sell All Items</AlertDialogTitle>
            <AlertDialogDescription className="font-sans">
              Are you sure you want to sell all items for{' '}
              <span className="text-game-coin">{formatNumber(totalValue)}</span> coins?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="pixel-text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmSellAll} 
              className="pixel-text-sm bg-destructive"
              data-testid="button-confirm-sell-all"
            >
              Sell All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
