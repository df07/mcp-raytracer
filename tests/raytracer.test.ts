import { generateImageBuffer } from '../src/raytracer.js';
import sharp from 'sharp';

describe('generateImageBuffer', () => {
    it('should generate a PNG buffer without errors for default dimensions', async () => {
        // Arrange
        const expectedWidth = 400;
        const aspectRatio = 16.0 / 9.0;
        const expectedHeight = Math.max(1, Math.floor(expectedWidth / aspectRatio));

        // Act & Assert
        await expect(generateImageBuffer()).resolves.toBeInstanceOf(Buffer);
    });

    it('should generate a PNG buffer with the correct dimensions', async () => {
        // Arrange
        const expectedWidth = 400;
        const aspectRatio = 16.0 / 9.0;
        const expectedHeight = Math.max(1, Math.floor(expectedWidth / aspectRatio));
        let generatedBuffer: Buffer | null = null;

        // Act
        try {
            generatedBuffer = await generateImageBuffer();
        } catch (error) {
            // Fail test if buffer generation throws
            throw new Error(`Buffer generation failed: ${error}`);
        }

        // Assert
        expect(generatedBuffer).toBeInstanceOf(Buffer);

        // Use sharp to read metadata from the generated buffer
        if (!generatedBuffer) {
            throw new Error("Generated buffer is null, cannot check metadata");
        }
        const metadata = await sharp(generatedBuffer).metadata();

        expect(metadata.format).toBe('png');
        expect(metadata.width).toBe(expectedWidth);
        expect(metadata.height).toBe(expectedHeight);
        expect(metadata.channels).toBe(3); // Expect RGB
    });

    it('should handle the verbose flag without errors', async () => {
        // Act & Assert
        await expect(generateImageBuffer(false)).resolves.toBeInstanceOf(Buffer);
        // Note: This doesn't check stderr output, just that it runs.
        // Checking stderr would require more complex test setup (e.g., mocking console.error).
    });

    // Add more tests later if needed, e.g., for specific pixel values (harder now)
}); 