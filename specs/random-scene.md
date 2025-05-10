# Spec: Random Sphere Scene Generator

**Reference:** Based on "Ray Tracing in One Weekend" - Random Scene concept

**Related Specs:** `specs/sphere.md`, `specs/vec3.md`, `specs/material.md`, `specs/raytracer.md`

**Goal:** Create a function to dynamically generate a scene with random spheres positioned in front of the camera.

**Motivation:** Enable generation of more complex, visually interesting scenes with variable complexity and randomness, while maintaining control over scene parameters.

## Requirements

### 1. Scene Generation Function (`src/sceneGenerator.ts`)

* **Signature:** `generateRandomSphereScene(count: number, options?: RandomSceneOptions): HittableList`
* **Purpose:** Generate a scene with a specified number of non-overlapping spheres with random properties.
* **Parameters:**
  * `count: number` - The number of spheres to generate
  * `options?: RandomSceneOptions` - Optional configuration parameters for scene generation

* **RandomSceneOptions Interface:**
  ```typescript
  interface RandomSceneOptions {
    centerPoint?: Point3;       // Center point for sphere distribution (default: 0,0,-1)
    radius?: number;            // Radius of the distribution area (default: 2)
    minSphereRadius?: number;   // Minimum radius for generated spheres (default: 0.05)
    maxSphereRadius?: number;   // Maximum radius for generated spheres (default: 0.2)
    groundSphere?: boolean;     // Whether to include a large ground sphere (default: true)
    groundY?: number;           // Y-position of the ground sphere (default: -1000)
    groundRadius?: number;      // Radius of the ground sphere (default: 1000)
    groundMaterial?: Material;  // Material for the ground sphere
  }
  ```

* **Return Value:**
  * `HittableList` - A world object containing all the generated spheres

### 2. Sphere Generation Logic

* **Distribution:**
  * Spheres should be distributed randomly within a spherical region centered at `centerPoint` with radius `options.radius`.
  * Each sphere's position should be calculated to ensure it doesn't overlap with previously placed spheres.
  * Spheres should be positioned in the negative Z direction from the camera (in front of the camera).

* **Size Scaling:**
  * Sphere radius should be randomly selected between `minSphereRadius` and `maxSphereRadius`.
  * The maximum possible radius should decrease as the sphere count increases to allow for more spheres to fit in the scene.

* **Materials:**
  * Randomly select between Lambertian and Metal materials for each sphere.
  * For Lambertian materials, use random colors.
  * For Metal materials, use random colors and random fuzziness (0.0 to 0.5).
  * Distribution should be approximately 70% Lambertian, 30% Metal.

* **Ground Sphere:**
  * If `groundSphere` is true, include a large sphere beneath the scene to serve as ground.
  * The ground sphere should have a Lambertian material with a light color (e.g., light gray or light tan).

### 3. Integration with Camera and Raytracer

* **Create a Scene Configuration Type:**
  ```typescript
  type SceneConfig = 
    | { type: 'default' }
    | { type: 'random', count: number, options?: RandomSceneOptions };
  ```

* **Update `raytracer.ts`:**
  * Modify `generateImageBuffer` to accept a scene configuration parameter: `sceneConfig: SceneConfig = { type: 'default' }`.
  * Based on `sceneConfig.type`:
    * If 'default', use the default scene (current behavior).
    * If 'random', call `generateRandomSphereScene(sceneConfig.count, sceneConfig.options)`.

* **Update `index.ts` (MCP Entry Point):**
  * Update the `raytrace` tool to accept a parameter for scene configuration.
  * Pass this configuration to `generateImageBuffer`.

### 4. Error Handling

* **Validation:**
  * Validate that `count` is a positive integer.
  * If sphere placement can't be achieved after a reasonable number of attempts, reduce the sphere's radius and try again.
  * If placement still fails after multiple radius reductions, skip that sphere and continue.

## Implementation Guidance

* **Collision Detection:**
  * For each new sphere, check if its position would cause it to intersect with any previously placed sphere.
  * Two spheres intersect if the distance between their centers is less than the sum of their radii.
  * Formula: `||c1 - c2|| < r1 + r2`, where `c1` and `c2` are sphere centers and `r1` and `r2` are their radii.

* **Performance Optimization:**
  * Use a spatial partitioning structure for efficient collision detection when placing many spheres.
  * Implement a maximum attempt count for sphere placement to prevent infinite loops.

* **Material Generation:**
  * Create helper functions to generate random materials and colors.
  * Consider using a seeded random number generator for reproducible scenes.

* **Vector Operations:**
  * Leverage the existing `Vec3` class for position calculations.
  * Use `Vec3.random()` and similar methods for generating random points.

## Testing Considerations

* **Unit Tests:**
  * Test that generated scenes contain the expected number of non-overlapping spheres.
  * Verify that sphere radii decrease appropriately as sphere count increases.
  * Ensure materials are properly distributed according to the specified ratios.

* **Visual Tests:**
  * Render scenes with different sphere counts to verify visual quality and distribution.
  * Verify performance remains acceptable with large sphere counts.

## Example Usage

```typescript
// Default scene (current behavior)
const imageBuffer1 = await generateImageBuffer(400, 100, true, { type: 'default' });

// Random scene with 10 spheres
const imageBuffer2 = await generateImageBuffer(400, 100, true, { 
  type: 'random', 
  count: 10 
});

// Random scene with 50 spheres and custom options
const options = {
  centerPoint: new Vec3(0, 0, -2),
  radius: 3,
  minSphereRadius: 0.05,
  maxSphereRadius: 0.15
};
const imageBuffer3 = await generateImageBuffer(400, 100, true, { 
  type: 'random', 
  count: 50, 
  options 
});
```
