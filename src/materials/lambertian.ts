/* Specs: material.md */

import { Ray } from '../ray.js';
import { Color, Vec3 } from '../vec3.js';
import { HitRecord } from '../hittable.js';
import { Material } from './material.js';
import { VectorPool } from '../vec3.js';

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
    
    // Return scattered ray and albedo as attenuation
    return {
      scattered: new Ray(rec.p, Vec3.clone(scatterDirection)),
      attenuation: this.albedo
    };
  }
}
