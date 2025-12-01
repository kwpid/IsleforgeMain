import { useEffect } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { formatNumber, ArmorSlot } from '@/lib/gameTypes';
import { getItemById } from '@/lib/items';
import { PixelIcon } from './PixelIcon';
import { ItemTooltip } from './ItemTooltip';
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

export function InventoryPopup() {
  const inventoryOpen = useGameStore((s) => s.inventoryOpen);
  const toggleInventory = useGameStore((s) => s.toggleInventory);
  const inventory = useGameStore((s) => s.inventory);
  const equipment = useGameStore((s) => s.equipment);

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

  const armorSlots: { slot: ArmorSlot; label: string }[] = [
    { slot: 'helmet', label: 'Helmet' },
    { slot: 'chestplate', label: 'Chestplate' },
    { slot: 'leggings', label: 'Leggings' },
    { slot: 'boots', label: 'Boots' },
  ];

  return (
    <Dialog open={inventoryOpen} onOpenChange={toggleInventory}>
      <DialogContent className="pixel-border border-border bg-popover max-w-2xl p-0 gap-0">
        <DialogHeader className="p-3 border-b-2 border-border">
          <DialogTitle className="pixel-text text-sm text-center">
            INVENTORY
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[160px_1fr] gap-0 p-4">
          <div className="border-r-2 border-border pr-4">
            <h3 className="pixel-text-sm text-muted-foreground mb-3 text-center text-[9px]">
              EQUIPMENT
            </h3>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <span className="pixel-text-sm text-[8px] text-muted-foreground">Armor</span>
                <div className="grid grid-cols-2 gap-2">
                  {armorSlots.map(({ slot, label }) => {
                    const itemId = equipment[slot];
                    const item = itemId ? getItemById(itemId) : null;

                    return (
                      <Tooltip key={slot}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'item-slot-compact',
                              item && 'item-slot-filled',
                              item && `rarity-${item.rarity}`
                            )}
                            data-testid={`equipment-${slot}`}
                          >
                            {item ? (
                              <PixelIcon icon={item.icon} size="md" />
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
                <span className="pixel-text-sm text-[8px] text-muted-foreground">Hands</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['mainHand', 'offHand'] as const).map((hand) => {
                    const itemId = equipment[hand];
                    const item = itemId ? getItemById(itemId) : null;
                    const label = hand === 'mainHand' ? 'M' : 'O';

                    return (
                      <Tooltip key={hand}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'item-slot-compact',
                              item && 'item-slot-filled',
                              item && `rarity-${item.rarity}`
                            )}
                            data-testid={`equipment-${hand}`}
                          >
                            {item ? (
                              <PixelIcon icon={item.icon} size="md" />
                            ) : (
                              <span className="pixel-text-sm text-[6px] text-muted-foreground/50">
                                {label}
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

          <div className="pl-4">
            <h3 className="pixel-text-sm text-muted-foreground mb-3 text-center text-[9px]">
              ITEMS ({inventory.items.length}/{inventory.maxSlots})
            </h3>
            
            <div 
              className="grid grid-cols-5 gap-2"
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
                          'item-slot-compact item-slot-filled hover-elevate',
                          `rarity-${item.rarity}`
                        )}
                        data-testid={`inventory-item-${inv.itemId}`}
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
              
              {Array.from({ length: Math.max(0, 24 - inventory.items.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="item-slot-compact" />
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

        <div className="border-t-2 border-border p-2 bg-muted/30 text-center">
          <span className="pixel-text-sm text-[6px] text-muted-foreground">
            Press TAB to close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
