export const APP_VERSION = '1.0.0';

export const BUILD_DATE = new Date().toISOString().split('T')[0];

export interface VersionInfo {
  version: string;
  buildDate: string;
}

export function getVersionInfo(): VersionInfo {
  return {
    version: APP_VERSION,
    buildDate: BUILD_DATE,
  };
}

export function compareVersions(current: string, latest: string): number {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);
  
  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;
    
    if (latestPart > currentPart) return 1;
    if (latestPart < currentPart) return -1;
  }
  
  return 0;
}

export function isVersionOutdated(current: string, latest: string): boolean {
  return compareVersions(current, latest) > 0;
}
