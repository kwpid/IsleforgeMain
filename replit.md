# Isleforge - Skyblock Incremental Game

## Overview
Isleforge is a pixel-art themed incremental/idle game inspired by Minecraft skyblock. Players build their island empire by unlocking and upgrading resource generators, managing storage, and progressing through tiers.

## Tech Stack
- **Frontend**: React with TypeScript, Tailwind CSS
- **State Management**: Zustand with localStorage persistence
- **UI Components**: Shadcn/ui with custom pixel-art styling
- **Fonts**: Press Start 2P (pixel font), VT323 (readable pixel font)
- **Backend**: Express.js (minimal for future features)

## Project Structure
```
client/src/
├── components/
│   ├── ui/                 # Shadcn components
│   ├── FloatingNumbers.tsx # Floating +1 animations
│   ├── GameLayout.tsx      # Main game container
│   ├── GeneratorCard.tsx   # Generator tiles
│   ├── HubTab.tsx          # Marketplace & Dungeons
│   ├── InventoryPopup.tsx  # TAB key inventory modal
│   ├── IslandTab.tsx       # Generators & Storage views
│   ├── ItemTooltip.tsx     # Item hover tooltips
│   ├── PixelIcon.tsx       # SVG pixel-art icons
│   ├── PlayerStats.tsx     # Right sidebar stats
│   ├── SettingsTab.tsx     # Game settings
│   ├── StorageView.tsx     # Storage with drag-drop sell
│   └── TabNavigation.tsx   # Main navigation tabs
├── lib/
│   ├── items/              # Item definitions by type
│   │   ├── blocks.ts
│   │   ├── minerals.ts
│   │   ├── materials.ts
│   │   ├── food.ts
│   │   ├── tools.ts
│   │   ├── armor.ts
│   │   ├── potions.ts
│   │   └── index.ts
│   ├── gameStore.ts        # Zustand game state
│   ├── gameTypes.ts        # TypeScript types
│   └── generators.ts       # Generator definitions
├── pages/
│   └── Game.tsx            # Main game page
└── App.tsx                 # Router setup
```

## Key Features

### Generators (Island Tab)
- Cobblestone Generator (free): 1 cobblestone/5s
- Wood Farmer (500 coins): 3 wood/5s
- Coal Miner (2000 coins): 1 coal/8s
- Iron Miner (10000 coins): 1 iron/12s
- Gold Miner (50000 coins): 1 gold/20s
- Diamond Miner (500000 coins): 1 diamond/60s

Each generator has 5 tiers (I-V) with exponential upgrade costs.

### Storage System
- Drag items to sell zone with confirmation
- Sell all items button
- Upgradeable capacity (100 → 200 → 400 → 800 → 1600 → 3200)

### Player Stats (Right Sidebar)
- Level with XP bar
- Coins (gold currency)
- UP (Universal Points for future prestige)
- Tab-specific stats below divider

### Bank System (Hub Tab)
- **Account**: Deposit/withdraw coins securely
- **Vault**: Store valuable items (separate from inventory)
- **Transaction History**: Track all deposits and withdrawals
- **Stats**: View net worth, peak balance, and wealth distribution
- Upgradeable bank capacity (10K → 50K → 200K → 1M → 5M → 25M)
- Upgradeable vault slots (9 → 18 → 27 → 36 → 54)

### Keyboard Shortcuts
- TAB: Open/close inventory
- 1/2/3: Switch main tabs
- CTRL+S: Quick save

## Design System

### Colors (Dark Mode)
- Background: Deep blue-gray (#0f1118)
- Cards: Slightly elevated gray
- Primary: Emerald green (#22c55e)
- Accent: Purple (#9333ea)
- Game Coin: Gold (#fbbf24)
- Game UP: Purple
- Game XP: Green

### Rarity Colors
- Common: Gray
- Uncommon: Green
- Rare: Blue
- Epic: Purple
- Legendary: Gold
- Mythic: Pink

### Typography
- Headers: Press Start 2P (blocky pixel font)
- Body: VT323 (readable pixel font)
- Numbers: Tabular nums for alignment

## State Persistence
Game state is saved to localStorage with key `isleforge-save`. Auto-saves every 60 seconds.

## Future Features (Coming Soon)
- Dungeons tab with combat
- Marketplace buying
- Crafting system
- Equipment from dungeons
- Prestige/rebirth system with UP

## Development Notes
- All border-radius set to 0 for pixel aesthetic
- Custom pixel shadows with offset instead of blur
- Image rendering set to pixelated/crisp-edges
- Generator tick rate: 100ms for smooth progress bars
