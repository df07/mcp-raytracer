import { vec3, point3, color, dot, cross, unitVector } from '../src/vec3.js';

describe('vec3', () => {
    // --- Constructor and Accessors --- 

    it('should construct with default values (0, 0, 0)', () => {
        const v = new vec3();
        expect(v.e).toEqual([0, 0, 0]);
        expect(v.x()).toBe(0);
        expect(v.y()).toBe(0);
        expect(v.z()).toBe(0);
    });

    it('should construct with given values', () => {
        const v = new vec3(1, 2, 3);
        expect(v.e).toEqual([1, 2, 3]);
        expect(v.x()).toBe(1);
        expect(v.y()).toBe(2);
        expect(v.z()).toBe(3);
    });

    // --- Type Aliases (Compile-time check, no runtime test needed) ---
    it('should allow assignment using type aliases', () => {
        const p: point3 = new vec3(1, 1, 1);
        const c: color = new vec3(0.5, 0.5, 0.5);
        // Just check if they are vec3 instances for basic runtime sanity
        expect(p instanceof vec3).toBe(true);
        expect(c instanceof vec3).toBe(true);
    });

    // --- Operator Methods --- 
    describe('Operator Methods', () => {
        const v1 = new vec3(1, 2, 3);
        const v2 = new vec3(4, 5, 6);

        it('should negate a vector', () => {
            expect(v1.negate()).toEqual(new vec3(-1, -2, -3));
        });

        it('should add two vectors', () => {
            expect(v1.add(v2)).toEqual(new vec3(5, 7, 9));
        });

        it('should subtract two vectors', () => {
            expect(v1.subtract(v2)).toEqual(new vec3(-3, -3, -3));
            expect(v2.subtract(v1)).toEqual(new vec3(3, 3, 3));
        });

        it('should multiply by a scalar', () => {
            expect(v1.multiply(2)).toEqual(new vec3(2, 4, 6));
            expect(v1.multiply(0)).toEqual(new vec3(0, 0, 0));
        });

        it('should multiply element-wise by another vector', () => {
            expect(v1.multiplyVec(v2)).toEqual(new vec3(4, 10, 18));
        });

        it('should divide by a scalar', () => {
            expect(new vec3(2, 4, 6).divide(2)).toEqual(new vec3(1, 2, 3));
            // Consider adding a test for division by zero if behavior is defined
        });

        it('should maintain immutability', () => {
            const vOriginal = new vec3(1, 1, 1);
            const vCopy = new vec3(vOriginal.x(), vOriginal.y(), vOriginal.z()); // Ensure deep copy for comparison
            
            vOriginal.negate();
            vOriginal.add(new vec3(1,1,1));
            vOriginal.subtract(new vec3(1,1,1));
            vOriginal.multiply(2);
            vOriginal.multiplyVec(new vec3(2,2,2));
            vOriginal.divide(2);

            expect(vOriginal).toEqual(vCopy); // Original vector should not have changed
        });
    });

    // --- Magnitude Methods --- 
    describe('Magnitude Methods', () => {
        const v = new vec3(3, 4, 0);
        const zeroVec = new vec3(0, 0, 0);

        it('should calculate length squared correctly', () => {
            expect(v.lengthSquared()).toBe(25); // 3*3 + 4*4 + 0*0 = 9 + 16 + 0
            expect(zeroVec.lengthSquared()).toBe(0);
        });

        it('should calculate length correctly', () => {
            expect(v.length()).toBeCloseTo(5);
            expect(zeroVec.length()).toBeCloseTo(0);
            expect(new vec3(1, 1, 1).length()).toBeCloseTo(Math.sqrt(3));
        });
    });
});

// --- Utility Functions --- 
describe('vec3 Utility Functions', () => {
    const v1 = new vec3(1, 2, 3);
    const v2 = new vec3(4, -5, 6);
    const i = new vec3(1, 0, 0);
    const j = new vec3(0, 1, 0);
    const k = new vec3(0, 0, 1);
    const zeroVec = new vec3(0, 0, 0);

    it('should calculate the dot product correctly', () => {
        expect(dot(v1, v2)).toBe(1 * 4 + 2 * -5 + 3 * 6); // 4 - 10 + 18 = 12
        expect(dot(v1, zeroVec)).toBe(0);
        expect(dot(i, j)).toBe(0); // Orthogonal
        expect(dot(i, i)).toBe(1); // Parallel unit vector
    });

    it('should calculate the cross product correctly', () => {
        // v1 x v2 = (2*6 - 3*(-5), 3*4 - 1*6, 1*(-5) - 2*4)
        //         = (12 - (-15), 12 - 6, -5 - 8)
        //         = (27, 6, -13)
        expect(cross(v1, v2)).toEqual(new vec3(27, 6, -13));
        expect(cross(i, j)).toEqual(k); // i x j = k
        expect(cross(j, i)).toEqual(k.negate()); // j x i = -k
        expect(cross(v1, v1)).toEqual(zeroVec); // Vector crossed with itself is zero
        expect(cross(v1, zeroVec)).toEqual(zeroVec);
    });

    it('should calculate the unit vector correctly', () => {
        const v = new vec3(3, 4, 0);
        const length = v.length(); // 5
        const unitV = unitVector(v);
        expect(unitV.x()).toBeCloseTo(3 / length);
        expect(unitV.y()).toBeCloseTo(4 / length);
        expect(unitV.z()).toBeCloseTo(0 / length);
        expect(unitV.length()).toBeCloseTo(1);

        // Test unit vector of a unit vector
        const unitI = unitVector(i);
        expect(unitI).toEqual(i);
        expect(unitI.length()).toBeCloseTo(1);

        // Consider behavior for zero vector (might result in NaN or Infinity)
        // const unitZero = unitVector(zeroVec); 
        // expect(isNaN(unitZero.x())).toBe(true);
    });
}); 