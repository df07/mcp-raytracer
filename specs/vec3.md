# Spec: vec3 Utility Class (Chapter 3)

**Reference:** ["Ray Tracing in One Weekend" - Chapter 3](https://raytracing.github.io/books/RayTracingInOneWeekend.html#thevec3class)

**Goal:** Define a versatile 3-dimensional vector class (`vec3`) to be used for points, offsets, and colors throughout the raytracer.

**Motivation:** To provide a fundamental mathematical building block for geometric and color calculations required in ray tracing.

**Requirements:**

1.  **File Location:** `src/vec3.ts`
2.  **Class Name:** `vec3`
3.  **Representation:**
    *   Store three numeric components using an array named `e`: `e: [number, number, number]`.
4.  **Constructors:**
    *   Default constructor initializing all components to `0`.
    *   Constructor accepting three numbers (`e0`, `e1`, `e2`) to initialize components.
5.  **Accessors:**
    *   `x(): number` returning `e[0]`
    *   `y(): number` returning `e[1]`
    *   `z(): number` returning `e[2]`
6.  **Operator Methods:**
    *   `negate(): vec3`: Returns a new `vec3` with negated components.
    *   `add(v: vec3): vec3`: Returns a new `vec3` representing the vector sum.
    *   `subtract(v: vec3): vec3`: Returns a new `vec3` representing the vector difference.
    *   `multiply(t: number): vec3`: Returns a new `vec3` representing scalar multiplication.
    *   `multiplyVec(v: vec3): vec3`: Returns a new `vec3` representing element-wise multiplication.
    *   `divide(t: number): vec3`: Returns a new `vec3` representing scalar division.
    *   `lengthSquared(): number`: Returns the squared magnitude of the vector.
    *   `length(): number`: Returns the magnitude (length) of the vector.
7.  **Utility Functions (Exported from `src/vec3.ts`):**
    *   `dot(u: vec3, v: vec3): number`: Computes the dot product of two vectors.
    *   `cross(u: vec3, v: vec3): vec3`: Computes the cross product of two vectors.
    *   `unitVector(v: vec3): vec3`: Returns a new `vec3` representing the normalized (unit length) vector.

8.  **Type Aliases (Exported from `src/vec3.ts`):**
    *   `export type point3 = vec3;`: For semantic clarity with spatial coordinates.
    *   `export type color = vec3;`: For semantic clarity with RGB color data.

**Implementation Notes:**

*   Methods should return *new* `vec3` instances rather than modifying the existing one (promoting immutability).
*   Type aliases `point3` and `color` should also be defined (see `specs/color.md`). 