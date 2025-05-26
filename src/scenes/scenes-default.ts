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
import { MixedMaterial } from "../materials/mixedMaterial.js";
import { LayeredMaterial } from "../materials/layeredMaterial.js";

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
  
  const paintedMetal = new MixedMaterial(
    new Lambertian(new Color(0.7, 0.3, 0.3)),  // Diffuse: red matte base
    new Metal(new Color(0.9, 0.9, 0.9), 0.1),  // Specular: white highlights with slight roughness
    0.95  // 95% diffuse, 5% specular
  );

  const layeredMetal = new LayeredMaterial(
    new Dielectric(Dielectric.GLASS_IOR),
    new Metal(new Color(0.7, 0.3, 0.3), 0.1)
  );

  const layeredPaint = new LayeredMaterial(
    new Dielectric(Dielectric.GLASS_IOR),
    new Lambertian(new Color(0.7, 0.3, 0.3))
  );
  
  // Plastic surface - balanced mix of diffuse and specular
  const plastic = new MixedMaterial(
    new Lambertian(new Color(0.2, 0.4, 0.8)),  // Diffuse: blue base color
    new Metal(new Color(1.0, 1.0, 1.0), 0.05), // Specular: very smooth white highlights
    0.5  // 50% diffuse, 50% specular
  );
  
  // Rough metallic surface - mostly specular with some diffuse scattering
  const roughMetal = new MixedMaterial(
    new Lambertian(new Color(0.1, 0.1, 0.1)),  // Diffuse: dark absorption
    new Metal(new Color(0.8, 0.8, 0.9), 0.3),  // Specular: metallic reflection with higher roughness
    0.2  // 20% diffuse, 80% specular
  );
  
  // Ceramic or porcelain - smooth surface with mixed properties
  const ceramic = new MixedMaterial(
    new Lambertian(new Color(0.9, 0.9, 0.9)),  // Diffuse: white base
    new Metal(new Color(1.0, 1.0, 1.0), 0.0),  // Specular: very smooth white highlights
    0.7  // 70% diffuse, 30% specular
  );
  
  // Worn wood with some gloss - subtle specular component
  const glossyWood = new MixedMaterial(
    new Lambertian(new Color(0.6, 0.4, 0.2)),  // Diffuse: brown wood color
    new Metal(new Color(0.8, 0.6, 0.4), 0.2),  // Specular: warm highlights with medium roughness
    0.85 // 85% diffuse, 15% specular
  );
  
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
  
  const centerSphere = new Sphere(new Vec3(0, 0.5, -1), 0.5, layeredPaint);
  const leftSphere = new Sphere(new Vec3(-1, 0.5, -1), 0.5, materialSilver);
  const rightSphere = new Sphere(new Vec3(1, 0.5, -1), 0.5, materialGold);
  const solidGlass = new Sphere(new Vec3(0.5, 0.25, -0.5), 0.25, materialGlass);  // Glass sphere (moved up 0.5)
  const hollowGlass = [
    new Sphere(new Vec3(-0.5, 0.25, -0.5), 0.25, materialGlass),
    new Sphere(new Vec3(-0.5, 0.25, -0.5), -0.24, materialGlass),
    new Sphere(new Vec3(-0.5, 0.25, -0.5), 0.20, materialBlue)
  ];

  [centerSphere, leftSphere, rightSphere, solidGlass, ...hollowGlass].forEach(sphere => {
    worldList.add(sphere);
  });
  
  // Add a quad light positioned above and to the left, angled to face the spheres
  const quadLight = new Quad(
    new Vec3(-2, 3, 0),       // Position above and left of the spheres
    new Vec3(1, 0, 0),        // 1 unit wide (horizontal edge)
    new Vec3(0, -0.707, -0.707), // Angled down and forward at 45 degrees (vertical edge)
    sunLight                  // Use the same bright light material
  );
  worldList.add(quadLight);
  
  // Add a sun-like sphere high in the sky but out of direct view
  const sunSphere = new Sphere(new Vec3(30, 30.5, 15), 10, sunLight);  // Sun moved up 0.5
  worldList.add(sunSphere);

  // add a second light source 
  //const sunSphere2 = new Sphere(new Vec3(-30, -30, -15), 10, sunLight);
  //worldList.add(sunSphere2);

  // Default camera options that match the scene
  const lookFrom = new Vec3(0, 0.75, 2);
  const defaultCameraOptions: CameraOptions = {
    vfov: 40,
    lookFrom: lookFrom,    // Camera moved up 0.5 to match new coordinate system
    lookAt: centerSphere.center,     // Look at point moved up 0.5 to center of spheres
    aperture: 0.05,                    // Small aperture for subtle depth of field
    focusDistance: lookFrom.distanceTo(centerSphere.center),               // Focus on the main spheres at distance ~3
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
