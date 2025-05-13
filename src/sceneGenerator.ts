/* Specs: random-scene.md */

import { Point3, Vec3 } from './vec3.js';
import { HittableList } from './hittableList.js';
import { Sphere } from './sphere.js';
import { Lambertian } from './materials/lambertian.js';
import { Metal } from './materials/metal.js';
import { Material } from './materials/material.js';
import { Hittable } from './hittable.js';
import { Camera, CameraOptions } from './camera.js';
import { BVHNode } from './bvh.js';

export interface Scene {
    camera: Camera,
    world: Hittable,
    _objects: Hittable[]
}

/**
 * Simple Seedable Pseudo-Random Number Generator
 * Based on a mulberry32 algorithm
 */
class SeededRandom {
  private seed: number;
  
  constructor(seed?: number) {
    this.seed = seed !== undefined ? seed : Math.floor(Math.random() * 2147483647);
  }
  
  /**
   * Generate a random number between 0 and 1
   */
  next(): number {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  
  /**
   * Generate a random number between min and max
   */
  nextInRange(min: number, max: number): number {
    return min + (max - min) * this.next();
  }
  
  /**
   * Generate a random vector in a unit sphere
   */
  randomInUnitSphere(): Vec3 {
    while (true) {
      const p = new Vec3(
        this.nextInRange(-1, 1),
        this.nextInRange(-1, 1),
        this.nextInRange(-1, 1)
      );
      
      if (p.lengthSquared() < 1) {
        return p;
      }
    }
  }
  
  /**
   * Generate a random color
   */
  randomColor(): Vec3 {
    return new Vec3(
      this.next(),
      this.next(),
      this.next()
    );
  }
}

/**
 * Options for random scene generation
 */
export interface RandomSceneOptions {
  count?: number;         // Number of spheres to generate (default: 100)
  centerPoint?: Point3;       // Center point for sphere distribution (default: 0,0,-1)
  radius?: number;            // Radius of the distribution area (default: 2)
  minSphereRadius?: number;   // Minimum radius for generated spheres (default: 0.05)
  maxSphereRadius?: number;   // Maximum radius of generated spheres (default: 0.2)
  groundSphere?: boolean;     // Whether to include a large ground sphere (default: true)
  groundY?: number;           // Y-position of the ground sphere (default: -1000)
  groundRadius?: number;      // Radius of the ground sphere (default: 1000)
  groundMaterial?: Material;  // Material for the ground sphere
  seed?: number;              // Random seed for deterministic scene generation
}

/**
 * Scene configuration types
 */
export type SceneConfig = 
  | { type: 'default', camera?: CameraOptions }
  | { type: 'random', camera?: CameraOptions, options?: RandomSceneOptions };

/**
 * Represents a placed sphere with its properties
 */
interface PlacedSphere {
  center: Point3;
  radius: number;
}

/**
 * Creates a scene based on the provided configuration.
 * 
 * @param sceneConfig Configuration for the scene to render
 * @param imageWidth Desired image width
 * @param samplesPerPixel Number of samples per pixel for anti-aliasing
 * @returns A Scene object containing camera, world, and objects
 */
export function generateScene(sceneConfig: SceneConfig): Scene {
    // Create scene based on configuration type
    if (sceneConfig.type === 'random') {
        return generateRandomSphereScene(sceneConfig.camera, sceneConfig.options);
    } else {
        return generateDefaultScene(sceneConfig.camera);
    }
}

/**
 * Generates a random sphere scene with the specified number of spheres.
 * Spheres are distributed randomly within a spherical volume and don't overlap.
 * 
 * @param count Number of spheres to generate
 * @param options Optional configuration for scene generation
 * @returns A Scene object containing the camera, world, and underlying object list
 */
export function generateRandomSphereScene(cameraOpts?: CameraOptions, sceneOpts?: RandomSceneOptions): Scene {
  const worldList = new HittableList();
  const placedSpheres: PlacedSphere[] = [];

  // Default world options
  const defaultWorldOptions: Required<RandomSceneOptions> = {
    count: 10,
    centerPoint: new Vec3(0, 0, -2),    // Center point matching default scene
    radius: 1.25,                       // Distribution radius around center point
    minSphereRadius: 0.1,               // Small enough to fit multiple spheres
    maxSphereRadius: 0.2,               // Large enough to be visible
    groundSphere: false,
    groundY: -100.5,                    // Match default scene ground position
    groundRadius: 100,                  // Match default scene ground radius
    groundMaterial: new Lambertian(new Vec3(0.8, 0.8, 0.0)), // Match default yellow-ish ground
    seed: Math.floor(Math.random() * 2147483647) // Random seed by default
  };
    // Merge defaults with provided options
  const worldOpts: Required<RandomSceneOptions> = {
    ...defaultWorldOptions,
    ...sceneOpts
  };
  
  // Initialize our random number generator with the seed
  const random = new SeededRandom(worldOpts.seed);
    
  // Add ground sphere if specified
  if (worldOpts.groundSphere) {
    const groundCenter = new Vec3(0, worldOpts.groundY, 0);
    const groundMaterial = worldOpts.groundMaterial;
    const groundSphere = new Sphere(groundCenter, worldOpts.groundRadius, groundMaterial);
    worldList.add(groundSphere);
    placedSpheres.push({
      center: groundCenter,
      radius: worldOpts.groundRadius
    });
  }
  
  // Calculate the maximum radius based on the number of spheres
  // As sphere count increases, maximum radius decreases to allow more spheres to fit
  const scaleFactor = Math.max(worldOpts.minSphereRadius, 1 - Math.log10(worldOpts.count + 1) / 4);
  const adjustedMaxRadius = worldOpts.maxSphereRadius * scaleFactor;
  
  // Generate random spheres
  let attempts = 0;
  const maxAttempts = worldOpts.count * 100; // Limit total attempts to prevent infinite loops
  let spheresCreated = 0;
  
  while (spheresCreated < worldOpts.count && attempts < maxAttempts) {
    attempts++;
    
    // Calculate random sphere parameters
    const radius = adjustedMaxRadius;
    const sphereCenter = randomPointInSphere(worldOpts.centerPoint, worldOpts.radius, random);
      
    // Check if this sphere overlaps with any existing sphere or the ground
    if (checkOverlap(sphereCenter, radius, placedSpheres)) {
      continue; // Try again with a new position
    }
    
    // Generate a random material
    const material = generateRandomMaterial(random);
    
    // Add the sphere to the world
    worldList.add(new Sphere(sphereCenter, radius, material));
    
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
  
  // Create BVH for efficient ray tracing
  const bvhWorld = BVHNode.fromList(worldList.objects);

  // Create camera
  const camera = new Camera(bvhWorld, cameraOpts);

  // Create and return the scene
  return {
    camera: camera,
    world: worldList, // Use BVH for efficient ray tracing
    _objects: [...worldList.objects] // Create a copy of the objects array for testing
  };
}

/**
 * Checks if a new sphere would overlap with any existing spheres
 */
function checkOverlap(center: Point3, radius: number, placedSpheres: PlacedSphere[], groundY?: number): boolean {
  // Check overlap with existing spheres
  for (const sphere of placedSpheres) {
    const distance = center.subtract(sphere.center).length();
    if (distance < (radius + sphere.radius)) {
      return true; // Overlap detected
    }
  }
  
  // Check if sphere is below ground level (if ground exists)
  if (groundY !== undefined) {
    // Calculate distance from sphere center to ground plane
    const distanceToGroundPlane = center.y - groundY;
    
    // If the sphere extends below the ground plane, it would intersect with ground
    if (distanceToGroundPlane < radius) {
      return true; // Sphere would intersect with ground plane
    }
  }
  
  return false;
}

/**
 * Generates a random point within a sphere
 */
function randomPointInSphere(center: Point3, radius: number, random: SeededRandom): Point3 {
  // Generate random point in unit sphere
  const unitSpherePoint = random.randomInUnitSphere();
  
  // Scale by a factor between 0 and radius (for volume distribution)
  const distanceFactor = Math.pow(random.next(), 1/3) * radius;
  
  // Start with center point and add randomized offset
  let result = center.add(unitSpherePoint.multiply(distanceFactor));
  
  return result;
}

/**
 * Generates a random color
 */
function randomColor(random: SeededRandom): Vec3 {
  return new Vec3(
    random.next(),
    random.next(),
    random.next()
  );
}

/**
 * Generates a random material (70% Lambertian, 30% Metal)
 */
function generateRandomMaterial(random: SeededRandom): Material {
  const materialType = random.next();
  
  // 70% chance of Lambertian
  if (materialType < 0.7) {
    return new Lambertian(randomColor(random));
  } 
  // 30% chance of Metal
  else {
    // Random fuzziness between 0.0 and 0.5
    const fuzz = random.next() * 0.5;
    return new Metal(randomColor(random), fuzz);
  }
}

/**
 * Generates the default scene with four spheres: ground, center, and two metal spheres.
 * 
 * @param options Optional configuration for scene generation
 * @returns A Scene object containing the camera, world, and underlying object list
 */
export function generateDefaultScene(cameraOpts?: CameraOptions): Scene {
  const worldList = new HittableList();
  
  // Create materials
  const materialGround = new Lambertian(new Vec3(0.8, 0.8, 0.0));  // Yellow-ish ground
  const materialCenter = new Lambertian(new Vec3(0.7, 0.3, 0.3));  // Reddish center
  const materialLeft = new Metal(new Vec3(0.8, 0.8, 0.8), 0.0);    // Shiny silver (no fuzz)
  const materialRight = new Metal(new Vec3(0.8, 0.6, 0.2), 0.5);   // Fuzzy gold

  // Create spheres with materials
  const groundSphere = new Sphere(new Vec3(0, -100.5, -1), 100, materialGround); // Ground sphere
  const centerSphere = new Sphere(new Vec3(0, 0, -1), 0.5, materialCenter);      // Center sphere
  const leftSphere = new Sphere(new Vec3(-1, 0, -1), 0.5, materialLeft);       // Left sphere (metal)
  const rightSphere = new Sphere(new Vec3(1, 0, -1), 0.5, materialRight);       // Right sphere (fuzzy metal)

  // Add spheres to the world
  worldList.add(groundSphere);
  worldList.add(centerSphere);
  worldList.add(leftSphere);
  worldList.add(rightSphere);
  
  // Create camera
  const camera = new Camera(worldList, cameraOpts);

  // Create and return the scene
  return {
    camera: camera,
    world: worldList,
    _objects: [...worldList.objects] // Create a copy of the objects array for testing
  };
}
