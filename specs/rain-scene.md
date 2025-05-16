# Rain Scene

## Overview
A specialized scene type that renders evenly distributed metallic spheres in a 3D volume, resembling raindrops suspended in air over a ground surface.

## Requirements

- Create a new scene type called "rain" that generates metallic spheres distributed in a grid-like pattern
- Allow configuration of the number of spheres, their size, and material properties
- Include a ground sphere as an optional base for the scene
- Support customization of the distribution volume dimensions
- Use a seed value for reproducible random variations

## Configuration Options

The `RainSceneOptions` interface provides the following customization options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| count | number | 50 | Number of raindrops (spheres) to generate |
| sphereRadius | number | 0.05 | Radius of each raindrop sphere |
| width | number | 2 | Width of the distribution volume |
| height | number | 2 | Height of the distribution volume |
| depth | number | 2 | Depth of the distribution volume |
| centerPoint | Point3 | (0,0,-2) | Center point of the distribution volume |
| metalFuzz | number | 0.1 | Fuzziness of the metallic material (0-1) |
| groundSphere | boolean | true | Whether to include a ground sphere |
| groundY | number | -100.5 | Y-position of the ground sphere |
| groundRadius | number | 100 | Radius of the ground sphere |
| groundMaterial | Material | Lambertian(0.8,0.8,0.0) | Material for the ground sphere |
| seed | number | random | Random seed for deterministic scene generation |

## Usage Example

```typescript
// Create a rain scene with default options
const scene = generateScene({ 
  type: 'rain',
  camera: {
    vfov: 40,
    lookFrom: new Vec3(0, 1, 3),
    lookAt: new Vec3(0, 0, -2)
  }
});

// Create a rain scene with custom options
const customScene = generateScene({
  type: 'rain',
  camera: { 
    vfov: 60,
    lookFrom: new Vec3(1, 1, 4)
  },
  options: {
    count: 100,
    sphereRadius: 0.025,
    width: 3,
    height: 4,
    depth: 3,
    metalFuzz: 0.2
  }
});
```

## Implementation Notes

- Spheres are distributed in a grid-like pattern with small random variations
- The metallic material has slight variations in brightness for visual interest
- The scene uses a Bounding Volume Hierarchy (BVH) for efficient rendering
- The number of spheres per dimension is calculated as the cube root of the total count 