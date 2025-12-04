import { useState } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { formatNumber, STORAGE_UPGRADES } from '@/lib/gameTypes';
import { getItemById } from '@/lib/items';
import { PixelIcon } from './PixelIcon';
import { ItemTooltip } from './ItemTooltip';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
import { Package, Backpack } from 'lucide-react';

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
  const moveToInventory = useGameStore((s) => s.moveToInventory);
  const moveToStorage = useGameStore((s) => s.moveToStorage);
  
  const [draggedItem, setDraggedItem] = useState<{ itemId: string; source: DragSource } | null>(null);
  const [isDragOverStorage, setIsDragOverStorage] = useState(false);
  const [isDragOverInventory, setIsDragOverInventory] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('quantity');

  const storageUsed = getStorageUsed();
  const storageProgress = (storageUsed / storage.capacity) * 100;
  const nextUpgrade = STORAGE_UPGRADES.find(u => u.level === storage.upgradeLevel + 1);
  const canUpgrade = nextUpgrade && player.coins >= nextUpgrade.cost;

  const rarityOrder: Record<string, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, limited: 5, mythic: 6 };

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
    setIsDragOverStorage(false);
    setIsDragOverInventory(false);
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

  const sortedStorageItems = sortItems(storage.items);
  const sortedInventoryItems = sortItems(inventory.items);

  const renderItemSlot = (inv: { itemId: string; quantity: number }, source: DragSource) => {
    const item = getItemById(inv.itemId);
    if (!item) return null;

    return (
      <Tooltip key={inv.itemId}>
        <TooltipTrigger asChild>
          <div
            draggable
            onDragStart={() => handleDragStart(inv.itemId, source)}
            onDragEnd={handleDragEnd}
            className={cn(
              'item-slot-lg item-slot-filled cursor-grab hover-elevate active-elevate-2',
              `rarity-${item.rarity}`,
              draggedItem?.itemId === inv.itemId && draggedItem?.source === source && 'opacity-50',
              item.isEnchanted && 'enchanted-item',
              item.isSpecial && 'special-item',
              item.isLimited && item.limitedEffect === 'blue_flame' && 'blue-flame-item'
            )}
            data-testid={`${source}-item-${inv.itemId}`}
          >
            <PixelIcon icon={item.icon} size="lg" />
            {inv.quantity > 1 && (
              <span className="absolute bottom-0 right-0.5 pixel-text-sm text-[7px] text-foreground tabular-nums drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
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
  };

  const renderEmptySlot = (key: string) => (
    <div key={key} className="item-slot-lg" />
  );

  return (
    <div className="animate-content-fade space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="pixel-text text-lg text-foreground">Storage & Inventory</h2>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <p className="pixel-text-sm text-muted-foreground text-[7px] hidden sm:block">
            Drag items between storage and inventory
          </p>
          
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
    </div>
  );
}
