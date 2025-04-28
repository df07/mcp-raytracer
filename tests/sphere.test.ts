import { Sphere } from '../src/sphere.js';
import { vec3, point3 } from '../src/vec3.js';
import { ray } from '../src/ray.js';
import { HitRecord } from '../src/hittable.js';

describe('Sphere', () => {
  const center = new vec3(0, 0, -1);
  const radius = 0.5;
  const sphere = new Sphere(center, radius);
  const tMin = 0.001;
  const tMax = Infinity;

  test('should hit sphere directly in front', () => {
    const r = new ray(new vec3(0, 0, 0), new vec3(0, 0, -1));
    const rec = new HitRecord();
    const hit = sphere.hit(r, tMin, tMax, rec);
    expect(hit).toBe(true);
    expect(rec.t).toBeCloseTo(0.5);
    expect(rec.p.x()).toBeCloseTo(0);
    expect(rec.p.y()).toBeCloseTo(0);
    expect(rec.p.z()).toBeCloseTo(-0.5);
    expect(rec.normal.x()).toBeCloseTo(0);
    expect(rec.normal.y()).toBeCloseTo(0);
    expect(rec.normal.z()).toBeCloseTo(1);
    expect(rec.frontFace).toBe(true);
  });

  test('should miss sphere', () => {
    const r = new ray(new vec3(0, 0, 0), new vec3(1, 1, 0));
    const rec = new HitRecord();
    const hit = sphere.hit(r, tMin, tMax, rec);
    expect(hit).toBe(false);
  });

  test('should miss sphere when ray points away', () => {
    const r = new ray(new vec3(0, 0, 0), new vec3(0, 0, 1));
    const rec = new HitRecord();
    const hit = sphere.hit(r, tMin, tMax, rec);
    expect(hit).toBe(false);
  });

  test('should hit sphere tangentially', () => {
    const r = new ray(new vec3(0, radius, 0), new vec3(0, 0, -1));
    const rec = new HitRecord();
    const hit = sphere.hit(r, tMin, tMax, rec);
    expect(hit).toBe(true);
    expect(rec.t).toBeCloseTo(1.0);
    expect(rec.p.z()).toBeCloseTo(-1.0);
  });

  test('should return closest hit point when ray starts inside', () => {
    const r = new ray(center, new vec3(0, 0, -1));
    const rec = new HitRecord();
    const hit = sphere.hit(r, tMin, tMax, rec);
    expect(hit).toBe(true);
    expect(rec.t).toBeCloseTo(0.5);
    expect(rec.p.z()).toBeCloseTo(-1.5);
    expect(rec.frontFace).toBe(false);
    expect(rec.normal.z()).toBeCloseTo(1);
  });

  test('should find farther hit when closest intersection is before tMin', () => {
    const r = new ray(new vec3(0, 0, 0), new vec3(0, 0, -1));
    const rec = new HitRecord();
    const hit = sphere.hit(r, 0.6, tMax, rec);
    expect(hit).toBe(true);
    expect(rec.t).toBeCloseTo(1.5);
    expect(rec.p.z()).toBeCloseTo(-1.5);
  });

  test('should not hit when intersection is after tMax', () => {
    const r = new ray(new vec3(0, 0, 0), new vec3(0, 0, -1));
    const rec = new HitRecord();
    const hit = sphere.hit(r, tMin, 0.4, rec);
    expect(hit).toBe(false);
  });

  test('should not hit when both intersections are outside [tMin, tMax]', () => {
    const r = new ray(new vec3(0, 0, 0), new vec3(0, 0, -1));
    const rec = new HitRecord();
    const hit = sphere.hit(r, 0.6, 1.4, rec);
    expect(hit).toBe(false);
  });

  test('should handle ray hitting edge-on', () => {
    const r = new ray(new vec3(radius, 0, 0), new vec3(0, 0, -1));
    const rec = new HitRecord();
    const hit = sphere.hit(r, tMin, tMax, rec);
    expect(hit).toBe(true);
    expect(rec.t).toBeCloseTo(1.0);
  });

  test('should handle offset ray hitting', () => {
    const r = new ray(new vec3(0.1, 0.1, 0), new vec3(0, 0, -1));
    const rec = new HitRecord();
    const hit = sphere.hit(r, tMin, tMax, rec);
    const expected_t = 1 - Math.sqrt(radius*radius - (0.1*0.1 + 0.1*0.1));
    expect(hit).toBe(true);
    expect(rec.t).toBeCloseTo(expected_t, 4);
  });
}); 