import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlayerStats } from './PlayerStats';

interface MobileStatsPanelProps {
  className?: string;
}

export function MobileStatsPanel({ className }: MobileStatsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            'fixed right-0 top-1/2 -translate-y-1/2 z-40',
            'flex items-center justify-center',
            'w-6 h-16 bg-card border-l-2 border-t-2 border-b-2 border-primary',
            'text-primary hover-elevate active-elevate-2',
            'transition-all duration-200',
            className
          )}
          data-testid="button-open-stats-panel"
          aria-label="Open player stats"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      <div
        className={cn(
          'fixed right-0 top-0 bottom-0 z-50',
          'w-72 bg-card border-l-2 border-primary',
          'slide-panel-right',
          isOpen && 'open'
        )}
      >
        <div className="flex items-center justify-between p-3 border-b border-border">
          <span className="pixel-text-sm text-primary">PLAYER STATS</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover-elevate active-elevate-2 text-muted-foreground hover:text-foreground"
            data-testid="button-close-stats-panel"
            aria-label="Close stats panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="h-[calc(100%-3rem)] overflow-y-auto scrollbar-pixel safe-area-bottom">
          <PlayerStats />
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
