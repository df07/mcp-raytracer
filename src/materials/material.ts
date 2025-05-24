/* Specs: material.md, light-emissive.md, pdf-sampling.md */

import { Ray } from '../geometry/ray.js';
import { Color, Vec3 } from '../geometry/vec3.js';
import { HitRecord } from '../geometry/hittable.js';
import { PDF } from '../geometry/pdf.js';

/**
 * Result of a ray scatter event.
 * Contains the attenuation (color) and either:
 * - a specific ray direction (for specular materials)
 * - a PDF (for diffuse materials that use importance sampling)
 */
export interface ScatterResult {
  /** The amount of light attenuated at each wavelength */
  attenuation: Color;
  
  /** The PDF for sampling directions (for diffuse materials) */
  pdf?: PDF | null;
  
  /** The scattered ray (for specular materials) */
  scattered?: Ray | null;
}

/**
 * Interface for materials that determine how rays interact with surfaces.
 */
export interface Material {
  /**
   * Determines if and how a ray scatters when hitting the material.
   * @param rIn The incoming ray that hit the surface.
   * @param rec The hit record containing information about the intersection.
   * @returns A ScatterResult object if scattering occurs, or null if absorbed.
   */
  scatter(rIn: Ray, rec: HitRecord): ScatterResult | null;

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
  scatter(rIn: Ray, rec: HitRecord): ScatterResult | null {
    return null;
  }

  /**
   * Default emitted implementation returns black (no emission).
   * Should be overridden by emissive materials.
   */
  emitted(rec: HitRecord): Color {
    return new Color(0, 0, 0);
  }
}
