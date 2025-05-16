import { generateImageBuffer, RaytracerOptions } from '../src/raytracer.js';
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
        type: 'spheres',
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

    // Parallel rendering tests
    describe('Parallel rendering', () => {
        const parallelOptions: RaytracerOptions = {
            parallel: true,
            threads: 2
        };

        // Helper function to handle test failures more gracefully
        async function testParallelRendering(scene: SceneConfig, options: RaytracerOptions) {
            let buffer: Buffer;
            try {
                buffer = await generateImageBuffer(scene, options);
                
                // Basic buffer checks
                expect(buffer).toBeInstanceOf(Buffer);
                expect(buffer.length).toBeGreaterThan(0);
                
                // Validate PNG structure 
                const metadata = await sharp(buffer).metadata();
                expect(metadata.format).toBe('png');
                expect(metadata.width).toBe(scene.camera?.imageWidth);
                expect(metadata.height).toBe(scene.camera?.imageHeight);
                
                return buffer;
            } catch (error) {
                console.error('Parallel rendering test failed:', error);
                throw error;
            }
        }

        it('should produce a valid PNG buffer in parallel mode with default scene', async () => {
            await testParallelRendering(defaultScene, parallelOptions);
        }, 10000); // Increase timeout to allow for worker initialization
        
        it('should produce a valid PNG buffer in parallel mode with random scene', async () => {
            await testParallelRendering(randomScene, parallelOptions);
        }, 10000); // Increase timeout
        
        // This test is optional, as we can't directly assert stats in tests
        it('should support adaptive sampling in parallel mode', async () => {
            // Create a scene with adaptive sampling enabled
            const adaptiveScene: SceneConfig = {
                type: 'spheres',
                camera: {
                    imageWidth: 20,
                    imageHeight: 15,
                    samples: 10,
                    adaptiveTolerance: 0.2, // High tolerance for faster convergence
                    adaptiveBatchSize: 1
                },
                options: {
                    count: 2, // Fewer for faster testing
                    seed: 42
                }
            };
            
            // Render in parallel mode 
            const buffer = await testParallelRendering(adaptiveScene, parallelOptions);
            
            // We can't easily assert on adaptive sampling stats in tests,
            // but we can verify we got a correctly rendered image
            const metadata = await sharp(buffer).metadata();
            expect(metadata.width).toBe(adaptiveScene.camera?.imageWidth);
            expect(metadata.height).toBe(adaptiveScene.camera?.imageHeight);
        }, 10000); // Longer timeout
    });
});