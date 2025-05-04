/* Specs: material.md */

import { Ray } from '../ray.js';
import { Color } from '../vec3.js';
import { HitRecord } from '../hittable.js';

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
