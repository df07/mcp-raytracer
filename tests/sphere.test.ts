import { Sphere } from '../src/sphere.js';
import { Vec3, Point3 } from '../src/vec3.js';
import { Ray } from '../src/ray.js';

describe('Sphere', () => {
  const center = new Vec3(0, 0, -1);
  const radius = 0.5;
  const sphere = new Sphere(center, radius);
  const tMin = 0.001;
  const tMax = Infinity;

  test('should hit sphere directly in front', () => {
    const r = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));
    const hitRec = sphere.hit(r, tMin, tMax);
    expect(hitRec).not.toBeNull();
    if (!hitRec) return;

    expect(hitRec.t).toBeCloseTo(0.5);
    expect(hitRec.p.x).toBeCloseTo(0);
    expect(hitRec.p.y).toBeCloseTo(0);
    expect(hitRec.p.z).toBeCloseTo(-0.5);
    expect(hitRec.normal.x).toBeCloseTo(0);
    expect(hitRec.normal.y).toBeCloseTo(0);
    expect(hitRec.normal.z).toBeCloseTo(1);
    expect(hitRec.frontFace).toBe(true);
  });

  test('should miss sphere', () => {
    const r = new Ray(new Vec3(0, 0, 0), new Vec3(1, 1, 0));
    const hitRec = sphere.hit(r, tMin, tMax);
    expect(hitRec).toBeNull();
  });

  test('should miss sphere when ray points away', () => {
    const r = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, 1));
    const hitRec = sphere.hit(r, tMin, tMax);
    expect(hitRec).toBeNull();
  });

  test('should hit sphere tangentially', () => {
    const r = new Ray(new Vec3(0, radius, 0), new Vec3(0, 0, -1));
    const hitRec = sphere.hit(r, tMin, tMax);
    expect(hitRec).not.toBeNull();
    if (!hitRec) return;

    expect(hitRec.t).toBeCloseTo(1.0);
    expect(hitRec.p.z).toBeCloseTo(-1.0);
  });

  test('should return closest hit point when ray starts inside', () => {
    const r = new Ray(center, new Vec3(0, 0, -1));
    const hitRec = sphere.hit(r, tMin, tMax);
    expect(hitRec).not.toBeNull();
    if (!hitRec) return;

    expect(hitRec.t).toBeCloseTo(0.5);
    expect(hitRec.p.z).toBeCloseTo(-1.5);
    expect(hitRec.frontFace).toBe(false);
    expect(hitRec.normal.z).toBeCloseTo(1);
  });

  test('should find farther hit when closest intersection is before tMin', () => {
    const r = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));
    const hitRec = sphere.hit(r, 0.6, tMax);
    expect(hitRec).not.toBeNull();
    if (!hitRec) return;

    expect(hitRec.t).toBeCloseTo(1.5);
    expect(hitRec.p.z).toBeCloseTo(-1.5);
  });

  test('should not hit when intersection is after tMax', () => {
    const r = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));
    const hitRec = sphere.hit(r, tMin, 0.4);
    expect(hitRec).toBeNull();
  });

  test('should not hit when both intersections are outside [tMin, tMax]', () => {
    const r = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));
    const hitRec = sphere.hit(r, 0.6, 1.4);
    expect(hitRec).toBeNull();
  });

  test('should handle ray hitting edge-on', () => {
    const r = new Ray(new Vec3(radius, 0, 0), new Vec3(0, 0, -1));
    const hitRec = sphere.hit(r, tMin, tMax);
    expect(hitRec).not.toBeNull();
    if (!hitRec) return;

    expect(hitRec.t).toBeCloseTo(1.0);
  });

  test('should handle offset ray hitting', () => {
    const r = new Ray(new Vec3(0.1, 0.1, 0), new Vec3(0, 0, -1));
    const hitRec = sphere.hit(r, tMin, tMax);
    expect(hitRec).not.toBeNull();
    if (!hitRec) return;

    const expected_t = 1 - Math.sqrt(radius*radius - (0.1*0.1 + 0.1*0.1));
    expect(hitRec.t).toBeCloseTo(expected_t, 4);
  });
}); 