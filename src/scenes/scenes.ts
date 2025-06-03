/* Specs: spheres-scene.md, rain-scene.md, cornell-scene.md, scene-generator.md */

import { Camera, CameraOptions, RenderOptions } from '../camera.js';
import { DielectricData, MaterialData, SceneData, SceneObject } from './sceneData.js';
import { generateSpheresSceneData, SpheresSceneOptions } from './scenes-spheres.js';
import { generateRainSceneData, RainSceneOptions } from './scenes-rain.js';
import { generateCornellSceneData, CornellSceneOptions } from './scenes-cornell.js';
import { generateDefaultSceneData } from './scenes-default.js';
import { Hittable, PDFHittable } from '../geometry/hittable.js';
import { BVHNode } from '../geometry/bvh.js';
import { Vec3, Color } from '../geometry/vec3.js';
import { Sphere } from '../entities/sphere.js';
import { Plane } from '../entities/plane.js';
import { Quad } from '../entities/quad.js';
import { Material } from '../materials/material.js';
import { Lambertian } from '../materials/lambertian.js';
import { Metal } from '../materials/metal.js';
import { DiffuseLight } from '../materials/diffuseLight.js';
import { MixedMaterial } from '../materials/mixedMaterial.js';
import { Dielectric } from '../materials/dielectric.js';
import { LayeredMaterial } from '../materials/layeredMaterial.js';

// re-export the options types for use in other files
export type { SpheresSceneOptions, RainSceneOptions, CornellSceneOptions };

/**
 * Scene configuration types
 */
export type SceneConfig = 
  | { type: 'default', render?: RenderOptions }
  | { type: 'spheres', render?: RenderOptions, options?: SpheresSceneOptions }
  | { type: 'rain', render?: RenderOptions, options?: RainSceneOptions }
  | { type: 'cornell', render?: RenderOptions, options?: CornellSceneOptions }
  | { type: 'custom', data: SceneData, render?: RenderOptions };

/**
 * Creates a scene based on the provided configuration.
 * 
 * @param sceneConfig Configuration for the scene to render
 * @returns A Scene object containing camera, world, and objects
 */
export function generateSceneData(sceneConfig: SceneConfig): SceneData {
    switch (sceneConfig.type) {
        case 'default': return generateDefaultSceneData();
        case 'spheres': return generateSpheresSceneData(sceneConfig.options);
        case 'rain': return generateRainSceneData(sceneConfig.options);
        case 'cornell': return generateCornellSceneData(sceneConfig.options);
        case 'custom': return sceneConfig.data;
    }
}

export function generateScene(sceneConfig: SceneConfig): Camera {
    const sceneData = generateSceneData(sceneConfig);
    return createCameraFromSceneData(sceneData, sceneConfig.render);
}

/**
 * Creates a complete scene from scene data and render options
 */
export function createCameraFromSceneData(sceneData: SceneData, renderOptions?: RenderOptions): Camera {
    // Convert materials array to lookup map
    const materials: Record<string, any> = {};
    sceneData.materials?.forEach(({ id, material }) => {
        materials[id] = material;
    });

    // Convert scene objects to Hittables
    const objects = sceneData.objects.map(obj => createSceneObject(obj, materials));

    // Create world from objects
    const world = BVHNode.fromList(objects);

    // Extract light objects for importance sampling
    const lights: PDFHittable[] = [];
    sceneData.objects.forEach((objData, index) => {
        if (objData.light) {
        const obj = objects[index];
        if ('pdf' in obj) {
            lights.push(obj as PDFHittable);
        }
        }
    });

    // Convert scene data to camera data
    const cameraData: CameraOptions = {
        vfov: sceneData.camera.vfov,
        lookFrom: sceneData.camera.from ? Vec3.create(...sceneData.camera.from) : undefined,
        lookAt: sceneData.camera.at ? Vec3.create(...sceneData.camera.at) : undefined,
        vUp: sceneData.camera.up ? Vec3.create(...sceneData.camera.up) : undefined,
        aperture: sceneData.camera.aperture,
        focusDistance: sceneData.camera.focus,
        backgroundTop: sceneData.camera.background ? Color.create(...sceneData.camera.background.top) : undefined,
        backgroundBottom: sceneData.camera.background ? Color.create(...sceneData.camera.background.bottom) : undefined,
        lights: lights
    };

    // Merge scene render data with provided render data (provided data takes precedence)
    const finalRenderOptions: RenderOptions = {
        ...sceneData.render,
        ...renderOptions
    };

    // Create camera with separate lights parameter
    return new Camera(world, cameraData, finalRenderOptions);
}

/**
 * Creates a scene object from plain data
 */
export function createSceneObject(
    objectData: SceneObject, 
    materials: Record<string, MaterialData>
  ): Hittable {
    const material = createMaterial(objectData.material, materials);
    
    switch (objectData.type) {
      case 'sphere':
        return new Sphere(
          Vec3.create(...objectData.pos),
          objectData.r,
          material
        );
      case 'plane':
        return new Plane(
          Vec3.create(...objectData.pos),
          Vec3.create(...objectData.u),
          Vec3.create(...objectData.v),
          material
        );
      case 'quad':
        return new Quad(
          Vec3.create(...objectData.pos),
          Vec3.create(...objectData.u),
          Vec3.create(...objectData.v),
          material
        );
      default:
        throw new Error(`Unknown object type: ${(objectData as any).type}`);
    }
  }
  
  /**
   * Creates a material from plain data or material reference
   */
  export function createMaterial(
    materialRef: string | MaterialData, 
    materials: Record<string, MaterialData>
  ): Material {
    // Resolve material reference
    const materialData = typeof materialRef === 'string' 
      ? materials[materialRef] 
      : materialRef;
      
    if (!materialData) {
      throw new Error(`Material not found: ${materialRef}`);
    }
    
    switch (materialData.type) {
      case 'lambert':
        return new Lambertian(Color.create(...materialData.color));
      case 'metal':
        return new Metal(Color.create(...materialData.color), materialData.fuzz);
      case 'glass':
        return new Dielectric(materialData.ior);
      case 'light':
        return new DiffuseLight(Color.create(...materialData.emit));
      case 'mixed':
        return new MixedMaterial(
          createMaterial(materialData.diff, materials),
          createMaterial(materialData.spec, materials),
          materialData.weight
        );
      case 'layered':
        return new LayeredMaterial(
          createDielectric(materialData.outer, materials),
          createMaterial(materialData.inner, materials)
        );
      default:
        throw new Error(`Unknown material type: ${(materialData as any).type}`);
    }
  } 
  
  function createDielectric(
    materialRef: string | DielectricData, 
    materials: Record<string, MaterialData>
  ): Dielectric {
    const materialData = typeof materialRef === 'string' 
      ? materials[materialRef] 
      : materialRef;
  
    if (!materialData) {
      throw new Error(`Material not found: ${materialRef}`);
    }
  
    if (materialData.type !== 'glass') {
      throw new Error(`Material is not a dielectric: ${materialRef}`);
    }
  
    return new Dielectric(materialData.ior);
  }