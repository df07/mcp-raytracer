import { generateImageBuffer } from '../src/raytracer.js'; // Import generateImageBuffer instead of render
import sharp from 'sharp';

describe('generateImageBuffer', () => {
    it('should produce a valid PNG buffer', async () => {
        const imageWidth = 10; // Smaller size for faster testing
        const imageHeight = Math.max(1, Math.floor(imageWidth / (16.0/9.0))); // Ensure height is at least 1

        const buffer = await generateImageBuffer(imageWidth, false); // Generate buffer, no verbose logging

        // Basic buffer checks
        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0);

        // Use sharp to validate PNG structure and dimensions
        const metadata = await sharp(buffer).metadata();
        expect(metadata.format).toBe('png');
        expect(metadata.width).toBe(imageWidth);
        expect(metadata.height).toBe(imageHeight);
        expect(metadata.channels).toBe(3); // RGB
    });

    it('should throw an error for zero width', async () => {
        // Expect the function call itself to reject with the specific error
        await expect(generateImageBuffer(0, false))
            .rejects
            .toThrow();
    });

    // Add more tests as needed, e.g., testing specific pixel colors in the buffer
    // This would require decoding the PNG buffer, which adds complexity.
    // For now, validating format and dimensions is a good start.
});