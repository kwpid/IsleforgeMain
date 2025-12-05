import React from 'react';
import { ItemDefinition, getRarityColor, formatNumber } from '@/lib/gameTypes';
import { PixelIcon } from './PixelIcon';
import { cn } from '@/lib/utils';
import { Sparkles, Wand2, TrendingUp, Zap } from 'lucide-react';
import { getBoosterById, getBoosterDisplayStats, formatBoosterDuration, isBoosterItem } from '@/lib/items';
import { useGameStore } from '@/lib/gameStore';
import { useGameNotifications } from '@/hooks/useGameNotifications';
import { Button } from '@/components/ui/button';

interface ItemTooltipProps {
  item: ItemDefinition;
  quantity?: number;
  className?: string;
  isBroken?: boolean;
  onUseBooster?: () => void;
}

export function ItemTooltip({ item, quantity, className, isBroken, onUseBooster }: ItemTooltipProps) {
  const booster = isBoosterItem(item.id) ? getBoosterById(item.id) : null;
  const useBooster = useGameStore((s) => s.useBooster);
  const { success, warning } = useGameNotifications();
  const [isUsing, setIsUsing] = React.useState(false);
  
  const handleUseBooster = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!booster || isUsing) return;
    
    setIsUsing(true);
    try {
      const used = useBooster(item.id);
      if (used) {
        success('Booster Activated!', `${booster.name} is now active for ${formatBoosterDuration(booster.duration)}`);
        onUseBooster?.();
      } else {
        warning('Cannot Use', 'Unable to activate booster');
      }
    } finally {
      // Reset after a short delay to prevent rapid clicking
      setTimeout(() => setIsUsing(false), 500);
    }
  }, [booster, isUsing, useBooster, item.id, success, warning, onUseBooster]);
  const rarityLabels: Record<string, string> = {
    common: 'COMMON',
    uncommon: 'UNCOMMON',
    rare: 'RARE',
    epic: 'EPIC',
    legendary: 'LEGENDARY',
    limited: 'LIMITED',
    mythic: 'MYTHIC',
  };

  const typeLabels: Record<string, string> = {
    block: 'Block',
    mineral: 'Mineral',
    material: 'Material',
    food: 'Food',
    tool: 'Tool',
    armor: 'Armor',
    potion: 'Potion',
  };

  const getLimitedValue = () => {
    return Math.ceil(item.sellPrice / 10);
  };

  const formatUP = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  return (
    <div 
      className={cn(
        'pixel-border border-border bg-popover p-3 min-w-48 z-50',
        booster ? 'max-w-80' : 'max-w-64',
        item.isEnchanted && 'enchanted-item',
        className
      )}
    >
      <div className="flex items-start gap-3 mb-2">
        <div className={cn(
          'relative',
          item.isSpecial && 'special-item'
        )}>
          <PixelIcon icon={item.icon} size="lg" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h4 className={cn('pixel-text-sm', getRarityColor(item.rarity))}>
              {item.name}
            </h4>
            {item.isEnchanted && (
              <Wand2 className="w-3 h-3 text-purple-400" />
            )}
          </div>
          <div className={cn(
            'pixel-text-sm text-xs mt-0.5 flex items-center gap-1',
            `rarity-${item.rarity}`,
            getRarityColor(item.rarity)
          )}>
            {rarityLabels[item.rarity]}
            {item.isSpecial && (
              <Sparkles className="w-3 h-3 text-yellow-400" />
            )}
          </div>
        </div>
      </div>

      {item.isLimited && (
        <div className="flex items-center justify-between mb-2 p-2 bg-game-up/10 border border-game-up/30 rounded-sm">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-game-up" />
            <span className="pixel-text-sm text-[9px] text-game-up">VALUE</span>
          </div>
          <div className="flex items-center gap-1">
            <PixelIcon icon="universal_point" size="sm" />
            <span className="pixel-text-sm text-game-up">U${formatUP(getLimitedValue())}</span>
          </div>
        </div>
      )}

      <div className="border-t border-border pt-2 mb-2">
        <p className="text-sm text-muted-foreground leading-relaxed font-sans">
          {item.description}
        </p>
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground font-sans">Type:</span>
          <span className="pixel-text-sm">{typeLabels[item.type]}</span>
        </div>

        {booster && (
          <div className="border-t border-border pt-2 mt-2 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-sans text-xs">Duration:</span>
              <span className="pixel-text-sm text-primary">{formatBoosterDuration(booster.duration)}</span>
            </div>
            <div>
              <p className="text-muted-foreground font-sans text-xs mb-1.5">Effects:</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                {getBoosterDisplayStats(booster).map((stat, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                    <span className="pixel-text-sm text-[9px] text-primary leading-tight">{stat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!booster && item.stats && Object.entries(item.stats).length > 0 && (
          <div className="border-t border-border pt-2 mt-2 space-y-1">
            {Object.entries(item.stats).map(([stat, value]) => (
              <div key={stat} className="flex justify-between items-center">
                <span className="text-muted-foreground font-sans capitalize">
                  {stat.replace(/_/g, ' ')}:
                </span>
                <span className="pixel-text-sm text-primary">+{value}</span>
              </div>
            ))}
          </div>
        )}

        {quantity !== undefined && quantity > 1 && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-sans">Quantity:</span>
            <span className="pixel-text-sm tabular-nums">{formatNumber(quantity)}</span>
          </div>
        )}

        {!item.isLimited && (
          <div className="flex justify-between items-center border-t border-border pt-2 mt-2">
            <span className="text-muted-foreground font-sans">Sell Price:</span>
            <div className="flex items-center gap-1">
              <PixelIcon icon="coin" size="sm" />
              <span className="pixel-text-sm text-game-coin tabular-nums">
                {formatNumber(item.sellPrice)}
              </span>
            </div>
          </div>
        )}

        {isBroken && (
          <div className="border-t border-destructive/50 pt-2 mt-2">
            <div className="pixel-border border-destructive/50 bg-destructive/10 p-2 text-center">
              <span className="pixel-text-sm text-[9px] text-destructive">BROKEN - Needs Repair</span>
            </div>
          </div>
        )}

        {booster && (
          <div className="border-t border-yellow-500/50 pt-2 mt-2">
            <Button
              onClick={handleUseBooster}
              disabled={isUsing}
              className="w-full pixel-text-sm bg-yellow-500 hover:bg-yellow-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              size="sm"
            >
              <Zap className="w-4 h-4 mr-1" />
              {isUsing ? 'USING...' : 'USE'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
