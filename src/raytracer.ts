import sharp from 'sharp';
import { Vec3, Color, Point3 } from './vec3.js';
import { Ray } from './ray.js';
import { Sphere } from './sphere.js';
import { Hittable } from './hittable.js';
import { HittableList } from './hittableList.js';
import { Interval } from './interval.js';

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
 * Calculates the color of a ray.
 * If the ray hits an object, it computes the color based on the surface normal.
 * Otherwise, it returns a background gradient color.
 * @param r The ray.
 * @param world The hittable world.
 * @returns The color of the ray.
 */
export function rayColor(r: Ray, world: Hittable): Color {
  // Check if the ray hits any object in the world
  const rec = world.hit(r, new Interval(0, Infinity));

  if (rec !== null) {
    // If the ray hits an object, compute color based on the normal
    // Map normal components to RGB values (ranging from -1 to 1, shifted to 0 to 1)
    return rec.normal.add(new Vec3(1, 1, 1)).multiply(0.5);
  }

  // If the ray doesn't hit anything, compute background gradient color
  const unitDirection = r.direction.unitVector();
  const a = 0.5 * (unitDirection.y + 1.0);
  // Linear interpolation (lerp) between white and blue based on y-coordinate
  return new Vec3(1.0, 1.0, 1.0).multiply(1.0 - a).add(new Vec3(0.5, 0.7, 1.0).multiply(a));
}

/**
 * Core rendering logic: sets up camera, iterates through pixels, generates rays,
 * calculates color, and writes the color to the pixel data buffer.
 * Optionally logs progress to stderr.
 *
 * @param imageWidth Width of the image.
 * @param imageHeight Height of the image.
 * @param world The scene objects.
 * @param pixelData The buffer to write pixel data into.
 * @param verbose Whether to log progress to stderr.
 */
function renderScene(
    imageWidth: number,
    imageHeight: number,
    world: Hittable,
    pixelData: Buffer,
    verbose: boolean
): void {
    let offset = 0;
    // Camera setup
    const focalLength = 1.0;
    const viewportHeight = 2.0;
    const viewportWidth = viewportHeight * (imageWidth / imageHeight);
    const cameraCenter: Point3 = new Vec3(0, 0, 0);

    const viewportU = new Vec3(viewportWidth, 0, 0);
    const viewportV = new Vec3(0, -viewportHeight, 0); // Y points down

    const pixelDeltaU = viewportU.divide(imageWidth);
    const pixelDeltaV = viewportV.divide(imageHeight);

    const viewportUpperLeft = cameraCenter
        .subtract(new Vec3(0, 0, focalLength))
        .subtract(viewportU.divide(2))
        .subtract(viewportV.divide(2));
    const pixel00Loc = viewportUpperLeft.add(pixelDeltaU.add(pixelDeltaV).multiply(0.5));

    // Render loop
    for (let j = 0; j < imageHeight; ++j) {
        // Log progress if verbose
        if (verbose && j % 10 === 0) {
            process.stderr.write(`\rScanlines remaining: ${imageHeight - j} `);
        }
        for (let i = 0; i < imageWidth; ++i) {
            const pixelCenter = pixel00Loc
                .add(pixelDeltaU.multiply(i))
                .add(pixelDeltaV.multiply(j));
            const rayDirection = pixelCenter.subtract(cameraCenter);
            const r = new Ray(cameraCenter, rayDirection);

            const pixelColor = rayColor(r, world);
            offset = writeColorToBuffer(pixelData, offset, pixelColor); // Write color directly
        }
    }
}


/**
 * Generates a PNG image buffer for the raytraced scene.
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
    const channels = 3; // RGB
    const pixelData = Buffer.alloc(imageWidth * imageHeight * channels);

    // World setup (can be customized)
    const world = new HittableList();
    world.add(new Sphere(new Vec3(0, 0, -1), 0.5));
    world.add(new Sphere(new Vec3(0, -100.5, -1), 100));

    if (verbose) {
        console.error('Starting PNG render...');
    }

    // Run the core rendering logic
    renderScene(imageWidth, imageHeight, world, pixelData, verbose); // Pass pixelData and verbose flag

    if (verbose) {
        console.error('\nRender complete. Generating PNG...');
    }

    if (pixelData.length === 0) {
        throw new Error('Generated pixelData buffer is empty before calling sharp.');
    }

    // Create PNG using sharp
    return sharp(pixelData, {
        raw: {
            width: imageWidth,
            height: imageHeight,
            channels: channels,
        },
    })
    .png()
    .toBuffer();
}