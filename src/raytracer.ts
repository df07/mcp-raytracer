import sharp from 'sharp';
import { Vec3, Color, Point3 } from './vec3.js';
import { Camera } from './camera.js';
import { generateRandomSphereScene, generateDefaultScene, SceneConfig, Scene, SceneOptions } from './sceneGenerator.js';

/**
 * Creates a scene based on the provided configuration.
 * 
 * @param sceneConfig Configuration for the scene to render
 * @param imageWidth Desired image width
 * @param samplesPerPixel Number of samples per pixel for anti-aliasing
 * @returns A Scene object containing camera, world, and objects
 */
function createScene(sceneConfig: SceneConfig, imageWidth: number, samplesPerPixel: number): Scene {
    // Prepare camera options
    const cameraOptions: SceneOptions = {
        camera: {
            imageWidth: imageWidth,
            samplesPerPixel: samplesPerPixel
        }
    };

    // Merge camera options with any provided options
    const options = sceneConfig.options 
        ? {
            ...cameraOptions,
            camera: {
                ...cameraOptions.camera,
                ...sceneConfig.options.camera
            },
            world: sceneConfig.options.world
        } 
        : cameraOptions;

    // Create scene based on configuration type
    if (sceneConfig.type === 'random') {
        return generateRandomSphereScene(sceneConfig.count, options);
    } else {
        return generateDefaultScene(options);
    }
}

/**
 * Generates a PNG image buffer for the raytraced scene using the Camera class.
 *
 * @param imageWidth The desired width of the image.
 * @param samplesPerPixel Number of samples per pixel for anti-aliasing (higher = better quality but slower).
 * @param verbose Log progress to stderr during generation.
 * @param sceneConfig Configuration for the scene to render.
 * @returns A Promise resolving to the PNG image buffer.
 */
export async function generateImageBuffer(
    imageWidth: number = 400,
    samplesPerPixel: number = 100,
    verbose: boolean = false,
    sceneConfig: SceneConfig = { type: 'default' }
): Promise<Buffer> {
    // Image setup
    const channels = 3; // RGB - Camera.render uses 3 channels
    
    // Create the scene based on configuration
    const scene = createScene(sceneConfig, imageWidth, samplesPerPixel);
    
    // Get the camera from the scene
    const camera = scene.camera;
      // Log scene creation if verbose
    if (verbose && sceneConfig.type === 'random') {
        console.error(`Generated random scene with ${(scene._objects || []).length} objects`);
    }
    
    // Set up the pixel data buffer with the correct dimensions
    const pixelData = new Uint8ClampedArray(camera.imageWidth * camera.imageHeight * channels);

    let startTime = Date.now();
    if (verbose) {
        console.error('Starting PNG render with Camera class...');
    }    // Run the Camera's rendering logic
    camera.render(pixelData, verbose); // Pass pixelData and verbose flag
    
    if (verbose) {
        const duration = Date.now() - startTime;
        console.error(`Rendered ${camera.imageWidth}x${camera.imageHeight} image with ${scene._objects.length} objects in ${duration}ms`);
    }

    if (pixelData.length === 0) {
        throw new Error('Generated pixelData buffer is empty before calling sharp.');
    }

    // Create PNG using sharp
    // Sharp expects a Buffer, so convert Uint8ClampedArray back to Buffer
    const buffer = Buffer.from(pixelData.buffer);
    return sharp(buffer, { // Use the converted buffer
        raw: {
            width: camera.imageWidth,
            height: camera.imageHeight,
            channels: channels, // Use 3 channels (RGB)
        },
    })
    .png()
    .toBuffer();
}