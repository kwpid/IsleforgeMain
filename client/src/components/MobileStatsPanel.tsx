import { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/lib/gameStore';
import { formatNumber, createDefaultSkillStats } from '@/lib/gameTypes';
import { PixelIcon } from './PixelIcon';
import { Progress } from '@/components/ui/progress';
import { Pickaxe, Leaf, Skull } from 'lucide-react';

interface MobileStatsPanelProps {
  className?: string;
}

function MiniStatCard({ icon, label, value, highlight }: { 
  icon: string; 
  label: string; 
  value: string; 
  highlight?: 'gold' | 'purple' | 'green';
}) {
  const highlightClasses = {
    gold: 'text-game-coin',
    purple: 'text-game-up',
    green: 'text-game-xp',
  };

  return (
    <div className="flex items-center gap-2 bg-card/50 px-2 py-1.5 rounded pixel-border border-card-border">
      <PixelIcon icon={icon} size="sm" />
      <div className="min-w-0">
        <div className="pixel-text-sm text-[6px] text-muted-foreground">{label}</div>
        <div className={cn(
          'pixel-text text-[10px] tabular-nums',
          highlight ? highlightClasses[highlight] : 'text-foreground'
        )}>
          {value}
        </div>
      </div>
    </div>
  );
}

function MiniSkillCard({ icon, label, level, progress, color, progressColor }: { 
  icon: React.ReactNode;
  label: string;
  level: number;
  progress: number;
  color: string;
  progressColor: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-card/50 px-2 py-1.5 rounded pixel-border border-card-border min-w-0">
      <div className={cn("flex-shrink-0", color)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="pixel-text-sm text-[6px] text-muted-foreground">{label}</span>
          <span className={cn("pixel-text text-[8px] tabular-nums", color)}>
            Lv. {level}
          </span>
        </div>
        <Progress 
          value={progress} 
          className="h-1 bg-muted mt-0.5"
          indicatorClassName={progressColor}
        />
      </div>
    </div>
  );
}

export function MobileStatsPanel({ className }: MobileStatsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  
  const player = useGameStore((s) => s.player);
  const mainTab = useGameStore((s) => s.mainTab);
  const islandSubTab = useGameStore((s) => s.islandSubTab);
  const storage = useGameStore((s) => s.storage);
  const getStorageUsed = useGameStore((s) => s.getStorageUsed);
  const generators = useGameStore((s) => s.generators);

  const xpProgress = (player.xp / player.xpToNextLevel) * 100;
  const storageUsed = getStorageUsed();
  const storageProgress = (storageUsed / storage.capacity) * 100;

  const miningSkill = player.miningSkill || createDefaultSkillStats();
  const farmingSkill = player.farmingSkill || createDefaultSkillStats();
  const dungeonSkill = player.dungeonSkill || createDefaultSkillStats();

  const miningProgress = (miningSkill.xp / miningSkill.xpToNextLevel) * 100;
  const farmingProgress = (farmingSkill.xp / farmingSkill.xpToNextLevel) * 100;
  const dungeonProgress = (dungeonSkill.xp / dungeonSkill.xpToNextLevel) * 100;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed left-1/2 -translate-x-1/2 z-40 md:hidden',
          'flex items-center justify-center gap-1',
          'px-4 py-1.5 bg-card border-2 border-primary rounded-t-lg',
          'text-primary hover-elevate active-elevate-2',
          'transition-all duration-200',
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100',
          className
        )}
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
        data-testid="button-open-stats-panel"
        aria-label="Open player stats"
      >
        <ChevronUp className="w-4 h-4" />
        <span className="pixel-text-sm text-[8px]">Stats</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        ref={panelRef}
        className={cn(
          'fixed left-0 right-0 z-50 md:hidden',
          'bg-sidebar border-t-4 border-primary rounded-t-2xl',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{ 
          bottom: 0,
          maxHeight: '70vh',
        }}
      >
        <div 
          className="flex items-center justify-center py-2 cursor-pointer"
          onClick={() => setIsOpen(false)}
        >
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 pb-2 border-b border-border">
          <span className="pixel-text-sm text-primary">PLAYER STATS</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover-elevate active-elevate-2 text-muted-foreground hover:text-foreground"
            data-testid="button-close-stats-panel"
            aria-label="Close stats panel"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div 
          className="overflow-y-auto scrollbar-pixel p-4 space-y-4"
          style={{ 
            maxHeight: 'calc(70vh - 5rem)',
            paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))'
          }}
        >
          <div>
            <h3 className="pixel-text-sm text-[8px] text-muted-foreground mb-2">MAIN STATS</h3>
            <div className="grid grid-cols-3 gap-2">
              <MiniStatCard 
                icon="xp" 
                label="Level" 
                value={player.level.toString()}
                highlight="green"
              />
              <MiniStatCard 
                icon="coin" 
                label="Coins" 
                value={formatNumber(player.coins)}
                highlight="gold"
              />
              <MiniStatCard 
                icon="up" 
                label="UP" 
                value={`U$${player.universalPoints}`}
                highlight="purple"
              />
            </div>
            <div className="mt-2 px-1">
              <div className="flex items-center justify-between text-[7px] pixel-text-sm text-muted-foreground mb-1">
                <span>XP Progress</span>
                <span>{formatNumber(player.xp)} / {formatNumber(player.xpToNextLevel)}</span>
              </div>
              <Progress 
                value={xpProgress} 
                className="h-1.5 bg-muted"
                indicatorClassName="bg-game-xp"
              />
            </div>
          </div>

          <div>
            <h3 className="pixel-text-sm text-[8px] text-muted-foreground mb-2">SKILLS</h3>
            <div className="grid grid-cols-1 gap-2">
              <MiniSkillCard
                icon={<Pickaxe className="w-3 h-3" />}
                label="Mining"
                level={miningSkill.level}
                progress={miningProgress}
                color="text-amber-400"
                progressColor="bg-amber-400"
              />
              <MiniSkillCard
                icon={<Leaf className="w-3 h-3" />}
                label="Farming"
                level={farmingSkill.level}
                progress={farmingProgress}
                color="text-green-400"
                progressColor="bg-green-400"
              />
              <MiniSkillCard
                icon={<Skull className="w-3 h-3" />}
                label="Dungeon"
                level={dungeonSkill.level}
                progress={dungeonProgress}
                color="text-purple-400"
                progressColor="bg-purple-400"
              />
            </div>
          </div>

          {mainTab === 'island' && islandSubTab === 'generators' && (
            <div>
              <h3 className="pixel-text-sm text-[8px] text-muted-foreground mb-2">GENERATORS</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="pixel-border border-card-border bg-card/50 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="pixel-text-sm text-[7px] text-muted-foreground">Active</span>
                    <span className="pixel-text text-[10px] text-primary tabular-nums">
                      {generators.filter(g => g.isActive).length}
                    </span>
                  </div>
                </div>
                <div className="pixel-border border-card-border bg-card/50 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="pixel-text-sm text-[7px] text-muted-foreground">Total</span>
                    <span className="pixel-text text-[10px] text-foreground tabular-nums">
                      {generators.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mainTab === 'island' && islandSubTab === 'storage' && (
            <div>
              <h3 className="pixel-text-sm text-[8px] text-muted-foreground mb-2">STORAGE</h3>
              <div className="pixel-border border-card-border bg-card/50 p-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="pixel-text-sm text-[7px] text-muted-foreground">Capacity</span>
                  <span className="pixel-text text-[9px] text-foreground tabular-nums">
                    {formatNumber(storageUsed)} / {formatNumber(storage.capacity)}
                  </span>
                </div>
                <Progress 
                  value={storageProgress} 
                  className="h-1.5 bg-muted"
                />
              </div>
            </div>
          )}

          {mainTab === 'hub' && (
            <div>
              <h3 className="pixel-text-sm text-[8px] text-muted-foreground mb-2">HUB STATS</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="pixel-border border-card-border bg-card/50 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="pixel-text-sm text-[7px] text-muted-foreground">Items Sold</span>
                    <span className="pixel-text text-[9px] text-foreground tabular-nums">
                      {formatNumber(player.totalItemsSold)}
                    </span>
                  </div>
                </div>
                <div className="pixel-border border-card-border bg-card/50 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="pixel-text-sm text-[7px] text-muted-foreground">Total Earned</span>
                    <span className="pixel-text text-[9px] text-game-coin tabular-nums">
                      {formatNumber(player.totalCoinsEarned)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
