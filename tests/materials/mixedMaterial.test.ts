/* Specs: mixed-material.md, material.md, pdf-sampling.md */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { MixedMaterial } from '../../src/materials/mixedMaterial.js';
import { Lambertian } from '../../src/materials/lambertian.js';
import { Metal } from '../../src/materials/metal.js';
import { Dielectric } from '../../src/materials/dielectric.js';
import { Vec3, Color } from '../../src/geometry/vec3.js';
import { Ray } from '../../src/geometry/ray.js';
import { HitRecord } from '../../src/geometry/hittable.js';
import { CosinePDF } from '../../src/geometry/pdf.js';

// Mock material for creating hit records
const mockMaterial = new Lambertian(Color.create(1, 1, 1));

// Helper function to create a basic hit record
function createHitRecord(point: Vec3, normal: Vec3): HitRecord {
  return {
    p: point,
    normal: normal,
    t: 1.0,
    frontFace: true,
    material: mockMaterial
  };
}

describe('MixedMaterial', () => {
  let redPaint: Lambertian;
  let silverMetal: Metal;
  let glass: Dielectric;

  beforeEach(() => {
    redPaint = new Lambertian(Color.create(0.8, 0.2, 0.2));
    silverMetal = new Metal(Color.create(0.9, 0.9, 0.9), 0.1);
    glass = new Dielectric(1.5);
  });

  describe('Constructor', () => {
    it('should create a MixedMaterial with given materials and weight', () => {
      // Act
      const material = new MixedMaterial(redPaint, silverMetal, 0.7);
      
      // Assert
      expect(material.material1).toBe(redPaint);
      expect(material.material2).toBe(silverMetal);
      expect(material.weight).toBe(0.7);
    });

    it('should clamp weight to [0, 1] range', () => {
      // Act
      const material1 = new MixedMaterial(redPaint, silverMetal, -0.5); // Should clamp to 0
      const material2 = new MixedMaterial(redPaint, silverMetal, 1.5);  // Should clamp to 1
      const material3 = new MixedMaterial(redPaint, silverMetal, 0.6);  // Should remain 0.6
      
      // Assert
      expect(material1.weight).toBe(0.0);
      expect(material2.weight).toBe(1.0);
      expect(material3.weight).toBe(0.6);
    });
  });

  describe('scatter', () => {
    it('should always use material1 when weight = 1.0', () => {
      // Arrange
      const material = new MixedMaterial(redPaint, silverMetal, 1.0);
      const ray = new Ray(Vec3.create(0, 0, 0), Vec3.create(1, 0, 0));
      const hitRecord = createHitRecord(Vec3.create(1, 0, 0), Vec3.create(-1, 0, 0));
      
      // Act - test multiple times to verify consistency
      for (let i = 0; i < 10; i++) {
        const result = material.scatter(ray, hitRecord);
        
        // Assert - should always get Lambertian behavior (PDF, red attenuation)
        expect(result).not.toBeNull();
        expect(result!.attenuation).toEqual(redPaint.albedo);
        expect(result!.pdf).toBeInstanceOf(CosinePDF);
        expect(result!.scattered).toBeUndefined();
      }
    });

    it('should always use material2 when weight = 0.0', () => {
      // Arrange
      const material = new MixedMaterial(redPaint, silverMetal, 0.0);
      const ray = new Ray(Vec3.create(0, 0, 0), Vec3.create(1, -1, 0));
      const hitRecord = createHitRecord(Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
      
      // Act - test multiple times to verify consistency
      for (let i = 0; i < 10; i++) {
        const result = material.scatter(ray, hitRecord);
        
        // Assert - should always get Metal behavior (scattered ray, silver attenuation)
        expect(result).not.toBeNull();
        expect(result!.attenuation).toEqual(silverMetal.albedo);
        expect(result!.scattered).toBeInstanceOf(Ray);
        expect(result!.pdf).toBeUndefined();
      }
    });

    it('should statistically distribute between materials based on weight', () => {
      // Arrange
      const material = new MixedMaterial(redPaint, silverMetal, 0.3); // 30% paint, 70% metal
      const ray = new Ray(Vec3.create(0, 0, 0), Vec3.create(1, -1, 0));
      const hitRecord = createHitRecord(Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
      
      // Act
      let material1Count = 0;
      let material2Count = 0;
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        const result = material.scatter(ray, hitRecord);
        if (result) {
          if (result.pdf) {
            material1Count++; // Lambertian uses PDF
          } else if (result.scattered) {
            material2Count++; // Metal uses scattered ray
          }
        }
      }
      
      // Assert - should be roughly 30/70 split (within statistical tolerance)
      const tolerance = 0.05; // 5% tolerance
      const actualMaterial1Ratio = material1Count / iterations;
      const actualMaterial2Ratio = material2Count / iterations;
      
      expect(Math.abs(actualMaterial1Ratio - 0.3)).toBeLessThan(tolerance);
      expect(Math.abs(actualMaterial2Ratio - 0.7)).toBeLessThan(tolerance);
    });

    it('should work with Lambertian + Metal combination', () => {
      // Arrange
      const material = new MixedMaterial(redPaint, silverMetal, 0.5);
      const ray = new Ray(Vec3.create(0, 0, 0), Vec3.create(1, -1, 0));
      const hitRecord = createHitRecord(Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
      
      // Act
      const result = material.scatter(ray, hitRecord);
      
      // Assert - should get either Lambertian or Metal behavior
      expect(result).not.toBeNull();
      
      if (result!.pdf) {
        // Lambertian behavior
        expect(result!.attenuation).toEqual(redPaint.albedo);
        expect(result!.pdf).toBeInstanceOf(CosinePDF);
        expect(result!.scattered).toBeUndefined();
      } else if (result!.scattered) {
        // Metal behavior
        expect(result!.attenuation).toEqual(silverMetal.albedo);
        expect(result!.scattered).toBeInstanceOf(Ray);
        expect(result!.pdf).toBeUndefined();
      } else {
        fail('Result should have either pdf or scattered');
      }
    });

    it('should work with Dielectric + Lambertian combination', () => {
      // Arrange
      const material = new MixedMaterial(glass, redPaint, 0.4); // 40% glass, 60% paint
      const ray = new Ray(Vec3.create(0, 0, 0), Vec3.create(1, 0, 0));
      const hitRecord = createHitRecord(Vec3.create(1, 0, 0), Vec3.create(-1, 0, 0));
      
      // Act - test multiple times to get both behaviors
      let glassResults = 0;
      let paintResults = 0;
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        const result = material.scatter(ray, hitRecord);
        if (result) {
          if (result.scattered && result.attenuation.equals(Color.create(1, 1, 1))) {
            glassResults++; // Dielectric with white attenuation
          } else if (result.pdf && result.attenuation.equals(redPaint.albedo)) {
            paintResults++; // Lambertian with red attenuation
          }
        }
      }
      
      // Assert - should get both glass and paint behaviors
      expect(glassResults).toBeGreaterThan(0);
      expect(paintResults).toBeGreaterThan(0);
    });

    it('should handle null results from constituent materials', () => {
      // Arrange - use a rough metal that might return null
      const roughMetal = new Metal(Color.create(0.8, 0.8, 0.8), 0.9); // Very rough
      const material = new MixedMaterial(redPaint, roughMetal, 0.5);
      
      // Create conditions that might cause null from metal
      const ray = new Ray(Vec3.create(0, 0, 0), Vec3.create(1, 0.1, 0));
      const hitRecord = createHitRecord(Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
      
      // Act - test multiple times
      let nullResults = 0;
      let validResults = 0;
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        const result = material.scatter(ray, hitRecord);
        if (result === null) {
          nullResults++;
        } else {
          validResults++;
        }
      }
      
      // Assert - should handle both null and valid results gracefully
      expect(nullResults + validResults).toBe(iterations);
      expect(validResults).toBeGreaterThan(0); // Should get some valid results from Lambertian
    });
  });

  describe('emitted', () => {
    it('should return weighted combination of emissions', () => {
      // Arrange - create simple emissive materials for testing
      class EmissiveMaterial extends Lambertian {
        constructor(albedo: Color, private emission: Color) {
          super(albedo);
        }
        
        override emitted(): Color {
          return this.emission;
        }
      }
      
      const emissive1 = new EmissiveMaterial(Color.create(1, 0, 0), Color.create(1, 1, 0)); // Yellow emission
      const emissive2 = new EmissiveMaterial(Color.create(0, 1, 0), Color.create(0, 1, 1)); // Cyan emission
      const material = new MixedMaterial(emissive1, emissive2, 0.3); // 30% emissive1, 70% emissive2
      
      const hitRecord = createHitRecord(Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
      
      // Act
      const emitted = material.emitted(hitRecord);
      
      // Assert - should be weighted combination: 0.3 * yellow + 0.7 * cyan
      const expected = Color.create(1, 1, 0).multiply(0.3).add(Color.create(0, 1, 1).multiply(0.7));
      expect(emitted.x).toBeCloseTo(expected.x, 5);
      expect(emitted.y).toBeCloseTo(expected.y, 5);
      expect(emitted.z).toBeCloseTo(expected.z, 5);
    });

    it('should return black when both materials do not emit', () => {
      // Arrange
      const material = new MixedMaterial(redPaint, silverMetal, 0.5);
      const hitRecord = createHitRecord(Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
      
      // Act
      const emitted = material.emitted(hitRecord);
      
      // Assert
      expect(emitted).toEqual(Color.create(0, 0, 0));
    });
  });

  describe('integration tests', () => {
    it('should create realistic plastic-like surface with Lambertian + Metal', () => {
      // Arrange - simulate plastic with diffuse base and specular highlights
      const blueDiffuse = new Lambertian(Color.create(0.2, 0.4, 0.8));
      const whiteSpecular = new Metal(Color.create(1.0, 1.0, 1.0), 0.05); // Very smooth specular
      const plastic = new MixedMaterial(blueDiffuse, whiteSpecular, 0.7); // Mostly diffuse
      
      const ray = new Ray(Vec3.create(0, 0, 0), Vec3.create(1, -1, 0));
      const hitRecord = createHitRecord(Vec3.create(1, 0, 0), Vec3.create(0, 1, 0));
      
      // Act - sample the material behavior
      let diffuseHits = 0;
      let specularHits = 0;
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        const result = plastic.scatter(ray, hitRecord);
        if (result) {
          if (result.pdf) {
            diffuseHits++;
          } else if (result.scattered) {
            specularHits++;
          }
        }
      }
      
      // Assert - should be mostly diffuse with some specular highlights
      expect(diffuseHits).toBeGreaterThan(specularHits);
      expect(diffuseHits + specularHits).toBe(iterations);
    });

    it('should create interesting glass-metal hybrid', () => {
      // Arrange - unusual combination for artistic effects
      const glassMetal = new MixedMaterial(glass, silverMetal, 0.6); // 60% glass, 40% metal
      const ray = new Ray(Vec3.create(0, 0, 0), Vec3.create(1, 0, 0));
      const hitRecord = createHitRecord(Vec3.create(1, 0, 0), Vec3.create(-1, 0, 0));
      
      // Act - test that both behaviors are present
      let glassLikeBehavior = 0;
      let metalLikeBehavior = 0;
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        const result = glassMetal.scatter(ray, hitRecord);
        if (result && result.scattered) {
          if (result.attenuation.equals(Color.create(1, 1, 1))) {
            glassLikeBehavior++; // Clear attenuation suggests glass
          } else if (result.attenuation.equals(silverMetal.albedo)) {
            metalLikeBehavior++; // Silver attenuation suggests metal
          }
        }
      }
      
      // Assert - should get both behaviors
      expect(glassLikeBehavior).toBeGreaterThan(0);
      expect(metalLikeBehavior).toBeGreaterThan(0);
    });
  });
}); 