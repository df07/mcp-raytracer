/* Specs: ray.md */

import { point3, vec3 } from './vec3.js';

/**
 * Represents a 3D ray with an origin and a direction.
 */
export class ray {
    private orig: point3;
    private dir: vec3;

    /**
     * Creates a new ray instance.
     * @param origin The origin point of the ray.
     * @param direction The direction vector of the ray.
     */
    constructor(origin: point3, direction: vec3) {
        this.orig = origin;
        this.dir = direction;
    }

    /**
     * Returns the origin point of the ray.
     */
    origin(): point3 {
        return this.orig;
    }

    /**
     * Returns the direction vector of the ray.
     */
    direction(): vec3 {
        return this.dir;
    }

    /**
     * Calculates the point along the ray at parameter t.
     * P(t) = A + t*b
     * @param t The parameter value.
     * @returns The point on the ray at the given parameter t.
     */
    at(t: number): point3 {
        // P(t) = origin + t * direction
        return this.orig.add(this.dir.multiply(t));
    }
} 