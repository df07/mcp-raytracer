/* Specs: random-scene.md */

import { Point3, Vec3 } from './vec3.js';
import { HittableList } from './hittableList.js';
import { Sphere } from './sphere.js';
import { Lambertian } from './materials/lambertian.js';
import { Metal } from './materials/metal.js';
import { Material } from './materials/material.js';

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
  centerPoint?: Point3;       // Center point for sphere distribution (default: 0,0,-1)
  radius?: number;            // Radius of the distribution area (default: 2)
  minSphereRadius?: number;   // Minimum radius for generated spheres (default: 0.05)
  maxSphereRadius?: number;   // Maximum radius for generated spheres (default: 0.2)
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
  | { type: 'default' }
  | { type: 'random', count: number, options?: RandomSceneOptions };

/**
 * Represents a placed sphere with its properties
 */
interface PlacedSphere {
  center: Point3;
  radius: number;
}

/**
 * Generates a random sphere scene with the specified number of spheres.
 * Spheres are distributed randomly within a spherical volume and don't overlap.
 * 
 * @param count Number of spheres to generate
 * @param options Optional configuration for scene generation
 * @returns A world (HittableList) containing all the generated spheres
 */
export function generateRandomSphereScene(count: number, options?: RandomSceneOptions): HittableList {
  const world = new HittableList();
  const placedSpheres: PlacedSphere[] = [];  // Default options
  const defaultOptions: Required<RandomSceneOptions> = {
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
  const opts: Required<RandomSceneOptions> = {
    ...defaultOptions,
    ...options
  };
  
  // Initialize our random number generator with the seed
  const random = new SeededRandom(opts.seed);
    // Add ground sphere if specified
  if (opts.groundSphere) {
    const groundCenter = new Vec3(0, opts.groundY, 0);
    const groundMaterial = opts.groundMaterial;
    const groundSphere = new Sphere(groundCenter, opts.groundRadius, groundMaterial);
    world.add(groundSphere);
    placedSpheres.push(groundSphere);
  }
  
  // Calculate the maximum radius based on the number of spheres
  // As sphere count increases, maximum radius decreases to allow more spheres to fit
  const scaleFactor = Math.max(opts.minSphereRadius, 1 - Math.log10(count + 1) / 4);
  const adjustedMaxRadius = opts.maxSphereRadius * scaleFactor;
  
  // Generate random spheres
  let attempts = 0;
  const maxAttempts = count * 100; // Limit total attempts to prevent infinite loops
  let spheresCreated = 0;
  
  while (spheresCreated < count && attempts < maxAttempts) {
    attempts++;
    
    // Calculate random sphere parameters
    const radius = adjustedMaxRadius;
    const sphereCenter = randomPointInSphere(opts.centerPoint, opts.radius, random);
      // Check if this sphere overlaps with any existing sphere or the ground
    if (checkOverlap(sphereCenter, radius, placedSpheres)) {
      continue; // Try again with a new position
    }
    
    // Generate a random material
    const material = generateRandomMaterial(random);
    
    // Add the sphere to the world
    world.add(new Sphere(sphereCenter, radius, material));
    
    // Track the placed sphere
    placedSpheres.push({
      center: sphereCenter,
      radius: radius
    });
    
    spheresCreated++;
  }
  
  // If we couldn't place all requested spheres, log a warning
  if (spheresCreated < count) {
    console.error(`Warning: Could only place ${spheresCreated} out of ${count} requested spheres.`);
  }
  
  return world;
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
