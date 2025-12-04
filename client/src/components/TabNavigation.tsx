import { useGameStore } from '@/lib/gameStore';
import { MainTab, IslandSubTab, HubSubTab, ShopSubTab, SettingsSubTab } from '@/lib/gameTypes';
import { PixelIcon } from './PixelIcon';
import { cn } from '@/lib/utils';
import { Newspaper } from 'lucide-react';

interface TabNavigationProps {
  onOpenNews?: () => void;
  hasUnreadNews?: boolean;
  isMobile?: boolean;
}

export function TabNavigation({ onOpenNews, hasUnreadNews, isMobile }: TabNavigationProps) {
  const mainTab = useGameStore((s) => s.mainTab);
  const islandSubTab = useGameStore((s) => s.islandSubTab);
  const hubSubTab = useGameStore((s) => s.hubSubTab);
  const shopSubTab = useGameStore((s) => s.shopSubTab);
  const settingsSubTab = useGameStore((s) => s.settingsSubTab);
  const shopHasNewItems = useGameStore((s) => s.shopHasNewItems);
  const setMainTab = useGameStore((s) => s.setMainTab);
  const setIslandSubTab = useGameStore((s) => s.setIslandSubTab);
  const setHubSubTab = useGameStore((s) => s.setHubSubTab);
  const setShopSubTab = useGameStore((s) => s.setShopSubTab);
  const setSettingsSubTab = useGameStore((s) => s.setSettingsSubTab);

  const mainTabs: { id: MainTab; label: string; icon: string; hasNotification?: boolean }[] = [
    { id: 'island', label: 'ISLAND', icon: 'island' },
    { id: 'hub', label: 'HUB', icon: 'hub' },
    { id: 'shop', label: 'SHOP', icon: 'coin', hasNotification: shopHasNewItems },
    { id: 'settings', label: 'SETTINGS', icon: 'settings' },
  ];

  const islandSubTabs: { id: IslandSubTab; label: string; icon: string }[] = [
    { id: 'generators', label: 'GENERATORS', icon: 'cobblestone' },
    { id: 'storage', label: 'STORAGE', icon: 'storage' },
    { id: 'crafting', label: 'CRAFTING', icon: 'iron_pickaxe' },
    { id: 'farming', label: 'FARMING', icon: 'wheat' },
  ];

  const hubSubTabs: { id: HubSubTab; label: string; icon: string; disabled?: boolean }[] = [
    { id: 'marketplace', label: 'MARKETPLACE', icon: 'market' },
    { id: 'blueprints', label: 'BLUEPRINTS', icon: 'blueprint' },
    { id: 'bank', label: 'BANK', icon: 'coin' },
    { id: 'mines', label: 'MINES', icon: 'iron_pickaxe' },
    { id: 'dungeons', label: 'DUNGEONS', icon: 'dungeon', disabled: true },
  ];

  const shopSubTabs: { id: ShopSubTab; label: string; icon: string }[] = [
    { id: 'limited', label: 'LIMITED', icon: 'rare_gem' },
    { id: 'daily', label: 'DAILY', icon: 'universal_point' },
    { id: 'coins', label: 'COINS', icon: 'coin' },
  ];

  const settingsSubTabs: { id: SettingsSubTab; label: string }[] = [
    { id: 'general', label: 'GENERAL' },
    { id: 'audio', label: 'AUDIO' },
    { id: 'controls', label: 'CONTROLS' },
    { id: 'notifications', label: 'NOTIFICATIONS' },
    { id: 'info', label: 'INFO' },
  ];

  return (
    <div className="bg-card border-b-4 border-card-border sticky top-0 z-40">
      <div className="flex items-center px-4 h-14">
        <h1 className="pixel-text text-lg text-primary mr-4 md:mr-8 tracking-wider">
          ISLEFORGE
        </h1>
        
        {!isMobile && (
          <nav className="flex items-center gap-1" data-testid="nav-main-tabs">
            {mainTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMainTab(tab.id)}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2 pixel-text-sm transition-all duration-200',
                  'border-b-4 hover-elevate active-elevate-2',
                  mainTab === tab.id
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
                data-testid={`tab-${tab.id}`}
              >
                <PixelIcon icon={tab.icon} size="sm" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.hasNotification && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 bg-destructive pixel-text-sm text-[6px] text-destructive-foreground">
                    !
                  </span>
                )}
              </button>
            ))}
          </nav>
        )}

        {isMobile && (
          <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 border border-primary/30">
            <PixelIcon icon={mainTabs.find(t => t.id === mainTab)?.icon || 'island'} size="sm" />
            <span className="pixel-text-sm text-primary">{mainTabs.find(t => t.id === mainTab)?.label}</span>
          </div>
        )}
        
        <div className="ml-auto flex items-center gap-2">
          {onOpenNews && (
            <button
              onClick={onOpenNews}
              className={cn(
                'relative flex items-center gap-2 px-3 py-2 pixel-text-sm transition-all duration-200',
                'hover-elevate active-elevate-2 text-muted-foreground hover:text-foreground'
              )}
              data-testid="button-open-news"
            >
              <Newspaper className="w-4 h-4" />
              <span className="hidden sm:inline">NEWS</span>
              {hasUnreadNews && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
              )}
            </button>
          )}
        </div>
      </div>

      {mainTab === 'island' && (
        <div className="overflow-x-auto scrollbar-pixel pb-2 border-t border-border/50 pt-2 animate-tab-slide">
          <div className="flex items-center gap-1 px-4 min-w-max">
            {islandSubTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setIslandSubTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 pixel-text-sm transition-all duration-200 whitespace-nowrap',
                  'hover-elevate active-elevate-2',
                  islandSubTab === tab.id
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                data-testid={`subtab-island-${tab.id}`}
              >
                <PixelIcon icon={tab.icon} size="sm" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {mainTab === 'hub' && (
        <div className="overflow-x-auto scrollbar-pixel pb-2 border-t border-border/50 pt-2 animate-tab-slide">
          <div className="flex items-center gap-1 px-4 min-w-max">
            {hubSubTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setHubSubTab(tab.id)}
                disabled={tab.disabled}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 pixel-text-sm transition-all duration-200 whitespace-nowrap',
                  tab.disabled 
                    ? 'opacity-50 cursor-not-allowed text-muted-foreground'
                    : 'hover-elevate active-elevate-2',
                  !tab.disabled && hubSubTab === tab.id
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                data-testid={`subtab-hub-${tab.id}`}
              >
                <PixelIcon icon={tab.icon} size="sm" />
                <span>{tab.label}</span>
                {tab.disabled && (
                  <span className="pixel-text-sm text-muted-foreground ml-1">(SOON)</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {mainTab === 'shop' && (
        <div className="overflow-x-auto scrollbar-pixel pb-2 border-t border-border/50 pt-2 animate-tab-slide">
          <div className="flex items-center gap-1 px-4 min-w-max">
            {shopSubTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setShopSubTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 pixel-text-sm transition-all duration-200 whitespace-nowrap',
                  'hover-elevate active-elevate-2',
                  shopSubTab === tab.id
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                data-testid={`subtab-shop-${tab.id}`}
              >
                <PixelIcon icon={tab.icon} size="sm" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {mainTab === 'settings' && (
        <div className="overflow-x-auto scrollbar-pixel pb-2 border-t border-border/50 pt-2 animate-tab-slide">
          <div className="flex items-center gap-1 px-4 min-w-max">
            {settingsSubTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSettingsSubTab(tab.id)}
                className={cn(
                  'px-3 py-1.5 pixel-text-sm transition-all duration-200 whitespace-nowrap',
                  'hover-elevate active-elevate-2',
                  settingsSubTab === tab.id
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                data-testid={`subtab-settings-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
