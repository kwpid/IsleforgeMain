import { useGameStore } from '@/lib/gameStore';
import { formatNumber, createDefaultSkillStats } from '@/lib/gameTypes';
import { PixelIcon } from './PixelIcon';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Pickaxe, Leaf, Skull, Sparkles, Clock } from 'lucide-react';
import { getBoosterById } from '@/lib/items';
import { useEffect, useState } from 'react';

export function PlayerStats() {
  const player = useGameStore((s) => s.player);
  const mainTab = useGameStore((s) => s.mainTab);
  const islandSubTab = useGameStore((s) => s.islandSubTab);
  const storage = useGameStore((s) => s.storage);
  const getStorageUsed = useGameStore((s) => s.getStorageUsed);
  const generators = useGameStore((s) => s.generators);
  const getActiveBoosters = useGameStore((s) => s.getActiveBoosters);
  const tickBoosters = useGameStore((s) => s.tickBoosters);
  
  const [, setTick] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      tickBoosters();
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [tickBoosters]);
  
  const activeBoosters = getActiveBoosters();

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
          value={`U$${formatNumber(player.universalPoints)}`}
          highlight="purple"
        />
      </div>

      <div className="border-t-2 border-sidebar-border mt-6 pt-6">
        <h3 className="pixel-text-sm text-muted-foreground mb-4 tracking-wider">
          SKILLS
        </h3>
        <div className="space-y-3">
          <SkillCard
            icon={<Pickaxe className="w-4 h-4" />}
            label="Mining"
            level={miningSkill.level}
            xp={miningSkill.xp}
            xpToNext={miningSkill.xpToNextLevel}
            progress={miningProgress}
            color="text-amber-400"
            progressColor="bg-amber-400"
          />
          <SkillCard
            icon={<Leaf className="w-4 h-4" />}
            label="Farming"
            level={farmingSkill.level}
            xp={farmingSkill.xp}
            xpToNext={farmingSkill.xpToNextLevel}
            progress={farmingProgress}
            color="text-green-400"
            progressColor="bg-green-400"
          />
          <SkillCard
            icon={<Skull className="w-4 h-4" />}
            label="Dungeon"
            level={dungeonSkill.level}
            xp={dungeonSkill.xp}
            xpToNext={dungeonSkill.xpToNextLevel}
            progress={dungeonProgress}
            color="text-purple-400"
            progressColor="bg-purple-400"
          />
        </div>
      </div>

      {activeBoosters.length > 0 && (
        <div className="border-t-2 border-sidebar-border mt-6 pt-6">
          <h3 className="pixel-text-sm text-muted-foreground mb-4 tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            ACTIVE BOOSTERS
          </h3>
          <div className="space-y-3">
            {activeBoosters.map((active) => {
              const booster = getBoosterById(active.boosterId);
              if (!booster) return null;
              
              const remainingMs = active.expiresAt - Date.now();
              const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
              const minutes = Math.floor(remainingSeconds / 60);
              const seconds = remainingSeconds % 60;
              
              return (
                <div 
                  key={active.boosterId}
                  className="pixel-border border-yellow-500/50 bg-yellow-950/20 p-3 relative overflow-hidden"
                  data-testid={`active-booster-${active.boosterId}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-transparent animate-pulse" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="pixel-text-sm text-yellow-300">{booster.name}</span>
                      <span className="pixel-text text-xs text-yellow-400 flex items-center gap-1 tabular-nums">
                        <Clock className="w-3 h-3" />
                        {minutes}:{seconds.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {booster.effects.map((effect, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="pixel-text-sm text-green-400">+{Math.round(effect.multiplier * 100)}%</span>
                          <span className="pixel-text-sm text-muted-foreground capitalize">{effect.stat.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

interface SkillCardProps {
  icon: React.ReactNode;
  label: string;
  level: number;
  xp: number;
  xpToNext: number;
  progress: number;
  color: string;
  progressColor: string;
}

function SkillCard({ icon, label, level, xp, xpToNext, progress, color, progressColor }: SkillCardProps) {
  return (
    <div className="pixel-border border-card-border bg-card p-3" data-testid={`skill-card-${label.toLowerCase()}`}>
      <div className="flex items-center gap-3">
        <div className={cn("flex-shrink-0", color)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="pixel-text-sm text-muted-foreground">{label}</span>
            <span className={cn("pixel-text text-xs tabular-nums", color)}>
              Lv. {level}
            </span>
          </div>
          <Progress 
            value={progress} 
            className="h-1.5 bg-muted"
            indicatorClassName={progressColor}
          />
          <div className="pixel-text-sm text-muted-foreground mt-1 text-[8px]">
            {formatNumber(xp)} / {formatNumber(xpToNext)} XP
          </div>
        </div>
      </div>
    </div>
  );
}
