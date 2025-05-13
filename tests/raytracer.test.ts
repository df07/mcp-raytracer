import { generateImageBuffer } from '../src/raytracer.js';
import sharp from 'sharp';
import { SceneConfig } from '../src/sceneGenerator.js';

describe('generateImageBuffer', () => {

    const defaultScene: SceneConfig = {
        type: 'default',
        camera: {
            imageWidth: 9,
            imageHeight: 6,
            samples: 1
        }
    }

    const zeroWidthScene: SceneConfig = {
        type: 'default',
        camera: {
            imageWidth: 0, // Invalid width
        }
    };

    const randomScene: SceneConfig = {
        type: 'random',
        camera: {
            imageWidth: 9,
            imageHeight: 6,
            samples: 1
        },
        options: {
            count: 1
        }
    };

    it('should produce a valid PNG buffer with default scene', async () => {
        const imageWidth = 9; // Smaller size for faster testing
        const imageHeight = 6; // Ensure height is at least 1
        const samples = 1;

        const buffer = await generateImageBuffer(defaultScene); // Generate buffer, no verbose logging

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
            await generateImageBuffer(zeroWidthScene);
        }).rejects.toThrow();
    });
    
    it('should produce a valid PNG buffer with random scene', async () => {

        const buffer = await generateImageBuffer(randomScene); // Generate buffer, no verbose logging

        // Basic buffer checks
        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0);

        // Use sharp to validate PNG structure
        const metadata = await sharp(buffer).metadata();
        expect(metadata.format).toBe('png');
        expect(metadata.width).toBe(randomScene.camera?.imageWidth);
        expect(metadata.height).toBe(randomScene.camera?.imageHeight);
    });

    // Add more tests as needed, e.g., testing specific pixel colors in the buffer
    // This would require decoding the PNG buffer, which adds complexity.
    // For now, validating format and dimensions is a good start.
});