# Spec: Interval Class

**Reference:** ["Ray Tracing in One Weekend" - Section 6.8](https://raytracing.github.io/books/RayTracingInOneWeekend.html#anintervalclass)

**Related Specs:** `specs/hittable.md`

**Goal:** Define a utility class to represent a 1D interval [min, max] and provide related operations. This will be used primarily for managing the valid range of `t` values in ray intersection tests.

## Interval Class (`src/interval.ts`)

*   **Purpose:** Represents a mathematical interval [min, max].
*   **Properties:**
    *   `min: number`: The minimum value of the interval (inclusive).
    *   `max: number`: The maximum value of the interval (inclusive).
*   **Static Constants:**
    *   `EMPTY: Interval`: Represents an empty interval (min = +Infinity, max = -Infinity).
    *   `UNIVERSE: Interval`: Represents the interval of all real numbers (min = -Infinity, max = +Infinity).
*   **Constructor:**
    *   `constructor(min?: number, max?: number)`: Initializes the interval. Defaults to `EMPTY` if no arguments are provided.
*   **Methods:**
    *   `size(): number`: Returns the size of the interval (`max - min`). Returns a negative value for empty intervals.
    *   `contains(x: number): boolean`: Returns `true` if `min <= x <= max`.
    *   `surrounds(x: number): boolean`: Returns `true` if `min < x < max`.
    *   `clamp(x: number): number`: Returns `x` clamped to the interval `[min, max]`. If `x < min`, returns `min`. If `x > max`, returns `max`. Otherwise, returns `x`.
*   **Integration:**
    *   The `hit` methods in `Hittable`, `HittableList`, and `Sphere` will be updated to accept an `Interval` object instead of separate `tMin` and `tMax` parameters.
