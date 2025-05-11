import { BVHNode } from '../src/bvh.js';
import { Hittable } from '../src/hittable.js';
import { HittableList } from '../src/hittableList.js';
import { Sphere } from '../src/sphere.js';
import { Ray } from '../src/ray.js';
import { Interval } from '../src/interval.js';
import { Vec3 } from '../src/vec3.js';
import { Lambertian } from '../src/materials/lambertian.js';

describe('BVHNode', () => {
  // Create a simple material for testing
  const material = new Lambertian(new Vec3(0.5, 0.5, 0.5));
  
  // Create a few spheres
  const spheres: Hittable[] = [
    new Sphere(new Vec3(0, 0, -1), 0.5, material),     // Middle sphere
    new Sphere(new Vec3(-1, 0, -1), 0.5, material),    // Left sphere
    new Sphere(new Vec3(1, 0, -1), 0.5, material),     // Right sphere
    new Sphere(new Vec3(0, -100.5, -1), 100, material) // Ground sphere
  ];
  
  // Create more spheres for testing the leaf node optimization
  const manySmallSpheres: Hittable[] = [];
  for (let i = 0; i < 10; i++) {
    manySmallSpheres.push(
      new Sphere(new Vec3(i-5, 0, -5), 0.3, material)
    );
  }
  
  describe('construction', () => {
    it('should create a BVH from a list of hittables', () => {
      // Create a BVH from the spheres
      const bvh = BVHNode.fromList(spheres);
      
      // Verify the BVH has a valid bounding box
      const box = bvh.boundingBox();
      expect(box).toBeDefined();
      
      // The bounding box should contain all the spheres
      // Left-most point should be left sphere - radius
      expect(box.minimum.x).toBeLessThanOrEqual(-1.5);
      
      // Right-most point should be right sphere + radius
      expect(box.maximum.x).toBeGreaterThanOrEqual(1.5);
      
      // Bottom-most point should be ground sphere - radius
      expect(box.minimum.y).toBeLessThanOrEqual(-100.5 - 100);
    });
  });
  
  describe('hit method', () => {
    it('should detect ray intersection with objects in BVH', () => {
      // Create a BVH from the spheres
      const bvh = BVHNode.fromList(spheres);
      
      // Create a ray that should hit the middle sphere
      const ray = new Ray(
        new Vec3(0, 0, 0),     // Origin
        new Vec3(0, 0, -1)     // Direction toward middle sphere
      );
      
      // Check if the ray hits anything in the BVH
      const hit = bvh.hit(ray, new Interval(0.1, 100));
      
      // Should hit the middle sphere
      expect(hit).not.toBeNull();
      if (hit) {
        expect(hit.t).toBeCloseTo(0.5); // Sphere is at z = -1 with radius 0.5
      }
    });
    
    it('should not detect intersection when ray misses all objects', () => {
      // Create a BVH from the spheres
      const bvh = BVHNode.fromList(spheres);
      
      // Create a ray that misses all spheres
      const ray = new Ray(
        new Vec3(0, 5, 0),     // Origin above all spheres
        new Vec3(0, 1, 0)      // Direction away from all spheres
      );
      
      // Check if the ray hits anything in the BVH
      const hit = bvh.hit(ray, new Interval(0.1, 100));
      
      // Should not hit anything
      expect(hit).toBeNull();
    });
    
    it('should give the same results as checking each object directly', () => {
      // Create a BVH from the spheres
      const bvh = BVHNode.fromList(spheres);
      
      // Create a standard list for comparison
      const list = new HittableList();
      for (const sphere of spheres) {
        list.add(sphere);
      }
      
      // Create a ray that should hit something
      const ray = new Ray(
        new Vec3(0, 0, 0),
        new Vec3(0.5, -0.5, -1).unitVector()
      );
      
      // Check both BVH and direct list
      const interval = new Interval(0.1, 100);
      const hitBVH = bvh.hit(ray, interval);
      const hitList = list.hit(ray, interval);
      
      // Both should have the same result (either both hit or both miss)
      if (hitBVH === null) {
        expect(hitList).toBeNull();
      } else {
        expect(hitList).not.toBeNull();
        // If both hit, they should hit the same object at the same distance
        if (hitList) {
          expect(hitBVH.t).toBeCloseTo(hitList.t);
        }
      }
    });
  });
  
  describe('leaf node optimization', () => {
    it('should correctly handle leaf nodes with multiple objects', () => {
      // Set MAX_LEAF_OBJECTS to a value that would trigger leaf node creation
      // This is just for testing - the actual BVHNode has this as a private static readonly field
      
      // Create a BVH from the spheres - with small object count, it might create leaf nodes
      const bvh = BVHNode.fromList(manySmallSpheres);
      
      // Create a ray that should hit one of the spheres
      const ray = new Ray(
        new Vec3(0, 0, 0),     // Origin
        new Vec3(0, 0, -1)     // Direction toward -z
      );
      
      // Check if the ray hits anything in the BVH
      const hit = bvh.hit(ray, new Interval(0.1, 100));
      
      // Should hit one of the spheres
      expect(hit).not.toBeNull();
      
      // Create a standard list for comparison
      const list = new HittableList();
      for (const sphere of manySmallSpheres) {
        list.add(sphere);
      }
      
      // Check that BVH gives same result as direct list
      const hitList = list.hit(ray, new Interval(0.1, 100));
      
      // Results should be the same
      if (hit && hitList) {
        expect(hit.t).toBeCloseTo(hitList.t);
      } else {
        expect(hit).toEqual(hitList); // Both should be null or both should be defined
      }
    });
  });
});
