# Isleforge Design Guidelines

## Design Approach
**Reference-Based: Minecraft UI + Retro Pixel Games**
Drawing inspiration from Minecraft's interface, Terraria's inventory systems, and Stardew Valley's clean pixel aesthetics. Dark mode pixel-art theme with retro gaming nostalgia balanced with modern UI clarity.

## Core Design Elements

### Typography
- **Primary Font**: Press Start 2P (Google Fonts) for all text
- **Hierarchy**:
  - Page Titles: text-2xl (24px equivalent)
  - Section Headers: text-xl (20px)
  - Stats/Labels: text-base (16px)
  - Body/Descriptions: text-sm (14px)
  - Micro Text: text-xs (12px)
- **Letter Spacing**: tracking-wide for readability with pixel fonts
- **Line Height**: leading-relaxed (1.625) to prevent cramped text

### Layout System
**Tailwind Spacing**: Use units of 1, 2, 4, 6, 8 consistently
- **Gaps**: gap-4 for grids, gap-2 for tight groups
- **Padding**: p-4 for containers, p-2 for compact elements, p-6 for main sections
- **Margins**: mb-4 for vertical rhythm, mt-8 for major section breaks

**Core Layout Structure**:
- Fixed right sidebar: w-80 (320px), full viewport height
- Main content area: flex-1, fills remaining space
- Sidebar sticky positioning with overflow-y-auto for stats
- Tab navigation bar: h-14, full width sticky top

### Component Library

**Stats Display (Right Sidebar)**:
- Always-visible stats at top: Player Level, Coins, UP in stacked cards
- Each stat card: border-2 pixel-style border, p-3, mb-2
- Stat value: Large text-xl with icon (coin sprite, star sprite)
- Tab-specific stats below with divider line (border-t-2, mt-4, pt-4)

**Tab Navigation**:
- Horizontal tabs with active state visual distinction
- Tab items: px-6, py-3, border-b-4 on active tab
- Pixel-art tab indicator (thick bottom border)
- Smooth tab content transitions

**Island Grid System**:
- CSS Grid: grid-cols-4 for generator tiles (responsive: grid-cols-2 on mobile)
- Generator cards: aspect-square, border-2, p-4
- Locked generators: opacity-50 with lock icon overlay
- Unlocked: Full opacity with pulsing animation on resource generation

**Generator Tiles**:
- Pixel-art icon/sprite at top (64x64px scaled)
- Generator name: text-sm, centered
- Tier indicator: Roman numerals (I-V) in corner badge
- Output rate: "X items / Y sec" below icon
- Upgrade button at bottom: full-width, py-2

**Storage/Inventory System**:
- Grid layout: grid-cols-8 for item slots (grid-cols-4 mobile)
- Item slots: Square aspect ratio, border-2, p-1
- Empty slots: Dashed border (border-dashed)
- Filled slots: Item sprite centered, quantity badge in corner
- Drag ghost: opacity-75 while dragging

**Sell Area**:
- Dedicated drop zone: min-h-32, border-4 border-dashed
- Visual feedback: border color change on drag-over
- Confirmation modal: Centered overlay, p-6, max-w-md
- Modal backdrop: Semi-transparent overlay

**Item Tooltips**:
- Positioned near cursor on hover
- Container: p-3, border-2, max-w-xs
- Structure: Item name (bold) → Rarity badge → Description → Sell price
- Rarity colors handled via border styling variations
- Image preview: 48x48px sprite at top

**Inventory Popup (Tab Key)**:
- Modal overlay: Centered, max-w-2xl, max-h-screen overflow
- Equipment slots: Grid showing armor slots (helmet, chest, legs, boots) + tool slots
- Visual equipment preview on left, inventory grid on right
- Close button: Top-right corner, text-lg "✕"

**Tier Upgrade Interface**:
- Current tier indicator with progress bar
- Next tier preview: Shows improved stats (lighter text)
- Cost display: Coin icon + amount needed
- Upgrade button: Disabled state when insufficient funds (opacity-50)

**Marketplace (Hub Tab)**:
- Card-based listings: 2-column grid (grid-cols-2, gap-6)
- Each listing: Item sprite + name + price + buy button
- "Coming Soon" placeholders: Grayscale filter, "LOCKED" overlay text

### Animations & Effects
**Resource Generation**:
- Gentle pulse effect on generator when producing (scale-105 keyframe)
- +1 floating number animation when resources added
- Fill animation on progress bars (transition-all duration-300)

**UI Interactions**:
- Tab switches: Fade in/out (transition-opacity duration-200)
- Hover states: scale-102 transform on interactive cards
- Button clicks: scale-95 active state
- Drag feedback: Shadow increase (shadow-lg → shadow-2xl)

**Level Up / Milestone**:
- Screen flash effect (brief overlay fade)
- Confetti-style particle burst (simple CSS animation)
- Achievement banner slide-in from top

### Spacing & Rhythm
- Section vertical rhythm: space-y-6 for major sections
- Card internal spacing: p-4 standard, p-6 for emphasis
- Grid gaps: gap-4 for breathing room
- Button groups: gap-2 for related actions

### Pixel-Art Assets
**Item Sprites**: All 32x32px base size, scaled to 64x64px in UI
**Icons**: 24x24px for UI elements (coins, stats, close buttons)
**Generator Sprites**: 64x64px for main display, 32x32px for compact views
**Consistency**: All assets use same pixel density and color depth

### Images
No hero images needed - this is a game interface. All visuals are pixel-art sprites and UI elements integrated into the functional interface.

**Critical UI Principles**:
- Pixel-perfect alignment (avoid sub-pixel rendering)
- Chunky borders (border-2 or border-4) for retro feel
- No border-radius (sharp corners maintaining pixel aesthetic)
- Crisp sprite rendering (image-rendering: pixelated in CSS)
- Monospace number displays for counters (tabular-nums)