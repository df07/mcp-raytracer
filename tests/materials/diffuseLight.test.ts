import { DiffuseLight } from '../../src/materials/diffuseLight.js';
import { Ray } from '../../src/geometry/ray.js';
import { Vec3, Color } from '../../src/geometry/vec3.js';
import { HitRecord } from '../../src/geometry/hittable.js';

describe('DiffuseLight Material', () => {
    test('should have correct emission color', () => {
        const whiteLight = new DiffuseLight(new Color(1.0, 1.0, 1.0));
        expect(whiteLight.emit.x).toBeCloseTo(1.0);
        expect(whiteLight.emit.y).toBeCloseTo(1.0);
        expect(whiteLight.emit.z).toBeCloseTo(1.0);
        
        const coloredLight = new DiffuseLight(new Color(5.0, 2.0, 3.0));
        expect(coloredLight.emit.x).toBeCloseTo(5.0);
        expect(coloredLight.emit.y).toBeCloseTo(2.0);
        expect(coloredLight.emit.z).toBeCloseTo(3.0);
    });

    test('should return emission color from emitted method', () => {
        const emissionColor = new Color(3.0, 2.0, 1.0);
        const light = new DiffuseLight(emissionColor);
        
        const hitRecord: HitRecord = {
            p: new Vec3(0, 0, 0),
            normal: new Vec3(0, 1, 0),
            t: 1.0,
            frontFace: true,
            material: light
        };
        
        const emitted = light.emitted(hitRecord);
        
        // The emitted color should match the emission color provided in the constructor
        expect(emitted).toBe(emissionColor);
        expect(emitted.x).toBeCloseTo(3.0);
        expect(emitted.y).toBeCloseTo(2.0);
        expect(emitted.z).toBeCloseTo(1.0);
    });

    test('should not scatter any rays', () => {
        const light = new DiffuseLight(new Vec3(1.0, 1.0, 1.0));
        
        const hitRecord: HitRecord = {
            p: new Vec3(0, 0, 0),
            normal: new Vec3(0, 1, 0),
            t: 1.0,
            frontFace: true,
            material: light
        };
        
        const incomingRay = { origin: new Vec3(0, -1, 0), direction: new Vec3(0, 1, 0) };
        
        const scatterResult = light.scatter(incomingRay.origin, incomingRay.direction, hitRecord);
        
        // DiffuseLight should never scatter rays, so scatter should always return null
        expect(scatterResult).toBeNull();
    });
}); 