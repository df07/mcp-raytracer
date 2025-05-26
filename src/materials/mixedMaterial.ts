/* Specs: mixed-material.md, material.md, pdf-sampling.md */

import { Ray } from '../geometry/ray.js';
import { Color } from '../geometry/vec3.js';
import { HitRecord } from '../geometry/hittable.js';
import { DefaultMaterial, ScatterResult, Material } from './material.js';

/**
 * Mixed material that probabilistically combines two different materials.
 * Uses weighted random sampling to choose between the two materials.
 */
export class MixedMaterial extends DefaultMaterial {
  readonly material1: Material;
  readonly material2: Material;
  readonly weight: number;

  /**
   * Creates a new mixed material.
   * @param material1 The first material.
   * @param material2 The second material.
   * @param weight The probability of choosing material1 (0.0 = always material2, 1.0 = always material1).
   */
  constructor(material1: Material, material2: Material, weight: number) {
    super();
    this.material1 = material1;
    this.material2 = material2;
    
    // Clamp weight to [0, 1]
    this.weight = Math.max(0.0, Math.min(1.0, weight));
  }

  /**
   * Scatters the incoming ray by randomly choosing between the two materials.
   * @param rIn The incoming ray.
   * @param rec The hit record.
   * @returns A ScatterResult from the chosen material.
   */
  override scatter(rIn: Ray, rec: HitRecord): ScatterResult | null {
    // Probabilistically choose between the two materials
    if (Math.random() < this.weight) {
      return this.material1.scatter(rIn, rec);
    } else {
      return this.material2.scatter(rIn, rec);
    }
  }

  /**
   * Returns the emitted light by combining emissions from both materials.
   * @param rec The hit record.
   * @returns The combined emitted color.
   */
  override emitted(rec: HitRecord): Color {
    // Combine emissions from both materials weighted by their probabilities
    const emission1 = this.material1.emitted(rec).multiply(this.weight);
    const emission2 = this.material2.emitted(rec).multiply(1.0 - this.weight);
    return emission1.add(emission2);
  }
} 