/* Specs: vec3.md */

/**
 * Represents a 3-dimensional vector or point.
 */
export class vec3 {
    e: [number, number, number];

    constructor(e0: number = 0, e1: number = 0, e2: number = 0) {
        this.e = [e0, e1, e2];
    }

    x(): number {
        return this.e[0];
    }

    y(): number {
        return this.e[1];
    }

    z(): number {
        return this.e[2];
    }

    negate(): vec3 {
        // Ensure -0 becomes 0 for consistent equality checks
        const e0 = this.e[0] === 0 ? 0 : -this.e[0];
        const e1 = this.e[1] === 0 ? 0 : -this.e[1];
        const e2 = this.e[2] === 0 ? 0 : -this.e[2];
        return new vec3(e0, e1, e2);
    }

    add(v: vec3): vec3 {
        return new vec3(this.e[0] + v.e[0], this.e[1] + v.e[1], this.e[2] + v.e[2]);
    }

    subtract(v: vec3): vec3 {
        return new vec3(this.e[0] - v.e[0], this.e[1] - v.e[1], this.e[2] - v.e[2]);
    }

    multiply(t: number): vec3 {
        return new vec3(this.e[0] * t, this.e[1] * t, this.e[2] * t);
    }

    multiplyVec(v: vec3): vec3 {
        return new vec3(this.e[0] * v.e[0], this.e[1] * v.e[1], this.e[2] * v.e[2]);
    }

    divide(t: number): vec3 {
        return this.multiply(1 / t);
    }

    lengthSquared(): number {
        return this.e[0] * this.e[0] + this.e[1] * this.e[1] + this.e[2] * this.e[2];
    }

    length(): number {
        return Math.sqrt(this.lengthSquared());
    }

    // Static utility functions will be added here or exported separately...
}

// Type aliases
export type point3 = vec3;
export type color = vec3;

// NOTE: point3 and color are type aliases for vec3.
// Always use the 'new vec3(...)' constructor for instantiation.
// These aliases provide semantic clarity in function signatures and variables.

// vec3 Utility Functions

export function dot(u: vec3, v: vec3): number {
    return u.e[0] * v.e[0]
         + u.e[1] * v.e[1]
         + u.e[2] * v.e[2];
}

export function cross(u: vec3, v: vec3): vec3 {
    return new vec3(u.e[1] * v.e[2] - u.e[2] * v.e[1],
                    u.e[2] * v.e[0] - u.e[0] * v.e[2],
                    u.e[0] * v.e[1] - u.e[1] * v.e[0]);
}

export function unitVector(v: vec3): vec3 {
    return v.divide(v.length());
} 