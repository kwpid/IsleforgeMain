import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  GameState,
  InventoryItem,
  OwnedGenerator,
  MainTab,
  IslandSubTab,
  HubSubTab,
  ShopSubTab,
  SettingsSubTab,
  Keybinds,
  KeybindAction,
  DEFAULT_KEYBINDS,
  createDefaultGameState,
  createDefaultStorageSystem,
  getXpForLevel,
  getSkillXpForLevel,
  STORAGE_UPGRADES,
  BANK_UPGRADES,
  VAULT_UPGRADES,
  BankTransaction,
  ArmorSlot,
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  MiningStats,
  EquipmentDurability,
  VendorStockPurchases,
  SkillStats,
  createDefaultSkillStats,
  PlantedCrop,
  FARM_TIER_UPGRADES,
  FARM_UNLOCK_COSTS,
  WATERING_CAN_TIERS,
  StorageUnit,
  STORAGE_UNIT_MAX_SLOTS,
  STORAGE_UNIT_PURCHASE_COST,
  MAX_STORAGE_UNITS,
} from './gameTypes';
import { SEED_ITEMS, CROP_ITEMS } from './items';
import { getItemById } from './items';
import { getGeneratorById, getGeneratorOutput, getGeneratorInterval, getNextTierCost } from './generators';
import { getRecipeById, getCraftingCost, canCraftRecipe } from './crafting';
import { isLimitedItem } from './items/limited';

interface GameStore extends GameState {
  mainTab: MainTab;
  islandSubTab: IslandSubTab;
  hubSubTab: HubSubTab;
  shopSubTab: ShopSubTab;
  settingsSubTab: SettingsSubTab;
  inventoryOpen: boolean;
  floatingNumbers: Array<{ id: string; x: number; y: number; value: string; color: string }>;
  keybinds: Keybinds;
  lastShopVisit: number;
  shopHasNewItems: boolean;
  limitedPurchases: string[];

  setMainTab: (tab: MainTab) => void;
  setIslandSubTab: (tab: IslandSubTab) => void;
  setHubSubTab: (tab: HubSubTab) => void;
  setShopSubTab: (tab: ShopSubTab) => void;
  setSettingsSubTab: (tab: SettingsSubTab) => void;
  markShopVisited: () => void;
  toggleInventory: () => void;
  setKeybind: (action: KeybindAction, key: string) => void;
  resetKeybinds: () => void;
  navigateSubTab: (direction: 'prev' | 'next') => void;

  addCoins: (amount: number) => void;
  setCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addXp: (amount: number) => void;
  addUniversalPoints: (amount: number) => void;
  setUniversalPoints: (amount: number) => void;
  addMiningXp: (amount: number) => void;
  addFarmingXp: (amount: number) => void;
  addDungeonXp: (amount: number) => void;

  addItemToStorage: (itemId: string, quantity: number) => boolean;
  removeItemFromStorage: (itemId: string, quantity: number) => boolean;
  addItemToInventory: (itemId: string, quantity: number) => boolean;
  removeItemFromInventory: (itemId: string, quantity: number) => boolean;
  moveToInventory: (itemId: string, quantity: number) => boolean;
  moveToStorage: (itemId: string, quantity: number) => boolean;
  sellItem: (itemId: string, quantity: number) => boolean;
  sellAllItems: () => number;
  bulkSellItems: (items: { itemId: string; quantity: number }[]) => number;
  getStorageUsed: () => number;
  getInventoryUsed: () => number;
  upgradeStorage: () => boolean;

  purchaseStorageUnit: () => boolean;
  renameStorageUnit: (unitId: string, newName: string) => boolean;
  selectStorageUnit: (unitId: string) => void;
  addItemToStorageUnit: (unitId: string, itemId: string, quantity: number) => boolean;
  removeItemFromStorageUnit: (unitId: string, itemId: string, quantity: number) => boolean;
  moveItemBetweenStorageUnits: (fromUnitId: string, toUnitId: string, itemId: string, quantity: number) => boolean;
  moveFromStorageUnitToInventory: (unitId: string, itemId: string, quantity: number) => boolean;
  moveFromInventoryToStorageUnit: (unitId: string, itemId: string, quantity: number) => boolean;
  getStorageUnitUsed: (unitId: string) => number;
  getCurrentStorageUnit: () => StorageUnit | undefined;
  sellItemFromStorageUnit: (unitId: string, itemId: string, quantity: number) => boolean;
  sellAllItemsFromStorageUnit: (unitId: string) => number;

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

  addBlockMined: (itemId: string) => void;
  getMiningStats: () => MiningStats;
  
  getEquippedPickaxe: () => string | null;
  getEquipmentDurability: (slot: 'mainHand' | 'offHand') => number | null;
  setEquipmentDurability: (slot: 'mainHand' | 'offHand', durability: number | null) => void;
  usePickaxeDurability: () => boolean;
  isEquipmentBroken: (slot: 'mainHand' | 'offHand') => boolean;
  
  sellSelectedItems: (items: { itemId: string; quantity: number }[]) => number;
  craftItem: (recipeId: string, quantity?: number) => boolean;
  
  getVendorStockPurchased: (vendorId: string, itemId: string) => number;
  purchaseVendorItem: (vendorId: string, itemId: string, quantity: number) => void;
  resetVendorStockIfNeeded: () => void;
  
  plantCrop: (farmId: string, slotIndex: number, seedId: string) => boolean;
  waterCrop: (farmId: string, slotIndex: number) => boolean;
  harvestCrop: (farmId: string, slotIndex: number) => boolean;
  harvestAllCrops: (farmId: string) => number;
  upgradeFarm: (farmId: string) => boolean;
  unlockFarm: (farmId: string) => boolean;
  setSelectedFarm: (farmId: string) => void;
  tickFarming: () => void;
  getWateringCanUses: () => number;
  getBestWateringCan: () => { id: string; capacity: number; refillCost: number } | null;
  refillWateringCan: () => { success: boolean; reason?: string; capacity?: number; cost?: number };
  addLimitedPurchase: (itemId: string) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createDefaultGameState(),
      mainTab: 'island',
      islandSubTab: 'generators',
      hubSubTab: 'marketplace',
      shopSubTab: 'daily',
      settingsSubTab: 'general',
      inventoryOpen: false,
      floatingNumbers: [],
      keybinds: { ...DEFAULT_KEYBINDS },
      lastShopVisit: 0,
      shopHasNewItems: true,
      limitedPurchases: [],

      setMainTab: (tab) => {
        if (tab === 'shop') {
          set({ mainTab: tab, shopHasNewItems: false, lastShopVisit: Date.now() });
        } else {
          set({ mainTab: tab });
        }
      },
      setIslandSubTab: (tab) => set({ islandSubTab: tab }),
      setHubSubTab: (tab) => set({ hubSubTab: tab }),
      setShopSubTab: (tab) => set({ shopSubTab: tab }),
      setSettingsSubTab: (tab) => set({ settingsSubTab: tab }),
      markShopVisited: () => set({ shopHasNewItems: false, lastShopVisit: Date.now() }),
      toggleInventory: () => set((state) => ({ inventoryOpen: !state.inventoryOpen })),

      setKeybind: (action, key) => set((state) => ({
        keybinds: { ...state.keybinds, [action]: key }
      })),

      resetKeybinds: () => set({ keybinds: { ...DEFAULT_KEYBINDS } }),

      navigateSubTab: (direction) => {
        const state = get();
        const islandSubTabs: IslandSubTab[] = ['generators', 'storage', 'crafting'];
        const hubSubTabs: HubSubTab[] = ['marketplace', 'blueprints', 'bank', 'mines', 'dungeons'];
        const shopSubTabs: ShopSubTab[] = ['limited', 'daily', 'coins'];
        const settingsSubTabs: SettingsSubTab[] = ['general', 'audio', 'controls', 'notifications', 'info'];

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
        } else if (state.mainTab === 'shop') {
          const currentIndex = shopSubTabs.indexOf(state.shopSubTab);
          const newIndex = direction === 'next'
            ? Math.min(currentIndex + 1, shopSubTabs.length - 1)
            : Math.max(currentIndex - 1, 0);
          set({ shopSubTab: shopSubTabs[newIndex] });
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

      setCoins: (amount) => set((state) => ({
        player: {
          ...state.player,
          coins: Math.max(0, amount),
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

      setUniversalPoints: (amount) => set((state) => ({
        player: {
          ...state.player,
          universalPoints: Math.max(0, amount),
        },
      })),

      addMiningXp: (amount) => {
        const state = get();
        const skill = state.player.miningSkill || createDefaultSkillStats();
        let newXp = skill.xp + amount;
        let newLevel = skill.level;
        let newXpToNextLevel = skill.xpToNextLevel;
        let levelsGained = 0;

        while (newXp >= newXpToNextLevel) {
          newXp -= newXpToNextLevel;
          newLevel++;
          newXpToNextLevel = getSkillXpForLevel(newLevel);
          levelsGained++;
        }

        set({
          player: {
            ...state.player,
            miningSkill: {
              level: newLevel,
              xp: newXp,
              xpToNextLevel: newXpToNextLevel,
            },
          },
        });

        if (levelsGained > 0) {
          get().addXp(levelsGained * 25);
        }
      },

      addFarmingXp: (amount) => {
        const state = get();
        const skill = state.player.farmingSkill || createDefaultSkillStats();
        let newXp = skill.xp + amount;
        let newLevel = skill.level;
        let newXpToNextLevel = skill.xpToNextLevel;
        let levelsGained = 0;

        while (newXp >= newXpToNextLevel) {
          newXp -= newXpToNextLevel;
          newLevel++;
          newXpToNextLevel = getSkillXpForLevel(newLevel);
          levelsGained++;
        }

        set({
          player: {
            ...state.player,
            farmingSkill: {
              level: newLevel,
              xp: newXp,
              xpToNextLevel: newXpToNextLevel,
            },
          },
        });

        if (levelsGained > 0) {
          get().addXp(levelsGained * 25);
        }
      },

      addDungeonXp: (amount) => {
        const state = get();
        const skill = state.player.dungeonSkill || createDefaultSkillStats();
        let newXp = skill.xp + amount;
        let newLevel = skill.level;
        let newXpToNextLevel = skill.xpToNextLevel;
        let levelsGained = 0;

        while (newXp >= newXpToNextLevel) {
          newXp -= newXpToNextLevel;
          newLevel++;
          newXpToNextLevel = getSkillXpForLevel(newLevel);
          levelsGained++;
        }

        set({
          player: {
            ...state.player,
            dungeonSkill: {
              level: newLevel,
              xp: newXp,
              xpToNextLevel: newXpToNextLevel,
            },
          },
        });

        if (levelsGained > 0) {
          get().addXp(levelsGained * 25);
        }
      },

      addItemToStorage: (itemId, quantity) => {
        const state = get();
        const firstUnit = state.storageSystem.units[0];
        if (!firstUnit) return false;
        
        return get().addItemToStorageUnit(firstUnit.id, itemId, quantity);
      },

      removeItemFromStorage: (itemId, quantity) => {
        const state = get();
        const firstUnit = state.storageSystem.units[0];
        if (!firstUnit) return false;
        
        return get().removeItemFromStorageUnit(firstUnit.id, itemId, quantity);
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
        const firstUnit = state.storageSystem.units[0];
        if (!firstUnit) return false;
        
        return get().moveFromStorageUnitToInventory(firstUnit.id, itemId, quantity);
      },

      moveToStorage: (itemId, quantity) => {
        const state = get();
        const firstUnit = state.storageSystem.units[0];
        if (!firstUnit) return false;
        
        return get().moveFromInventoryToStorageUnit(firstUnit.id, itemId, quantity);
      },

      getStorageUsed: () => {
        const state = get();
        const firstUnit = state.storageSystem.units[0];
        if (!firstUnit) return 0;
        return firstUnit.items.length;
      },

      getInventoryUsed: () => {
        const state = get();
        return state.inventory.items.reduce((sum, item) => sum + item.quantity, 0);
      },

      sellItem: (itemId, quantity) => {
        const state = get();
        const item = getItemById(itemId);
        if (!item) return false;
        
        if (isLimitedItem(item)) return false;

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

        const updatedUnits = state.storageSystem.units.map(unit => {
          const remainingItems: typeof unit.items = [];
          
          for (const invItem of unit.items) {
            const item = getItemById(invItem.itemId);
            if (item) {
              if (isLimitedItem(item)) {
                remainingItems.push(invItem);
              } else {
                const earnings = item.sellPrice * invItem.quantity;
                totalEarnings += earnings;
                totalItems += invItem.quantity;
              }
            }
          }
          return { ...unit, items: remainingItems };
        });

        if (totalItems > 0) {
          set({
            storageSystem: {
              ...state.storageSystem,
              units: updatedUnits,
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

      bulkSellItems: (items) => {
        const state = get();
        let totalEarnings = 0;
        let totalItemsSold = 0;
        
        const updatedUnits = state.storageSystem.units.map(unit => {
          const newUnitItems = [...unit.items];
          
          for (const sellItem of items) {
            const item = getItemById(sellItem.itemId);
            if (!item) continue;
            
            if (isLimitedItem(item)) continue;
            
            const storageIndex = newUnitItems.findIndex(i => i.itemId === sellItem.itemId);
            if (storageIndex < 0) continue;
            
            const actualQuantity = Math.min(sellItem.quantity, newUnitItems[storageIndex].quantity);
            if (actualQuantity <= 0) continue;
            
            totalEarnings += item.sellPrice * actualQuantity;
            totalItemsSold += actualQuantity;
            
            if (newUnitItems[storageIndex].quantity === actualQuantity) {
              newUnitItems.splice(storageIndex, 1);
            } else {
              newUnitItems[storageIndex] = {
                ...newUnitItems[storageIndex],
                quantity: newUnitItems[storageIndex].quantity - actualQuantity,
              };
            }
          }
          
          return { ...unit, items: newUnitItems };
        });
        
        if (totalItemsSold > 0) {
          set({
            storageSystem: {
              ...state.storageSystem,
              units: updatedUnits,
            },
            player: {
              ...state.player,
              coins: state.player.coins + totalEarnings,
              totalCoinsEarned: state.player.totalCoinsEarned + totalEarnings,
              totalItemsSold: state.player.totalItemsSold + totalItemsSold,
            }
          });
          get().addTransaction('sell', totalEarnings, `Bulk Sold (${totalItemsSold} items)`);
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

      purchaseStorageUnit: () => {
        const state = get();
        if (state.storageSystem.units.length >= MAX_STORAGE_UNITS) return false;
        if (state.player.coins < STORAGE_UNIT_PURCHASE_COST) return false;

        get().spendCoins(STORAGE_UNIT_PURCHASE_COST);
        const newUnitId = `storage_${state.storageSystem.units.length + 1}`;
        const newUnit: StorageUnit = {
          id: newUnitId,
          name: `Storage ${state.storageSystem.units.length + 1}`,
          maxSlots: STORAGE_UNIT_MAX_SLOTS,
          items: [],
        };

        set({
          storageSystem: {
            ...state.storageSystem,
            units: [...state.storageSystem.units, newUnit],
          },
        });
        return true;
      },

      renameStorageUnit: (unitId, newName) => {
        const state = get();
        const unitIndex = state.storageSystem.units.findIndex(u => u.id === unitId);
        if (unitIndex < 0) return false;

        const newUnits = [...state.storageSystem.units];
        newUnits[unitIndex] = { ...newUnits[unitIndex], name: newName.trim() || newUnits[unitIndex].name };

        set({
          storageSystem: {
            ...state.storageSystem,
            units: newUnits,
          },
        });
        return true;
      },

      selectStorageUnit: (unitId) => {
        const state = get();
        const unit = state.storageSystem.units.find(u => u.id === unitId);
        if (!unit) return;

        set({
          storageSystem: {
            ...state.storageSystem,
            selectedUnitId: unitId,
          },
        });
      },

      addItemToStorageUnit: (unitId, itemId, quantity) => {
        const state = get();
        const item = getItemById(itemId);
        if (!item) return false;

        const unitIndex = state.storageSystem.units.findIndex(u => u.id === unitId);
        if (unitIndex < 0) return false;

        const unit = state.storageSystem.units[unitIndex];
        const existingIndex = unit.items.findIndex(i => i.itemId === itemId);
        
        // Check if we need a new slot (unique item) - storage counts unique items, not total quantity
        if (existingIndex < 0 && unit.items.length >= unit.maxSlots) {
          // No room for a new unique item
          return false;
        }

        const newUnits = [...state.storageSystem.units];

        if (existingIndex >= 0) {
          const newItems = [...unit.items];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + quantity,
          };
          newUnits[unitIndex] = { ...unit, items: newItems };
        } else {
          newUnits[unitIndex] = { ...unit, items: [...unit.items, { itemId, quantity }] };
        }

        set({
          storageSystem: {
            ...state.storageSystem,
            units: newUnits,
          },
        });
        return true;
      },

      removeItemFromStorageUnit: (unitId, itemId, quantity) => {
        const state = get();
        const unitIndex = state.storageSystem.units.findIndex(u => u.id === unitId);
        if (unitIndex < 0) return false;

        const unit = state.storageSystem.units[unitIndex];
        const existingIndex = unit.items.findIndex(i => i.itemId === itemId);
        if (existingIndex < 0) return false;

        const currentQuantity = unit.items[existingIndex].quantity;
        if (currentQuantity < quantity) return false;

        const newItems = [...unit.items];
        if (currentQuantity === quantity) {
          newItems.splice(existingIndex, 1);
        } else {
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: currentQuantity - quantity,
          };
        }

        const newUnits = [...state.storageSystem.units];
        newUnits[unitIndex] = { ...unit, items: newItems };

        set({
          storageSystem: {
            ...state.storageSystem,
            units: newUnits,
          },
        });
        return true;
      },

      moveItemBetweenStorageUnits: (fromUnitId, toUnitId, itemId, quantity) => {
        const state = get();
        const fromUnit = state.storageSystem.units.find(u => u.id === fromUnitId);
        const toUnit = state.storageSystem.units.find(u => u.id === toUnitId);
        if (!fromUnit || !toUnit) return false;

        const fromItem = fromUnit.items.find(i => i.itemId === itemId);
        if (!fromItem) return false;

        const actualQuantity = Math.min(quantity, fromItem.quantity);
        if (actualQuantity <= 0) return false;

        // Check if destination has the item already or has room for a new unique item
        const existsInTarget = toUnit.items.some(i => i.itemId === itemId);
        if (!existsInTarget && toUnit.items.length >= toUnit.maxSlots) {
          return false; // No room for new unique item
        }

        get().removeItemFromStorageUnit(fromUnitId, itemId, actualQuantity);
        get().addItemToStorageUnit(toUnitId, itemId, actualQuantity);
        return true;
      },

      moveFromStorageUnitToInventory: (unitId, itemId, quantity) => {
        const state = get();
        const unit = state.storageSystem.units.find(u => u.id === unitId);
        if (!unit) return false;

        const storageItem = unit.items.find(i => i.itemId === itemId);
        if (!storageItem) return false;

        const actualQuantity = Math.min(quantity, storageItem.quantity);
        if (actualQuantity <= 0) return false;

        const existingInInventory = state.inventory.items.find(i => i.itemId === itemId);
        if (!existingInInventory && state.inventory.items.length >= state.inventory.maxSlots) {
          return false;
        }

        get().removeItemFromStorageUnit(unitId, itemId, actualQuantity);
        get().addItemToInventory(itemId, actualQuantity);
        return true;
      },

      moveFromInventoryToStorageUnit: (unitId, itemId, quantity) => {
        const state = get();
        const inventoryItem = state.inventory.items.find(i => i.itemId === itemId);
        if (!inventoryItem) return false;

        const unit = state.storageSystem.units.find(u => u.id === unitId);
        if (!unit) return false;

        // Check if item already exists in storage or if there's room for a new unique item
        const existsInStorage = unit.items.some(i => i.itemId === itemId);
        if (!existsInStorage && unit.items.length >= unit.maxSlots) {
          return false; // No room for new unique item
        }

        const actualQuantity = Math.min(quantity, inventoryItem.quantity);
        if (actualQuantity <= 0) return false;

        get().removeItemFromInventory(itemId, actualQuantity);
        get().addItemToStorageUnit(unitId, itemId, actualQuantity);
        return true;
      },

      getStorageUnitUsed: (unitId) => {
        const state = get();
        const unit = state.storageSystem.units.find(u => u.id === unitId);
        if (!unit) return 0;
        // Return count of unique items, not total quantity
        return unit.items.length;
      },

      getCurrentStorageUnit: () => {
        const state = get();
        return state.storageSystem.units.find(u => u.id === state.storageSystem.selectedUnitId);
      },

      sellItemFromStorageUnit: (unitId, itemId, quantity) => {
        const state = get();
        const item = getItemById(itemId);
        if (!item) return false;
        
        if (isLimitedItem(item)) return false;

        const success = get().removeItemFromStorageUnit(unitId, itemId, quantity);
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

      sellAllItemsFromStorageUnit: (unitId) => {
        const state = get();
        const unitIndex = state.storageSystem.units.findIndex(u => u.id === unitId);
        if (unitIndex < 0) return 0;

        const unit = state.storageSystem.units[unitIndex];
        let totalEarnings = 0;
        let totalItems = 0;
        const remainingItems: typeof unit.items = [];

        for (const invItem of unit.items) {
          const item = getItemById(invItem.itemId);
          if (item) {
            if (isLimitedItem(item)) {
              remainingItems.push(invItem);
            } else {
              const earnings = item.sellPrice * invItem.quantity;
              totalEarnings += earnings;
              totalItems += invItem.quantity;
            }
          }
        }

        if (totalItems > 0) {
          const newUnits = [...state.storageSystem.units];
          newUnits[unitIndex] = { ...unit, items: remainingItems };

          set({
            storageSystem: {
              ...state.storageSystem,
              units: newUnits,
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
        
        const storageFull = get().isStorageFull();

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
            
            if (totalOutput > 0) {
              get().addItemToStorage(generator.outputItemId, totalOutput);
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

        if (slot !== 'mainHand' && slot !== 'offHand') {
          if (item.type !== 'armor') return false;
          if (item.armorSlot !== slot) return false;
        }

        const currentEquippedId = state.equipment[slot];

        const removeSuccess = get().removeItemFromInventory(itemId, 1);
        if (!removeSuccess) return false;

        if (currentEquippedId) {
          get().addItemToInventory(currentEquippedId, 1);
        }

        const newDurability = (slot === 'mainHand' || slot === 'offHand') && item.stats?.durability
          ? item.stats.durability
          : null;

        set((state) => ({
          equipment: {
            ...state.equipment,
            [slot]: itemId,
          },
          equipmentDurability: {
            ...state.equipmentDurability,
            [slot]: newDurability,
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
        const firstUnit = state.storageSystem.units[0];
        if (!firstUnit) return true;
        return firstUnit.items.length >= firstUnit.maxSlots;
      },

      addBlockMined: (itemId) => {
        set((state) => ({
          miningStats: {
            totalBlocksMined: state.miningStats.totalBlocksMined + 1,
            blocksMined: {
              ...state.miningStats.blocksMined,
              [itemId]: (state.miningStats.blocksMined[itemId] || 0) + 1,
            },
          },
        }));
      },

      getMiningStats: () => {
        return get().miningStats;
      },

      getEquippedPickaxe: () => {
        const state = get();
        const mainHandItem = state.equipment.mainHand;
        if (!mainHandItem) return null;
        
        const item = getItemById(mainHandItem);
        if (item && item.toolType === 'pickaxe') {
          // Check if pickaxe is broken (durability = 0)
          const durability = state.equipmentDurability.mainHand;
          if (item.stats?.durability && durability !== null && durability <= 0) {
            return null; // Broken pickaxe can't be used for mining
          }
          return mainHandItem;
        }
        return null;
      },

      getEquipmentDurability: (slot) => {
        return get().equipmentDurability[slot];
      },

      setEquipmentDurability: (slot, durability) => {
        set((state) => ({
          equipmentDurability: {
            ...state.equipmentDurability,
            [slot]: durability,
          },
        }));
      },

      usePickaxeDurability: () => {
        const state = get();
        const mainHandItem = state.equipment.mainHand;
        if (!mainHandItem) return false;

        const pickaxe = getItemById(mainHandItem);
        if (!pickaxe || pickaxe.toolType !== 'pickaxe') return false;
        if (!pickaxe.stats?.durability) return true;

        let currentDurability = state.equipmentDurability.mainHand;
        
        if (currentDurability === null) {
          currentDurability = pickaxe.stats.durability;
        }

        // Item is already broken, can't use it
        if (currentDurability <= 0) {
          return false;
        }

        currentDurability -= 1;

        // Set durability to 0, but keep item equipped (broken but not deleted)
        set((state) => ({
          equipmentDurability: {
            ...state.equipmentDurability,
            mainHand: Math.max(0, currentDurability),
          },
        }));

        // Return false if item just broke, true if still usable
        return currentDurability > 0;
      },

      isEquipmentBroken: (slot: 'mainHand' | 'offHand') => {
        const state = get();
        const itemId = state.equipment[slot];
        if (!itemId) return false;

        const item = getItemById(itemId);
        if (!item || !item.stats?.durability) return false;

        const durability = state.equipmentDurability[slot];
        return durability !== null && durability <= 0;
      },

      sellSelectedItems: (items) => {
        const state = get();
        let totalEarnings = 0;
        let totalItemsSold = 0;

        const newStorageItems = [...state.storage.items];

        for (const sellItem of items) {
          const item = getItemById(sellItem.itemId);
          if (!item) continue;
          
          if (isLimitedItem(item)) continue;

          const storageIndex = newStorageItems.findIndex(i => i.itemId === sellItem.itemId);
          if (storageIndex < 0) continue;

          const actualQuantity = Math.min(sellItem.quantity, newStorageItems[storageIndex].quantity);
          if (actualQuantity <= 0) continue;

          totalEarnings += item.sellPrice * actualQuantity;
          totalItemsSold += actualQuantity;

          if (newStorageItems[storageIndex].quantity === actualQuantity) {
            newStorageItems.splice(storageIndex, 1);
          } else {
            newStorageItems[storageIndex] = {
              ...newStorageItems[storageIndex],
              quantity: newStorageItems[storageIndex].quantity - actualQuantity,
            };
          }
        }

        if (totalItemsSold > 0) {
          set({
            storage: {
              ...state.storage,
              items: newStorageItems,
            },
            player: {
              ...state.player,
              coins: state.player.coins + totalEarnings,
              totalCoinsEarned: state.player.totalCoinsEarned + totalEarnings,
              totalItemsSold: state.player.totalItemsSold + totalItemsSold,
            },
          });
          get().addTransaction('sell', totalEarnings, `Bulk Sold (${totalItemsSold} items)`);
        }

        return totalEarnings;
      },

      craftItem: (recipeId, quantity = 1) => {
        const state = get();
        const recipe = getRecipeById(recipeId);
        if (!recipe) return false;

        const craftCheck = canCraftRecipe(recipe, state.storage.items, state.player.coins, quantity);
        if (!craftCheck.canCraft) return false;

        const costPerItem = getCraftingCost(recipe);
        const totalCost = costPerItem * quantity;
        const newStorageItems = [...state.storage.items];
        
        for (const ingredient of recipe.ingredients) {
          const totalNeeded = ingredient.quantity * quantity;
          const idx = newStorageItems.findIndex(i => i.itemId === ingredient.itemId);
          if (idx >= 0) {
            if (newStorageItems[idx].quantity === totalNeeded) {
              newStorageItems.splice(idx, 1);
            } else {
              newStorageItems[idx] = {
                ...newStorageItems[idx],
                quantity: newStorageItems[idx].quantity - totalNeeded,
              };
            }
          }
        }

        const totalResultQuantity = recipe.resultQuantity * quantity;
        const existingIdx = newStorageItems.findIndex(i => i.itemId === recipe.resultItemId);
        const resultItem = getItemById(recipe.resultItemId);
        const maxStack = resultItem?.maxStack || 999999;
        
        if (existingIdx >= 0) {
          newStorageItems[existingIdx] = {
            ...newStorageItems[existingIdx],
            quantity: Math.min(newStorageItems[existingIdx].quantity + totalResultQuantity, maxStack),
          };
        } else {
          newStorageItems.push({
            itemId: recipe.resultItemId,
            quantity: totalResultQuantity,
          });
        }

        set({
          storage: {
            ...state.storage,
            items: newStorageItems,
          },
          player: {
            ...state.player,
            coins: state.player.coins - totalCost,
          },
        });

        return true;
      },
      
      getVendorStockPurchased: (vendorId, itemId) => {
        const state = get();
        return state.vendorStockPurchases[vendorId]?.[itemId] || 0;
      },
      
      purchaseVendorItem: (vendorId, itemId, quantity) => {
        const state = get();
        const currentPurchases = state.vendorStockPurchases[vendorId] || {};
        const currentQuantity = currentPurchases[itemId] || 0;
        
        set({
          vendorStockPurchases: {
            ...state.vendorStockPurchases,
            [vendorId]: {
              ...currentPurchases,
              [itemId]: currentQuantity + quantity,
            },
          },
        });
      },
      
      resetVendorStockIfNeeded: () => {
        const state = get();
        const currentSeed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
        
        if (state.vendorStockSeed !== currentSeed) {
          set({
            vendorStockPurchases: {},
            vendorStockSeed: currentSeed,
          });
        }
      },
      
      plantCrop: (farmId, slotIndex, seedId) => {
        const state = get();
        const farm = state.farming.farms.find(f => f.id === farmId);
        if (!farm || !farm.unlocked) return false;
        if (slotIndex < 0 || slotIndex >= farm.slots.length) return false;
        if (farm.slots[slotIndex] !== null) return false;
        
        const seed = SEED_ITEMS.find(s => s.id === seedId);
        if (!seed) return false;
        
        const hasSeeds = state.inventory.items.some(i => i.itemId === seedId && i.quantity > 0) ||
                        state.storage.items.some(i => i.itemId === seedId && i.quantity > 0);
        if (!hasSeeds) return false;
        
        const inventoryItem = state.inventory.items.find(i => i.itemId === seedId);
        const storageItem = state.storage.items.find(i => i.itemId === seedId);
        
        let newInventoryItems = [...state.inventory.items];
        let newStorageItems = [...state.storage.items];
        
        if (inventoryItem && inventoryItem.quantity > 0) {
          if (inventoryItem.quantity === 1) {
            newInventoryItems = newInventoryItems.filter(i => i.itemId !== seedId);
          } else {
            const idx = newInventoryItems.findIndex(i => i.itemId === seedId);
            newInventoryItems[idx] = { ...inventoryItem, quantity: inventoryItem.quantity - 1 };
          }
        } else if (storageItem && storageItem.quantity > 0) {
          if (storageItem.quantity === 1) {
            newStorageItems = newStorageItems.filter(i => i.itemId !== seedId);
          } else {
            const idx = newStorageItems.findIndex(i => i.itemId === seedId);
            newStorageItems[idx] = { ...storageItem, quantity: storageItem.quantity - 1 };
          }
        }
        
        const cropId = seedId.replace('_seeds', '');
        const growthTime = seed.growthTime || 300;
        
        const newCrop: PlantedCrop = {
          seedId,
          cropId,
          plantedAt: Date.now(),
          growthStage: 0,
          maxGrowthStage: 4,
          growthTime,
          watered: false,
          wateredAt: null,
        };
        
        const newFarms = state.farming.farms.map(f => {
          if (f.id === farmId) {
            const newSlots = [...f.slots];
            newSlots[slotIndex] = newCrop;
            return { ...f, slots: newSlots };
          }
          return f;
        });
        
        set({
          farming: { ...state.farming, farms: newFarms },
          inventory: { ...state.inventory, items: newInventoryItems },
          storage: { ...state.storage, items: newStorageItems },
        });
        
        return true;
      },
      
      waterCrop: (farmId, slotIndex) => {
        const state = get();
        const farm = state.farming.farms.find(f => f.id === farmId);
        if (!farm || !farm.unlocked) return false;
        if (slotIndex < 0 || slotIndex >= farm.slots.length) return false;
        
        const crop = farm.slots[slotIndex];
        if (!crop) return false;
        if (crop.watered) return false;
        
        if (state.farming.wateringCanUses <= 0) return false;
        
        const newFarms = state.farming.farms.map(f => {
          if (f.id === farmId) {
            const newSlots = [...f.slots];
            newSlots[slotIndex] = {
              ...crop,
              watered: true,
              wateredAt: Date.now(),
            };
            return { ...f, slots: newSlots };
          }
          return f;
        });
        
        set({
          farming: {
            ...state.farming,
            farms: newFarms,
            wateringCanUses: state.farming.wateringCanUses - 1,
          },
        });
        
        return true;
      },
      
      harvestCrop: (farmId, slotIndex) => {
        const state = get();
        const farm = state.farming.farms.find(f => f.id === farmId);
        if (!farm || !farm.unlocked) return false;
        if (slotIndex < 0 || slotIndex >= farm.slots.length) return false;
        
        const crop = farm.slots[slotIndex];
        if (!crop) return false;
        if (crop.growthStage < crop.maxGrowthStage) return false;
        
        const cropItem = CROP_ITEMS.find(c => c.id === crop.cropId);
        if (!cropItem) return false;
        
        const yieldAmount = Math.floor(1 + Math.random() * 3);
        const xpGain = cropItem.stats?.xpGain || 10;
        
        const added = get().addItemToStorage(crop.cropId, yieldAmount);
        if (!added) return false;
        
        get().addFarmingXp(xpGain);
        
        const newFarms = state.farming.farms.map(f => {
          if (f.id === farmId) {
            const newSlots = [...f.slots];
            newSlots[slotIndex] = null;
            return { ...f, slots: newSlots };
          }
          return f;
        });
        
        set({
          farming: { ...state.farming, farms: newFarms },
        });
        
        return true;
      },
      
      harvestAllCrops: (farmId) => {
        const state = get();
        const farm = state.farming.farms.find(f => f.id === farmId);
        if (!farm || !farm.unlocked) return 0;
        
        let harvestedCount = 0;
        
        for (let i = 0; i < farm.slots.length; i++) {
          const crop = farm.slots[i];
          if (crop && crop.growthStage >= crop.maxGrowthStage) {
            if (get().harvestCrop(farmId, i)) {
              harvestedCount++;
            }
          }
        }
        
        return harvestedCount;
      },
      
      upgradeFarm: (farmId) => {
        const state = get();
        const farm = state.farming.farms.find(f => f.id === farmId);
        if (!farm || !farm.unlocked) return false;
        
        const currentTier = farm.tier;
        const upgrade = FARM_TIER_UPGRADES.find(u => u.tier === currentTier + 1);
        if (!upgrade) return false;
        
        if (state.player.coins < upgrade.cost) return false;
        
        get().spendCoins(upgrade.cost);
        
        const newSlotCount = upgrade.slots;
        const newSlots = [...farm.slots];
        while (newSlots.length < newSlotCount) {
          newSlots.push(null);
        }
        
        const newFarms = state.farming.farms.map(f => {
          if (f.id === farmId) {
            return { ...f, tier: upgrade.tier, slots: newSlots };
          }
          return f;
        });
        
        set({
          farming: { ...state.farming, farms: newFarms },
        });
        
        return true;
      },
      
      unlockFarm: (farmId) => {
        const state = get();
        const farm = state.farming.farms.find(f => f.id === farmId);
        if (!farm) return false;
        if (farm.unlocked) return false;
        
        const unlockInfo = FARM_UNLOCK_COSTS.find(u => u.farmId === farmId);
        const unlockCost = unlockInfo?.cost || 0;
        
        if (state.player.coins < unlockCost) return false;
        
        get().spendCoins(unlockCost);
        
        const newFarms = state.farming.farms.map(f => {
          if (f.id === farmId) {
            return { ...f, unlocked: true };
          }
          return f;
        });
        
        set({
          farming: { ...state.farming, farms: newFarms },
        });
        
        return true;
      },
      
      setSelectedFarm: (farmId) => {
        set((state) => ({
          farming: { ...state.farming, selectedFarmId: farmId },
        }));
      },
      
      tickFarming: () => {
        const state = get();
        const now = Date.now();
        let hasChanges = false;
        
        const newFarms = state.farming.farms.map(farm => {
          if (!farm.unlocked) return farm;
          
          const newSlots = farm.slots.map(crop => {
            if (!crop) return null;
            if (crop.growthStage >= crop.maxGrowthStage) return crop;
            
            const elapsedMs = now - crop.plantedAt;
            const elapsedSeconds = elapsedMs / 1000;
            const growthSpeedMultiplier = crop.watered ? 2.0 : 1.0;
            const adjustedGrowthTime = crop.growthTime / growthSpeedMultiplier;
            const stageTime = adjustedGrowthTime / crop.maxGrowthStage;
            const newStage = Math.min(crop.maxGrowthStage, Math.floor(elapsedSeconds / stageTime));
            
            if (newStage !== crop.growthStage) {
              hasChanges = true;
              return { ...crop, growthStage: newStage };
            }
            
            return crop;
          });
          
          return { ...farm, slots: newSlots };
        });
        
        if (hasChanges) {
          set({
            farming: { ...state.farming, farms: newFarms },
          });
        }
      },
      
      getWateringCanUses: () => {
        return get().farming.wateringCanUses;
      },
      
      getBestWateringCan: () => {
        const state = get();
        const allItems = [...state.inventory.items, ...state.storage.items];
        
        let bestCan = null;
        let bestCapacity = 0;
        
        for (const tier of WATERING_CAN_TIERS) {
          if (allItems.some(i => i.itemId === tier.id)) {
            if (tier.capacity > bestCapacity) {
              bestCapacity = tier.capacity;
              bestCan = tier;
            }
          }
        }
        
        return bestCan;
      },
      
      refillWateringCan: () => {
        const state = get();
        const bestCan = get().getBestWateringCan();
        
        if (!bestCan) return { success: false, reason: 'no_can' };
        if (state.farming.wateringCanUses >= bestCan.capacity) return { success: false, reason: 'already_full' };
        
        if (state.player.coins < bestCan.refillCost) return { success: false, reason: 'no_coins' };
        
        get().spendCoins(bestCan.refillCost);
        
        set((prevState) => ({
          farming: { 
            ...prevState.farming, 
            wateringCanUses: bestCan.capacity,
            maxWaterCapacity: bestCan.capacity,
          },
        }));
        
        return { success: true, capacity: bestCan.capacity, cost: bestCan.refillCost };
      },
      
      addLimitedPurchase: (itemId) => {
        const state = get();
        if (!state.limitedPurchases.includes(itemId)) {
          set({ limitedPurchases: [...state.limitedPurchases, itemId] });
        }
      },
    }),
    {
      name: 'isleforge-storage',
      partialize: (state) => ({
        player: state.player,
        storage: state.storage,
        inventory: state.inventory,
        equipment: state.equipment,
        equipmentDurability: state.equipmentDurability,
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
        miningStats: state.miningStats,
        vendorStockPurchases: state.vendorStockPurchases,
        vendorStockSeed: state.vendorStockSeed,
        farming: state.farming,
        limitedPurchases: state.limitedPurchases,
      }),
    }
  )
);
