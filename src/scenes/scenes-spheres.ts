import { Camera } from "../camera.js";

import { Color, Vec3 } from "../geometry/vec3.js";

import { CameraOptions } from "../camera.js";
import { HittableList } from "../geometry/hittableList.js";
import { Point3 } from "../geometry/vec3.js";
import { SeededRandom } from "./scenes-utils.js";
import { Lambertian } from "../materials/lambertian.js";
import { Metal } from "../materials/metal.js";
import { Material } from "../materials/material.js";
import { Scene } from "./scenes.js";
import { Sphere } from "../entities/sphere.js";
import { Dielectric } from "../materials/dielectric.js";
import { BVHNode } from "../geometry/bvh.js";

/**
 * Represents a placed sphere with its properties
 */
interface PlacedSphere {
  center: Point3;
  radius: number;
}

/**
 * Options for spheres scene generation
 */
export interface SpheresSceneOptions {
  count?: number;         // Number of spheres to generate (default: 100)
  seed?: number;              // Random seed for deterministic scene generation
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
    centerPoint: Vec3.create(0, 0, -2),    // Center point matching default scene
    radius: 1.25,                       // Distribution radius around center point
    minSphereRadius: 0.1,               // Small enough to fit multiple spheres
    maxSphereRadius: 0.2,               // Large enough to be visible
    groundSphere: false,
    groundY: -100.5,                    // Match default scene ground position
    groundRadius: 100,                  // Match default scene ground radius
    groundMaterial: new Lambertian(Color.create(0.8, 0.8, 0.0)), // Match default yellow-ish ground
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
    lookFrom: Vec3.create(0, 0, 2),
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
 * Generates a random color
 */
function randomColor(random: SeededRandom): Vec3 {
  return Color.create(
    random.next(),
    random.next(),
    random.next()
  );
}
