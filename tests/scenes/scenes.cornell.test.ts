import { CornellSceneOptions, generateCornellSceneData } from '../../src/scenes/scenes-cornell.js';

describe('Cornell Scene Generator', () => {
  describe('Cornell Scene', () => {
    it('should generate a Cornell scene with square aspect ratio', () => {
      const sceneData = generateCornellSceneData();
      expect(sceneData.render?.aspect).toBe(1.0);
    });

    it('should generate Cornell scene with empty variant', () => {
      const options: CornellSceneOptions = { variant: 'empty' };
      const sceneData = generateCornellSceneData(options);
      expect(sceneData.objects.length).toBe(6); // 5 walls + 1 light, no spheres
      expect(sceneData.objects.filter(o => o.type === 'quad').length).toBe(6); // 5 walls + 1 light
      expect(sceneData.objects.filter(o => o.light).length).toBe(1); // 1 light
      expect(sceneData.objects.filter(o => o.type === 'sphere').length).toBe(0); // 0 spheres
    });

    it('should generate Cornell scene with spheres variant', () => {
      const options: CornellSceneOptions = { variant: 'spheres' };
      const sceneData = generateCornellSceneData(options);
      expect(sceneData.objects.length).toBe(8); // 5 walls + 1 light + 2 spheres
      expect(sceneData.objects.filter(o => o.type === 'sphere').length).toBe(2); // Two spheres inside the box
    });    
  });
}); 