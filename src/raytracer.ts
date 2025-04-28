import sharp from 'sharp';
import { Vec3, Color, Point3 } from './vec3.js'; // Updated imports and names
import { Ray } from './ray.js'; // Updated import
import { Sphere } from './sphere.js';
import { HitRecord, Hittable } from './hittable.js';
import { HittableList } from './hittableList.js'; // Updated path to camelCase
/* Specs: vec3.md, ray.md, sphere.md, hittable.md, raytracer.md */

/**
 * Writes the RGB components of a color vector to a buffer.
 *
 * @param pixelData The buffer to write to.
 * @param offset The starting offset in the buffer.
 * @param pixelColor The color vector (components expected in [0, 1]).
 * @returns The new offset after writing the color.
 */
function writeColorToBuffer(pixelData: Buffer, offset: number, pixelColor: Color): number {
    // Use accessors
    let r = pixelColor.x;
    let g = pixelColor.y;
    let b = pixelColor.z;
    const ir = Math.max(0, Math.min(255, Math.floor(255.999 * r)));
    const ig = Math.max(0, Math.min(255, Math.floor(255.999 * g)));
    const ib = Math.max(0, Math.min(255, Math.floor(255.999 * b)));
    pixelData[offset++] = ir;
    pixelData[offset++] = ig;
    pixelData[offset++] = ib;
    return offset;
}

/**
 * Determines the color seen along a given ray by checking intersections with the world.
 *
 * @param r The ray being cast.
 * @param world The HittableList representing the scene.
 * @returns The calculated color.
 */
function rayColor(r: Ray, world: Hittable): Color {
    const hitRec = world.hit(r, 0.001, Infinity);

    if (hitRec !== null) {
        // Use accessor hitRec.normal
        const normalColor = hitRec.normal.add(new Vec3(1, 1, 1)).multiply(0.5);
        return normalColor;
    }

    // Use accessor r.direction
    const unitDirection = r.direction.unitVector();
    // Use accessor unitDirection.y
    const gradientT = 0.5 * (unitDirection.y + 1.0);
    const white = new Vec3(1.0, 1.0, 1.0);
    const lightBlue = new Vec3(0.5, 0.7, 1.0);
    return white.multiply(1.0 - gradientT).add(lightBlue.multiply(gradientT));
}

/**
 * Generates a PNG image buffer by tracing rays through a virtual camera.
 *
 * @param verbose Log progress to stderr if true.
 * @returns A Promise resolving to a Buffer containing the PNG image data.
 */
export async function generateImageBuffer(
    verbose: boolean = false
): Promise<Buffer> {
    // Image Dimensions
    const aspectRatio = 16.0 / 9.0;
    const imageWidth = 400;
    const imageHeight = Math.max(1, Math.floor(imageWidth / aspectRatio));

    // World Setup (Chapter 6)
    const world = new HittableList();
    // Add two spheres to the world
    world.add(new Sphere(new Vec3(0, 0, -1), 0.5)); // Sphere in front - Use vec3 constructor
    world.add(new Sphere(new Vec3(0, -100.5, -1), 100)); // Large sphere below - Use vec3 constructor

    // Camera Setup
    const focalLength = 1.0;
    const viewportHeight = 2.0;
    const viewportWidth = viewportHeight * (imageWidth / imageHeight); // Use actual ratio
    const cameraCenter = new Vec3(0, 0, 0); // Use vec3 constructor

    // Calculate viewport vectors
    const viewportU = new Vec3(viewportWidth, 0, 0);
    const viewportV = new Vec3(0, -viewportHeight, 0); // Viewport goes down from top-left

    // Calculate pixel delta vectors
    const pixelDeltaU = viewportU.divide(imageWidth);
    const pixelDeltaV = viewportV.divide(imageHeight);

    // Calculate the location of the upper-left pixel center
    // Start at camera, move to viewport plane, move to top-left corner, move to pixel center
    const viewportUpperLeft = cameraCenter
        .subtract(new Vec3(0, 0, focalLength)) // Move to viewport plane
        .subtract(viewportU.divide(2))      // Move to left edge
        .subtract(viewportV.divide(2));     // Move to top edge (remember v points down)
    const pixel00Loc = viewportUpperLeft.add(pixelDeltaU.add(pixelDeltaV).multiply(0.5));

    // Rendering
    const pixelData = Buffer.alloc(imageWidth * imageHeight * 3);
    let offset = 0;
    const logInterval = Math.max(1, Math.floor(imageHeight / 10));

    if (verbose) console.error(`Generating ${imageWidth}x${imageHeight} image...`);

    // Iterate pixels Left-to-Right, Top-to-Bottom (j=row, i=column)
    for (let row = 0; row < imageHeight; ++row) { 
        if (verbose && (row % logInterval === 0)) {
            // Log scanlines completed (more intuitive than remaining)
            console.error(`Scanlines completed: ${row} / ${imageHeight}`); 
        }
        for (let col = 0; col < imageWidth; ++col) {
            const pixelCenter = pixel00Loc
                .add(pixelDeltaU.multiply(col)) // Move right by i pixels
                .add(pixelDeltaV.multiply(row)); // Move down by j pixels
            
            const rayDirection = pixelCenter.subtract(cameraCenter);
            const r = new Ray(cameraCenter, rayDirection);

            // Pass the world object to rayColor
            const pixelColor = rayColor(r, world);
            offset = writeColorToBuffer(pixelData, offset, pixelColor);
        }
    }

    if (verbose) console.error(`Done generating image. Encoding to PNG...`);

    // Use sharp to create a PNG buffer from the raw pixel data
    const pngBuffer = await sharp(pixelData, {
        raw: {
            width: imageWidth,
            height: imageHeight,
            channels: 3, // RGB
        },
    })
    .png() // Specify PNG output format
    .toBuffer();

    if (verbose) console.error("PNG encoding complete.");

    return pngBuffer;
} 