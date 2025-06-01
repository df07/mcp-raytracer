import { Sphere } from '../../src/entities/sphere.js';
import { Vec3 } from '../../src/geometry/vec3.js';
import { SceneData } from '../../src/scenes/sceneData.js';
import { generateSpheresSceneData, SpheresSceneOptions } from '../../src/scenes/scenes-spheres.js';

describe('Spheres Scene Generator', () => {
  describe('generateSpheresScene', () => {
    it('should generate a scene with the specified number of spheres', () => {
      const options = { count: 5 };
      const sceneData = generateSpheresSceneData(options);

      // Count should be exactly the number of spheres requested
      expect(sceneData.objects.length).toBe(options.count);
    });
    
    it('should generate non-overlapping spheres', () => {
      const options = { count: 10 };
      const sceneData = generateSpheresSceneData(options);
      
      // Extract all spheres from the world
      const spheres: Array<{center: Vec3, radius: number}> = [];
      for (let i = 0; i < sceneData.objects.length; i++) {
        const object = sceneData.objects[i];
        if (object instanceof Sphere) {
          spheres.push({
            center: object.center,
            radius: object.radius
          });
        }
      }
      
      // Check each pair of spheres for overlap
      for (let i = 0; i < spheres.length; i++) {
        for (let j = i + 1; j < spheres.length; j++) {
          const s1 = spheres[i];
          const s2 = spheres[j];
          
          // Calculate distance between centers
          const distance = s1.center.subtract(s2.center).length();
          
          // Spheres shouldn't overlap
          expect(distance).toBeGreaterThanOrEqual(s1.radius + s2.radius);
        }
      }
    });
    
    it('should decrease sphere radius as sphere count increases', () => {
      // Generate scenes with different sphere counts
      const smallScene = generateSpheresSceneData({ count: 5 });
      const largeScene = generateSpheresSceneData({ count: 500 });
      
      // Extract non-ground spheres
      const getMaxSphereRadius = (scene: SceneData): number => {
        const spheres = scene.objects.filter(o => o.type === 'sphere');
        return Math.max(...spheres.map(s => s.r));
      };
            
      const smallSceneMaxRadius = getMaxSphereRadius(smallScene);
      const largeSceneMaxRadius = getMaxSphereRadius(largeScene);
      
      // Max radius should be smaller in the scene with more spheres
      expect(largeSceneMaxRadius).toBeLessThan(smallSceneMaxRadius);
    });
  });
});
