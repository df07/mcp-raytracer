/* Specs: sphere.md, hittable.md */

import { point3, vec3, dot } from './vec3.js'; // Assuming vec3 exports point3 and vec3 aliases
import { ray } from './ray.js';
import { HitRecord, Hittable } from './hittable.js';

/** Represents a sphere in 3D space that can be intersected by rays */
export class Sphere implements Hittable {
  center: point3;
  radius: number;

  constructor(center: point3, radius: number) {
    this.center = center;
    this.radius = radius;
  }

  /**
   * Checks if the ray intersects the sphere within the valid interval [tMin, tMax].
   * If it hits, updates the HitRecord with intersection details.
   * Based on the quadratic equation derived from ray-sphere intersection.
   *
   * @param r The ray to check for intersection.
   * @param tMin The minimum acceptable t value for a hit.
   * @param tMax The maximum acceptable t value for a hit.
   * @param rec The HitRecord to populate if a valid intersection occurs.
   * @returns True if the ray hits the sphere within the [tMin, tMax] interval,
   *          false otherwise.
   */
  public hit(r: ray, tMin: number, tMax: number, rec: HitRecord): boolean {
    const oc: vec3 = r.origin().subtract(this.center);
    const a = r.direction().lengthSquared();
    const half_b = oc.dot(r.direction());
    const c = oc.lengthSquared() - this.radius * this.radius;
    const discriminant = half_b * half_b - a * c;

    if (discriminant < 0) {
      return false; // No real roots, ray misses the sphere
    }

    const sqrtd = Math.sqrt(discriminant);

    // Check the smaller root first
    let root = (-half_b - sqrtd) / a;
    if (root >= tMin && root <= tMax) {
        rec.t = root;
        rec.p = r.at(rec.t);
        const outwardNormal = rec.p.subtract(this.center).divide(this.radius);
        rec.setFaceNormal(r, outwardNormal);
        return true;
    }

    // Check the larger root if the smaller one was invalid
    root = (-half_b + sqrtd) / a;
    if (root >= tMin && root <= tMax) {
        rec.t = root;
        rec.p = r.at(rec.t);
        const outwardNormal = rec.p.subtract(this.center).divide(this.radius);
        rec.setFaceNormal(r, outwardNormal);
        return true;
    }

    // Neither root was valid within the range [tMin, tMax]
    return false;
  }
} 