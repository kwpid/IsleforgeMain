import { useEffect, useState } from 'react';
import { BUILD_COMMIT, getShortCommit, isCommitOutdated, fetchLatestCommit, isDevBuild } from '@/lib/version';
import { useGameStore } from '@/lib/gameStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, AlertTriangle } from 'lucide-react';

export function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestCommit, setLatestCommit] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const saveGame = useGameStore((s) => s.saveGame);

  useEffect(() => {
    if (isDevBuild()) {
      return;
    }

    const checkForUpdates = async () => {
      try {
        const latest = await fetchLatestCommit();
        if (latest && isCommitOutdated(BUILD_COMMIT, latest.sha)) {
          setLatestCommit(latest.sha);
          setUpdateAvailable(true);
        }
      } catch (error) {
        console.log('Version check failed:', error);
      }
    };

    checkForUpdates();

    const interval = setInterval(checkForUpdates, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      saveGame();
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Failed to save before refresh:', error);
    }
    
    window.location.reload();
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
  };

  if (!updateAvailable) return null;

  return (
    <AlertDialog open={updateAvailable} onOpenChange={setUpdateAvailable}>
      <AlertDialogContent className="pixel-border bg-card max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="pixel-text text-sm flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Update Available
          </AlertDialogTitle>
          <AlertDialogDescription className="font-sans space-y-3">
            <div className="flex items-center justify-center gap-3 py-4">
              <div className="text-center">
                <span className="pixel-text-sm text-muted-foreground text-[8px]">Current</span>
                <Badge variant="outline" className="block mt-1 pixel-text-sm font-mono">{getShortCommit(BUILD_COMMIT)}</Badge>
              </div>
              <RefreshCw className="w-5 h-5 text-muted-foreground" />
              <div className="text-center">
                <span className="pixel-text-sm text-primary text-[8px]">Latest</span>
                <Badge className="block mt-1 pixel-text-sm bg-primary font-mono">{latestCommit ? getShortCommit(latestCommit) : '...'}</Badge>
              </div>
            </div>
            
            <div className="p-3 bg-muted/50 rounded-sm border border-border">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  A new version is available. Please refresh to get the latest features and fixes. 
                  Your progress will be saved automatically.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogAction
            onClick={handleDismiss}
            className="pixel-text-sm bg-muted text-muted-foreground hover:bg-muted/80"
          >
            Later
          </AlertDialogAction>
          <AlertDialogAction
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="pixel-text-sm bg-primary"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh Now
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function VersionBadge() {
  return (
    <Badge 
      variant="outline" 
      className="pixel-text-sm text-[7px] text-muted-foreground font-mono"
      data-testid="version-badge"
    >
      {isDevBuild() ? 'dev' : getShortCommit(BUILD_COMMIT)}
    </Badge>
  );
}
