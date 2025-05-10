import { generateImageBuffer } from '../src/raytracer.js';
import sharp from 'sharp';
import { SceneConfig } from '../src/sceneGenerator.js';

describe('generateImageBuffer', () => {
    it('should produce a valid PNG buffer with default scene', async () => {
        const imageWidth = 10; // Smaller size for faster testing
        const imageHeight = Math.max(1, Math.floor(imageWidth / (16.0/9.0))); // Ensure height is at least 1
        const samples = 1;

        const buffer = await generateImageBuffer(imageWidth, samples, false, { type: 'default' }); // Generate buffer, no verbose logging

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
        // Expect the function call itself to reject with an error
        await expect(async () => {
            await generateImageBuffer(0, 1, false, { type: 'default' });
        }).rejects.toThrow();
    });
    
    it('should produce a valid PNG buffer with random scene', async () => {
        const imageWidth = 10; // Smaller size for faster testing
        const samples = 1;
        
        const sceneConfig: SceneConfig = {
            type: 'random',
            count: 5 // Keep the count small for test speed
        };

        const buffer = await generateImageBuffer(imageWidth, samples, false, sceneConfig);

        // Basic buffer checks
        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0);

        // Use sharp to validate PNG structure
        const metadata = await sharp(buffer).metadata();
        expect(metadata.format).toBe('png');
        expect(metadata.width).toBe(imageWidth);
    });

    // Add more tests as needed, e.g., testing specific pixel colors in the buffer
    // This would require decoding the PNG buffer, which adds complexity.
    // For now, validating format and dimensions is a good start.
});