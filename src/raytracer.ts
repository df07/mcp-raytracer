import sharp from 'sharp';

/**
 * Generates a PNG image buffer representing a color gradient.
 *
 * @param imageWidth The width of the image in pixels.
 * @param imageHeight The height of the image in pixels.
 * @returns A Promise resolving to a Buffer containing the PNG image data.
 */
export async function generateGradientPngBuffer(imageWidth: number = 256, imageHeight: number = 256): Promise<Buffer> {
    // Create a flat buffer for raw pixel data (RGB)
    const pixelData = Buffer.alloc(imageWidth * imageHeight * 3);
    let offset = 0;

    for (let j = imageHeight - 1; j >= 0; --j) {
        for (let i = 0; i < imageWidth; ++i) {
            const r = i / (imageWidth - 1);  // Varies from 0.0 to 1.0 left-to-right
            const g = j / (imageHeight - 1); // Varies from 1.0 to 0.0 top-to-bottom
            const b = 0.25;                  // Fixed blue component

            const ir = Math.floor(255.999 * r);
            const ig = Math.floor(255.999 * g);
            const ib = Math.floor(255.999 * b);

            pixelData[offset++] = ir;
            pixelData[offset++] = ig;
            pixelData[offset++] = ib;
        }
    }

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