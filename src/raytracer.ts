import sharp from 'sharp';
import { generateScene, SceneConfig } from './sceneGenerator.js';

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
    sceneConfig: SceneConfig = { type: 'default' }, 
    verbose: boolean = false,
): Promise<Buffer> {
    // Image setup
    const channels = 3; // RGB - Camera.render uses 3 channels
    
    let startTime = Date.now();
    // Create the scene based on configuration
    const scene = generateScene(sceneConfig);
    
    // Get the camera from the scene
    const camera = scene.camera;
      // Log scene creation if verbose
    if (verbose && sceneConfig.type === 'random') {
        console.error(`Generated random scene with ${(scene._objects || []).length} objects in ${Date.now() - startTime}ms`);
    }
    
    // Set up the pixel data buffer with the correct dimensions
    const pixelData = new Uint8ClampedArray(camera.imageWidth * camera.imageHeight * channels);

    startTime = Date.now();
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