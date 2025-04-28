/* Specs: sphere.md, hittable.md */

import { Point3, Vec3 } from './vec3.js'; // Updated imports, removed dot
import { Ray } from './ray.js'; // Updated import
import { HitRecord, Hittable } from './hittable.js';

/** Represents a sphere in 3D space that can be intersected by rays */
export class Sphere implements Hittable {
  readonly center: Point3;
  readonly radius: number;

  constructor(center: Point3, radius: number) {
    this.center = center;
    this.radius = radius;
  }

  /**
   * Checks if the ray intersects the sphere within the valid interval [tMin, tMax].
   * Based on the quadratic equation derived from ray-sphere intersection.
   *
   * @param r The ray to check for intersection.
   * @param tMin The minimum acceptable t value for a hit.
   * @param tMax The maximum acceptable t value for a hit.
   * @returns A HitRecord object if a valid intersection occurs within the interval,
   *          null otherwise.
   */
  public hit(r: Ray, tMin: number, tMax: number): HitRecord | null {
    // Use accessors for ray origin and direction
    const oc: Vec3 = r.origin.subtract(this.center); // Use r.origin (getter)
    const a = r.direction.lengthSquared();          // Use r.direction (getter)
    const halfB = oc.dot(r.direction);                // Use r.direction (getter)
    const c = oc.lengthSquared() - this.radius * this.radius;
    const discriminant = halfB * halfB - a * c;

    if (discriminant < 0) {
      return null; // No real roots, ray misses the sphere
    }

    const sqrtd = Math.sqrt(discriminant);

    // Check the smaller root first
    let root = (-halfB - sqrtd) / a;
    if (root >= tMin && root <= tMax) {
        // Root1 is valid, create and return HitRecord
        const rec = new HitRecord();
        rec.t = root;
        rec.p = r.at(rec.t);
        const outwardNormal = rec.p.subtract(this.center).divide(this.radius);
        rec.setFaceNormal(r, outwardNormal);
        return rec;
    }

    // Check the larger root if the smaller one was invalid
    root = (-halfB + sqrtd) / a;
    if (root >= tMin && root <= tMax) {
        // Root2 is valid, create and return HitRecord
        const rec = new HitRecord();
        rec.t = root;
        rec.p = r.at(rec.t);
        const outwardNormal = rec.p.subtract(this.center).divide(this.radius);
        rec.setFaceNormal(r, outwardNormal);
        return rec;
    }

    // Neither root was valid within the range [tMin, tMax]
    return null;
  }
} 