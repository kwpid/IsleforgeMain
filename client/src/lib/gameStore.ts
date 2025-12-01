import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  GameState, 
  InventoryItem, 
  OwnedGenerator, 
  MainTab, 
  IslandSubTab, 
  HubSubTab,
  SettingsSubTab,
  Keybinds,
  KeybindAction,
  DEFAULT_KEYBINDS,
  createDefaultGameState,
  getXpForLevel,
  STORAGE_UPGRADES,
} from './gameTypes';
import { getItemById } from './items';
import { getGeneratorById, getGeneratorOutput, getGeneratorInterval, getNextTierCost } from './generators';

interface GameStore extends GameState {
  mainTab: MainTab;
  islandSubTab: IslandSubTab;
  hubSubTab: HubSubTab;
  settingsSubTab: SettingsSubTab;
  inventoryOpen: boolean;
  floatingNumbers: Array<{ id: string; x: number; y: number; value: string; color: string }>;
  keybinds: Keybinds;
  
  setMainTab: (tab: MainTab) => void;
  setIslandSubTab: (tab: IslandSubTab) => void;
  setHubSubTab: (tab: HubSubTab) => void;
  setSettingsSubTab: (tab: SettingsSubTab) => void;
  toggleInventory: () => void;
  setKeybind: (action: KeybindAction, key: string) => void;
  resetKeybinds: () => void;
  navigateSubTab: (direction: 'prev' | 'next') => void;
  
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addXp: (amount: number) => void;
  addUniversalPoints: (amount: number) => void;
  
  addItemToStorage: (itemId: string, quantity: number) => boolean;
  removeItemFromStorage: (itemId: string, quantity: number) => boolean;
  addItemToInventory: (itemId: string, quantity: number) => boolean;
  removeItemFromInventory: (itemId: string, quantity: number) => boolean;
  moveToInventory: (itemId: string, quantity: number) => boolean;
  moveToStorage: (itemId: string, quantity: number) => boolean;
  sellItem: (itemId: string, quantity: number) => boolean;
  sellAllItems: () => number;
  getStorageUsed: () => number;
  getInventoryUsed: () => number;
  upgradeStorage: () => boolean;
  
  unlockGenerator: (generatorId: string) => boolean;
  unlockGeneratorFree: (generatorId: string) => void;
  upgradeGenerator: (generatorId: string) => boolean;
  tickGenerators: () => void;
  
  addOwnedBlueprint: (blueprintId: string) => void;
  addBuiltGenerator: (generatorId: string) => void;
  
  addFloatingNumber: (x: number, y: number, value: string, color: string) => void;
  removeFloatingNumber: (id: string) => void;
  
  resetGame: () => void;
  saveGame: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createDefaultGameState(),
      mainTab: 'island',
      islandSubTab: 'generators',
      hubSubTab: 'marketplace',
      settingsSubTab: 'general',
      inventoryOpen: false,
      floatingNumbers: [],
      keybinds: { ...DEFAULT_KEYBINDS },

      setMainTab: (tab) => set({ mainTab: tab }),
      setIslandSubTab: (tab) => set({ islandSubTab: tab }),
      setHubSubTab: (tab) => set({ hubSubTab: tab }),
      setSettingsSubTab: (tab) => set({ settingsSubTab: tab }),
      toggleInventory: () => set((state) => ({ inventoryOpen: !state.inventoryOpen })),
      
      setKeybind: (action, key) => set((state) => ({
        keybinds: { ...state.keybinds, [action]: key }
      })),
      
      resetKeybinds: () => set({ keybinds: { ...DEFAULT_KEYBINDS } }),
      
      navigateSubTab: (direction) => {
        const state = get();
        const islandSubTabs: IslandSubTab[] = ['generators', 'storage'];
        const hubSubTabs: HubSubTab[] = ['marketplace', 'blueprints', 'dungeons'];
        const settingsSubTabs: SettingsSubTab[] = ['general', 'audio', 'controls'];
        
        if (state.mainTab === 'island') {
          const currentIndex = islandSubTabs.indexOf(state.islandSubTab);
          const newIndex = direction === 'next' 
            ? Math.min(currentIndex + 1, islandSubTabs.length - 1)
            : Math.max(currentIndex - 1, 0);
          set({ islandSubTab: islandSubTabs[newIndex] });
        } else if (state.mainTab === 'hub') {
          const currentIndex = hubSubTabs.indexOf(state.hubSubTab);
          const newIndex = direction === 'next' 
            ? Math.min(currentIndex + 1, hubSubTabs.length - 1)
            : Math.max(currentIndex - 1, 0);
          if (hubSubTabs[newIndex] !== 'dungeons') {
            set({ hubSubTab: hubSubTabs[newIndex] });
          }
        } else if (state.mainTab === 'settings') {
          const currentIndex = settingsSubTabs.indexOf(state.settingsSubTab);
          const newIndex = direction === 'next' 
            ? Math.min(currentIndex + 1, settingsSubTabs.length - 1)
            : Math.max(currentIndex - 1, 0);
          set({ settingsSubTab: settingsSubTabs[newIndex] });
        }
      },

      addCoins: (amount) => set((state) => ({
        player: {
          ...state.player,
          coins: state.player.coins + amount,
          totalCoinsEarned: state.player.totalCoinsEarned + amount,
        },
      })),

      spendCoins: (amount) => {
        const state = get();
        if (state.player.coins >= amount) {
          set({
            player: {
              ...state.player,
              coins: state.player.coins - amount,
            },
          });
          return true;
        }
        return false;
      },

      addXp: (amount) => set((state) => {
        let newXp = state.player.xp + amount;
        let newLevel = state.player.level;
        let newXpToNextLevel = state.player.xpToNextLevel;

        while (newXp >= newXpToNextLevel) {
          newXp -= newXpToNextLevel;
          newLevel++;
          newXpToNextLevel = getXpForLevel(newLevel);
        }

        return {
          player: {
            ...state.player,
            xp: newXp,
            level: newLevel,
            xpToNextLevel: newXpToNextLevel,
          },
        };
      }),

      addUniversalPoints: (amount) => set((state) => ({
        player: {
          ...state.player,
          universalPoints: state.player.universalPoints + amount,
        },
      })),

      addItemToStorage: (itemId, quantity) => {
        const state = get();
        const item = getItemById(itemId);
        if (!item) return false;

        const currentUsed = get().getStorageUsed();
        if (currentUsed + quantity > state.storage.capacity) {
          const canAdd = state.storage.capacity - currentUsed;
          if (canAdd <= 0) return false;
          quantity = canAdd;
        }

        const existingIndex = state.storage.items.findIndex(i => i.itemId === itemId);
        
        if (existingIndex >= 0) {
          const newItems = [...state.storage.items];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + quantity,
          };
          set({ storage: { ...state.storage, items: newItems } });
        } else {
          set({
            storage: {
              ...state.storage,
              items: [...state.storage.items, { itemId, quantity }],
            },
          });
        }
        return true;
      },

      removeItemFromStorage: (itemId, quantity) => {
        const state = get();
        const existingIndex = state.storage.items.findIndex(i => i.itemId === itemId);
        
        if (existingIndex < 0) return false;
        
        const currentQuantity = state.storage.items[existingIndex].quantity;
        if (currentQuantity < quantity) return false;

        const newItems = [...state.storage.items];
        if (currentQuantity === quantity) {
          newItems.splice(existingIndex, 1);
        } else {
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: currentQuantity - quantity,
          };
        }
        
        set({ storage: { ...state.storage, items: newItems } });
        return true;
      },

      addItemToInventory: (itemId, quantity) => {
        const state = get();
        const existingItem = state.inventory.items.find(i => i.itemId === itemId);
        
        if (existingItem) {
          const newItems = state.inventory.items.map(item =>
            item.itemId === itemId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
          set({ inventory: { ...state.inventory, items: newItems } });
          return true;
        } else {
          if (state.inventory.items.length >= state.inventory.maxSlots) {
            return false;
          }
          const newItems = [...state.inventory.items, { itemId, quantity }];
          set({ inventory: { ...state.inventory, items: newItems } });
          return true;
        }
      },

      removeItemFromInventory: (itemId, quantity) => {
        const state = get();
        const existingIndex = state.inventory.items.findIndex(i => i.itemId === itemId);
        
        if (existingIndex < 0) return false;
        
        const currentQuantity = state.inventory.items[existingIndex].quantity;
        if (currentQuantity < quantity) return false;

        const newItems = [...state.inventory.items];
        if (currentQuantity === quantity) {
          newItems.splice(existingIndex, 1);
        } else {
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: currentQuantity - quantity,
          };
        }
        
        set({ inventory: { ...state.inventory, items: newItems } });
        return true;
      },

      moveToInventory: (itemId, quantity) => {
        const state = get();
        const storageItem = state.storage.items.find(i => i.itemId === itemId);
        if (!storageItem) return false;
        
        const actualQuantity = Math.min(quantity, storageItem.quantity);
        if (actualQuantity <= 0) return false;

        const existingInInventory = state.inventory.items.find(i => i.itemId === itemId);
        if (!existingInInventory && state.inventory.items.length >= state.inventory.maxSlots) {
          return false;
        }

        get().removeItemFromStorage(itemId, actualQuantity);
        get().addItemToInventory(itemId, actualQuantity);
        return true;
      },

      moveToStorage: (itemId, quantity) => {
        const state = get();
        const inventoryItem = state.inventory.items.find(i => i.itemId === itemId);
        if (!inventoryItem) return false;
        
        const usedSpace = get().getStorageUsed();
        const availableSpace = state.storage.capacity - usedSpace;
        const actualQuantity = Math.min(quantity, inventoryItem.quantity, availableSpace);
        
        if (actualQuantity <= 0) return false;

        get().removeItemFromInventory(itemId, actualQuantity);
        get().addItemToStorage(itemId, actualQuantity);
        return true;
      },

      getInventoryUsed: () => {
        const state = get();
        return state.inventory.items.reduce((sum, item) => sum + item.quantity, 0);
      },

      sellItem: (itemId, quantity) => {
        const state = get();
        const item = getItemById(itemId);
        if (!item) return false;

        const success = get().removeItemFromStorage(itemId, quantity);
        if (!success) return false;

        const earnings = item.sellPrice * quantity;
        get().addCoins(earnings);
        get().addXp(Math.floor(quantity / 10) + 1);
        
        set((state) => ({
          player: {
            ...state.player,
            totalItemsSold: state.player.totalItemsSold + quantity,
          },
        }));

        return true;
      },

      sellAllItems: () => {
        const state = get();
        let totalEarnings = 0;
        let totalItems = 0;

        for (const invItem of state.storage.items) {
          const item = getItemById(invItem.itemId);
          if (item) {
            totalEarnings += item.sellPrice * invItem.quantity;
            totalItems += invItem.quantity;
          }
        }

        if (totalItems > 0) {
          get().addCoins(totalEarnings);
          get().addXp(Math.floor(totalItems / 10) + 1);
          set((state) => ({
            storage: { ...state.storage, items: [] },
            player: {
              ...state.player,
              totalItemsSold: state.player.totalItemsSold + totalItems,
            },
          }));
        }

        return totalEarnings;
      },

      getStorageUsed: () => {
        const state = get();
        return state.storage.items.reduce((sum, item) => sum + item.quantity, 0);
      },

      upgradeStorage: () => {
        const state = get();
        const nextLevel = state.storage.upgradeLevel + 1;
        const upgrade = STORAGE_UPGRADES.find(u => u.level === nextLevel);
        
        if (!upgrade) return false;
        if (state.player.coins < upgrade.cost) return false;

        get().spendCoins(upgrade.cost);
        set({
          storage: {
            ...state.storage,
            capacity: upgrade.capacity,
            upgradeLevel: nextLevel,
          },
        });
        return true;
      },

      unlockGenerator: (generatorId) => {
        const state = get();
        const generator = getGeneratorById(generatorId);
        if (!generator) return false;
        if (state.unlockedGenerators.includes(generatorId)) return false;
        if (state.player.coins < generator.unlockCost) return false;

        get().spendCoins(generator.unlockCost);
        
        set({
          unlockedGenerators: [...state.unlockedGenerators, generatorId],
          generators: [
            ...state.generators,
            { generatorId, tier: 1, lastTick: Date.now(), isActive: true },
          ],
        });
        return true;
      },

      unlockGeneratorFree: (generatorId) => {
        const state = get();
        const generator = getGeneratorById(generatorId);
        if (!generator) return;
        if (state.unlockedGenerators.includes(generatorId)) return;
        
        set({
          unlockedGenerators: [...state.unlockedGenerators, generatorId],
          generators: [
            ...state.generators,
            { generatorId, tier: 1, lastTick: Date.now(), isActive: true },
          ],
        });
      },

      upgradeGenerator: (generatorId) => {
        const state = get();
        const generator = getGeneratorById(generatorId);
        const owned = state.generators.find(g => g.generatorId === generatorId);
        
        if (!generator || !owned) return false;
        
        const nextTierCost = getNextTierCost(generator, owned.tier);
        if (nextTierCost === null) return false;
        if (state.player.coins < nextTierCost) return false;

        get().spendCoins(nextTierCost);

        set({
          generators: state.generators.map(g => 
            g.generatorId === generatorId 
              ? { ...g, tier: g.tier + 1 }
              : g
          ),
        });
        return true;
      },

      tickGenerators: () => {
        const state = get();
        const now = Date.now();
        let updated = false;
        let totalXpGained = 0;
        const newGenerators: OwnedGenerator[] = [];

        for (const owned of state.generators) {
          if (!owned.isActive) {
            newGenerators.push(owned);
            continue;
          }

          const generator = getGeneratorById(owned.generatorId);
          if (!generator) {
            newGenerators.push(owned);
            continue;
          }

          const interval = getGeneratorInterval(generator, owned.tier);
          const timeSinceLastTick = now - owned.lastTick;

          if (timeSinceLastTick >= interval) {
            const ticks = Math.floor(timeSinceLastTick / interval);
            const output = getGeneratorOutput(generator, owned.tier);
            const totalOutput = output * ticks;

            get().addItemToStorage(generator.outputItemId, totalOutput);
            
            const xpPerTick = owned.tier;
            totalXpGained += xpPerTick * ticks;
            
            newGenerators.push({
              ...owned,
              lastTick: owned.lastTick + (ticks * interval),
            });
            updated = true;
          } else {
            newGenerators.push(owned);
          }
        }

        if (updated) {
          set({ generators: newGenerators });
          if (totalXpGained > 0) {
            get().addXp(totalXpGained);
          }
        }
      },

      addOwnedBlueprint: (blueprintId) => {
        const state = get();
        if (!state.ownedBlueprints.includes(blueprintId)) {
          set({ ownedBlueprints: [...state.ownedBlueprints, blueprintId] });
        }
      },

      addBuiltGenerator: (generatorId) => {
        const state = get();
        if (!state.builtGenerators.includes(generatorId)) {
          set({ builtGenerators: [...state.builtGenerators, generatorId] });
        }
      },

      addFloatingNumber: (x, y, value, color) => {
        const id = `float-${Date.now()}-${Math.random()}`;
        set((state) => ({
          floatingNumbers: [...state.floatingNumbers, { id, x, y, value, color }],
        }));
        setTimeout(() => get().removeFloatingNumber(id), 1000);
      },

      removeFloatingNumber: (id) => set((state) => ({
        floatingNumbers: state.floatingNumbers.filter(f => f.id !== id),
      })),

      resetGame: () => {
        set({
          ...createDefaultGameState(),
          mainTab: 'island',
          islandSubTab: 'generators',
          hubSubTab: 'marketplace',
          settingsSubTab: 'general',
          inventoryOpen: false,
          floatingNumbers: [],
          keybinds: { ...DEFAULT_KEYBINDS },
        });
      },

      saveGame: () => {
        set({ lastSave: Date.now() });
      },
    }),
    {
      name: 'isleforge-save',
      partialize: (state) => ({
        player: state.player,
        storage: state.storage,
        inventory: state.inventory,
        equipment: state.equipment,
        generators: state.generators,
        unlockedGenerators: state.unlockedGenerators,
        ownedBlueprints: state.ownedBlueprints,
        builtGenerators: state.builtGenerators,
        lastSave: state.lastSave,
        playTime: state.playTime,
        keybinds: state.keybinds,
      }),
    }
  )
);
