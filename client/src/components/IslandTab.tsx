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
  const upgradeGenerator = useGameStore((s) => s.upgradeGenerator);

  const ownedGenerators = GENERATORS.filter((gen) => 
    unlockedGenerators.includes(gen.id)
  );

  return (
    <div>
      <h2 className="pixel-text text-lg text-foreground mb-2">
        Resource Generators
      </h2>
      <p className="font-sans text-muted-foreground text-sm mb-6">
        Your active generators producing resources. Build more from blueprints!
      </p>
      
      {ownedGenerators.length === 0 ? (
        <div className="pixel-border border-border bg-card p-8 text-center">
          <p className="pixel-text-sm text-muted-foreground">
            No generators yet. Visit the Hub to get blueprints and build your first generator!
          </p>
        </div>
      ) : (
        <div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          data-testid="generators-grid"
        >
          {ownedGenerators.map((generator) => {
            const owned = generators.find((g) => g.generatorId === generator.id);

            return (
              <GeneratorCard
                key={generator.id}
                generator={generator}
                owned={owned}
                onUnlock={() => {}}
                onUpgrade={() => upgradeGenerator(generator.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
