# Custom Item Images

This folder contains custom images for game items. Simply add your image file here and reference it by filename in the item's `icon` property.

## How to Add Custom Images

1. **Place your image file in this folder**
   - Supported formats: PNG, GIF, JPG, JPEG, WEBP, APNG
   - Name files descriptively (e.g., `iron_pick.png`, `golden_sword.gif`)

2. **Update the item definition** to use your image filename:

```typescript
{
  id: "iron_pickaxe",
  name: "Iron Pickaxe",
  // ... other properties
  icon: "iron_pick.png",  // Just the filename!
}
```

The PixelIcon component automatically detects image filenames (any file ending with .png, .gif, .jpg, etc.) and loads them from this folder.

## Image Specifications

- **Recommended size**: 32x32 or 64x64 pixels
- **Style**: Pixel art looks best with this game's aesthetic
- **Transparency**: PNG/GIF with alpha channel supported
- **Animation**: GIF files animate automatically

## How It Works

When you set `icon: "iron_pick.png"`:
1. PixelIcon detects it's an image file (ends with .png)
2. Automatically constructs the path: `/item_images/iron_pick.png`
3. Loads and displays the image with pixelated rendering
4. Falls back to SVG icon if the image fails to load

## Examples

```typescript
// Static PNG image
{
  id: "super_sword",
  name: "Super Sword",
  icon: "super_sword.png",  // Uses /item_images/super_sword.png
}

// Animated GIF
{
  id: "enchanted_bow",
  name: "Enchanted Bow",
  icon: "enchanted_bow.gif",  // Animates automatically!
}

// Regular SVG fallback (no file extension)
{
  id: "wooden_pickaxe",
  icon: "wooden_pickaxe",  // Uses default SVG rendering
}
```

## Current Custom Images

- `iron_pick.png` - Custom iron pickaxe image

## Notes

- The image is served from `/item_images/` route
- Images render with `image-rendering: pixelated` for crisp pixel art
- If an image fails to load, it falls back to the default SVG icon
- Animated GIFs play automatically
