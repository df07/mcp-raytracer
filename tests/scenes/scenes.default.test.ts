import { generateDefaultSceneData } from '../../src/scenes/scenes-default.js';
import { SceneData } from '../../src/scenes/sceneData.js';

describe('Default Scene Generator', () => {
  describe('generateDefaultSceneData', () => {
    let sceneData: SceneData;

    beforeEach(() => {
      sceneData = generateDefaultSceneData();
    });

    it('should generate valid scene data structure', () => {
      expect(sceneData).toBeDefined();
      expect(sceneData.camera).toBeDefined();
      expect(sceneData.materials).toBeDefined();
      expect(sceneData.objects).toBeDefined();
      expect(sceneData.metadata).toBeDefined();
    });

    it('should have proper object configuration', () => {
      const { objects } = sceneData;
      
      expect(objects).toBeDefined();
      expect(objects.length).toBeGreaterThan(0);
      
      // Check for different object types
      const objectTypes = objects.map(obj => obj.type);
      expect(objectTypes).toContain('plane');
      expect(objectTypes).toContain('sphere');
      expect(objectTypes).toContain('quad');
    });

    it('should have light sources marked correctly', () => {
      const { objects } = sceneData;      
      expect(objects.filter(obj => obj.light === true).length).toBeGreaterThan(0);
    });

    it('should have valid sphere objects', () => {
      const { objects } = sceneData;
      
      const spheres = objects.filter(obj => obj.type === 'sphere');
      expect(spheres.length).toBeGreaterThan(0);
      
      spheres.forEach(sphere => {
        expect(sphere).toHaveProperty('pos');
        expect(sphere).toHaveProperty('r');
        expect(sphere).toHaveProperty('material');
        expect(Array.isArray((sphere as any).pos)).toBe(true);
        expect((sphere as any).pos.length).toBe(3);
        expect(typeof (sphere as any).r).toBe('number');
      });
    });

    it('should have valid plane objects', () => {
      const { objects } = sceneData;
      
      const planes = objects.filter(obj => obj.type === 'plane');
      expect(planes.length).toBeGreaterThan(0);
      
      planes.forEach(plane => {
        expect(plane).toHaveProperty('pos');
        expect(plane).toHaveProperty('u');
        expect(plane).toHaveProperty('v');
        expect(plane).toHaveProperty('material');
        expect(Array.isArray((plane as any).pos)).toBe(true);
        expect(Array.isArray((plane as any).u)).toBe(true);
        expect(Array.isArray((plane as any).v)).toBe(true);
      });
    });

    it('should have valid quad objects', () => {
      const { objects } = sceneData;
      
      const quads = objects.filter(obj => obj.type === 'quad');
      expect(quads.length).toBeGreaterThan(0);
      
      quads.forEach(quad => {
        expect(quad).toHaveProperty('pos');
        expect(quad).toHaveProperty('u');
        expect(quad).toHaveProperty('v');
        expect(quad).toHaveProperty('material');
        expect(Array.isArray((quad as any).pos)).toBe(true);
        expect(Array.isArray((quad as any).u)).toBe(true);
        expect(Array.isArray((quad as any).v)).toBe(true);
      });
    });
  });
});