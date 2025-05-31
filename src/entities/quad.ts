/* Specs: plane-quad.md, hittable.md, aabb-bvh.md, pdf-sampling.md */

import { Point3, Vec3 } from '../geometry/vec3.js';
import { Ray } from '../geometry/ray.js';
import { HitRecord, Hittable, PDFHittable } from '../geometry/hittable.js';
import { Interval } from '../geometry/interval.js';
import { Material } from '../materials/material.js';
import { AABB } from '../geometry/aabb.js';
import { Plane } from './plane.js';
import { PDF } from '../geometry/pdf.js';
import { ONBasis } from '../geometry/onbasis.js';

/**
 * Represents a finite quadrilateral in 3D space using composition with a plane.
 * The quad is defined by a corner point and two edge vectors.
 */
export class Quad implements PDFHittable {
  readonly plane: Plane;
  readonly q: Point3;
  readonly u: Vec3;
  readonly v: Vec3;
  readonly material: Material;
  readonly area: number;

  private _boundingBox: AABB;

  constructor(q: Point3, u: Vec3, v: Vec3, material: Material) {
    this.q = q;
    this.u = u;
    this.v = v;
    this.material = material;

    // Create the underlying plane for intersection logic
    this.plane = new Plane(q, u, v, material);

    // Compute and cache the area
    this.area = u.cross(v).length();

    // Compute finite bounding box
    this._boundingBox = this.computeBoundingBox();
  }

  /**
   * Checks if the ray intersects the quad within the valid interval.
   * 
   * @param r The ray to check for intersection
   * @param rayT The interval of valid t values along the ray
   * @returns A HitRecord if an intersection occurs within the interval, null otherwise
   */
  public hit(r: Ray, rayT: Interval): HitRecord | null {
    // Use the plane's intersection logic
    const intersection = this.plane.intersect(r, rayT);
    if (!intersection) {
      return null;
    }

    const { t, alpha, beta } = intersection;

    // Check if intersection is within quad boundaries
    if (alpha < 0 || alpha > 1 || beta < 0 || beta > 1) {
      return null; // Outside quad boundaries
    }

    // Create hit record using plane's hit logic but with our material
    const p = r.at(t);
    const frontFace = r.direction.dot(this.plane.normal) <= 0;
    const finalNormal = frontFace ? this.plane.normal : this.plane.normal.negate();

    return {
      t,
      p: p,
      normal: finalNormal,
      frontFace,
      material: this.material
    };
  }

  /**
   * Returns the axis-aligned bounding box that encloses the quad.
   * 
   * @returns The bounding box for this quad
   */
  public boundingBox(): AABB {
    return this._boundingBox;
  }

  /**
   * Computes the bounding box for this quad from its four vertices.
   * 
   * @returns The computed bounding box
   */
  private computeBoundingBox(): AABB {
    // Calculate all four vertices of the quad
    const vertex1 = this.q;                    // q
    const vertex2 = this.q.add(this.u);       // q + u
    const vertex3 = this.q.add(this.v);       // q + v
    const vertex4 = this.q.add(this.u).add(this.v); // q + u + v

    // Find min/max coordinates across all vertices
    const minX = Math.min(vertex1.x, vertex2.x, vertex3.x, vertex4.x);
    const minY = Math.min(vertex1.y, vertex2.y, vertex3.y, vertex4.y);
    const minZ = Math.min(vertex1.z, vertex2.z, vertex3.z, vertex4.z);

    const maxX = Math.max(vertex1.x, vertex2.x, vertex3.x, vertex4.x);
    const maxY = Math.max(vertex1.y, vertex2.y, vertex3.y, vertex4.y);
    const maxZ = Math.max(vertex1.z, vertex2.z, vertex3.z, vertex4.z);

    // Add small padding to handle edge cases
    const epsilon = 1e-4;
    return new AABB(
      Vec3.create(minX - epsilon, minY - epsilon, minZ - epsilon),
      Vec3.create(maxX + epsilon, maxY + epsilon, maxZ + epsilon)
    );
  }

  /**
   * Calculates the PDF value for sampling from origin towards the quad.
   * 
   * @param origin The origin point from which to calculate the PDF
   * @param direction The direction to evaluate
   * @returns The PDF value for the given direction
   */
  public pdfValue(origin: Point3, direction: Vec3): number {
    // Check if the ray from origin in given direction hits the quad
    const ray = new Ray(origin, direction);
    const rayT = new Interval(0.001, Infinity);
    const hitRecord = this.hit(ray, rayT);
    
    // If no intersection, PDF value is 0
    if (hitRecord === null) {
      return 0;
    }
    
    // Calculate the solid angle subtended by the quad from the origin
    const distanceSquared = hitRecord.p.subtract(origin).lengthSquared();
    const cosine = Math.abs(direction.dot(hitRecord.normal));
    
    // PDF = distance² / (area * cosine)
    return distanceSquared / (this.area * cosine);
  }
  
  /**
   * Generates a random direction from the origin towards a random point on the quad.
   * 
   * @param origin The origin point from which to sample a direction
   * @returns A random direction from the origin towards the quad
   */
  public pdfRandomVec(origin: Point3): Vec3 {
    // Sample random barycentric coordinates in [0,1]²
    const alpha = Math.random();
    const beta = Math.random();
    
    // Calculate random point on quad: q + alpha * u + beta * v
    const randomPoint = this.q.add(this.u.multiply(alpha)).add(this.v.multiply(beta));
    
    // Return unit vector from origin to random point
    return randomPoint.subtract(origin).unitVector();
  }

  /**
   * Returns a PDF object with value and generate functions.
   * 
   * @param origin The origin point for PDF calculations
   * @returns A PDF object
   */
  public pdf(origin: Point3): PDF {
    return {
      value: (direction: Vec3) => this.pdfValue(origin, direction),
      generate: () => this.pdfRandomVec(origin)
    };
  }
} 