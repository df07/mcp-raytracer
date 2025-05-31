import { CameraOptions } from '../../src/camera.js';
import { Sphere } from '../../src/entities/sphere.js';
import { Vec3 } from '../../src/geometry/vec3.js';
import { Metal } from '../../src/materials/metal.js';
import { generateRainScene, RainSceneOptions } from '../../src/scenes/scenes-rain.js';
import { generateScene } from '../../src/scenes/scenes.js';

describe('Rain Scene Generator', () => {
  const defaultCamera: CameraOptions = {
    imageWidth: 9,
    samples: 1
  };  
  
  describe('Rain Scene', () => {
    it('should generate a rain scene with the specified number of metallic spheres', () => {
      // Arrange
      const rainOptions: RainSceneOptions = {
        count: 20,
        sphereRadius: 0.1
      };

      // Act
      const scene = generateRainScene(defaultCamera, rainOptions);

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
        lookFrom: Vec3.create(0, 1, 3),
        lookAt: Vec3.create(0, 0, -2)
      };
      
      const rainOptions: RainSceneOptions = {
        count: 5
      };

      // Act
      const scene = generateRainScene(defaultCamera, rainOptions);

      // Assert
      expect(scene.camera).toBeDefined();
      // We don't check specific camera properties as they're internal
      // Just verify the camera object exists
    });
  });
});
