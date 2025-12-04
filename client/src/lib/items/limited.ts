import { ItemDefinition, LimitedEffect } from "../gameTypes";

export type LimitedType = "stock" | "timer";

export interface LimitedItem extends ItemDefinition {
  isLimited: true;
  limitedEffect: LimitedEffect;
}

export interface LimitedPackage {
  id: string;
  name: string;
  description: string;
  itemIds: string[];
  limitType: LimitedType;
  startDate: Date;
  endDate?: Date;
  stock?: number;
  discountPercent: number;
  isMainShowcase: boolean;
  effect: LimitedEffect;
}

export const LIMITED_ITEMS: LimitedItem[] = [
  {
    id: "fiery_infernal_blade",
    name: "Fiery Infernal Blade",
    description:
      "A legendary blade forged in the depths of infernal flames. Burns with an eternal blue fire.",
    type: "tool",
    rarity: "limited",
    sellPrice: 15000,
    stackable: false,
    maxStack: 1,
    icon: "fiery_infernal_blade.png",
    toolType: "sword",
    stats: {
      attack_damage: 12,
      attack_speed: 1.8,
      durability: 5000,
      fire_damage: 8,
    },
    isSpecial: true,
    isEnchanted: true,
    isLimited: true,
    limitedEffect: "blue_flame",
  },
  {
    id: "fiery_infernal_pickaxe",
    name: "Fiery Infernal Pickaxe",
    description:
      "A powerful pickaxe infused with infernal energy. Its blue flames melt through stone like butter.",
    type: "tool",
    rarity: "limited",
    sellPrice: 10000,
    stackable: false,
    maxStack: 1,
    icon: "fiery_infernal_pickaxe.png",
    toolType: "pickaxe",
    stats: { mining_speed: 15, durability: 5000, fire_damage: 5 },
    isSpecial: true,
    isEnchanted: true,
    isLimited: true,
    limitedEffect: "blue_flame",
  },
];

export const LIMITED_PACKAGES: LimitedPackage[] = [
  {
    id: "fiery_infernal_pack",
    name: "Fiery Infernal Pack",
    description:
      "Harness the power of blue infernal flames with this exclusive weapon set. Limited time offer!",
    itemIds: ["fiery_infernal_blade", "fiery_infernal_pickaxe"],
    limitType: "timer",
    startDate: new Date("2025-12-04T00:00:00Z"),
    endDate: new Date("2025-12-18T00:00:00Z"),
    discountPercent: 10,
    isMainShowcase: true,
    effect: "blue_flame",
  },
];

export function getLimitedItemById(id: string): LimitedItem | undefined {
  return LIMITED_ITEMS.find((item) => item.id === id);
}

export function getActivePackages(): LimitedPackage[] {
  const now = new Date();
  return LIMITED_PACKAGES.filter((pkg) => {
    const hasStarted = now >= pkg.startDate;
    const hasNotEnded = !pkg.endDate || now <= pkg.endDate;
    return hasStarted && hasNotEnded;
  });
}

export function getPackageItems(pkg: LimitedPackage): LimitedItem[] {
  return pkg.itemIds
    .map((id) => getLimitedItemById(id))
    .filter((item): item is LimitedItem => item !== undefined);
}

export function getPackageTotalValue(pkg: LimitedPackage): number {
  const items = getPackageItems(pkg);
  return items.reduce((sum, item) => {
    const upPrice = Math.ceil(item.sellPrice / 10);
    return sum + upPrice;
  }, 0);
}

export function getPackageDiscountedPrice(pkg: LimitedPackage): number {
  const totalValue = getPackageTotalValue(pkg);
  return Math.ceil(totalValue * (1 - pkg.discountPercent / 100));
}

export function getRemainingTime(
  pkg: LimitedPackage,
): { days: number; hours: number; minutes: number; seconds: number } | null {
  if (!pkg.endDate) return null;

  const now = new Date();
  const diff = pkg.endDate.getTime() - now.getTime();

  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

export function isLimitedItem(item: ItemDefinition): item is LimitedItem {
  return "isLimited" in item && item.isLimited === true;
}
