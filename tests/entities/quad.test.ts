import { Quad } from '../../src/entities/quad.js';
import { Vec3 } from '../../src/geometry/vec3.js';
import type { Point3 } from '../../src/geometry/vec3.js';
import { Ray } from '../../src/geometry/ray.js';
import { Interval } from '../../src/geometry/interval.js';
import { Lambertian } from '../../src/materials/lambertian.js';

// Mock material for testing
class MockMaterial extends Lambertian {
  constructor() {
    super(new Vec3(1, 1, 1));
  }
}

describe('Quad', () => {
  describe('constructor', () => {
    it('should correctly compute area and create underlying plane', () => {
      // Create a unit square in the XY plane
      const q: Point3 = new Vec3(0, 0, 0);
      const u = new Vec3(1, 0, 0);  // 1 unit in X direction
      const v = new Vec3(0, 1, 0);  // 1 unit in Y direction
      const material = new MockMaterial();
      
      const quad = new Quad(q, u, v, material);
      
      // Area should be |u × v| = 1
      expect(quad.area).toBeCloseTo(1);
      
      // Should have created a plane with same parameters
      expect(quad.plane.q).toBe(q);
      expect(quad.plane.u).toBe(u);
      expect(quad.plane.v).toBe(v);
      expect(quad.plane.material).toBe(material);
    });

    it('should handle non-unit quads', () => {
      // Create a 2x3 rectangle
      const q: Point3 = new Vec3(1, 1, 1);
      const u = new Vec3(2, 0, 0);  // 2 units in X direction
      const v = new Vec3(0, 3, 0);  // 3 units in Y direction
      const material = new MockMaterial();
      
      const quad = new Quad(q, u, v, material);
      
      // Area should be |u × v| = 6
      expect(quad.area).toBeCloseTo(6);
    });
  });

  describe('hit method', () => {
    it('should hit rays that intersect within quad boundaries', () => {
      // Unit square in XY plane at z = 5
      const q: Point3 = new Vec3(0, 0, 5);
      const u = new Vec3(1, 0, 0);
      const v = new Vec3(0, 1, 0);
      const material = new MockMaterial();
      const quad = new Quad(q, u, v, material);
      
      // Ray hitting center of quad
      const ray = new Ray(new Vec3(0.5, 0.5, 0), new Vec3(0, 0, 1));
      const interval = new Interval(0, Infinity);
      
      const hit = quad.hit(ray, interval);
      expect(hit).not.toBeNull();
      if (hit) {
        expect(hit.t).toBeCloseTo(5);
        expect(hit.p.x).toBeCloseTo(0.5);
        expect(hit.p.y).toBeCloseTo(0.5);
        expect(hit.p.z).toBeCloseTo(5);
        expect(hit.material).toBe(material);
      }
    });

    it('should miss rays that hit the plane but outside quad boundaries', () => {
      // Unit square in XY plane at z = 5
      const q: Point3 = new Vec3(0, 0, 5);
      const u = new Vec3(1, 0, 0);
      const v = new Vec3(0, 1, 0);
      const material = new MockMaterial();
      const quad = new Quad(q, u, v, material);
      
      // Ray hitting plane but outside quad (at x=1.5, y=0.5)
      const ray = new Ray(new Vec3(1.5, 0.5, 0), new Vec3(0, 0, 1));
      const interval = new Interval(0, Infinity);
      
      const hit = quad.hit(ray, interval);
      expect(hit).toBeNull();
    });

    it('should hit rays at quad boundaries', () => {
      // Unit square in XY plane at z = 5
      const q: Point3 = new Vec3(0, 0, 5);
      const u = new Vec3(1, 0, 0);
      const v = new Vec3(0, 1, 0);
      const material = new MockMaterial();
      const quad = new Quad(q, u, v, material);
      
      // Test all four corners
      const corners = [
        new Vec3(0, 0, 0),    // q
        new Vec3(1, 0, 0),    // q + u
        new Vec3(0, 1, 0),    // q + v
        new Vec3(1, 1, 0)     // q + u + v
      ];
      
      for (const corner of corners) {
        const ray = new Ray(corner, new Vec3(0, 0, 1));
        const interval = new Interval(0, Infinity);
        const hit = quad.hit(ray, interval);
        expect(hit).not.toBeNull();
        if (hit) {
          expect(hit.t).toBeCloseTo(5);
          expect(hit.p.x).toBeCloseTo(corner.x);
          expect(hit.p.y).toBeCloseTo(corner.y);
          expect(hit.p.z).toBeCloseTo(5);
        }
      }
    });

    it('should miss rays that are parallel to the quad', () => {
      // Unit square in XY plane at z = 5
      const q: Point3 = new Vec3(0, 0, 5);
      const u = new Vec3(1, 0, 0);
      const v = new Vec3(0, 1, 0);
      const material = new MockMaterial();
      const quad = new Quad(q, u, v, material);
      
      // Ray parallel to quad (in XY direction)
      const ray = new Ray(new Vec3(0, 0, 0), new Vec3(1, 1, 0));
      const interval = new Interval(0, Infinity);
      
      const hit = quad.hit(ray, interval);
      expect(hit).toBeNull();
    });

    it('should handle front and back face correctly', () => {
      // Unit square in XY plane at z = 5
      const q: Point3 = new Vec3(0, 0, 5);
      const u = new Vec3(1, 0, 0);
      const v = new Vec3(0, 1, 0);
      const material = new MockMaterial();
      const quad = new Quad(q, u, v, material);
      
      // Front face (ray from negative Z)
      const frontRay = new Ray(new Vec3(0.5, 0.5, 0), new Vec3(0, 0, 1));
      const frontHit = quad.hit(frontRay, new Interval(0, Infinity));
      expect(frontHit).not.toBeNull();
      if (frontHit) {
        expect(frontHit.frontFace).toBe(false); // Using sphere convention
        expect(frontHit.normal.z).toBeCloseTo(-1); // Normal points towards ray
      }
      
      // Back face (ray from positive Z)
      const backRay = new Ray(new Vec3(0.5, 0.5, 10), new Vec3(0, 0, -1));
      const backHit = quad.hit(backRay, new Interval(0, Infinity));
      expect(backHit).not.toBeNull();
      if (backHit) {
        expect(backHit.frontFace).toBe(true); // Using sphere convention
        expect(backHit.normal.z).toBeCloseTo(1); // Normal points towards ray
      }
    });
  });

  describe('boundingBox method', () => {
    it('should return correct bounding box for axis-aligned quad', () => {
      // Unit square in XY plane at z = 5
      const q: Point3 = new Vec3(1, 2, 5);
      const u = new Vec3(3, 0, 0);  // 3 units in X direction
      const v = new Vec3(0, 4, 0);  // 4 units in Y direction
      const material = new MockMaterial();
      const quad = new Quad(q, u, v, material);
      
      const bbox = quad.boundingBox();
      
      // Should encompass all four vertices with small padding
      const epsilon = 1e-4;
      expect(bbox.minimum.x).toBeCloseTo(1 - epsilon);
      expect(bbox.minimum.y).toBeCloseTo(2 - epsilon);
      expect(bbox.minimum.z).toBeCloseTo(5 - epsilon);
      expect(bbox.maximum.x).toBeCloseTo(4 + epsilon); // 1 + 3
      expect(bbox.maximum.y).toBeCloseTo(6 + epsilon); // 2 + 4
      expect(bbox.maximum.z).toBeCloseTo(5 + epsilon);
    });

    it('should return correct bounding box for tilted quad', () => {
      // Tilted quad
      const q: Point3 = new Vec3(0, 0, 0);
      const u = new Vec3(1, 1, 0);  // Diagonal in XY
      const v = new Vec3(0, 1, 1);  // Diagonal in YZ
      const material = new MockMaterial();
      const quad = new Quad(q, u, v, material);
      
      const bbox = quad.boundingBox();
      
      // Vertices are: (0,0,0), (1,1,0), (0,1,1), (1,2,1)
      const epsilon = 1e-4;
      expect(bbox.minimum.x).toBeCloseTo(0 - epsilon);
      expect(bbox.minimum.y).toBeCloseTo(0 - epsilon);
      expect(bbox.minimum.z).toBeCloseTo(0 - epsilon);
      expect(bbox.maximum.x).toBeCloseTo(1 + epsilon);
      expect(bbox.maximum.y).toBeCloseTo(2 + epsilon); // max of 0,1,1,2
      expect(bbox.maximum.z).toBeCloseTo(1 + epsilon);
    });
  });

  describe('PDF methods', () => {
    describe('pdfValue', () => {
      it('should return 0 for directions that miss the quad', () => {
        // Unit square in XY plane at z = 5
        const q: Point3 = new Vec3(0, 0, 5);
        const u = new Vec3(1, 0, 0);
        const v = new Vec3(0, 1, 0);
        const material = new MockMaterial();
        const quad = new Quad(q, u, v, material);
        
        // Direction that misses the quad
        const origin = new Vec3(0, 0, 0);
        const direction = new Vec3(0, 1, 0).unitVector(); // Points up, misses quad
        
        const pdfVal = quad.pdfValue(origin, direction);
        expect(pdfVal).toBe(0);
      });

      it('should return positive value for directions that hit the quad', () => {
        // Unit square in XY plane at z = 5
        const q: Point3 = new Vec3(0, 0, 5);
        const u = new Vec3(1, 0, 0);
        const v = new Vec3(0, 1, 0);
        const material = new MockMaterial();
        const quad = new Quad(q, u, v, material);
        
        // Direction towards center of quad
        const origin = new Vec3(0, 0, 0);
        const direction = new Vec3(0.5, 0.5, 5).unitVector();
        
        const pdfVal = quad.pdfValue(origin, direction);
        expect(pdfVal).toBeGreaterThan(0);
      });

      it('should calculate PDF based on distance and area', () => {
        // Unit square in XY plane at z = 5
        const q: Point3 = new Vec3(0, 0, 5);
        const u = new Vec3(1, 0, 0);
        const v = new Vec3(0, 1, 0);
        const material = new MockMaterial();
        const quad = new Quad(q, u, v, material);
        
        // Direction towards center of quad
        const origin = new Vec3(0, 0, 0);
        const direction = new Vec3(0.5, 0.5, 5).unitVector();
        
        const pdfVal = quad.pdfValue(origin, direction);
        
        // Manual calculation for verification
        const hitPoint = new Vec3(0.5, 0.5, 5);
        const distance = hitPoint.subtract(origin).length();
        const cosine = Math.abs(direction.dot(new Vec3(0, 0, -1))); // Normal towards origin
        const expectedPdf = (distance * distance) / (quad.area * cosine);
        
        expect(pdfVal).toBeCloseTo(expectedPdf, 5);
      });
    });

    describe('pdfRandomVec', () => {
      it('should generate vectors that point towards the quad', () => {
        // Unit square in XY plane at z = 5
        const q: Point3 = new Vec3(0, 0, 5);
        const u = new Vec3(1, 0, 0);
        const v = new Vec3(0, 1, 0);
        const material = new MockMaterial();
        const quad = new Quad(q, u, v, material);
        
        const origin = new Vec3(0, 0, 0);
        
        // Test multiple samples
        for (let i = 0; i < 50; i++) {
          const randomVec = quad.pdfRandomVec(origin);
          
          // Vector should be normalized
          expect(randomVec.length()).toBeCloseTo(1.0, 5);
          
          // Create a ray and check if it hits the quad
          const ray = new Ray(origin, randomVec);
          const hit = quad.hit(ray, new Interval(0.001, Infinity));
          
          // The random vector should hit the quad
          expect(hit).not.toBeNull();
        }
      });

      it('should generate vectors with non-zero PDF values', () => {
        // Unit square in XY plane at z = 5
        const q: Point3 = new Vec3(0, 0, 5);
        const u = new Vec3(1, 0, 0);
        const v = new Vec3(0, 1, 0);
        const material = new MockMaterial();
        const quad = new Quad(q, u, v, material);
        
        const origin = new Vec3(0, 0, 0);
        
        // Generate several random vectors and check their PDF values
        for (let i = 0; i < 20; i++) {
          const randomVec = quad.pdfRandomVec(origin);
          const pdfVal = quad.pdfValue(origin, randomVec);
          
          // PDF value should be positive
          expect(pdfVal).toBeGreaterThan(0);
        }
      });
    });

    describe('pdf', () => {
      it('should return a PDF object with working value and generate functions', () => {
        // Unit square in XY plane at z = 5
        const q: Point3 = new Vec3(0, 0, 5);
        const u = new Vec3(1, 0, 0);
        const v = new Vec3(0, 1, 0);
        const material = new MockMaterial();
        const quad = new Quad(q, u, v, material);
        
        const origin = new Vec3(0, 0, 0);
        const pdfObj = quad.pdf(origin);
        
        // Test value function
        const direction = new Vec3(0.5, 0.5, 5).unitVector();
        const pdfVal = pdfObj.value(direction);
        expect(pdfVal).toBeGreaterThan(0);
        expect(pdfVal).toBeCloseTo(quad.pdfValue(origin, direction));
        
        // Test generate function
        const randomVec = pdfObj.generate();
        expect(randomVec.length()).toBeCloseTo(1.0, 5);
        
        // Generated vector should hit the quad
        const ray = new Ray(origin, randomVec);
        const hit = quad.hit(ray, new Interval(0.001, Infinity));
        expect(hit).not.toBeNull();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle very small quads', () => {
      // Very small quad
      const q: Point3 = new Vec3(0, 0, 0);
      const u = new Vec3(0.001, 0, 0);
      const v = new Vec3(0, 0.001, 0);
      const material = new MockMaterial();
      
      expect(() => {
        const quad = new Quad(q, u, v, material);
        expect(quad.area).toBeCloseTo(0.000001);
      }).not.toThrow();
    });

    it('should handle rays that barely miss quad boundaries', () => {
      // Unit square in XY plane at z = 5
      const q: Point3 = new Vec3(0, 0, 5);
      const u = new Vec3(1, 0, 0);
      const v = new Vec3(0, 1, 0);
      const material = new MockMaterial();
      const quad = new Quad(q, u, v, material);
      
      // Ray just outside boundary
      const ray = new Ray(new Vec3(1.0001, 0.5, 0), new Vec3(0, 0, 1));
      const interval = new Interval(0, Infinity);
      
      const hit = quad.hit(ray, interval);
      expect(hit).toBeNull();
    });
  });
}); 