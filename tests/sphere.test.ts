import { Sphere } from '../src/sphere.js';
import { vec3, point3, dot } from '../src/vec3.js';
import { ray } from '../src/ray.js';

describe('Sphere', () => {
  const center = new vec3(0, 0, -1);
  const radius = 0.5;
  const sphere = new Sphere(center, radius);

  test('should hit sphere directly in front', () => {
    const r = new ray(new vec3(0, 0, 0), new vec3(0, 0, -1)); // Ray from origin towards sphere center
    const t = sphere.hit(r);
    // Expected hit point: 0,0,-0.5 (t = 0.5)
    expect(t).toBeCloseTo(0.5);
  });

  test('should miss sphere', () => {
    const r = new ray(new vec3(0, 0, 0), new vec3(1, 1, 0)); // Ray going sideways, parallel to xy plane
    const t = sphere.hit(r);
    expect(t).toBe(-1.0);
  });

  test('should miss sphere when ray points away', () => {
    const r = new ray(new vec3(0, 0, 0), new vec3(0, 0, 1)); // Ray pointing away from sphere
    const t = sphere.hit(r);
    expect(t).toBe(-1.0);
  });

  test('should hit sphere tangentially', () => {
    const r = new ray(new vec3(0, radius, 0), new vec3(0, 0, -1)); // Ray starting at top edge, going straight back
    const t = sphere.hit(r);
    // Expected hit point: 0, radius, -1 (t = 1.0)
    expect(t).toBeCloseTo(1.0);
  });

  test('should return closest hit point when ray starts inside', () => {
    const r = new ray(center, new vec3(0, 0, -1)); // Ray starting at center, going straight back
    const t = sphere.hit(r);
    // Expected hit point: 0, 0, -1.5 (t = 0.5)
    expect(t).toBeCloseTo(0.5);
  });

  test('should not hit when intersection is behind origin (negative t)', () => {
    // Ray starting far behind the sphere, pointing away from it
    const r = new ray(new vec3(0, 0, 2), new vec3(0, 0, 1)); 
    const t = sphere.hit(r);
    // Mathematically, the infinite line intersects, but not in the positive ray direction
    expect(t).toBe(-1.0);
  });

  test('should handle ray hitting edge-on', () => {
    const r = new ray(new vec3(radius, 0, 0), new vec3(0, 0, -1)); // Ray starting at side edge
    const t = sphere.hit(r);
    expect(t).toBeCloseTo(1.0); // Hits at (radius, 0, -1)
  });

  test('should handle offset ray hitting', () => {
    const r = new ray(new vec3(0.1, 0.1, 0), new vec3(0, 0, -1)); // Offset ray towards sphere
    // Need to calculate expected t: oc = (0.1, 0.1, 1), dir = (0,0,-1)
    // a = 1
    // half_b = dot(oc, dir) = -1
    // c = dot(oc, oc) - r^2 = (0.01 + 0.01 + 1) - 0.25 = 1.02 - 0.25 = 0.77
    // discriminant = (-1)^2 - 1 * 0.77 = 1 - 0.77 = 0.23
    // sqrtd = sqrt(0.23) approx 0.4796
    // root1 = (-(-1) - sqrtd) / 1 = 1 - 0.4796 = 0.5204
    // root2 = (1 + sqrtd) / 1 = 1 + 0.4796 = 1.4796
    // Smallest positive root is 0.5204
    const t = sphere.hit(r);
    expect(t).toBeCloseTo(1 - Math.sqrt(radius*radius - (0.1*0.1 + 0.1*0.1)), 4); // Correct analytic solution: t = -half_b - sqrt(disc) / a
                                                                               // Here simplified slightly. Full quadratic formula for t = - (oc.z) - sqrt(oc.z^2 - (oc.length_sq - r^2)) ?
    expect(t).toBeCloseTo(0.5204, 4);
  });
}); 