import { Plane } from '../../src/entities/plane.js';
import { Vec3 } from '../../src/geometry/vec3.js';
import type { Point3 } from '../../src/geometry/vec3.js';
import { Ray } from '../../src/geometry/ray.js';
import { Interval } from '../../src/geometry/interval.js';
import { Lambertian } from '../../src/materials/lambertian.js';

// Mock material for testing
class MockMaterial extends Lambertian {
  constructor() {
    super(new Vec3(1, 1, 1));
  }
}

describe('Plane', () => {
  describe('constructor', () => {
    it('should correctly compute normal, d, and w vectors', () => {
      // Create a plane in the XY plane (normal pointing in +Z direction)
      const q: Point3 = new Vec3(0, 0, 5);
      const u = new Vec3(1, 0, 0);  // X direction
      const v = new Vec3(0, 1, 0);  // Y direction
      const material = new MockMaterial();
      
      const plane = new Plane(q, u, v, material);
      
      // Normal should be unit vector in +Z direction
      expect(plane.normal.x).toBeCloseTo(0);
      expect(plane.normal.y).toBeCloseTo(0);
      expect(plane.normal.z).toBeCloseTo(1);
      
      // d should be the distance from origin to plane along normal
      expect(plane.d).toBeCloseTo(5);
      
      // w should be (u × v) / |u × v|²
      const crossProduct = u.cross(v);
      const expectedW = crossProduct.divide(crossProduct.lengthSquared());
      expect(plane.w.x).toBeCloseTo(expectedW.x);
      expect(plane.w.y).toBeCloseTo(expectedW.y);
      expect(plane.w.z).toBeCloseTo(expectedW.z);
    });

    it('should handle non-axis-aligned planes', () => {
      // Create a tilted plane
      const q: Point3 = new Vec3(1, 1, 1);
      const u = new Vec3(1, 1, 0);
      const v = new Vec3(0, 1, 1);
      const material = new MockMaterial();
      
      const plane = new Plane(q, u, v, material);
      
      // Normal should be unit vector of u × v
      const crossProduct = u.cross(v);
      const expectedNormal = crossProduct.unitVector();
      expect(plane.normal.x).toBeCloseTo(expectedNormal.x);
      expect(plane.normal.y).toBeCloseTo(expectedNormal.y);
      expect(plane.normal.z).toBeCloseTo(expectedNormal.z);
      
      // d should be normal · q
      expect(plane.d).toBeCloseTo(expectedNormal.dot(q));
    });
  });

  describe('intersect method', () => {
    it('should find intersection with XY plane', () => {
      // XY plane at z = 5
      const q: Point3 = new Vec3(0, 0, 5);
      const u = new Vec3(1, 0, 0);
      const v = new Vec3(0, 1, 0);
      const material = new MockMaterial();
      const plane = new Plane(q, u, v, material);
      
      // Ray from origin pointing towards plane
      const ray = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, 1));
      const interval = new Interval(0, Infinity);
      
      const result = plane.intersect(ray, interval);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.t).toBeCloseTo(5);
        expect(result.alpha).toBeCloseTo(0);  // At the reference point q
        expect(result.beta).toBeCloseTo(0);
      }
    });

    it('should return null for parallel rays', () => {
      // XY plane at z = 5
      const q: Point3 = new Vec3(0, 0, 5);
      const u = new Vec3(1, 0, 0);
      const v = new Vec3(0, 1, 0);
      const material = new MockMaterial();
      const plane = new Plane(q, u, v, material);
      
      // Ray parallel to the plane (in XY direction)
      const ray = new Ray(new Vec3(0, 0, 0), new Vec3(1, 1, 0));
      const interval = new Interval(0, Infinity);
      
      const result = plane.intersect(ray, interval);
      expect(result).toBeNull();
    });

    it('should return null for intersection outside interval', () => {
      // XY plane at z = 5
      const q: Point3 = new Vec3(0, 0, 5);
      const u = new Vec3(1, 0, 0);
      const v = new Vec3(0, 1, 0);
      const material = new MockMaterial();
      const plane = new Plane(q, u, v, material);
      
      // Ray from origin pointing towards plane
      const ray = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, 1));
      const interval = new Interval(0, 4); // Interval ends before plane
      
      const result = plane.intersect(ray, interval);
      expect(result).toBeNull();
    });

    it('should calculate correct barycentric coordinates', () => {
      // XY plane at z = 0
      const q: Point3 = new Vec3(0, 0, 0);
      const u = new Vec3(2, 0, 0);  // 2 units in X direction
      const v = new Vec3(0, 3, 0);  // 3 units in Y direction
      const material = new MockMaterial();
      const plane = new Plane(q, u, v, material);
      
      // Ray hitting at (1, 1.5, 0) which should be alpha=0.5, beta=0.5
      const ray = new Ray(new Vec3(1, 1.5, -1), new Vec3(0, 0, 1));
      const interval = new Interval(0, Infinity);
      
      const result = plane.intersect(ray, interval);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.t).toBeCloseTo(1);
        expect(result.alpha).toBeCloseTo(0.5);  // 1/2 along u vector
        expect(result.beta).toBeCloseTo(0.5);   // 1.5/3 along v vector
      }
    });
  });

  describe('hit method', () => {
    it('should return correct hit record for front face', () => {
      // XY plane at z = 5
      const q: Point3 = new Vec3(0, 0, 5);
      const u = new Vec3(1, 0, 0);
      const v = new Vec3(0, 1, 0);
      const material = new MockMaterial();
      const plane = new Plane(q, u, v, material);
      
      // Ray from origin pointing towards plane (front face)
      const ray = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, 1));
      const interval = new Interval(0, Infinity);
      
      const hit = plane.hit(ray, interval);
      expect(hit).not.toBeNull();
      if (hit) {
        expect(hit.t).toBeCloseTo(5);
        expect(hit.p.x).toBeCloseTo(0);
        expect(hit.p.y).toBeCloseTo(0);
        expect(hit.p.z).toBeCloseTo(5);
        expect(hit.normal.x).toBeCloseTo(0);
        expect(hit.normal.y).toBeCloseTo(0);
        expect(hit.normal.z).toBeCloseTo(-1);  // Normal points towards ray origin (sphere convention)
        expect(hit.frontFace).toBe(false);  // Ray direction opposes normal (sphere convention)
        expect(hit.material).toBe(material);
      }
    });

    it('should return correct hit record for back face', () => {
      // XY plane at z = 5
      const q: Point3 = new Vec3(0, 0, 5);
      const u = new Vec3(1, 0, 0);
      const v = new Vec3(0, 1, 0);
      const material = new MockMaterial();
      const plane = new Plane(q, u, v, material);
      
      // Ray from behind plane pointing towards it (back face)
      const ray = new Ray(new Vec3(0, 0, 10), new Vec3(0, 0, -1));
      const interval = new Interval(0, Infinity);
      
      const hit = plane.hit(ray, interval);
      expect(hit).not.toBeNull();
      if (hit) {
        expect(hit.t).toBeCloseTo(5);
        expect(hit.p.x).toBeCloseTo(0);
        expect(hit.p.y).toBeCloseTo(0);
        expect(hit.p.z).toBeCloseTo(5);
        expect(hit.normal.x).toBeCloseTo(0);
        expect(hit.normal.y).toBeCloseTo(0);
        expect(hit.normal.z).toBeCloseTo(1);  // Normal points towards ray origin (sphere convention)
        expect(hit.frontFace).toBe(true);  // Ray direction aligns with normal (sphere convention)
        expect(hit.material).toBe(material);
      }
    });

    it('should return null for parallel rays', () => {
      // XY plane at z = 5
      const q: Point3 = new Vec3(0, 0, 5);
      const u = new Vec3(1, 0, 0);
      const v = new Vec3(0, 1, 0);
      const material = new MockMaterial();
      const plane = new Plane(q, u, v, material);
      
      // Ray parallel to the plane
      const ray = new Ray(new Vec3(0, 0, 0), new Vec3(1, 0, 0));
      const interval = new Interval(0, Infinity);
      
      const hit = plane.hit(ray, interval);
      expect(hit).toBeNull();
    });
  });

  describe('boundingBox method', () => {
    it('should return optimized bounding box for XY plane (Z-aligned normal)', () => {
      // XY plane at z = 5
      const q: Point3 = new Vec3(0, 0, 5);
      const u = new Vec3(1, 0, 0);
      const v = new Vec3(0, 1, 0);
      const material = new MockMaterial();
      const plane = new Plane(q, u, v, material);
      
      const bbox = plane.boundingBox();
      
      // Should be infinite in X and Y, bounded in Z
      expect(bbox.minimum.x).toBe(-Infinity);
      expect(bbox.minimum.y).toBe(-Infinity);
      expect(bbox.minimum.z).toBeCloseTo(5 - 1e-4);
      expect(bbox.maximum.x).toBe(Infinity);
      expect(bbox.maximum.y).toBe(Infinity);
      expect(bbox.maximum.z).toBeCloseTo(5 + 1e-4);
    });

    it('should return optimized bounding box for XZ plane (Y-aligned normal)', () => {
      // XZ plane at y = 3
      const q: Point3 = new Vec3(0, 3, 0);
      const u = new Vec3(1, 0, 0);
      const v = new Vec3(0, 0, 1);
      const material = new MockMaterial();
      const plane = new Plane(q, u, v, material);
      
      const bbox = plane.boundingBox();
      
      // Should be infinite in X and Z, bounded in Y
      expect(bbox.minimum.x).toBe(-Infinity);
      expect(bbox.minimum.y).toBeCloseTo(3 - 1e-4);
      expect(bbox.minimum.z).toBe(-Infinity);
      expect(bbox.maximum.x).toBe(Infinity);
      expect(bbox.maximum.y).toBeCloseTo(3 + 1e-4);
      expect(bbox.maximum.z).toBe(Infinity);
    });

    it('should return optimized bounding box for YZ plane (X-aligned normal)', () => {
      // YZ plane at x = -2
      const q: Point3 = new Vec3(-2, 0, 0);
      const u = new Vec3(0, 1, 0);
      const v = new Vec3(0, 0, 1);
      const material = new MockMaterial();
      const plane = new Plane(q, u, v, material);
      
      const bbox = plane.boundingBox();
      
      // Should be infinite in Y and Z, bounded in X
      expect(bbox.minimum.x).toBeCloseTo(-2 - 1e-4);
      expect(bbox.minimum.y).toBe(-Infinity);
      expect(bbox.minimum.z).toBe(-Infinity);
      expect(bbox.maximum.x).toBeCloseTo(-2 + 1e-4);
      expect(bbox.maximum.y).toBe(Infinity);
      expect(bbox.maximum.z).toBe(Infinity);
    });

    it('should return infinite bounding box for non-axis-aligned plane', () => {
      // Tilted plane
      const q: Point3 = new Vec3(0, 0, 0);
      const u = new Vec3(1, 1, 0);
      const v = new Vec3(0, 1, 1);
      const material = new MockMaterial();
      const plane = new Plane(q, u, v, material);
      
      const bbox = plane.boundingBox();
      
      // Should be infinite in all directions
      expect(bbox.minimum.x).toBe(-Infinity);
      expect(bbox.minimum.y).toBe(-Infinity);
      expect(bbox.minimum.z).toBe(-Infinity);
      expect(bbox.maximum.x).toBe(Infinity);
      expect(bbox.maximum.y).toBe(Infinity);
      expect(bbox.maximum.z).toBe(Infinity);
    });
  });

  describe('edge cases', () => {
    it('should handle degenerate plane (zero area)', () => {
      // Degenerate plane where u and v are parallel
      const q: Point3 = new Vec3(0, 0, 0);
      const u = new Vec3(1, 0, 0);
      const v = new Vec3(2, 0, 0);  // Parallel to u
      const material = new MockMaterial();
      
      // This should not crash, but the normal will be zero
      expect(() => {
        const plane = new Plane(q, u, v, material);
      }).not.toThrow();
    });

    it('should handle very small intersection angles', () => {
      // XY plane at z = 5
      const q: Point3 = new Vec3(0, 0, 5);
      const u = new Vec3(1, 0, 0);
      const v = new Vec3(0, 1, 0);
      const material = new MockMaterial();
      const plane = new Plane(q, u, v, material);
      
      // Ray with very small angle to plane (almost parallel)
      const ray = new Ray(new Vec3(0, 0, 0), new Vec3(0, 1e-6, 1).unitVector());
      const interval = new Interval(0, Infinity);
      
      const hit = plane.hit(ray, interval);
      expect(hit).not.toBeNull();  // Should still intersect
    });

    it('should handle negative t values correctly', () => {
      // XY plane at z = 5
      const q: Point3 = new Vec3(0, 0, 5);
      const u = new Vec3(1, 0, 0);
      const v = new Vec3(0, 1, 0);
      const material = new MockMaterial();
      const plane = new Plane(q, u, v, material);
      
      // Ray starting beyond plane pointing away
      const ray = new Ray(new Vec3(0, 0, 10), new Vec3(0, 0, 1));
      const interval = new Interval(0, Infinity);
      
      const hit = plane.hit(ray, interval);
      expect(hit).toBeNull();  // Intersection is behind ray origin
    });
  });
}); 