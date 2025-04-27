import sharp from 'sharp';
import { vec3, color } from './vec3.js'; // Import vec3 and color

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
 * Generates a PNG image buffer representing a color gradient using vec3 for color.
 *
 * @param imageWidth The width of the image in pixels.
 * @param imageHeight The height of the image in pixels.
 * @returns A Promise resolving to a Buffer containing the PNG image data.
 */
export async function generateGradientPngBuffer(
    imageWidth: number = 256, 
    imageHeight: number = 256, 
    verbose: boolean = false
): Promise<Buffer> {
    // Create a flat buffer for raw pixel data (RGB)
    const pixelData = Buffer.alloc(imageWidth * imageHeight * 3);
    let offset = 0;
    const logInterval = Math.max(1, Math.floor(imageHeight / 10)); // Log roughly 10 times + first/last

    if (verbose) console.error(`Generating ${imageWidth}x${imageHeight} image...`);
    for (let j = imageHeight - 1; j >= 0; --j) {
        // Log progress every logInterval scanlines or for the last line (j=0)
        if (verbose && (j % logInterval === 0 || j === 0)) {
            console.error(`Scanlines remaining: ${j}`);
        }
        for (let i = 0; i < imageWidth; ++i) {
            const r = i / (imageWidth - 1);  // Varies from 0.0 to 1.0 left-to-right
            const g = j / (imageHeight - 1); // Varies from 1.0 to 0.0 top-to-bottom
            const b = 0.25;                  // Fixed blue component

            const pixelColor = new vec3(r, g, b); // Use vec3 constructor

            offset = writeColorToBuffer(pixelData, offset, pixelColor); // Write color using helper
        }
    }
    if (verbose) console.error("Done generating image.");

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

    return pngBuffer;
} 