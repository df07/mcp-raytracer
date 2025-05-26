/* Specs: layered-material.md, material.md, dielectric.md */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { LayeredMaterial } from '../../src/materials/layeredMaterial.js';
import { Dielectric } from '../../src/materials/dielectric.js';
import { Lambertian } from '../../src/materials/lambertian.js';
import { Metal } from '../../src/materials/metal.js';
import { MixedMaterial } from '../../src/materials/mixedMaterial.js';
import { Vec3, Color } from '../../src/geometry/vec3.js';
import { Ray } from '../../src/geometry/ray.js';
import { HitRecord } from '../../src/geometry/hittable.js';
import { CosinePDF } from '../../src/geometry/pdf.js';

// Mock material for creating hit records
const mockMaterial = new Lambertian(new Color(1, 1, 1));

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

describe('LayeredMaterial', () => {
  let glassDielectric: Dielectric;
  let redPaint: Lambertian;
  let silverMetal: Metal;
  let mixedMaterial: MixedMaterial;

  beforeEach(() => {
    glassDielectric = new Dielectric(1.5);
    redPaint = new Lambertian(new Color(0.8, 0.2, 0.2));
    silverMetal = new Metal(new Color(0.9, 0.9, 0.9), 0.1);
    mixedMaterial = new MixedMaterial(
      new Lambertian(new Color(0.6, 0.4, 0.2)), // Diffuse
      new Metal(new Color(0.8, 0.6, 0.4), 0.1), // Specular with slight roughness
      0.7  // 70% diffuse, 30% specular
    );
  });

  describe('Constructor', () => {
    it('should create a LayeredMaterial with given dielectric and inner material', () => {
      // Act
      const material = new LayeredMaterial(glassDielectric, redPaint);
      
      // Assert
      expect(material.outerDielectric).toBe(glassDielectric);
      expect(material.innerMaterial).toBe(redPaint);
    });
  });

  describe('scatter', () => {
    it('should return dielectric result when ray is reflected', () => {
      // Arrange
      const material = new LayeredMaterial(glassDielectric, redPaint);
      const ray = new Ray(new Vec3(0, 0, 0), new Vec3(1, 0, 0));
      const hitRecord = createHitRecord(new Vec3(1, 0, 0), new Vec3(-1, 0, 0));
      
      // Act - test multiple times to find a reflection case
      let reflectionResult = null;
      for (let i = 0; i < 100 && !reflectionResult; i++) {
        const result = material.scatter(ray, hitRecord);
        if (result && result.scattered && result.attenuation.equals(new Color(1, 1, 1))) {
          // This is a reflection from the dielectric (white attenuation)
          reflectionResult = result;
        }
      }
      
      // Assert
      expect(reflectionResult).not.toBeNull();
      expect(reflectionResult!.attenuation).toEqual(new Color(1, 1, 1)); // Clear dielectric
      expect(reflectionResult!.scattered).toBeInstanceOf(Ray);
      expect(reflectionResult!.pdf).toBeUndefined();
    });

    it('should pass refracted ray to inner material when transmitted', () => {
      // Arrange
      const material = new LayeredMaterial(glassDielectric, redPaint);
      const ray = new Ray(new Vec3(0, 0, 0), new Vec3(1, 0, 0));
      const hitRecord = createHitRecord(new Vec3(1, 0, 0), new Vec3(-1, 0, 0));
      
      // Act - test multiple times to find a transmission case
      let transmissionResult = null;
      for (let i = 0; i < 100 && !transmissionResult; i++) {
        const result = material.scatter(ray, hitRecord);
        if (result && result.attenuation.equals(redPaint.albedo)) {
          // This is transmission to the inner material (red attenuation)
          transmissionResult = result;
        }
      }
      
      // Assert
      expect(transmissionResult).not.toBeNull();
      expect(transmissionResult!.attenuation).toEqual(redPaint.albedo); // Inner material's color
      expect(transmissionResult!.pdf).toBeInstanceOf(CosinePDF); // Lambertian uses PDF
      expect(transmissionResult!.scattered).toBeUndefined();
    });

    it('should work with Metal inner material', () => {
      // Arrange
      const material = new LayeredMaterial(glassDielectric, silverMetal);
      const ray = new Ray(new Vec3(0, 0, 0), new Vec3(1, -1, 0));
      const hitRecord = createHitRecord(new Vec3(1, 0, 0), new Vec3(0, 1, 0));
      
      // Act - test multiple times to find transmission to metal
      let metalTransmissionResult = null;
      for (let i = 0; i < 100 && !metalTransmissionResult; i++) {
        const result = material.scatter(ray, hitRecord);
        if (result && result.scattered && result.attenuation.equals(silverMetal.albedo)) {
          metalTransmissionResult = result;
        }
      }
      
      // Assert
      expect(metalTransmissionResult).not.toBeNull();
      expect(metalTransmissionResult!.attenuation).toEqual(silverMetal.albedo);
      expect(metalTransmissionResult!.scattered).toBeInstanceOf(Ray);
      expect(metalTransmissionResult!.pdf).toBeUndefined(); // Metal uses scattered ray
    });

    it('should work with MixedMaterial inner layer', () => {
      // Arrange
      const material = new LayeredMaterial(glassDielectric, mixedMaterial);
      const ray = new Ray(new Vec3(0, 0, 0), new Vec3(1, 0, 0));
      const hitRecord = createHitRecord(new Vec3(1, 0, 0), new Vec3(-1, 0, 0));
      
      // Act - test multiple transmissions to get both diffuse and specular from mixed material
      let diffuseTransmissions = 0;
      let specularTransmissions = 0;
      const iterations = 200;
      
      for (let i = 0; i < iterations; i++) {
        const result = material.scatter(ray, hitRecord);
        if (result) {
          // Skip dielectric reflections (white attenuation)
          if (result.attenuation.equals(new Color(1, 1, 1))) {
            continue;
          }
          
          // Check if it's from inner mixed material
          if (result.pdf) {
            diffuseTransmissions++;
          } else if (result.scattered) {
            specularTransmissions++;
          }
        }
      }
      
      // Assert - should get both types from inner mixed material
      expect(diffuseTransmissions).toBeGreaterThan(0);
      expect(specularTransmissions).toBeGreaterThan(0);
    });

    it('should handle null result from inner material', () => {
      // Arrange - create a material that might return null
      const roughMetal = new Metal(new Color(0.8, 0.8, 0.8), 0.8); // High fuzz
      const material = new LayeredMaterial(glassDielectric, roughMetal);
      
      // Create conditions that might cause the metal to return null
      const ray = new Ray(new Vec3(0, 0, 0), new Vec3(1, 0.1, 0));
      const hitRecord = createHitRecord(new Vec3(1, 0, 0), new Vec3(0, 1, 0));
      
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
      expect(validResults).toBeGreaterThan(0); // Should get some valid results
    });
  });

  describe('emitted', () => {
    it('should return emission from inner material', () => {
      // Arrange
      const material = new LayeredMaterial(glassDielectric, redPaint);
      const hitRecord = createHitRecord(new Vec3(1, 0, 0), new Vec3(0, 1, 0));
      
      // Act
      const emitted = material.emitted(hitRecord);
      const innerEmitted = redPaint.emitted(hitRecord);
      
      // Assert
      expect(emitted).toEqual(innerEmitted);
      expect(emitted).toEqual(new Color(0, 0, 0)); // Lambertian doesn't emit
    });
  });

  describe('integration tests', () => {
    it('should simulate clear-coated paint correctly', () => {
      // Arrange - automotive clear coat over red paint
      const clearCoat = new Dielectric(1.5);
      const paint = new Lambertian(new Color(0.8, 0.2, 0.2));
      const clearCoatedPaint = new LayeredMaterial(clearCoat, paint);
      
      const ray = new Ray(new Vec3(0, 0, 0), new Vec3(1, 0, 0));
      const hitRecord = createHitRecord(new Vec3(1, 0, 0), new Vec3(-1, 0, 0));
      
      // Act - test behavior over multiple samples
      let clearReflections = 0;
      let paintScattering = 0;
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        const result = clearCoatedPaint.scatter(ray, hitRecord);
        if (result) {
          if (result.attenuation.equals(new Color(1, 1, 1)) && result.scattered) {
            clearReflections++; // Clear coat reflection
          } else if (result.attenuation.equals(paint.albedo) && result.pdf) {
            paintScattering++; // Paint diffuse scattering
          }
        }
      }
      
      // Assert - should get both clear coat reflections and paint scattering
      expect(clearReflections).toBeGreaterThan(0);
      expect(paintScattering).toBeGreaterThan(0);
      expect(clearReflections + paintScattering).toBe(iterations);
    });

    it('should simulate glass over metal correctly', () => {
      // Arrange - glass protective layer over brushed metal
      const glass = new Dielectric(1.5);
      const metal = new Metal(new Color(0.8, 0.8, 0.9), 0.1);
      const glassOverMetal = new LayeredMaterial(glass, metal);
      
      const ray = new Ray(new Vec3(0, 0, 0), new Vec3(1, -1, 0));
      const hitRecord = createHitRecord(new Vec3(1, 0, 0), new Vec3(0, 1, 0));
      
      // Act - test behavior over multiple samples
      let glassReflections = 0;
      let metalReflections = 0;
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        const result = glassOverMetal.scatter(ray, hitRecord);
        if (result && result.scattered) {
          if (result.attenuation.equals(new Color(1, 1, 1))) {
            glassReflections++; // Glass surface reflection
          } else if (result.attenuation.equals(metal.albedo)) {
            metalReflections++; // Metal reflection through glass
          }
        }
      }
      
      // Assert - should get both glass and metal reflections
      expect(glassReflections).toBeGreaterThan(0);
      expect(metalReflections).toBeGreaterThan(0);
      expect(glassReflections + metalReflections).toBe(iterations);
    });
  });
}); 