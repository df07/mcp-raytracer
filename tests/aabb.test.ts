import { AABB } from '../src/aabb.js';
import { Ray } from '../src/ray.js';
import { Vec3 } from '../src/vec3.js';
import { Interval } from '../src/interval.js';

describe('AABB', () => {
  describe('hit method', () => {
    it('should detect ray intersection with box', () => {
      // Create a box centered at origin with side length 2
      const box = new AABB(
        new Vec3(-1, -1, -1),
        new Vec3(1, 1, 1)
      );
      
      // Ray from outside the box pointing toward it
      const ray = new Ray(
        new Vec3(0, 0, -5),  // Origin outside the box
        new Vec3(0, 0, 1)    // Direction toward the box
      );
      
      // Ray interval from origin to far away
      const interval = new Interval(0.1, 100);
      
      // The ray should hit the box
      expect(box.hit(ray, interval)).toBe(true);
    });
    
    it('should not detect intersection when ray misses box', () => {
      // Create a box centered at origin with side length 2
      const box = new AABB(
        new Vec3(-1, -1, -1),
        new Vec3(1, 1, 1)
      );
      
      // Ray that passes to the side of the box
      const ray = new Ray(
        new Vec3(5, 0, 0),   // Origin outside the box
        new Vec3(0, 0, 1)    // Direction parallel to box but not intersecting
      );
      
      // Ray interval from origin to far away
      const interval = new Interval(0.1, 100);
      
      // The ray should not hit the box
      expect(box.hit(ray, interval)).toBe(false);
    });
    
    it('should not detect intersection when ray interval is too short', () => {
      // Create a box centered at origin with side length 2
      const box = new AABB(
        new Vec3(-1, -1, -1),
        new Vec3(1, 1, 1)
      );
      
      // Ray from outside the box pointing toward it
      const ray = new Ray(
        new Vec3(0, 0, -5),  // Origin outside the box
        new Vec3(0, 0, 1)    // Direction toward the box
      );
      
      // Ray interval that ends before the box
      const interval = new Interval(0.1, 3);
      
      // The ray should not hit the box because the interval ends before reaching it
      expect(box.hit(ray, interval)).toBe(false);
    });
  });
  
  describe('surroundingBox static method', () => {
    it('should create a box that contains two input boxes', () => {
      // First box
      const box1 = new AABB(
        new Vec3(-1, -1, -1),
        new Vec3(1, 1, 1)
      );
      
      // Second box offset from the first
      const box2 = new AABB(
        new Vec3(0, 0, 0),
        new Vec3(2, 2, 2)
      );
      
      // Surrounding box should contain both
      const surrounding = AABB.surroundingBox(box1, box2);
      
      // Check minimum and maximum points
      expect(surrounding.minimum.x).toBe(-1);
      expect(surrounding.minimum.y).toBe(-1);
      expect(surrounding.minimum.z).toBe(-1);
      expect(surrounding.maximum.x).toBe(2);
      expect(surrounding.maximum.y).toBe(2);
      expect(surrounding.maximum.z).toBe(2);
    });
  });
  
  describe('empty static method', () => {
    it('should create an empty bounding box', () => {
      const emptyBox = AABB.empty();
      
      // Check that minimum coordinates are positive infinity
      expect(emptyBox.minimum.x).toBe(Infinity);
      expect(emptyBox.minimum.y).toBe(Infinity);
      expect(emptyBox.minimum.z).toBe(Infinity);
      
      // Check that maximum coordinates are negative infinity
      expect(emptyBox.maximum.x).toBe(-Infinity);
      expect(emptyBox.maximum.y).toBe(-Infinity);
      expect(emptyBox.maximum.z).toBe(-Infinity);
    });
  });
});
