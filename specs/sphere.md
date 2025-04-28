# Spec: Sphere

**Reference:** ["Ray Tracing in One Weekend"](https://raytracing.github.io/books/RayTracingInOneWeekend.html#surfacenormalsandmultipleobjects)

**Related Specs:** `specs/vec3.md`, `specs/ray.md`, `specs/hittable.md`

**Goal:** Define a sphere geometric primitive that conforms to the `Hittable` interface.

## Sphere Definition (`src/sphere.ts`)

*   **Purpose:** Defines a sphere object and a method to check for ray intersection.
*   **Dependencies:** `Hittable`, `HitRecord` from `src/hittable.ts`, `ray` from `src/ray.ts`, `point3`, `vec3` from `src/vec3.ts`.
*   **`Sphere` Class:**
    *   **Inheritance:** Implements the `Hittable` interface.
    *   Represents a sphere in 3D space.
    *   **Constructor:** Takes `center: point3` and `radius: number`.
    *   **Properties:** `center: point3`, `radius: number`.
    *   **`hit` Method (implements `Hittable.hit`):**
        *   **Signature:** `hit(r: ray, tMin: number, tMax: number, rec: HitRecord): boolean`
        *   **Purpose:** Checks if the ray `r` intersects the sphere within the valid interval `[tMin, tMax]`.
        *   **Calculation:** Uses the quadratic formula derived from the ray-sphere intersection equation: `(P(t) - C) . (P(t) - C) = r^2`, where `P(t) = A + t*b` is the ray, `C` is the sphere center (`this.center`), and `r` is the radius (`this.radius`).
        *   **Intersection Logic:**
            *   Calculate the vector `oc = r.origin() - this.center`.
            *   Calculate the quadratic coefficients: `a = r.direction().lengthSquared()`, `half_b = oc.dot(r.direction())`, `c = oc.lengthSquared() - this.radius*this.radius`.
            *   Calculate the discriminant: `discriminant = half_b*half_b - a*c`. If negative, no real roots, return `false`.
            *   Calculate `sqrtDiscriminant = Math.sqrt(discriminant)`.
            *   Find the two potential roots:
                *   `root1 = (-half_b - sqrtDiscriminant) / a`
                *   `root2 = (-half_b + sqrtDiscriminant) / a`
            *   Check if either root falls within the valid range `[tMin, tMax]`:
                *   Check `root1`: If `root1 > tMin` and `root1 < tMax`, use `root1` as the intersection `t`.
                *   Else, check `root2`: If `root2 > tMin` and `root2 < tMax`, use `root2` as the intersection `t`.
                *   Otherwise, no valid intersection in the range, return `false`.
            *   A valid intersection `t` was found:
                *   Update `rec.t` with the chosen root `t`.
                *   Calculate the intersection point `rec.p = r.at(rec.t)`.
                *   Calculate the outward normal at the intersection point: `outwardNormal = (rec.p - this.center).divide(this.radius)`.
                *   Use `rec.setFaceNormal(r, outwardNormal)` to set the correct normal direction and `frontFace` flag in the record.
                *   Return `true`. 