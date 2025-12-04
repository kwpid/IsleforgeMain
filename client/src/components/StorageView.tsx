import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { formatNumber, STORAGE_UNIT_PURCHASE_COST, MAX_STORAGE_UNITS, ItemType, Rarity, ItemDefinition } from '@/lib/gameTypes';
import { getItemById } from '@/lib/items';
import { PixelIcon } from './PixelIcon';
import { ItemTooltip } from './ItemTooltip';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Package, Backpack, Plus, Search, Filter, Pencil, X, Check, ArrowUp, ArrowDown } from 'lucide-react';

type SortOption = 'name' | 'quantity' | 'rarity' | 'value';
type DragSource = 'storage' | 'inventory';
type FilterType = 'all' | ItemType;
type FilterRarity = 'all' | Rarity;

const GRID_GAP = 'gap-2';
const GRID_COLS = 'grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-16';

const ITEM_TYPES: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'block', label: 'Blocks' },
  { value: 'mineral', label: 'Minerals' },
  { value: 'material', label: 'Materials' },
  { value: 'food', label: 'Food' },
  { value: 'tool', label: 'Tools' },
  { value: 'armor', label: 'Armor' },
  { value: 'potion', label: 'Potions' },
  { value: 'seed', label: 'Seeds' },
  { value: 'crop', label: 'Crops' },
];

const RARITIES: { value: FilterRarity; label: string }[] = [
  { value: 'all', label: 'All Rarities' },
  { value: 'common', label: 'Common' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'rare', label: 'Rare' },
  { value: 'epic', label: 'Epic' },
  { value: 'legendary', label: 'Legendary' },
  { value: 'limited', label: 'Limited' },
  { value: 'mythic', label: 'Mythic' },
];

export function StorageView() {
  const storageSystem = useGameStore((s) => s.storageSystem);
  const inventory = useGameStore((s) => s.inventory);
  const player = useGameStore((s) => s.player);
  const purchaseStorageUnit = useGameStore((s) => s.purchaseStorageUnit);
  const renameStorageUnit = useGameStore((s) => s.renameStorageUnit);
  const selectStorageUnit = useGameStore((s) => s.selectStorageUnit);
  const moveFromStorageUnitToInventory = useGameStore((s) => s.moveFromStorageUnitToInventory);
  const moveFromInventoryToStorageUnit = useGameStore((s) => s.moveFromInventoryToStorageUnit);
  const getStorageUnitUsed = useGameStore((s) => s.getStorageUnitUsed);
  
  const [draggedItem, setDraggedItem] = useState<{ itemId: string; source: DragSource; unitId?: string } | null>(null);
  const [isDragOverStorage, setIsDragOverStorage] = useState(false);
  const [isDragOverInventory, setIsDragOverInventory] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('quantity');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [touchedItem, setTouchedItem] = useState<{ item: ItemDefinition; quantity: number } | null>(null);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();
  
  const [selectedItem, setSelectedItem] = useState<{ itemId: string; source: DragSource; unitId?: string; item: ItemDefinition; quantity: number } | null>(null);
  
  const [touchDrag, setTouchDrag] = useState<{
    item: ItemDefinition;
    quantity: number;
    source: DragSource;
    unitId?: string;
    startY: number;
    currentY: number;
    isDragging: boolean;
  } | null>(null);
  const storageContainerRef = useRef<HTMLDivElement>(null);
  const inventoryContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = useCallback((item: ItemDefinition, quantity: number) => {
    if (!isMobile) return;
    touchTimerRef.current = setTimeout(() => {
      setTouchedItem({ item, quantity });
    }, 300);
  }, [isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  }, []);

  const currentUnit = storageSystem.units.find(u => u.id === storageSystem.selectedUnitId);

  const handleItemClick = useCallback((itemId: string, source: DragSource, item: ItemDefinition, quantity: number, unitId?: string) => {
    if (!isMobile) return;
    
    if (selectedItem?.itemId === itemId && selectedItem?.source === source) {
      setSelectedItem(null);
    } else {
      setSelectedItem({ itemId, source, unitId, item, quantity });
    }
  }, [isMobile, selectedItem]);

  const handleMoveToInventory = useCallback(() => {
    if (!selectedItem || selectedItem.source !== 'storage' || !selectedItem.unitId) return;
    
    moveFromStorageUnitToInventory(selectedItem.unitId, selectedItem.itemId, selectedItem.quantity);
    setSelectedItem(null);
  }, [selectedItem, moveFromStorageUnitToInventory]);

  const handleMoveToStorage = useCallback(() => {
    if (!selectedItem || selectedItem.source !== 'inventory' || !currentUnit) return;
    
    moveFromInventoryToStorageUnit(currentUnit.id, selectedItem.itemId, selectedItem.quantity);
    setSelectedItem(null);
  }, [selectedItem, currentUnit, moveFromInventoryToStorageUnit]);

  const handleCancelSelection = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const handleTouchDragStart = useCallback((
    e: React.TouchEvent,
    item: ItemDefinition, 
    quantity: number, 
    source: DragSource, 
    itemId: string,
    unitId?: string
  ) => {
    if (!isMobile) return;
    
    const touch = e.touches[0];
    setTouchDrag({
      item,
      quantity,
      source,
      unitId,
      startY: touch.clientY,
      currentY: touch.clientY,
      isDragging: false,
    });
    
    setSelectedItem({ itemId, source, unitId, item, quantity });
  }, [isMobile]);

  const handleTouchDragMove = useCallback((e: React.TouchEvent) => {
    if (!touchDrag || !isMobile) return;
    
    const touch = e.touches[0];
    const deltaY = Math.abs(touch.clientY - touchDrag.startY);
    
    if (deltaY > 10 && !touchDrag.isDragging) {
      setTouchDrag(prev => prev ? { ...prev, isDragging: true, currentY: touch.clientY } : null);
    } else if (touchDrag.isDragging) {
      setTouchDrag(prev => prev ? { ...prev, currentY: touch.clientY } : null);
      
      const viewportHeight = window.innerHeight;
      const edgeThreshold = 80;
      const scrollSpeed = 5;
      
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      
      if (touch.clientY < edgeThreshold) {
        scrollIntervalRef.current = setInterval(() => {
          window.scrollBy(0, -scrollSpeed);
        }, 16);
      } else if (touch.clientY > viewportHeight - edgeThreshold) {
        scrollIntervalRef.current = setInterval(() => {
          window.scrollBy(0, scrollSpeed);
        }, 16);
      }
      
      const storageEl = storageContainerRef.current;
      const inventoryEl = inventoryContainerRef.current;
      
      let overStorage = false;
      let overInventory = false;
      
      if (storageEl) {
        const rect = storageEl.getBoundingClientRect();
        overStorage = touch.clientX >= rect.left && touch.clientX <= rect.right &&
                      touch.clientY >= rect.top && touch.clientY <= rect.bottom;
      }
      
      if (inventoryEl) {
        const rect = inventoryEl.getBoundingClientRect();
        overInventory = touch.clientX >= rect.left && touch.clientX <= rect.right &&
                        touch.clientY >= rect.top && touch.clientY <= rect.bottom;
      }
      
      setIsDragOverStorage(overStorage && touchDrag.source === 'inventory');
      setIsDragOverInventory(overInventory && touchDrag.source === 'storage');
    }
  }, [touchDrag, isMobile]);

  const handleTouchDragEnd = useCallback((e?: React.TouchEvent) => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    
    if (touchDrag?.isDragging && selectedItem && e?.changedTouches?.[0]) {
      const touch = e.changedTouches[0];
      const storageEl = storageContainerRef.current;
      const inventoryEl = inventoryContainerRef.current;
      
      if (storageEl && selectedItem.source === 'inventory') {
        const rect = storageEl.getBoundingClientRect();
        const isOverStorage = touch.clientX >= rect.left && touch.clientX <= rect.right &&
                              touch.clientY >= rect.top && touch.clientY <= rect.bottom;
        if (isOverStorage && currentUnit) {
          moveFromInventoryToStorageUnit(currentUnit.id, selectedItem.itemId, selectedItem.quantity);
          setSelectedItem(null);
        }
      }
      
      if (inventoryEl && selectedItem.source === 'storage' && selectedItem.unitId) {
        const rect = inventoryEl.getBoundingClientRect();
        const isOverInventory = touch.clientX >= rect.left && touch.clientX <= rect.right &&
                                touch.clientY >= rect.top && touch.clientY <= rect.bottom;
        if (isOverInventory) {
          moveFromStorageUnitToInventory(selectedItem.unitId, selectedItem.itemId, selectedItem.quantity);
          setSelectedItem(null);
        }
      }
    }
    
    setIsDragOverStorage(false);
    setIsDragOverInventory(false);
    setTouchDrag(null);
  }, [touchDrag, selectedItem, currentUnit, moveFromInventoryToStorageUnit, moveFromStorageUnitToInventory]);

  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);

  const storageUsed = currentUnit ? getStorageUnitUsed(currentUnit.id) : 0;
  const storageProgress = currentUnit ? (storageUsed / currentUnit.maxSlots) * 100 : 0;
  const canPurchaseMore = storageSystem.units.length < MAX_STORAGE_UNITS;
  const canAffordNewUnit = player.coins >= STORAGE_UNIT_PURCHASE_COST;

  const rarityOrder: Record<string, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, limited: 5, mythic: 6 };

  const filterAndSortItems = (items: typeof inventory.items) => {
    let filtered = items.filter(inv => {
      const item = getItemById(inv.itemId);
      if (!item) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!item.name.toLowerCase().includes(query) && !item.id.toLowerCase().includes(query)) {
          return false;
        }
      }

      if (filterType !== 'all' && item.type !== filterType) {
        return false;
      }

      if (filterRarity !== 'all' && item.rarity !== filterRarity) {
        return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
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

  const sortedStorageItems = useMemo(() => 
    currentUnit ? filterAndSortItems(currentUnit.items) : [],
    [currentUnit?.items, searchQuery, filterType, filterRarity, sortBy]
  );

  const sortedInventoryItems = useMemo(() => 
    filterAndSortItems(inventory.items),
    [inventory.items, searchQuery, filterType, filterRarity, sortBy]
  );

  const handleDragStart = (itemId: string, source: DragSource, unitId?: string) => {
    setDraggedItem({ itemId, source, unitId });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setIsDragOverStorage(false);
    setIsDragOverInventory(false);
  };

  const handleDropOnStorage = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverStorage(false);
    
    if (draggedItem && draggedItem.source === 'inventory' && currentUnit) {
      const item = inventory.items.find(i => i.itemId === draggedItem.itemId);
      if (item) {
        moveFromInventoryToStorageUnit(currentUnit.id, draggedItem.itemId, item.quantity);
      }
    }
    setDraggedItem(null);
  };

  const handleDropOnInventory = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverInventory(false);
    
    if (draggedItem && draggedItem.source === 'storage' && draggedItem.unitId) {
      const unit = storageSystem.units.find(u => u.id === draggedItem.unitId);
      if (unit) {
        const item = unit.items.find(i => i.itemId === draggedItem.itemId);
        if (item) {
          moveFromStorageUnitToInventory(draggedItem.unitId, draggedItem.itemId, item.quantity);
        }
      }
    }
    setDraggedItem(null);
  };

  const handleStartRename = () => {
    if (currentUnit) {
      setRenameValue(currentUnit.name);
      setIsRenaming(true);
    }
  };

  const handleSaveRename = () => {
    if (currentUnit && renameValue.trim()) {
      renameStorageUnit(currentUnit.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleCancelRename = () => {
    setIsRenaming(false);
    setRenameValue('');
  };

  const handlePurchaseUnit = () => {
    if (purchaseStorageUnit()) {
      setShowPurchaseDialog(false);
    }
  };

  const renderItemSlot = (inv: { itemId: string; quantity: number }, source: DragSource, unitId?: string) => {
    const item = getItemById(inv.itemId);
    if (!item) return null;

    const isSelected = selectedItem?.itemId === inv.itemId && selectedItem?.source === source;

    const slotContent = (
      <div
        draggable={!isMobile}
        onDragStart={() => handleDragStart(inv.itemId, source, unitId)}
        onDragEnd={handleDragEnd}
        onTouchStart={(e) => {
          handleTouchStart(item, inv.quantity);
          handleTouchDragStart(e, item, inv.quantity, source, inv.itemId, unitId);
        }}
        onTouchEnd={(e) => {
          handleTouchEnd();
          handleTouchDragEnd(e);
        }}
        onTouchMove={(e) => {
          handleTouchMove();
          handleTouchDragMove(e);
        }}
        onClick={() => handleItemClick(inv.itemId, source, item, inv.quantity, unitId)}
        className={cn(
          'item-slot item-slot-filled hover-elevate active-elevate-2',
          isMobile ? 'cursor-pointer' : 'cursor-grab',
          `rarity-${item.rarity}`,
          draggedItem?.itemId === inv.itemId && draggedItem?.source === source && 'opacity-50',
          item.isEnchanted && 'enchanted-item',
          item.isSpecial && 'special-item',
          item.isLimited && item.limitedEffect === 'blue_flame' && 'blue-flame-item',
          isSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-background scale-110 z-10',
          touchDrag?.isDragging && touchDrag?.item.id === item.id && 'opacity-50'
        )}
        data-testid={`${source}-item-${inv.itemId}`}
      >
        <PixelIcon icon={item.icon} size="md" />
        {item.isLimited && item.limitedEffect === 'blue_flame' && (
          <>
            <span className="blue-ember-particle" />
            <span className="blue-ember-particle" />
            <span className="blue-ember-particle" />
            <span className="blue-ember-particle" />
          </>
        )}
        {inv.quantity > 1 && (
          <span className="absolute bottom-0 right-0.5 pixel-text-sm text-[6px] text-foreground tabular-nums drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
            {formatNumber(inv.quantity)}
          </span>
        )}
      </div>
    );

    if (isMobile) {
      return <div key={inv.itemId}>{slotContent}</div>;
    }

    return (
      <Tooltip key={inv.itemId}>
        <TooltipTrigger asChild>
          {slotContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="p-0 border-0 bg-transparent">
          <ItemTooltip item={item} quantity={inv.quantity} />
        </TooltipContent>
      </Tooltip>
    );
  };

  const renderEmptySlot = (key: string) => (
    <div key={key} className="item-slot" />
  );

  const hasActiveFilters = searchQuery || filterType !== 'all' || filterRarity !== 'all';

  return (
    <div className="animate-content-fade space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="pixel-text text-lg text-foreground">Storage Units</h2>
        
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-40 pl-7 pixel-text-sm text-[8px]"
              data-testid="input-search-items"
            />
            {searchQuery && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5"
                onClick={() => setSearchQuery('')}
                data-testid="button-clear-search"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
          
          <Button
            size="sm"
            variant={showFilters || hasActiveFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="pixel-text-sm text-[8px]"
            data-testid="button-toggle-filters"
          >
            <Filter className="w-3 h-3 mr-1" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 w-4 h-4 rounded-full bg-primary-foreground text-primary text-[7px] flex items-center justify-center">
                {(filterType !== 'all' ? 1 : 0) + (filterRarity !== 'all' ? 1 : 0)}
              </span>
            )}
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="pixel-text-sm text-muted-foreground text-[8px]">Sort:</span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-20 h-8 pixel-text-sm text-[8px]" data-testid="select-sort">
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
        </div>
      </div>

      {showFilters && (
        <div className="flex items-center gap-3 flex-wrap p-3 pixel-border border-card-border bg-card/50">
          <div className="flex items-center gap-2">
            <span className="pixel-text-sm text-muted-foreground text-[8px]">Type:</span>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
              <SelectTrigger className="w-28 h-8 pixel-text-sm text-[8px]" data-testid="select-filter-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEM_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value} data-testid={`filter-type-${type.value}`}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="pixel-text-sm text-muted-foreground text-[8px]">Rarity:</span>
            <Select value={filterRarity} onValueChange={(v) => setFilterRarity(v as FilterRarity)}>
              <SelectTrigger className="w-28 h-8 pixel-text-sm text-[8px]" data-testid="select-filter-rarity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RARITIES.map(rarity => (
                  <SelectItem key={rarity.value} value={rarity.value} data-testid={`filter-rarity-${rarity.value}`}>
                    {rarity.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setFilterRarity('all');
              }}
              className="pixel-text-sm text-[8px]"
              data-testid="button-clear-filters"
            >
              <X className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {storageSystem.units.map((unit) => (
          <Button
            key={unit.id}
            size="sm"
            variant={unit.id === storageSystem.selectedUnitId ? 'default' : 'outline'}
            onClick={() => selectStorageUnit(unit.id)}
            className="pixel-text-sm text-[8px]"
            data-testid={`button-storage-unit-${unit.id}`}
          >
            <Package className="w-3 h-3 mr-1" />
            {unit.name}
            <span className="ml-1 text-muted-foreground">
              ({formatNumber(getStorageUnitUsed(unit.id))}/{unit.maxSlots})
            </span>
          </Button>
        ))}
        
        {canPurchaseMore && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPurchaseDialog(true)}
            disabled={!canAffordNewUnit}
            className="pixel-text-sm text-[8px]"
            data-testid="button-purchase-storage-unit"
          >
            <Plus className="w-3 h-3 mr-1" />
            New Unit
            <PixelIcon icon="coin" size="sm" className="ml-1" />
            {formatNumber(STORAGE_UNIT_PURCHASE_COST)}
          </Button>
        )}
      </div>

      {isMobile && selectedItem && !touchDrag?.isDragging && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-card pixel-border border-primary shadow-lg animate-content-fade">
          <div className="flex items-center gap-2 px-2">
            <PixelIcon icon={selectedItem.item.icon} size="sm" />
            <span className="pixel-text-sm text-[8px] text-foreground">{selectedItem.item.name}</span>
            <span className="pixel-text-sm text-[7px] text-muted-foreground">x{selectedItem.quantity}</span>
          </div>
          {selectedItem.source === 'storage' ? (
            <Button 
              size="sm" 
              onClick={handleMoveToInventory}
              className="pixel-text-sm text-[8px]"
              data-testid="button-move-to-inventory"
            >
              <Backpack className="w-3 h-3 mr-1" />
              To Inventory
            </Button>
          ) : (
            <Button 
              size="sm" 
              onClick={handleMoveToStorage}
              className="pixel-text-sm text-[8px]"
              data-testid="button-move-to-storage"
            >
              <Package className="w-3 h-3 mr-1" />
              To Storage
            </Button>
          )}
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={handleCancelSelection}
            data-testid="button-cancel-selection"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {isMobile && touchDrag?.isDragging && (
        <div className="fixed left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1 pointer-events-none animate-content-fade"
          style={{ top: touchDrag.currentY - 60 }}
        >
          <div className="flex items-center gap-2 p-2 bg-card/90 pixel-border border-primary shadow-lg backdrop-blur-sm">
            <PixelIcon icon={touchDrag.item.icon} size="md" />
            <div className="flex flex-col">
              <span className="pixel-text-sm text-[8px] text-foreground">{touchDrag.item.name}</span>
              <span className="pixel-text-sm text-[7px] text-muted-foreground">x{touchDrag.quantity}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <ArrowUp className="w-3 h-3 animate-bounce" />
            <span className="pixel-text-sm text-[7px]">Scroll to edge</span>
            <ArrowDown className="w-3 h-3 animate-bounce" />
          </div>
        </div>
      )}

      <div 
        ref={storageContainerRef}
        className={cn(
          'pixel-border border-card-border bg-card p-4 transition-all duration-200',
          isDragOverStorage && (draggedItem?.source === 'inventory' || (isMobile && touchDrag?.source === 'inventory')) && 'border-primary bg-primary/10',
          isMobile && selectedItem?.source === 'inventory' && !touchDrag?.isDragging && 'border-primary/50 cursor-pointer'
        )}
        onDragOver={(e) => {
          if (draggedItem?.source === 'inventory') {
            e.preventDefault();
            setIsDragOverStorage(true);
          }
        }}
        onDragLeave={() => setIsDragOverStorage(false)}
        onDrop={handleDropOnStorage}
        onClick={() => {
          if (isMobile && selectedItem?.source === 'inventory' && !touchDrag?.isDragging) {
            handleMoveToStorage();
          }
        }}
      >
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Package className="w-4 h-4 text-primary shrink-0" />
            {isRenaming ? (
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename();
                    if (e.key === 'Escape') handleCancelRename();
                  }}
                  className="h-7 w-32 pixel-text-sm text-[9px]"
                  autoFocus
                  data-testid="input-rename-storage"
                />
                <Button size="icon" variant="ghost" onClick={handleSaveRename} className="h-6 w-6" data-testid="button-save-rename">
                  <Check className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="ghost" onClick={handleCancelRename} className="h-6 w-6" data-testid="button-cancel-rename">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <h3 className="pixel-text-sm text-foreground text-[10px] truncate">
                  {currentUnit?.name || 'Storage'}
                </h3>
                <Button size="icon" variant="ghost" onClick={handleStartRename} className="h-6 w-6 shrink-0" data-testid="button-rename-storage">
                  <Pencil className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="pixel-text-sm text-muted-foreground text-[8px]">
              {formatNumber(storageUsed)}/{currentUnit?.maxSlots || 128}
            </span>
            <Progress value={storageProgress} className="w-24 h-2" />
          </div>
        </div>
        
        <div 
          className={cn('grid', GRID_COLS, GRID_GAP)}
          data-testid="storage-grid"
        >
          {sortedStorageItems.map((inv) => renderItemSlot(inv, 'storage', currentUnit?.id))}
          {Array.from({ length: Math.max(0, Math.min(48, (currentUnit?.maxSlots || 128) - sortedStorageItems.length)) }).map((_, i) => 
            renderEmptySlot(`empty-storage-${i}`)
          )}
        </div>

        {currentUnit && currentUnit.items.length === 0 && (
          <p className="text-center py-4 font-sans text-sm text-muted-foreground">
            Generators fill this automatically
          </p>
        )}

        {hasActiveFilters && sortedStorageItems.length === 0 && currentUnit && currentUnit.items.length > 0 && (
          <p className="text-center py-4 font-sans text-sm text-muted-foreground">
            No items match your search/filter criteria
          </p>
        )}
      </div>

      <div 
        ref={inventoryContainerRef}
        className={cn(
          'pixel-border border-card-border bg-card p-4 transition-all duration-200',
          isDragOverInventory && (draggedItem?.source === 'storage' || (isMobile && touchDrag?.source === 'storage')) && 'border-accent bg-accent/10',
          isMobile && selectedItem?.source === 'storage' && !touchDrag?.isDragging && 'border-accent/50 cursor-pointer'
        )}
        onDragOver={(e) => {
          if (draggedItem?.source === 'storage') {
            e.preventDefault();
            setIsDragOverInventory(true);
          }
        }}
        onDragLeave={() => setIsDragOverInventory(false)}
        onDrop={handleDropOnInventory}
        onClick={() => {
          if (isMobile && selectedItem?.source === 'storage' && !touchDrag?.isDragging) {
            handleMoveToInventory();
          }
        }}
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
          {Array.from({ length: Math.max(0, Math.min(24, inventory.maxSlots - sortedInventoryItems.length)) }).map((_, i) => 
            renderEmptySlot(`empty-inv-${i}`)
          )}
        </div>

        {inventory.items.length === 0 && (
          <p className="text-center py-4 font-sans text-sm text-muted-foreground">
            {isMobile ? 'Tap items in storage to move here' : 'Drag items here from storage'}
          </p>
        )}

        {hasActiveFilters && sortedInventoryItems.length === 0 && inventory.items.length > 0 && (
          <p className="text-center py-4 font-sans text-sm text-muted-foreground">
            No items match your search/filter criteria
          </p>
        )}
      </div>

      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="pixel-border border-border bg-popover max-w-sm">
          <DialogHeader>
            <DialogTitle className="pixel-text text-sm">Purchase Storage Unit</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="font-sans text-sm text-muted-foreground">
              Purchase a new storage unit with {currentUnit?.maxSlots || 128} slots?
            </p>
            <div className="flex items-center justify-between p-3 pixel-border border-card-border bg-card">
              <span className="pixel-text-sm text-[9px]">Cost:</span>
              <div className="flex items-center gap-1">
                <PixelIcon icon="coin" size="sm" />
                <span className="pixel-text-sm text-[10px]">{formatNumber(STORAGE_UNIT_PURCHASE_COST)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 pixel-border border-card-border bg-card">
              <span className="pixel-text-sm text-[9px]">Your Coins:</span>
              <div className="flex items-center gap-1">
                <PixelIcon icon="coin" size="sm" />
                <span className={cn('pixel-text-sm text-[10px]', !canAffordNewUnit && 'text-destructive')}>
                  {formatNumber(player.coins)}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurchaseDialog(false)} data-testid="button-cancel-purchase">
              Cancel
            </Button>
            <Button onClick={handlePurchaseUnit} disabled={!canAffordNewUnit} data-testid="button-confirm-purchase">
              Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {touchedItem && (
        <Dialog open={!!touchedItem} onOpenChange={() => setTouchedItem(null)}>
          <DialogContent className="p-0 border-0 bg-transparent max-w-[280px] w-auto">
            <ItemTooltip item={touchedItem.item} quantity={touchedItem.quantity} />
          </DialogContent>
        </Dialog>
      )}

      <p className="pixel-text-sm text-muted-foreground text-[7px] text-center">
        {isMobile ? 'Tap and hold items to see details' : 'Drag items between storage and inventory'}
      </p>
    </div>
  );
}
