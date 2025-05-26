/* Specs: layered-material.md, material.md, dielectric.md */

import { Ray } from '../geometry/ray.js';
import { Color } from '../geometry/vec3.js';
import { HitRecord } from '../geometry/hittable.js';
import { DefaultMaterial, ScatterResult, Material } from './material.js';
import { Dielectric, DielectricScatterResult } from './dielectric.js';

/**
 * Layered material that simulates a dielectric outer layer over an inner material.
 * Examples: clear-coated paint, glass over metal, varnished surfaces.
 */
export class LayeredMaterial extends DefaultMaterial {
  readonly outerDielectric: Dielectric;
  readonly innerMaterial: Material;

  /**
   * Creates a new layered material.
   * @param outerIOR Index of refraction for the outer dielectric layer.
   * @param innerMaterial The material underneath the dielectric layer.
   */
  constructor(outerDielectric: Dielectric, innerMaterial: Material) {
    super();
    this.outerDielectric = outerDielectric;
    this.innerMaterial = innerMaterial;
  }

  /**
   * Scatters the incoming ray according to the layered material model.
   * Uses the outer dielectric to determine reflection vs refraction, then passes
   * refracted rays to the inner material.
   * @param rIn The incoming ray.
   * @param rec The hit record.
   * @returns A ScatterResult based on outer reflection or inner material interaction.
   */
  override scatter(rIn: Ray, rec: HitRecord): ScatterResult | null {
    // Use the outer dielectric to determine if we reflect or refract
    const outerResult = this.outerDielectric.scatter(rIn, rec) as DielectricScatterResult;
    
    if (!outerResult) {
      // This shouldn't happen with a pure dielectric, but handle it just in case
      return null;
    }

    if (outerResult.reflected) {
      // Ray was reflected off the outer surface - return the dielectric result
      return outerResult;
    } else {
      // Ray was refracted through the outer layer - interact with inner material
      // The scattered ray from the dielectric is the refracted ray
      return this.innerMaterial.scatter(outerResult.scattered!, rec);
    }
  }

  /**
   * Returns emitted light from the inner material.
   * The outer dielectric layer doesn't emit light itself.
   * @param rec The hit record.
   * @returns The emission from the inner material.
   */
  override emitted(rec: HitRecord): Color {
    return this.innerMaterial.emitted(rec);
  }
} 