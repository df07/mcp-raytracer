import { generateImageBuffer, RaytracerOptions } from '../src/raytracer.js';
import sharp from 'sharp';
import { SceneConfig } from '../src/scenes/scenes.js';
import { SceneData } from '../src/scenes/sceneData.js';

describe('Raytracer', () => {
    // Helper function to create a simple test scene
    function createTestSceneData(): SceneData {
        return {
            camera: {
                vfov: 40,
                from: [0, 0, 2],
                at: [0, 0, -1],
                up: [0, 1, 0],
                background: {
                    type: 'gradient',
                    top: [1, 1, 1],
                    bottom: [0.5, 0.7, 1.0]
                }
            },
            materials: [
                {
                    id: 'test-material',
                    material: { type: 'lambert', color: [0.7, 0.3, 0.3] }
                }
            ],
            objects: [
                {
                    type: 'sphere',
                    pos: [0, 0, -1],
                    r: 0.5,
                    material: 'test-material'
                }
            ]
        };
    }

    it('should generate a valid PNG buffer for custom scene', async () => {
        const sceneConfig: SceneConfig = {
            type: 'custom',
            data: createTestSceneData(),
            render: {
                imageWidth: 10,
                aspectRatio: 1.0,
                samples: 1
            }
        };

        const buffer = await generateImageBuffer(sceneConfig);
        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0);

        // Verify it's a valid PNG by parsing metadata
        const metadata = await sharp(buffer).metadata();
        expect(metadata.format).toBe('png');
        expect(metadata.width).toBe(10);
        expect(metadata.height).toBe(10);
    });

    it('should generate a valid PNG buffer for spheres scene', async () => {
        const sceneConfig: SceneConfig = {
            type: 'spheres',
            render: {
                imageWidth: 8,
                aspectRatio: 2.0,
                samples: 1
            },
            options: {
                count: 5,
                seed: 12345
            }
        };

        const buffer = await generateImageBuffer(sceneConfig);
        expect(buffer).toBeInstanceOf(Buffer);

        // Verify metadata
        const metadata = await sharp(buffer).metadata();
        expect(metadata.format).toBe('png');
        expect(metadata.width).toBe(8);
        expect(metadata.height).toBe(4); // 8 / 2.0 aspect ratio
    });

    it('should handle different image dimensions correctly', async () => {
        const testCases = [
            { width: 16, aspect: 1.0, expectedHeight: 16 },
            { width: 20, aspect: 2.0, expectedHeight: 10 },
            { width: 30, aspect: 1.5, expectedHeight: 20 }
        ];

        for (const { width, aspect, expectedHeight } of testCases) {
            const sceneConfig: SceneConfig = {
                type: 'custom',
                data: createTestSceneData(),
                render: {
                    imageWidth: width,
                    aspectRatio: aspect,
                    samples: 1
                }
            };

            const buffer = await generateImageBuffer(sceneConfig);
            const metadata = await sharp(buffer).metadata();
            
            expect(metadata.width).toBe(width);
            expect(metadata.height).toBe(expectedHeight);
        }
    });

    it('should handle different scene types', async () => {
        const sceneConfigs: SceneConfig[] = [
            {
                type: 'custom',
                data: createTestSceneData(),
                render: {
                    imageWidth: 6,
                    aspectRatio: 1.0,
                    samples: 1
                }
            },
            {
                type: 'spheres',
                render: {
                    imageWidth: 6,
                    aspectRatio: 1.0,
                    samples: 1
                },
                options: {
                    count: 3,
                    seed: 42
                }
            }
        ];

        for (const sceneConfig of sceneConfigs) {
            const buffer = await generateImageBuffer(sceneConfig);
            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBeGreaterThan(0);

            const metadata = await sharp(buffer).metadata();
            expect(metadata.format).toBe('png');
            expect(metadata.width).toBe(6);
            expect(metadata.height).toBe(6);
        }
    });

    it('should handle parallel rendering option', async () => {
        const sceneConfig: SceneConfig = {
            type: 'spheres',
            render: {
                imageWidth: 12,
                aspectRatio: 1.0,
                samples: 2
            },
            options: {
                count: 3,
                seed: 54321
            }
        };

        const buffer = await generateImageBuffer(sceneConfig, {
            parallel: true,
            threads: 2,
            verbose: false
        });

        expect(buffer).toBeInstanceOf(Buffer);

        const metadata = await sharp(buffer).metadata();
        expect(metadata.format).toBe('png');
        expect(metadata.width).toBe(12);
        expect(metadata.height).toBe(12);
    });

    it('should handle adaptive sampling', async () => {
        const sceneConfig: SceneConfig = {
            type: 'custom',
            data: createTestSceneData(),
            render: {
                imageWidth: 8,
                aspectRatio: 1.0,
                samples: 50,
                adaptiveTolerance: 0.1,
                adaptiveBatchSize: 5
            }
        };

        const buffer = await generateImageBuffer(sceneConfig, { verbose: false });
        expect(buffer).toBeInstanceOf(Buffer);

        const metadata = await sharp(buffer).metadata();
        expect(metadata.format).toBe('png');
        expect(metadata.width).toBe(8);
        expect(metadata.height).toBe(8);
    });
});

// Helper function to calculate expected height from width and aspect ratio
function heightFromAspect(width: number, aspectRatio: number): number {
    return Math.ceil(width / aspectRatio);
}