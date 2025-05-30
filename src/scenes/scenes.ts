/* Specs: spheres-scene.md, rain-scene.md, cornell-scene.md */

import { Hittable } from '../geometry/hittable.js';
import { Camera, CameraOptions } from '../camera.js';
import { generateSpheresScene, SpheresSceneOptions } from './scenes-spheres.js';
import { generateRainScene, RainSceneOptions } from './scenes-rain.js';
import { generateCornellScene, CornellSceneOptions } from './scenes-cornell.js';
import { generateDefaultScene } from './scenes-default.js';

// re-export the options types for use in other files
export type { SpheresSceneOptions, RainSceneOptions, CornellSceneOptions };

export interface Scene {
    camera: Camera,
    world: Hittable,
    _objects: Hittable[]
}

/**
 * Scene configuration types
 */
export type SceneConfig = 
  | { type: 'default', camera?: CameraOptions }
  | { type: 'spheres', camera?: CameraOptions, options?: SpheresSceneOptions }
  | { type: 'rain', camera?: CameraOptions, options?: RainSceneOptions }
  | { type: 'cornell', camera?: CameraOptions, options?: CornellSceneOptions };

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
    } else if (sceneConfig.type === 'cornell') {
        return generateCornellScene(sceneConfig.camera, sceneConfig.options);
    } else {
        return generateDefaultScene(sceneConfig.camera);
    }
}


