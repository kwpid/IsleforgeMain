import { useState } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { KeybindAction, getKeyDisplayName, NotificationSettings } from '@/lib/gameTypes';
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
import { Separator } from '@/components/ui/separator';
import { Bell, Package, Coins, TrendingUp, AlertTriangle, Sparkles, Heart, Code, Info, ExternalLink } from 'lucide-react';

export function SettingsTab() {
  const settingsSubTab = useGameStore((s) => s.settingsSubTab);

  return (
    <div className="h-full overflow-y-auto scrollbar-pixel p-6">
      {settingsSubTab === 'general' && <GeneralSettings />}
      {settingsSubTab === 'audio' && <AudioSettings />}
      {settingsSubTab === 'controls' && <ControlsSettings />}
      {settingsSubTab === 'notifications' && <NotificationsSettings />}
      {settingsSubTab === 'info' && <InfoSettings />}
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
  const keybinds = useGameStore((s) => s.keybinds);
  const setKeybind = useGameStore((s) => s.setKeybind);
  const resetKeybinds = useGameStore((s) => s.resetKeybinds);
  const [listeningFor, setListeningFor] = useState<KeybindAction | null>(null);

  const keybindConfig: { action: KeybindAction; label: string }[] = [
    { action: 'openInventory', label: 'Open Inventory' },
    { action: 'quickSave', label: 'Quick Save' },
    { action: 'islandTab', label: 'Island Tab' },
    { action: 'hubTab', label: 'Hub Tab' },
    { action: 'settingsTab', label: 'Settings Tab' },
    { action: 'prevSubTab', label: 'Previous Sub-Tab' },
    { action: 'nextSubTab', label: 'Next Sub-Tab' },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="pixel-text text-lg text-foreground mb-6">
        Controls
      </h2>

      <Card className="pixel-border border-card-border">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="pixel-text-sm">Keyboard Shortcuts</CardTitle>
            <CardDescription className="font-sans">
              Click a keybind to change it
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetKeybinds}
            className="pixel-text-sm text-[8px]"
            data-testid="button-reset-keybinds"
          >
            Reset All
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {keybindConfig.map(({ action, label }) => (
            <KeybindRow 
              key={action}
              label={label}
              action={action}
              currentKey={keybinds[action]}
              isListening={listeningFor === action}
              onStartListening={() => setListeningFor(action)}
              onKeyCapture={(key) => {
                setKeybind(action, key);
                setListeningFor(null);
              }}
              onCancel={() => setListeningFor(null)}
            />
          ))}
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
  action: KeybindAction;
  currentKey: string;
  isListening: boolean;
  onStartListening: () => void;
  onKeyCapture: (key: string) => void;
  onCancel: () => void;
}

function KeybindRow({ 
  label, 
  action,
  currentKey, 
  isListening, 
  onStartListening, 
  onKeyCapture,
  onCancel
}: KeybindRowProps) {
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
    <div className="flex items-center justify-between gap-4">
      <span className="font-sans text-sm">{label}</span>
      {isListening ? (
        <div
          className="pixel-border border-primary bg-primary/10 px-3 py-1 animate-pulse min-w-[80px] text-center"
          tabIndex={0}
          autoFocus
          onKeyDown={handleKeyDown}
          onBlur={onCancel}
          data-testid={`keybind-input-${action}`}
          data-keybind-capture="true"
        >
          <span className="pixel-text-sm text-xs">Press key...</span>
        </div>
      ) : (
        <button
          onClick={onStartListening}
          className="pixel-border border-border bg-muted px-3 py-1 hover-elevate min-w-[80px] text-center cursor-pointer"
          data-testid={`keybind-${action}`}
        >
          <span className="pixel-text-sm text-xs">{getKeyDisplayName(currentKey)}</span>
        </button>
      )}
    </div>
  );
}

function NotificationsSettings() {
  const notificationSettings = useGameStore((s) => s.notificationSettings);
  const updateNotificationSetting = useGameStore((s) => s.updateNotificationSetting);
  const resetNotificationSettings = useGameStore((s) => s.resetNotificationSettings);

  const notificationOptions: { key: keyof NotificationSettings; label: string; description: string; icon: typeof Bell }[] = [
    { key: 'storageFull', label: 'Storage Full', description: 'Notify when storage reaches capacity', icon: AlertTriangle },
    { key: 'itemPurchased', label: 'Item Purchased', description: 'Notify when buying items from vendors', icon: Package },
    { key: 'itemSold', label: 'Item Sold', description: 'Notify when selling items', icon: Coins },
    { key: 'levelUp', label: 'Level Up', description: 'Notify when gaining a level', icon: Sparkles },
    { key: 'generatorPaused', label: 'Generator Paused', description: 'Notify when generators stop due to full storage', icon: AlertTriangle },
    { key: 'bankDeposit', label: 'Bank Deposit', description: 'Notify when depositing coins to bank', icon: TrendingUp },
    { key: 'bankWithdraw', label: 'Bank Withdraw', description: 'Notify when withdrawing coins from bank', icon: Coins },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="pixel-text text-lg text-foreground mb-6">
        Notification Settings
      </h2>

      <Card className="pixel-border border-card-border">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="pixel-text-sm">Master Control</CardTitle>
            <CardDescription className="font-sans">
              Enable or disable all notifications
            </CardDescription>
          </div>
          <Switch 
            checked={notificationSettings.enabled} 
            onCheckedChange={(checked) => updateNotificationSetting('enabled', checked)}
            data-testid="switch-notifications-master"
          />
        </CardHeader>
      </Card>

      <Card className="pixel-border border-card-border">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="pixel-text-sm">Notification Types</CardTitle>
            <CardDescription className="font-sans">
              Choose which notifications to receive
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetNotificationSettings}
            className="pixel-text-sm text-[8px]"
            data-testid="button-reset-notifications"
          >
            Reset All
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationOptions.map(({ key, label, description, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="pixel-text-sm">{label}</Label>
                  <p className="text-sm text-muted-foreground font-sans">
                    {description}
                  </p>
                </div>
              </div>
              <Switch 
                checked={notificationSettings[key]} 
                onCheckedChange={(checked) => updateNotificationSetting(key, checked)}
                disabled={!notificationSettings.enabled}
                data-testid={`switch-notification-${key}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

const GAME_VERSION = '1.1.0';

function InfoSettings() {
  const player = useGameStore((s) => s.player);
  const playTime = useGameStore((s) => s.playTime);

  const formatPlayTime = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="pixel-text text-lg text-foreground mb-6">
        Game Information
      </h2>

      <Card className="pixel-border border-card-border">
        <CardHeader>
          <CardTitle className="pixel-text-sm flex items-center gap-2">
            <Info className="w-4 h-4" />
            About IsleForge
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="pixel-border border-border bg-muted/20 p-4">
              <p className="pixel-text-sm text-[8px] text-muted-foreground mb-1">Version</p>
              <p className="pixel-text text-sm text-primary">v{GAME_VERSION}</p>
            </div>
            <div className="pixel-border border-border bg-muted/20 p-4">
              <p className="pixel-text-sm text-[8px] text-muted-foreground mb-1">Play Time</p>
              <p className="pixel-text text-sm">{formatPlayTime(playTime)}</p>
            </div>
          </div>

          <p className="font-sans text-sm text-muted-foreground">
            IsleForge is a Nintendo-style resource management and idle game where you build 
            generators, mine resources, craft items, and grow your island empire!
          </p>
        </CardContent>
      </Card>

      <Card className="pixel-border border-card-border">
        <CardHeader>
          <CardTitle className="pixel-text-sm flex items-center gap-2">
            <Heart className="w-4 h-4 text-destructive" />
            Credits
          </CardTitle>
          <CardDescription className="font-sans">
            The people behind IsleForge
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="pixel-text-sm text-[10px]">Game Design & Development</p>
                <p className="font-sans text-sm text-muted-foreground">IsleForge Team</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="pixel-text-sm text-[10px]">Art & Visual Design</p>
                <p className="font-sans text-sm text-muted-foreground">Pixel Art Sprites</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="pixel-text-sm text-[10px]">Built With</p>
                <p className="font-sans text-sm text-muted-foreground">
                  React, TypeScript, Tailwind CSS, Zustand
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="pixel-border border-card-border">
        <CardHeader>
          <CardTitle className="pixel-text-sm flex items-center gap-2">
            <Code className="w-4 h-4" />
            Technical Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="pixel-text-sm text-[8px] text-muted-foreground">Player Level</p>
              <p className="font-sans">{player.level}</p>
            </div>
            <div>
              <p className="pixel-text-sm text-[8px] text-muted-foreground">Total XP</p>
              <p className="font-sans">{player.xp.toLocaleString()}</p>
            </div>
            <div>
              <p className="pixel-text-sm text-[8px] text-muted-foreground">Total Coins Earned</p>
              <p className="font-sans">{player.totalCoinsEarned.toLocaleString()}</p>
            </div>
            <div>
              <p className="pixel-text-sm text-[8px] text-muted-foreground">Items Sold</p>
              <p className="font-sans">{player.totalItemsSold.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="pixel-border border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="pixel-text text-sm text-primary">Thank you for playing!</p>
            <p className="font-sans text-sm text-muted-foreground">
              We hope you enjoy building your island empire.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
