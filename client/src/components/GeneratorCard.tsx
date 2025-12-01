import { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { GeneratorDefinition, OwnedGenerator, formatNumber, TIER_NUMERALS } from '@/lib/gameTypes';
import { getGeneratorOutput, getGeneratorInterval, getNextTierCost } from '@/lib/generators';
import { PixelIcon } from './PixelIcon';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

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

  const isUnlocked = !!owned;
  const tier = owned?.tier || 1;
  const output = getGeneratorOutput(generator, tier);
  const interval = getGeneratorInterval(generator, tier);
  const nextTierCost = getNextTierCost(generator, tier);
  const canAffordUnlock = coins >= generator.unlockCost;
  const canAffordUpgrade = nextTierCost !== null && coins >= nextTierCost;
  const isMaxTier = tier >= 5;

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

  if (!isUnlocked) {
    return (
      <div 
        className={cn(
          'pixel-border border-border bg-card p-4 flex flex-col items-center',
          'opacity-60 relative overflow-visible'
        )}
        data-testid={`generator-locked-${generator.id}`}
      >
        <div className="absolute -top-2 -right-2 z-10">
          <PixelIcon icon="lock" size="md" />
        </div>
        
        <PixelIcon icon={generator.icon} size="xl" className="mb-3 opacity-50" />
        
        <h3 className="pixel-text-sm text-center text-muted-foreground mb-2">
          {generator.name}
        </h3>
        
        <p className="pixel-text-sm text-center text-muted-foreground/70 mb-4 text-xs leading-relaxed">
          {generator.description}
        </p>
        
        <Button
          onClick={onUnlock}
          disabled={!canAffordUnlock}
          className={cn(
            'w-full pixel-text-sm',
            canAffordUnlock ? 'bg-primary' : 'bg-muted'
          )}
          data-testid={`button-unlock-${generator.id}`}
        >
          <PixelIcon icon="coin" size="sm" className="mr-2" />
          {formatNumber(generator.unlockCost)}
        </Button>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'pixel-border border-primary/50 bg-card p-4 flex flex-col items-center relative',
        isAnimating && 'generator-active'
      )}
      data-testid={`generator-${generator.id}`}
    >
      <div className="absolute -top-2 -right-2 z-10 pixel-border bg-accent px-2 py-1">
        <span className="pixel-text-sm text-accent-foreground">
          {TIER_NUMERALS[tier]}
        </span>
      </div>
      
      <div className={cn(
        'transition-transform duration-200',
        isAnimating && 'scale-110'
      )}>
        <PixelIcon icon={generator.icon} size="xl" className="mb-3" />
      </div>
      
      <h3 className="pixel-text-sm text-center text-foreground mb-1">
        {generator.name}
      </h3>
      
      <div className="pixel-text-sm text-primary text-xs mb-3 tabular-nums">
        +{output} / {(interval / 1000).toFixed(1)}s
      </div>
      
      <div className="w-full mb-3">
        <Progress 
          value={progress} 
          className="h-3 bg-muted"
        />
      </div>
      
      {!isMaxTier ? (
        <Button
          onClick={onUpgrade}
          disabled={!canAffordUpgrade}
          size="sm"
          className={cn(
            'w-full pixel-text-sm',
            canAffordUpgrade ? 'bg-primary' : 'bg-muted'
          )}
          data-testid={`button-upgrade-${generator.id}`}
        >
          <PixelIcon icon="coin" size="sm" className="mr-1" />
          {formatNumber(nextTierCost!)}
          <span className="ml-1 text-xs opacity-75">
            → {TIER_NUMERALS[tier + 1]}
          </span>
        </Button>
      ) : (
        <div className="w-full pixel-border bg-accent/20 border-accent py-2 text-center">
          <span className="pixel-text-sm text-accent-foreground">MAX TIER</span>
        </div>
      )}
    </div>
  );
}
