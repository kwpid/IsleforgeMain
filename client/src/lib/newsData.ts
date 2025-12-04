export type ArticleTag = "Update" | "Fixes" | "News";

export interface NewsArticle {
  id: string;
  title: string;
  date: string;
  tags: ArticleTag[];
  content: string;
}

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: "farming-update-v1",
    title: "Farming Update v1.0",
    date: "12/04/2025",
    tags: ["Update"],
    content: `
# Farming Update v1.0

The farming system is now live! Grow your own crops and expand your farming empire.

![Farming Preview](/news/farming_update.png)

## New Features

### Farming System
- **New Farming Tab** - Access farming from the Island menu
- **Multiple Farms** - Unlock up to 4 farms to grow more crops
- **Farm Upgrades** - Upgrade your farms to unlock more planting slots (up to 16 per farm)

### Seeds & Crops
- **Wheat Seeds** - Basic crop, 5 minute growth time
- **Carrot Seeds** - 8 minute growth time, higher yield
- **Potato Seeds** - 10 minute growth time
- **Melon Seeds** - Uncommon, 15 minute growth time
- **Pumpkin Seeds** - Uncommon, 20 minute growth time
- **Beetroot Seeds** - 12 minute growth time

### Watering System
- **Basic Watering Can** - Holds 10 water, refill costs 50 coins
- **Copper Watering Can** - Holds 25 water, refill costs 100 coins
- **Golden Watering Can** - Holds 50 water, refill costs 200 coins
- **Water your crops** - Double growth speed when watered
- **Auto-select best can** - Game automatically uses your highest tier watering can

### Farmer Flora
- New vendor in the Marketplace
- Sells watering cans, seeds, and farming supplies

## Quality of Life
- Seed Guide now accessible via popup button
- Progress bars show crop growth in hover tooltips
- Upgrade buttons now display costs clearly
- Fixed farm unlock purchasing system

*Happy farming!*
    `.trim(),
  },
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
- **Universal Points (U$)** - A premium currency for special items (1 U$ = 10,000 Coins)

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
