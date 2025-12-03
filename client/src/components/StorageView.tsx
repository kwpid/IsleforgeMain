import { useState, useMemo } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { formatNumber, STORAGE_UPGRADES } from '@/lib/gameTypes';
import { getItemById } from '@/lib/items';
import { PixelIcon } from './PixelIcon';
import { ItemTooltip } from './ItemTooltip';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Package, Backpack, Check, X, ShoppingCart } from 'lucide-react';

type SortOption = 'name' | 'quantity' | 'rarity' | 'value';
type DragSource = 'storage' | 'inventory';

const GRID_GAP = 'gap-3';
const GRID_COLS = 'grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9';

export function StorageView() {
  const storage = useGameStore((s) => s.storage);
  const inventory = useGameStore((s) => s.inventory);
  const player = useGameStore((s) => s.player);
  const getStorageUsed = useGameStore((s) => s.getStorageUsed);
  const upgradeStorage = useGameStore((s) => s.upgradeStorage);
  const sellItem = useGameStore((s) => s.sellItem);
  const sellAllItems = useGameStore((s) => s.sellAllItems);
  const bulkSellItems = useGameStore((s) => s.bulkSellItems);
  const moveToInventory = useGameStore((s) => s.moveToInventory);
  const moveToStorage = useGameStore((s) => s.moveToStorage);
  
  const [sellConfirm, setSellConfirm] = useState<{ itemId: string; quantity: number } | null>(null);
  const [sellAllConfirm, setSellAllConfirm] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ itemId: string; source: DragSource } | null>(null);
  const [isDragOverSell, setIsDragOverSell] = useState(false);
  const [isDragOverStorage, setIsDragOverStorage] = useState(false);
  const [isDragOverInventory, setIsDragOverInventory] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('quantity');
  
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map());
  const [bulkSellOpen, setBulkSellOpen] = useState(false);
  const [bulkQuantities, setBulkQuantities] = useState<Map<string, number>>(new Map());

  const storageUsed = getStorageUsed();
  const storageProgress = (storageUsed / storage.capacity) * 100;
  const nextUpgrade = STORAGE_UPGRADES.find(u => u.level === storage.upgradeLevel + 1);
  const canUpgrade = nextUpgrade && player.coins >= nextUpgrade.cost;

  const rarityOrder: Record<string, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };

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
          return (rarityOrder[itemB.rarity] ?? 0) - (rarityOrder[itemA.rarity] ?? 0);
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
  
  const selectedValue = useMemo(() => {
    let total = 0;
    selectedItems.forEach((_, itemId) => {
      const item = getItemById(itemId);
      const storageItem = storage.items.find(i => i.itemId === itemId);
      const qty = bulkQuantities.get(itemId) ?? storageItem?.quantity ?? 0;
      if (item) {
        total += item.sellPrice * qty;
      }
    });
    return total;
  }, [selectedItems, bulkQuantities, storage.items]);
  
  const handleItemClick = (e: React.MouseEvent, itemId: string, quantity: number) => {
    if (e.shiftKey) {
      e.preventDefault();
      if (!isSelectionMode) {
        setIsSelectionMode(true);
      }
      
      const newSelected = new Map(selectedItems);
      const newQuantities = new Map(bulkQuantities);
      
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
        newQuantities.delete(itemId);
      } else {
        newSelected.set(itemId, quantity);
        newQuantities.set(itemId, quantity);
      }
      
      setSelectedItems(newSelected);
      setBulkQuantities(newQuantities);
      
      if (newSelected.size === 0) {
        setIsSelectionMode(false);
      }
    }
  };
  
  const handleSelectAll = () => {
    const newSelected = new Map<string, number>();
    const newQuantities = new Map<string, number>();
    
    storage.items.forEach(inv => {
      newSelected.set(inv.itemId, inv.quantity);
      newQuantities.set(inv.itemId, inv.quantity);
    });
    
    setSelectedItems(newSelected);
    setBulkQuantities(newQuantities);
    setIsSelectionMode(true);
  };
  
  const handleClearSelection = () => {
    setSelectedItems(new Map());
    setBulkQuantities(new Map());
    setIsSelectionMode(false);
  };
  
  const handleBulkQuantityChange = (itemId: string, quantity: number) => {
    const maxQty = storage.items.find(i => i.itemId === itemId)?.quantity ?? 0;
    const clampedQty = Math.max(1, Math.min(quantity, maxQty));
    
    const newQuantities = new Map(bulkQuantities);
    newQuantities.set(itemId, clampedQty);
    setBulkQuantities(newQuantities);
  };
  
  const handleBulkSell = () => {
    const itemsToSell: { itemId: string; quantity: number }[] = [];
    
    selectedItems.forEach((_, itemId) => {
      const qty = bulkQuantities.get(itemId) ?? 0;
      if (qty > 0) {
        itemsToSell.push({ itemId, quantity: qty });
      }
    });
    
    if (itemsToSell.length > 0) {
      bulkSellItems(itemsToSell);
    }
    
    setBulkSellOpen(false);
    handleClearSelection();
  };

  const sortedStorageItems = sortItems(storage.items);
  const sortedInventoryItems = sortItems(inventory.items);

  const renderItemSlot = (inv: { itemId: string; quantity: number }, source: DragSource) => {
    const item = getItemById(inv.itemId);
    if (!item) return null;
    
    const isSelected = source === 'storage' && selectedItems.has(inv.itemId);

    return (
      <Tooltip key={inv.itemId}>
        <TooltipTrigger asChild>
          <div
            draggable={!isSelectionMode}
            onDragStart={() => !isSelectionMode && handleDragStart(inv.itemId, source)}
            onDragEnd={handleDragEnd}
            onClick={(e) => source === 'storage' && handleItemClick(e, inv.itemId, inv.quantity)}
            className={cn(
              'item-slot-lg item-slot-filled cursor-grab hover-elevate active-elevate-2',
              `rarity-${item.rarity}`,
              draggedItem?.itemId === inv.itemId && draggedItem?.source === source && 'opacity-50',
              isSelected && 'ring-2 ring-primary ring-offset-1',
              item.isEnchanted && 'enchanted-item',
              item.isSpecial && 'special-item'
            )}
            data-testid={`${source}-item-${inv.itemId}`}
          >
            <PixelIcon icon={item.icon} size="lg" />
            {inv.quantity > 1 && (
              <span className="absolute bottom-0 right-0.5 pixel-text-sm text-[7px] text-foreground tabular-nums drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                {formatNumber(inv.quantity)}
              </span>
            )}
            {isSelected && (
              <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5 z-10">
                <Check className="w-2.5 h-2.5 text-primary-foreground" />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="p-0 border-0 bg-transparent">
          <ItemTooltip item={item} quantity={inv.quantity} />
        </TooltipContent>
      </Tooltip>
    );
  };

  const renderEmptySlot = (key: string) => (
    <div key={key} className="item-slot-lg" />
  );

  return (
    <div className="animate-content-fade space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="pixel-text text-lg text-foreground">Storage & Inventory</h2>
          {isSelectionMode && (
            <Badge variant="secondary" className="pixel-text-sm text-[8px]">
              {selectedItems.size} selected
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {isSelectionMode ? (
            <>
              <Button
                onClick={() => setBulkSellOpen(true)}
                size="sm"
                className="pixel-text-sm text-[8px]"
                data-testid="button-bulk-sell"
              >
                <ShoppingCart className="w-3 h-3 mr-1" />
                Sell Selected
              </Button>
              <Button
                onClick={handleClearSelection}
                variant="outline"
                size="sm"
                className="pixel-text-sm text-[8px]"
                data-testid="button-clear-selection"
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </>
          ) : (
            <>
              <p className="pixel-text-sm text-muted-foreground text-[7px] hidden sm:block">
                Shift+Click to bulk select
              </p>
              <Button
                onClick={handleSelectAll}
                variant="outline"
                size="sm"
                className="pixel-text-sm text-[8px]"
                disabled={storage.items.length === 0}
                data-testid="button-select-all"
              >
                Select All
              </Button>
            </>
          )}
          
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

      <div 
        className={cn(
          'pixel-border border-card-border bg-card p-4 transition-all duration-200',
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <h3 className="pixel-text-sm text-foreground text-[10px]">
              STORAGE
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="pixel-text-sm text-muted-foreground text-[8px]">
              {formatNumber(storageUsed)}/{formatNumber(storage.capacity)}
            </span>
            <Progress value={storageProgress} className="w-24 h-2" />
          </div>
        </div>
        
        <div 
          className={cn('grid', GRID_COLS, GRID_GAP)}
          data-testid="storage-grid"
        >
          {sortedStorageItems.map((inv) => renderItemSlot(inv, 'storage'))}
          {Array.from({ length: Math.max(0, 24 - storage.items.length) }).map((_, i) => 
            renderEmptySlot(`empty-storage-${i}`)
          )}
        </div>

        {storage.items.length === 0 && (
          <p className="text-center py-4 font-sans text-sm text-muted-foreground">
            Generators fill this automatically
          </p>
        )}

        {storage.items.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="pixel-text-sm text-muted-foreground text-[8px]">Total Value:</span>
              <div className="flex items-center gap-1">
                <PixelIcon icon="coin" size="sm" />
                <span className="pixel-text-sm text-game-coin tabular-nums">
                  {formatNumber(totalValue)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
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
                  'pixel-border border-dashed px-4 py-2 flex items-center gap-2 transition-all duration-200',
                  isDragOverSell
                    ? 'border-primary bg-primary/20'
                    : 'border-border bg-muted/30'
                )}
                data-testid="sell-zone"
              >
                <PixelIcon icon="coin" size="sm" className={cn(isDragOverSell && 'animate-bounce')} />
                <span className="pixel-text-sm text-muted-foreground text-[7px]">
                  Drop to sell
                </span>
              </div>
              
              <Button
                onClick={() => setSellAllConfirm(true)}
                variant="destructive"
                size="sm"
                className="pixel-text-sm text-[8px]"
                data-testid="button-sell-all"
              >
                Sell All
              </Button>
            </div>
          </div>
        )}
      </div>

      <div 
        className={cn(
          'pixel-border border-card-border bg-card p-4 transition-all duration-200',
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Backpack className="w-4 h-4 text-accent" />
            <h3 className="pixel-text-sm text-foreground text-[10px]">
              INVENTORY
            </h3>
          </div>
          <span className="pixel-text-sm text-muted-foreground text-[8px]">
            {inventory.items.length}/{inventory.maxSlots} slots
          </span>
        </div>
        
        <div className={cn('grid', GRID_COLS, GRID_GAP)} data-testid="inventory-panel-grid">
          {sortedInventoryItems.map((inv) => renderItemSlot(inv, 'inventory'))}
          {Array.from({ length: Math.max(0, 24 - inventory.items.length) }).map((_, i) => 
            renderEmptySlot(`empty-inv-${i}`)
          )}
        </div>

        {inventory.items.length === 0 && (
          <p className="text-center py-4 font-sans text-sm text-muted-foreground">
            Drag items here from storage
          </p>
        )}
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
      
      <Dialog open={bulkSellOpen} onOpenChange={setBulkSellOpen}>
        <DialogContent className="pixel-border border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="pixel-text text-sm">Bulk Sell</DialogTitle>
            <DialogDescription className="font-sans">
              Adjust quantities for each item. Total value:{' '}
              <span className="text-game-coin font-semibold">{formatNumber(selectedValue)}</span> coins
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-pixel pr-2">
            {Array.from(selectedItems.keys()).map((itemId) => {
              const item = getItemById(itemId);
              const storageItem = storage.items.find(i => i.itemId === itemId);
              if (!item || !storageItem) return null;
              
              const qty = bulkQuantities.get(itemId) ?? storageItem.quantity;
              const itemValue = item.sellPrice * qty;
              
              return (
                <div 
                  key={itemId}
                  className="flex items-center justify-between gap-3 pixel-border border-border bg-muted/20 p-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <PixelIcon icon={item.icon} size="sm" />
                    <div className="min-w-0">
                      <p className="pixel-text-sm text-[9px] truncate">{item.name}</p>
                      <p className="pixel-text-sm text-[7px] text-muted-foreground">
                        {item.sellPrice} each
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleBulkQuantityChange(itemId, qty - 1)}
                        disabled={qty <= 1}
                        data-testid={`button-decrease-${itemId}`}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        value={qty}
                        onChange={(e) => handleBulkQuantityChange(itemId, parseInt(e.target.value) || 1)}
                        className="w-16 h-6 text-center pixel-text-sm text-[9px]"
                        min={1}
                        max={storageItem.quantity}
                        data-testid={`input-quantity-${itemId}`}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleBulkQuantityChange(itemId, qty + 1)}
                        disabled={qty >= storageItem.quantity}
                        data-testid={`button-increase-${itemId}`}
                      >
                        +
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-1 min-w-[60px] justify-end">
                      <PixelIcon icon="coin" size="sm" />
                      <span className="pixel-text-sm text-[8px] text-game-coin tabular-nums">
                        {formatNumber(itemValue)}
                      </span>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        const newSelected = new Map(selectedItems);
                        const newQuantities = new Map(bulkQuantities);
                        newSelected.delete(itemId);
                        newQuantities.delete(itemId);
                        setSelectedItems(newSelected);
                        setBulkQuantities(newQuantities);
                        if (newSelected.size === 0) {
                          setBulkSellOpen(false);
                          setIsSelectionMode(false);
                        }
                      }}
                      data-testid={`button-remove-${itemId}`}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setBulkSellOpen(false)}
              className="pixel-text-sm text-[9px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkSell}
              className="pixel-text-sm text-[9px]"
              data-testid="button-confirm-bulk-sell"
            >
              Sell for {formatNumber(selectedValue)} coins
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
