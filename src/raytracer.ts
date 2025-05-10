import sharp from 'sharp';
import { Vec3, Color, Point3 } from './vec3.js';
// Ray import is no longer needed here
import { Sphere } from './sphere.js';
// Hittable import is no longer needed here
import { HittableList } from './hittableList.js';
// Interval import is no longer needed here
import { Camera } from './camera.js';
import { Lambertian } from './materials/lambertian.js';
import { Metal } from './materials/metal.js';

/**
 * Generates a PNG image buffer for the raytraced scene using the Camera class.
 *
 * @param imageWidth The desired width of the image.
 * @param verbose Log progress to stderr during generation.
 * @param samplesPerPixel Number of samples per pixel for anti-aliasing (higher = better quality but slower).
 * @returns A Promise resolving to the PNG image buffer.
 */
export async function generateImageBuffer(
    imageWidth: number = 400,
    samplesPerPixel: number = 100,
    verbose: boolean = false,
    useDefaultScene: boolean = true
): Promise<Buffer> {
    // Image setup
    const aspectRatio = 16.0 / 9.0;
    const imageHeight = Math.max(1, Math.floor(imageWidth / aspectRatio));
    const channels = 3; // RGB - Camera.render uses 3 channels
    // Use Uint8ClampedArray as expected by Camera.render
    const pixelData = new Uint8ClampedArray(imageWidth * imageHeight * channels);    // World setup
    const world = new HittableList();

    if (useDefaultScene) {
        // Create materials
        const materialGround = new Lambertian(new Vec3(0.8, 0.8, 0.0));  // Yellow-ish ground
        const materialCenter = new Lambertian(new Vec3(0.7, 0.3, 0.3));  // Reddish center
        const materialLeft = new Metal(new Vec3(0.8, 0.8, 0.8), 0.0);    // Shiny silver (no fuzz)
        const materialRight = new Metal(new Vec3(0.8, 0.6, 0.2), 0.5);   // Fuzzy gold

        // Create spheres with materials
        world.add(new Sphere(new Vec3(0, -100.5, -1), 100, materialGround)); // Ground sphere
        world.add(new Sphere(new Vec3(0, 0, -1), 0.5, materialCenter));      // Center sphere
        world.add(new Sphere(new Vec3(-1, 0, -1), 0.5, materialLeft));       // Left sphere (metal)
        world.add(new Sphere(new Vec3(1, 0, -1), 0.5, materialRight));       // Right sphere (fuzzy metal)
    }

    // Camera setup
    
    const vfov = 90; // Vertical field-of-view in degrees
    const lookfrom: Point3 = new Vec3(0, 0, 0); // Camera position
    const lookat: Point3 = new Vec3(0, 0, -1); // Point camera is looking at
    const vup = new Vec3(0, 1, 0); // Camera-relative "up" direction

    const camera = new Camera(imageWidth, imageHeight, vfov, lookfrom, lookat, vup, world, samplesPerPixel);

    let startTime = Date.now();
    if (verbose) {
        console.error('Starting PNG render with Camera class...');
    }

    // Run the Camera's rendering logic
    camera.render(pixelData, verbose); // Pass pixelData and verbose flag

    if (verbose) {
        const duration = Date.now() - startTime;
        console.error(`Rendered ${imageWidth}x${imageHeight} image with ${world.count} objects in ${duration}ms`);
    }

    if (pixelData.length === 0) {
        throw new Error('Generated pixelData buffer is empty before calling sharp.');
    }

    // Create PNG using sharp
    // Sharp expects a Buffer, so convert Uint8ClampedArray back to Buffer
    const buffer = Buffer.from(pixelData.buffer);
    return sharp(buffer, { // Use the converted buffer
        raw: {
            width: imageWidth,
            height: imageHeight,
            channels: channels, // Use 3 channels (RGB)
        },
    })
    .png()
    .toBuffer();
}