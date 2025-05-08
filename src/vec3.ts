/* Specs: vec3.md */

import * as glMatrix from 'gl-matrix';

// Vector pool for reusing temporary vectors
const VEC_POOL_SIZE = 100;
const vecPool: glMatrix.vec3[] = [];
let vecPoolIndex = 0;

/**
 * Gets a temporary vector from the pool, or creates a new one if none are available.
 * Use this for intermediate calculations that don't need to persist.
 */
function getTempVec3(): glMatrix.vec3 {
    if (vecPool.length < VEC_POOL_SIZE) {
        if (vecPoolIndex >= vecPool.length) {
            vecPool.push(glMatrix.vec3.create());
        }
        return vecPool[vecPoolIndex++];
    } else {
        vecPoolIndex = (vecPoolIndex + 1) % VEC_POOL_SIZE;
        return vecPool[vecPoolIndex];
    }
}

/**
 * Resets the vector pool index. Call this at the end of major operations
 * to ensure the pool is fully available for the next set of operations.
 */
function resetVecPool(): void {
    vecPoolIndex = 0;
}

/**
 * Represents a 3-dimensional vector or point.
 * Implementation uses gl-matrix for optimal performance.
 */
export class Vec3 {
    // The internal gl-matrix vector
    public glVec: glMatrix.vec3;

    constructor(e0: number = 0, e1: number = 0, e2: number = 0) {
        this.glVec = glMatrix.vec3.fromValues(e0, e1, e2);
    }

    get x(): number {
        return this.glVec[0];
    }

    get y(): number {
        return this.glVec[1];
    }

    get z(): number {
        return this.glVec[2];
    }

    /**
     * Checks if this vector is equal to another vector.
     * @param v The vector to compare with.
     * @returns True if the vectors are equal, false otherwise.
     */
    equals(v: Vec3): boolean {
        const s = 1e-8; // Small value threshold
        return Math.abs(this.x - v.x) < s && 
               Math.abs(this.y - v.y) < s && 
               Math.abs(this.z - v.z) < s;
    }

    negate(): Vec3 {
        const result = new Vec3();
        glMatrix.vec3.negate(result.glVec, this.glVec);
        // Ensure -0 becomes 0 for consistent equality checks
        for (let i = 0; i < 3; i++) {
            if (result.glVec[i] === 0) result.glVec[i] = 0;
        }
        return result;
    }

    add(v: Vec3): Vec3 {
        const result = new Vec3();
        glMatrix.vec3.add(result.glVec, this.glVec, v.glVec);
        return result;
    }

    subtract(v: Vec3): Vec3 {
        const result = new Vec3();
        glMatrix.vec3.subtract(result.glVec, this.glVec, v.glVec);
        return result;
    }

    multiply(t: number): Vec3 {
        const result = new Vec3();
        glMatrix.vec3.scale(result.glVec, this.glVec, t);
        return result;
    }

    multiplyVec(v: Vec3): Vec3 {
        const result = new Vec3();
        glMatrix.vec3.multiply(result.glVec, this.glVec, v.glVec);
        return result;
    }

    divide(t: number): Vec3 {
        const result = new Vec3();
        // Use direct scale with 1/t for better performance
        glMatrix.vec3.scale(result.glVec, this.glVec, 1/t);
        return result;
    }

    lengthSquared(): number {
        // Inline the calculation for better performance
        const v = this.glVec;
        return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
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
        // Inline the calculation for better performance
        const a = this.glVec;
        const b = v.glVec;
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    /**
     * Computes the cross product of this vector with another vector.
     * @param v The other vector.
     * @returns The cross product vector.
     */
    cross(v: Vec3): Vec3 {
        const result = new Vec3();
        glMatrix.vec3.cross(result.glVec, this.glVec, v.glVec);
        return result;
    }

    /**
     * Checks if the vector is very close to zero in all dimensions.
     * Used to prevent degenerate scatter directions.
     */
    nearZero(): boolean {
        // Return true if the vector is close to zero in all dimensions
        const s = 1e-8; // Small value threshold
        return (Math.abs(this.x) < s) && 
               (Math.abs(this.y) < s) && 
               (Math.abs(this.z) < s);
    }

    /**
     * Returns a unit vector in the same direction as this vector.
     */
    unitVector(): Vec3 {
        const result = new Vec3();
        glMatrix.vec3.normalize(result.glVec, this.glVec);
        return result;
    }

    // Static methods for random vector generation
    static random(min: number = 0, max: number = 1): Vec3 {
        const result = new Vec3();
        for (let i = 0; i < 3; i++) {
            result.glVec[i] = min + (max - min) * Math.random();
        }
        return result;
    }

    static randomInUnitSphere(): Vec3 {
        while (true) {
            const p = Vec3.random(-1, 1);
            if (p.lengthSquared() < 1) {
                return p;
            }
        }
    }

    static randomUnitVector(): Vec3 {
        return Vec3.randomInUnitSphere().unitVector();
    }

    static randomInHemisphere(normal: Vec3): Vec3 {
        const inUnitSphere = Vec3.randomInUnitSphere();
        // If the random vector is in the same hemisphere as the normal, return it
        // otherwise return its negative
        if (inUnitSphere.dot(normal) > 0.0) {
            return inUnitSphere;
        } else {
            return inUnitSphere.negate();
        }
    }
}

// Type aliases
export type Point3 = Vec3;
export type Color = Vec3;

// NOTE: point3 and color are type aliases for vec3.
// Always use the 'new vec3(...)' constructor for instantiation.
// These aliases provide semantic clarity in function signatures and variables.

// vec3 Utility Functions

export function dot(u: Vec3, v: Vec3): number {
    return u.dot(v);
}

export function cross(u: Vec3, v: Vec3): Vec3 {
    return u.cross(v);
}

export function unitVector(v: Vec3): Vec3 {
    return v.unitVector();
}

/**
 * Calculates the reflection of a vector around a normal vector.
 * @param v The incident vector to reflect (assumed to be pointing in).
 * @param n The normal vector to reflect around (assumed to be unit length).
 * @returns A new vector representing the reflection.
 */
export function reflect(v: Vec3, n: Vec3): Vec3 {
    // Use temporary vectors from the pool for intermediate calculations
    const temp = getTempVec3();
    const result = new Vec3();
    
    // Calculate dot product
    const dotProduct = v.dot(n);
    
    // Calculate 2 * dot(v, n) * n
    glMatrix.vec3.scale(temp, n.glVec, 2 * dotProduct);
    
    // Subtract from v
    glMatrix.vec3.subtract(result.glVec, v.glVec, temp);
    
    // Reset the vector pool for the next operations
    resetVecPool();
    
    return result;
}