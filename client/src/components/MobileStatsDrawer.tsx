import { useGameStore } from '@/lib/gameStore';
import { formatNumber, createDefaultSkillStats } from '@/lib/gameTypes';
import { PixelIcon } from './PixelIcon';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Pickaxe, Leaf, Skull, X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

interface MobileStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileStatsDrawer({ open, onOpenChange }: MobileStatsDrawerProps) {
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] bg-sidebar border-sidebar-border" data-testid="mobile-stats-drawer">
        <DrawerHeader className="flex items-center justify-between gap-2 pb-2">
          <DrawerTitle className="pixel-text text-sm text-sidebar-foreground tracking-wider">
            PLAYER STATS
          </DrawerTitle>
          <DrawerClose asChild>
            <Button size="icon" variant="ghost" data-testid="button-close-stats">
              <X className="w-4 h-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="overflow-y-auto scrollbar-pixel px-4 pb-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <MobileStatCard 
              icon="xp" 
              label="Level" 
              value={player.level.toString()}
              subValue={`${formatNumber(player.xp)} / ${formatNumber(player.xpToNextLevel)}`}
              progress={xpProgress}
              progressColor="bg-game-xp"
            />
            
            <MobileStatCard 
              icon="coin" 
              label="Coins" 
              value={formatNumber(player.coins)}
              highlight="gold"
            />
            
            <MobileStatCard 
              icon="up" 
              label="UP" 
              value={`U$${player.universalPoints}`}
              highlight="purple"
            />
          </div>

          <div className="border-t-2 border-sidebar-border pt-4">
            <h3 className="pixel-text-sm text-muted-foreground mb-3 tracking-wider">
              SKILLS
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <MobileSkillCard
                icon={<Pickaxe className="w-4 h-4" />}
                label="Mining"
                level={miningSkill.level}
                progress={miningProgress}
                color="text-amber-400"
                progressColor="bg-amber-400"
              />
              <MobileSkillCard
                icon={<Leaf className="w-4 h-4" />}
                label="Farming"
                level={farmingSkill.level}
                progress={farmingProgress}
                color="text-green-400"
                progressColor="bg-green-400"
              />
              <MobileSkillCard
                icon={<Skull className="w-4 h-4" />}
                label="Dungeon"
                level={dungeonSkill.level}
                progress={dungeonProgress}
                color="text-purple-400"
                progressColor="bg-purple-400"
              />
            </div>
          </div>

          <div className="border-t-2 border-sidebar-border pt-4">
            <h3 className="pixel-text-sm text-muted-foreground mb-3 tracking-wider">
              {mainTab === 'island' && islandSubTab === 'generators' && 'GENERATORS'}
              {mainTab === 'island' && islandSubTab === 'storage' && 'STORAGE'}
              {mainTab === 'hub' && 'HUB STATS'}
              {mainTab === 'shop' && 'SHOP'}
              {mainTab === 'settings' && 'SETTINGS'}
            </h3>

            {mainTab === 'island' && islandSubTab === 'generators' && (
              <div className="grid grid-cols-2 gap-2">
                <div className="pixel-border border-card-border bg-card p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="pixel-text-sm text-muted-foreground">Active</span>
                    <span className="pixel-text text-xs text-primary tabular-nums">
                      {generators.filter(g => g.isActive).length}
                    </span>
                  </div>
                </div>
                <div className="pixel-border border-card-border bg-card p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="pixel-text-sm text-muted-foreground">Total</span>
                    <span className="pixel-text text-xs text-foreground tabular-nums">
                      {generators.length}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {mainTab === 'island' && islandSubTab === 'storage' && (
              <div className="space-y-2">
                <div className="pixel-border border-card-border bg-card p-2">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="pixel-text-sm text-muted-foreground">Capacity</span>
                    <span className="pixel-text text-xs text-foreground tabular-nums">
                      {formatNumber(storageUsed)} / {formatNumber(storage.capacity)}
                    </span>
                  </div>
                  <Progress 
                    value={storageProgress} 
                    className="h-1.5 bg-muted"
                  />
                </div>
                <div className="pixel-border border-card-border bg-card p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="pixel-text-sm text-muted-foreground">Level</span>
                    <span className="pixel-text text-xs text-foreground tabular-nums">
                      {storage.upgradeLevel}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {mainTab === 'hub' && (
              <div className="grid grid-cols-2 gap-2">
                <div className="pixel-border border-card-border bg-card p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="pixel-text-sm text-muted-foreground">Items Sold</span>
                    <span className="pixel-text text-xs text-foreground tabular-nums">
                      {formatNumber(player.totalItemsSold)}
                    </span>
                  </div>
                </div>
                <div className="pixel-border border-card-border bg-card p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="pixel-text-sm text-muted-foreground">Earned</span>
                    <span className="pixel-text text-xs text-game-coin tabular-nums">
                      {formatNumber(player.totalCoinsEarned)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t-2 border-sidebar-border">
            <p className="pixel-text-sm text-muted-foreground text-center text-[7px]">
              Tap outside or swipe down to close
            </p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

interface MobileStatCardProps {
  icon: string;
  label: string;
  value: string;
  subValue?: string;
  progress?: number;
  progressColor?: string;
  highlight?: 'gold' | 'purple' | 'green';
}

function MobileStatCard({ icon, label, value, subValue, progress, progressColor, highlight }: MobileStatCardProps) {
  const highlightClasses = {
    gold: 'text-game-coin',
    purple: 'text-game-up',
    green: 'text-game-xp',
  };

  return (
    <div className="pixel-border border-card-border bg-card p-2">
      <div className="flex flex-col items-center gap-1">
        <PixelIcon icon={icon} size="md" />
        <div className="text-center">
          <div className="pixel-text-sm text-muted-foreground text-[6px]">{label}</div>
          <div className={cn(
            'pixel-text text-sm tabular-nums',
            highlight ? highlightClasses[highlight] : 'text-foreground'
          )}>
            {value}
          </div>
          {subValue && (
            <div className="pixel-text-sm text-muted-foreground text-[5px] mt-0.5">
              {subValue}
            </div>
          )}
          {progress !== undefined && (
            <Progress 
              value={progress} 
              className="h-1 mt-1 bg-muted"
              indicatorClassName={progressColor}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface MobileSkillCardProps {
  icon: React.ReactNode;
  label: string;
  level: number;
  progress: number;
  color: string;
  progressColor: string;
}

function MobileSkillCard({ icon, label, level, progress, color, progressColor }: MobileSkillCardProps) {
  return (
    <div className="pixel-border border-card-border bg-card p-2" data-testid={`mobile-skill-${label.toLowerCase()}`}>
      <div className="flex flex-col items-center gap-1">
        <div className={cn("flex-shrink-0", color)}>
          {icon}
        </div>
        <div className="text-center w-full">
          <span className="pixel-text-sm text-muted-foreground text-[6px]">{label}</span>
          <div className={cn("pixel-text text-xs tabular-nums", color)}>
            Lv. {level}
          </div>
          <Progress 
            value={progress} 
            className="h-1 mt-1 bg-muted"
            indicatorClassName={progressColor}
          />
        </div>
      </div>
    </div>
  );
}
