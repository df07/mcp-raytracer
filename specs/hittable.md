# Spec: Hittable Interface and List

**Reference:** ["Ray Tracing in One Weekend"](https://raytracing.github.io/books/RayTracingInOneWeekend.html#surfacenormalsandmultipleobjects)

**Related Specs:** `specs/vec3.md`, `specs/ray.md`, `specs/interval.md`

**Goal:** Define a common interface for objects that can be intersected by rays and a container class to manage multiple such objects.

## Hittable Abstraction (`src/hittable.ts`)

*   **Purpose:** Defines a common interface for objects that can be intersected by rays.
*   **`HitRecord` Class/Interface:**
    *   Stores information about a ray-object intersection.
    *   **Properties:**
        *   `p: point3`: The intersection point in world space.
        *   `normal: vec3`: The outward surface normal at the intersection point `p`.
        *   `t: number`: The parameter along the ray where the intersection occurred (`P(t) = A + t*b`).
        *   `frontFace: boolean`: Indicates whether the ray hit the front face (normal points against the ray) or the back face (normal points along the ray).
    *   **`setFaceNormal` Method:**
        *   **Signature:** `setFaceNormal(r: ray, outwardNormal: vec3): void`
        *   **Purpose:** Sets the `normal` and `frontFace` properties. Ensures the stored `normal` always points *against* the incident ray.
        *   Calculates `frontFace = r.direction().dot(outwardNormal) <= 0`. // Updated condition
        *   Sets `normal = frontFace ? outwardNormal : outwardNormal.negate()`.
*   **`Hittable` Abstract Class/Interface:**
    *   Defines the contract for any object that can be hit by a ray.
    *   **Abstract `hit` Method:**
        *   **Signature:** `hit(r: Ray, rayT: Interval): HitRecord | null` // Updated signature
        *   **Purpose:** Determines if the ray `r` intersects the object within the valid interval `rayT`.
        *   **If Intersection Occurs:**
            *   Returns a `HitRecord` containing the details of the *closest* intersection found within the `rayT` interval.
        *   **If No Intersection Occurs:**
            *   Returns `null`.

## Hittable List (`src/hittable_list.ts`)

*   **Purpose:** Manages a collection of `Hittable` objects.
*   **Dependencies:** `Hittable`, `HitRecord` from `src/hittable.ts`, `Interval` from `src/interval.ts`.
*   **`HittableList` Class:**
    *   Implements the `Hittable` interface.
    *   **Constructor:** Takes an optional initial `Hittable` object.
    *   **Properties:** `objects: Hittable[]`: An array to store the hittable objects.
    *   **`add` Method:** Adds a `Hittable` object to the list.
    *   **`clear` Method:** Removes all objects from the list.
    *   **`hit` Method (implements `Hittable.hit`):**
        *   **Signature:** `hit(r: Ray, rayT: Interval): HitRecord | null` // Updated signature
        *   **Purpose:** Checks if the ray `r` hits *any* object in the `objects` list within the interval `rayT`.
        *   **Logic:**
            *   Iterates through each object in the `objects` list.
            *   Calls the `hit` method of the current object, passing a potentially narrowed interval `[rayT.min, closest_so_far]`.
            *   Keeps track of the closest hit found so far (`closest_so_far`).
            *   If any object is hit, stores the `HitRecord` of the closest hit.
            *   Returns the `HitRecord` for the closest hit found, or `null` if no objects were hit.