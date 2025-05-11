# Spec: Axis-Aligned Bounding Boxes (AABB) and Bounding Volume Hierarchy (BVH)

**Reference:** ["Ray Tracing: The Next Week"](https://raytracing.github.io/books/RayTracingTheNextWeek.html)

**Related Specs:** `specs/hittable.md`, `specs/vec3.md`, `specs/ray.md`, `specs/interval.md`

**Goal:** Optimize ray-object intersection testing by implementing axis-aligned bounding boxes (AABB) and a bounding volume hierarchy (BVH) to reduce the number of ray-object intersection tests required.

## Motivation

Currently, the raytracer tests every ray against every object in the scene, resulting in O(n) complexity for each ray where n is the number of objects. For scenes with many objects (such as the random sphere scenes), this becomes a significant performance bottleneck.

By implementing a spatial data structure that organizes objects hierarchically based on their position in 3D space, we can achieve logarithmic O(log n) complexity for ray intersection tests, dramatically improving performance for scenes with many objects.

## Axis-Aligned Bounding Box (AABB) Implementation (`src/aabb.ts`)

* **Purpose:** Represents an axis-aligned bounding box that encloses one or more objects.
* **Properties:**
  * `minimum: Point3`: The minimum coordinates of the box along each axis.
  * `maximum: Point3`: The maximum coordinates of the box along each axis.

* **Methods:**
  * **Constructor:** `constructor(minimum: Point3, maximum: Point3)`
    * Initializes an AABB with the given minimum and maximum points.
  
  * **`hit(r: Ray, rayT: Interval): boolean`**
    * Determines if a ray intersects the bounding box within the interval `rayT`.
    * Uses the "slab method" for efficient AABB-ray intersection.
    * Returns `true` if the ray intersects the box within the interval, `false` otherwise.
  
  * **`surroundingBox(box0: AABB, box1: AABB): AABB` (static)**
    * Returns an AABB that encloses both input boxes.
    * Used to compute bounding boxes for groups of objects.

## Hittable Interface Extension (`src/hittable.ts`)

* **Add to `Hittable` interface:**
  * **`boundingBox(): AABB`**
    * Returns the bounding box that encloses the object.
    * Must be implemented by all classes that implement the `Hittable` interface.
    * For empty containers, should return a valid "empty" bounding box.

## HittableList Implementation Update (`src/hittableList.ts`)

* **Add a cached bounding box:**
  * `private _boundingBox: AABB`
  * Computed once and reused for efficiency.

* **Add method implementation:**
  * **`boundingBox(): AABB`**
    * Computes and returns the bounding box that encloses all objects in the list.
    * If list is empty, returns an "empty" bounding box with inverted min/max values.
    * Uses the cached bounding box if available.

## Sphere Implementation Update (`src/sphere.ts`)

* **Add method implementation:**
  * **`boundingBox(): AABB`**
    * Returns an AABB that encloses the sphere.
    * For a sphere at center `c` with radius `r`, the bounding box corners are at `(c.x-r, c.y-r, c.z-r)` and `(c.x+r, c.y+r, c.z+r)`.

## Bounding Volume Hierarchy (BVH) Node Implementation (`src/bvh.ts`)

* **Purpose:** Organizes scene objects in a hierarchical structure for efficient ray intersection testing.
* **Class:** `BVHNode implements Hittable`
* **Properties:**
  * `left: Hittable`: Left child node.
  * `right: Hittable`: Right child node.
  * `box: AABB`: Bounding box enclosing both children's bounding boxes.
  * `MAX_LEAF_OBJECTS`: Maximum number of objects to store in a leaf node (constant).

* **Methods:**
  * **Constructor:** `constructor(objects: Hittable[], start: number, end: number)`
    * Takes a slice of objects (from `start` to `end` in an array) and organizes them into a BVH.
    * Selects the longest axis (x, y, or z) to split on.
    * Sorts objects along the chosen axis based on their bounding box minimums.
    * If there are few enough objects (≤ MAX_LEAF_OBJECTS), creates a leaf node:
      * Uses a HittableList to store all objects in the left child
      * Uses an EmptyHittable in the right child to avoid redundant checks
    * Otherwise, splits objects into left and right groups and recursively constructs BVH nodes.
  
  * **`hit(r: Ray, rayT: Interval): HitRecord | null`**
    * First tests if the ray intersects this node's bounding box.
    * If it does, tests both children and returns the closer hit, if any.
    * If the ray doesn't hit the bounding box, returns `null` immediately.
  
  * **`boundingBox(): AABB`**
    * Returns this node's bounding box.
  
  * **`fromList(objects: Hittable[]): BVHNode` (static)**
    * Convenience method to create a BVH from a list of objects.

## Scene Generator Update (`src/sceneGenerator.ts`)

* **Modify scene generation:**
  * After generating a scene with the existing logic, organize the objects into a BVH.
  * Replace the `HittableList` with a `BVHNode` containing all objects.

## Performance Considerations

* **Memory Usage:**
  * BVH construction requires additional memory for the tree structure.
  * Using leaf nodes with multiple objects reduces the overall tree depth and node count.
  * Trade-off between memory and processing speed.

* **Construction Time:**
  * Building the BVH is an O(n log n) operation (due to sorting).
  * Using leaf nodes reduces the number of recursive splits needed.

* **Leaf Node Size Optimization:**
  * Using small groups of objects in leaf nodes (vs. single objects) can improve performance.
  * Avoids creating excessively deep trees for scenes with many objects.
  * Improves cache locality during ray traversal.
  * The optimal MAX_LEAF_OBJECTS value depends on the scene complexity and hardware.

## Testing Strategy

* **Unit Tests:**
  * Test AABB-ray intersection correctly detects hits and misses.
  * Test bounding box computation for spheres and groups.
  * Test BVH construction and intersection.

* **Integration Tests:**
  * Compare results of rendering with and without BVH to ensure visual consistency.
  * Verify performance improvements with benchmark tests.

## Expected Performance Improvement

* Ray-object intersection tests should reduce from O(n) to O(log n) complexity.
* Typical scenes with hundreds to thousands of objects should see significant speed improvements.
* Most noticeable benefits for scenes with many small, widely distributed objects.
