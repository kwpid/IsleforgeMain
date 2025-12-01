import { useState } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function SettingsTab() {
  const settingsSubTab = useGameStore((s) => s.settingsSubTab);

  return (
    <div className="h-full overflow-y-auto scrollbar-pixel p-6">
      {settingsSubTab === 'general' && <GeneralSettings />}
      {settingsSubTab === 'audio' && <AudioSettings />}
      {settingsSubTab === 'controls' && <ControlsSettings />}
    </div>
  );
}

function GeneralSettings() {
  const resetGame = useGameStore((s) => s.resetGame);
  const saveGame = useGameStore((s) => s.saveGame);
  const lastSave = useGameStore((s) => s.lastSave);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [showFloatingNumbers, setShowFloatingNumbers] = useState(true);

  const lastSaveDate = new Date(lastSave);
  const lastSaveFormatted = lastSaveDate.toLocaleString();

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="pixel-text text-lg text-foreground mb-6">
        General Settings
      </h2>

      <Card className="pixel-border border-card-border">
        <CardHeader>
          <CardTitle className="pixel-text-sm">Save Data</CardTitle>
          <CardDescription className="font-sans">
            Manage your game save data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="pixel-text-sm">Auto Save</Label>
              <p className="text-sm text-muted-foreground font-sans">
                Automatically save progress every minute
              </p>
            </div>
            <Switch 
              checked={autoSave} 
              onCheckedChange={setAutoSave}
              data-testid="switch-autosave"
            />
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="pixel-text-sm">Last Saved</Label>
                <p className="text-sm text-muted-foreground font-sans">
                  {lastSaveFormatted}
                </p>
              </div>
              <Button 
                onClick={saveGame} 
                className="pixel-text-sm"
                data-testid="button-save-game"
              >
                Save Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="pixel-border border-card-border">
        <CardHeader>
          <CardTitle className="pixel-text-sm">Display</CardTitle>
          <CardDescription className="font-sans">
            Customize visual elements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="pixel-text-sm">Floating Numbers</Label>
              <p className="text-sm text-muted-foreground font-sans">
                Show +1 animations when resources are generated
              </p>
            </div>
            <Switch 
              checked={showFloatingNumbers} 
              onCheckedChange={setShowFloatingNumbers}
              data-testid="switch-floating-numbers"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="pixel-border border-destructive/50">
        <CardHeader>
          <CardTitle className="pixel-text-sm text-destructive">Danger Zone</CardTitle>
          <CardDescription className="font-sans">
            Irreversible actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="pixel-text-sm">Reset Game</Label>
              <p className="text-sm text-muted-foreground font-sans">
                Delete all progress and start fresh
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => setResetConfirm(true)}
              className="pixel-text-sm"
              data-testid="button-reset-game"
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={resetConfirm} onOpenChange={setResetConfirm}>
        <AlertDialogContent className="pixel-border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="pixel-text text-destructive">
              Reset Game?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-sans">
              This will permanently delete all your progress including levels, coins, 
              items, and generators. This action cannot be undone!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="pixel-text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={resetGame}
              className="pixel-text-sm bg-destructive"
              data-testid="button-confirm-reset"
            >
              Yes, Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AudioSettings() {
  const [masterVolume, setMasterVolume] = useState([50]);
  const [musicVolume, setMusicVolume] = useState([70]);
  const [sfxVolume, setSfxVolume] = useState([80]);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="pixel-text text-lg text-foreground mb-6">
        Audio Settings
      </h2>

      <Card className="pixel-border border-card-border">
        <CardHeader>
          <CardTitle className="pixel-text-sm">Volume</CardTitle>
          <CardDescription className="font-sans">
            Adjust audio levels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="pixel-text-sm">Master Volume</Label>
              <span className="pixel-text-sm text-muted-foreground tabular-nums">
                {masterVolume[0]}%
              </span>
            </div>
            <Slider
              value={masterVolume}
              onValueChange={setMasterVolume}
              max={100}
              step={5}
              className="w-full"
              data-testid="slider-master-volume"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="pixel-text-sm">Music Volume</Label>
              <span className="pixel-text-sm text-muted-foreground tabular-nums">
                {musicVolume[0]}%
              </span>
            </div>
            <Slider
              value={musicVolume}
              onValueChange={setMusicVolume}
              max={100}
              step={5}
              className="w-full"
              data-testid="slider-music-volume"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="pixel-text-sm">SFX Volume</Label>
              <span className="pixel-text-sm text-muted-foreground tabular-nums">
                {sfxVolume[0]}%
              </span>
            </div>
            <Slider
              value={sfxVolume}
              onValueChange={setSfxVolume}
              max={100}
              step={5}
              className="w-full"
              data-testid="slider-sfx-volume"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="pixel-border border-card-border">
        <CardHeader>
          <CardTitle className="pixel-text-sm">Toggles</CardTitle>
          <CardDescription className="font-sans">
            Enable or disable audio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="pixel-text-sm">Background Music</Label>
              <p className="text-sm text-muted-foreground font-sans">
                Enable ambient game music
              </p>
            </div>
            <Switch 
              checked={musicEnabled} 
              onCheckedChange={setMusicEnabled}
              data-testid="switch-music"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="pixel-text-sm">Sound Effects</Label>
              <p className="text-sm text-muted-foreground font-sans">
                Enable UI and gameplay sounds
              </p>
            </div>
            <Switch 
              checked={sfxEnabled} 
              onCheckedChange={setSfxEnabled}
              data-testid="switch-sfx"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ControlsSettings() {
  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="pixel-text text-lg text-foreground mb-6">
        Controls
      </h2>

      <Card className="pixel-border border-card-border">
        <CardHeader>
          <CardTitle className="pixel-text-sm">Keyboard Shortcuts</CardTitle>
          <CardDescription className="font-sans">
            Quick access controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <KeybindRow label="Open Inventory" keybind="TAB" />
          <KeybindRow label="Quick Save" keybind="CTRL + S" />
          <KeybindRow label="Island Tab" keybind="1" />
          <KeybindRow label="Hub Tab" keybind="2" />
          <KeybindRow label="Settings Tab" keybind="3" />
        </CardContent>
      </Card>

      <Card className="pixel-border border-card-border">
        <CardHeader>
          <CardTitle className="pixel-text-sm">Mouse Controls</CardTitle>
          <CardDescription className="font-sans">
            How to interact with items
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-sans text-sm">Hover item</span>
            <span className="pixel-text-sm text-muted-foreground">View details</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-sans text-sm">Drag to sell zone</span>
            <span className="pixel-text-sm text-muted-foreground">Sell items</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-sans text-sm">Click generator</span>
            <span className="pixel-text-sm text-muted-foreground">Upgrade tier</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface KeybindRowProps {
  label: string;
  keybind: string;
}

function KeybindRow({ label, keybind }: KeybindRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-sans text-sm">{label}</span>
      <kbd className="pixel-border border-border bg-muted px-3 py-1">
        <span className="pixel-text-sm text-xs">{keybind}</span>
      </kbd>
    </div>
  );
}
