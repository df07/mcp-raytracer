import { HittableList } from '../src/hittableList.js';
import { Sphere } from '../src/sphere.js';
import { Ray } from '../src/ray.js';
import { Vec3, Point3 } from '../src/vec3.js';
import { HitRecord, Hittable } from '../src/hittable.js';
import { Interval } from '../src/interval.js'; // Import Interval
import { Lambertian } from '../src/material.js';

describe('HittableList', () => {  
  let list: HittableList;
  const material = new Lambertian(new Vec3(0.8, 0.8, 0.8));
  const sphere1 = new Sphere(new Vec3(0, 0, -1), 0.5, material);
  const sphere2 = new Sphere(new Vec3(0, 100, -5), 10, material); // A different sphere
  const rayTowardsSphere1 = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));
  const rayTowardsSphere2 = new Ray(new Vec3(0, 100, 0), new Vec3(0, 0, -1));
  const tMin = 0.001;
  const tMax = Infinity;
  const fullInterval = new Interval(tMin, tMax); // Create Interval instance

  beforeEach(() => {
    list = new HittableList();
  });

  test('should initialize empty (no hits)', () => {
    // Check that a ray that would hit sphere1 returns null
    expect(list.hit(rayTowardsSphere1, fullInterval)).toBeNull(); // Use Interval
  });

  test('should add objects and allow hits', () => {
    // Add sphere1, check hit
    list.add(sphere1);
    expect(list.hit(rayTowardsSphere1, fullInterval)).not.toBeNull(); // Use Interval
    // Check that sphere2 isn't hit yet
    expect(list.hit(rayTowardsSphere2, fullInterval)).toBeNull(); // Use Interval

    // Add sphere2, check hit
    list.add(sphere2);
    expect(list.hit(rayTowardsSphere1, fullInterval)).not.toBeNull(); // Sphere1 still hittable
    expect(list.hit(rayTowardsSphere2, fullInterval)).not.toBeNull(); // Sphere2 now hittable
  });

  test('should clear objects (no hits)', () => {
    list.add(sphere1);
    expect(list.hit(rayTowardsSphere1, fullInterval)).not.toBeNull(); // Verify it was added
    list.clear();
    expect(list.hit(rayTowardsSphere1, fullInterval)).toBeNull(); // Should be null after clear
  });
  describe('hit', () => {
    const testMaterial = new Lambertian(new Vec3(0.8, 0.8, 0.8));
    const sphere1Hit = new Sphere(new Vec3(0, 0, -1), 0.5, testMaterial); // Hits at t=0.5, 1.5
    const sphere2Hit = new Sphere(new Vec3(0, 0, -3), 0.5, testMaterial); // Hits at t=2.5, 3.5
    const rayFromOrigin = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));
    // tMin/tMax defined in outer scope
    // fullInterval defined in outer scope

    test('should return null for an empty list', () => {
      const hitRec = list.hit(rayFromOrigin, fullInterval); // Use Interval
      expect(hitRec).toBeNull();
    });

    test('should return null if ray misses all objects', () => {
      list.add(sphere1Hit);
      list.add(sphere2Hit);
      const missingRay = new Ray(new Vec3(5, 5, 0), new Vec3(0, 0, -1));
      const hitRec = list.hit(missingRay, fullInterval); // Use Interval
      expect(hitRec).toBeNull();
    });

    test('should return hit record for a single object hit', () => {
      list.add(sphere1Hit);
      const hitRec = list.hit(rayFromOrigin, fullInterval); // Use Interval
      expect(hitRec).not.toBeNull();
      expect(hitRec?.t).toBeCloseTo(0.5);
    });

    test('should return the closest hit record when multiple objects hit', () => {
      list.add(sphere1Hit); // Closer, hits at t=0.5
      list.add(sphere2Hit); // Farther, hits at t=2.5
      const hitRec = list.hit(rayFromOrigin, fullInterval); // Use Interval
      expect(hitRec).not.toBeNull();
      expect(hitRec?.t).toBeCloseTo(0.5);
      expect(hitRec?.p.z).toBeCloseTo(-0.5);
    });

    test('should return the farther hit if closer object is outside tMax range (via closestSoFar)', () => {
      list.add(sphere1Hit); // Hits at t=0.5
      list.add(sphere2Hit); // Hits at t=2.5
      // Use a tMax that allows hitting sphere1 but not sphere2 initially
      const hitRec = list.hit(rayFromOrigin, new Interval(tMin, 1.0)); // Use Interval
      // Sphere1 hits (t=0.5), closestSoFar becomes 0.5.
      // Sphere2 is checked with tMax=0.5 and is missed.
      expect(hitRec).not.toBeNull();
      expect(hitRec?.t).toBeCloseTo(0.5); // Only sphere1 is hit within effective range
    });

    test('should return closer object\'s farther hit if it\'s closer than others', () => {
      list.add(sphere1Hit); // Hits at t=0.5, 1.5
      list.add(sphere2Hit); // Hits at t=2.5, 3.5
      // tMin=1.0 excludes sphere1Hit's first hit (t=0.5)
      const hitRec = list.hit(rayFromOrigin, new Interval(1.0, tMax)); // Use Interval
      expect(hitRec).not.toBeNull();
      // Expect the second hit (t=1.5) on sphere1Hit because it's valid and closer than sphere2Hit's first valid hit (t=2.5)
      expect(hitRec?.t).toBeCloseTo(1.5);
      expect(hitRec?.p.z).toBeCloseTo(-1.5);
    });

    test('should update tMax correctly (closestSoFar) regardless of add order', () => {
        list.add(sphere2Hit); // Add farther sphere first (t=2.5)
        list.add(sphere1Hit); // Add closer sphere second (t=0.5)
        const hitRec = list.hit(rayFromOrigin, fullInterval); // Use Interval
        // Sphere2 checked first, hitRec gets t=2.5, closestSoFar=2.5
        // Sphere1 checked next with tMax=2.5, hits at t=0.5
        // hitRec updated to t=0.5, closestSoFar=0.5
        expect(hitRec).not.toBeNull();
        expect(hitRec?.t).toBeCloseTo(0.5);
        expect(hitRec?.p.z).toBeCloseTo(-0.5);
    });

    test('should return null if all hits are outside [tMin, tMax]', () => {
      list.add(sphere1Hit); // Hits at t=0.5, 1.5
      list.add(sphere2Hit); // Hits at t=2.5, 3.5
      const hitRec = list.hit(rayFromOrigin, new Interval(1.6, 2.4)); // Use Interval, range excludes all hits
      expect(hitRec).toBeNull();
    });
  });
});