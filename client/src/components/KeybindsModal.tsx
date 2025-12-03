import { useState } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { KeybindAction, getKeyDisplayName } from '@/lib/gameTypes';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RotateCcw, Keyboard } from 'lucide-react';

interface KeybindsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeybindsModal({ open, onOpenChange }: KeybindsModalProps) {
  const keybinds = useGameStore((s) => s.keybinds);
  const setKeybind = useGameStore((s) => s.setKeybind);
  const resetKeybinds = useGameStore((s) => s.resetKeybinds);
  const [listeningFor, setListeningFor] = useState<KeybindAction | null>(null);

  const keybindConfig: { action: KeybindAction; label: string; description: string }[] = [
    { action: 'openInventory', label: 'Inventory', description: 'Open/close inventory' },
    { action: 'quickSave', label: 'Quick Save', description: 'Save game progress' },
    { action: 'islandTab', label: 'Island Tab', description: 'Switch to Island' },
    { action: 'hubTab', label: 'Hub Tab', description: 'Switch to Hub' },
    { action: 'shopTab', label: 'Shop Tab', description: 'Switch to Shop' },
    { action: 'settingsTab', label: 'Settings Tab', description: 'Switch to Settings' },
    { action: 'prevSubTab', label: 'Previous Tab', description: 'Go to previous sub-tab' },
    { action: 'nextSubTab', label: 'Next Tab', description: 'Go to next sub-tab' },
  ];

  const handleKeyCapture = (action: KeybindAction, key: string) => {
    setKeybind(action, key);
    setListeningFor(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="pixel-border border-border bg-card max-w-md">
        <DialogHeader>
          <DialogTitle className="pixel-text text-lg flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keybinds
          </DialogTitle>
          <DialogDescription className="font-sans">
            Click any keybind to change it. Press ESC to cancel.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-pixel pr-2">
          {keybindConfig.map(({ action, label, description }) => (
            <KeybindRowModal
              key={action}
              action={action}
              label={label}
              description={description}
              currentKey={keybinds[action]}
              isListening={listeningFor === action}
              onStartListening={() => setListeningFor(action)}
              onKeyCapture={(key) => handleKeyCapture(action, key)}
              onCancel={() => setListeningFor(null)}
            />
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={resetKeybinds}
            className="pixel-text-sm text-[8px] gap-1"
            data-testid="button-reset-all-keybinds"
          >
            <RotateCcw className="w-3 h-3" />
            Reset All
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="pixel-text-sm"
            data-testid="button-close-keybinds"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface KeybindRowModalProps {
  action: KeybindAction;
  label: string;
  description: string;
  currentKey: string;
  isListening: boolean;
  onStartListening: () => void;
  onKeyCapture: (key: string) => void;
  onCancel: () => void;
}

function KeybindRowModal({
  action,
  label,
  description,
  currentKey,
  isListening,
  onStartListening,
  onKeyCapture,
  onCancel,
}: KeybindRowModalProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.code === 'Escape') {
      onCancel();
      return;
    }

    onKeyCapture(e.code);
  };

  return (
    <div className="flex items-center justify-between gap-4 p-2 bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="pixel-text-sm text-[9px] text-foreground">{label}</p>
        <p className="font-sans text-xs text-muted-foreground truncate">{description}</p>
      </div>
      {isListening ? (
        <div
          className="pixel-border border-primary bg-primary/20 px-3 py-1.5 animate-pulse min-w-[80px] text-center"
          tabIndex={0}
          autoFocus
          onKeyDown={handleKeyDown}
          onBlur={onCancel}
          data-testid={`keybind-input-${action}`}
          data-keybind-capture="true"
        >
          <span className="pixel-text-sm text-[8px] text-primary">Press key...</span>
        </div>
      ) : (
        <button
          onClick={onStartListening}
          className="pixel-border border-border bg-background px-3 py-1.5 hover-elevate active-elevate-2 min-w-[80px] text-center cursor-pointer"
          data-testid={`keybind-${action}`}
        >
          <span className="pixel-text-sm text-[9px]">{getKeyDisplayName(currentKey)}</span>
        </button>
      )}
    </div>
  );
}
