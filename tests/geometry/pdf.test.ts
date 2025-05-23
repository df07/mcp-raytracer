/* Specs: pdf-sampling.md */

import { Vec3, Point3 } from '../../src/geometry/vec3.js';
import { CosinePDF, MixturePDF, PDF } from '../../src/geometry/pdf.js';
import { ONBasis } from '../../src/geometry/onbasis.js';
import { Sphere } from '../../src/entities/sphere.js';
import { HittableList } from '../../src/geometry/hittableList.js';
import { Lambertian } from '../../src/materials/lambertian.js';

// Mock PDF for testing the MixturePDF
class MockPDF implements PDF {
  private returnDirection: Vec3;
  
  constructor(returnDirection: Vec3 = new Vec3(1, 0, 0)) {
    this.returnDirection = returnDirection;
  }
  
  value(direction: Vec3): number {
    return 1.0; // Always return 1 for testing
  }
  
  generate(): Vec3 {
    return this.returnDirection;
  }
}

describe('PDF', () => {
  describe('CosinePDF', () => {
    it('should generate directions following a cosine distribution', () => {
      // Arrange
      const normal = new Vec3(0, 1, 0); // Up direction
      const pdf = new CosinePDF(normal);
      
      // Act - generate multiple samples
      const numSamples = 1000;
      let upwardCount = 0;
      
      for (let i = 0; i < numSamples; i++) {
        const direction = pdf.generate();
        
        // Assert each direction is unit length
        expect(direction.length()).toBeCloseTo(1, 1);
        
        // Count directions that have a significant upward component
        if (direction.dot(normal) > 0.5) {
          upwardCount++;
        }
      }
      
      // Assert more samples are in the normal hemisphere with upward bias
      // With a cosine distribution, we expect more samples in the direction of the normal
      expect(upwardCount).toBeGreaterThan(numSamples * 0.3);
    });
    
    it('should calculate correct PDF values for directions', () => {
      // Arrange
      const normal = new Vec3(0, 1, 0); // Up direction
      const pdf = new CosinePDF(normal);
      
      // Act & Assert
      
      // PDF value should be cosine/PI for directions in upper hemisphere
      // PDF value should be 0 for directions in lower hemisphere
      
      // Directly up (cosine = 1)
      expect(pdf.value(new Vec3(0, 1, 0))).toBeCloseTo(1/Math.PI);
      
      // 45 degrees from normal (cosine = 1/sqrt(2) ≈ 0.7071)
      const angle45 = new Vec3(1, 1, 0).unitVector();
      expect(pdf.value(angle45)).toBeCloseTo(0.7071/Math.PI, 4);
      
      // 90 degrees from normal (cosine = 0)
      expect(pdf.value(new Vec3(1, 0, 0))).toBeCloseTo(0);
      
      // Below horizon (negative cosine)
      expect(pdf.value(new Vec3(0, -1, 0))).toBe(0);
    });
  });
  
  describe('MixturePDF', () => {
    it('should mix PDFs with equal weights by default', () => {
      // Arrange
      const pdf1 = new MockPDF(new Vec3(1, 0, 0));
      const pdf2 = new MockPDF(new Vec3(0, 1, 0));
      const mixturePdf = new MixturePDF([pdf1, pdf2]);
      
      // Act
      const value = mixturePdf.value(new Vec3(0, 0, 1));
      
      // Assert - each mock returns 1.0, so avg should be 1.0
      expect(value).toBeCloseTo(1.0);
    });
    
    it('should respect provided weights', () => {
      // Arrange
      const pdf1 = new MockPDF(new Vec3(1, 0, 0));  // Returns vector in x direction
      const pdf2 = new MockPDF(new Vec3(0, 1, 0));  // Returns vector in y direction
      const mixturePdf = new MixturePDF([pdf1, pdf2], [1, 3]); // 25% for pdf1, 75% for pdf2
      
      // Act - sample many times and count occurrences
      const numSamples = 1000;
      let pdf1Count = 0;
      let pdf2Count = 0;
      
      for (let i = 0; i < numSamples; i++) {
        const result = mixturePdf.generate();
        // Check which PDF was chosen based on the direction
        if (Math.abs(result.x) > 0.5 && Math.abs(result.y) < 0.5) {
          pdf1Count++;
        } else if (Math.abs(result.y) > 0.5 && Math.abs(result.x) < 0.5) {
          pdf2Count++;
        }
      }
      
      // Assert - should approximately follow the 1:3 ratio with some statistical variance
      const pdf1Ratio = pdf1Count / numSamples;
      const pdf2Ratio = pdf2Count / numSamples;
      
      // Allow for reasonable statistical variance (±5 percentage points)
      expect(pdf1Ratio).toBeGreaterThan(0.20);
      expect(pdf1Ratio).toBeLessThan(0.30);
      expect(pdf2Ratio).toBeGreaterThan(0.70);
      expect(pdf2Ratio).toBeLessThan(0.80);
    });
    
    it('should calculate PDF value as weighted average', () => {
      // Arrange
      class ValuePDF implements PDF {
        private returnValue: number;
        
        constructor(returnValue: number) {
          this.returnValue = returnValue;
        }
        
        value(): number {
          return this.returnValue;
        }
        
        generate(): Vec3 {
          return new Vec3(1, 0, 0);
        }
      }
      
      const pdf1 = new ValuePDF(1);
      const pdf2 = new ValuePDF(3);
      
      // Act & Assert
      
      // Equal weights (default)
      const equalMixture = new MixturePDF([pdf1, pdf2]);
      expect(equalMixture.value(new Vec3())).toBeCloseTo(2); // (1+3)/2 = 2
      
      // Custom weights
      const weightedMixture = new MixturePDF([pdf1, pdf2], [1, 3]);
      expect(weightedMixture.value(new Vec3())).toBeCloseTo(2.5); // (1*1 + 3*3)/(1+3) = 2.5
    });
  });
  
  describe('Vec3.randomCosineDirection', () => {
    it('should generate vectors following a cosine distribution', () => {
      // Generate a large number of random cosine directions
      const numSamples = 1000;
      let dotProductSum = 0;
      
      for (let i = 0; i < numSamples; i++) {
        const direction = Vec3.randomCosineDirection();
        
        // Vector should be unit length (or very close)
        expect(direction.length()).toBeCloseTo(1, 1);
        
        // Collect dot product with up vector (z component)
        // In cosine distribution, this should average to 2/3
        dotProductSum += direction.z;
      }
      
      // Average z component should be approximately 2/3 for cosine distribution
      const averageZ = dotProductSum / numSamples;
      expect(averageZ).toBeCloseTo(2/3, 1);
    });
  });
}); 