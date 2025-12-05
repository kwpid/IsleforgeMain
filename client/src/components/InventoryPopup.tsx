import { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { formatNumber, ArmorSlot } from '@/lib/gameTypes';
import { getItemById, isBoosterItem } from '@/lib/items';
import { PixelIcon } from './PixelIcon';
import { ItemTooltip } from './ItemTooltip';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function InventoryPopup() {
  const inventoryOpen = useGameStore((s) => s.inventoryOpen);
  const toggleInventory = useGameStore((s) => s.toggleInventory);
  const inventory = useGameStore((s) => s.inventory);
  const equipment = useGameStore((s) => s.equipment);
  const equipItem = useGameStore((s) => s.equipItem);
  const unequipItem = useGameStore((s) => s.unequipItem);
  const isEquipmentBroken = useGameStore((s) => s.isEquipmentBroken);

  const [draggedItem, setDraggedItem] = useState<{ itemId: string; source: 'inventory' | 'equipment'; slot?: string } | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        toggleInventory();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleInventory]);

  const handleDragStart = (itemId: string, source: 'inventory' | 'equipment', slot?: string) => {
    setDraggedItem({ itemId, source, slot });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverSlot(null);
  };

  const handleDropOnEquipment = (e: React.DragEvent, targetSlot: string) => {
    e.preventDefault();
    setDragOverSlot(null);

    if (draggedItem && draggedItem.source === 'inventory') {
      equipItem(draggedItem.itemId, targetSlot as any);
    }
  };

  const handleDropOnInventory = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverSlot(null);

    if (draggedItem && draggedItem.source === 'equipment' && draggedItem.slot) {
      unequipItem(draggedItem.slot as any);
    }
  };

  const armorSlots: { slot: ArmorSlot; label: string }[] = [
    { slot: 'helmet', label: 'Helmet' },
    { slot: 'chestplate', label: 'Chestplate' },
    { slot: 'leggings', label: 'Leggings' },
    { slot: 'boots', label: 'Boots' },
  ];

  return (
    <Dialog open={inventoryOpen} onOpenChange={toggleInventory}>
      <DialogContent className="pixel-border border-border bg-popover max-w-3xl p-0 gap-0">
        <DialogHeader className="p-4 border-b-2 border-border bg-muted/20">
          <DialogTitle className="pixel-text text-sm text-center">
            INVENTORY
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[180px_1fr] gap-0 p-5">
          <div className="border-r-2 border-border pr-5">
            <h3 className="pixel-text-sm text-muted-foreground mb-4 text-center text-[10px]">
              EQUIPMENT
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <span className="pixel-text-sm text-[9px] text-muted-foreground">Armor</span>
                <div className="grid grid-cols-2 gap-3">
                  {armorSlots.map(({ slot, label }) => {
                    const itemId = equipment[slot];
                    const item = itemId ? getItemById(itemId) : null;
                    const isDragOver = dragOverSlot === slot;

                    return (
                      <Tooltip key={slot}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'item-slot-compact transition-colors',
                              item && 'item-slot-filled',
                              item && `rarity-${item.rarity}`,
                              item?.isEnchanted && 'enchanted-item',
                              item?.isSpecial && 'special-item',
                              item?.isLimited && item?.limitedEffect === 'blue_flame' && 'blue-flame-item',
                              isDragOver && 'border-primary bg-primary/20',
                              draggedItem?.source === 'equipment' && draggedItem.slot === slot && 'opacity-50'
                            )}
                            draggable={!!item}
                            onDragStart={() => item && handleDragStart(item.id, 'equipment', slot)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => {
                              if (draggedItem?.source === 'inventory') {
                                e.preventDefault();
                                setDragOverSlot(slot);
                              }
                            }}
                            onDragLeave={() => setDragOverSlot(null)}
                            onDrop={(e) => handleDropOnEquipment(e, slot)}
                            data-testid={`equipment-${slot}`}
                          >
                            {item ? (
                              <>
                                <PixelIcon icon={item.icon} size="md" />
                                {item.isLimited && item.limitedEffect === 'blue_flame' && (
                                  <>
                                    <span className="blue-ember-particle" />
                                    <span className="blue-ember-particle" />
                                    <span className="blue-ember-particle" />
                                  </>
                                )}
                              </>
                            ) : (
                              <span className="pixel-text-sm text-[6px] text-muted-foreground/50">
                                {label.charAt(0)}
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        {item && (
                          <TooltipContent side="right" className="p-0 border-0 bg-transparent">
                            <ItemTooltip item={item} />
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <span className="pixel-text-sm text-[9px] text-muted-foreground">Hands</span>
                <div className="grid grid-cols-2 gap-3">
                  {(['mainHand', 'offHand'] as const).map((hand) => {
                    const itemId = equipment[hand];
                    const item = itemId ? getItemById(itemId) : null;
                    const label = hand === 'mainHand' ? 'M' : 'O';
                    const isDragOver = dragOverSlot === hand;
                    const isBroken = isEquipmentBroken(hand);

                    return (
                      <Tooltip key={hand}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'item-slot-compact transition-colors relative',
                              item && 'item-slot-filled',
                              item && `rarity-${item.rarity}`,
                              item?.isEnchanted && 'enchanted-item',
                              item?.isSpecial && 'special-item',
                              item?.isLimited && item?.limitedEffect === 'blue_flame' && 'blue-flame-item',
                              isDragOver && 'border-primary bg-primary/20',
                              draggedItem?.source === 'equipment' && draggedItem.slot === hand && 'opacity-50',
                              isBroken && 'opacity-60 grayscale'
                            )}
                            draggable={!!item}
                            onDragStart={() => item && handleDragStart(item.id, 'equipment', hand)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => {
                              if (draggedItem?.source === 'inventory') {
                                e.preventDefault();
                                setDragOverSlot(hand);
                              }
                            }}
                            onDragLeave={() => setDragOverSlot(null)}
                            onDrop={(e) => handleDropOnEquipment(e, hand)}
                            data-testid={`equipment-${hand}`}
                          >
                            {item ? (
                              <>
                                <PixelIcon icon={item.icon} size="md" />
                                {item.isLimited && item.limitedEffect === 'blue_flame' && !isBroken && (
                                  <>
                                    <span className="blue-ember-particle" />
                                    <span className="blue-ember-particle" />
                                    <span className="blue-ember-particle" />
                                  </>
                                )}
                                {isBroken && (
                                  <div className="absolute -top-1 -right-1 z-10">
                                    <Badge variant="destructive" className="pixel-text-sm text-[5px] px-0.5 py-0 leading-tight">
                                      X
                                    </Badge>
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="pixel-text-sm text-[6px] text-muted-foreground/50">
                                {label}
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        {item && (
                          <TooltipContent side="right" className="p-0 border-0 bg-transparent">
                            <ItemTooltip item={item} isBroken={isBroken} />
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <div className="pixel-border border-primary/30 bg-primary/5 p-2 text-center">
                  <PixelIcon icon="iron_sword" size="md" className="mx-auto mb-1 opacity-30" />
                  <p className="pixel-text-sm text-[6px] text-muted-foreground leading-tight">
                    Dungeons soon!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            className="pl-5"
            onDragOver={(e) => {
              if (draggedItem?.source === 'equipment') {
                e.preventDefault();
              }
            }}
            onDrop={handleDropOnInventory}
          >
            <h3 className="pixel-text-sm text-muted-foreground mb-4 text-center text-[10px]">
              ITEMS ({inventory.items.length}/{inventory.maxSlots})
            </h3>

            <div
              className="grid grid-cols-5 gap-3"
              data-testid="inventory-grid"
            >
              {inventory.items.map((inv) => {
                const item = getItemById(inv.itemId);
                if (!item) return null;

                return (
                  <Tooltip key={inv.itemId}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'item-slot-uniform item-slot-filled hover-elevate cursor-grab active:cursor-grabbing',
                          `rarity-${item.rarity}`,
                          item.isEnchanted && 'enchanted-item',
                          item.isSpecial && 'special-item',
                          item.isLimited && item.limitedEffect === 'blue_flame' && 'blue-flame-item',
                          draggedItem?.itemId === inv.itemId && draggedItem?.source === 'inventory' && 'opacity-50'
                        )}
                        draggable
                        onDragStart={() => handleDragStart(inv.itemId, 'inventory')}
                        onDragEnd={handleDragEnd}
                        data-testid={`inventory-item-${inv.itemId}`}
                      >
                        <PixelIcon icon={item.icon} size="lg" />
                        {item.isLimited && item.limitedEffect === 'blue_flame' && (
                          <>
                            <span className="blue-ember-particle" />
                            <span className="blue-ember-particle" />
                            <span className="blue-ember-particle" />
                            <span className="blue-ember-particle" />
                          </>
                        )}
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
              })}

              {Array.from({ length: Math.max(0, 24 - inventory.items.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="item-slot-uniform" />
              ))}
            </div>

            {inventory.items.length === 0 && (
              <div className="text-center py-4">
                <p className="font-sans text-xs text-muted-foreground">
                  Empty. Get items from dungeons or marketplace.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t-2 border-border p-3 bg-muted/20 text-center">
          <span className="pixel-text-sm text-[8px] text-muted-foreground">
            Press TAB to close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
