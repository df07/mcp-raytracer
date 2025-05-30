/* Specs: cornell-scene.md */

import { Camera, CameraOptions } from "../camera.js";
import { Color, Vec3, Point3 } from "../geometry/vec3.js";
import { HittableList } from "../geometry/hittableList.js";
import { Lambertian } from "../materials/lambertian.js";
import { Metal } from "../materials/metal.js";
import { Dielectric } from "../materials/dielectric.js";
import { DiffuseLight } from "../materials/diffuseLight.js";
import { Scene } from "./scenes.js";
import { Sphere } from "../entities/sphere.js";
import { Quad } from "../entities/quad.js";
import { BVHNode } from "../geometry/bvh.js";

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
 * @param cameraOpts Optional camera configuration
 * @param sceneOpts Optional scene configuration
 * @returns A Scene object containing the camera, world, and underlying object list
 */
export function generateCornellScene(cameraOpts?: CameraOptions, sceneOpts?: CornellSceneOptions): Scene {
  const worldList = new HittableList();

  // Default options
  const defaultOptions: Required<CornellSceneOptions> = {
    variant: 'spheres'
  };

  const options = { ...defaultOptions, ...sceneOpts };

  // Cornell box configuration
  const boxSize = 2.0;
  const halfSize = boxSize / 2;

  // Create materials
  const redMaterial = new Lambertian(new Color(0.65, 0.05, 0.05));
  const greenMaterial = new Lambertian(new Color(0.12, 0.45, 0.15));
  const whiteMaterial = new Lambertian(new Color(0.73, 0.73, 0.73));
  const lightMaterial = new DiffuseLight(new Color(15, 15, 15));

  // Create Cornell box walls using quads
  
  // Left wall (red) - YZ plane at x = -halfSize
  const leftWall = new Quad(
    new Point3(-halfSize, -halfSize, -halfSize),  // Bottom-left corner
    new Vec3(0, boxSize, 0),                      // Up vector (height)
    new Vec3(0, 0, boxSize),                      // Forward vector (depth)
    redMaterial
  );
  worldList.add(leftWall);

  // Right wall (green) - YZ plane at x = halfSize
  const rightWall = new Quad(
    new Point3(halfSize, -halfSize, halfSize),    // Bottom-right corner (facing inward)
    new Vec3(0, boxSize, 0),                      // Up vector (height)
    new Vec3(0, 0, -boxSize),                     // Backward vector (depth, facing inward)
    greenMaterial
  );
  worldList.add(rightWall);

  // Back wall (white) - XY plane at z = -halfSize
  const backWall = new Quad(
    new Point3(-halfSize, -halfSize, -halfSize),  // Bottom-left corner
    new Vec3(boxSize, 0, 0),                      // Right vector (width)
    new Vec3(0, boxSize, 0),                      // Up vector (height)
    whiteMaterial
  );
  worldList.add(backWall);

  // Bottom wall (white) - XZ plane at y = -halfSize
  const bottomWall = new Quad(
    new Point3(-halfSize, -halfSize, -halfSize),  // Back-left corner
    new Vec3(boxSize, 0, 0),                      // Right vector (width)
    new Vec3(0, 0, boxSize),                      // Forward vector (depth)
    whiteMaterial
  );
  worldList.add(bottomWall);

  // Ceiling (white) - XZ plane at y = halfSize
  const ceiling = new Quad(
    new Point3(-halfSize, halfSize, halfSize),    // Front-left corner (facing downward)
    new Vec3(boxSize, 0, 0),                      // Right vector (width)
    new Vec3(0, 0, -boxSize),                     // Backward vector (depth, facing downward)
    whiteMaterial
  );
  worldList.add(ceiling);

  // Ceiling light (smaller than full ceiling for realistic lighting)
  const lightSize = boxSize * 0.3; // 30% of box size
  const ceilingLight = new Quad(
    new Point3(-lightSize/2, halfSize - 0.01, -lightSize/2),  // Slightly below ceiling
    new Vec3(lightSize, 0, 0),                                // Right vector
    new Vec3(0, 0, lightSize),                                // Forward vector
    lightMaterial
  );
  worldList.add(ceilingLight);

  // Add objects based on variant
  if (options.variant === 'spheres') {
    // Create materials for the two spheres inside the box
    const leftSphereMaterial = new Lambertian(new Color(0.6, 0.6, 0.6)); // White sphere
    const rightSphereMaterial = new Dielectric(Dielectric.GLASS_IOR); // Glass

    // Position the two spheres inside the box
    const sphereRadius = 0.3;
    const leftSphereCenter = new Point3(-halfSize * 0.4, -halfSize + sphereRadius, -halfSize * 0.3);
    const rightSphereCenter = new Point3(halfSize * 0.4, -halfSize + sphereRadius, halfSize * 0.3);

    // Add the two spheres inside the box
    worldList.add(new Sphere(leftSphereCenter, sphereRadius, leftSphereMaterial));
    worldList.add(new Sphere(rightSphereCenter, sphereRadius, rightSphereMaterial));
  }
  // For 'empty' variant, we don't add any objects inside the box

  // Create BVH for efficient ray tracing
  const bvhWorld = BVHNode.fromList(worldList.objects);

  // Default camera options for Cornell box view
  const defaultCameraOptions: CameraOptions = {
    vfov: 40,                                  // Increased FOV to see the entire box
    lookFrom: new Vec3(0, 0, halfSize * 4), // Moved camera further back
    lookAt: new Vec3(0, 0, 0),                 // Look at the center of the box
    vUp: new Vec3(0, 1, 0),                     // Up direction
    lights: [ceilingLight],
    backgroundTop: Color.BLACK,                 // No ambient light - black background
    backgroundBottom: Color.BLACK               // No ambient light - black background
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