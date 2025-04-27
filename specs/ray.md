# Spec: Ray Class

**Reference:** ["Ray Tracing in One Weekend" - Chapter 4](https://raytracing.github.io/books/RayTracingInOneWeekend.html#raysasimplecameraandbackground)
**Related Specs:** `specs/vec3.md`

**Goal:** Define a fundamental data structure (`ray`) representing a 3D ray, defined by an origin point and a direction vector.

**Motivation:** This class serves as the core entity for simulating light paths within the ray tracing algorithm. Rays are cast from the camera through pixels into the scene.

**Functional Requirements:**

1.  **File Location:** Implement this class within `src/ray.ts`.
2.  **Class Name:** The class must be named `ray`.
3.  **Dependencies:** The implementation will depend on the `point3` and `vec3` types defined in `src/vec3.ts`.
4.  **State:** An instance of the `ray` class must encapsulate:
    *   An origin point (`point3`).
    *   A direction vector (`vec3`).
5.  **Initialization:** The class must provide a mechanism (e.g., a constructor) to create a new `ray` instance by specifying its origin point and direction vector.
6.  **Core Functionality:**
    *   **Origin Access:** Provide a method to retrieve the ray's origin point.
    *   **Direction Access:** Provide a method to retrieve the ray's direction vector.
    *   **Point Calculation:** Provide a method (`at`) that accepts a numeric parameter `t` and returns the 3D point (`point3`) along the ray corresponding to that parameter value. This point is calculated based on the formula P(t) = A + t*b, where A is the origin and b is the direction.

**Implementation Guidance:**

*   The implementation should leverage the existing `vec3` class for vector operations required in the `at` method (scalar multiplication and vector addition).
*   Ensure correct usage of `point3` and `vec3` types for origin and direction respectively. 