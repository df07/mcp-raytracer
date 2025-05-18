/* Specs: light-emissive.md */

import { Ray } from '../geometry/ray.js';
import { Color, Vec3 } from '../geometry/vec3.js';
import { HitRecord } from '../geometry/hittable.js';
import { DefaultMaterial } from './material.js';

/**
 * DiffuseLight material that emits light but doesn't scatter rays.
 * Used for light sources in the scene.
 */
export class DiffuseLight extends DefaultMaterial {
  readonly emit: Color;

  /**
   * Creates a new diffuse light material.
   * @param emit The color/intensity of the light emitted.
   */
  constructor(emit: Color) {
    super();
    this.emit = emit;
  }

  /**
   * Emits light of the specified color/intensity.
   * @param rec The hit record.
   * @returns The emission color.
   */
  override emitted(rec: HitRecord): Color {
    return this.emit;
  }

  // Inherits the default scatter implementation that returns null (no scattering)
} 