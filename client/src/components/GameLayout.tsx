import { useEffect } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { TabNavigation } from './TabNavigation';
import { PlayerStats } from './PlayerStats';
import { IslandTab } from './IslandTab';
import { HubTab } from './HubTab';
import { SettingsTab } from './SettingsTab';
import { InventoryPopup } from './InventoryPopup';
import { FloatingNumbers } from './FloatingNumbers';

export function GameLayout() {
  const mainTab = useGameStore((s) => s.mainTab);
  const tickGenerators = useGameStore((s) => s.tickGenerators);
  const saveGame = useGameStore((s) => s.saveGame);

  useKeyboardShortcuts();

  useEffect(() => {
    const tickInterval = setInterval(() => {
      tickGenerators();
    }, 100);

    return () => clearInterval(tickInterval);
  }, [tickGenerators]);

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
    </div>
  );
}
