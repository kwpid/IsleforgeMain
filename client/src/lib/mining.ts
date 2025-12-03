import { MineableBlock } from './gameTypes';

export const MINEABLE_BLOCKS: MineableBlock[] = [
  {
    itemId: 'cobblestone',
    spawnChance: 35,
    breakTime: 1500,
    minPickaxeTier: 1,
    xpReward: 1,
  },
  {
    itemId: 'stone',
    spawnChance: 20,
    breakTime: 1800,
    minPickaxeTier: 1,
    xpReward: 2,
  },
  {
    itemId: 'dirt',
    spawnChance: 15,
    breakTime: 800,
    minPickaxeTier: 1,
    xpReward: 1,
  },
  {
    itemId: 'gravel',
    spawnChance: 10,
    breakTime: 1000,
    minPickaxeTier: 1,
    xpReward: 1,
  },
  {
    itemId: 'coal',
    spawnChance: 8,
    breakTime: 2000,
    minPickaxeTier: 1,
    xpReward: 3,
  },
  {
    itemId: 'iron_ore',
    spawnChance: 5,
    breakTime: 3000,
    minPickaxeTier: 2,
    xpReward: 5,
  },
  {
    itemId: 'gold_ore',
    spawnChance: 3,
    breakTime: 3500,
    minPickaxeTier: 3,
    xpReward: 8,
  },
  {
    itemId: 'diamond',
    spawnChance: 2,
    breakTime: 5000,
    minPickaxeTier: 3,
    xpReward: 15,
  },
  {
    itemId: 'emerald',
    spawnChance: 1.5,
    breakTime: 5500,
    minPickaxeTier: 3,
    xpReward: 20,
  },
  {
    itemId: 'obsidian',
    spawnChance: 0.4,
    breakTime: 10000,
    minPickaxeTier: 4,
    xpReward: 30,
  },
  {
    itemId: 'netherite_ingot',
    spawnChance: 0.1,
    breakTime: 15000,
    minPickaxeTier: 5,
    xpReward: 100,
  },
];

export function selectRandomBlock(): MineableBlock {
  const totalChance = MINEABLE_BLOCKS.reduce((sum, block) => sum + block.spawnChance, 0);
  let random = Math.random() * totalChance;
  
  for (const block of MINEABLE_BLOCKS) {
    random -= block.spawnChance;
    if (random <= 0) {
      return block;
    }
  }
  
  return MINEABLE_BLOCKS[0];
}

export function getBreakTime(block: MineableBlock, pickaxeTier: number, miningSpeed: number): number {
  if (pickaxeTier < block.minPickaxeTier) {
    return block.breakTime * 3;
  }
  
  const tierBonus = Math.max(0, pickaxeTier - block.minPickaxeTier) * 0.15;
  const speedMultiplier = 1 + (miningSpeed * 0.1);
  
  return Math.max(500, block.breakTime / (1 + tierBonus) / speedMultiplier);
}

export function canReceiveItem(block: MineableBlock, pickaxeTier: number): boolean {
  return pickaxeTier >= block.minPickaxeTier;
}

export function getBlocksByTier(minTier: number = 1): MineableBlock[] {
  return MINEABLE_BLOCKS.filter(block => block.minPickaxeTier <= minTier);
}
