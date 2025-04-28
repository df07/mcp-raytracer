/* Specs: hittable.md */

import { ray } from './ray.js';
import { point3, vec3, dot } from './vec3.js';
// ... existing code ...

/**
 * Stores information about a ray-object intersection.
 */
export class HitRecord {
  p: point3;
  normal: vec3;
  t: number;
  frontFace: boolean;

  constructor() {
    // Initialize with default values
    this.p = new vec3(0, 0, 0);
    this.normal = new vec3(0, 0, 0);
    this.t = 0;
    this.frontFace = false;
  }

  /**
   * Sets the hit record's normal vector.
   * Ensures the normal always points against the incident ray.
   * @param r The incident ray.
   * @param outwardNormal The outward surface normal at the intersection point.
   */
  public setFaceNormal(r: ray, outwardNormal: vec3): void {
    this.frontFace = r.direction().dot(outwardNormal) < 0;
    this.normal = this.frontFace ? outwardNormal : outwardNormal.negate();
  }

  /**
   * Copies data from another HitRecord.
   * @param other The HitRecord to copy from.
   */
  public copyFrom(other: HitRecord): void {
    this.p = new vec3(other.p.x(), other.p.y(), other.p.z());
    this.normal = new vec3(other.normal.x(), other.normal.y(), other.normal.z());
    this.t = other.t;
    this.frontFace = other.frontFace;
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
   * @param rec The HitRecord to populate with intersection details if a hit occurs.
   * @returns True if the ray hits the object within the interval, false otherwise.
   */
  hit(r: ray, tMin: number, tMax: number, rec: HitRecord): boolean;
}
