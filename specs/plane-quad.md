# Spec: Plane and Quad

**Reference:** ["Ray Tracing: The Next Week"](https://raytracing.github.io/books/RayTracingTheNextWeek.html) - Quads section

**Related Specs:** `specs/vec3.md`, `specs/ray.md`, `specs/hittable.md`, `specs/interval.md`, `specs/aabb-bvh.md`

**Goal:** Define plane and quad geometric primitives that conform to the `Hittable` and `PDFHittable` interfaces, with quad using composition to leverage plane intersection logic.

## Plane Class (`src/entities/plane.ts`)

* **Purpose:** Defines an infinite plane in 3D space that can be intersected by rays.
* **Dependencies:** `Hittable`, `HitRecord` from `src/geometry/hittable.ts`, `Ray` from `src/geometry/ray.ts`, `Point3`, `Vec3` from `src/geometry/vec3.ts`, `Interval` from `src/geometry/interval.ts`, `Material` from `src/materials/material.ts`, `AABB` from `src/geometry/aabb.ts`.

### Plane Properties

* `q: Point3` - A reference point on the plane
* `u: Vec3` - First basis vector defining the plane orientation
* `v: Vec3` - Second basis vector defining the plane orientation  
* `material: Material` - The material properties
* `normal: Vec3` - The unit normal vector to the plane (computed as `unit_vector(u × v)`)
* `d: number` - Distance from origin to the plane along the normal direction (computed as `normal · q`)
* `w: Vec3` - Cached vector for coordinate calculations (computed as `(u × v) / |u × v|²`)

### Plane Constructor

* **Signature:** `constructor(q: Point3, u: Vec3, v: Vec3, material: Material)`
* **Purpose:** Creates an infinite plane defined by a point and two basis vectors.
* **Implementation:**
  - Store `q`, `u`, `v`, and `material`
  - Compute `normal = unit_vector(u.cross(v))`
  - Compute `d = normal.dot(q)`
  - Compute `w = u.cross(v).divide(u.cross(v).lengthSquared())`

### Plane Intersection Method

* **Signature:** `intersect(r: Ray, rayT: Interval): { t: number, alpha: number, beta: number } | null`
* **Purpose:** Performs ray-plane intersection and calculates barycentric coordinates.
* **Algorithm:**
  1. **Parallel check:** Calculate `denom = normal · ray.direction`
     - If `|denom| < 1e-8`, ray is parallel to plane, return `null`
  2. **Intersection parameter:** Calculate `t = (d - normal · ray.origin) / denom`
     - If `t` is outside `rayT` interval, return `null`
  3. **Barycentric coordinates:** Calculate intersection point and local coordinates
     - `intersection = ray.at(t)`
     - `planar_hit_point = intersection - q`
     - `alpha = w · (planar_hit_point × v)`
     - `beta = w · (u × planar_hit_point)`
  4. **Return result:** `{ t, alpha, beta }`

### Plane Hit Method (implements `Hittable.hit`)

* **Signature:** `hit(r: Ray, rayT: Interval): HitRecord | null`
* **Purpose:** Checks if the ray intersects the infinite plane within the valid interval.
* **Algorithm:**
  1. Call `intersect(r, rayT)` to get intersection data
  2. If intersection exists, create and return `HitRecord` with:
     - `t` from intersection result
     - `p = r.at(t)` (intersection point)
     - `material` from plane
     - `normal` and `frontFace` using `setFaceNormal(r, normal)`
     - `u = alpha`, `v = beta` (texture coordinates)

### Plane Bounding Box Method (implements `Hittable.boundingBox`)

* **Signature:** `boundingBox(): AABB`
* **Purpose:** Returns a bounding box for the plane, optimized for axis-aligned cases.
* **Implementation:** 
  - **Axis-aligned optimization:** Check if the plane is aligned with coordinate axes
  - **XY plane (normal ≈ ±Z):** Return box infinite in X,Y but bounded in Z around the plane
  - **XZ plane (normal ≈ ±Y):** Return box infinite in X,Z but bounded in Y around the plane  
  - **YZ plane (normal ≈ ±X):** Return box infinite in Y,Z but bounded in X around the plane
  - **General case:** Return `AABB.universe` for non-axis-aligned planes
* **Algorithm:**
  1. Check if `|normal.x| > 0.9999` (YZ plane): return `AABB` with X bounded around plane, Y,Z infinite
  2. Check if `|normal.y| > 0.9999` (XZ plane): return `AABB` with Y bounded around plane, X,Z infinite
  3. Check if `|normal.z| > 0.9999` (XY plane): return `AABB` with Z bounded around plane, X,Y infinite
  4. Otherwise: return `AABB.universe`
* **Bounded dimension calculation:** For the perpendicular axis, use `plane_position ± small_epsilon` to create a thin slice

## Quad Class (`src/entities/quad.ts`)

* **Purpose:** Defines a finite quadrilateral in 3D space using composition with a plane.
* **Dependencies:** Same as Plane, plus `Plane` from `src/entities/plane.ts`, `PDF` from `src/geometry/pdf.ts`, `ONBasis` from `src/geometry/onbasis.ts`.

### Quad Properties

* `plane: Plane` - The underlying infinite plane (composition)
* `q: Point3` - The corner point of the quad (one of the four vertices)
* `u: Vec3` - Vector representing one edge of the quad from corner `q`
* `v: Vec3` - Vector representing the adjacent edge of the quad from corner `q`
* `material: Material` - The material properties of the quad
* `area: number` - Cached area of the quad (computed as `|u × v|`)

### Quad Constructor

* **Signature:** `constructor(q: Point3, u: Vec3, v: Vec3, material: Material)`
* **Purpose:** Creates a finite quad using the underlying plane for intersection logic.
* **Implementation:**
  - Store `q`, `u`, `v`, and `material`
  - Create `plane = new Plane(q, u, v, material)`
  - Compute `area = u.cross(v).length()`

### Quad Hit Method (implements `Hittable.hit`)

* **Signature:** `hit(r: Ray, rayT: Interval): HitRecord | null`
* **Purpose:** Checks if the ray intersects the quad within the valid interval.
* **Algorithm:**
  1. **Plane intersection:** Call `plane.intersect(r, rayT)` to get intersection data
  2. **Boundary check:** Verify that `0 ≤ alpha ≤ 1` and `0 ≤ beta ≤ 1`
  3. **Create hit record:** If within bounds, create and return `HitRecord` using plane's hit logic

### Quad Bounding Box Method (implements `Hittable.boundingBox`)

* **Signature:** `boundingBox(): AABB`
* **Purpose:** Returns the axis-aligned bounding box that encloses the quad.
* **Implementation:** 
  - Calculate all four vertices of the quad: `q`, `q + u`, `q + v`, `q + u + v`
  - Find min/max coordinates across all vertices for each axis
  - Add small padding to handle edge cases
  - Return `AABB` constructed from min/max points

### Quad PDF Methods (implements `PDFHittable`)

* **`pdfValue(origin: Point3, direction: Vec3): number`**
  - Calculate PDF value for sampling from origin towards the quad
  - Check if ray from origin in given direction hits the quad
  - If hit, calculate solid angle subtended by quad from origin
  - Return `1 / solid_angle` for uniform sampling over quad surface

* **`pdfRandomVec(origin: Point3): Vec3`**
  - Generate random direction from origin towards a random point on the quad
  - Sample random barycentric coordinates `(alpha, beta)` in `[0,1]²`
  - Calculate random point on quad: `random_point = q + alpha * u + beta * v`
  - Return unit vector from origin to random point

* **`pdf(origin: Point3): PDF`**
  - Return PDF object with `value` and `generate` functions

## Geometric Properties

### Quad Vertices
* **Vertices:** The four corners of the quad are:
  - `q` (corner point)
  - `q + u` (corner + first edge)
  - `q + v` (corner + second edge)  
  - `q + u + v` (opposite corner)

### Shared Properties
* **Normal Vector:** Computed as `unit_vector(u × v)`, points in the direction determined by right-hand rule
* **Area:** `|u × v|` (magnitude of cross product) - for quad only, plane has infinite area
* **Texture Coordinates:** Use barycentric coordinates `(alpha, beta)` as `(u, v)` texture coordinates

## Usage Examples

```typescript
// Create an infinite ground plane
const groundPlane = new Plane(
  new Point3(0, 0, 0),           // point on plane
  new Vec3(1, 0, 0),             // X-axis direction
  new Vec3(0, 0, 1),             // Z-axis direction (XZ plane)
  groundMaterial
);

// Create an infinite wall plane
const wallPlane = new Plane(
  new Point3(0, 0, 5),           // point on plane
  new Vec3(1, 0, 0),             // horizontal direction
  new Vec3(0, 1, 0),             // vertical direction (XY plane at Z=5)
  wallMaterial
);

// Create a unit square in the XY plane
const unitSquare = new Quad(
  new Point3(0, 0, 0),           // corner at origin
  new Vec3(1, 0, 0),             // edge along X-axis
  new Vec3(0, 1, 0),             // edge along Y-axis
  lambertianMaterial
);

// Create a wall (vertical quad)
const wall = new Quad(
  new Point3(-2, -2, 5),         // bottom-left corner
  new Vec3(4, 0, 0),             // horizontal edge (width)
  new Vec3(0, 4, 0),             // vertical edge (height)
  wallMaterial
);
```

## Implementation Notes

* **Composition over Inheritance:** Quad uses a Plane instance for intersection logic rather than extending a base class
* **Code Reuse:** Quad leverages Plane's `intersect()` method and adds boundary checking
* **Separation of Concerns:** Plane handles infinite plane math; Quad adds finite boundary logic
* **File Organization:** 
  - `src/entities/plane.ts` - Infinite plane implementation
  - `src/entities/quad.ts` - Finite quad implementation using plane composition
* **Boundary Testing:** Only quads perform boundary checks; planes accept all intersections
* **Bounding Boxes:** 
  - Quads have finite bounds calculated from their four vertices
  - Planes use optimized bounds: axis-aligned planes get thin slices, others get infinite bounds
  - Ground planes (XZ) and wall planes (XY, YZ) benefit significantly from this optimization
* **PDF Sampling:** Only quads support PDF sampling (planes have infinite area)
* **Texture Coordinates:** Both use barycentric coordinates, but planes may extend beyond [0,1] range
* **Performance:** Pre-compute and cache values like `normal`, `d`, `w`, and `area` in constructors
* **Axis-Aligned Detection:** Use threshold `0.9999` to detect axis alignment while handling floating-point precision
* **Degenerate Cases:** Handle parallel rays, zero-area quads/planes, and numerical edge cases 