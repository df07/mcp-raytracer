import { Lambertian } from '../../src/materials/lambertian.js';
import { Vec3, Color } from '../../src/geometry/vec3.js';
import { Ray } from '../../src/geometry/ray.js';
import { HitRecord } from '../../src/geometry/hittable.js';
import { CosinePDF } from '../../src/geometry/pdf.js';
import { Material, ScatterResult } from '../../src/materials/material.js';

describe('Lambertian Material', () => {
    test('should have correct albedo', () => {
        const redLambertian = new Lambertian(new Color(0.8, 0.2, 0.2));
        expect(redLambertian.albedo.x).toBeCloseTo(0.8);
        expect(redLambertian.albedo.y).toBeCloseTo(0.2);
        expect(redLambertian.albedo.z).toBeCloseTo(0.2);
    });

    test('should produce a scatter result with a PDF', () => {
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
            // Should have a PDF, not a ray
            expect(scatterResult.pdf).toBeDefined();
            expect(scatterResult.scattered).toBeUndefined();
            
            // Attenuation should be the albedo
            expect(scatterResult.attenuation).toBe(lambertian.albedo);
            
            // PDF should be a CosinePDF
            expect(scatterResult.pdf).toBeInstanceOf(CosinePDF);
        }
    });

    const albedo = new Color(0.8, 0.4, 0.2);
    let material: Lambertian;
    let hitRecord: HitRecord;
    
    beforeEach(() => {
        material = new Lambertian(albedo);
        
        // Mock hit record for testing
        hitRecord = {
            p: new Vec3(0, 0, 0),
            normal: new Vec3(0, 1, 0), // Up
            t: 1.0,
            frontFace: true,
            material: material as Material,
        };
    });
    
    it('should store albedo correctly', () => {
        expect(material.albedo).toEqual(albedo);
    });
    
    it('should return ScatterResult with attenuation and PDF', () => {
        // Arrange
        const ray = new Ray(new Vec3(0, -1, 0), new Vec3(0, 1, 0));
        
        // Act
        const result = material.scatter(ray, hitRecord);
        
        // Assert
        expect(result).not.toBeNull();
        if (result) {
            // Should have attenuation equal to albedo
            expect(result.attenuation).toEqual(albedo);
            
            // Should have a PDF, not a ray
            expect(result.pdf).toBeDefined();
            expect(result.scattered).toBeUndefined();
            
            // The PDF should be a CosinePDF around the normal
            expect(result.pdf).toBeInstanceOf(CosinePDF);
            
            // Test the PDF value in the normal direction
            if (result.pdf) {
                expect(result.pdf.value(new Vec3(0, 1, 0))).toBeCloseTo(1/Math.PI);
            }
        }
    });
    
    it('should generate directions in the correct hemisphere', () => {
        // Arrange
        const ray = new Ray(new Vec3(0, -1, 0), new Vec3(0, 1, 0));
        const result = material.scatter(ray, hitRecord);
        
        expect(result).not.toBeNull();
        if (result && result.pdf) {
            // Generate multiple directions and verify they're in the right hemisphere
            for (let i = 0; i < 100; i++) {
                const direction = result.pdf.generate();
                
                // Direction should be in same hemisphere as normal
                expect(direction.dot(hitRecord.normal)).toBeGreaterThan(0);
                
                // Direction should be normalized
                expect(direction.length()).toBeCloseTo(1, 1);
            }
        }
    });
});
