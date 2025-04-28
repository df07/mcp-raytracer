/* Specs: ray.md */

import { Point3, Vec3 } from './vec3.js';

/**
 * Represents a 3D ray with an origin and a direction.
 */
export class Ray {
    private orig: Point3;
    private dir: Vec3;

    /**
     * Creates a new ray instance.
     * @param origin The origin point of the ray.
     * @param direction The direction vector of the ray.
     */
    constructor(origin: Point3, direction: Vec3) {
        this.orig = origin;
        this.dir = direction;
    }

    /**
     * Returns the origin point of the ray.
     */
    get origin(): Point3 {
        return this.orig;
    }

    /**
     * Returns the direction vector of the ray.
     */
    get direction(): Vec3 {
        return this.dir;
    }

    /**
     * Calculates the point along the ray at parameter t.
     * P(t) = A + t*b
     * @param t The parameter value.
     * @returns The point on the ray at the given parameter t.
     */
    at(t: number): Point3 {
        // P(t) = origin + t * direction
        return this.origin.add(this.direction.multiply(t));
    }
} 