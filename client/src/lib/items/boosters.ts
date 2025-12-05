import { BoosterDefinition } from '../gameTypes';

export const BOOSTER_ITEMS: BoosterDefinition[] = [
  {
    id: 'booster_cookie',
    name: 'Booster Cookie',
    description: 'A magical cookie infused with mining essence. Grants temporary mining bonuses.',
    icon: 'cookie.png',
    rarity: 'rare',
    sellPrice: 500,
    duration: 15 * 60,
    effects: [
      { stat: 'mining_speed', multiplier: 0.15 },
      { stat: 'mining_xp', multiplier: 0.05 },
      { stat: 'mining_luck', multiplier: 0.10 },
      { stat: 'sale_profit', multiplier: 0.01 },
    ],
    isEnchanted: true,
  },
  {
    id: 'booster_carrot',
    name: 'Booster Carrot',
    description: 'A magically enhanced carrot that accelerates crop growth. Especially effective for carrots!',
    icon: 'carrot.png',
    rarity: 'rare',
    sellPrice: 750,
    duration: 30 * 60,
    effects: [
      { stat: 'crop_speed_all', multiplier: 0.05 },
      { stat: 'crop_speed_carrot', multiplier: 0.50 },
      { stat: 'farming_xp', multiplier: 0.05 },
      { stat: 'farm_sale_profit', multiplier: 0.02 },
    ],
    isEnchanted: true,
  },
  {
    id: 'booster_potato',
    name: 'Booster Potato',
    description: 'A legendary spud imbued with ancient farming magic. The ultimate farming booster.',
    icon: 'potato.png',
    rarity: 'epic',
    sellPrice: 1000,
    duration: 30 * 60,
    effects: [
      { stat: 'crop_speed_all', multiplier: 0.06 },
      { stat: 'crop_speed_potato', multiplier: 0.07 },
      { stat: 'farming_xp', multiplier: 0.08 },
      { stat: 'farm_sale_profit', multiplier: 0.03 },
      { stat: 'potato_sale_profit', multiplier: 0.15 },
    ],
    isEnchanted: true,
    specialDescription: 'Tribute to a King',
  },
];

export const BOOSTERS_BY_ID: Record<string, BoosterDefinition> = BOOSTER_ITEMS.reduce(
  (acc, booster) => {
    acc[booster.id] = booster;
    return acc;
  },
  {} as Record<string, BoosterDefinition>
);

export function getBoosterById(id: string): BoosterDefinition | undefined {
  return BOOSTERS_BY_ID[id];
}

export function isBoosterItem(itemId: string): boolean {
  return !!BOOSTERS_BY_ID[itemId];
}

export function getBoosterDisplayStats(booster: BoosterDefinition): string[] {
  const displayLabels: Record<string, (mult: number) => string> = {
    'mining_speed': (m) => `+${(m * 100).toFixed(0)}% Faster Mining Time`,
    'mining_xp': (m) => `+${(m * 100).toFixed(0)}% More XP from Mining`,
    'mining_luck': (m) => `+${(m * 100).toFixed(0)}% Luck in Mining`,
    'sale_profit': (m) => `+${(m * 100).toFixed(0)}% Profit from Sales`,
    'crop_speed_all': (m) => `+${(m * 100).toFixed(0)}% Faster Crop Grow Time (All)`,
    'crop_speed_carrot': (m) => `+${(m * 100).toFixed(0)}% Faster Carrot Grow Time`,
    'crop_speed_potato': (m) => `+${(m * 100).toFixed(0)}% Faster Potato Grow Time`,
    'farming_xp': (m) => `+${(m * 100).toFixed(0)}% More XP from Farming`,
    'farm_sale_profit': (m) => `+${(m * 100).toFixed(0)}% More Profit from Farm Items`,
    'potato_sale_profit': (m) => `+${(m * 100).toFixed(0)}% More Profit from Potato Items`,
  };

  return booster.effects.map(effect => {
    const formatter = displayLabels[effect.stat];
    return formatter ? formatter(effect.multiplier) : `+${(effect.multiplier * 100).toFixed(0)}% ${effect.stat}`;
  });
}

export function formatBoosterDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  if (remainingSeconds > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${minutes}m`;
}
