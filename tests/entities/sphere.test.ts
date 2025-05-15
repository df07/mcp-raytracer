import { Sphere } from '../../src/entities/sphere.js';
import { Vec3 } from '../../src/geometry/vec3.js'; // Use Vec3 directly
import type { Point3 } from '../../src/geometry/vec3.js'; // Import Point3 as a type
import { Ray } from '../../src/geometry/ray.js';
import { Interval } from '../../src/geometry/interval.js';
import { Lambertian } from '../../src/materials/lambertian.js';

// Mock material for testing
class MockMaterial extends Lambertian {
  constructor() {
    super(new Vec3(1, 1, 1));
  }
}

describe('Sphere', () => {
  it('should correctly determine ray intersections', () => {
    const center: Point3 = new Vec3(0, 0, -1); // Instantiate with Vec3, type as Point3
    const radius = 0.5;
    const material = new MockMaterial();
    const sphere = new Sphere(center, radius, material);

    // Ray hitting the sphere
    const ray1 = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));
    const interval1 = new Interval(0, Infinity);
    const rec1 = sphere.hit(ray1, interval1);
    expect(rec1).not.toBeNull();
    if (rec1) {
      expect(rec1.t).toBeCloseTo(0.5);
      expect(rec1.p.x).toBeCloseTo(0);
      expect(rec1.p.y).toBeCloseTo(0);
      expect(rec1.p.z).toBeCloseTo(-0.5);
      // Normal should point outward from the center
      const outwardNormal1 = rec1.p.subtract(center).divide(radius);
      expect(rec1.normal.x).toBeCloseTo(outwardNormal1.x);
      expect(rec1.normal.y).toBeCloseTo(outwardNormal1.y);
      expect(rec1.normal.z).toBeCloseTo(outwardNormal1.z);
      expect(rec1.frontFace).toBe(true); // Ray origin is outside the sphere
      expect(rec1.material).toBe(material); // Material should be set
    }

    // Ray missing the sphere
    const ray2 = new Ray(new Vec3(0, 1, 0), new Vec3(0, 0, -1));
    const interval2 = new Interval(0, Infinity);
    const rec2 = sphere.hit(ray2, interval2);
    expect(rec2).toBeNull();

    // Ray starting inside the sphere
    const ray3 = new Ray(new Vec3(0, 0, -1), new Vec3(0, 0, -1));
    const interval3 = new Interval(0.001, Infinity); // tMin > 0 to avoid self-intersection at origin
    const rec3 = sphere.hit(ray3, interval3);
    expect(rec3).not.toBeNull();
    if (rec3) {
      expect(rec3.t).toBeCloseTo(0.5);
      expect(rec3.p.x).toBeCloseTo(0);
      expect(rec3.p.y).toBeCloseTo(0);
      expect(rec3.p.z).toBeCloseTo(-1.5);
      // Normal should point inward
      const outwardNormal3 = rec3.p.subtract(center).divide(radius);
      expect(rec3.normal.x).toBeCloseTo(-outwardNormal3.x);
      expect(rec3.normal.y).toBeCloseTo(-outwardNormal3.y);
      expect(rec3.normal.z).toBeCloseTo(-outwardNormal3.z);
      expect(rec3.frontFace).toBe(false); // Ray origin is inside the sphere
      expect(rec3.material).toBe(material); // Material should be set
    }

    // Ray hitting tangentially (should technically hit, but floating point might be tricky)
    // Let's test a ray grazing the top
    const ray4 = new Ray(new Vec3(0, 0.5, 0), new Vec3(0, 0, -1));
    const interval4 = new Interval(0, Infinity);
    const rec4 = sphere.hit(ray4, interval4);
    expect(rec4).not.toBeNull();
    if (rec4) {
        expect(rec4.t).toBeCloseTo(1.0);
        expect(rec4.p.x).toBeCloseTo(0);
        expect(rec4.p.y).toBeCloseTo(0.5);
        expect(rec4.p.z).toBeCloseTo(-1.0);
        expect(rec4.frontFace).toBe(true);
    }

    // Ray hitting outside the interval [tMin, tMax]
    const ray5 = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));
    const interval5 = new Interval(0.6, 1.0); // t=0.5 is outside this interval
    const rec5 = sphere.hit(ray5, interval5);
    expect(rec5).toBeNull();

    const interval6 = new Interval(0.0, 0.4); // t=0.5 is outside this interval
    const rec6 = sphere.hit(ray5, interval6);
    expect(rec6).toBeNull();

  });
});