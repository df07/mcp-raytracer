import sharp from 'sharp';
import { vec3, color, point3, unitVector } from './vec3.js'; // Added point3, unitVector
import { ray } from './ray.js'; // Added ray
import { Sphere } from './sphere.js'; // Chapter 5: Use Sphere class
/* Specs: vec3.md, ray.md, sphere.ts, raytracer.md */ // Updated spec references

/**
 * Writes the RGB components of a color vector to a buffer.
 *
 * @param pixelData The buffer to write to.
 * @param offset The starting offset in the buffer.
 * @param pixelColor The color vector (components expected in [0, 1]).
 * @returns The new offset after writing the color.
 */
function writeColorToBuffer(pixelData: Buffer, offset: number, pixelColor: color): number {
    let r = pixelColor.x();
    let g = pixelColor.y();
    let b = pixelColor.z();

    // Scale color components to [0, 255]
    const ir = Math.max(0, Math.min(255, Math.floor(255.999 * r)));
    const ig = Math.max(0, Math.min(255, Math.floor(255.999 * g)));
    const ib = Math.max(0, Math.min(255, Math.floor(255.999 * b)));

    pixelData[offset++] = ir;
    pixelData[offset++] = ig;
    pixelData[offset++] = ib;
    return offset;
}

/**
 * Determines the color seen along a given ray.
 * For now, returns a background gradient.
 *
 * @param r The ray being cast.
 * @returns The calculated color.
 */
function rayColor(r: ray): color {
    // Chapter 5: Define a sphere and check for intersection
    const testSphere = new Sphere(new vec3(0, 0, -1), 0.5);

    const t = testSphere.hit(r); // Call hit method on the instance
    if (t > 0.0) {
        // Ray hit the sphere, return red
        return new vec3(1, 0, 0);
    }

    // If no hit, return the background gradient
    const unitDirection = unitVector(r.direction());
    const gradientT = 0.5 * (unitDirection.y() + 1.0); // Scale y-component to [0, 1]
    // Linear blend (lerp): blendedValue = (1 - t) * startValue + t * endValue
    const white = new vec3(1.0, 1.0, 1.0);
    const lightBlue = new vec3(0.5, 0.7, 1.0);
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

    // Camera Setup
    const focalLength = 1.0;
    const viewportHeight = 2.0;
    const viewportWidth = viewportHeight * (imageWidth / imageHeight); // Use actual ratio
    const cameraCenter = new vec3(0, 0, 0);

    // Calculate viewport vectors
    const viewport_u = new vec3(viewportWidth, 0, 0);
    const viewport_v = new vec3(0, -viewportHeight, 0); // Viewport goes down from top-left

    // Calculate pixel delta vectors
    const pixelDelta_u = viewport_u.divide(imageWidth);
    const pixelDelta_v = viewport_v.divide(imageHeight);

    // Calculate the location of the upper-left pixel center
    // Start at camera, move to viewport plane, move to top-left corner, move to pixel center
    const viewportUpperLeft = cameraCenter
        .subtract(new vec3(0, 0, focalLength)) // Move to viewport plane
        .subtract(viewport_u.divide(2))      // Move to left edge
        .subtract(viewport_v.divide(2));     // Move to top edge (remember v points down)
    const pixel00_loc = viewportUpperLeft.add(pixelDelta_u.add(pixelDelta_v).multiply(0.5));

    // Rendering
    const pixelData = Buffer.alloc(imageWidth * imageHeight * 3);
    let offset = 0;
    const logInterval = Math.max(1, Math.floor(imageHeight / 10));

    if (verbose) console.error(`Generating ${imageWidth}x${imageHeight} image...`);

    // Iterate pixels Left-to-Right, Top-to-Bottom (j=row, i=column)
    for (let j = 0; j < imageHeight; ++j) { 
        if (verbose && (j % logInterval === 0)) {
            // Log scanlines completed (more intuitive than remaining)
            console.error(`Scanlines completed: ${j} / ${imageHeight}`); 
        }
        for (let i = 0; i < imageWidth; ++i) {
            const pixelCenter = pixel00_loc
                .add(pixelDelta_u.multiply(i)) // Move right by i pixels
                .add(pixelDelta_v.multiply(j)); // Move down by j pixels
            
            const rayDirection = pixelCenter.subtract(cameraCenter);
            const r = new ray(cameraCenter, rayDirection);

            const pixelColor = rayColor(r);
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