import { HittableList } from '../src/hittableList.js';
import { Sphere } from '../src/sphere.js';
import { Vec3 } from '../src/vec3.js';
import { Ray } from '../src/ray.js';
import { Interval } from '../src/interval.js';

describe('HittableList', () => {
  it('should correctly determine the closest hit among objects', () => {
    const list = new HittableList();
    const sphere1 = new Sphere(new Vec3(0, 0, -1), 0.5);
    const sphere2 = new Sphere(new Vec3(0, 0, -2), 0.5);
    list.add(sphere1);
    list.add(sphere2);

    // Ray hitting the closer sphere (sphere1)
    const ray1 = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));
    const interval1 = new Interval(0, Infinity);
    const rec1 = list.hit(ray1, interval1);
    expect(rec1).not.toBeNull();
    if (rec1) {
      expect(rec1.t).toBeCloseTo(0.5); // Hit sphere1
      expect(rec1.p.z).toBeCloseTo(-0.5);
    }

    // Ray hitting the farther sphere (sphere2)
    const ray2 = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));
    const interval2 = new Interval(0.6, Infinity); // tMin is after sphere1 hit
    const rec2 = list.hit(ray2, interval2);
    expect(rec2).not.toBeNull();
    if (rec2) {
      expect(rec2.t).toBeCloseTo(1.5); // Hit sphere2
      expect(rec2.p.z).toBeCloseTo(-1.5);
    }

    // Ray missing both spheres
    const ray3 = new Ray(new Vec3(0, 1, 0), new Vec3(0, 0, -1));
    const interval3 = new Interval(0, Infinity);
    const rec3 = list.hit(ray3, interval3);
    expect(rec3).toBeNull();

    // Ray hitting only one sphere within the interval
    const ray4 = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));
    const interval4 = new Interval(0, 1.0); // Interval includes sphere1 but not sphere2
    const rec4 = list.hit(ray4, interval4);
    expect(rec4).not.toBeNull();
    if (rec4) {
      expect(rec4.t).toBeCloseTo(0.5); // Hit sphere1
      expect(rec4.p.z).toBeCloseTo(-0.5);
    }

    // Empty list
    const emptyList = new HittableList();
    const ray5 = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));
    const interval5 = new Interval(0, Infinity);
    const rec5 = emptyList.hit(ray5, interval5);
    expect(rec5).toBeNull();
  });
});