/* Specs: plane-quad.md, hittable.md, aabb-bvh.md */

import { Point3, Vec3 } from '../geometry/vec3.js';
import { Ray } from '../geometry/ray.js';
import { HitRecord, Hittable } from '../geometry/hittable.js';
import { Interval } from '../geometry/interval.js';
import { Material } from '../materials/material.js';
import { AABB } from '../geometry/aabb.js';

/**
 * Represents an infinite plane in 3D space that can be intersected by rays.
 * The plane is defined by a point and two basis vectors.
 */
export class Plane implements Hittable {
  readonly q: Point3;
  readonly u: Vec3;
  readonly v: Vec3;
  readonly material: Material;
  readonly normal: Vec3;
  readonly inverseNormal: Vec3;
  readonly d: number;
  readonly w: Vec3;

  private _boundingBox: AABB;

  constructor(q: Point3, u: Vec3, v: Vec3, material: Material) {
    this.q = q;
    this.u = u;
    this.v = v;
    this.material = material;

    // Compute normal as unit vector of u × v
    const crossProduct = u.cross(v);
    this.normal = crossProduct.unitVector();
    this.inverseNormal = this.normal.negate();

    // Compute distance from origin to plane along normal direction
    this.d = this.normal.dot(q);

    // Compute w vector for coordinate calculations
    const crossLengthSquared = crossProduct.lengthSquared();
    this.w = crossProduct.divide(crossLengthSquared);

    // Compute optimized bounding box
    this._boundingBox = this.computeBoundingBox();
  }

  /**
   * Performs ray-plane intersection and calculates barycentric coordinates.
   * 
   * @param r The ray to intersect with the plane
   * @param rayT The interval of valid t values along the ray
   * @returns Intersection data with t, alpha, beta coordinates, or null if no intersection
   */
  public intersect(r: Ray, rayT: Interval): { t: number, alpha: number, beta: number } | null {
    // Check if ray is parallel to plane
    const denom = this.normal.dot(r.direction);
    if (Math.abs(denom) < 1e-8) {
      return null; // Ray is parallel to plane
    }

    // Calculate intersection parameter t
    const t = (this.d - this.normal.dot(r.origin)) / denom;
    
    // Check if t is within valid interval
    if (!rayT.surrounds(t)) {
      return null;
    }

    // Calculate intersection point and barycentric coordinates
    const intersection = r.at(t);
    const planarHitPoint = intersection.subtract(this.q);
    const alpha = this.w.dot(planarHitPoint.cross(this.v));
    const beta = this.w.dot(this.u.cross(planarHitPoint));

    return { t, alpha, beta };
  }

  /**
   * Checks if the ray intersects the infinite plane within the valid interval.
   * 
   * @param r The ray to check for intersection
   * @param rayT The interval of valid t values along the ray
   * @returns A HitRecord if an intersection occurs within the interval, null otherwise
   */
  public hit(r: Ray, rayT: Interval): HitRecord | null {
    const intersection = this.intersect(r, rayT);
    if (!intersection) {
      return null;
    }

    const { t } = intersection;
    const p = r.at(t);

    // If the ray hits from the inside, negate the normal
    const frontFace = r.direction.dot(this.normal) <= 0;
    const normal = frontFace ? this.normal : this.inverseNormal;

    return {
      t,
      p: p,
      normal: normal,
      frontFace,
      material: this.material
    };
  }

  /**
   * Returns a bounding box for the plane, optimized for axis-aligned cases.
   * 
   * @returns The bounding box for this plane
   */
  public boundingBox(): AABB {
    return this._boundingBox;
  }

  /**
   * Computes the bounding box for this plane with axis-aligned optimization.
   * 
   * @returns The computed bounding box
   */
  private computeBoundingBox(): AABB {
    const epsilon = 1e-4;

    // Check if plane is aligned with coordinate axes
    if (Math.abs(this.normal.x) > 0.9999) {
      // YZ plane (normal ≈ ±X): bounded in X, infinite in Y,Z
      const planeX = this.d / this.normal.x;
      return new AABB(
        new Vec3(planeX - epsilon, -Infinity, -Infinity),
        new Vec3(planeX + epsilon, Infinity, Infinity)
      );
    } else if (Math.abs(this.normal.y) > 0.9999) {
      // XZ plane (normal ≈ ±Y): bounded in Y, infinite in X,Z
      const planeY = this.d / this.normal.y;
      return new AABB(
        new Vec3(-Infinity, planeY - epsilon, -Infinity),
        new Vec3(Infinity, planeY + epsilon, Infinity)
      );
    } else if (Math.abs(this.normal.z) > 0.9999) {
      // XY plane (normal ≈ ±Z): bounded in Z, infinite in X,Y
      const planeZ = this.d / this.normal.z;
      return new AABB(
        new Vec3(-Infinity, -Infinity, planeZ - epsilon),
        new Vec3(Infinity, Infinity, planeZ + epsilon)
      );
    } else {
      // General case: infinite bounding box
      return new AABB(
        new Vec3(-Infinity, -Infinity, -Infinity),
        new Vec3(Infinity, Infinity, Infinity)
      );
    }
  }
} 