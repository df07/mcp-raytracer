/* Specs: ray.md */

import { Point3, Vec3 } from './vec3.js';

/**
 * Represents a 3D ray with an origin and a direction.
 */
export class Ray {
    public readonly origin: Point3;
    public readonly direction: Vec3;

    constructor(origin: Point3, direction: Vec3) {
        this.origin = origin;
        this.direction = direction;
    }


    /**
     * Calculates the point along the ray at parameter t.
     * P(t) = A + t*b
     * @param t The parameter value.
     * @param pool Optional vector pool to use for intermediate calculations.
     * @returns The point on the ray at the given parameter t.
     */
    at(t: number): Point3 {
        // P(t) = origin + t * direction
        return this.origin.add(this.direction.multiply(t));
    }
}