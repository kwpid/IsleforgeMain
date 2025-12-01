import { useEffect } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { TabNavigation } from './TabNavigation';
import { PlayerStats } from './PlayerStats';
import { IslandTab } from './IslandTab';
import { HubTab } from './HubTab';
import { SettingsTab } from './SettingsTab';
import { InventoryPopup } from './InventoryPopup';
import { FloatingNumbers } from './FloatingNumbers';

export function GameLayout() {
  const mainTab = useGameStore((s) => s.mainTab);
  const setMainTab = useGameStore((s) => s.setMainTab);
  const tickGenerators = useGameStore((s) => s.tickGenerators);
  const saveGame = useGameStore((s) => s.saveGame);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') setMainTab('island');
      if (e.key === '2') setMainTab('hub');
      if (e.key === '3') setMainTab('settings');
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setMainTab, saveGame]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <TabNavigation />
      
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-hidden">
          <div className="h-full">
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
