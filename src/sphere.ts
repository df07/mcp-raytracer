/* Specs: raytracer.md */

import { point3, vec3, dot } from './vec3.js';
import { ray } from './ray.js';

/** Represents a sphere in 3D space */
export class Sphere {
  center: point3;
  radius: number;

  constructor(center: point3, radius: number) {
    this.center = center;
    this.radius = radius;
  }

  /**
   * Calculates the intersection of a ray with this sphere.
   * Based on the equation: (P(t) - C) . (P(t) - C) = r^2
   * where P(t) = A + t*b (ray), C is sphere center, r is radius.
   * Expanding this gives a quadratic equation in t:
   * t^2 * (b . b) + 2*t*( (A-C) . b ) + ( (A-C) . (A-C) ) - r^2 = 0
   *
   * @param r The ray to check for intersection.
   * @returns The 't' parameter of the *closest* intersection point along the ray
   *          if the ray hits the sphere (t > 0). Returns -1.0 if there is no hit.
   */
  hit(r: ray): number {
    const oc: vec3 = r.origin().subtract(this.center); // Vector from sphere center (C) to ray origin (A): A-C
    const a = dot(r.direction(), r.direction()); // b . b (squared length of ray direction)
    const half_b = dot(oc, r.direction()); // (A-C) . b
    const c = dot(oc, oc) - this.radius * this.radius; // (A-C) . (A-C) - r^2

    const discriminant = half_b * half_b - a * c;

    if (discriminant < 0) {
      // No real roots, ray misses the sphere
      return -1.0;
    } else {
      // Ray hits the sphere, find the nearest root (smallest positive t)
      const sqrtd = Math.sqrt(discriminant);
      let root = (-half_b - sqrtd) / a;
      if (root <= 0) { // Check if the first root is behind the ray origin or zero
        root = (-half_b + sqrtd) / a;
        if (root <= 0) { // Both roots are non-positive
          return -1.0;
        }
      }
      return root;
    }
  }
} 