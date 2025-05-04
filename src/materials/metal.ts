/* Specs: metal.md */

import { Ray } from '../ray.js';
import { Color, Vec3, reflect, unitVector } from '../vec3.js';
import { HitRecord } from '../hittable.js';
import { Material } from './material.js';

/**
 * Metal material that reflects light according to the law of reflection.
 * May have a fuzzy reflection to simulate roughness.
 */
export class Metal implements Material {
  readonly albedo: Color;
  readonly fuzz: number;

  constructor(albedo: Color, fuzz: number = 0.0) {
    this.albedo = albedo;
    // Clamp fuzz to the range [0, 1]
    this.fuzz = fuzz < 1 ? Math.max(0, fuzz) : 1;
  }

  /**
   * Scatters the incoming ray according to the metal reflection model.
   * @param rIn The incoming ray.
   * @param rec The hit record.
   * @returns An object containing the scattered ray and albedo as attenuation, or null if absorbed.
   */
  scatter(rIn: Ray, rec: HitRecord): { scattered: Ray; attenuation: Color } | null {
    // Calculate perfect reflection vector
    const reflected = reflect(unitVector(rIn.direction), rec.normal);
    
    // Add fuzziness by perturbing the reflected vector with a random point in the unit sphere
    const fuzzyReflection = 
      this.fuzz > 0 
        ? reflected.add(Vec3.randomInUnitSphere().multiply(this.fuzz))
        : reflected;
    
    // Check if the reflection direction is valid (points outward from the surface)
    // This must be checked BEFORE creating the scattered ray
    if (fuzzyReflection.dot(rec.normal) <= 0) {
      // Ray was reflected into the surface (absorption)
      return null;
    }
    
    // Create scattered ray from hit point along the fuzzy reflection direction
    const scattered = new Ray(rec.p, fuzzyReflection);
    
    // Return the scattered ray and attenuation
    return {
      scattered,
      attenuation: this.albedo
    };
  }
}
