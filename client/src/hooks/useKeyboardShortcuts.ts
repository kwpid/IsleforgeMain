import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/lib/gameStore';

export function useKeyboardShortcuts() {
  const keybinds = useGameStore((s) => s.keybinds);
  const toggleInventory = useGameStore((s) => s.toggleInventory);
  const saveGame = useGameStore((s) => s.saveGame);
  const setMainTab = useGameStore((s) => s.setMainTab);
  const navigateSubTab = useGameStore((s) => s.navigateSubTab);
  const inventoryOpen = useGameStore((s) => s.inventoryOpen);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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

    const isDialogOpen = document.querySelector('[role="dialog"], [role="alertdialog"], [data-radix-dialog-content], [data-state="open"][data-radix-dialog-overlay]') !== null;
    
    if (isDialogOpen) {
      return;
    }

    if (e.code === keybinds.openInventory || e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      toggleInventory();
      return;
    }

    if (inventoryOpen) {
      return;
    }

    if (e.code === keybinds.quickSave || e.key === 's' || e.key === 'S') {
      e.preventDefault();
      e.stopPropagation();
      saveGame();
      return;
    }

    if (e.code === keybinds.islandTab || e.key === '1') {
      e.preventDefault();
      e.stopPropagation();
      setMainTab('island');
      return;
    }

    if (e.code === keybinds.hubTab || e.key === '2') {
      e.preventDefault();
      e.stopPropagation();
      setMainTab('hub');
      return;
    }

    if (e.code === keybinds.shopTab || e.key === '3') {
      e.preventDefault();
      e.stopPropagation();
      setMainTab('shop');
      return;
    }

    if (e.code === keybinds.settingsTab || e.key === '4') {
      e.preventDefault();
      e.stopPropagation();
      setMainTab('settings');
      return;
    }

    if (e.code === keybinds.prevSubTab || e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopPropagation();
      navigateSubTab('prev');
      return;
    }

    if (e.code === keybinds.nextSubTab || e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      navigateSubTab('next');
      return;
    }
  }, [keybinds, toggleInventory, saveGame, setMainTab, navigateSubTab, inventoryOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleKeyDown]);
}
