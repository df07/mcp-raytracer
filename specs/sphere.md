# Spec: Sphere

**Reference:** ["Ray Tracing in One Weekend"](https://raytracing.github.io/books/RayTracingInOneWeekend.html#surfacenormalsandmultipleobjects)

**Related Specs:** `specs/vec3.md`, `specs/ray.md`, `specs/hittable.md`, `specs/interval.md`

**Goal:** Define a sphere geometric primitive that conforms to the `Hittable` interface.

## Sphere Definition (`src/sphere.ts`)

*   **Purpose:** Defines a sphere object and a method to check for ray intersection.
*   **Dependencies:** `Hittable`, `HitRecord` from `src/hittable.ts`, `ray` from `src/ray.ts`, `point3`, `vec3` from `src/vec3.ts`, `Interval` from `src/interval.ts`.
*   **`Sphere` Class:**
    *   **Inheritance:** Implements the `Hittable` interface.
    *   Represents a sphere in 3D space.
    *   **Constructor:** Takes `center: point3` and `radius: number`.
    *   **Properties:** `center: point3`, `radius: number`.
    *   **`hit` Method (implements `Hittable.hit`):**
        *   **Signature:** `hit(r: Ray, rayT: Interval): HitRecord | null` // Updated signature
        *   **Purpose:** Checks if the ray `r` intersects the sphere within the valid interval `rayT`.
        *   **Calculation:** Uses the quadratic formula derived from the ray-sphere intersection equation: `(P(t) - C) . (P(t) - C) = r^2`, where `P(t) = A + t*b` is the ray, `C` is the sphere center (`this.center`), and `r` is the radius (`this.radius`).
        *   **Intersection Logic:**
            *   Calculate the vector `oc = r.origin() - this.center`.
            *   Calculate the quadratic coefficients: `a = r.direction().lengthSquared()`, `half_b = oc.dot(r.direction())`, `c = oc.lengthSquared() - this.radius*this.radius`.
            *   Calculate the discriminant: `discriminant = half_b*half_b - a*c`. If negative, no real roots, return `null`.
            *   Calculate `sqrtDiscriminant = Math.sqrt(discriminant)`.
            *   Find the two potential roots:
                *   `root1 = (-half_b - sqrtDiscriminant) / a`
                *   `root2 = (-half_b + sqrtDiscriminant) / a`
            *   Check if either root falls within the valid *open* interval defined by `rayT.surrounds()`:
                *   Check `root1`: If `rayT.surrounds(root1)`, use `root1` as the intersection `t`.
                *   Else, check `root2`: If `rayT.surrounds(root2)`, use `root2` as the intersection `t`.
                *   Otherwise, no valid intersection in the range, return `null`.
            *   A valid intersection `t` was found:
                *   Create a new `HitRecord` `rec`.
                *   Set `rec.t` with the chosen root `t`.
                *   Calculate the intersection point `rec.p = r.at(rec.t)`.
                *   Calculate the outward normal at the intersection point: `outwardNormal = (rec.p - this.center).divide(this.radius)`.
                *   Use `rec.setFaceNormal(r, outwardNormal)` to set the correct normal direction and `frontFace` flag in the record.
                *   Return the populated `rec`.