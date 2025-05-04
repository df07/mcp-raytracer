/* Specs: material.md */

import { Ray } from './ray.js';
import { Color, Point3, Vec3 } from './vec3.js';
import { HitRecord } from './hittable.js';

/**
 * Interface for materials that determine how rays interact with surfaces.
 */
export interface Material {
  /**
   * Determines if and how a ray scatters when hitting the material.
   * @param rIn The incoming ray that hit the surface.
   * @param rec The hit record containing information about the intersection.
   * @returns An object with the scattered ray and attenuation if scattering occurs, or null if absorbed.
   */
  scatter(rIn: Ray, rec: HitRecord): { scattered: Ray; attenuation: Color } | null;
}

/**
 * Lambertian (diffuse) material that scatters light in random directions.
 */
export class Lambertian implements Material {
  readonly albedo: Color;

  constructor(albedo: Color) {
    this.albedo = albedo;
  }

  /**
   * Scatters the incoming ray according to the Lambertian diffuse model.
   * @param rIn The incoming ray.
   * @param rec The hit record.
   * @returns An object containing the scattered ray and albedo as attenuation.
   */
  scatter(rIn: Ray, rec: HitRecord): { scattered: Ray; attenuation: Color } | null {
    // Calculate scatter direction: normal + random unit vector
    let scatterDirection = rec.normal.add(Vec3.randomUnitVector());

    // Catch degenerate scatter direction (when random unit vector is exactly opposite to normal)
    if (scatterDirection.nearZero()) {
      scatterDirection = rec.normal;
    }

    // Create scattered ray from hit point in the scatter direction
    const scattered = new Ray(rec.p, scatterDirection);
    
    // Return scattered ray and albedo as attenuation
    return {
      scattered,
      attenuation: this.albedo
    };
  }
}
