import { useEffect } from 'react';
import { useGameStore } from '@/lib/gameStore';

export function useKeyboardShortcuts() {
  const keybinds = useGameStore((s) => s.keybinds);
  const toggleInventory = useGameStore((s) => s.toggleInventory);
  const saveGame = useGameStore((s) => s.saveGame);
  const setMainTab = useGameStore((s) => s.setMainTab);
  const navigateSubTab = useGameStore((s) => s.navigateSubTab);
  const inventoryOpen = useGameStore((s) => s.inventoryOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      
      const isKeybindCapture = target.hasAttribute('data-keybind-capture');
      if (isKeybindCapture) {
        return;
      }

      const isInputField = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable;
      
      if (isInputField) {
        return;
      }

      if (e.code === keybinds.openInventory) {
        e.preventDefault();
        toggleInventory();
        return;
      }

      if (inventoryOpen) {
        return;
      }

      if (e.code === keybinds.quickSave) {
        e.preventDefault();
        saveGame();
        return;
      }

      if (e.code === keybinds.islandTab) {
        e.preventDefault();
        setMainTab('island');
        return;
      }

      if (e.code === keybinds.hubTab) {
        e.preventDefault();
        setMainTab('hub');
        return;
      }

      if (e.code === keybinds.shopTab) {
        e.preventDefault();
        setMainTab('shop');
        return;
      }

      if (e.code === keybinds.settingsTab) {
        e.preventDefault();
        setMainTab('settings');
        return;
      }

      if (e.code === keybinds.prevSubTab) {
        e.preventDefault();
        navigateSubTab('prev');
        return;
      }

      if (e.code === keybinds.nextSubTab) {
        e.preventDefault();
        navigateSubTab('next');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keybinds, toggleInventory, saveGame, setMainTab, navigateSubTab, inventoryOpen]);
}
