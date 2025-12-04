import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PixelIcon } from './PixelIcon';
import { ItemDefinition } from '@/lib/gameTypes';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Check, Sparkles, Flame } from 'lucide-react';
import { create } from 'zustand';

interface AcquiredItem {
  item: ItemDefinition;
  quantity: number;
  source: 'purchase' | 'earned' | 'crafted' | 'found' | 'reward';
}

interface ItemAcquisitionStore {
  items: AcquiredItem[];
  isOpen: boolean;
  currentIndex: number;
  addItems: (items: AcquiredItem[]) => void;
  nextItem: () => void;
  prevItem: () => void;
  closeAll: () => void;
  closeCurrent: () => void;
}

export const useItemAcquisitionStore = create<ItemAcquisitionStore>((set, get) => ({
  items: [],
  isOpen: false,
  currentIndex: 0,
  addItems: (newItems) => {
    const state = get();
    const existingItems = [...state.items];
    const startIndex = existingItems.length;
    
    newItems.forEach(newItem => {
      const existingIndex = existingItems.findIndex(
        existing => existing.item.id === newItem.item.id && existing.source === newItem.source
      );
      
      if (existingIndex !== -1 && newItem.item.stackable) {
        existingItems[existingIndex] = {
          ...existingItems[existingIndex],
          quantity: existingItems[existingIndex].quantity + newItem.quantity
        };
      } else {
        existingItems.push(newItem);
      }
    });
    
    set({ 
      items: existingItems,
      isOpen: true,
      currentIndex: state.isOpen ? state.currentIndex : startIndex
    });
  },
  nextItem: () => {
    const state = get();
    if (state.currentIndex < state.items.length - 1) {
      set({ currentIndex: state.currentIndex + 1 });
    }
  },
  prevItem: () => {
    const state = get();
    if (state.currentIndex > 0) {
      set({ currentIndex: state.currentIndex - 1 });
    }
  },
  closeAll: () => {
    set({ items: [], isOpen: false, currentIndex: 0 });
  },
  closeCurrent: () => {
    const state = get();
    if (state.items.length <= 1) {
      set({ items: [], isOpen: false, currentIndex: 0 });
    } else {
      const newItems = state.items.filter((_, i) => i !== state.currentIndex);
      const newIndex = Math.min(state.currentIndex, newItems.length - 1);
      set({ items: newItems, currentIndex: newIndex });
    }
  },
}));

function getSourceLabel(source: AcquiredItem['source']): string {
  switch (source) {
    case 'purchase': return 'Purchased';
    case 'earned': return 'Earned';
    case 'crafted': return 'Crafted';
    case 'found': return 'Found';
    case 'reward': return 'Reward';
    default: return 'Acquired';
  }
}

function getLimitedEffectClass(item: ItemDefinition): string {
  if (!item.isLimited || !item.limitedEffect) return '';
  
  switch (item.limitedEffect) {
    case 'blue_flame':
      return 'blue-flame-item';
    default:
      return '';
  }
}

export function ItemAcquisitionPopup() {
  const { items, isOpen, currentIndex, nextItem, prevItem, closeAll, closeCurrent } = useItemAcquisitionStore();
  
  const currentItem = items[currentIndex];
  const hasMultiple = items.length > 1;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === items.length - 1;
  
  if (!currentItem) return null;

  const { item, quantity, source } = currentItem;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeAll()}>
      <DialogContent className="pixel-border bg-card max-w-md p-0 gap-0">
        <DialogHeader className="p-4 border-b-2 border-border bg-gradient-to-r from-primary/10 to-transparent">
          <DialogTitle className="pixel-text text-sm text-center flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-rarity-legendary" />
            {getSourceLabel(source)}!
            <Sparkles className="w-4 h-4 text-rarity-legendary" />
          </DialogTitle>
          <DialogDescription className="sr-only">
            You received a new item
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 flex flex-col items-center">
          <div 
            className={cn(
              "w-24 h-24 flex items-center justify-center pixel-border rounded-sm mb-4",
              `bg-rarity-${item.rarity}/20 border-rarity-${item.rarity}`,
              item.isEnchanted && "enchanted-item",
              item.isSpecial && "special-item",
              getLimitedEffectClass(item)
            )}
          >
            <PixelIcon icon={item.icon} size="xl" />
          </div>

          <div className="text-center space-y-2 mb-4">
            <h3 className={cn(
              'pixel-text text-lg',
              `text-rarity-${item.rarity}`
            )}>
              {item.name}
            </h3>
            
            {quantity > 1 && (
              <p className="pixel-text text-foreground">
                x{quantity}
              </p>
            )}

            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="outline" className="pixel-text-sm text-[8px]">
                {item.rarity.toUpperCase()}
              </Badge>
              {item.isEnchanted && (
                <Badge className="bg-purple-500/80 text-white pixel-text-sm text-[8px] gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  Enchanted
                </Badge>
              )}
              {item.isLimited && (
                <Badge className="limited-badge text-white pixel-text-sm text-[8px] gap-0.5">
                  <Flame className="w-2.5 h-2.5" />
                  Limited
                </Badge>
              )}
            </div>

            <p className="font-sans text-sm text-muted-foreground max-w-xs mx-auto">
              {item.description}
            </p>
          </div>

          {hasMultiple && (
            <div className="flex items-center justify-center gap-4 mb-4">
              <Button
                size="icon"
                variant="outline"
                onClick={prevItem}
                disabled={isFirst}
                data-testid="button-prev-item"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <span className="pixel-text-sm text-muted-foreground">
                {currentIndex + 1} / {items.length}
              </span>
              
              <Button
                size="icon"
                variant="outline"
                onClick={nextItem}
                disabled={isLast}
                data-testid="button-next-item"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="p-4 border-t-2 border-border bg-muted/20 flex items-center justify-center gap-3">
          {hasMultiple ? (
            <>
              <Button
                variant="outline"
                onClick={closeCurrent}
                className="pixel-text-sm"
                data-testid="button-ok-single"
              >
                <Check className="w-4 h-4 mr-1" />
                OK
              </Button>
              <Button
                onClick={closeAll}
                className="pixel-text-sm"
                data-testid="button-ok-all"
              >
                <Check className="w-4 h-4 mr-1" />
                OK TO ALL
              </Button>
            </>
          ) : (
            <Button
              onClick={closeAll}
              className="pixel-text-sm"
              data-testid="button-ok"
            >
              <Check className="w-4 h-4 mr-1" />
              OK
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
