# Spec: Material Interface and Implementations (Chapter 9)

**Reference:** ["Ray Tracing in One Weekend" - Chapter 9](https://raytracing.github.io/books/RayTracingInOneWeekend.html#diffusematerials)

**Related Specs:** `specs/vec3.md`, `specs/ray.md`, `specs/hittable.md`, `specs/sphere.md`, `specs/camera.md`

**Goal:** Define a material abstraction and implement a diffuse material type to enable realistic light scattering in the raytracer.

**Motivation:** Basic materials enable objects to interact with light realistically by controlling how rays scatter upon surface contact. This significantly enhances the visual quality of the rendered scenes.

## 1. Random Vector Generation (`src/vec3.ts` Extensions)

Add utility functions to generate random points and vectors for use in material scattering calculations:

* **`random(min: number = 0, max: number = 1): Vec3`**
  * Creates a new vector with random components between `min` and `max`.
  * Uses `Math.random()` for randomization.
  * Returns a new `Vec3` instance.

* **`randomInUnitSphere(): Vec3`**
  * Implements the rejection method to find a random point inside the unit sphere.
  * Repeatedly generates random points in the cube from (-1,-1,-1) to (1,1,1) until it finds one inside the unit sphere.
  * Returns a random point inside the unit sphere.

* **`randomUnitVector(): Vec3`**
  * Generates a random unit vector (a point on the unit sphere).
  * Uses `randomInUnitSphere()` and then normalizes the result, or can use a direct spherical coordinates approach.
  * Returns a unit vector with random orientation.

* **`randomInHemisphere(normal: Vec3): Vec3`**
  * Generates a random vector in the hemisphere oriented along the provided normal.
  * Uses `randomInUnitSphere()` and then ensures it's in the same hemisphere as the normal.
  * Returns a random vector in the hemisphere.

## 2. Material Interface (`src/material.ts`)

* **Purpose:** Define a common contract for all material types.
* **Interface:** `Material`
  * **`scatter(rIn: Ray, rec: HitRecord, attenuation: Color, scattered: Ray): boolean`**
    * Determines if and how a ray scatters when hitting the material.
    * Parameters:
      * `rIn`: The incoming ray that hit the surface.
      * `rec`: The hit record containing information about the intersection.
      * `attenuation`: Output parameter that will be set to the color attenuation of the scattered ray.
      * `scattered`: Output parameter that will be set to the scattered ray.
    * Returns `true` if the ray scatters, `false` if it's absorbed.
    * **Note:** Since TypeScript doesn't have output parameters like C++, we'll return a tuple containing the boolean, attenuation, and scattered ray.
  * **Updated Signature:** `scatter(rIn: Ray, rec: HitRecord): { scattered: Ray; attenuation: Color } | null`
    * Returns an object with the scattered ray and attenuation if scattering occurs, or `null` if the ray is absorbed.

## 3. Lambertian (Diffuse) Material (`src/material.ts`)

* **Class:** `Lambertian implements Material`
* **Properties:**
  * `albedo: Color` - The color reflectance of the material (how much light it reflects).
* **Constructor:** `constructor(albedo: Color)`
* **Methods:**
  * **`scatter(rIn: Ray, rec: HitRecord): { scattered: Ray; attenuation: Color } | null`**
    * Implements Lambertian diffuse reflection.
    * Calculates a scatter direction using the normal and a random unit vector.
    * Ensures the scatter direction is not zero (degenerate case).
    * Creates a scattered ray originating from the hit point and going in the scatter direction.
    * Returns an object containing the scattered ray and the albedo as attenuation.
    * For Lambertian materials, always returns a scatter result (no absorption).

## 4. HitRecord Updates (`src/hittable.ts`)

* **Update `HitRecord` class:**
  * Add property: `material: Material | null`
  * Initialize to `null` in the constructor.
  * **Note:** This introduces a circular dependency between `hittable.ts` and `material.ts`. We'll address this by:
    1. Adding forward declaration using TypeScript interfaces.
    2. Using the module pattern with proper imports/exports.

## 5. Sphere Updates (`src/sphere.ts`)

* **Update `Sphere` class:**
  * Add property: `material: Material`
  * Update constructor: `constructor(center: Point3, radius: number, material: Material)`
  * Update `hit` method to set the material in the hit record: `rec.material = this.material`

## 6. Camera Updates (`src/camera.ts`)

* **Update `rayColor` method:**
  * Add a depth parameter: `rayColor(r: Ray, depth: number): Color`
  * Add a depth check at the start to prevent infinite recursion.
  * If max depth is reached, return black (no light contribution).
  * Modify the hit logic to use the material's scatter method.
  * If scattering occurs, recursively call `rayColor` with the scattered ray and decremented depth.
  * Multiply the result by the attenuation to compute the final color.
  * Update the `render` method to call `rayColor` with an initial depth value (e.g., 50).

* **Implement gamma correction:**
  * Modify `writeColorToBuffer` function to apply gamma correction.
  * Take the square root of each color component before scaling to 0-255.

## 7. Scene Setup Updates (`src/raytracer.ts`)

* **Update world creation:**
  * Create materials for spheres.
  * Create spheres with materials.
  * Demonstrate at least two different colored diffuse materials in the scene.

## Implementation Notes

1. **Type Safety:** Maintain TypeScript's strong typing throughout the implementation.
2. **Performance:** Be mindful of computational overhead, especially with the recursive `rayColor` function.
3. **Random Number Generation:** Use the standard `Math.random()` for simplicity, but ensure proper behavior for random vector generation.
4. **Gamma Correction:** Implement proper gamma correction (gamma=2) for more accurate color representation.

## Testing Considerations

1. **Unit Tests:**
   * Test random vector generation functions for proper distribution and bounds.
   * Test Lambertian material scatter behavior.
   * Test recursive `rayColor` with depth limits.

2. **Visual Tests:**
   * Render a scene with diffuse materials.
   * Verify proper color bleeding and soft shadows.
   * Compare with reference images from the tutorial.
