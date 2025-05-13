import { generateRandomSphereScene, RandomSceneOptions } from '../src/sceneGenerator.js';
import { Sphere } from '../src/sphere.js';
import { Vec3 } from '../src/vec3.js';
import { CameraOptions } from '../src/camera.js';

describe('SceneGenerator', () => {
  const defaultCamera: CameraOptions = {
    imageWidth: 9,
        imageHeight: 6,
        samples: 1
    };    

  describe('generateRandomSphereScene', () => {
    it('should generate a scene with the specified number of spheres', () => {
      const count = 5;
      const scene = generateRandomSphereScene(defaultCamera, { count });

      // Count should not include the ground sphere by default
      expect(scene._objects.length).toBe(count);
    });
    
      it('should generate a scene without ground sphere if specified', () => {
      const count = 5;
      const options: RandomSceneOptions = {
        count,
        groundSphere: false
      };

      const scene = generateRandomSphereScene(defaultCamera,options);

      // Count should be exactly the number of spheres requested (no ground)
      expect(scene._objects.length).toBe(count);
    });    
    
    it('should generate non-overlapping spheres', () => {
      const count = 10;
      const scene = generateRandomSphereScene(defaultCamera, { count });
      
      // Extract all spheres from the world
      const spheres: Array<{center: Vec3, radius: number}> = [];
      for (let i = 0; i < scene._objects.length; i++) {
        const object = scene._objects[i];
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
      const smallScene = generateRandomSphereScene(defaultCamera, { count: 5 });
      const largeScene = generateRandomSphereScene(defaultCamera, { count: 50 });
        // Extract non-ground spheres
      const getMaxSphereRadius = (scene: any): number => {
        let maxRadius = 0;
        for (const obj of scene._objects) {
          if (obj instanceof Sphere) {
            // Skip the ground sphere (usually has large radius)
            if (obj.radius < 100) {
              maxRadius = Math.max(maxRadius, obj.radius);
            }
          }
        }
        return maxRadius;
      };
      
      const smallSceneMaxRadius = getMaxSphereRadius(smallScene);
      const largeSceneMaxRadius = getMaxSphereRadius(largeScene);
      
      // Max radius should be smaller in the scene with more spheres
      expect(largeSceneMaxRadius).toBeLessThan(smallSceneMaxRadius);
    });
      it('should respect the provided options', () => {
      const customOptions: RandomSceneOptions = {
        count: 10,   
        centerPoint: new Vec3(1, 0, -2),
        radius: 3,
        minSphereRadius: 0.1,
        maxSphereRadius: 0.3,
        groundSphere: true,
        groundY: -500,
        groundRadius: 500
        
      };

      const scene = generateRandomSphereScene(defaultCamera, customOptions);

      // Check if ground sphere uses specified parameters
      // Find ground sphere (largest sphere)
      let groundSphere: Sphere | null = null;
      let maxRadius = 0;
        for (const obj of scene._objects) {
        if (obj instanceof Sphere && obj.radius > maxRadius) {
          maxRadius = obj.radius;
          groundSphere = obj;
        }
      }
      
      expect(groundSphere).not.toBeNull();
      expect(groundSphere!.center.y).toBeCloseTo(customOptions.groundY!);
      expect(groundSphere!.radius).toBeCloseTo(customOptions.groundRadius!);
    });
  });
});
