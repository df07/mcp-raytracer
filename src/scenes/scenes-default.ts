import { SceneData, MaterialObject, SceneObject, Vec3Array } from './sceneData.js';

/**
 * Generates the default scene data with various spheres demonstrating different materials.
 * 
 * @returns SceneData object that can be used to create a scene
 */
export function generateDefaultSceneData(): SceneData {
  // Create materials array
  const materials: MaterialObject[] = [];
  
  // Basic materials
  materials.push({ id: 'ground', material: { type: 'lambert', color: [0.4, 0.4, 0.0] } });
  materials.push({ id: 'blue',   material: { type: 'lambert', color: [0.1, 0.1, 0.9] } });
  
  // Glass and metals
  materials.push({ id: 'glass',  material: { type: 'glass', ior: 1.5 } });
  materials.push({ id: 'silver', material: { type: 'metal', color: [0.8, 0.8, 0.8], fuzz: 0.0 } });
  materials.push({ id: 'gold',   material: { type: 'metal', color: [0.8, 0.6, 0.2], fuzz: 0.5 } });
  
  // Layered materials (clear coat over base)
  materials.push({
    id: 'layered-paint',
    material: {
      type: 'layered',
      outer: { type: 'glass', ior: 1.5 },
      inner: { type: 'lambert', color: [0.7, 0.3, 0.3] }
    }
  });
  
  // Light material
  materials.push({ id: 'sun-light', material: { type: 'light', emit: [15.0, 14.0, 13.0] } });
  
  // Create objects array
  const objects: SceneObject[] = [];
  
  // Ground plane at y = 0 for intuitive coordinate system
  objects.push({ type: 'plane', pos: [0, 0, 0], u: [1, 0, 0], v: [0, 0, 1], material: 'ground' });
  
  // Main spheres demonstrating different materials
  objects.push({ type: 'sphere', pos: [0, 0.5, -1],  r: 0.5, material: 'layered-paint' });  
  objects.push({ type: 'sphere', pos: [-1, 0.5, -1], r: 0.5, material: 'silver' });  
  objects.push({ type: 'sphere', pos: [1, 0.5, -1],  r: 0.5, material: 'gold' });
  
  // Glass spheres demonstrating solid and hollow glass
  objects.push({ type: 'sphere', pos: [0.5, 0.25, -0.5], r: 0.25, material: 'glass' });

  // 3-layer glass sphere
  [{r: 0.25, material: 'glass'}, {r: -.24, material: 'glass'}, {r: 0.20, material: 'blue'}].map(v => {
    objects.push({ type: 'sphere', pos: [-0.5, 0.25, -0.5], ...v });
  });
  
  // Light sources
  // Quad light positioned above and to the left, angled to face the spheres
  objects.push({
    type: 'quad',
    pos: [-2, 3, 0],         // Position above and left of the spheres
    u: [1, 0, 0],            // 1 unit wide (horizontal edge)
    v: [0, -0.707, -0.707],  // Angled down and forward at 45 degrees
    material: 'sun-light',
    light: true
  });
  
  // Sun-like sphere high in the sky but out of direct view
  objects.push({ type: 'sphere', pos: [30, 30.5, 15], r: 10, material: 'sun-light', light: true });
  
  // Camera configuration  
  return {
    camera: { 
      vfov: 40, aperture: 0.05, focus: 2.8,
      from: [0, 0.75, 2], at: [0, 0.5, -1], up: [0, 1, 0],
      background: { type: 'gradient', top: [1, 1, 1], bottom: [0.5, 0.7, 1.0] }
    },
    materials,
    objects,
    metadata: {
      name: 'Default Scene',
      description: 'A scene with various spheres demonstrating different materials including layered, mixed, and basic materials',
      version: '2.0'
    }
  };
}
