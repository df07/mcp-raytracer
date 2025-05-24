import { Sphere } from '../../src/entities/sphere.js';
import { Vec3 } from '../../src/geometry/vec3.js'; // Use Vec3 directly
import type { Point3 } from '../../src/geometry/vec3.js'; // Import Point3 as a type
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
    const ray1 = { origin: new Vec3(0, 0, 0), direction: new Vec3(0, 0, -1) };
    const interval1 = new Interval(0, Infinity);
    const rec1 = sphere.hit(ray1.origin, ray1.direction, interval1.min, interval1.max);
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
    const ray2 = { origin: new Vec3(0, 1, 0), direction: new Vec3(0, 0, -1) };
    const interval2 = new Interval(0, Infinity);
    const rec2 = sphere.hit(ray2.origin, ray2.direction, interval2.min, interval2.max);
    expect(rec2).toBeNull();

    // Ray starting inside the sphere
    const ray3 = { origin: new Vec3(0, 0, -1), direction: new Vec3(0, 0, -1) };
    const interval3 = new Interval(0.001, Infinity); // tMin > 0 to avoid self-intersection at origin
    const rec3 = sphere.hit(ray3.origin, ray3.direction, interval3.min, interval3.max);
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
    const ray4 = { origin: new Vec3(0, 0.5, 0), direction: new Vec3(0, 0, -1) };
    const interval4 = new Interval(0, Infinity);
    const rec4 = sphere.hit(ray4.origin, ray4.direction, interval4.min, interval4.max);
    expect(rec4).not.toBeNull();
    if (rec4) {
        expect(rec4.t).toBeCloseTo(1.0);
        expect(rec4.p.x).toBeCloseTo(0);
        expect(rec4.p.y).toBeCloseTo(0.5);
        expect(rec4.p.z).toBeCloseTo(-1.0);
        expect(rec4.frontFace).toBe(true);
    }

    // Ray hitting outside the interval [tMin, tMax]
    const ray5 = { origin: new Vec3(0, 0, 0), direction: new Vec3(0, 0, -1) };
    const interval5 = new Interval(0.6, 1.0); // t=0.5 is outside this interval
    const rec5 = sphere.hit(ray5.origin, ray5.direction, interval5.min, interval5.max);
    expect(rec5).toBeNull();

    const interval6 = new Interval(0.0, 0.4); // t=0.5 is outside this interval
    const rec6 = sphere.hit(ray5.origin, ray5.direction, interval6.min, interval6.max);
    expect(rec6).toBeNull();

  });
});

describe('Sphere PDF', () => {
  const center = new Vec3(0, 0, -1);
  const radius = 0.5;
  const material = new MockMaterial();
  const sphere = new Sphere(center, radius, material);

  describe('pdfValue', () => {
    it('should return 0 for directions that miss the sphere', () => {
      // Origin is at (0,0,0), direction is up (misses sphere at (0,0,-1))
      const origin = new Vec3(0, 0, 0);
      const direction = new Vec3(0, 1, 0).unitVector();
      
      const pdfVal = sphere.pdfValue(origin, direction);
      expect(pdfVal).toBe(0);
    });

    it('should return a positive value for directions that hit the sphere', () => {
      // Origin is at (0,0,0), direction is towards sphere center
      const origin = new Vec3(0, 0, 0);
      const direction = new Vec3(0, 0, -1).unitVector();
      
      const pdfVal = sphere.pdfValue(origin, direction);
      expect(pdfVal).toBeGreaterThan(0);
    });

    it('should calculate PDF value based on solid angle', () => {
      // Calculate expected PDF manually:
      // distance^2 = (0 - 0)^2 + (0 - 0)^2 + (0 - (-1))^2 = 1
      // cosTheta = sqrt(1 - radius^2/distance^2) = sqrt(1 - 0.5^2/1) = sqrt(0.75) = 0.866
      // solidAngle = 2π(1 - cosTheta) = 2π(1 - 0.866) = 2π * 0.134 = 0.84π
      // pdf = 1/solidAngle = 1/(0.84π) ≈ 0.379
      
      const origin = new Vec3(0, 0, 0);
      const direction = new Vec3(0, 0, -1).unitVector();
      
      const pdfVal = sphere.pdfValue(origin, direction);
      
      // Calculate expected value
      const distanceSquared = 1.0; // Distance from origin to center is 1
      const cosTheta = Math.sqrt(1 - (radius * radius) / distanceSquared);
      const solidAngle = 2 * Math.PI * (1 - cosTheta);
      const expectedPdf = 1 / solidAngle;
      
      expect(pdfVal).toBeCloseTo(expectedPdf, 5);
    });

    it('should calculate higher PDF values for smaller solid angles', () => {
      // Test from farther away - solid angle should be smaller, PDF higher
      const origin = new Vec3(0, 0, 5); // Farther away along z-axis
      const direction = new Vec3(0, 0, -1).unitVector(); // Towards sphere
      
      const pdfValFar = sphere.pdfValue(origin, direction);
      
      // Compare with PDF from closer origin
      const originClose = new Vec3(0, 0, 0);
      const pdfValClose = sphere.pdfValue(originClose, direction);
      
      // PDF should be higher (more concentrated) from farther away
      expect(pdfValFar).toBeGreaterThan(pdfValClose);
    });
  });

  describe('pdfRandomVec', () => {
    it('should generate vectors that point towards the sphere', () => {
      const origin = new Vec3(0, 0, 0);
      
      // Test multiple samples to ensure they hit the sphere
      for (let i = 0; i < 100; i++) {
        const randomVec = sphere.pdfRandomVec(origin);
        
        // Vector should be normalized
        expect(randomVec.length()).toBeCloseTo(1.0, 5);
        
        // Create a ray and check if it hits the sphere
        const ray = { origin: origin, direction: randomVec };
        const hit = sphere.hit(ray.origin, ray.direction, 0.001, Infinity);
        
        // The random vector should generally hit the sphere
        // But there might be floating point precision issues, so we don't expect 100%
        expect(hit).not.toBeNull();
      }
    });

    it('should generate vectors with non-zero PDF values', () => {
      const origin = new Vec3(0, 0, 0);
      
      // Generate several random vectors and check their PDF values
      for (let i = 0; i < 20; i++) {
        const randomVec = sphere.pdfRandomVec(origin);
        const pdfVal = sphere.pdfValue(origin, randomVec);
        
        // PDF value should be positive
        expect(pdfVal).toBeGreaterThan(0);
      }
    });

    it('should sample within the solid angle subtended by the sphere', () => {
      const origin = new Vec3(0, 0, 2); // Position where sphere is clearly visible
      const center = new Vec3(0, 0, 0); // Sphere at origin
      const radius = 1.0;
      const sphere = new Sphere(center, radius, material);
      
      // Calculate the cosine of the maximum angle subtended by the sphere
      const distanceSquared = origin.subtract(center).lengthSquared();
      const cosMaxAngle = Math.sqrt(1 - radius * radius / distanceSquared);
      
      // Sample several directions
      for (let i = 0; i < 100; i++) {
        const direction = sphere.pdfRandomVec(origin);
        
        // Calculate the cosine of the angle between the direction and the vector to center
        const toCenterDir = center.subtract(origin).unitVector();
        const cosAngle = direction.dot(toCenterDir);
        
        // The cosine of the angle should be greater than or equal to cosMaxAngle
        // (smaller angle = larger cosine)
        expect(cosAngle).toBeGreaterThanOrEqual(cosMaxAngle - 1e-5); // Add small epsilon for floating point comparison
      }
    });
  });
});