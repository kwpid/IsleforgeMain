import { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { GeneratorDefinition, OwnedGenerator, formatNumber, TIER_NUMERALS } from '@/lib/gameTypes';
import { getGeneratorOutput, getGeneratorInterval, getNextTierCost } from '@/lib/generators';
import { getItemById } from '@/lib/items';
import { PixelIcon } from './PixelIcon';
import { ItemTooltip } from './ItemTooltip';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ChevronUp, Clock, Zap, Package } from 'lucide-react';

interface GeneratorCardProps {
  generator: GeneratorDefinition;
  owned?: OwnedGenerator;
  onUnlock: () => void;
  onUpgrade: () => void;
}

export function GeneratorCard({ generator, owned, onUnlock, onUpgrade }: GeneratorCardProps) {
  const coins = useGameStore((s) => s.player.coins);
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isUnlocked = !!owned;
  const tier = owned?.tier || 1;
  const output = getGeneratorOutput(generator, tier);
  const interval = getGeneratorInterval(generator, tier);
  const nextTierCost = getNextTierCost(generator, tier);
  const canAffordUnlock = coins >= generator.unlockCost;
  const canAffordUpgrade = nextTierCost !== null && coins >= nextTierCost;
  const isMaxTier = tier >= 5;
  const outputItem = getItemById(generator.outputItemId);

  useEffect(() => {
    if (!owned || !owned.isActive) return;

    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - owned.lastTick;
      const progressPercent = Math.min((elapsed / interval) * 100, 100);
      setProgress(progressPercent);
      
      if (progressPercent >= 100) {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);
      }
    };

    updateProgress();
    const intervalId = setInterval(updateProgress, 100);
    return () => clearInterval(intervalId);
  }, [owned, interval]);

  const handleUpgrade = () => {
    onUpgrade();
  };

  if (!isUnlocked) {
    return (
      <div 
        className={cn(
          'pixel-border border-border bg-card p-3 flex flex-col items-center',
          'opacity-60 relative overflow-visible cursor-pointer hover-elevate active-elevate-2'
        )}
        onClick={() => setIsDialogOpen(true)}
        data-testid={`generator-locked-${generator.id}`}
      >
        <div className="absolute -top-2 -right-2 z-10">
          <PixelIcon icon="lock" size="sm" />
        </div>
        
        <PixelIcon icon={generator.icon} size="lg" className="mb-2 opacity-50" />
        
        <h3 className="pixel-text-sm text-center text-muted-foreground text-[9px]">
          {generator.name}
        </h3>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="pixel-border border-border max-w-sm" onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <PixelIcon icon={generator.icon} size="xl" />
                <div>
                  <DialogTitle className="pixel-text text-sm">
                    {generator.name}
                  </DialogTitle>
                  <DialogDescription className="font-sans">
                    {generator.description}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="pixel-border border-border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="pixel-text-sm text-[8px] text-muted-foreground">Output</span>
                  <div className="flex items-center gap-1">
                    {outputItem && <PixelIcon icon={outputItem.icon} size="sm" />}
                    <span className="pixel-text-sm text-[9px] text-primary">+{output}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="pixel-text-sm text-[8px] text-muted-foreground">Interval</span>
                  <span className="pixel-text-sm text-[9px]">{parseFloat((generator.baseInterval / 1000).toFixed(2))}s</span>
                </div>
              </div>
              
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onUnlock();
                  setIsDialogOpen(false);
                }}
                disabled={!canAffordUnlock}
                className="w-full pixel-text-sm"
                data-testid={`button-unlock-${generator.id}`}
              >
                <PixelIcon icon="coin" size="sm" className="mr-2" />
                Unlock for {formatNumber(generator.unlockCost)}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <>
      <div 
        className={cn(
          'pixel-border border-primary/50 bg-card p-4 flex flex-col items-center relative cursor-pointer',
          'hover-elevate active-elevate-2 overflow-visible',
          'aspect-square min-h-[140px]',
          isAnimating && 'generator-active'
        )}
        onClick={() => setIsDialogOpen(true)}
        data-testid={`generator-${generator.id}`}
      >
        <div className="absolute -top-2 -right-2 z-10 pixel-border bg-accent px-1.5 py-0.5">
          <span className="pixel-text-sm text-[8px] text-accent-foreground">
            {TIER_NUMERALS[tier]}
          </span>
        </div>
        
        <div className={cn(
          'transition-transform duration-200 flex-1 flex items-center justify-center',
          isAnimating && 'scale-110'
        )}>
          <PixelIcon icon={generator.icon} size="xl" />
        </div>
        
        <h3 className="pixel-text-sm text-center text-foreground text-[10px] mb-3 leading-tight">
          {generator.name}
        </h3>
        
        <div className="w-full">
          <Progress 
            value={progress} 
            className="h-2.5 bg-muted"
          />
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="pixel-border border-border max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={cn(
                'pixel-border p-2 bg-muted/30 border-primary/50',
                isAnimating && 'generator-active'
              )}>
                <PixelIcon icon={generator.icon} size="xl" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <DialogTitle className="pixel-text text-sm">
                    {generator.name}
                  </DialogTitle>
                  <Badge className="pixel-text-sm text-[7px]">
                    Tier {TIER_NUMERALS[tier]}
                  </Badge>
                </div>
                <DialogDescription className="font-sans">
                  {generator.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="pixel-border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="pixel-text-sm text-[9px] text-muted-foreground">Output</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        'pixel-border p-1 bg-card',
                        outputItem && `rarity-${outputItem.rarity}`
                      )}>
                        {outputItem && <PixelIcon icon={outputItem.icon} size="sm" />}
                      </div>
                    </TooltipTrigger>
                    {outputItem && (
                      <TooltipContent side="top" className="p-0 border-0 bg-transparent">
                        <ItemTooltip item={outputItem} />
                      </TooltipContent>
                    )}
                  </Tooltip>
                  <span className="pixel-text-sm text-primary tabular-nums">+{output}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="pixel-text-sm text-[9px] text-muted-foreground">Interval</span>
                </div>
                <span className="pixel-text-sm tabular-nums">{parseFloat((interval / 1000).toFixed(2))}s</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                  <span className="pixel-text-sm text-[9px] text-muted-foreground">Rate</span>
                </div>
                <span className="pixel-text-sm text-accent tabular-nums">
                  {parseFloat(((output / (interval / 1000)) * 60).toFixed(2))}/min
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="pixel-text-sm text-[9px] text-muted-foreground">Progress</span>
                <span className="pixel-text-sm text-[9px] tabular-nums">{Math.floor(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3 bg-muted" />
            </div>
            
            {!isMaxTier ? (
              <div className="pixel-border border-border bg-card p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="pixel-text-sm text-[9px]">
                    Upgrade to Tier {TIER_NUMERALS[tier + 1]}
                  </span>
                  <div className="flex items-center gap-1">
                    <ChevronUp className="w-3 h-3 text-primary" />
                    <span className="pixel-text-sm text-[8px] text-primary">
                      +{Math.floor(((getGeneratorOutput(generator, tier + 1) / output) - 1) * 100)}% output
                    </span>
                  </div>
                </div>
                
                <Button
                  onClick={handleUpgrade}
                  disabled={!canAffordUpgrade}
                  className="w-full pixel-text-sm"
                  data-testid={`button-upgrade-${generator.id}`}
                >
                  <PixelIcon icon="coin" size="sm" className="mr-2" />
                  {formatNumber(nextTierCost!)}
                </Button>
              </div>
            ) : (
              <div className="pixel-border bg-accent/20 border-accent py-3 text-center">
                <span className="pixel-text-sm text-accent-foreground">MAX TIER REACHED</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
