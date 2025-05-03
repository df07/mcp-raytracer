/* Specs: sphere.md, hittable.md */

import { Point3, Vec3 } from './vec3.js'; // Updated imports, removed dot
import { Ray } from './ray.js'; // Updated import
import { HitRecord, Hittable } from './hittable.js';
import { Interval } from './interval.js'; // Added import

/** Represents a sphere in 3D space that can be intersected by rays */
export class Sphere implements Hittable {
  readonly center: Point3;
  readonly radius: number;

  constructor(center: Point3, radius: number) {
    this.center = center;
    this.radius = radius;
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
    const oc: Vec3 = r.origin.subtract(this.center);
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
    }

    // Root is valid, create and return a new HitRecord
    const rec = new HitRecord();
    rec.t = root;
    rec.p = r.at(rec.t);
    const outwardNormal = rec.p.subtract(this.center).divide(this.radius);
    rec.setFaceNormal(r, outwardNormal);

    return rec;
  }
}