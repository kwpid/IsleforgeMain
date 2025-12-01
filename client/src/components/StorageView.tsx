import { useState } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { formatNumber, STORAGE_UPGRADES } from '@/lib/gameTypes';
import { getItemById } from '@/lib/items';
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
import { cn } from '@/lib/utils';

export function StorageView() {
  const storage = useGameStore((s) => s.storage);
  const player = useGameStore((s) => s.player);
  const getStorageUsed = useGameStore((s) => s.getStorageUsed);
  const upgradeStorage = useGameStore((s) => s.upgradeStorage);
  const sellItem = useGameStore((s) => s.sellItem);
  const sellAllItems = useGameStore((s) => s.sellAllItems);
  
  const [sellConfirm, setSellConfirm] = useState<{ itemId: string; quantity: number } | null>(null);
  const [sellAllConfirm, setSellAllConfirm] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const storageUsed = getStorageUsed();
  const storageProgress = (storageUsed / storage.capacity) * 100;
  const nextUpgrade = STORAGE_UPGRADES.find(u => u.level === storage.upgradeLevel + 1);
  const canUpgrade = nextUpgrade && player.coins >= nextUpgrade.cost;

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (draggedItem) {
      const item = storage.items.find(i => i.itemId === draggedItem);
      if (item) {
        setSellConfirm({ itemId: draggedItem, quantity: item.quantity });
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

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="pixel-text text-lg text-foreground">Storage</h2>
        
        <div className="flex items-center gap-4">
          <div className="pixel-border border-border bg-card px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="pixel-text-sm text-muted-foreground">
                {formatNumber(storageUsed)} / {formatNumber(storage.capacity)}
              </span>
              <Progress value={storageProgress} className="w-24 h-2" />
            </div>
          </div>
          
          {nextUpgrade && (
            <Button
              onClick={upgradeStorage}
              disabled={!canUpgrade}
              className="pixel-text-sm"
              data-testid="button-upgrade-storage"
            >
              Upgrade
              <PixelIcon icon="coin" size="sm" className="ml-2" />
              {formatNumber(nextUpgrade.cost)}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div 
            className="grid grid-cols-8 gap-2"
            data-testid="storage-grid"
          >
            {storage.items.map((inv) => {
              const item = getItemById(inv.itemId);
              if (!item) return null;

              return (
                <Tooltip key={inv.itemId}>
                  <TooltipTrigger asChild>
                    <div
                      draggable
                      onDragStart={() => handleDragStart(inv.itemId)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'item-slot item-slot-filled cursor-grab hover-elevate active-elevate-2',
                        `rarity-${item.rarity}`,
                        draggedItem === inv.itemId && 'opacity-50'
                      )}
                      data-testid={`storage-item-${inv.itemId}`}
                    >
                      <PixelIcon icon={item.icon} size="lg" />
                      {inv.quantity > 1 && (
                        <span className="absolute bottom-0 right-1 pixel-text-sm text-xs text-foreground tabular-nums">
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
            
            {Array.from({ length: Math.max(0, 24 - storage.items.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="item-slot" />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'pixel-border-thick border-dashed min-h-40 flex flex-col items-center justify-center gap-4 p-6 transition-all duration-200',
              isDragOver
                ? 'border-primary bg-primary/20'
                : 'border-border bg-muted/30'
            )}
            data-testid="sell-zone"
          >
            <PixelIcon icon="coin" size="xl" className={cn(isDragOver && 'animate-bounce')} />
            <p className="pixel-text-sm text-center text-muted-foreground">
              Drag items here to sell
            </p>
          </div>

          {storage.items.length > 0 && (
            <div className="pixel-border border-border bg-card p-4">
              <div className="flex justify-between items-center mb-4">
                <span className="pixel-text-sm text-muted-foreground">Total Value</span>
                <div className="flex items-center gap-1">
                  <PixelIcon icon="coin" size="sm" />
                  <span className="pixel-text text-game-coin tabular-nums">
                    {formatNumber(totalValue)}
                  </span>
                </div>
              </div>
              
              <Button
                onClick={() => setSellAllConfirm(true)}
                variant="destructive"
                className="w-full pixel-text-sm"
                data-testid="button-sell-all"
              >
                Sell All Items
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
