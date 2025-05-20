/* Specs: pdf-sampling.md */

import { Vec3 } from './vec3.js';
import { ONBasis } from './onbasis.js';

/**
 * Probability Density Function (PDF) interface for importance sampling
 * in the path tracer. Used to sample directions according to specific
 * probability distributions.
 */
export interface PDF {
  /**
   * Returns the probability density for a specific direction.
   * @param direction Direction to evaluate
   * @returns The probability density value for the given direction
   */
  value(direction: Vec3): number;
  
  /**
   * Generates a random direction according to this PDF.
   * @returns A randomly sampled direction following this distribution
   */
  generate(): Vec3;
}

/**
 * PDF that follows a cosine distribution around a normal vector.
 * This is optimal for Lambertian diffuse reflection.
 */
export class CosinePDF implements PDF {
  private readonly uvw: ONBasis;
  
  /**
   * Creates a cosine PDF around the given normal direction.
   * @param w Normal direction to center the cosine distribution around
   */
  constructor(w: Vec3) {
    this.uvw = new ONBasis(w);
  }
  
  value(direction: Vec3): number {
    const cosine = direction.unitVector().dot(this.uvw.w());
    return cosine <= 0 ? 0 : cosine / Math.PI;
  }
  
  generate(): Vec3 {
    return this.uvw.local(Vec3.randomCosineDirection());
  }
}

/**
 * A mixture of multiple PDFs, randomly selecting between them with 
 * optional weighting. Useful for combining different sampling strategies.
 */
export class MixturePDF implements PDF {
  private readonly pdfs: PDF[];
  private readonly weights: number[];
  private readonly totalWeight: number;
  
  /**
   * Creates a mixture PDF from multiple component PDFs.
   * @param pdfs Array of PDFs to mix
   * @param weights Optional weights for each PDF (defaults to equal weights)
   */
  constructor(pdfs: PDF[], weights?: number[]) {
    this.pdfs = pdfs;
    
    // Use equal weights if not specified
    this.weights = weights || pdfs.map(() => 1.0 / pdfs.length);
    
    // Calculate total weight
    this.totalWeight = this.weights.reduce((sum, w) => sum + w, 0);
  }
  
  value(direction: Vec3): number {
    let sum = 0;
    for (let i = 0; i < this.pdfs.length; i++) {
      sum += this.weights[i] * this.pdfs[i].value(direction);
    }
    return sum / this.totalWeight;
  }
  
  generate(): Vec3 {
    // Choose a PDF based on weights
    const rand = Math.random() * this.totalWeight;
    let partialSum = 0;
    
    for (let i = 0; i < this.pdfs.length; i++) {
      partialSum += this.weights[i];
      if (rand < partialSum) {
        return this.pdfs[i].generate();
      }
    }
    
    // Fallback to last PDF
    return this.pdfs[this.pdfs.length - 1].generate();
  }
} 