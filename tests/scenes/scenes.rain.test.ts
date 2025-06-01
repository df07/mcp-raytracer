import { Sphere } from '../../src/entities/sphere.js';
import { Metal } from '../../src/materials/metal.js';
import { generateRainSceneData, RainSceneOptions } from '../../src/scenes/scenes-rain.js';
import { generateScene } from '../../src/scenes/scenes.js';

describe('Rain Scene Generator', () => {
  describe('Rain Scene', () => {
    it('should generate a rain scene with the specified number of metallic spheres', () => {
      const rainOptions: RainSceneOptions = { count: 20, sphereRadius: 0.1 };
      const sceneData = generateRainSceneData(rainOptions);
      expect(sceneData.objects.length).toBe(21); // 20 rain spheres + 1 ground sphere
      expect(sceneData.objects.filter(o => o.type === 'sphere' && o.r === 0.1).length).toBe(20); // 20 rain spheres
    });
  });
});
