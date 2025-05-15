import { Vec3, Point3, Color } from '../../src/geometry/vec3.js';

describe('Vec3', () => {
    // --- Constructor and Accessors --- 

    it('should construct with default values (0, 0, 0)', () => {
        const v = new Vec3();
        expect(v.x).toBe(0);
        expect(v.y).toBe(0);
        expect(v.z).toBe(0);
    });

    it('should construct with given values', () => {
        const v = new Vec3(1, 2, 3);
        expect(v.x).toBe(1);
        expect(v.y).toBe(2);
        expect(v.z).toBe(3);
    });

    // --- Type Aliases (Compile-time check, no runtime test needed) ---
    it('should allow assignment using type aliases', () => {
        const p: Point3 = new Vec3(1, 1, 1);
        const c: Color = new Vec3(0.5, 0.5, 0.5);
        // Just check if they are Vec3 instances for basic runtime sanity
        expect(p instanceof Vec3).toBe(true);
        expect(c instanceof Vec3).toBe(true);
    });

    // --- Operator Methods --- 
    describe('Operator Methods', () => {
        const v1 = new Vec3(1, 2, 3);
        const v2 = new Vec3(4, 5, 6);

        it('should negate a vector', () => {
            expect(v1.negate()).toEqual(new Vec3(-1, -2, -3));
        });

        it('should add two vectors', () => {
            expect(v1.add(v2)).toEqual(new Vec3(5, 7, 9));
        });

        it('should subtract two vectors', () => {
            expect(v1.subtract(v2)).toEqual(new Vec3(-3, -3, -3));
            expect(v2.subtract(v1)).toEqual(new Vec3(3, 3, 3));
        });

        it('should multiply by a scalar', () => {
            expect(v1.multiply(2)).toEqual(new Vec3(2, 4, 6));
            expect(v1.multiply(0)).toEqual(new Vec3(0, 0, 0));
        });

        it('should multiply element-wise by another vector', () => {
            expect(v1.multiplyVec(v2)).toEqual(new Vec3(4, 10, 18));
        });

        it('should divide by a scalar', () => {
            expect(new Vec3(2, 4, 6).divide(2)).toEqual(new Vec3(1, 2, 3));
            // Consider adding a test for division by zero if behavior is defined
        });

        it('should maintain immutability', () => {
            const vOriginal = new Vec3(1, 1, 1);
            const vCopy = new Vec3(vOriginal.x, vOriginal.y, vOriginal.z);
            
            vOriginal.negate();
            vOriginal.add(new Vec3(1,1,1));
            vOriginal.subtract(new Vec3(1,1,1));
            vOriginal.multiply(2);
            vOriginal.multiplyVec(new Vec3(2,2,2));
            vOriginal.divide(2);

            expect(vOriginal).toEqual(vCopy);
        });
    });

    // --- Magnitude Methods --- 
    describe('Magnitude Methods', () => {
        const v = new Vec3(3, 4, 0);
        const zeroVec = new Vec3(0, 0, 0);

        it('should calculate length squared correctly', () => {
            expect(v.lengthSquared()).toBe(25); // 3*3 + 4*4 + 0*0 = 9 + 16 + 0
            expect(zeroVec.lengthSquared()).toBe(0);
        });

        it('should calculate length correctly', () => {
            expect(v.length()).toBeCloseTo(5);
            expect(zeroVec.length()).toBeCloseTo(0);
            expect(new Vec3(1, 1, 1).length()).toBeCloseTo(Math.sqrt(3));
        });

        // --- Instance Methods --- 
        it('should calculate dot product via instance method', () => {
            const v2 = new Vec3(4, -5, 6);
            expect(v.dot(v2)).toBe(3 * 4 + 4 * -5 + 0 * 6); // 12 - 20 + 0 = -8
        });

        it('should calculate cross product via instance method', () => {
            const v2 = new Vec3(0, 0, 1);
            // v x v2 = (4*1 - 0*0, 0*0 - 3*1, 3*0 - 4*0) = (4, -3, 0)
            expect(v.cross(v2)).toEqual(new Vec3(4, -3, 0));
        });

        it('should calculate unit vector via instance method', () => {
            const length = v.length(); // 5
            const unitV = v.unitVector();
            expect(unitV.x).toBeCloseTo(3 / length);
            expect(unitV.y).toBeCloseTo(4 / length);
            expect(unitV.z).toBeCloseTo(0 / length);
            expect(unitV.length()).toBeCloseTo(1);
        });
    });

    // --- New Random Vector Methods ---
    describe('Random Vector Generation', () => {
        it('should generate a random vector within specified range', () => {
            const randomVec = Vec3.random(-1, 1);
            expect(randomVec.x).toBeGreaterThanOrEqual(-1);
            expect(randomVec.x).toBeLessThanOrEqual(1);
            expect(randomVec.y).toBeGreaterThanOrEqual(-1);
            expect(randomVec.y).toBeLessThanOrEqual(1);
            expect(randomVec.z).toBeGreaterThanOrEqual(-1);
            expect(randomVec.z).toBeLessThanOrEqual(1);
        });

        it('should generate random vectors in the unit sphere', () => {
            // Test multiple times to reduce chance of false positives
            for (let i = 0; i < 10; i++) {
                const inSphereVec = Vec3.randomInUnitSphere();
                // Vector should be inside the unit sphere
                expect(inSphereVec.lengthSquared()).toBeLessThanOrEqual(1);
            }
        });
        
        it('should generate random unit vectors', () => {
            // Test multiple times to reduce chance of false positives
            for (let i = 0; i < 10; i++) {
                const unitVec = Vec3.randomUnitVector();
                // Should have length approximately 1
                expect(unitVec.length()).toBeCloseTo(1);
            }
        });
        
        it('should generate random vectors in the hemisphere aligned with normal', () => {
            const normal = new Vec3(0, 1, 0); // Normal pointing up
            
            // Test multiple times to reduce chance of false positives
            for (let i = 0; i < 10; i++) {
                const hemisphereVec = Vec3.randomInHemisphere(normal);
                
                // Vector should be inside the unit sphere
                expect(hemisphereVec.lengthSquared()).toBeLessThanOrEqual(1);
                
                // Should be in the same hemisphere as the normal
                // Dot product should be positive
                expect(hemisphereVec.dot(normal)).toBeGreaterThanOrEqual(0);
            }
        });
    });
    
    // --- Near Zero Vector Test ---
    describe('Near Zero Vector Detection', () => {
        it('should detect vectors close to zero', () => {
            const almostZero = new Vec3(1e-9, -1e-9, 1e-9);
            const definitelyNotZero = new Vec3(0.001, 0.001, 0.001);
            
            expect(almostZero.nearZero()).toBe(true);
            expect(definitelyNotZero.nearZero()).toBe(false);
            expect(new Vec3().nearZero()).toBe(true); // Zero vector should be near zero
        });
    });
});

// --- Utility Functions --- 
describe('Vec3 Utility Functions', () => {
    const v1 = new Vec3(1, 2, 3);
    const v2 = new Vec3(4, -5, 6);
    const i = new Vec3(1, 0, 0);
    const j = new Vec3(0, 1, 0);
    const k = new Vec3(0, 0, 1);
    const zeroVec = new Vec3(0, 0, 0);

    it('should calculate the dot product correctly', () => {
        expect(v1.dot(v2)).toBe(1 * 4 + 2 * -5 + 3 * 6); // 4 - 10 + 18 = 12
        expect(v1.dot(zeroVec)).toBe(0);
        expect(i.dot(j)).toBe(0); // Orthogonal
        expect(i.dot(i)).toBe(1); // Parallel unit vector
    });

    it('should calculate the cross product correctly', () => {
        // v1 x v2 = (2*6 - 3*(-5), 3*4 - 1*6, 1*(-5) - 2*4)
        //         = (12 - (-15), 12 - 6, -5 - 8)
        //         = (27, 6, -13)
        expect(v1.cross(v2)).toEqual(new Vec3(27, 6, -13));
        expect(i.cross(j)).toEqual(k); // i x j = k
        expect(j.cross(i)).toEqual(k.negate()); // j x i = -k
        expect(v1.cross(v1)).toEqual(zeroVec); // Vector crossed with itself is zero
        expect(v1.cross(zeroVec)).toEqual(zeroVec);
    });

    it('should calculate the unit vector correctly', () => {
        const v = new Vec3(3, 4, 0);
        const length = v.length(); // 5
        const unitV = v.unitVector();
        expect(unitV.x).toBeCloseTo(3 / length);
        expect(unitV.y).toBeCloseTo(4 / length);
        expect(unitV.z).toBeCloseTo(0 / length);
        expect(unitV.length()).toBeCloseTo(1);

        // Test unit vector of a unit vector
        const unitI = i.unitVector();
        expect(unitI).toEqual(i);
        expect(unitI.length()).toBeCloseTo(1);

        // Consider behavior for zero vector (might result in NaN or Infinity)
        // const unitZero = unitVector(zeroVec); 
        // expect(isNaN(unitZero.x())).toBe(true);
    });
});