import { Color } from "../geometry/vec3.js";
import { Vec3 } from "../geometry/vec3.js";

/**
 * Simple Seedable Pseudo-Random Number Generator
 * Based on a mulberry32 algorithm
 */
export class SeededRandom {
  private seed: number;
  
  constructor(seed?: number) {
    this.seed = seed !== undefined ? seed : Math.floor(Math.random() * 2147483647);
  }
  
  /**
   * Generate a random number between 0 and 1
   */
  next(): number {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  
  /**
   * Generate a random number between min and max
   */
  nextInRange(min: number, max: number): number {
    return min + (max - min) * this.next();
  }
  
  /**
   * Generate a random vector in a unit sphere
   */
  randomInUnitSphere(): Vec3 {
    while (true) {
      const p = new Vec3(
        this.nextInRange(-1, 1),
        this.nextInRange(-1, 1),
        this.nextInRange(-1, 1)
      );
      
      if (p.lengthSquared() < 1) {
        return p;
      }
    }
  }
  
  /**
   * Generate a random color
   */
  randomColor(): Vec3 {
    return new Color(
      this.next(),
      this.next(),
      this.next()
    );
  }
}

