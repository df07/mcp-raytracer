import sharp from 'sharp';
import { Vec3, Color, Point3 } from './vec3.js';
// Ray import is no longer needed here
import { Sphere } from './sphere.js';
// Hittable import is no longer needed here
import { HittableList } from './hittableList.js';
// Interval import is no longer needed here
import { Camera } from './camera.js'; // Import the new Camera class


/**
 * Generates a PNG image buffer for the raytraced scene using the Camera class.
 *
 * @param imageWidth The desired width of the image.
 * @param verbose Log progress to stderr during generation.
 * @returns A Promise resolving to the PNG image buffer.
 */
export async function generateImageBuffer(
    imageWidth: number = 400,
    verbose: boolean = false
): Promise<Buffer> {
    // Image setup
    const aspectRatio = 16.0 / 9.0;
    const imageHeight = Math.max(1, Math.floor(imageWidth / aspectRatio));
    const channels = 3; // RGB - Camera.render uses 3 channels
    // Use Uint8ClampedArray as expected by Camera.render
    const pixelData = new Uint8ClampedArray(imageWidth * imageHeight * channels);

    // World setup
    const world = new HittableList();
    world.add(new Sphere(new Vec3(0, 0, -1), 0.5));
    world.add(new Sphere(new Vec3(0, -100.5, -1), 100));

    // Camera setup
    const vfov = 90; // Vertical field-of-view in degrees
    const lookfrom: Point3 = new Vec3(0, 0, 0); // Camera position
    const lookat: Point3 = new Vec3(0, 0, -1); // Point camera is looking at
    const vup = new Vec3(0, 1, 0); // Camera-relative "up" direction

    const camera = new Camera(imageWidth, imageHeight, vfov, lookfrom, lookat, vup, world);


    if (verbose) {
        console.error('Starting PNG render with Camera class...');
    }

    // Run the Camera's rendering logic
    camera.render(pixelData, verbose); // Pass pixelData and verbose flag

    if (verbose) {
        // The camera.render method already prints the final progress line
        console.error('Render complete via Camera. Generating PNG...');
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