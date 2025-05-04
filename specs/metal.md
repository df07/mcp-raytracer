# Spec: Metal Material (Chapter 10)

**Reference:** ["Ray Tracing in One Weekend" - Chapter 10](https://raytracing.github.io/books/RayTracingInOneWeekend.html#metal)

**Related Specs:** `specs/material.md`, `specs/vec3.md`, `specs/ray.md`, `specs/hittable.md`

**Goal:** Implement a metal material that reflects light according to the law of reflection, with optional fuzzy reflections.

**Motivation:** Adding metal materials will enable surfaces that reflect light in a specular manner, rather than diffusing it in random directions. This will allow for shiny objects in our rendered scenes. Additionally, adding an adjustable fuzziness property will enable control over how perfect vs. rough the metal reflections appear.

## 1. Reflection Vector Calculation (`src/vec3.ts` Extensions)

* **`reflect(v: Vec3, n: Vec3): Vec3`**
  * Calculates the reflection of a vector `v` around a normal vector `n`.
  * Formula: `v - 2 * dot(v, n) * n`
  * Parameters:
    * `v`: The incident vector to reflect (assumed to be pointing in).
    * `n`: The normal vector to reflect around (assumed to be unit length).
  * Returns a new `Vec3` representing the reflection vector.
  * Should be exported as a utility function.

## 2. Metal Material (`src/material.ts`)

* **Class:** `Metal implements Material`
* **Properties:**
  * `albedo: Color` - The reflective color of the metal surface.
  * `fuzz: number` - Controls the roughness of the metal surface.
    * Value range: [0.0, 1.0], where:
      * 0.0 = perfect reflection (mirror-like)
      * 1.0 = maximum fuzziness (rougher reflection)
    * Values outside this range should be clamped.
* **Constructor:** `constructor(albedo: Color, fuzz: number = 0.0)`
  * Sets the `albedo` color of the metal.
  * Sets the `fuzz` factor, clamping it to the range [0.0, 1.0].
* **Methods:**
  * **`scatter(rIn: Ray, rec: HitRecord): { scattered: Ray; attenuation: Color } | null`**
    * Implements specular reflection with optional fuzziness.
    * Calculates the perfect reflection vector using the `reflect` function.
    * If fuzz > 0, adds randomness to the reflection direction by adding a scaled random vector within the unit sphere.
    * Creates a scattered ray from the hit point along the fuzzy reflection direction.
    * Returns the scattered ray and albedo as attenuation only if the scattered ray is in the same hemisphere as the normal.
    * If scattered ray is not in the same hemisphere (reflecting into the surface), returns `null` to absorb the ray.

## 3. Scene Updates (`src/raytracer.ts`)

* **Update world creation:**
  * Create metal materials with different albedos and fuzziness values.
  * Add spheres using the metal materials to the scene.
  * Modify the existing scene to include both diffuse (Lambertian) and metal spheres.
  * Suggested scene:
    * Large ground sphere: Lambertian with light color
    * Center sphere: Lambertian with a color
    * Left sphere: Metal with high reflectivity
    * Right sphere: Metal with moderate reflectivity and some fuzziness

## 4. Expected Result

The updated renderer should produce an image showing:
* Different materials interacting with light in distinct ways.
* Metal objects reflecting the world around them.
* Fuzzy vs. clear reflections based on the fuzziness parameter.
* Proper lighting interaction between diffuse and reflective surfaces.
