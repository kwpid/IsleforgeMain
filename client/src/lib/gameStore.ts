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
  BANK_UPGRADES,
  VAULT_UPGRADES,
  BankTransaction,
  ArmorSlot,
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
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

  depositToBank: (amount: number) => boolean;
  withdrawFromBank: (amount: number) => boolean;
  upgradeBank: () => boolean;

  addItemToVault: (itemId: string, quantity: number) => boolean;
  removeItemFromVault: (itemId: string, quantity: number) => boolean;
  upgradeVault: () => boolean;

  calculateNetWorth: () => number;

  addFloatingNumber: (x: number, y: number, value: string, color: string) => void;
  removeFloatingNumber: (id: string) => void;

  resetGame: () => void;
  saveGame: () => void;

  equipItem: (itemId: string, slot: ArmorSlot | 'mainHand' | 'offHand') => boolean;
  unequipItem: (slot: ArmorSlot | 'mainHand' | 'offHand') => boolean;

  addTransaction: (type: 'deposit' | 'withdraw' | 'purchase' | 'sell', amount: number, source?: string) => void;

  updateNotificationSetting: <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => void;
  resetNotificationSettings: () => void;
  isStorageFull: () => boolean;
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
        const hubSubTabs: HubSubTab[] = ['marketplace', 'blueprints', 'bank', 'dungeons'];
        const settingsSubTabs: SettingsSubTab[] = ['general', 'audio', 'controls', 'notifications'];

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
          if (hubSubTabs[newIndex] !== 'dungeons') { // Dungeons not implemented yet
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

      addXp: (amount) => {
        const state = get();
        let newXp = state.player.xp + amount;
        let newLevel = state.player.level;
        let newXpToNextLevel = state.player.xpToNextLevel;

        while (newXp >= newXpToNextLevel) {
          newXp -= newXpToNextLevel;
          newLevel++;
          newXpToNextLevel = getXpForLevel(newLevel);
          // Add universal point on level up
          get().addUniversalPoints(1);
        }

        set({
          player: {
            ...state.player,
            xp: newXp,
            level: newLevel,
            xpToNextLevel: newXpToNextLevel,
          },
        });
      },

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
          // Try to add as much as possible? Or just fail?
          // Let's fail if it doesn't fit completely for now, or fill up?
          // Implementation in original file seemed to try to fill up.
          const canAdd = state.storage.capacity - currentUsed;
          if (canAdd <= 0) return false;
          // If we want to only add what fits:
          // quantity = canAdd; 
          // But usually games either reject or fill. Let's reject if full, or maybe fill?
          // The previous code had logic to cap quantity.
          if (quantity > canAdd) quantity = canAdd;
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

        // Check inventory space
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

      getStorageUsed: () => {
        const state = get();
        return state.storage.items.reduce((sum, item) => sum + item.quantity, 0);
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
        if (success) {
          const earnings = item.sellPrice * quantity;
          get().addCoins(earnings);
          set((state) => ({
            player: {
              ...state.player,
              totalItemsSold: state.player.totalItemsSold + quantity,
            }
          }));
          get().addTransaction('sell', earnings, `Sold ${quantity}x ${item.name}`);
          return true;
        }
        return false;
      },

      sellAllItems: () => {
        const state = get();
        let totalEarnings = 0;
        let totalItems = 0;

        // We need to iterate a copy because we'll be modifying the array
        const itemsToSell = [...state.storage.items];

        for (const invItem of itemsToSell) {
          const item = getItemById(invItem.itemId);
          if (item) {
            const earnings = item.sellPrice * invItem.quantity;
            totalEarnings += earnings;
            totalItems += invItem.quantity;
            // Remove item directly to avoid multiple state updates if possible, 
            // but reusing removeItemFromStorage is safer for consistency.
            // However, calling set in a loop is bad.
            // Better to calculate everything and do one set.
          }
        }

        if (totalItems > 0) {
          set({
            storage: {
              ...state.storage,
              items: [], // Clear storage
            },
            player: {
              ...state.player,
              coins: state.player.coins + totalEarnings,
              totalCoinsEarned: state.player.totalCoinsEarned + totalEarnings,
              totalItemsSold: state.player.totalItemsSold + totalItems,
            }
          });
          get().addTransaction('sell', totalEarnings, `Sold All (${totalItems} items)`);
        }

        return totalEarnings;
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
        
        const storageUsed = get().getStorageUsed();
        const storageFull = storageUsed >= state.storage.capacity;

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
            if (storageFull) {
              newGenerators.push({
                ...owned,
                lastTick: now,
              });
              updated = true;
              continue;
            }

            const ticks = Math.floor(timeSinceLastTick / interval);
            const output = getGeneratorOutput(generator, owned.tier);
            const totalOutput = output * ticks;
            
            const currentUsed = get().getStorageUsed();
            const availableSpace = state.storage.capacity - currentUsed;
            const actualOutput = Math.min(totalOutput, availableSpace);
            
            if (actualOutput > 0) {
              get().addItemToStorage(generator.outputItemId, actualOutput);
              const xpPerTick = owned.tier;
              totalXpGained += xpPerTick * ticks;
            }

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

      addTransaction: (type, amount, source) => {
        set((state) => {
          const newTransaction: BankTransaction = {
            id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            amount,
            timestamp: Date.now(),
            balance: state.bank.balance,
            source,
          };

          const newTransactions = [newTransaction, ...state.bank.transactions].slice(0, 50);

          return {
            bank: {
              ...state.bank,
              transactions: newTransactions,
            }
          };
        });
      },

      depositToBank: (amount) => {
        const state = get();
        if (state.player.coins < amount) return false;

        const spaceAvailable = state.bank.capacity - state.bank.balance;
        if (amount > spaceAvailable) return false;

        get().spendCoins(amount);
        set((state) => ({
          bank: {
            ...state.bank,
            balance: state.bank.balance + amount,
            peakBalance: Math.max(state.bank.peakBalance, state.bank.balance + amount),
          }
        }));

        get().addTransaction('deposit', amount, 'Bank Deposit');
        return true;
      },

      withdrawFromBank: (amount) => {
        const state = get();
        if (state.bank.balance < amount) return false;

        set((state) => ({
          bank: {
            ...state.bank,
            balance: state.bank.balance - amount,
          }
        }));
        get().addCoins(amount);

        get().addTransaction('withdraw', amount, 'Bank Withdrawal');
        return true;
      },

      upgradeBank: () => {
        const state = get();
        const nextLevel = state.bank.upgradeLevel + 1;
        const upgrade = BANK_UPGRADES.find(u => u.level === nextLevel);

        if (!upgrade) return false;
        if (state.player.coins < upgrade.cost) return false;

        get().spendCoins(upgrade.cost);
        set({
          bank: {
            ...state.bank,
            capacity: upgrade.capacity,
            upgradeLevel: nextLevel,
          },
        });
        return true;
      },

      addItemToVault: (itemId, quantity) => {
        const state = get();
        const inventoryItem = state.inventory.items.find(i => i.itemId === itemId);
        if (!inventoryItem || inventoryItem.quantity < quantity) return false;

        const existingVaultItem = state.vault.slots.find(s => s.itemId === itemId);

        if (existingVaultItem) {
          get().removeItemFromInventory(itemId, quantity);
          set({
            vault: {
              ...state.vault,
              slots: state.vault.slots.map(slot =>
                slot.itemId === itemId
                  ? { ...slot, quantity: slot.quantity + quantity }
                  : slot
              ),
            },
          });
          return true;
        } else {
          if (state.vault.slots.length >= state.vault.maxSlots) return false;

          get().removeItemFromInventory(itemId, quantity);
          set({
            vault: {
              ...state.vault,
              slots: [...state.vault.slots, { itemId, quantity }],
            },
          });
          return true;
        }
      },

      removeItemFromVault: (itemId, quantity) => {
        const state = get();
        const vaultItem = state.vault.slots.find(s => s.itemId === itemId);
        if (!vaultItem || vaultItem.quantity < quantity) return false;

        const success = get().addItemToInventory(itemId, quantity);
        if (!success) return false;

        if (vaultItem.quantity === quantity) {
          set({
            vault: {
              ...state.vault,
              slots: state.vault.slots.filter(s => s.itemId !== itemId),
            },
          });
        } else {
          set({
            vault: {
              ...state.vault,
              slots: state.vault.slots.map(slot =>
                slot.itemId === itemId
                  ? { ...slot, quantity: slot.quantity - quantity }
                  : slot
              ),
            },
          });
        }
        return true;
      },

      upgradeVault: () => {
        const state = get();
        const nextLevel = state.vault.upgradeLevel + 1;
        const upgrade = VAULT_UPGRADES.find(u => u.level === nextLevel);

        if (!upgrade) return false;
        if (state.player.coins < upgrade.cost) return false;

        get().spendCoins(upgrade.cost);
        set({
          vault: {
            ...state.vault,
            maxSlots: upgrade.slots,
            upgradeLevel: nextLevel,
          },
        });
        return true;
      },

      calculateNetWorth: () => {
        const state = get();
        let total = state.player.coins + state.bank.balance;

        for (const inv of state.storage.items) {
          const item = getItemById(inv.itemId);
          if (item) total += item.sellPrice * inv.quantity;
        }

        for (const inv of state.inventory.items) {
          const item = getItemById(inv.itemId);
          if (item) total += item.sellPrice * inv.quantity;
        }

        for (const slot of state.vault.slots) {
          const item = getItemById(slot.itemId);
          if (item) total += item.sellPrice * slot.quantity;
        }

        return total;
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

      equipItem: (itemId, slot) => {
        const state = get();
        const inventoryItem = state.inventory.items.find(i => i.itemId === itemId);
        if (!inventoryItem) return false;

        const item = getItemById(itemId);
        if (!item) return false;

        // Simple validation
        if (slot !== 'mainHand' && slot !== 'offHand') {
          // For armor, we could check if item.type === 'armor' and item.armorSlot === slot
          // But for now, let's assume the UI handles valid drops or we just check basic type
          if (item.type !== 'armor') return false;
          if (item.armorSlot !== slot) return false;
        }

        const currentEquippedId = state.equipment[slot];

        // Remove 1 from inventory
        const removeSuccess = get().removeItemFromInventory(itemId, 1);
        if (!removeSuccess) return false;

        // If something was equipped, move it to inventory
        if (currentEquippedId) {
          get().addItemToInventory(currentEquippedId, 1);
        }

        set((state) => ({
          equipment: {
            ...state.equipment,
            [slot]: itemId,
          },
        }));
        return true;
      },

      unequipItem: (slot) => {
        const state = get();
        const currentEquippedId = state.equipment[slot];
        if (!currentEquippedId) return false;

        // Try to add to inventory
        const success = get().addItemToInventory(currentEquippedId, 1);
        if (!success) return false; // Inventory full

        set((state) => ({
          equipment: {
            ...state.equipment,
            [slot]: null,
          },
        }));
        return true;
      },

      updateNotificationSetting: (key, value) => {
        set((state) => ({
          notificationSettings: {
            ...state.notificationSettings,
            [key]: value,
          },
        }));
      },

      resetNotificationSettings: () => {
        set({ notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS } });
      },

      isStorageFull: () => {
        const state = get();
        return get().getStorageUsed() >= state.storage.capacity;
      },
    }),
    {
      name: 'isleforge-storage',
      partialize: (state) => ({
        player: state.player,
        storage: state.storage,
        inventory: state.inventory,
        equipment: state.equipment,
        generators: state.generators,
        unlockedGenerators: state.unlockedGenerators,
        ownedBlueprints: state.ownedBlueprints,
        builtGenerators: state.builtGenerators,
        bank: state.bank,
        vault: state.vault,
        currentBuilding: state.currentBuilding,
        lastSave: state.lastSave,
        playTime: state.playTime,
        keybinds: state.keybinds,
        notificationSettings: state.notificationSettings,
      }),
    }
  )
);
