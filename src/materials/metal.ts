/* Specs: metal.md, pdf-sampling.md */

import { Color, Vec3 } from '../geometry/vec3.js';
import { HitRecord } from '../geometry/hittable.js';
import { DefaultMaterial, ScatterResult } from './material.js';

/**
 * Metal material that reflects light according to the law of reflection.
 * May have a fuzzy reflection to simulate roughness.
 */
export class Metal extends DefaultMaterial {
  readonly albedo: Color;
  readonly fuzz: number;

  constructor(albedo: Color, fuzz: number = 0.0) {
    super();
    this.albedo = albedo;
    // Clamp fuzz to the range [0, 1]
    this.fuzz = fuzz < 1 ? Math.max(0, fuzz) : 1;
  }

  /**
   * Scatters the incoming ray according to the metal reflection model.
   * @param rIn The incoming ray.
   * @param rec The hit record.
   * @returns A ScatterResult with the scattered ray and albedo, or null if absorbed.
   */
  override scatter(origin: Vec3, direction: Vec3, rec: HitRecord): ScatterResult | null {
    // Calculate perfect reflection vector
    const reflected = direction.unitVector().reflect(rec.normal);
    
    // Add fuzziness by perturbing the reflected vector with a random point in the unit sphere
    const fuzzyReflection = 
      this.fuzz > 0 
        ? reflected.add(Vec3.randomInUnitSphere().multiply(this.fuzz))
        : reflected;
    
    // Check if the reflection direction is valid (points outward from the surface)
    if (fuzzyReflection.dot(rec.normal) <= 0) {
      // Ray was reflected into the surface (absorption)
      return null;
    }
    
    // Return the scattered ray and attenuation
    return {
      attenuation: this.albedo,
      scattered: { origin: rec.p, direction: fuzzyReflection }
    };
  }
}
