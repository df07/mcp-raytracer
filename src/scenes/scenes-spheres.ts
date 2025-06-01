
import { SeededRandom } from "./scenes-utils.js";
import { SceneData, MaterialObject, SceneObject, Vec3Array } from './sceneData.js';

/**
 * Represents a placed sphere with its properties
 */
interface PlacedSphere {
  center: Vec3Array;
  radius: number;
}

/**
 * Options for spheres scene generation
 */
export interface SpheresSceneOptions {
  count?: number;         // Number of spheres to generate (default: 100)
  seed?: number;          // Random seed for deterministic scene generation
}

/**
 * Generates scene data with random spheres scattered around a central point.
 * 
 * @param sceneOpts Optional scene configuration
 * @returns SceneData object that can be used to create a scene
 */
export function generateSpheresSceneData(sceneOpts?: SpheresSceneOptions): SceneData {
  const placedSpheres: PlacedSphere[] = [];

  // Default world options
  const defaultWorldOptions = {
    count: 10,
    centerPoint: [0, 0, -2] as Vec3Array,    // Center point matching default scene
    radius: 1.25,                            // Distribution radius around center point
    minSphereRadius: 0.1,                    // Small enough to fit multiple spheres
    maxSphereRadius: 0.2,                    // Large enough to be visible
    seed: Math.floor(Math.random() * 2147483647) // Random seed by default
  };
  
  // Merge defaults with provided options
  const worldOpts = {
    ...defaultWorldOptions,
    ...sceneOpts
  };
  
  // Initialize our random number generator with the seed
  const random = new SeededRandom(worldOpts.seed);
  
  // Calculate the maximum radius based on the number of spheres
  // As sphere count increases, maximum radius decreases to allow more spheres to fit
  const scaleFactor = Math.max(worldOpts.minSphereRadius, 1 - Math.log10(worldOpts.count + 1) / 4);
  const adjustedMaxRadius = worldOpts.maxSphereRadius * scaleFactor;
  
  // Create materials array
  const materials: MaterialObject[] = [];
  
  // Create objects array
  const objects: SceneObject[] = [];
  
  // Generate random spheres
  let attempts = 0;
  const maxAttempts = worldOpts.count * 100; // Limit total attempts to prevent infinite loops
  let spheresCreated = 0;
  
  while (spheresCreated < worldOpts.count && attempts < maxAttempts) {
    attempts++;
    
    // Calculate random sphere parameters
    const radius = adjustedMaxRadius;
    const sphereCenter = randomPointInSphere(worldOpts.centerPoint, worldOpts.radius, random);
      
    // Check if this sphere overlaps with any existing sphere
    if (checkOverlap(sphereCenter, radius, placedSpheres)) {
      continue; // Try again with a new position
    }
    
    // Generate a random material and add it to materials array
    const materialId = `sphere-${spheresCreated}`;
    const material = generateRandomMaterialData(random);
    materials.push({ id: materialId, material });
    
    // Add the sphere to the objects array
    objects.push({
      type: 'sphere',
      pos: sphereCenter,
      r: radius,
      material: materialId
    });
    
    // Track the placed sphere
    placedSpheres.push({
      center: sphereCenter,
      radius: radius
    });
    
    spheresCreated++;
  }
  
  // If we couldn't place all requested spheres, log a warning
  if (spheresCreated < worldOpts.count) {
    console.error(`Warning: Could only place ${spheresCreated} out of ${worldOpts.count} requested spheres.`);
  }
  
  // Camera configuration
  return {
    camera: { 
      vfov: 40, aperture: 0.0, focus: 1.0,
      from: [0, 0, 2], at: worldOpts.centerPoint, up: [0, 1, 0],
      background: { type: 'gradient', top: [0.5, 0.7, 1.0], bottom: [1.0, 1.0, 1.0] }
    },
    materials,
    objects,
    metadata: {
      name: 'Random Spheres',
      description: `Scene with ${spheresCreated} randomly placed spheres (seed: ${worldOpts.seed})`,
      version: '2.0'
    }
  };
}

/**
 * Checks if a new sphere would overlap with any existing spheres
 */
function checkOverlap(center: Vec3Array, radius: number, placedSpheres: PlacedSphere[]): boolean {
  // Check overlap with existing spheres
  for (const sphere of placedSpheres) {
    const dx = center[0] - sphere.center[0];
    const dy = center[1] - sphere.center[1];
    const dz = center[2] - sphere.center[2];
    const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
    if (distance < (radius + sphere.radius)) {
      return true; // Overlap detected
    }
  }
  
  return false;
}

/**
 * Generates a random point within a sphere
 */
function randomPointInSphere(center: Vec3Array, radius: number, random: SeededRandom): Vec3Array {
  // Generate random point in unit sphere
  const unitSpherePoint = random.randomInUnitSphere();
  
  // Scale by a factor between 0 and radius (for volume distribution)
  const distanceFactor = Math.pow(random.next(), 1/3) * radius;
  
  // Start with center point and add randomized offset
  const result: Vec3Array = [
    center[0] + unitSpherePoint.x * distanceFactor,
    center[1] + unitSpherePoint.y * distanceFactor,
    center[2] + unitSpherePoint.z * distanceFactor
  ];
  
  return result;
}

/**
 * Generates a random material data (60% Lambertian, 30% Metal, 10% Dielectric)
 */
function generateRandomMaterialData(random: SeededRandom) {
  const materialType = random.next();
  
  // 60% chance of Lambertian
  if (materialType < 0.6) {
    return { type: 'lambert' as const, color: randomColor(random) };
  } 
  // 30% chance of Metal
  else if (materialType < 0.9) {
    // Random fuzziness between 0.0 and 0.5
    const fuzz = random.next() * 0.5;
    return { type: 'metal' as const, color: randomColor(random), fuzz };
  }
  // 10% chance of Dielectric
  else {
    // Random refractive index between 1.3 and 2.5
    // Covers typical glass (~1.5), water (1.33), diamond (2.4), etc.
    const ior = 1.3 + random.next() * 1.2;
    return { type: 'glass' as const, ior };
  }
}

/**
 * Generates a random color
 */
function randomColor(random: SeededRandom): Vec3Array {
  return [random.next(), random.next(), random.next()];
}
