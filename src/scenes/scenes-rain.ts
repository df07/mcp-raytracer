import { SceneData, MaterialObject, SceneObject, Vec3Array } from './sceneData.js';
import { SeededRandom } from "./scenes-utils.js";

/**
 * Options for rain scene generation
 */
export interface RainSceneOptions {
  count?: number;             // Number of raindrops (spheres) to generate
  sphereRadius?: number;      // Radius of the rain spheres
  seed?: number;              // Random seed for deterministic scene generation
}

/**
 * Generates rain scene data with metallic spheres falling from the sky.
 * 
 * @param sceneOpts Optional scene configuration
 * @returns SceneData object that can be used to create a scene
 */
export function generateRainSceneData(sceneOpts?: RainSceneOptions): SceneData {
  // Default rain scene options
  const defaultRainOptions = {
    count: 50,
    sphereRadius: 0.05,
    width: 4,
    height: 3,
    depth: 2,
    centerPoint: [0, 0, -2] as Vec3Array,
    metalFuzz: 0.1,
    groundSphere: true,
    groundY: -100.5,
    groundRadius: 100,
    seed: Math.floor(Math.random() * 2147483647)
  };
  
  // Merge defaults with provided options
  const rainOpts = {
    ...defaultRainOptions,
    ...sceneOpts
  };
  
  // Initialize random number generator with the seed
  const random = new SeededRandom(rainOpts.seed);
  
  // Create materials array
  const materials: MaterialObject[] = [];
  
  // Add ground material if ground sphere is enabled
  if (rainOpts.groundSphere) {
    materials.push({ id: 'ground', material: { type: 'lambert', color: [0.1, 0.1, 0.1] } });
  }
  
  // Create objects array
  const objects: SceneObject[] = [];
  
  // Add ground sphere if specified
  if (rainOpts.groundSphere) {
    objects.push({
      type: 'sphere',
      pos: [0, rainOpts.groundY, 0],
      r: rainOpts.groundRadius,
      material: 'ground'
    });
  }
  
  // Calculate the number of spheres per dimension for an even distribution
  // Calculate for a slightly larger grid to ensure even distribution
  const spheresPerDimension = Math.ceil(Math.pow(rainOpts.count, 1/3));
  
  // Calculate spacing between spheres
  const xSpacing = rainOpts.width / spheresPerDimension;
  const ySpacing = rainOpts.height / spheresPerDimension;
  const zSpacing = rainOpts.depth / spheresPerDimension;
  
  // Calculate the total size of the grid
  const totalGridWidth = spheresPerDimension * xSpacing;
  const totalGridHeight = spheresPerDimension * ySpacing;
  const totalGridDepth = spheresPerDimension * zSpacing;
  
  // Calculate the starting position to ensure the grid is centered at centerPoint
  const startX = rainOpts.centerPoint[0] - totalGridWidth / 2 + xSpacing / 2;
  const startY = rainOpts.centerPoint[1] - totalGridHeight / 2 + ySpacing / 2;
  const startZ = rainOpts.centerPoint[2] - totalGridDepth / 2 + zSpacing / 2;
  
  // Create a list of all possible positions in the grid
  const positions: Vec3Array[] = [];
  for (let x = 0; x < spheresPerDimension; x++) {
    for (let y = 0; y < spheresPerDimension; y++) {
      for (let z = 0; z < spheresPerDimension; z++) {
        // Calculate position with small random offset for natural appearance
        const position: Vec3Array = [
          startX + x * xSpacing + (random.next() - 0.5) * xSpacing * 0.3,
          startY + y * ySpacing + (random.next() - 0.5) * ySpacing * 0.3,
          startZ + z * zSpacing + (random.next() - 0.5) * zSpacing * 0.3
        ];
        positions.push(position);
      }
    }
  }
  
  // Shuffle the positions to ensure random distribution when taking a subset
  shuffleArray(positions, random);
  
  // Take only the number of positions we need
  const selectedPositions = positions.slice(0, rainOpts.count);
  
  // Create spheres at the selected positions
  for (let i = 0; i < selectedPositions.length; i++) {
    const position = selectedPositions[i];
    
    // Create a metallic material with slight color variation (silver/gray tones)
    const brightness = 0.7 + random.next() * 0.3; // 0.7-1.0 range for silver/gray
    const color: Vec3Array = [brightness, brightness, brightness];
    const fuzz = rainOpts.metalFuzz * random.next(); // Randomize fuzziness a bit
    
    const materialId = `rain-${i}`;
    materials.push({
      id: materialId,
      material: { type: 'metal', color, fuzz }
    });
    
    // Add the sphere to the objects array
    objects.push({
      type: 'sphere',
      pos: position,
      r: rainOpts.sphereRadius,
      material: materialId
    });
  }
  
  // Camera configuration
  return {
    camera: { 
      vfov: 40, aperture: 0.0, focus: 1.0,
      from: [0, 0, 2], at: rainOpts.centerPoint, up: [0, 1, 0],
      background: { type: 'gradient', top: [0.5, 0.7, 1.0], bottom: [1.0, 1.0, 1.0] }
    },
    materials,
    objects,
    metadata: {
      name: 'Rain Scene',
      description: `Scene with ${selectedPositions.length} metallic rain spheres (seed: ${rainOpts.seed})`,
      version: '2.0'
    }
  };
}

/**
 * Shuffles an array in-place using Fisher-Yates algorithm
 * @param array The array to shuffle
 * @param random The random number generator to use
 */
function shuffleArray<T>(array: T[], random: SeededRandom): void {
  for (let i = array.length - 1; i > 0; i--) {
    // Generate random index between 0 and i (inclusive)
    const j = Math.floor(random.next() * (i + 1));
    // Swap elements
    [array[i], array[j]] = [array[j], array[i]];
  }
}