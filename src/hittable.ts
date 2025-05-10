/* Specs: hittable.md */

import { Ray } from './ray.js';
import { Point3, Vec3, VectorPool } from './vec3.js';
import { Interval } from './interval.js';
import { Material } from './materials/material.js';

/**
 * Stores information about a ray-object intersection.
 */
export interface HitRecord {
  p: Point3;
  normal: Vec3;
  t: number;
  frontFace: boolean;
  material: Material;
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
