import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useGameNotifications } from '@/hooks/useGameNotifications';
import { TabNavigation } from './TabNavigation';
import { PlayerStats } from './PlayerStats';
import { IslandTab } from './IslandTab';
import { HubTab } from './HubTab';
import { SettingsTab } from './SettingsTab';
import { InventoryPopup } from './InventoryPopup';
import { FloatingNumbers } from './FloatingNumbers';
import { DevConsole } from './DevConsole';

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

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <TabNavigation />
      
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-hidden">
          <div className="h-full animate-content-fade" key={mainTab}>
            {mainTab === 'island' && <IslandTab />}
            {mainTab === 'hub' && <HubTab />}
            {mainTab === 'settings' && <SettingsTab />}
          </div>
        </main>
        
        <aside className="w-72 lg:w-80 flex-shrink-0 hidden md:block">
          <PlayerStats />
        </aside>
      </div>

      <InventoryPopup />
      <FloatingNumbers />
      <DevConsole isOpen={devConsoleOpen} onClose={() => setDevConsoleOpen(false)} />
    </div>
  );
}
