/* Specs: metal.md, pdf-sampling.md */

import { describe, it, expect } from '@jest/globals';
import { Metal } from '../../src/materials/metal.js';
import { Vec3, Color } from '../../src/geometry/vec3.js';
import { Ray } from '../../src/geometry/ray.js';
import { HitRecord } from '../../src/geometry/hittable.js';
import { ScatterResult } from '../../src/materials/material.js';

describe('Metal Material', () => {
  // Test Metal constructor
  it('should create a Metal material with proper albedo and fuzz', () => {
    // Arrange
    const albedo = new Color(0.8, 0.6, 0.2);
    
    // Act
    const metal1 = new Metal(albedo, 0.5);
    const metal2 = new Metal(albedo); // Default fuzz
    const metal3 = new Metal(albedo, 1.5); // Should clamp to 1.0
    const metal4 = new Metal(albedo, -0.5); // Should clamp to 0.0
    
    // Assert
    expect(metal1.albedo).toEqual(albedo);
    expect(metal1.fuzz).toBe(0.5);
    expect(metal2.fuzz).toBe(0);
    expect(metal3.fuzz).toBe(1.0);
    expect(metal4.fuzz).toBe(0.0);
  });
  
  // Test scattering with perfect reflection (no fuzz)
  it('should produce scattered ray with perfect reflection when fuzz is 0', () => {
    // Arrange
    const albedo = new Color(0.8, 0.6, 0.2);
    const metal = new Metal(albedo, 0);
    
    const normal = new Vec3(0, 1, 0); // Up direction
    const hitRecord: HitRecord = {
      p: new Vec3(0, 0, 0), // Hit at origin
      normal: normal,
      t: 1.0,
      frontFace: true,
      material: metal
    };
    
    // Ray coming in at 45-degree angle
    const inDirection = new Vec3(1, -1, 0).unitVector();
    const inRay = new Ray(new Vec3(-1, 1, 0), inDirection);
    
    // Act
    const result = metal.scatter(inRay.origin, inRay.direction, hitRecord) as ScatterResult;
    
    // Assert
    expect(result).not.toBeNull();
    if (result) {
      expect(result.attenuation).toEqual(albedo);
      
      // Should have a ray, not a PDF
      expect(result.scattered).toBeDefined();
      expect(result.pdf).toBeUndefined();
      
      // Ray should start from hit point
      expect(result.scattered?.origin).toEqual(hitRecord.p);
      
      // Reflection should be symmetric around normal
      // If incoming is (1, -1, 0), reflected should be (1, 1, 0) normalized
      const expectedReflection = new Vec3(1, 1, 0).unitVector();
      
      // Check direction of scattered ray
      const actualDirection = result.scattered?.direction as Vec3;
      expect(actualDirection.x).toBeCloseTo(expectedReflection.x, 5);
      expect(actualDirection.y).toBeCloseTo(expectedReflection.y, 5);
      expect(actualDirection.z).toBeCloseTo(expectedReflection.z, 5);
    }
  });
  
  // Test scattering with fuzzy reflection
  it('should add fuzziness to the reflected ray', () => {
    // Arrange
    const albedo = new Color(0.8, 0.6, 0.2);
    const metal = new Metal(albedo, 0.5); // Significant fuzz
    
    const normal = new Vec3(0, 1, 0);
    const hitRecord: HitRecord = {
      p: new Vec3(0, 0, 0),
      normal: normal,
      t: 1.0,
      frontFace: true,
      material: metal
    };
    
    // Ray coming straight down
    const inRay = new Ray(new Vec3(0, 1, 0), new Vec3(0, -1, 0));
    
    // Collect multiple scatter results to test fuzzy behavior
    const numSamples = 100;
    let perfectReflections = 0;
    
    for (let i = 0; i < numSamples; i++) {
      const result = metal.scatter(inRay.origin, inRay.direction, hitRecord) as ScatterResult;
      
      // All results should have a ray defined
      expect(result).not.toBeNull();
      expect(result.scattered).toBeDefined();
      
      if (result && result.scattered) {
        // Without fuzz, perfect reflection would be (0, 1, 0)
        // With fuzz, it should be perturbed
        const direction = result.scattered.direction;
        
        // Ensure direction is outward-facing
        expect(direction.dot(normal)).toBeGreaterThan(0);
        
        // Check if this is a perfect reflection (very unlikely with fuzz)
        if (Math.abs(direction.x) < 0.001 && 
            Math.abs(direction.y - 1.0) < 0.001 && 
            Math.abs(direction.z) < 0.001) {
          perfectReflections++;
        }
      }
    }
    
    // With fuzz=0.5, nearly all reflections should be perturbed
    expect(perfectReflections).toBeLessThan(numSamples / 10);
  });
  
  // Test absorption (ray reflected beneath surface)
  it('should return null when ray is reflected beneath surface', () => {
    // Arrange
    const albedo = new Color(0.8, 0.6, 0.2);
    const metal = new Metal(albedo, 0.8); // High fuzz to increase chance of beneath-surface reflection
    
    const normal = new Vec3(0, 1, 0);
    const hitRecord: HitRecord = {
      p: new Vec3(0, 0, 0),
      normal: normal,
      t: 1.0,
      frontFace: true,
      material: metal
    };
    
    // Ray nearly parallel to surface (grazing angle)
    const inRay = new Ray(new Vec3(0, 0.1, 0), new Vec3(1, -0.01, 0).unitVector());
    
    // Mock randomInUnitSphere to always return a vector pointing downward
    const originalRandomInUnitSphere = Vec3.randomInUnitSphere;
    Vec3.randomInUnitSphere = () => new Vec3(0, -1, 0);
    
    // Act
    const result = metal.scatter(inRay.origin, inRay.direction, hitRecord);
    
    // Restore original method
    Vec3.randomInUnitSphere = originalRandomInUnitSphere;
    
    // Assert - should be absorbed (null) since fuzz will push reflection below surface
    expect(result).toBeNull();
  });
});

// Add a test for the reflect function in vec3.ts
describe('Vec3 reflect function', () => {
  it('should correctly reflect a vector around a normal', () => {
    // Arrange
    const v = new Vec3(1, -1, 0); // 45-degree angle down
    const n = new Vec3(0, 1, 0);  // Normal pointing up
    
    // Act
    const reflected = v.reflect(n);
    
    // Assert
    // For this setup, the reflection should be 45 degrees up
    expect(reflected.x).toBeCloseTo(1, 5);
    expect(reflected.y).toBeCloseTo(1, 5);
    expect(reflected.z).toBeCloseTo(0, 5);
  });
});
