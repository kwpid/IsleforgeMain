import { useGameStore } from '@/lib/gameStore';
import { formatNumber } from '@/lib/gameTypes';
import { PixelIcon } from './PixelIcon';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function PlayerStats() {
  const player = useGameStore((s) => s.player);
  const mainTab = useGameStore((s) => s.mainTab);
  const islandSubTab = useGameStore((s) => s.islandSubTab);
  const storage = useGameStore((s) => s.storage);
  const getStorageUsed = useGameStore((s) => s.getStorageUsed);
  const generators = useGameStore((s) => s.generators);

  const xpProgress = (player.xp / player.xpToNextLevel) * 100;
  const storageUsed = getStorageUsed();
  const storageProgress = (storageUsed / storage.capacity) * 100;

  return (
    <div className="h-full flex flex-col bg-sidebar border-l-4 border-sidebar-border p-4 overflow-y-auto scrollbar-pixel">
      <h2 className="pixel-text text-sm text-center mb-6 text-sidebar-foreground tracking-wider">
        PLAYER STATS
      </h2>

      <div className="space-y-4">
        <StatCard 
          icon="xp" 
          label="Level" 
          value={player.level.toString()}
          subValue={`${formatNumber(player.xp)} / ${formatNumber(player.xpToNextLevel)} XP`}
          progress={xpProgress}
          progressColor="bg-game-xp"
        />
        
        <StatCard 
          icon="coin" 
          label="Coins" 
          value={formatNumber(player.coins)}
          highlight="gold"
        />
        
        <StatCard 
          icon="up" 
          label="UP" 
          value={player.universalPoints.toFixed(2)}
          highlight="purple"
        />
      </div>

      <div className="border-t-2 border-sidebar-border mt-6 pt-6">
        <h3 className="pixel-text-sm text-muted-foreground mb-4 tracking-wider">
          {mainTab === 'island' && islandSubTab === 'generators' && 'GENERATORS'}
          {mainTab === 'island' && islandSubTab === 'storage' && 'STORAGE'}
          {mainTab === 'hub' && 'HUB'}
          {mainTab === 'settings' && 'SETTINGS'}
        </h3>

        {mainTab === 'island' && islandSubTab === 'generators' && (
          <div className="space-y-3">
            <div className="pixel-border border-card-border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="pixel-text-sm text-muted-foreground">Active</span>
                <span className="pixel-text text-xs text-primary tabular-nums">
                  {generators.filter(g => g.isActive).length}
                </span>
              </div>
            </div>
            <div className="pixel-border border-card-border bg-card p-3">
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
          <div className="space-y-3">
            <div className="pixel-border border-card-border bg-card p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="pixel-text-sm text-muted-foreground">Capacity</span>
                <span className="pixel-text text-xs text-foreground tabular-nums">
                  {formatNumber(storageUsed)} / {formatNumber(storage.capacity)}
                </span>
              </div>
              <Progress 
                value={storageProgress} 
                className="h-2 bg-muted"
              />
            </div>
            <div className="pixel-border border-card-border bg-card p-3">
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
          <div className="space-y-3">
            <div className="pixel-border border-card-border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="pixel-text-sm text-muted-foreground">Items Sold</span>
                <span className="pixel-text text-xs text-foreground tabular-nums">
                  {formatNumber(player.totalItemsSold)}
                </span>
              </div>
            </div>
            <div className="pixel-border border-card-border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="pixel-text-sm text-muted-foreground">Total Earned</span>
                <span className="pixel-text text-xs text-game-coin tabular-nums">
                  {formatNumber(player.totalCoinsEarned)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-6 border-t-2 border-sidebar-border">
        <p className="pixel-text-sm text-muted-foreground text-center">
          Press TAB for inventory
        </p>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  subValue?: string;
  progress?: number;
  progressColor?: string;
  highlight?: 'gold' | 'purple' | 'green';
}

function StatCard({ icon, label, value, subValue, progress, progressColor, highlight }: StatCardProps) {
  const highlightClasses = {
    gold: 'text-game-coin',
    purple: 'text-game-up',
    green: 'text-game-xp',
  };

  return (
    <div className="pixel-border border-card-border bg-card p-3">
      <div className="flex items-center gap-3">
        <PixelIcon icon={icon} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="pixel-text-sm text-muted-foreground mb-1">{label}</div>
          <div className={cn(
            'pixel-text text-lg tabular-nums',
            highlight ? highlightClasses[highlight] : 'text-foreground'
          )}>
            {value}
          </div>
          {subValue && (
            <div className="pixel-text-sm text-muted-foreground mt-1">
              {subValue}
            </div>
          )}
          {progress !== undefined && (
            <Progress 
              value={progress} 
              className="h-2 mt-2 bg-muted"
              indicatorClassName={progressColor}
            />
          )}
        </div>
      </div>
    </div>
  );
}
