/* Specs: vec3.md */

import * as glMatrix from 'gl-matrix';

interface IVectorPool {
    get(): Vec3;
}

const NoPool: IVectorPool = {
    get: () => new Vec3()
}

let pool: IVectorPool = NoPool;


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
    
    /**
     * Returns a vector that is the negation of this vector.
     * @param pool Optional vector pool to use for result allocation
     * @returns A new vector with all components negated
     */
    negate(): Vec3 {
        const result = pool.get();
        glMatrix.vec3.negate(result.glVec, this.glVec);
        // Ensure -0 becomes 0 for consistent equality checks
        for (let i = 0; i < 3; i++) {
            if (result.glVec[i] === 0) result.glVec[i] = 0;
        }
        return result;
    }    
    
    /**
     * Add another vector to this vector.
     * @param v Vector to add
     * @param pool Optional vector pool to use for result allocation
     * @returns A new vector representing the sum
     */
    add(v: Vec3): Vec3 {
        const result = pool.get();
        glMatrix.vec3.add(result.glVec, this.glVec, v.glVec);
        return result;
    }
    
    /**
     * Subtract another vector from this vector.
     * @param v Vector to subtract
     * @param pool Optional vector pool to use for result allocation
     * @returns A new vector representing the difference
     */
    subtract(v: Vec3): Vec3 {
        const result = pool.get();
        glMatrix.vec3.subtract(result.glVec, this.glVec, v.glVec);
        return result;
    }    
    
    /**
     * Multiply this vector by a scalar value.
     * @param t Scalar to multiply by
     * @param pool Optional vector pool to use for result allocation
     * @returns A new vector representing the scaled vector
     */
    multiply(t: number): Vec3 {
        const result = pool.get();
        glMatrix.vec3.scale(result.glVec, this.glVec, t);
        return result;
    }

    /**
     * Multiply this vector component-wise with another vector.
     * @param v Vector to multiply by
     * @param pool Optional vector pool to use for result allocation
     * @returns A new vector representing the component-wise product
     */
    multiplyVec(v: Vec3): Vec3 {
        const result = pool.get();
        glMatrix.vec3.multiply(result.glVec, this.glVec, v.glVec);
        return result;
    }
    
    /**
     * Divide this vector by a scalar value.
     * @param t Scalar to divide by
     * @param pool Optional vector pool to use for result allocation
     * @returns A new vector representing the divided vector
     */
    divide(t: number): Vec3 {
        const result = pool.get();
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
    }    /**
     * Computes the cross product of this vector with another vector.
     * @param v The other vector.
     * @param pool Optional vector pool to use for result allocation
     * @returns The cross product vector.
     */
    cross(v: Vec3): Vec3 {
        const result = pool.get();
        glMatrix.vec3.cross(result.glVec, this.glVec, v.glVec);
        return result;
    }

    /**
     * Calculates the reflection of a vector around a normal vector.
     * @param n The normal vector to reflect around (assumed to be unit length).
     * @param pool Optional vector pool to use for result allocation
     * @returns A new vector representing the reflection.
     */
    reflect(n: Vec3): Vec3 {
        const result = pool.get();
        
        // Calculate dot product
        const dotProduct = this.dot(n);
        
        // Use a pooled vector for the intermediate n*2*dot calculation
        const scaledNormal = n.multiply(2 * dotProduct);
        
        // Subtract from v and store in result
        glMatrix.vec3.subtract(result.glVec, this.glVec, scaledNormal.glVec);
        
        return result;
    }

    /**
     * Calculates the refraction of a vector through a surface with normal n.
     * @param n The normal vector at the surface point (assumed to be unit length).
     * @param etaiOverEtat The ratio of refractive indices (n_incident / n_refracted).
     * @returns A new vector representing the refracted direction.
     */
    refract(n: Vec3, etaiOverEtat: number): Vec3 {
        const result = pool.get();
        
        // Calculate cosine of incident angle (clamped to [-1,1])
        const cosTheta = Math.min(this.negate().dot(n), 1.0);
        
        // Calculate perpendicular component of refracted ray
        const rOutPerp = this.add(n.multiply(cosTheta)).multiply(etaiOverEtat);
        
        // Calculate parallel component of refracted ray
        const rOutParallel = n.multiply(-Math.sqrt(Math.abs(1.0 - rOutPerp.lengthSquared())));
        
        // Add perpendicular and parallel components
        glMatrix.vec3.add(result.glVec, rOutPerp.glVec, rOutParallel.glVec);
        
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
     * @param pool Optional vector pool to use for result allocation
     * @returns A unit vector with the same direction as this vector
     */
    unitVector(): Vec3 {
        const result = pool.get();
        glMatrix.vec3.normalize(result.glVec, this.glVec);
        return result;
    }
    
    /**
     * Calculates the illuminance (perceived brightness) of this color vector.
     * Uses standard RGB-to-brightness conversion weights.
     * @returns The perceived brightness as a single number
     */
    illuminance(): number {
        // Standard weights for perceived brightness: 0.299R + 0.587G + 0.114B
        return 0.299 * this.x + 0.587 * this.y + 0.114 * this.z;
    }

    // Static methods for random vector generation
    /**
     * Creates a random vector with components in the given range.
     * @param min Minimum value for components (default 0)
     * @param max Maximum value for components (default 1)
     * @param pool Optional vector pool to use for result allocation
     * @returns A new vector with random components
     */
    static random(min: number = 0, max: number = 1): Vec3 {
        const result = pool.get();
        for (let i = 0; i < 3; i++) {
            result.glVec[i] = min + (max - min) * Math.random();
        }
        return result;
    }    /**
     * Creates a random vector inside the unit sphere.
     * @param pool Optional vector pool to use for result allocation
     * @returns A random vector inside the unit sphere
     */
    static randomInUnitSphere(): Vec3 {
        while (true) {
            const p = Vec3.random(-1, 1);
            if (p.lengthSquared() < 1) {
                return p;
            }
        }
    }

    /**
     * Creates a random unit vector.
     * @param pool Optional vector pool to use for result allocation
     * @returns A random unit vector
     */
    static randomUnitVector(): Vec3 {
        return Vec3.randomInUnitSphere().unitVector();
    }

    /**
     * Creates a random vector in the hemisphere around the given normal.
     * @param normal The normal vector defining the hemisphere
     * @param pool Optional vector pool to use for result allocation
     * @returns A random vector in the hemisphere
     */
    static randomInHemisphere(normal: Vec3): Vec3 {
        const inUnitSphere = Vec3.randomInUnitSphere();        // If the random vector is in the same hemisphere as the normal, return it
        // otherwise return its negative
        if (inUnitSphere.dot(normal) > 0.0) {
            return inUnitSphere;
        } else {
            return inUnitSphere.negate();
        }
    }

    static clone(v: Vec3): Vec3 {
        const result = pool.get();
        glMatrix.vec3.copy(result.glVec, v.glVec);
        return result;
    }

    static usePool(newPool: VectorPool | null) {
        // If a new pool is provided, ensure all vectors are allocated from it
        pool = newPool || NoPool;
    }

    static BLACK = new Vec3(0, 0, 0);
    static WHITE = new Vec3(1, 1, 1);
    static BLUE = new Vec3(0.5, 0.7, 1.0);
}

// Type aliases
export type Point3 = Vec3;
export type Color = Vec3;

// NOTE: point3 and color are type aliases for vec3.
// Always use the 'new vec3(...)' constructor for instantiation.
// These aliases provide semantic clarity in function signatures and variables.

/**
 * A pool of reusable vectors to reduce memory allocations during ray tracing
 */
export class VectorPool {
    private pool: Vec3[];
    private index: number;
    private initialSize: number;
    private readonly maxSize: number = 640000; // Maximum pool size to prevent unbounded memory growth
    
    constructor(size: number = 100) {
        this.pool = [];
        this.index = 0;
        this.initialSize = size;
        
        // Pre-allocate the initial pool
        this.expandPool(size);
    }
    
    /**
     * Get a vector from the pool, expanding the pool if necessary
     */
    get(): Vec3 {
        // If we're at the end of the pool, expand it
        if (this.index >= this.pool.length) {
            // Check if we're about to exceed the maximum size
            const newSize = Math.min(this.pool.length * 2, this.maxSize);
            if (this.index >= this.maxSize) {
                throw new Error(`Vector pool exceeded maximum size of ${this.maxSize}. This may indicate an issue with pool management or an excessive number of vectors needed.`);
            }
            
            console.error(`Expanding vector pool from ${this.pool.length} to ${newSize} vectors`);
            this.expandPool(newSize - this.pool.length);
        }
        
        // Get the vector and increment the index
        return this.pool[this.index++];
    }
    
    /**
     * Reset the pool index to zero
     */
    reset(): void {
        this.index = 0;
    }

    size(): number {
        return this.pool.length;
    }
    
    /**
     * Expand the pool by adding more vectors
     */
    private expandPool(additionalVectors: number): void {
        for (let i = 0; i < additionalVectors; i++) {
            this.pool.push(new Vec3());
        }
    }
}