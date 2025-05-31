/* Specs: pdf-sampling.md */

import { ONBasis } from '../../src/geometry/onbasis.js';
import { Vec3 } from '../../src/geometry/vec3.js';

describe('ONBasis', () => {
  it('should create an orthonormal basis around a normal vector', () => {
    // Arrange
    const normal = Vec3.create(0, 1, 0); // Normal pointing up along y-axis
    
    // Act
    const onb = new ONBasis(normal);
    
    // Assert
    // w should be a unit vector in the same direction as normal
    expect(onb.w().length()).toBeCloseTo(1);
    expect(onb.w().dot(normal)).toBeCloseTo(1);
    
    // u and v should also be unit vectors
    expect(onb.u().length()).toBeCloseTo(1);
    expect(onb.v().length()).toBeCloseTo(1);
    
    // The basis should be orthogonal
    expect(onb.u().dot(onb.v())).toBeCloseTo(0);
    expect(onb.u().dot(onb.w())).toBeCloseTo(0);
    expect(onb.v().dot(onb.w())).toBeCloseTo(0);
  });
  
  it('should work with any input normal direction', () => {
    // Test with a few different normal directions
    const normals = [
      Vec3.create(1, 0, 0),  // x-axis
      Vec3.create(0, 0, 1),  // z-axis
      Vec3.create(1, 1, 1).unitVector(),  // diagonal
      Vec3.create(-1, 2, 3).unitVector(), // arbitrary
    ];
    
    for (const normal of normals) {
      const onb = new ONBasis(normal);
      
      // w should be aligned with the normal
      expect(onb.w().dot(normal)).toBeCloseTo(1);
      
      // The basis should be orthogonal
      expect(onb.u().dot(onb.v())).toBeCloseTo(0);
      expect(onb.u().dot(onb.w())).toBeCloseTo(0);
      expect(onb.v().dot(onb.w())).toBeCloseTo(0);
      
      // All vectors should be unit length
      expect(onb.u().length()).toBeCloseTo(1);
      expect(onb.v().length()).toBeCloseTo(1);
      expect(onb.w().length()).toBeCloseTo(1);
    }
  });
  
  it('should correctly transform local coordinates to world coordinates', () => {
    // Arrange
    const normal = Vec3.create(0, 1, 0); // Normal pointing up
    const onb = new ONBasis(normal);
    
    // Act & Assert
    
    // Local (0,0,1) should map to world w direction (normal)
    const localZ = Vec3.create(0, 0, 1);
    const worldZ = onb.local(localZ);
    expect(worldZ.dot(normal)).toBeCloseTo(1);
    
    // Local (1,0,0) should map to world u direction (perpendicular to normal)
    const localX = Vec3.create(1, 0, 0);
    const worldX = onb.local(localX);
    expect(worldX.dot(normal)).toBeCloseTo(0);
    
    // Local (0,1,0) should map to world v direction (perpendicular to normal and u)
    const localY = Vec3.create(0, 1, 0);
    const worldY = onb.local(localY);
    expect(worldY.dot(normal)).toBeCloseTo(0);
    expect(worldY.dot(worldX)).toBeCloseTo(0);
    
    // Test a combination
    const localCombined = Vec3.create(1, 2, 3);
    const worldCombined = onb.local(localCombined);
    const expected = onb.u().multiply(1).add(onb.v().multiply(2)).add(onb.w().multiply(3));
    expect(worldCombined.x).toBeCloseTo(expected.x);
    expect(worldCombined.y).toBeCloseTo(expected.y);
    expect(worldCombined.z).toBeCloseTo(expected.z);
  });
}); 