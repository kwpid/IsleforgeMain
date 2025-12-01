import { useGameStore } from '@/lib/gameStore';
import { MainTab, IslandSubTab, HubSubTab, SettingsSubTab } from '@/lib/gameTypes';
import { PixelIcon } from './PixelIcon';
import { cn } from '@/lib/utils';

export function TabNavigation() {
  const mainTab = useGameStore((s) => s.mainTab);
  const islandSubTab = useGameStore((s) => s.islandSubTab);
  const hubSubTab = useGameStore((s) => s.hubSubTab);
  const settingsSubTab = useGameStore((s) => s.settingsSubTab);
  const setMainTab = useGameStore((s) => s.setMainTab);
  const setIslandSubTab = useGameStore((s) => s.setIslandSubTab);
  const setHubSubTab = useGameStore((s) => s.setHubSubTab);
  const setSettingsSubTab = useGameStore((s) => s.setSettingsSubTab);

  const mainTabs: { id: MainTab; label: string; icon: string }[] = [
    { id: 'island', label: 'ISLAND', icon: 'island' },
    { id: 'hub', label: 'HUB', icon: 'hub' },
    { id: 'settings', label: 'SETTINGS', icon: 'settings' },
  ];

  const islandSubTabs: { id: IslandSubTab; label: string; icon: string }[] = [
    { id: 'generators', label: 'GENERATORS', icon: 'cobblestone' },
    { id: 'storage', label: 'STORAGE', icon: 'storage' },
  ];

  const hubSubTabs: { id: HubSubTab; label: string; icon: string; disabled?: boolean }[] = [
    { id: 'marketplace', label: 'MARKETPLACE', icon: 'market' },
    { id: 'blueprints', label: 'BLUEPRINTS', icon: 'blueprint' },
    { id: 'bank', label: 'BANK', icon: 'coin' },
    { id: 'dungeons', label: 'DUNGEONS', icon: 'dungeon', disabled: true },
  ];

  const settingsSubTabs: { id: SettingsSubTab; label: string }[] = [
    { id: 'general', label: 'GENERAL' },
    { id: 'audio', label: 'AUDIO' },
    { id: 'controls', label: 'CONTROLS' },
  ];

  return (
    <div className="bg-card border-b-4 border-card-border sticky top-0 z-40">
      <div className="flex items-center px-4 h-14">
        <h1 className="pixel-text text-lg text-primary mr-8 tracking-wider">
          ISLEFORGE
        </h1>
        
        <nav className="flex items-center gap-1" data-testid="nav-main-tabs">
          {mainTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 pixel-text-sm transition-all duration-200',
                'border-b-4 hover-elevate active-elevate-2',
                mainTab === tab.id
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
              data-testid={`tab-${tab.id}`}
            >
              <PixelIcon icon={tab.icon} size="sm" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {mainTab === 'island' && (
        <div className="flex items-center gap-1 px-4 pb-2 border-t border-border/50 pt-2 animate-tab-slide">
          {islandSubTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setIslandSubTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 pixel-text-sm transition-all duration-200',
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
      )}

      {mainTab === 'hub' && (
        <div className="flex items-center gap-1 px-4 pb-2 border-t border-border/50 pt-2 animate-tab-slide">
          {hubSubTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setHubSubTab(tab.id)}
              disabled={tab.disabled}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 pixel-text-sm transition-all duration-200',
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
      )}

      {mainTab === 'settings' && (
        <div className="flex items-center gap-1 px-4 pb-2 border-t border-border/50 pt-2 animate-tab-slide">
          {settingsSubTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSettingsSubTab(tab.id)}
              className={cn(
                'px-3 py-1.5 pixel-text-sm transition-all duration-200',
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
      )}
    </div>
  );
}
