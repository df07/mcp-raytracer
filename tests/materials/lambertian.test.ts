import { Lambertian } from '../../src/materials/lambertian.js';
import { Vec3, Color } from '../../src/geometry/vec3.js';
import { Ray } from '../../src/geometry/ray.js';
import { HitRecord } from '../../src/geometry/hittable.js';

describe('Lambertian Material', () => {
    test('should have correct albedo', () => {
        const redLambertian = new Lambertian(new Color(0.8, 0.2, 0.2));
        expect(redLambertian.albedo.x).toBeCloseTo(0.8);
        expect(redLambertian.albedo.y).toBeCloseTo(0.2);
        expect(redLambertian.albedo.z).toBeCloseTo(0.2);
    });

    test('should produce a scatter result', () => {
        const lambertian = new Lambertian(new Color(0.8, 0.2, 0.2));
        const hitRecord: HitRecord = {
            p: new Vec3(0, 0, 0),
            normal: new Vec3(0, 1, 0),
            t: 1.0,
            frontFace: true,
            material: lambertian
        };

        const incomingRay = new Ray(new Vec3(0, -1, 0), new Vec3(0, 1, 0));

        const scatterResult = lambertian.scatter(incomingRay, hitRecord);

        // Should always produce a scatter result (not null)
        expect(scatterResult).not.toBeNull();
        
        if (scatterResult) {
            // Scattered ray should originate from hit point
            expect(scatterResult.scattered.origin).toEqual(hitRecord.p);
            
            // Attenuation should be the albedo
            expect(scatterResult.attenuation).toBe(lambertian.albedo);
            
            // Direction should have a positive y component (same hemisphere as normal)
            // We can't test exact values since it's random
            expect(scatterResult.scattered.direction.lengthSquared()).toBeGreaterThan(0);
            expect(scatterResult.scattered.direction.dot(hitRecord.normal)).toBeGreaterThan(0);
        }
    });    test('should handle degenerate scatter direction', () => {
        // Set up the test objects
        const lambertian = new Lambertian(new Color(0.8, 0.2, 0.2));
        const hitRecord: HitRecord = {
            p: new Vec3(0, 0, 0),
            normal: new Vec3(0, 1, 0),
            t: 1.0,
            frontFace: true,
            material: lambertian
        };

        const incomingRay = new Ray(new Vec3(0, -1, 0), new Vec3(0, 1, 0));

        // We can test near-zero behavior by modifying our Vec3 implementation temporarily
        const originalRandomUnitVector = Vec3.randomUnitVector;
        Vec3.randomUnitVector = () => new Vec3(0, -1, 0); // Return opposite of normal
        
        const scatterResult = lambertian.scatter(incomingRay, hitRecord);
        
        // Restore original method before any assertions that might fail
        Vec3.randomUnitVector = originalRandomUnitVector;
        
        expect(scatterResult).not.toBeNull();
        if (scatterResult) {
            // Check that scattered ray starts from hit point
            expect(scatterResult.scattered.origin).toEqual(hitRecord.p);
            
            // Check direction (with degenerate case, it should fall back to the normal)
            expect(scatterResult.scattered.direction.x).toBeCloseTo(hitRecord.normal.x);
            expect(scatterResult.scattered.direction.y).toBeCloseTo(hitRecord.normal.y);
            expect(scatterResult.scattered.direction.z).toBeCloseTo(hitRecord.normal.z);
        }
    });
});
