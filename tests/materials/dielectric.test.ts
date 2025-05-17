import { Dielectric } from '../../src/materials/dielectric.js';
import { HitRecord } from '../../src/geometry/hittable.js';
import { Ray } from '../../src/geometry/ray.js';
import { Vec3 } from '../../src/geometry/vec3.js';

describe('Dielectric Material', () => {
  // Set up common test variables
  const indexOfRefraction = Dielectric.GLASS_IOR; // Glass
  const dielectric = new Dielectric(indexOfRefraction);
  
  test('constructor sets indexOfRefraction correctly', () => {
    expect(dielectric.indexOfRefraction).toBe(indexOfRefraction);
  });
  
  test('scatter should always produce a non-null result', () => {
    // Dielectric materials should always scatter (either reflect or refract)
    const ray = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));
    const hitRecord: HitRecord = {
      t: 1.0,
      p: new Vec3(0, 0, -1),
      normal: new Vec3(0, 0, 1),
      frontFace: true,
      material: dielectric
    };
    
    const scatterResult = dielectric.scatter(ray, hitRecord);
    
    // Check that scatter always produces a result
    expect(scatterResult).not.toBeNull();
    
    // Check that attenuation is white (1,1,1) for clear glass
    expect(scatterResult!.attenuation.x).toBeCloseTo(1.0);
    expect(scatterResult!.attenuation.y).toBeCloseTo(1.0);
    expect(scatterResult!.attenuation.z).toBeCloseTo(1.0);
    
    // Check that scattered ray starts at hit point
    expect(scatterResult!.scattered.origin.equals(hitRecord.p)).toBeTruthy();
  });
  
  test('scatter produces results for both entering and exiting rays', () => {
    // Ray entering the material
    const rayIn = new Ray(new Vec3(0, 0, 1), new Vec3(0, 0, -1));
    const hitRecordIn: HitRecord = {
      t: 1.0,
      p: new Vec3(0, 0, 0),
      normal: new Vec3(0, 0, 1),
      frontFace: true,
      material: dielectric
    };
    
    // Ray exiting the material
    const rayOut = new Ray(new Vec3(0, 0, -1), new Vec3(0, 0, 1));
    const hitRecordOut: HitRecord = {
      t: 1.0,
      p: new Vec3(0, 0, 0),
      normal: new Vec3(0, 0, 1),
      frontFace: false,
      material: dielectric
    };
    
    const scatterResultIn = dielectric.scatter(rayIn, hitRecordIn);
    const scatterResultOut = dielectric.scatter(rayOut, hitRecordOut);
    
    // Both should produce valid results
    expect(scatterResultIn).not.toBeNull();
    expect(scatterResultOut).not.toBeNull();
    
    // Verify that the directions are valid (non-zero)
    expect(scatterResultIn!.scattered.direction.lengthSquared()).toBeGreaterThan(0);
    expect(scatterResultOut!.scattered.direction.lengthSquared()).toBeGreaterThan(0);
  });

  test('handles total internal reflection', () => {
    // Create a high-index material (like diamond)
    const highIndexMaterial = new Dielectric(2.4);
    
    // Set up a ray exiting the material at a steep angle (likely to cause total internal reflection)
    // We need a grazing angle where sin(θ) > 1/n, which causes total internal reflection
    const grazeDirection = new Vec3(0.9, 0.1, 0.0).unitVector();
    const rayExiting = new Ray(new Vec3(0, 0, 0), grazeDirection);
    
    const hitRecord: HitRecord = {
      t: 1.0,
      p: new Vec3(1, 0, 0),
      normal: new Vec3(-1, 0, 0), // Normal pointing opposite to ray
      frontFace: false, // Ray is exiting
      material: highIndexMaterial
    };
    
    // We can't mock Math.random easily, so we'll just check the result
    const scatterResult = highIndexMaterial.scatter(rayExiting, hitRecord);
    
    // Should always produce a result
    expect(scatterResult).not.toBeNull();
    
    // Verify the scattered ray has a valid direction
    expect(scatterResult!.scattered.direction.lengthSquared()).toBeGreaterThan(0);
  });
  
  test('uses Schlick approximation for reflectance at shallow angles', () => {
    // Create a private test instance with the reflectance method exposed for testing
    class TestDielectric extends Dielectric {
      public testReflectance(cosine: number, refIdx: number): number {
        return this['reflectance'](cosine, refIdx);
      }
    }
    
    const testMaterial = new TestDielectric(1.5);
    
    // At perpendicular incidence (cosine = 1.0), reflectance should be low
    const perpendicularReflectance = testMaterial.testReflectance(1.0, 1/1.5);
    
    // At grazing angle (cosine close to 0), reflectance should be high
    const grazingReflectance = testMaterial.testReflectance(0.1, 1/1.5);
    
    // Verify that reflectance increases as the angle becomes more grazing
    expect(grazingReflectance).toBeGreaterThan(perpendicularReflectance);
    
    // Verify specific reflectance values based on Schlick's formula
    // At perpendicular incidence with n1=1.0, n2=1.5:
    // r0 = ((1-1/1.5)/(1+1/1.5))² ≈ 0.04
    expect(perpendicularReflectance).toBeCloseTo(0.04, 1);
    
    // At grazing angle, should approach 1.0
    expect(grazingReflectance).toBeGreaterThan(0.5);
  });
}); 