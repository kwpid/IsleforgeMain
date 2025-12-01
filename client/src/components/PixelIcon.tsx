import { cn } from '@/lib/utils';

interface PixelIconProps {
  icon: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const ICON_COLORS: Record<string, { bg: string; accent: string; detail?: string }> = {
  cobblestone: { bg: '#7a7a7a', accent: '#5a5a5a', detail: '#9a9a9a' },
  stone: { bg: '#8a8a8a', accent: '#6a6a6a', detail: '#aaaaaa' },
  oak_log: { bg: '#8b6914', accent: '#5c4a0f', detail: '#a67c52' },
  oak_planks: { bg: '#bc9862', accent: '#8b6914', detail: '#d4b896' },
  dirt: { bg: '#8b6914', accent: '#5c4a0f', detail: '#6b4c12' },
  sand: { bg: '#e6d59b', accent: '#c4b17a', detail: '#f0e4b8' },
  gravel: { bg: '#8a8075', accent: '#6a6055', detail: '#aaa095' },
  obsidian: { bg: '#1a0a2e', accent: '#0d0518', detail: '#2d1a4a' },
  coal: { bg: '#2a2a2a', accent: '#1a1a1a', detail: '#3a3a3a' },
  iron_ore: { bg: '#8a8a8a', accent: '#d4a574', detail: '#6a6a6a' },
  iron_ingot: { bg: '#d4d4d4', accent: '#9a9a9a', detail: '#f0f0f0' },
  gold_ore: { bg: '#8a8a8a', accent: '#ffd700', detail: '#6a6a6a' },
  gold_ingot: { bg: '#ffd700', accent: '#daa520', detail: '#ffec8b' },
  diamond: { bg: '#4aedd9', accent: '#28b8a8', detail: '#7af5e8' },
  emerald: { bg: '#50c878', accent: '#2e8b57', detail: '#7cfc00' },
  netherite_ingot: { bg: '#443a3a', accent: '#2a2020', detail: '#5a4a4a' },
  stick: { bg: '#bc9862', accent: '#8b6914', detail: '#d4b896' },
  string: { bg: '#e8e8e8', accent: '#c8c8c8', detail: '#f8f8f8' },
  leather: { bg: '#c4713a', accent: '#8b4513', detail: '#d4915a' },
  feather: { bg: '#f8f8f8', accent: '#d8d8d8', detail: '#ffffff' },
  bone: { bg: '#e8e8d0', accent: '#c8c8b0', detail: '#f8f8f0' },
  slime_ball: { bg: '#7fbf3f', accent: '#5f9f2f', detail: '#9fdf5f' },
  ender_pearl: { bg: '#0d5f5f', accent: '#0a4a4a', detail: '#1a7a7a' },
  blaze_rod: { bg: '#ffa500', accent: '#ff8c00', detail: '#ffcc00' },
  nether_star: { bg: '#fffacd', accent: '#f0e68c', detail: '#ffffff' },
  apple: { bg: '#ff4444', accent: '#cc2222', detail: '#ff6666' },
  bread: { bg: '#d4a574', accent: '#a67c52', detail: '#e8c8a4' },
  cooked_beef: { bg: '#8b4513', accent: '#5c2a0a', detail: '#a0522d' },
  golden_apple: { bg: '#ffd700', accent: '#ff4444', detail: '#ffec8b' },
  enchanted_golden_apple: { bg: '#ffd700', accent: '#9932cc', detail: '#ffec8b' },
  wooden_pickaxe: { bg: '#bc9862', accent: '#8b6914', detail: '#d4b896' },
  stone_pickaxe: { bg: '#8a8a8a', accent: '#bc9862', detail: '#aaaaaa' },
  iron_pickaxe: { bg: '#d4d4d4', accent: '#bc9862', detail: '#f0f0f0' },
  diamond_pickaxe: { bg: '#4aedd9', accent: '#bc9862', detail: '#7af5e8' },
  netherite_pickaxe: { bg: '#443a3a', accent: '#bc9862', detail: '#5a4a4a' },
  iron_sword: { bg: '#d4d4d4', accent: '#bc9862', detail: '#f0f0f0' },
  diamond_sword: { bg: '#4aedd9', accent: '#bc9862', detail: '#7af5e8' },
  iron_axe: { bg: '#d4d4d4', accent: '#bc9862', detail: '#f0f0f0' },
  leather_helmet: { bg: '#c4713a', accent: '#8b4513', detail: '#d4915a' },
  leather_chestplate: { bg: '#c4713a', accent: '#8b4513', detail: '#d4915a' },
  iron_helmet: { bg: '#d4d4d4', accent: '#9a9a9a', detail: '#f0f0f0' },
  iron_chestplate: { bg: '#d4d4d4', accent: '#9a9a9a', detail: '#f0f0f0' },
  diamond_helmet: { bg: '#4aedd9', accent: '#28b8a8', detail: '#7af5e8' },
  diamond_chestplate: { bg: '#4aedd9', accent: '#28b8a8', detail: '#7af5e8' },
  netherite_chestplate: { bg: '#443a3a', accent: '#2a2020', detail: '#5a4a4a' },
  potion_healing: { bg: '#ff6b6b', accent: '#cc4444', detail: '#ff9999' },
  potion_speed: { bg: '#87ceeb', accent: '#5cacee', detail: '#b0e2ff' },
  potion_strength: { bg: '#8b0000', accent: '#660000', detail: '#b22222' },
  potion_regeneration: { bg: '#ff69b4', accent: '#db7093', detail: '#ffb6c1' },
  potion_fire_resistance: { bg: '#ff8c00', accent: '#cc7000', detail: '#ffa500' },
  potion_invisibility: { bg: '#c0c0c0', accent: '#808080', detail: '#e0e0e0' },
  coin: { bg: '#ffd700', accent: '#daa520', detail: '#ffec8b' },
  up: { bg: '#9932cc', accent: '#7b2fa0', detail: '#ba55d3' },
  xp: { bg: '#7fff00', accent: '#6dd600', detail: '#adff2f' },
  lock: { bg: '#6a6a6a', accent: '#4a4a4a', detail: '#8a8a8a' },
  storage: { bg: '#8b4513', accent: '#5c2a0a', detail: '#a0522d' },
  market: { bg: '#228b22', accent: '#166616', detail: '#32cd32' },
  dungeon: { bg: '#4a4a4a', accent: '#2a2a2a', detail: '#6a6a6a' },
  settings: { bg: '#6a6a6a', accent: '#4a4a4a', detail: '#8a8a8a' },
  island: { bg: '#228b22', accent: '#166616', detail: '#90ee90' },
  hub: { bg: '#4169e1', accent: '#2a4cd1', detail: '#6495ed' },
};

const SIZE_MAP = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export function PixelIcon({ icon, size = 'md', className }: PixelIconProps) {
  const colors = ICON_COLORS[icon] || { bg: '#888888', accent: '#666666', detail: '#aaaaaa' };
  const sizeClass = SIZE_MAP[size];

  const isPotion = icon.startsWith('potion_');
  const isTool = ['pickaxe', 'sword', 'axe'].some(t => icon.includes(t));
  const isArmor = ['helmet', 'chestplate', 'leggings', 'boots'].some(a => icon.includes(a));
  const isIngot = icon.includes('ingot');
  const isGem = ['diamond', 'emerald', 'nether_star'].includes(icon);
  const isOre = icon.includes('ore');
  const isLog = icon.includes('log');
  const isFood = ['apple', 'bread', 'beef', 'golden_apple', 'enchanted_golden_apple'].some(f => icon.includes(f));

  return (
    <div 
      className={cn('relative pixel-image', sizeClass, className)}
      style={{ imageRendering: 'pixelated' }}
    >
      <svg 
        viewBox="0 0 16 16" 
        className="w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      >
        {isPotion ? (
          <>
            <rect x="5" y="2" width="6" height="2" fill={colors.detail} />
            <rect x="4" y="4" width="8" height="10" fill={colors.bg} />
            <rect x="5" y="5" width="6" height="8" fill={colors.accent} />
            <rect x="6" y="6" width="2" height="3" fill={colors.detail} opacity="0.5" />
          </>
        ) : isTool ? (
          <>
            <rect x="12" y="2" width="2" height="2" fill={colors.bg} />
            <rect x="10" y="4" width="2" height="2" fill={colors.bg} />
            <rect x="8" y="6" width="2" height="2" fill={colors.bg} />
            <rect x="6" y="8" width="2" height="2" fill={colors.accent} />
            <rect x="4" y="10" width="2" height="2" fill={colors.accent} />
            <rect x="2" y="12" width="2" height="2" fill={colors.accent} />
            <rect x="12" y="2" width="1" height="1" fill={colors.detail} />
          </>
        ) : isArmor ? (
          <>
            <rect x="4" y="2" width="8" height="3" fill={colors.bg} />
            <rect x="2" y="5" width="12" height="8" fill={colors.bg} />
            <rect x="6" y="5" width="4" height="4" fill={colors.accent} />
            <rect x="3" y="6" width="2" height="6" fill={colors.accent} />
            <rect x="11" y="6" width="2" height="6" fill={colors.accent} />
            <rect x="5" y="3" width="2" height="1" fill={colors.detail} />
          </>
        ) : isIngot ? (
          <>
            <rect x="2" y="6" width="12" height="6" fill={colors.bg} />
            <rect x="3" y="5" width="10" height="2" fill={colors.detail} />
            <rect x="4" y="4" width="8" height="2" fill={colors.detail} />
            <rect x="3" y="10" width="10" height="2" fill={colors.accent} />
          </>
        ) : isGem ? (
          <>
            <rect x="6" y="2" width="4" height="2" fill={colors.detail} />
            <rect x="4" y="4" width="8" height="4" fill={colors.bg} />
            <rect x="2" y="6" width="12" height="4" fill={colors.bg} />
            <rect x="4" y="10" width="8" height="2" fill={colors.accent} />
            <rect x="6" y="12" width="4" height="2" fill={colors.accent} />
            <rect x="5" y="5" width="2" height="2" fill={colors.detail} opacity="0.6" />
          </>
        ) : isOre ? (
          <>
            <rect x="2" y="2" width="12" height="12" fill={colors.bg} />
            <rect x="3" y="4" width="3" height="3" fill={colors.accent} />
            <rect x="8" y="6" width="4" height="3" fill={colors.accent} />
            <rect x="5" y="10" width="3" height="2" fill={colors.accent} />
            <rect x="3" y="3" width="1" height="1" fill={colors.detail} />
          </>
        ) : isLog ? (
          <>
            <rect x="2" y="2" width="12" height="12" fill={colors.accent} />
            <rect x="4" y="2" width="8" height="12" fill={colors.bg} />
            <rect x="5" y="4" width="2" height="8" fill={colors.detail} />
            <rect x="9" y="3" width="1" height="10" fill={colors.accent} />
          </>
        ) : isFood && icon.includes('apple') ? (
          <>
            <rect x="7" y="1" width="2" height="2" fill="#654321" />
            <rect x="9" y="2" width="2" height="2" fill="#228b22" />
            <rect x="5" y="3" width="6" height="4" fill={colors.bg} />
            <rect x="4" y="5" width="8" height="6" fill={colors.bg} />
            <rect x="5" y="11" width="6" height="2" fill={colors.accent} />
            <rect x="6" y="5" width="2" height="2" fill={colors.detail} opacity="0.5" />
          </>
        ) : icon === 'coin' ? (
          <>
            <circle cx="8" cy="8" r="6" fill={colors.bg} />
            <circle cx="8" cy="8" r="5" fill={colors.accent} />
            <circle cx="8" cy="8" r="4" fill={colors.bg} />
            <rect x="7" y="4" width="2" height="8" fill={colors.accent} />
            <rect x="5" y="6" width="6" height="1" fill={colors.accent} />
            <rect x="5" y="9" width="6" height="1" fill={colors.accent} />
          </>
        ) : icon === 'up' ? (
          <>
            <rect x="3" y="3" width="10" height="10" fill={colors.bg} />
            <rect x="7" y="5" width="2" height="6" fill={colors.detail} />
            <rect x="5" y="7" width="6" height="2" fill={colors.detail} />
            <rect x="6" y="6" width="1" height="1" fill={colors.accent} />
          </>
        ) : icon === 'xp' ? (
          <>
            <circle cx="8" cy="8" r="6" fill={colors.bg} />
            <circle cx="8" cy="8" r="4" fill={colors.accent} />
            <circle cx="8" cy="8" r="2" fill={colors.detail} />
          </>
        ) : icon === 'lock' ? (
          <>
            <rect x="4" y="7" width="8" height="7" fill={colors.bg} />
            <rect x="5" y="3" width="6" height="5" fill="transparent" stroke={colors.bg} strokeWidth="2" />
            <rect x="7" y="9" width="2" height="3" fill={colors.detail} />
          </>
        ) : (
          <>
            <rect x="2" y="2" width="12" height="12" fill={colors.bg} />
            <rect x="3" y="3" width="4" height="4" fill={colors.accent} />
            <rect x="9" y="9" width="4" height="4" fill={colors.accent} />
            <rect x="3" y="9" width="4" height="4" fill={colors.detail} opacity="0.5" />
            <rect x="9" y="3" width="4" height="4" fill={colors.detail} opacity="0.3" />
          </>
        )}
      </svg>
    </div>
  );
}
