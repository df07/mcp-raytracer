import { HittableList } from '../src/hittableList.js';
import { Sphere } from '../src/sphere.js';
import { Ray } from '../src/ray.js';
import { Vec3, Point3 } from '../src/vec3.js';
import { HitRecord, Hittable } from '../src/hittable.js';

describe('HittableList', () => {
  let list: HittableList;
  const sphere1 = new Sphere(new Vec3(0, 0, -1), 0.5);
  const sphere2 = new Sphere(new Vec3(0, 100, -5), 10);
  const rayTowardsSphere1 = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));
  const rayTowardsSphere2 = new Ray(new Vec3(0, 100, 0), new Vec3(0, 0, -1));
  const tMin = 0.001;
  const tMax = Infinity;

  beforeEach(() => {
    list = new HittableList();
  });

  test('should initialize empty (no hits)', () => {
    expect(list.hit(rayTowardsSphere1, tMin, tMax)).toBeNull();
  });

  test('should add objects and allow hits', () => {
    list.add(sphere1);
    expect(list.hit(rayTowardsSphere1, tMin, tMax)).not.toBeNull();
    expect(list.hit(rayTowardsSphere2, tMin, tMax)).toBeNull();
    list.add(sphere2);
    expect(list.hit(rayTowardsSphere1, tMin, tMax)).not.toBeNull();
    expect(list.hit(rayTowardsSphere2, tMin, tMax)).not.toBeNull();
  });

  test('should clear objects (no hits)', () => {
    list.add(sphere1);
    expect(list.hit(rayTowardsSphere1, tMin, tMax)).not.toBeNull();
    list.clear();
    expect(list.hit(rayTowardsSphere1, tMin, tMax)).toBeNull();
  });

  describe('hit', () => {
    const sphere1Hit = new Sphere(new Vec3(0, 0, -1), 0.5);
    const sphere2Hit = new Sphere(new Vec3(0, 0, -3), 0.5);
    const rayFromOrigin = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));

    test('should return null for an empty list', () => {
      const hitRec = list.hit(rayFromOrigin, tMin, tMax);
      expect(hitRec).toBeNull();
    });

    test('should return null if ray misses all objects', () => {
      list.add(sphere1Hit);
      list.add(sphere2Hit);
      const missingRay = new Ray(new Vec3(5, 5, 0), new Vec3(0, 0, -1));
      const hitRec = list.hit(missingRay, tMin, tMax);
      expect(hitRec).toBeNull();
    });

    test('should return hit record for a single object hit', () => {
      list.add(sphere1Hit);
      const hitRec = list.hit(rayFromOrigin, tMin, tMax);
      expect(hitRec).not.toBeNull();
      expect(hitRec?.t).toBeCloseTo(0.5);
    });

    test('should return the closest hit record when multiple objects hit', () => {
      list.add(sphere1Hit);
      list.add(sphere2Hit);
      const hitRec = list.hit(rayFromOrigin, tMin, tMax);
      expect(hitRec).not.toBeNull();
      expect(hitRec?.t).toBeCloseTo(0.5);
      expect(hitRec?.p.z).toBeCloseTo(-0.5);
    });

    test('should return the farther hit if closer object is outside tMax range (via closestSoFar)', () => {
      list.add(sphere1Hit);
      list.add(sphere2Hit);
      const hitRec = list.hit(rayFromOrigin, tMin, 1.0);
      expect(hitRec).not.toBeNull();
      expect(hitRec?.t).toBeCloseTo(0.5);
    });
    
    test('should return closer object\'s farther hit if it\'s closer than others', () => {
      list.add(sphere1Hit);
      list.add(sphere2Hit);
      const hitRec = list.hit(rayFromOrigin, 1.0, tMax);
      expect(hitRec).not.toBeNull();
      expect(hitRec?.t).toBeCloseTo(1.5);
      expect(hitRec?.p.z).toBeCloseTo(-1.5);
    });
        
    test('should update tMax correctly (closestSoFar) regardless of add order', () => {
        list.add(sphere2Hit);
        list.add(sphere1Hit);
        const hitRec = list.hit(rayFromOrigin, tMin, tMax);
        expect(hitRec).not.toBeNull();
        expect(hitRec?.t).toBeCloseTo(0.5);
        expect(hitRec?.p.z).toBeCloseTo(-0.5);
    });

    test('should return null if all hits are outside [tMin, tMax]', () => {
      list.add(sphere1Hit);
      list.add(sphere2Hit);
      const hitRec = list.hit(rayFromOrigin, 1.6, 2.4);
      expect(hitRec).toBeNull();
    });
  });
}); 