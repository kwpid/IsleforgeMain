import { useGameStore } from '@/lib/gameStore';
import { formatNumber } from '@/lib/gameTypes';
import { getItemsByType } from '@/lib/items';
import { PixelIcon } from './PixelIcon';
import { ItemTooltip } from './ItemTooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function HubTab() {
  const hubSubTab = useGameStore((s) => s.hubSubTab);

  return (
    <div className="h-full overflow-y-auto scrollbar-pixel p-6">
      {hubSubTab === 'marketplace' && <MarketplaceView />}
      {hubSubTab === 'dungeons' && <DungeonsView />}
    </div>
  );
}

function MarketplaceView() {
  const tools = getItemsByType('tool').slice(0, 4);
  const armor = getItemsByType('armor').slice(0, 4);
  const potions = getItemsByType('potion').slice(0, 4);
  const minerals = getItemsByType('mineral').slice(0, 4);

  return (
    <div>
      <h2 className="pixel-text text-lg text-foreground mb-2">
        Marketplace
      </h2>
      <p className="font-sans text-muted-foreground mb-6">
        Browse and purchase items from other players and NPCs.
      </p>

      <div className="space-y-8">
        <MarketSection title="Tools" items={tools} />
        <MarketSection title="Armor" items={armor} />
        <MarketSection title="Potions" items={potions} />
        <MarketSection title="Minerals" items={minerals} />
      </div>
    </div>
  );
}

interface MarketSectionProps {
  title: string;
  items: ReturnType<typeof getItemsByType>;
}

function MarketSection({ title, items }: MarketSectionProps) {
  return (
    <div>
      <h3 className="pixel-text-sm text-muted-foreground mb-4">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => {
          const buyPrice = Math.floor(item.sellPrice * 2.5);
          
          return (
            <Card key={item.id} className="pixel-border border-card-border">
              <CardHeader className="p-3 pb-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex justify-center">
                      <div className={cn(
                        'pixel-border p-2 bg-muted/30',
                        `rarity-${item.rarity}`
                      )}>
                        <PixelIcon icon={item.icon} size="xl" />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="p-0 border-0 bg-transparent">
                    <ItemTooltip item={item} />
                  </TooltipContent>
                </Tooltip>
              </CardHeader>
              <CardContent className="p-3 text-center">
                <CardTitle className="pixel-text-sm text-sm mb-1">
                  {item.name}
                </CardTitle>
                <div className="flex items-center justify-center gap-1">
                  <PixelIcon icon="coin" size="sm" />
                  <span className="pixel-text-sm text-game-coin tabular-nums">
                    {formatNumber(buyPrice)}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="p-3 pt-0">
                <Button 
                  className="w-full pixel-text-sm" 
                  size="sm"
                  disabled
                  data-testid={`button-buy-${item.id}`}
                >
                  Coming Soon
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function DungeonsView() {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-center">
      <div className="pixel-border-thick border-dashed border-muted p-12 bg-muted/10">
        <PixelIcon icon="dungeon" size="xl" className="mx-auto mb-6 opacity-50" />
        <h2 className="pixel-text text-xl text-muted-foreground mb-4">
          DUNGEONS
        </h2>
        <p className="font-sans text-muted-foreground max-w-md">
          Explore dangerous dungeons, fight powerful enemies, and collect rare loot.
          This feature is coming in a future update!
        </p>
        <div className="mt-6 pixel-border bg-accent/20 border-accent px-4 py-2 inline-block">
          <span className="pixel-text-sm text-accent-foreground">COMING SOON</span>
        </div>
      </div>
    </div>
  );
}
