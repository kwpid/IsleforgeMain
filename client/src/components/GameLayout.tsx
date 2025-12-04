import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useGameNotifications } from '@/hooks/useGameNotifications';
import { useIsMobile } from '@/hooks/use-mobile';
import { TabNavigation } from './TabNavigation';
import { PlayerStats } from './PlayerStats';
import { IslandTab } from './IslandTab';
import { HubTab } from './HubTab';
import { ShopTab } from './ShopTab';
import { SettingsTab } from './SettingsTab';
import { InventoryPopup } from './InventoryPopup';
import { FloatingNumbers } from './FloatingNumbers';
import { DevConsole } from './DevConsole';
import { NewsModal, useNewsModal } from './NewsModal';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileStatsDrawer } from './MobileStatsDrawer';

export function GameLayout() {
  const mainTab = useGameStore((s) => s.mainTab);
  const tickGenerators = useGameStore((s) => s.tickGenerators);
  const saveGame = useGameStore((s) => s.saveGame);
  const isStorageFull = useGameStore((s) => s.isStorageFull);
  const notificationSettings = useGameStore((s) => s.notificationSettings);
  const inventoryOpen = useGameStore((s) => s.inventoryOpen);
  const { warning } = useGameNotifications();
  
  const wasStorageFull = useRef(false);
  const lastNotificationTime = useRef(0);
  
  const [devConsoleOpen, setDevConsoleOpen] = useState(false);
  const [mobileStatsOpen, setMobileStatsOpen] = useState(false);
  const isMobile = useIsMobile();
  const { isOpen: newsOpen, openNews, closeNews, markAllRead, hasUnread } = useNewsModal();

  useKeyboardShortcuts();
  
  const handleDevConsoleToggle = useCallback(() => {
    setDevConsoleOpen(prev => !prev);
  }, []);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable;
      
      if (isInputField && !devConsoleOpen) return;
      
      if (e.code === 'KeyY' && !devConsoleOpen) {
        e.preventDefault();
        handleDevConsoleToggle();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDevConsoleToggle, devConsoleOpen]);

  useEffect(() => {
    const tickInterval = setInterval(() => {
      tickGenerators();
      
      const storageFull = isStorageFull();
      const now = Date.now();
      
      if (storageFull && !wasStorageFull.current) {
        if (notificationSettings.enabled && notificationSettings.storageFull && 
            now - lastNotificationTime.current > 10000) {
          warning('Storage Full!', 'Generators paused until storage is freed');
          lastNotificationTime.current = now;
        }
      }
      wasStorageFull.current = storageFull;
    }, 100);

    return () => clearInterval(tickInterval);
  }, [tickGenerators, isStorageFull, notificationSettings, warning]);

  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveGame();
    }, 60000);

    return () => clearInterval(saveInterval);
  }, [saveGame]);

  const gitBranch = import.meta.env.VITE_GIT_BRANCH || 'unknown';
  const isMainBranch = gitBranch === 'main' || gitBranch === 'master';

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <TabNavigation onOpenNews={openNews} hasUnreadNews={hasUnread} isMobile={isMobile} />
      
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-hidden">
          <div className={`h-full animate-content-fade ${isMobile ? 'pb-20' : ''}`} key={mainTab} style={isMobile ? { paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' } : undefined}>
            {mainTab === 'island' && <IslandTab />}
            {mainTab === 'hub' && <HubTab />}
            {mainTab === 'shop' && <ShopTab />}
            {mainTab === 'settings' && <SettingsTab />}
          </div>
        </main>
        
        <aside className="w-72 lg:w-80 flex-shrink-0 hidden md:block">
          <PlayerStats />
        </aside>
      </div>

      {!isMainBranch && gitBranch !== 'unknown' && (
        <div className={`fixed ${isMobile ? 'bottom-18' : 'bottom-2'} left-2 z-50`}>
          <span className="pixel-text-sm text-[10px] text-red-500 bg-red-500/10 px-2 py-1 rounded border border-red-500/30">
            DEVELOPMENT BRANCH: {gitBranch}
          </span>
        </div>
      )}

      {isMobile && (
        <>
          <MobileBottomNav 
            onOpenStats={() => setMobileStatsOpen(true)} 
            onOpenNews={openNews}
            hasUnreadNews={hasUnread}
          />
          <MobileStatsDrawer open={mobileStatsOpen} onOpenChange={setMobileStatsOpen} />
        </>
      )}
      <InventoryPopup />
      <FloatingNumbers />
      <DevConsole isOpen={devConsoleOpen} onClose={() => setDevConsoleOpen(false)} />
      <NewsModal isOpen={newsOpen} onClose={closeNews} onArticlesRead={markAllRead} />
    </div>
  );
}
