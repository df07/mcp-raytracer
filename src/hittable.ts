/* Specs: hittable.md */

import { Ray } from './ray.js';
import { Point3, Vec3 } from './vec3.js';
import { Interval } from './interval.js'; // Added import

/**
 * Stores information about a ray-object intersection.
 */
export class HitRecord {
  p: Point3;
  normal: Vec3;
  t: number;
  frontFace: boolean;

  constructor() {
    // Initialize with default values
    this.p = new Vec3(0, 0, 0);
    this.normal = new Vec3(0, 0, 0);
    this.t = 0;
    this.frontFace = false;
  }

  /**
   * Sets the hit record's normal vector.
   * Ensures the normal always points against the incident ray.
   * @param r The incident ray.
   * @param outwardNormal The outward surface normal at the intersection point.
   */
  public setFaceNormal(r: Ray, outwardNormal: Vec3): void {
    // If the dot product is non-positive, the ray hits from the outside (or tangentially).
    this.frontFace = r.direction.dot(outwardNormal) <= 0;
    this.normal = this.frontFace ? outwardNormal : outwardNormal.negate();
  }
}

/**
 * Interface for objects that can be intersected by a ray.
 */
export interface Hittable {
  /**
   * Determines if the ray intersects the object within the valid interval rayT.
   *
   * NOTE: This deviates from the "Ray Tracing in One Weekend" tutorial (which uses
   * an out parameter for the HitRecord) to favor returning a value or null,
   * adhering to a more common TypeScript idiom. Do not revert this change.
   *
   * @param r The ray to check for intersection.
   * @param rayT The interval of valid t values along the ray.
   * @returns A HitRecord if an intersection occurs within the interval, null otherwise.
   */
  hit(r: Ray, rayT: Interval): HitRecord | null;
}
