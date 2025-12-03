export type ArticleTag = 'Update' | 'Fixes' | 'News';

export interface NewsArticle {
  id: string;
  title: string;
  date: string;
  tags: ArticleTag[];
  content: string;
  images?: string[];
}

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'v1.0.0-launch',
    title: 'Welcome to IsleForge!',
    date: '2024-12-03',
    tags: ['News', 'Update'],
    content: `
# Welcome to IsleForge!

Thank you for playing **IsleForge**! This is an idle/incremental game where you build generators, mine resources, and grow your island empire.

## Getting Started

1. **Generators** - Your cobblestone generator is already running! It produces resources automatically.
2. **Storage** - Collected items go to your storage. Sell them for coins!
3. **Mining** - Visit the Mines in the Hub to manually mine blocks.
4. **Crafting** - Combine materials to create new items.

## Controls

- Press **TAB** to open your inventory
- Use **1, 2, 3** to switch between Island, Hub, and Settings
- Press **~** to open the developer console

*Happy forging!*
    `.trim(),
  },
  {
    id: 'update-1.1.0',
    title: 'Mining Improvements Update',
    date: '2024-12-03',
    tags: ['Update', 'Fixes'],
    content: `
# Mining Improvements

We've made some exciting updates to the mining system!

## New Features

- **Hold-to-Mine**: You can now hold down the mouse button to continuously mine blocks without needing to click again after each one.
- **Pickaxe Cursor**: Your equipped pickaxe now appears at your cursor while mining, giving visual feedback.

## Bug Fixes

- Fixed XP progress bar not filling correctly
- Universal Points (UP) now display with proper formatting

## Coming Soon

- More ore types
- Tiered mine areas
- Special mining events

*Keep mining!*
    `.trim(),
  },
];

export function getUnreadArticles(readArticleIds: string[]): NewsArticle[] {
  return NEWS_ARTICLES.filter(article => !readArticleIds.includes(article.id));
}

export function getLatestArticle(): NewsArticle | null {
  return NEWS_ARTICLES.length > 0 ? NEWS_ARTICLES[0] : null;
}

export const NEWS_VERSION = NEWS_ARTICLES.length > 0 ? NEWS_ARTICLES[0].id : null;
