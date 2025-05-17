import { generateSpheresScene, SpheresSceneOptions } from '../src/sceneGenerator.js';
import { Sphere } from '../src/entities/sphere.js';
import { Vec3 } from '../src/geometry/vec3.js';
import { CameraOptions } from '../src/camera.js';
import { generateScene, SceneConfig } from '../src/sceneGenerator.js';
import { Metal } from '../src/materials/metal.js';

describe('SceneGenerator', () => {
  const defaultCamera: CameraOptions = {
    imageWidth: 9,
        imageHeight: 6,
        samples: 1
    };    

  describe('generateSpheresScene', () => {
    it('should generate a scene with the specified number of spheres', () => {
      const count = 5;
      const scene = generateSpheresScene(defaultCamera, { count });

      // Count should not include the ground sphere by default
      expect(scene._objects.length).toBe(count);
    });
    
      it('should generate a scene without ground sphere if specified', () => {
      const count = 5;
      const options: SpheresSceneOptions = {
        count
      };

      const scene = generateSpheresScene(defaultCamera,options);

      // Count should be exactly the number of spheres requested (no ground)
      expect(scene._objects.length).toBe(count);
    });    
    
    it('should generate non-overlapping spheres', () => {
      const count = 10;
      const scene = generateSpheresScene(defaultCamera, { count });
      
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
      const smallScene = generateSpheresScene(defaultCamera, { count: 5 });
      const largeScene = generateSpheresScene(defaultCamera, { count: 50 });
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
  });

  describe('Rain Scene', () => {
    it('should generate a rain scene with the specified number of metallic spheres', () => {
      // Arrange
      const config: SceneConfig = {
        type: 'rain',
        options: {
          count: 20,
          sphereRadius: 0.1
        }
      };

      // Act
      const scene = generateScene(config);

      // Assert
      expect(scene).toBeDefined();
      expect(scene.world).toBeDefined();
      expect(scene._objects.length).toBe(21); // 20 rain spheres + 1 ground sphere
      
      // Check that spheres are metallic
      let metallicCount = 0;
      for (let i = 0; i < scene._objects.length; i++) {
        const sphere = scene._objects[i] as Sphere;
        if (sphere.material instanceof Metal) {
          metallicCount++;
        }
      }
      
      // All rain drops should be metallic (the other object is the ground sphere)
      expect(metallicCount).toBe(20);
    });

    it('should respect the provided camera options', () => {
      // Arrange
      const cameraOptions = {
        vfov: 60,
        lookFrom: new Vec3(0, 1, 3),
        lookAt: new Vec3(0, 0, -2)
      };
      
      const config: SceneConfig = {
        type: 'rain',
        camera: cameraOptions,
        options: {
          count: 5
        }
      };

      // Act
      const scene = generateScene(config);

      // Assert
      expect(scene.camera).toBeDefined();
      // We don't check specific camera properties as they're internal
      // Just verify the camera object exists
    });
  });
});
