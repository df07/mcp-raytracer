/* Specs: hittable.md */

import { Ray } from './ray.js';
import { Point3, Vec3 } from './vec3.js';
// ... existing code ...

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
    this.frontFace = r.direction.dot(outwardNormal) < 0;
    this.normal = this.frontFace ? outwardNormal : outwardNormal.negate();
  }
}

/**
 * Interface for objects that can be intersected by a ray.
 */
export interface Hittable {
  /**
   * Determines if the ray intersects the object within the valid interval [tMin, tMax].
   * @param r The incident ray.
   * @param tMin The minimum acceptable parameter value for intersection.
   * @param tMax The maximum acceptable parameter value for intersection.
   * @returns A HitRecord object if a hit occurs within the interval, null otherwise.
   */
  hit(r: Ray, tMin: number, tMax: number): HitRecord | null;
}
