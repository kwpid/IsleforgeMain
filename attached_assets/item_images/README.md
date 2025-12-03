# Custom Item Images

This folder contains custom images for game items. You can add static images (PNG, JPG, WEBP) or animated images (GIF, APNG) for any item.

## How to Add Custom Images

1. **Place your image file in this folder**
   - Supported formats: PNG, JPG, WEBP, GIF, APNG
   - Name the file to match the item ID (e.g., `diamond.png`, `golden_apple.gif`)

2. **Update the item definition** in `client/src/lib/items/` to reference your image:

```typescript
// For static images:
{
  id: 'my_item',
  name: 'My Custom Item',
  // ... other properties
  customImage: '/item_images/my_item.png',
}

// For animated images (GIF support):
{
  id: 'my_animated_item',
  name: 'My Animated Item',
  // ... other properties
  animatedImage: '/item_images/my_animated_item.gif',
}
```

3. **Import in your code** using the `@assets` alias:

```typescript
import myItemImage from '@assets/item_images/my_item.png';

// Then use in the item definition:
customImage: myItemImage,
```

## Image Specifications

- **Recommended size**: 32x32 or 64x64 pixels
- **Style**: Pixel art looks best with this game's aesthetic
- **Transparency**: PNG/GIF with alpha channel supported
- **Animation**: GIF files will animate automatically

## Animated Image Support

The `PixelIcon` component automatically handles animated images:
- If `animatedImage` is provided, it takes priority over `customImage`
- GIF animations play automatically
- Falls back to SVG icons if image fails to load

## Example Item Definition

```typescript
// In client/src/lib/items/special.ts or relevant file:
export const MY_CUSTOM_ITEM: ItemDefinition = {
  id: 'super_sword',
  name: 'Super Sword',
  description: 'A legendary blade with animated glow',
  type: 'tool',
  rarity: 'legendary',
  sellPrice: 10000,
  stackable: false,
  maxStack: 1,
  icon: 'iron_sword', // fallback icon
  toolType: 'sword',
  customImage: '/item_images/super_sword.png',
  animatedImage: '/item_images/super_sword.gif', // optional animated version
  isSpecial: true,
};
```

## Notes

- The `icon` property serves as a fallback if the custom image fails to load
- Place GIF animations in this folder for animated item effects
- All images are rendered with `image-rendering: pixelated` for crisp pixel art display
