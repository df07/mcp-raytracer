/* Specs: pdf-sampling.md */

import { Vec3 } from './vec3.js';

/**
 * Orthonormal Basis - Creates a local coordinate system around a given normal vector.
 * Used primarily for PDF-based sampling.
 */
export class ONBasis {
  private u_vec: Vec3;
  private v_vec: Vec3;
  private w_vec: Vec3;
  
  /**
   * Constructs an orthonormal basis from a given normal vector.
   * @param n The normal vector around which to build the basis (will become w)
   */
  constructor(n: Vec3) {
    this.w_vec = n.unitVector();
    
    // Create orthonormal basis from w
    const a = Math.abs(this.w_vec.x) > 0.9 ? Vec3.create(0, 1, 0) : Vec3.create(1, 0, 0);
    this.v_vec = this.w_vec.cross(a).unitVector();
    this.u_vec = this.w_vec.cross(this.v_vec);
  }
  
  /**
   * Gets the u basis vector
   */
  u(): Vec3 { return this.u_vec; }
  
  /**
   * Gets the v basis vector
   */
  v(): Vec3 { return this.v_vec; }
  
  /**
   * Gets the w basis vector
   */
  w(): Vec3 { return this.w_vec; }
  
  /**
   * Transforms a vector from ONB local coordinates to world coordinates
   * @param a Vector in local ONB coordinates
   * @returns The vector transformed to world coordinates
   */
  local(a: Vec3): Vec3 {
    return this.u_vec.multiply(a.x)
      .add(this.v_vec.multiply(a.y))
      .add(this.w_vec.multiply(a.z));
  }
} 