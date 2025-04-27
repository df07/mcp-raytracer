import { generateGradientPngBuffer } from '../src/raytracer.js';
import sharp from 'sharp';

describe('generateGradientPngBuffer', () => {
    it('should generate a PNG buffer without errors for default dimensions', async () => {
        // Arrange
        const expectedWidth = 256;
        const expectedHeight = 256;

        // Act & Assert
        await expect(generateGradientPngBuffer()).resolves.toBeInstanceOf(Buffer);
    });

    it('should generate a PNG buffer with the correct dimensions', async () => {
        // Arrange
        const expectedWidth = 256;
        const expectedHeight = 256;
        let generatedBuffer: Buffer | null = null;

        // Act
        try {
            generatedBuffer = await generateGradientPngBuffer(expectedWidth, expectedHeight);
        } catch (error) {
            // Fail test if buffer generation throws
            throw new Error(`Buffer generation failed: ${error}`);
        }

        // Assert
        expect(generatedBuffer).toBeInstanceOf(Buffer);

        // Use sharp to read metadata from the generated buffer
        const metadata = await sharp(generatedBuffer).metadata();

        expect(metadata.format).toBe('png');
        expect(metadata.width).toBe(expectedWidth);
        expect(metadata.height).toBe(expectedHeight);
        expect(metadata.channels).toBe(3); // Expect RGB
    });

    // Add more tests later if needed, e.g., for specific pixel values or different dimensions
}); 