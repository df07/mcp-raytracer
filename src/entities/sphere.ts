/* Specs: sphere.md, hittable.md, aabb-bvh.md, pdf-sampling.md */

import { Point3, Vec3, VectorPool } from '../geometry/vec3.js'; // Added VectorPool import
import { Ray } from '../geometry/ray.js';
import { HitRecord, Hittable, PDFHittable } from '../geometry/hittable.js';
import { Interval } from '../geometry/interval.js';
import { Material } from '../materials/material.js';
import { AABB } from '../geometry/aabb.js';
import { ONBasis } from '../geometry/onbasis.js';
import { PDF } from '../geometry/pdf.js';

/** Represents a sphere in 3D space that can be intersected by rays */
export class Sphere implements PDFHittable {
  readonly center: Point3;
  readonly radius: number;
  readonly material: Material;

  private _boundingBox: AABB;

  constructor(center: Point3, radius: number, material: Material) {
    this.center = center;
    this.radius = radius;
    this.material = material;

    // Calculate minimum and maximum points of the bounding box
    const radiusVec = Vec3.create(this.radius, this.radius, this.radius);
    const min = this.center.subtract(radiusVec);
    const max = this.center.add(radiusVec);

    this._boundingBox = new AABB(min, max);
  }

  /**
   * Checks if the ray intersects the sphere within the valid interval rayT.
   * Based on the quadratic equation derived from ray-sphere intersection.
   *
   * NOTE: This deviates from the "Ray Tracing in One Weekend" tutorial (which uses
   * an out parameter for the HitRecord) to favor returning a value or null,
   * adhering to a more common TypeScript idiom. Do not revert this change.
   *
   * @param r The ray to check for intersection.
   * @param rayT The interval of valid t values along the ray.
   * @returns A HitRecord if an intersection occurs within the interval, null otherwise.
   */
  public hit(r: Ray, rayT: Interval): HitRecord | null {
    const oc: Vec3 = r.origin.subtract(this.center);
    const a = r.direction.lengthSquared();
    const halfB = oc.dot(r.direction);
    const c = oc.lengthSquared() - this.radius * this.radius;
    const discriminant = halfB * halfB - a * c;

    if (discriminant < 0) {
      return null; // No real roots, ray misses the sphere
    }

    const sqrtd = Math.sqrt(discriminant);

    // Find the nearest root that lies in the acceptable range.
    let root = (-halfB - sqrtd) / a;
    if (!rayT.surrounds(root)) { // Check if root is outside the open interval (tMin, tMax)
      root = (-halfB + sqrtd) / a;
      if (!rayT.surrounds(root)) {
        return null; // Both roots are outside the acceptable range
      }
    }    
    
    // Root is valid, calculate the hit record
    const pointAtT = r.at(root);
    
    // Calculate the outward normal using the vector pool
    let normal = pointAtT.subtract(this.center)
                         .divide(this.radius);
    
    // If the ray hits from the inside, negate the normal
    const frontFace = r.direction.dot(normal) <= 0;
    if (!frontFace) normal = normal.negate();

    return {
      t: root,
      p: pointAtT,
      normal: normal,
      frontFace: frontFace,
      material: this.material
    };
  }

  /**
   * Returns the axis-aligned bounding box that encloses this sphere.
   * For a sphere, this is a box with dimensions 2*radius in each direction,
   * centered at the sphere's center.
   * 
   * @returns The bounding box for this sphere
   */
  boundingBox(): AABB {
    return this._boundingBox
  }

  /**
   * Calculates the PDF value for sampling from origin towards a point on the sphere.
   * Represents the probability density of a ray from origin hitting the sphere in the given direction.
   * 
   * @param origin The origin point from which to calculate the PDF
   * @param direction The direction to evaluate
   * @returns The PDF value for the given direction
   */
  public pdfValue(origin: Point3, direction: Vec3): number {
    // Check if the ray origin->direction intersects the sphere
    const ray = new Ray(origin, direction);
    const rayT = new Interval(0.001, Infinity);
    const hitRecord = this.hit(ray, rayT);
    
    // If no intersection, PDF value is 0
    if (hitRecord === null) {
      return 0;
    }
    
    // Calculate the solid angle subtended by the sphere from the origin
    const distanceSquared = this.center.subtract(origin).lengthSquared();
    
    // Make sure we don't divide by zero or have numerical issues
    if (distanceSquared <= this.radius * this.radius) {
      // If we're inside or very close to the sphere, use a reasonable default
      return 1.0 / (4.0 * Math.PI); // Uniform distribution over a sphere
    }
    
    const cosTheta = Math.sqrt(1 - this.radius * this.radius / distanceSquared);
    const solidAngle = 2 * Math.PI * (1 - cosTheta);
    
    // PDF is 1/solid_angle for uniform sampling over the sphere's surface
    return 1 / solidAngle;
  }
  
  /**
   * Generates a random direction from the origin towards this sphere.
   * Used for importance sampling of light sources.
   * 
   * @param origin The origin point from which to sample a direction
   * @returns A random direction from the origin towards the sphere
   */
  public pdfRandomVec(origin: Point3): Vec3 {
    // Vector from origin to center of sphere
    const originToCenter = this.center.subtract(origin);
    const distanceSquared = originToCenter.lengthSquared();
    
    const uvw = new ONBasis(originToCenter);
    return uvw.local(Vec3.randomToSphere(this.radius, distanceSquared));
  }

  public pdf(origin: Point3): PDF {
    return {
      value: (direction: Vec3) => this.pdfValue(origin, direction),
      generate: () => this.pdfRandomVec(origin)
    }
  }
}