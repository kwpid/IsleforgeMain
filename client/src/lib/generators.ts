import { GeneratorDefinition } from './gameTypes';

export const GENERATORS: GeneratorDefinition[] = [
  {
    id: 'cobblestone_generator',
    name: 'Cobblestone Generator',
    description: 'Produces cobblestone from lava and water.',
    icon: 'cobblestone',
    baseOutput: 1,
    baseInterval: 5000,
    outputItemId: 'cobblestone',
    unlockCost: 0,
    tiers: [
      { tier: 1, romanNumeral: 'I', outputMultiplier: 1, speedMultiplier: 1, upgradeCost: 0 },
      { tier: 2, romanNumeral: 'II', outputMultiplier: 2, speedMultiplier: 0.9, upgradeCost: 100 },
      { tier: 3, romanNumeral: 'III', outputMultiplier: 3, speedMultiplier: 0.75, upgradeCost: 500 },
      { tier: 4, romanNumeral: 'IV', outputMultiplier: 5, speedMultiplier: 0.6, upgradeCost: 2500 },
      { tier: 5, romanNumeral: 'V', outputMultiplier: 8, speedMultiplier: 0.4, upgradeCost: 10000 },
    ],
  },
  {
    id: 'wood_farmer',
    name: 'Wood Farmer',
    description: 'Automatically grows and harvests oak logs.',
    icon: 'oak_log',
    baseOutput: 3,
    baseInterval: 5000,
    outputItemId: 'oak_log',
    unlockCost: 500,
    tiers: [
      { tier: 1, romanNumeral: 'I', outputMultiplier: 1, speedMultiplier: 1, upgradeCost: 0 },
      { tier: 2, romanNumeral: 'II', outputMultiplier: 1.5, speedMultiplier: 0.85, upgradeCost: 750 },
      { tier: 3, romanNumeral: 'III', outputMultiplier: 2, speedMultiplier: 0.7, upgradeCost: 3000 },
      { tier: 4, romanNumeral: 'IV', outputMultiplier: 3, speedMultiplier: 0.55, upgradeCost: 12000 },
      { tier: 5, romanNumeral: 'V', outputMultiplier: 5, speedMultiplier: 0.35, upgradeCost: 50000 },
    ],
  },
  {
    id: 'coal_miner',
    name: 'Coal Miner',
    description: 'Mines coal from deep underground.',
    icon: 'coal',
    baseOutput: 1,
    baseInterval: 8000,
    outputItemId: 'coal',
    unlockCost: 2000,
    tiers: [
      { tier: 1, romanNumeral: 'I', outputMultiplier: 1, speedMultiplier: 1, upgradeCost: 0 },
      { tier: 2, romanNumeral: 'II', outputMultiplier: 2, speedMultiplier: 0.9, upgradeCost: 3000 },
      { tier: 3, romanNumeral: 'III', outputMultiplier: 3, speedMultiplier: 0.75, upgradeCost: 15000 },
      { tier: 4, romanNumeral: 'IV', outputMultiplier: 5, speedMultiplier: 0.6, upgradeCost: 60000 },
      { tier: 5, romanNumeral: 'V', outputMultiplier: 8, speedMultiplier: 0.4, upgradeCost: 250000 },
    ],
  },
  {
    id: 'iron_miner',
    name: 'Iron Miner',
    description: 'Extracts iron ore from the depths.',
    icon: 'iron_ore',
    baseOutput: 1,
    baseInterval: 12000,
    outputItemId: 'iron_ore',
    unlockCost: 10000,
    tiers: [
      { tier: 1, romanNumeral: 'I', outputMultiplier: 1, speedMultiplier: 1, upgradeCost: 0 },
      { tier: 2, romanNumeral: 'II', outputMultiplier: 2, speedMultiplier: 0.9, upgradeCost: 15000 },
      { tier: 3, romanNumeral: 'III', outputMultiplier: 3, speedMultiplier: 0.75, upgradeCost: 75000 },
      { tier: 4, romanNumeral: 'IV', outputMultiplier: 5, speedMultiplier: 0.6, upgradeCost: 300000 },
      { tier: 5, romanNumeral: 'V', outputMultiplier: 8, speedMultiplier: 0.4, upgradeCost: 1000000 },
    ],
  },
  {
    id: 'gold_miner',
    name: 'Gold Miner',
    description: 'Digs for precious gold ore.',
    icon: 'gold_ore',
    baseOutput: 1,
    baseInterval: 20000,
    outputItemId: 'gold_ore',
    unlockCost: 50000,
    tiers: [
      { tier: 1, romanNumeral: 'I', outputMultiplier: 1, speedMultiplier: 1, upgradeCost: 0 },
      { tier: 2, romanNumeral: 'II', outputMultiplier: 2, speedMultiplier: 0.9, upgradeCost: 75000 },
      { tier: 3, romanNumeral: 'III', outputMultiplier: 3, speedMultiplier: 0.75, upgradeCost: 350000 },
      { tier: 4, romanNumeral: 'IV', outputMultiplier: 5, speedMultiplier: 0.6, upgradeCost: 1500000 },
      { tier: 5, romanNumeral: 'V', outputMultiplier: 8, speedMultiplier: 0.4, upgradeCost: 5000000 },
    ],
  },
  {
    id: 'diamond_miner',
    name: 'Diamond Miner',
    description: 'Searches for rare diamonds at bedrock level.',
    icon: 'diamond',
    baseOutput: 1,
    baseInterval: 60000,
    outputItemId: 'diamond',
    unlockCost: 500000,
    tiers: [
      { tier: 1, romanNumeral: 'I', outputMultiplier: 1, speedMultiplier: 1, upgradeCost: 0 },
      { tier: 2, romanNumeral: 'II', outputMultiplier: 2, speedMultiplier: 0.85, upgradeCost: 750000 },
      { tier: 3, romanNumeral: 'III', outputMultiplier: 3, speedMultiplier: 0.7, upgradeCost: 3000000 },
      { tier: 4, romanNumeral: 'IV', outputMultiplier: 5, speedMultiplier: 0.55, upgradeCost: 12000000 },
      { tier: 5, romanNumeral: 'V', outputMultiplier: 8, speedMultiplier: 0.4, upgradeCost: 50000000 },
    ],
  },
];

export const GENERATORS_BY_ID: Record<string, GeneratorDefinition> = GENERATORS.reduce(
  (acc, gen) => {
    acc[gen.id] = gen;
    return acc;
  },
  {} as Record<string, GeneratorDefinition>
);

export function getGeneratorById(id: string): GeneratorDefinition | undefined {
  return GENERATORS_BY_ID[id];
}

export function getGeneratorOutput(generator: GeneratorDefinition, tier: number): number {
  const tierData = generator.tiers.find(t => t.tier === tier);
  if (!tierData) return generator.baseOutput;
  return Math.floor(generator.baseOutput * tierData.outputMultiplier);
}

export function getGeneratorInterval(generator: GeneratorDefinition, tier: number): number {
  const tierData = generator.tiers.find(t => t.tier === tier);
  if (!tierData) return generator.baseInterval;
  return Math.floor(generator.baseInterval * tierData.speedMultiplier);
}

export function getNextTierCost(generator: GeneratorDefinition, currentTier: number): number | null {
  const nextTier = generator.tiers.find(t => t.tier === currentTier + 1);
  return nextTier ? nextTier.upgradeCost : null;
}
