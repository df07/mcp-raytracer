/* Specs: spheres-scene.md, rain-scene.md */

import { Point3, Vec3, Color } from './geometry/vec3.js';
import { HittableList } from './geometry/hittableList.js';
import { Sphere } from './entities/sphere.js';
import { Lambertian } from './materials/lambertian.js';
import { Metal } from './materials/metal.js';
import { Dielectric } from './materials/dielectric.js';
import { DiffuseLight } from './materials/diffuseLight.js';
import { Material } from './materials/material.js';
import { Hittable } from './geometry/hittable.js';
import { Camera, CameraOptions } from './camera.js';
import { BVHNode } from './geometry/bvh.js';

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
    return new Color(
      this.next(),
      this.next(),
      this.next()
    );
  }
}

/**
 * Options for spheres scene generation
 */
export interface SpheresSceneOptions {
  count?: number;         // Number of spheres to generate (default: 100)
  seed?: number;              // Random seed for deterministic scene generation
}

/**
 * Options for rain scene generation
 */
export interface RainSceneOptions {
  count?: number;             // Number of raindrops (spheres) to generate
  sphereRadius?: number;      // Radius of the rain spheres
  seed?: number;              // Random seed for deterministic scene generation
}

/**
 * Scene configuration types
 */
export type SceneConfig = 
  | { type: 'default', camera?: CameraOptions }
  | { type: 'spheres', camera?: CameraOptions, options?: SpheresSceneOptions }
  | { type: 'rain', camera?: CameraOptions, options?: RainSceneOptions };

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
    if (sceneConfig.type === 'spheres') {
        return generateSpheresScene(sceneConfig.camera, sceneConfig.options);
    } else if (sceneConfig.type === 'rain') {
        return generateRainScene(sceneConfig.camera, sceneConfig.options);
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
export function generateSpheresScene(cameraOpts?: CameraOptions, sceneOpts?: SpheresSceneOptions): Scene {
  const worldList = new HittableList();
  const placedSpheres: PlacedSphere[] = [];

  // Default world options
  const defaultWorldOptions = {
    count: 10,
    centerPoint: new Vec3(0, 0, -2),    // Center point matching default scene
    radius: 1.25,                       // Distribution radius around center point
    minSphereRadius: 0.1,               // Small enough to fit multiple spheres
    maxSphereRadius: 0.2,               // Large enough to be visible
    groundSphere: false,
    groundY: -100.5,                    // Match default scene ground position
    groundRadius: 100,                  // Match default scene ground radius
    groundMaterial: new Lambertian(new Color(0.8, 0.8, 0.0)), // Match default yellow-ish ground
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
  
  const defaultCameraOptions: CameraOptions = {
    vfov: 40,
    lookFrom: new Vec3(0, 0, 2),
    lookAt: worldOpts.centerPoint
  }

  // Create camera
  const camera = new Camera(bvhWorld, { ...defaultCameraOptions, ...cameraOpts });

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
  return new Color(
    random.next(),
    random.next(),
    random.next()
  );
}

/**
 * Generates a random material (60% Lambertian, 30% Metal, 10% Dielectric)
 */
function generateRandomMaterial(random: SeededRandom): Material {
  const materialType = random.next();
  
  // 60% chance of Lambertian
  if (materialType < 0.6) {
    return new Lambertian(randomColor(random));
  } 
  // 30% chance of Metal
  else if (materialType < 0.9) {
    // Random fuzziness between 0.0 and 0.5
    const fuzz = random.next() * 0.5;
    return new Metal(randomColor(random), fuzz);
  }
  // 10% chance of Dielectric
  else {
    // Random refractive index between 1.3 and 2.5
    // Covers typical glass (~1.5), water (1.33), diamond (2.4), etc.
    const refIndex = 1.3 + random.next() * 1.2;
    return new Dielectric(refIndex);
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
  const materialGround = new Lambertian(new Color(0.8, 0.8, 0.0));  // Yellow-ish ground
  const materialRed = new Lambertian(new Color(0.7, 0.3, 0.3));
  const materialBlue = new Lambertian(new Color(0.1, 0.1, 0.9));
  const materialGlass = new Dielectric(Dielectric.GLASS_IOR);
  const materialSilver = new Metal(new Color(0.8, 0.8, 0.8), 0.0); // Shiny silver (no fuzz)
  const materialGold = new Metal(new Color(0.8, 0.6, 0.2), 0.5);   // Fuzzy gold
  
  // Create a bright sun-like light source - very bright (intensity > 1.0)
  const sunLight = new DiffuseLight(new Color(15.0, 14.0, 13.0));

  // Create spheres with materials
  worldList.add(new Sphere(new Vec3(0, -100.5, -1), 100, materialGround)); // Ground sphere
  worldList.add(new Sphere(new Vec3(0, 0, -1), 0.5, materialRed));         // Center sphere
  worldList.add(new Sphere(new Vec3(-1,0,-1), 0.5, materialSilver));       // Left sphere (silver)
  worldList.add(new Sphere(new Vec3(1, 0, -1), 0.5, materialGold));        // Right sphere (fuzzy metal)
  worldList.add(new Sphere(new Vec3( 0.5, -0.25, -0.5), 0.25, materialGlass));// Left glass sphere (foreground)
  worldList.add(new Sphere(new Vec3(-0.5, -0.25, -0.5), 0.25, materialGlass)); // Right glass sphere (foreground)
  worldList.add(new Sphere(new Vec3(-0.5, -0.25, -0.5), -0.24, materialGlass)); // Right glass sphere (foreground)
  worldList.add(new Sphere(new Vec3(-0.5, -0.25, -0.5), 0.20, materialBlue));  // Blue sphere inside glass sphere
  
  // Add a sun-like sphere high in the sky but out of direct view
  worldList.add(new Sphere(new Vec3(30, 30, 15), 10, sunLight));

  // Create a hollow glass sphere by adding a negative sphere inside the left sphere
  // Using negative radius creates an inverted sphere with inward-facing normals
  //worldList.add(new Sphere(new Vec3(-1, 0, -1), -0.3, materialGlass)); // Inner sphere (negative radius)

  // Default camera options that match the scene
  const defaultCameraOptions: CameraOptions = {
    vfov: 40,
    lookFrom: new Vec3(0, 0, 2),
    lookAt: new Vec3(0, 0, -1)
  };
  
  // Create camera
  const camera = new Camera(worldList, { ...defaultCameraOptions, ...cameraOpts });

  // Create and return the scene
  return {
    camera: camera,
    world: worldList,
    _objects: [...worldList.objects] // Create a copy of the objects array for testing
  };
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
