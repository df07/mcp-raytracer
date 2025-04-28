/* Specs: vec3.md */

/**
 * Represents a 3-dimensional vector or point.
 */
export class Vec3 {
    private elements: [number, number, number];

    constructor(e0: number = 0, e1: number = 0, e2: number = 0) {
        this.elements = [e0, e1, e2];
    }

    get x(): number {
        return this.elements[0];
    }

    get y(): number {
        return this.elements[1];
    }

    get z(): number {
        return this.elements[2];
    }

    negate(): Vec3 {
        // Ensure -0 becomes 0 for consistent equality checks
        const e0 = this.elements[0] === 0 ? 0 : -this.elements[0];
        const e1 = this.elements[1] === 0 ? 0 : -this.elements[1];
        const e2 = this.elements[2] === 0 ? 0 : -this.elements[2];
        return new Vec3(e0, e1, e2);
    }

    add(v: Vec3): Vec3 {
        return new Vec3(this.elements[0] + v.elements[0], this.elements[1] + v.elements[1], this.elements[2] + v.elements[2]);
    }

    subtract(v: Vec3): Vec3 {
        return new Vec3(this.elements[0] - v.elements[0], this.elements[1] - v.elements[1], this.elements[2] - v.elements[2]);
    }

    multiply(t: number): Vec3 {
        return new Vec3(this.elements[0] * t, this.elements[1] * t, this.elements[2] * t);
    }

    multiplyVec(v: Vec3): Vec3 {
        return new Vec3(this.elements[0] * v.elements[0], this.elements[1] * v.elements[1], this.elements[2] * v.elements[2]);
    }

    divide(t: number): Vec3 {
        return this.multiply(1 / t);
    }

    lengthSquared(): number {
        return this.elements[0] * this.elements[0] + this.elements[1] * this.elements[1] + this.elements[2] * this.elements[2];
    }

    length(): number {
        return Math.sqrt(this.lengthSquared());
    }

    /**
     * Computes the dot product of this vector with another vector.
     * @param v The other vector.
     * @returns The dot product.
     */
    dot(v: Vec3): number {
        return dot(this, v);
    }

    /**
     * Computes the cross product of this vector with another vector.
     * @param v The other vector.
     * @returns The cross product vector.
     */
    cross(v: Vec3): Vec3 {
        return cross(this, v);
    }

    /**
     * Returns a unit vector in the same direction as this vector.
     */
    unitVector(): Vec3 {
        return unitVector(this);
    }

    // No need for copyFrom if direct assignment/construction is sufficient
}

// Type aliases
export type Point3 = Vec3;
export type Color = Vec3;

// NOTE: point3 and color are type aliases for vec3.
// Always use the 'new vec3(...)' constructor for instantiation.
// These aliases provide semantic clarity in function signatures and variables.

// vec3 Utility Functions

export function dot(u: Vec3, v: Vec3): number {
    return u.x * v.x + u.y * v.y + u.z * v.z;
}

export function cross(u: Vec3, v: Vec3): Vec3 {
    return new Vec3(u.y * v.z - u.z * v.y,
                    u.z * v.x - u.x * v.z,
                    u.x * v.y - u.y * v.x);
}

export function unitVector(v: Vec3): Vec3 {
    return v.divide(v.length());
} 