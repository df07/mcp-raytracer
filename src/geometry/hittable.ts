/* Specs: hittable.md, aabb-bvh.md, pdf-sampling.md */

import { Ray } from './ray.js';
import { Point3, Vec3, VectorPool } from './vec3.js';
import { Interval } from './interval.js';
import { Material } from '../materials/material.js';
import { AABB } from './aabb.js';

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
  
  /**
   * Returns the axis-aligned bounding box that encloses this object.
   * 
   * @returns The bounding box for this object
   */
  boundingBox(): AABB;
}

/**
 * Interface for hittable objects that can be directly sampled for importance sampling.
 * This extends the basic Hittable interface with methods for PDF-based sampling.
 * Only objects that make sense to sample towards (like light sources) should implement this.
 */
export interface PDFHittable extends Hittable {
  /**
   * Calculates the probability density function value for a ray from the given origin
   * towards this object in the specified direction.
   * 
   * @param origin The origin point from which to evaluate PDF
   * @param direction The direction to evaluate
   * @returns The PDF value for sampling this object from the origin in the given direction
   */
  pdfValue(origin: Point3, direction: Vec3): number;
  
  /**
   * Generates a random direction from the origin towards this object.
   * Used for PDF-based importance sampling of light sources.
   * 
   * @param origin The origin point from which to sample a direction
   * @returns A random direction from the origin towards this object
   */
  pdfRandomVec(origin: Point3): Vec3;
}
