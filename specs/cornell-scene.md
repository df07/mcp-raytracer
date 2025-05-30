# Cornell Box Scene

## Overview
A Cornell box scene featuring the classic red and green walls with a ceiling light. Uses proper quad geometry for accurate Cornell box representation. Supports different variants for testing and visualization.

## Requirements

- Create a scene type called "cornell" that generates a Cornell box environment
- Use quads for the walls (left red, right green, back white, bottom white, ceiling white)
- Include a white diffuse light quad on the ceiling for illumination
- Support different variants: "spheres" (with two spheres inside) and "empty" (no objects inside)
- Provide appropriate camera positioning for the classic Cornell box view

## Configuration Options

The `CornellSceneOptions` interface provides the following variant options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| variant | string | 'spheres' | Cornell box variant ('spheres', 'empty') |

## Variants

### Spheres Variant
- Includes two spheres inside the Cornell box
- Left sphere: Metal material with slight fuzz
- Right sphere: Glass (dielectric) material
- Default variant for classic Cornell box visualization

### Empty Variant  
- Empty Cornell box with just the walls and ceiling light
- Useful for testing lighting and wall materials
- Good baseline for adding custom objects

## Usage Example

```typescript
// Create a Cornell box scene with spheres (default)
const scene = generateScene({ type: 'cornell' });

// Create a Cornell box scene with spheres explicitly
const spheresScene = generateScene({
  type: 'cornell',
  options: {
    variant: 'spheres'
  }
});

// Create an empty Cornell box
const emptyScene = generateScene({
  type: 'cornell',
  options: {
    variant: 'empty'
  }
});
```

## Implementation Notes

- Uses quad geometry for accurate wall representation
- Left wall: Red Lambertian material
- Right wall: Green Lambertian material  
- Back wall: White Lambertian material
- Bottom wall: White Lambertian material
- Ceiling: White Lambertian material
- Ceiling light: White diffuse light for illumination (positioned slightly below ceiling)
- Camera positioned to view the box from the front
- Uses BVH for efficient rendering

## Color Scheme

- Left wall: Red (0.65, 0.05, 0.05)
- Right wall: Green (0.12, 0.45, 0.15)
- Back and bottom walls: White (0.73, 0.73, 0.73)
- Ceiling light: White light (15, 15, 15) - high intensity for illumination
- Spheres variant - Left sphere: Metallic with slight fuzz
- Spheres variant - Right sphere: Glass (dielectric with refractive index 1.5) 