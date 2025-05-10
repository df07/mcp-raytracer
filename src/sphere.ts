/* Specs: sphere.md, hittable.md */

import { Point3, Vec3, VectorPool } from './vec3.js'; // Added VectorPool import
import { Ray } from './ray.js';
import { HitRecord, Hittable } from './hittable.js';
import { Interval } from './interval.js';
import { Material } from './materials/material.js';

/** Represents a sphere in 3D space that can be intersected by rays */
export class Sphere implements Hittable {
  readonly center: Point3;
  readonly radius: number;
  readonly material: Material;
  
  private vectorPool: VectorPool;

  constructor(center: Point3, radius: number, material: Material) {
    this.center = center;
    this.radius = radius;
    this.material = material;
    this.vectorPool = new VectorPool(10);
  }

  /**
   * Checks if the ray intersects the sphere within the valid interval rayT.
   * Based on the quadratic equation derived from ray-sphere intersection.
   *
   * NOTE: This deviates from the "Ray Tracing in One Weekend" tutorial (which uses
   * an out parameter for the HitRecord) to favor returning a value or null,
   * adhering to a more common TypeScript idiom. Do not revert this change.
   *
   * @param r The ray to check for intersection.
   * @param rayT The interval of valid t values along the ray.
   * @returns A HitRecord if an intersection occurs within the interval, null otherwise.
   */
  public hit(r: Ray, rayT: Interval): HitRecord | null {
    // Reset vector pool at the beginning of each hit test
    this.vectorPool.reset();    // Use vector pool for intermediate calculations
    const oc: Vec3 = r.origin.subtract(this.center, this.vectorPool);
    const a = r.direction.lengthSquared();
    const halfB = oc.dot(r.direction);
    const c = oc.lengthSquared() - this.radius * this.radius;
    const discriminant = halfB * halfB - a * c;

    if (discriminant < 0) {
      return null; // No real roots, ray misses the sphere
    }

    const sqrtd = Math.sqrt(discriminant);

    // Find the nearest root that lies in the acceptable range.
    let root = (-halfB - sqrtd) / a;
    if (!rayT.surrounds(root)) { // Check if root is outside the open interval (tMin, tMax)
      root = (-halfB + sqrtd) / a;
      if (!rayT.surrounds(root)) {
        return null; // Both roots are outside the acceptable range
      }
    }    // Root is valid, create and return a new HitRecord
    const rec = new HitRecord();
    rec.t = root;
      // Use pooled vectors for intermediate calculations but create new vectors for the hit record
    const pointAtT = r.at(rec.t, this.vectorPool);
    rec.p = new Vec3(pointAtT.x, pointAtT.y, pointAtT.z); // Create a fresh Vec3 for the hit record
    
    // Calculate the outward normal using the vector pool
    const tempNormal = rec.p.subtract(this.center, this.vectorPool)
                         .divide(this.radius, this.vectorPool);

    // Create a fresh outwardNormal vector
    const outwardNormal = new Vec3(tempNormal.x, tempNormal.y, tempNormal.z);
    
    // Use the standard setFaceNormal since we've created fresh vectors
    rec.setFaceNormal(r, outwardNormal);
    rec.material = this.material; // Set the material in the hit record

    return rec;
  }
}