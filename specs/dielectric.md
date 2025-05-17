# Spec: Dielectric Material (Chapter 11)

**Reference:** ["Ray Tracing in One Weekend" - Chapter 11](https://raytracing.github.io/books/RayTracingInOneWeekend.html#dielectrics)

**Goal:** Implement dielectric materials for transparent objects like glass, water, and diamonds.

## 1. Requirements

* Add a `refract` method to `Vec3` class to calculate refracted ray directions
* Create a `Dielectric` class implementing the `Material` interface
* Implement Schlick's approximation for reflectance at different angles
* Support both entering and exiting transparent media
* Handle total internal reflection when appropriate

## 2. Properties

* `indexOfRefraction` - Refractive index of the material (examples: air ≈ 1.0, glass ≈ 1.5, water ≈ 1.33)

## 3. Behavior

* No light absorption - attenuation is always (1,1,1)
* Calculate whether ray is entering or exiting material to determine refraction ratio
* Handle both reflection and refraction based on angle and material properties
* Implement hollow glass objects using negative radius spheres

## 4. Scene Updates

* Add glass/transparent objects to scenes
* Demonstrate hollow glass objects
* Show interaction between different material types

## 5. Implementation Notes

* Follow the equations for refraction from Snell's law
* Use randomness to blend reflection and refraction for more realistic glass
* Pay attention to floating-point precision in calculations