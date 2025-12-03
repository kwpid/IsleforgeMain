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
│   ├── DevConsole.tsx      # Developer console (Y key)
│   ├── FloatingNumbers.tsx # Floating +1 animations
│   ├── GameLayout.tsx      # Main game container
│   ├── GeneratorCard.tsx   # Generator tiles
│   ├── HubTab.tsx          # Marketplace & Bank
│   ├── InventoryPopup.tsx  # TAB key inventory modal
│   ├── IslandTab.tsx       # Generators, Storage & Crafting views
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
│   │   ├── special.ts      # Special/enchanted items
│   │   └── index.ts
│   ├── crafting.ts         # Crafting recipes
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
- Upgradeable capacity (9 tiers): 500 → 1.5K → 5K → 15K → 35K → 75K → 150K → 300K → 500K

### Player Stats (Right Sidebar)
- Level with XP bar (proper fill indicator)
- Coins (gold currency)
- UP (Universal Points displayed with 2 decimal places: 0.00)
- Tab-specific stats below divider

### Settings Tabs
- **General**: Save data management, display options, danger zone
- **Audio**: Volume controls and toggles
- **Controls**: Customizable keyboard shortcuts
- **Notifications**: Toggle notification types
- **Info**: Game version, credits, technical stats, play time

### Crafting System (Island Tab)
- **Crafting Station**: Create items using materials from storage
- **Cost**: 50% of item's market value (Minecraft-style)
- **Categories**: Tools, Armor, Materials, Food, Potions
- **Search**: Filter recipes by name
- **Progress Bar**: Visual feedback during crafting time
- **Ingredients**: Shows required materials with have/need counts
- **Key Recipes**:
  - Stick: 2 Oak Planks → 4 Sticks
  - Oak Planks: 1 Oak Log → 4 Oak Planks
  - Iron Ingot: 1 Iron Ore + 1 Coal → 1 Iron Ingot
  - Wooden Pickaxe: 3 Oak Planks + 2 Sticks
  - Stone Pickaxe: 3 Cobblestone + 2 Sticks
  - Iron Pickaxe: 3 Iron Ingots + 2 Sticks
  - Bread: 3 Wheat → 1 Bread

### Bank System (Hub Tab)
- **Account**: Deposit/withdraw coins securely
- **Vault**: Store valuable items (separate from inventory)
- **Transaction History**: Track all deposits and withdrawals
- **Stats**: View net worth, peak balance, and wealth distribution
- Upgradeable bank capacity (10K → 50K → 200K → 1M → 5M → 25M)
- Upgradeable vault slots (9 → 18 → 27 → 36 → 54)

### Marketplace System (Hub Tab)
- **Main Shop**: Permanent vendors with unlimited stock
- **Special Vendors**: 1-3 rotating vendors, change every 12 hours, limited stock, sell items cheaper
- Category tabs: All, Blocks, Tools, Armor, Potions, Food, Materials, Ores & Minerals
- Ores available at 5x price multiplier (expensive but convenient)
- Special Items only available at Special Vendors at full price
- Purchase quantity selector with +/- buttons
- Instant item tooltips on hover

### Special Items
- Items with `isSpecial: true` show a star sparkle effect
- Items with `isEnchanted: true` have an enchantment glow animation
- Special items available in Special Vendors or via dev console

### Custom Item Images
- Custom images folder: `client/public/item_images/`
- Usage: Set `icon: "filename.png"` in item definition (auto-detected by file extension)
- Animated GIFs: Set `icon: "filename.gif"` for animations
- Supported formats: PNG, GIF, JPG, JPEG, WEBP, APNG
- See `client/public/item_images/README.md` for full documentation

### Manual Mining (Hub Tab - Mines)
- **Hold-to-Mine**: Click and hold on blocks to mine continuously
- **Auto-Restart**: Mining automatically continues to the next block
- **Cursor Pickaxe**: Your equipped pickaxe follows your cursor while mining
- **Pickaxe Tiers**: Higher tier pickaxes mine faster and unlock rarer blocks
- **Block Index**: View all mineable blocks and their requirements

### News & Updates System
- Auto-shows on first launch with unread articles
- Filter by category: All, Updates, Fixes, News
- Markdown-style content with headers, bold, lists
- Read tracking via localStorage
- News button in navigation with unread indicator

### Developer Console
- Press `Y` to open (when not in input field)
- Press `Escape` or click outside to close
- Commands: spawn, give, cash, xp, up, items, status, clear, help
- Arrow keys for command history

### Keyboard Shortcuts
- TAB/I: Open/close inventory
- 1/2/3: Switch main tabs
- CTRL+S: Quick save
- Y: Open developer console

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
- Equipment from dungeons
- Prestige/rebirth system with UP
- Marketplace search/filtering

## Development Notes
- All border-radius set to 0 for pixel aesthetic
- Custom pixel shadows with offset instead of blur
- Image rendering set to pixelated/crisp-edges
- Generator tick rate: 100ms for smooth progress bars
- Instant tooltips (0ms delay) for better UX
- Item slot sizes: compact (12x12), uniform (14x14), large (16x16)
- Generators automatically pause when storage is full
