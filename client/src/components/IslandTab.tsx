import { useGameStore } from '@/lib/gameStore';
import { GENERATORS } from '@/lib/generators';
import { GeneratorCard } from './GeneratorCard';
import { StorageView } from './StorageView';

export function IslandTab() {
  const islandSubTab = useGameStore((s) => s.islandSubTab);

  return (
    <div className="h-full overflow-y-auto scrollbar-pixel p-6">
      {islandSubTab === 'generators' && <GeneratorsView />}
      {islandSubTab === 'storage' && <StorageView />}
    </div>
  );
}

function GeneratorsView() {
  const generators = useGameStore((s) => s.generators);
  const unlockedGenerators = useGameStore((s) => s.unlockedGenerators);
  const unlockGenerator = useGameStore((s) => s.unlockGenerator);
  const upgradeGenerator = useGameStore((s) => s.upgradeGenerator);

  return (
    <div>
      <h2 className="pixel-text text-lg text-foreground mb-6">
        Resource Generators
      </h2>
      
      <div 
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        data-testid="generators-grid"
      >
        {GENERATORS.map((generator) => {
          const owned = generators.find((g) => g.generatorId === generator.id);
          const isUnlocked = unlockedGenerators.includes(generator.id);

          return (
            <GeneratorCard
              key={generator.id}
              generator={generator}
              owned={isUnlocked ? owned : undefined}
              onUnlock={() => unlockGenerator(generator.id)}
              onUpgrade={() => upgradeGenerator(generator.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
