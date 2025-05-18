/* Specs: material.md, light-emissive.md */

import { Ray } from '../geometry/ray.js';
import { Color, Vec3 } from '../geometry/vec3.js';
import { HitRecord } from '../geometry/hittable.js';

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

  /**
   * Determines the light emitted by the material.
   * @param rec The hit record containing information about the intersection.
   * @returns The emitted color (zero/black for non-emissive materials).
   */
  emitted(rec: HitRecord): Color;
}

/**
 * Default material implementation that provides base behavior for all materials.
 * By default, materials don't emit light and don't scatter rays.
 */
export class DefaultMaterial implements Material {
  /**
   * Default scatter implementation returns null (no scattering).
   * Should be overridden by materials that scatter light.
   */
  scatter(rIn: Ray, rec: HitRecord): { scattered: Ray; attenuation: Color } | null {
    return null;
  }

  /**
   * Default emitted implementation returns black (no emission).
   * Should be overridden by emissive materials.
   */
  emitted(rec: HitRecord): Color {
    return new Vec3(0, 0, 0);
  }
}
