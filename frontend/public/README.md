# Public Assets Folder

## Required Assets

### 1. HDR Environment Map

You need to add a `night.hdr` file to this folder for the environment lighting to work.

### Quick Download Options:

1. **Poly Haven (Recommended)** - Free, high-quality HDRIs
   - Visit: https://polyhaven.com/hdris
   - Search for "night", "urban", or "dark" environments
   - Download the 1K or 2K HDR version
   - Rename to `night.hdr` and place in this folder

2. **Direct Download Examples:**
   ```bash
   # Urban night environment
   curl -o night.hdr https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/urban_alley_01_1k.hdr
   
   # Or night sky
   curl -o night.hdr https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/moonless_golf_1k.hdr
   ```

3. **Or use any HDR file** - Just rename it to `night.hdr`

### 2. 3D Models (Required)

The project uses two GLTF models that need to be in the `public/` folder:

1. **fantasy_game_inn2-transformed.glb** - The disco club building/scene
2. **ghost_w_tophat-transformed.glb** - The player character

**Where to get them:**
- Create your own models in Blender
- Download from sites like Sketchfab, CGTrader, or TurboSquid
- Use the models from your `old/public/models/` folder
- Replace with any GLB/GLTF models you prefer

### File Structure:
```
public/
├── night.hdr                            ← HDR environment map
├── fantasy_game_inn2-transformed.glb    ← Scene/building model
├── ghost_w_tophat-transformed.glb       ← Player character model
└── models/                              ← Optional: Additional models
    ├── avatars/
    └── animations/
```

## Optional: 3D Models

You can also place your GLB/GLTF models here:
- `/public/models/avatars/` - Character models
- `/public/models/animations/` - Animation files
- `/public/models/` - Any other 3D assets

These can be loaded in components using:
```jsx
import { useGLTF } from '@react-three/drei'
const { scene } = useGLTF('/models/yourmodel.glb')
```

