/* Specs: metal.md */

import { describe, it, expect } from '@jest/globals';
import { Metal } from '../../src/materials/metal.js';
import { Vec3 } from '../../src/vec3.js';
import { Ray } from '../../src/ray.js';
import { HitRecord } from '../../src/hittable.js';

describe('Metal Material', () => {
  // Test Metal constructor
  it('should create a Metal material with proper albedo and fuzz', () => {
    // Arrange
    const albedo = new Vec3(0.8, 0.6, 0.2);
    
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

  // Test Metal scatter method
  it('should scatter rays correctly when hitting surface', () => {
    // Arrange
    const albedo = new Vec3(0.8, 0.6, 0.2);
    const metal = new Metal(albedo, 0.0); // Perfect reflection
    
    const origin = new Vec3(0, 0, 0);
    const direction = new Vec3(1, -1, 0).unitVector(); // 45-degree angle downward
    const ray = new Ray(origin, direction);
    
    const p = new Vec3(1, -1, 0); // Hit point
    const normal = new Vec3(0, 1, 0); // Straight up normal

    const hitRecord: HitRecord = {
      p: p,
      normal: normal,
      t: 1.414, // √2
      frontFace: true,
      material: metal
    };

    // Act
    const scatterResult = metal.scatter(ray, hitRecord);
    
    // Assert
    expect(scatterResult).not.toBeNull();
    if (scatterResult) {
      // For perfect reflection with this 45-degree angle and upward normal,
      // the reflection should be 45 degrees upward
      const expectedDirection = new Vec3(1, 1, 0).unitVector();
      
      // Check that scattered ray starts at hit point
      expect(scatterResult.scattered.origin).toEqual(hitRecord.p);
      
      // Check reflection direction (allow small floating-point differences)
      const dotProduct = scatterResult.scattered.direction.dot(expectedDirection);
      expect(dotProduct).toBeCloseTo(1.0, 5); // vectors are parallel if dot product is 1
      
      // Check attenuation matches albedo
      expect(scatterResult.attenuation).toEqual(albedo);
    }
  });  // Test internal behavior - reflection into the surface calculation
  it('should correctly detect when reflection goes into the surface', () => {
    // Create a simple mock implementation to test the core reflection logic
    class MockMetal extends Metal {
      testReflectionDirection(inDir: Vec3, normal: Vec3): boolean {
        const reflected = inDir.unitVector().reflect(normal);
        // Return true if the reflection is valid (dot product > 0)
        return reflected.dot(normal) > 0;
      }
    }

    // Create test instances
    const metal = new MockMetal(new Vec3(1, 1, 1));

    // Case 1: Ray reflects properly (should return true)
    const validIn = new Vec3(0, -1, 0); // Straight down
    const normalUp = new Vec3(0, 1, 0); // Straight up
    expect(metal.testReflectionDirection(validIn, normalUp)).toBe(true);

    // Case 2: Ray reflects into surface (should return false)
    const invalidIn = new Vec3(0, 1, 0); // Straight up
    expect(metal.testReflectionDirection(invalidIn, normalUp)).toBe(false);
  });
  
  // Test absorption when ray reflects into the surface
  it('should return null when ray reflects into the surface', () => {
    // Arrange
    const albedo = new Vec3(0.8, 0.6, 0.2);
    const metal = new Metal(albedo, 0.0); // Perfect reflection
    
    // Use a case we know should fail (ray coming from same direction as normal)
    const origin = new Vec3(0, 0, 0);
    const direction = new Vec3(0, 1, 0); // Going straight up
    const ray = new Ray(origin, direction);
    
    const p = new Vec3(0, 1, 0); // Hit point
    const normal = new Vec3(0, 1, 0); // Normal pointing up

    const hitRecord: HitRecord = {
      p: p,
      normal: normal,
      t: 1.0,
      frontFace: true,
      material: metal
    };

    // Act
    const scatterResult = metal.scatter(ray, hitRecord);
    
    // Assert
    expect(scatterResult).toBeNull(); // Ray should be absorbed
  });

  // Test fuzzy reflection
  it('should create fuzzy reflections when fuzz > 0', () => {
    // Arrange
    const albedo = new Vec3(0.8, 0.6, 0.2);
    const fuzz = 0.5;
    const metal = new Metal(albedo, fuzz);
    
    const origin = new Vec3(0, 0, 0);
    const direction = new Vec3(0, -1, 0); // Straight down
    const ray = new Ray(origin, direction);
    
    const p = new Vec3(0, -1, 0); // Hit point
    const normal = new Vec3(0, 1, 0); // Straight up normal

    const hitRecord: HitRecord = {
      p: p,
      normal: normal,
      t: 1.0,
      frontFace: true,
      material: metal
    };

    // Act - Run multiple scatter calculations to test fuzzy behavior
    const results: Ray[] = [];
    for (let i = 0; i < 10; i++) {
      const scatterResult = metal.scatter(ray, hitRecord);
      if (scatterResult) {
        results.push(scatterResult.scattered);
      }
    }
    
    // Assert
    // Perfect reflection would be straight up (0, 1, 0)
    // With fuzz, we should get variation but still generally upward
    
    // Check that we got some results
    expect(results.length).toBeGreaterThan(0);
    
    // Check all scattered rays start from hit point
    for (const scattered of results) {
      expect(scattered.origin).toEqual(hitRecord.p);
    }
    
    // Check that directions vary (not all the same) if we have multiple results
    if (results.length > 1) {
      let allSame = true;
      const firstDir = results[0].direction;
      
      for (let i = 1; i < results.length; i++) {
        if (!results[i].direction.equals?.(firstDir) && 
            Math.abs(results[i].direction.dot(firstDir) - 1) > 1e-6) {
          allSame = false;
          break;
        }
      }
      
      expect(allSame).toBe(false); // With fuzz, directions should vary
    }
    
    // All scattered rays should have y > 0 (upward) because they shouldn't reflect downward
    for (const scattered of results) {
      expect(scattered.direction.y).toBeGreaterThan(0);
    }
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
