import { DefaultMaterial } from '../../src/materials/material.js';
import { Ray } from '../../src/geometry/ray.js';
import { Vec3 } from '../../src/geometry/vec3.js';
import { HitRecord } from '../../src/geometry/hittable.js';

describe('DefaultMaterial', () => {
    test('should not scatter rays by default', () => {
        const defaultMaterial = new DefaultMaterial();
        
        const hitRecord: HitRecord = {
            p: Vec3.create(0, 0, 0),
            normal: Vec3.create(0, 1, 0),
            t: 1.0,
            frontFace: true,
            material: defaultMaterial
        };
        
        const incomingRay = new Ray(Vec3.create(0, -1, 0), Vec3.create(0, 1, 0));
        
        const scatterResult = defaultMaterial.scatter(incomingRay, hitRecord);
        
        // DefaultMaterial should not scatter by default
        expect(scatterResult).toBeNull();
    });
    
    test('should not emit light by default', () => {
        const defaultMaterial = new DefaultMaterial();
        
        const hitRecord: HitRecord = {
            p: Vec3.create(0, 0, 0),
            normal: Vec3.create(0, 1, 0),
            t: 1.0,
            frontFace: true,
            material: defaultMaterial
        };
        
        const emitted = defaultMaterial.emitted(hitRecord);
        
        // Default emitted should be black (no light emission)
        expect(emitted.x).toBeCloseTo(0);
        expect(emitted.y).toBeCloseTo(0);
        expect(emitted.z).toBeCloseTo(0);
    });
}); 