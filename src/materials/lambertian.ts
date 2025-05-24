/* Specs: material.md, pdf-sampling.md */

import { Ray } from '../geometry/ray.js';
import { Color, Vec3 } from '../geometry/vec3.js';
import { HitRecord } from '../geometry/hittable.js';
import { DefaultMaterial, ScatterResult } from './material.js';
import { CosinePDF } from '../geometry/pdf.js';

/**
 * Lambertian (diffuse) material that scatters light in random directions.
 */
export class Lambertian extends DefaultMaterial {
  readonly albedo: Color;

  constructor(albedo: Color) {
    super();
    this.albedo = albedo;
  }

  /**
   * Scatters the incoming ray according to the Lambertian diffuse model.
   * @param rIn The incoming ray.
   * @param rec The hit record.
   * @returns A ScatterResult with the albedo and a cosine PDF.
   */
  override scatter(rIn: Ray, rec: HitRecord): ScatterResult | null {
    return {
      attenuation: this.albedo,
      pdf: new CosinePDF(rec.normal)
    };
  }
}
