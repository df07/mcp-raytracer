import { CameraOptions } from "../camera.js";
import { HittableList } from "../geometry/hittableList.js";
import { Vec3 } from "../geometry/vec3.js";
import { Lambertian } from "../materials/lambertian.js";
import { SeededRandom } from "./scenes-utils.js";
import { Scene } from "./scenes.js";
import { Sphere } from "../entities/sphere.js";
import { Metal } from "../materials/metal.js";
import { Color } from "../geometry/vec3.js";
import { BVHNode } from "../geometry/bvh.js";
import { Camera } from "../camera.js";


/**
 * Options for rain scene generation
 */
export interface RainSceneOptions {
  count?: number;             // Number of raindrops (spheres) to generate
  sphereRadius?: number;      // Radius of the rain spheres
  seed?: number;              // Random seed for deterministic scene generation
}

/**
 * Generates a rain scene with evenly distributed metallic spheres.
 * 
 * @param cameraOpts Optional camera configuration
 * @param sceneOpts Optional scene configuration
 * @returns A Scene object containing the camera, world, and underlying object list
 */
export function generateRainScene(cameraOpts?: CameraOptions, sceneOpts?: RainSceneOptions): Scene {
  const worldList = new HittableList();
  
  // Default rain scene options
  const defaultRainOptions = {
    count: 50,
    sphereRadius: 0.05,
    width: 4,
    height: 3,
    depth: 2,
    centerPoint: new Vec3(0, 0, -2),
    metalFuzz: 0.1,
    groundSphere: true,
    groundY: -100.5,
    groundRadius: 100,
    groundMaterial: new Lambertian(new Color(0.1, 0.1, 0.1)),
    seed: Math.floor(Math.random() * 2147483647)
  };
  
  // Merge defaults with provided options
  const rainOpts = {
    ...defaultRainOptions,
    ...sceneOpts
  };
  
  // Initialize random number generator with the seed
  const random = new SeededRandom(rainOpts.seed);
  
  // Add ground sphere if specified
  if (rainOpts.groundSphere) {
    const groundCenter = new Vec3(0, rainOpts.groundY, 0);
    const groundMaterial = rainOpts.groundMaterial;
    const groundSphere = new Sphere(groundCenter, rainOpts.groundRadius, groundMaterial);
    worldList.add(groundSphere);
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
  const startX = rainOpts.centerPoint.x - totalGridWidth / 2 + xSpacing / 2;
  const startY = rainOpts.centerPoint.y - totalGridHeight / 2 + ySpacing / 2;
  const startZ = rainOpts.centerPoint.z - totalGridDepth / 2 + zSpacing / 2;
  
  // Create a list of all possible positions in the grid
  const positions: Vec3[] = [];
  for (let x = 0; x < spheresPerDimension; x++) {
    for (let y = 0; y < spheresPerDimension; y++) {
      for (let z = 0; z < spheresPerDimension; z++) {
        // Calculate position with small random offset for natural appearance
        const position = new Vec3(
          startX + x * xSpacing + (random.next() - 0.5) * xSpacing * 0.3,
          startY + y * ySpacing + (random.next() - 0.5) * ySpacing * 0.3,
          startZ + z * zSpacing + (random.next() - 0.5) * zSpacing * 0.3
        );
        positions.push(position);
      }
    }
  }
  
  // Shuffle the positions to ensure random distribution when taking a subset
  shuffleArray(positions, random);
  
  // Take only the number of positions we need
  const selectedPositions = positions.slice(0, rainOpts.count);
  
  // Create spheres at the selected positions
  for (const position of selectedPositions) {
    // Create a metallic material with slight color variation (silver/gray tones)
    const brightness = 0.7 + random.next() * 0.3; // 0.7-1.0 range for silver/gray
    const color = new Color(brightness, brightness, brightness);
    const fuzz = rainOpts.metalFuzz * random.next(); // Randomize fuzziness a bit
    const material = new Metal(color, fuzz);
    
    // Add the sphere to the world
    worldList.add(new Sphere(position, rainOpts.sphereRadius, material));
  }
  
  // Create BVH for efficient ray tracing
  const bvhWorld = BVHNode.fromList(worldList.objects);
  
  // Default camera options
  const defaultCameraOptions: CameraOptions = {
    vfov: 40,
    lookFrom: new Vec3(0, 0, 2),
    lookAt: rainOpts.centerPoint,
  };
  
  // Create camera
  const camera = new Camera(bvhWorld, { ...defaultCameraOptions, ...cameraOpts });
  
  // Create and return the scene
  return {
    camera: camera,
    world: bvhWorld,
    _objects: [...worldList.objects]
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