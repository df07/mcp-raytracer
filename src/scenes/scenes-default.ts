import { CameraOptions } from "../camera.js";
import { Lambertian } from "../materials/lambertian.js";
import { Color, Vec3 } from "../geometry/vec3.js";
import { HittableList } from "../geometry/hittableList.js";
import { Sphere } from "../entities/sphere.js";
import { Plane } from "../entities/plane.js";
import { Quad } from "../entities/quad.js";
import { Dielectric } from "../materials/dielectric.js";
import { Metal } from "../materials/metal.js";
import { DiffuseLight } from "../materials/diffuseLight.js";
import { Camera } from "../camera.js";
import { Scene } from "./scenes.js";
import { BVHNode } from "../geometry/bvh.js";

/**
 * Generates the default scene with four spheres: ground, center, and two metal spheres.
 * 
 * @param options Optional configuration for scene generation
 * @returns A Scene object containing the camera, world, and underlying object list
 */
export function generateDefaultScene(cameraOpts?: CameraOptions): Scene {
  const worldList = new HittableList();
  
  // Create materials
  const materialGround = new Lambertian(new Color(0.4, 0.4, 0.0));  // Yellow-ish ground
  const materialRed = new Lambertian(new Color(0.7, 0.3, 0.3));
  const materialBlue = new Lambertian(new Color(0.1, 0.1, 0.9));
  const materialGlass = new Dielectric(Dielectric.GLASS_IOR);
  const materialSilver = new Metal(new Color(0.8, 0.8, 0.8), 0.0); // Shiny silver (no fuzz)
  const materialGold = new Metal(new Color(0.8, 0.6, 0.2), 0.5);   // Fuzzy gold
  
  // Create a bright sun-like light source - very bright (intensity > 1.0)
  const sunLight = new DiffuseLight(new Color(15.0, 14.0, 13.0));

  // Create spheres with materials
  // Ground plane at y = 0 for intuitive coordinate system
  const groundPlane = new Plane(
    new Vec3(0, 0, 0),       // Point on the plane (now at y=0)
    new Vec3(1, 0, 0),       // X direction (extends infinitely in X)
    new Vec3(0, 0, 1),       // Z direction (extends infinitely in Z)
    materialGround
  );
  worldList.add(groundPlane);
  worldList.add(new Sphere(new Vec3(0, 0.5, -1), 0.5, materialRed));         // Center sphere (moved up 0.5)
  worldList.add(new Sphere(new Vec3(-1, 0.5, -1), 0.5, materialSilver));     // Left sphere (moved up 0.5)
  worldList.add(new Sphere(new Vec3(1, 0.5, -1), 0.5, materialGold));        // Right sphere (moved up 0.5)
  const solidGlass = new Sphere(new Vec3(0.5, 0.25, -0.5), 0.25, materialGlass);  // Glass sphere (moved up 0.5)
  worldList.add(solidGlass);
  worldList.add(new Sphere(new Vec3(-0.5, 0.25, -0.5), 0.25, materialGlass)); // Right glass sphere (moved up 0.5)
  worldList.add(new Sphere(new Vec3(-0.5, 0.25, -0.5), -0.24, materialGlass)); // Hollow glass sphere (moved up 0.5)
  worldList.add(new Sphere(new Vec3(-0.5, 0.25, -0.5), 0.20, materialBlue));  // Blue sphere inside glass (moved up 0.5)
  
  // Add a quad light positioned above and to the side, out of camera view
  const quadLight = new Quad(
    new Vec3(-2, 2, 2),      // Position above and left of the spheres
    new Vec3(0, -1, -1),      // 1 unit wide (X direction)
    new Vec3(1, 1, 0),       // 1 unit deep (Z direction)
    sunLight                 // Use the same bright light material
  );
  worldList.add(quadLight);
  
  // Add a sun-like sphere high in the sky but out of direct view
  const sunSphere = new Sphere(new Vec3(30, 30.5, 15), 10, sunLight);  // Sun moved up 0.5
  worldList.add(sunSphere);

  // add a second light source 
  //const sunSphere2 = new Sphere(new Vec3(-30, -30, -15), 10, sunLight);
  //worldList.add(sunSphere2);

  // Default camera options that match the scene
  const defaultCameraOptions: CameraOptions = {
    vfov: 40,
    lookFrom: new Vec3(0, 0.75, 2),    // Camera moved up 0.5 to match new coordinate system
    lookAt: new Vec3(0, 0.5, -1),     // Look at point moved up 0.5 to center of spheres
    lights: [sunSphere, solidGlass, quadLight]  // Add quad light to the lights list
  };

  const bvhWorld = BVHNode.fromList(worldList.objects);
  
  // Create camera
  const camera = new Camera(worldList, { ...defaultCameraOptions, ...cameraOpts });

  // Create and return the scene
  return {
    camera: camera,
    world: bvhWorld,
    _objects: [...worldList.objects] // Create a copy of the objects array for testing
  };
}
