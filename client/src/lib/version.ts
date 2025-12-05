export const GITHUB_OWNER = 'kwpid';
export const GITHUB_REPO = 'IsleforgeMain';
export const GITHUB_BRANCH = 'main';

export const BUILD_COMMIT = import.meta.env.VITE_BUILD_COMMIT || 'dev';

export const BUILD_DATE = new Date().toISOString().split('T')[0];

export interface VersionInfo {
  commit: string;
  shortCommit: string;
  buildDate: string;
}

export function getVersionInfo(): VersionInfo {
  return {
    commit: BUILD_COMMIT,
    shortCommit: getShortCommit(BUILD_COMMIT),
    buildDate: BUILD_DATE,
  };
}

export function getShortCommit(commit: string): string {
  if (commit === 'dev') return 'dev';
  return commit.substring(0, 7);
}

export function isCommitOutdated(currentCommit: string, latestCommit: string): boolean {
  if (currentCommit === 'dev' || latestCommit === 'dev') return false;
  return currentCommit !== latestCommit;
}

export function isDevBuild(): boolean {
  return BUILD_COMMIT === 'dev';
}

export async function fetchLatestCommit(): Promise<{ sha: string; date: string } | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits/${GITHUB_BRANCH}`,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'IsleForge-UpdateChecker',
        },
        cache: 'no-store',
      }
    );
    
    if (response.status === 403) {
      console.log('GitHub API rate limit exceeded');
      return null;
    }
    
    if (!response.ok) {
      console.log('GitHub API response not ok:', response.status);
      return null;
    }
    
    const data = await response.json();
    return {
      sha: data.sha,
      date: data.commit?.committer?.date || new Date().toISOString(),
    };
  } catch (error) {
    console.log('Failed to fetch latest commit:', error);
    return null;
  }
}
