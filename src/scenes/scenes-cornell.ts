/* Specs: cornell-scene.md */

import { SceneData, MaterialObject, SceneObject, Vec3Array } from './sceneData.js';

/**
 * Options for Cornell box scene generation
 */
export interface CornellSceneOptions {
  variant?: 'spheres' | 'empty';  // Cornell box variant (default: 'spheres')
}

/**
 * Generates a Cornell box scene with different variants.
 * Uses quad geometry for accurate Cornell box representation.
 * 
 * @param sceneOpts Optional scene configuration
 * @returns SceneData object that can be used to create a scene
 */
export function generateCornellSceneData(sceneOpts?: CornellSceneOptions): SceneData {
  // Default options
  const options = { variant: 'spheres' as const, ...sceneOpts };

  // Cornell box configuration
  const boxSize = 2.0;
  const halfSize = boxSize / 2;

  // Create materials array
  const materials: MaterialObject[] = [];
  
  materials.push({ id: 'red',   material: { type: 'lambert', color: [0.65, 0.05, 0.05] } });
  materials.push({ id: 'green', material: { type: 'lambert', color: [0.12, 0.45, 0.15] } });
  materials.push({ id: 'white', material: { type: 'lambert', color: [0.73, 0.73, 0.73] } });
  materials.push({ id: 'light', material: { type: 'light',   emit:  [15, 15, 15] } });

  // Add sphere materials for spheres variant
  if (options.variant === 'spheres') {
    materials.push({ id: 'sphere-white', material: { type: 'lambert', color: [0.6, 0.6, 0.6] } });
    materials.push({ id: 'sphere-glass', material: { type: 'glass', ior: 1.5 } });
  }

  // Create objects array
  const objects: SceneObject[] = [];

  // Cornell box walls using quads
  
  // Left wall (red) - YZ plane at x = -halfSize
  objects.push({
    type: 'quad',
    pos: [-halfSize, -halfSize, -halfSize],  // Bottom-left corner
    u: [0, boxSize, 0],                      // Up vector (height)
    v: [0, 0, boxSize],                      // Forward vector (depth)
    material: 'red'
  });

  // Right wall (green) - YZ plane at x = halfSize
  objects.push({
    type: 'quad',
    pos: [halfSize, -halfSize, halfSize],    // Bottom-right corner (facing inward)
    u: [0, boxSize, 0],                      // Up vector (height)
    v: [0, 0, -boxSize],                     // Backward vector (depth, facing inward)
    material: 'green'
  });

  // Back wall (white) - XY plane at z = -halfSize
  objects.push({
    type: 'quad',
    pos: [-halfSize, -halfSize, -halfSize],  // Bottom-left corner
    u: [boxSize, 0, 0],                      // Right vector (width)
    v: [0, boxSize, 0],                      // Up vector (height)
    material: 'white'
  });

  // Bottom wall (white) - XZ plane at y = -halfSize
  objects.push({
    type: 'quad',
    pos: [-halfSize, -halfSize, -halfSize],  // Back-left corner
    u: [boxSize, 0, 0],                      // Right vector (width)
    v: [0, 0, boxSize],                      // Forward vector (depth)
    material: 'white'
  });

  // Ceiling (white) - XZ plane at y = halfSize
  objects.push({
    type: 'quad',
    pos: [-halfSize, halfSize, halfSize],    // Front-left corner (facing downward)
    u: [boxSize, 0, 0],                      // Right vector (width)
    v: [0, 0, -boxSize],                     // Backward vector (depth, facing downward)
    material: 'white'
  });

  // Ceiling light (smaller than full ceiling for realistic lighting)
  const lightSize = boxSize * 0.3; // 30% of box size
  objects.push({
    type: 'quad',
    pos: [-lightSize/2, halfSize - 0.01, -lightSize/2],  // Slightly below ceiling
    u: [lightSize, 0, 0],                                // Right vector
    v: [0, 0, lightSize],                                // Forward vector
    material: 'light',
    light: true
  });

  // Add objects based on variant
  if (options.variant === 'spheres') {
    // Position the two spheres inside the box
    const sphereRadius = 0.3;
    const leftSpherePos: Vec3Array = [-halfSize * 0.4, -halfSize + sphereRadius, -halfSize * 0.3];
    const rightSpherePos: Vec3Array = [halfSize * 0.4, -halfSize + sphereRadius, halfSize * 0.3];

    // Add the two spheres inside the box
    objects.push({ type: 'sphere', pos: leftSpherePos, r: sphereRadius, material: 'sphere-white' });
    objects.push({ type: 'sphere', pos: rightSpherePos, r: sphereRadius, material: 'sphere-glass' });
  }
  // For 'empty' variant, we don't add any objects inside the box

  // Camera configuration for Cornell box view
  return {
    camera: { 
      vfov: 40, aperture: 0.0, focus: 1.0,
      from: [0, 0, halfSize * 4], at: [0, 0, 0], up: [0, 1, 0],
      background: { type: 'gradient', top: [0, 0, 0], bottom: [0, 0, 0] }  // Black background
    },
    render: {
      aspect: 1.0,  // Square aspect ratio for Cornell box
      roulette: true,      // russianRouletteEnabled
      rouletteDepth: 5     // russianRouletteDepth
    },
    materials,
    objects,
    metadata: {
      name: `Cornell Box (${options.variant})`,
      description: `Cornell box scene with ${options.variant === 'spheres' ? 'two spheres inside' : 'empty interior'}`,
      version: '2.0'
    }
  };
} 