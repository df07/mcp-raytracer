# Spec: Light Emissive Material

**Reference:** ["Ray Tracing: The Next Week" - Lights](https://raytracing.github.io/books/RayTracingTheNextWeek.html#lights)

**Related Specs:** `specs/material.md`, `specs/vec3.md`, `specs/ray.md`, `specs/hittable.md`

**Goal:** Implement emissive materials that can function as light sources in the raytracer.

**Motivation:** Adding light sources allows for more realistic scene illumination and enables advanced effects like hard and soft shadows, while maintaining the current background gradient.

## 1. Default Material Base Class (`src/materials/material.ts`)

* **Class:** `DefaultMaterial implements Material`
* **Methods:**
  * **`scatter(rIn: Ray, rec: HitRecord): { scattered: Ray; attenuation: Color } | null`**
    * Default implementation returns `null` (no scattering).
  * **`emitted(rec: HitRecord): Color`**
    * Default implementation returns black color (no emission): `new Color(0, 0, 0)`.
* **Usage:**
  * All other material classes should extend this base class.
  * Materials like Lambertian, Metal, and Dielectric would override the `scatter` method but inherit the default `emitted` method.

## 2. DiffuseLight Material (`src/materials/diffuseLight.ts`)

* **Class:** `DiffuseLight extends DefaultMaterial`
* **Properties:**
  * `emit: Color` - The color/intensity of the light emitted by the material.
* **Constructor:** `constructor(emit: Color)`
  * Takes a `Color` object representing the emission color and intensity.
* **Methods:**
  * **Override `scatter`:** Inherits default implementation that returns `null` (no scattering).
  * **Override `emitted(rec: HitRecord): Color`**
    * Returns the emission color/intensity of the material.

## 3. Material Interface Updates (`src/materials/material.ts`)

* **Update `Material` interface:**
  * Add new method: `emitted(rec: HitRecord): Color`
  * Add `DefaultMaterial` class in the same file.
  * All existing material implementations should extend the new `DefaultMaterial` base class.

## 4. Ray Color Implementation Updates (`src/camera.ts`)

* **Update `rayColor` method:**
  * Modify to account for emitted light from materials.
  * When a ray hits an object, add the emitted light to the accumulated color.
  * Handle the case where no scattering occurs but light is emitted.
  * Continue to use the background gradient when rays miss all objects.

## 5. Scene Updates

* **Update only the default scene:**
  * Add a sun-like sphere with a `DiffuseLight` material.
  * Position it high in the sky but out of the direct view of the camera.
  * Make it very bright (high intensity) to simulate sunlight.
  * The other existing scenes should remain unchanged.

## Implementation Notes

1. **Light Intensity:**
   * Support colored lights with different intensities by adjusting the emission color values.
   * Higher values in the emission `Color` will result in brighter lights.
   * Allow for extremely bright lights (values > 1.0) to simulate high-intensity light sources like the sun.

2. **Performance Considerations:**
   * Emissive materials don't require sampling for scattering directions, potentially improving performance.
   * Consider optimizing the case where a ray hits an emissive material with no scattering.

3. **Testing Focus:**
   * Verify that emissive materials correctly emit light without scattering.
   * Ensure the background gradient is preserved when rays miss all objects.
   * Check that shadows are properly formed from opaque objects blocking light.
   * Test with various colored light sources at different intensities.

4. **Future Extensions:**
   * This implementation creates a foundation for area lights (when combined with rectangular objects in the future).
   * May be combined with importance sampling in the future for more efficient rendering. 