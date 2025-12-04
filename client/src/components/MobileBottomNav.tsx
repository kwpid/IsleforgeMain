import { useGameStore } from '@/lib/gameStore';
import { MainTab } from '@/lib/gameTypes';
import { PixelIcon } from './PixelIcon';
import { cn } from '@/lib/utils';
import { Newspaper } from 'lucide-react';

interface MobileBottomNavProps {
  onOpenNews?: () => void;
  hasUnreadNews?: boolean;
}

export function MobileBottomNav({ onOpenNews, hasUnreadNews }: MobileBottomNavProps) {
  const mainTab = useGameStore((s) => s.mainTab);
  const shopHasNewItems = useGameStore((s) => s.shopHasNewItems);
  const setMainTab = useGameStore((s) => s.setMainTab);

  const mainTabs: { id: MainTab; label: string; icon: string; hasNotification?: boolean }[] = [
    { id: 'island', label: 'ISLAND', icon: 'island' },
    { id: 'hub', label: 'HUB', icon: 'hub' },
    { id: 'shop', label: 'SHOP', icon: 'coin', hasNotification: shopHasNewItems },
    { id: 'settings', label: 'SETTINGS', icon: 'settings' },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-4 border-card-border md:hidden safe-area-bottom"
      data-testid="mobile-bottom-nav"
    >
      <div className="flex items-stretch justify-around">
        {mainTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMainTab(tab.id)}
            className={cn(
              'relative flex-1 flex flex-col items-center gap-1 py-2 px-1 transition-all duration-200',
              'active-elevate-2',
              mainTab === tab.id
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground'
            )}
            data-testid={`mobile-tab-${tab.id}`}
          >
            <PixelIcon icon={tab.icon} size="md" />
            <span className="pixel-text-sm text-[6px] truncate max-w-full">{tab.label}</span>
            {tab.hasNotification && (
              <span className="absolute top-1 right-1/4 flex items-center justify-center w-3 h-3 bg-destructive pixel-text-sm text-[5px] text-destructive-foreground">
                !
              </span>
            )}
          </button>
        ))}
        {onOpenNews && (
          <button
            onClick={onOpenNews}
            className={cn(
              'relative flex-1 flex flex-col items-center gap-1 py-2 px-1 transition-all duration-200',
              'active-elevate-2 text-muted-foreground'
            )}
            data-testid="mobile-tab-news"
          >
            <Newspaper className="w-5 h-5" />
            <span className="pixel-text-sm text-[6px]">NEWS</span>
            {hasUnreadNews && (
              <span className="absolute top-1 right-1/4 w-2 h-2 bg-primary rounded-full animate-pulse" />
            )}
          </button>
        )}
      </div>
    </nav>
  );
}
