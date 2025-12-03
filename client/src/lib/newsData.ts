export type ArticleTag = "Update" | "Fixes" | "News";

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
    id: "what-is-this",
    title: "What is this?",
    date: "12/03/2025",
    tags: ["News"],
    content: `
# What is IsleForge?

**IsleForge** is an idle/incremental game where you build and manage your own island empire!

## Core Gameplay

- **Generators** - Build automated machines that produce resources while you're away
- **Mining** - Explore mines to gather valuable ores and materials
- **Crafting** - Combine resources to create tools, upgrades, and more
- **Trading** - Sell your resources for coins to expand your operations

## Currencies

- **Coins** - The primary currency earned from selling resources
- **Universal Points (UP)** - A premium currency for special items (1 UP = 100K Coins)

*Start building your empire today!*
    `.trim(),
  },
];

export function getUnreadArticles(readArticleIds: string[]): NewsArticle[] {
  return NEWS_ARTICLES.filter(
    (article) => !readArticleIds.includes(article.id),
  );
}

export function getLatestArticle(): NewsArticle | null {
  return NEWS_ARTICLES.length > 0 ? NEWS_ARTICLES[0] : null;
}

export const NEWS_VERSION =
  NEWS_ARTICLES.length > 0 ? NEWS_ARTICLES[0].id : null;
