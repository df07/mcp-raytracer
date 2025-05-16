# Spheres Scene

## Overview
A scene with multiple randomly positioned non-overlapping spheres with varied materials and sizes.

## Requirements

- Create a scene type called "spheres" that generates randomly positioned spheres 
- Allow configuration of the number of spheres and scene properties
- Prevent spheres from overlapping
- Adjust sphere size based on the number of spheres
- Support random seed for reproducible scenes

## Configuration Options

The `SpheresSceneOptions` interface provides the following customization options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| count | number | 10 | Number of spheres to generate |
| centerPoint | Point3 | (0,0,-2) | Center point for sphere distribution |
| radius | number | 1.25 | Radius of the distribution area |
| minSphereRadius | number | 0.1 | Minimum radius for generated spheres |
| maxSphereRadius | number | 0.2 | Maximum radius of generated spheres |
| groundSphere | boolean | false | Whether to include a large ground sphere |
| groundY | number | -100.5 | Y-position of the ground sphere |
| groundRadius | number | 100 | Radius of the ground sphere |
| groundMaterial | Material | Lambertian(0.8,0.8,0.0) | Material for the ground sphere |
| seed | number | random | Random seed for deterministic scene generation |

## Usage Example

```typescript
// Create a spheres scene with default options
const scene = generateScene({ type: 'spheres' });

// Create a spheres scene with custom options
const customScene = generateScene({
  type: 'spheres',
  options: {
    count: 50,
    radius: 2,
    groundSphere: true,
    seed: 12345
  }
});
```

## Implementation Notes

- Spheres are generated with random materials and positions
- Sphere placement ensures no overlapping
- Sphere radius decreases as sphere count increases
- Supports both Lambertian and Metal materials
- Uses a Bounding Volume Hierarchy (BVH) for efficient rendering
