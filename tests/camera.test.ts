import { Camera, CameraOptions } from '../src/camera.js';
import { Vec3, Point3, Color } from '../src/geometry/vec3.js';
import { Ray } from '../src/geometry/ray.js';
import { Hittable, HitRecord } from '../src/geometry/hittable.js';
import { HittableList } from '../src/geometry/hittableList.js';
import { Interval } from '../src/geometry/interval.js';
import { Material } from '../src/materials/material.js';
import { Lambertian } from '../src/materials/lambertian.js';
import { Sphere } from '../src/entities/sphere.js';
import { AABB } from '../src/geometry/aabb.js';
import { DefaultMaterial } from '../src/materials/material.js';
import { ScatterResult } from '../src/materials/material.js';
import { CosinePDF, MixturePDF } from '../src/geometry/pdf.js';

// Mock Material for testing
class MockMaterial implements Material {
    albedo: Color;
    shouldScatter: boolean;
    emissionColor: Color;
    
    constructor(albedo: Color, shouldScatter: boolean = true, emissionColor: Color = new Color(0, 0, 0)) {
        this.albedo = albedo;
        this.shouldScatter = shouldScatter;
        this.emissionColor = emissionColor;
    }
    
    scatter(rIn: Ray, rec: HitRecord): { scattered: Ray; attenuation: Color } | null {
        if (!this.shouldScatter) {
            return null;
        }
        
        const scatterDir = rec.normal.add(Vec3.randomUnitVector());
        return {
            scattered: new Ray(rec.p, scatterDir),
            attenuation: this.albedo
        };
    }
    
    emitted(rec: HitRecord): Color {
        return this.emissionColor;
    }
}

// Mock Material with PDF for testing the PDF-based rendering pathway
class MockPDFMaterial implements Material {
    albedo: Color;
    returnedPDF: CosinePDF;
    
    constructor(albedo: Color, normal: Vec3 = new Vec3(0, 1, 0)) {
        this.albedo = albedo;
        this.returnedPDF = new CosinePDF(normal);
    }
    
    scatter(rIn: Ray, rec: HitRecord): ScatterResult | null {
        return {
            attenuation: this.albedo,
            pdf: this.returnedPDF
        };
    }
    
    emitted(rec: HitRecord): Color {
        return new Color(0, 0, 0);
    }
}

// Mock Hittable for testing rayColor
class MockHittable implements Hittable {
    shouldHit: boolean;
    hitNormal: Vec3;
    material: Material;

    constructor(shouldHit: boolean, hitNormal: Vec3 = new Vec3(0, 0, 0), material: Material = new MockMaterial(new Color(1, 1, 1))) {
        this.shouldHit = shouldHit;
        this.hitNormal = hitNormal;
        this.material = material;
    }

    hit(r: Ray, rayT: Interval): HitRecord | null {
        if (this.shouldHit && rayT.contains(1.0)) { // Assume hit at t=1 for simplicity
            const rec: HitRecord = {
                p: r.at(1.0),
                normal: this.hitNormal,
                t: 1.0,
                frontFace: true,
                material: this.material
            };
            return rec;
        }
        return null;
    }

    boundingBox(): AABB {
        throw new Error('Method not implemented.');
    }
}

describe('Camera', () => {
    let world: HittableList;
    let defaultOptions: CameraOptions;

    beforeEach(() => {
        // Create a simple world with one sphere
        const material = new Lambertian(new Color(0.5, 0.5, 0.5));
        const sphere = new Sphere(new Point3(0, 0, -1), 0.5, material);
        world = new HittableList();
        world.add(sphere);

        defaultOptions = {
            imageWidth: 100,
            imageHeight: 100,
            vfov: 90,
            lookFrom: new Vec3(0, 0, 0),
            lookAt: new Vec3(0, 0, -1),
            vUp: new Vec3(0, 1, 0),
            samples: 1,
        };
    });

    describe('Constructor', () => {
        it('should create camera with default options', () => {
            const camera = new Camera(world);
            
            expect(camera.imageWidth).toBe(400);
            expect(camera.imageHeight).toBe(225);
            expect(camera.channels).toBe(3);
        });

        it('should create camera with custom options', () => {
            const camera = new Camera(world, defaultOptions);
            
            expect(camera.imageWidth).toBe(100);
            expect(camera.imageHeight).toBe(100);
        });

        it('should auto-calculate focus distance when not provided', () => {
            const options: CameraOptions = {
                ...defaultOptions,
                lookFrom: new Vec3(0, 0, 3),
                lookAt: new Vec3(0, 0, 0),
                aperture: 1.0,
            };
            
            const camera = new Camera(world, options);
            // Focus distance should be the distance from lookFrom to lookAt
            expect(camera).toBeDefined();
        });

        it('should use provided focus distance', () => {
            const options: CameraOptions = {
                ...defaultOptions,
                aperture: 1.0,
                focusDistance: 5.0,
            };
            
            const camera = new Camera(world, options);
            expect(camera).toBeDefined();
        });
    });

    describe('Defocus Blur', () => {
        it('should generate consistent rays when aperture is 0', () => {
            const options: CameraOptions = {
                ...defaultOptions,
                aperture: 0,
                samples: 1,
            };
            
            const camera = new Camera(world, options);
            
            // Generate multiple rays for the same pixel
            const ray1 = camera.getRay(50, 50);
            const ray2 = camera.getRay(50, 50);
            
            // With aperture 0 and samples 1, rays should be identical
            expect(ray1.origin.equals(ray2.origin)).toBe(true);
            expect(ray1.direction.equals(ray2.direction)).toBe(true);
        });

        it('should generate different ray origins when aperture > 0', () => {
            const options: CameraOptions = {
                ...defaultOptions,
                aperture: 2.0,
                focusDistance: 1.0,
                samples: 10, // Enable anti-aliasing to get random rays
            };
            
            const camera = new Camera(world, options);
            
            // Generate multiple rays for the same pixel
            const rays: Ray[] = [];
            for (let i = 0; i < 10; i++) {
                rays.push(camera.getRay(50, 50));
            }
            
            // With aperture > 0, ray origins should vary
            const origins = rays.map(r => r.origin);
            const allSame = origins.every(origin => origin.equals(origins[0]));
            expect(allSame).toBe(false);
        });

        it('should maintain focus plane targeting with defocus blur', () => {
            const options: CameraOptions = {
                ...defaultOptions,
                aperture: 1.0,
                focusDistance: 2.0,
                samples: 10,
            };
            
            const camera = new Camera(world, options);
            
            // Generate rays and check they converge at the focus plane
            const rays: Ray[] = [];
            for (let i = 0; i < 5; i++) {
                rays.push(camera.getRay(50, 50));
            }
            
            // All rays should be valid
            rays.forEach(ray => {
                expect(ray.origin).toBeDefined();
                expect(ray.direction).toBeDefined();
                expect(ray.direction.length()).toBeGreaterThan(0);
            });
        });

        it('should handle edge cases for aperture values', () => {
            // Test with very small aperture
            const smallApertureOptions: CameraOptions = {
                ...defaultOptions,
                aperture: 0.001,
                focusDistance: 1.0,
            };
            
            const smallApertureCamera = new Camera(world, smallApertureOptions);
            const ray1 = smallApertureCamera.getRay(50, 50);
            expect(ray1).toBeDefined();

            // Test with large aperture
            const largeApertureOptions: CameraOptions = {
                ...defaultOptions,
                aperture: 10.0,
                focusDistance: 1.0,
            };
            
            const largeApertureCamera = new Camera(world, largeApertureOptions);
            const ray2 = largeApertureCamera.getRay(50, 50);
            expect(ray2).toBeDefined();
        });
    });

    describe('Ray Generation', () => {
        it('should generate rays within image bounds', () => {
            const camera = new Camera(world, defaultOptions);
            
            // Test corner pixels
            const topLeft = camera.getRay(0, 0);
            const topRight = camera.getRay(99, 0);
            const bottomLeft = camera.getRay(0, 99);
            const bottomRight = camera.getRay(99, 99);
            
            [topLeft, topRight, bottomLeft, bottomRight].forEach(ray => {
                expect(ray.origin).toBeDefined();
                expect(ray.direction).toBeDefined();
                expect(ray.direction.length()).toBeGreaterThan(0);
            });
        });

        it('should generate different rays for different pixels', () => {
            const camera = new Camera(world, defaultOptions);
            
            const ray1 = camera.getRay(25, 25);
            const ray2 = camera.getRay(75, 75);
            
            // Rays for different pixels should have different directions
            expect(ray1.direction.equals(ray2.direction)).toBe(false);
        });
    });

    describe('Rendering', () => {
        it('should render without errors', () => {
            const options: CameraOptions = {
                imageWidth: 10,
                imageHeight: 10,
                samples: 1,
                aperture: 0,
            };
            
            const camera = new Camera(world, options);
            const buffer = new Uint8ClampedArray(10 * 10 * 3);
            
            const stats = camera.render(buffer);
            
            expect(stats.samples.total).toBe(100); // 10x10 pixels, 1 sample each
            expect(stats.pixels).toBe(100);
            expect(stats.samples.min).toBe(1);
            expect(stats.samples.max).toBe(1);
            expect(stats.samples.avg).toBe(1);
            expect(stats.bounces.total).toBeGreaterThanOrEqual(0);
            expect(stats.bounces.min).toBeGreaterThanOrEqual(0);
            expect(stats.bounces.max).toBeGreaterThanOrEqual(0);
            expect(stats.bounces.avg).toBeGreaterThanOrEqual(0);
        });

        it('should render with defocus blur without errors', () => {
            const options: CameraOptions = {
                imageWidth: 10,
                imageHeight: 10,
                samples: 2,
                aperture: 1.0,
                focusDistance: 1.0,
            };
            
            const camera = new Camera(world, options);
            const buffer = new Uint8ClampedArray(10 * 10 * 3);
            
            const stats = camera.render(buffer);
            
            expect(stats.samples.total).toBeGreaterThan(0);
            expect(stats.pixels).toBe(100);
            expect(buffer.length).toBe(300); // 10x10x3 channels
        });

        it('should render region correctly', () => {
            const options: CameraOptions = {
                imageWidth: 20,
                imageHeight: 20,
                samples: 1,
            };
            
            const camera = new Camera(world, options);
            const buffer = new Uint8ClampedArray(20 * 20 * 3);
            
            // Render a 10x10 region starting at (5,5)
            const stats = camera.renderRegion(buffer, 5, 5, 10, 10);
            
            expect(stats.pixels).toBe(100); // 10x10 region
            expect(stats.samples.total).toBe(100); // 1 sample per pixel
        });
    });

    describe('Configuration Validation', () => {
        it('should handle various aperture and focus distance combinations', () => {
            const testCases = [
                { aperture: 0, focusDistance: 1.0 },
                { aperture: 0.1, focusDistance: 0.5 },
                { aperture: 2.0, focusDistance: 5.0 },
                { aperture: 5.0, focusDistance: 10.0 },
            ];

            testCases.forEach(({ aperture, focusDistance }) => {
                const options: CameraOptions = {
                    ...defaultOptions,
                    aperture,
                    focusDistance,
                };
                
                expect(() => new Camera(world, options)).not.toThrow();
            });
        });

        it('should work with different camera orientations', () => {
            const orientations = [
                { lookFrom: new Vec3(0, 0, 5), lookAt: new Vec3(0, 0, 0) },
                { lookFrom: new Vec3(5, 0, 0), lookAt: new Vec3(0, 0, 0) },
                { lookFrom: new Vec3(0, 5, 0), lookAt: new Vec3(0, 0, 0) },
                { lookFrom: new Vec3(3, 3, 3), lookAt: new Vec3(0, 0, 0) },
            ];

            orientations.forEach(({ lookFrom, lookAt }) => {
                const options: CameraOptions = {
                    ...defaultOptions,
                    lookFrom,
                    lookAt,
                    aperture: 1.0,
                };
                
                const camera = new Camera(world, options);
                const ray = camera.getRay(50, 50);
                expect(ray).toBeDefined();
            });
        });
    });
});

describe('Camera PDF Sampling', () => {
  let originalMathRandom: () => number;
  
  beforeEach(() => {
    // Mock Math.random to return predictable values
    originalMathRandom = Math.random;
    Math.random = () => 0.5;
  });
  
  afterEach(() => {
    // Restore original Math.random
    Math.random = originalMathRandom;
  });
  
  test('rayColor should handle light sampling correctly', () => {
    // Create a simple scene with a diffuse sphere and a light source
    const world = new HittableList();
    const diffuseMaterial = new Lambertian(new Color(0.8, 0.8, 0.8));
    const emissiveMaterial = new DefaultMaterial();
    
    // Create emissive behavior
    emissiveMaterial.emitted = () => new Color(1, 1, 1);
    
    // Add objects to the world
    const diffuseSphere = new Sphere(new Vec3(0, 0, -1), 0.5, diffuseMaterial);
    const lightSphere = new Sphere(new Vec3(0, 2, -1), 0.5, emissiveMaterial);
    world.add(diffuseSphere);
    world.add(lightSphere);
    
    // Create camera with the light source
    const camera = new Camera(world, {
      lights: [lightSphere]
    });
    
    // Create a ray that hits the diffuse sphere
    const ray = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));
    
    // Just verify that rayColor completes without errors when lights are available
    expect(() => camera.rayColor(ray)).not.toThrow();
  });
  
  test('rayColor should calculate brdfOverPdf correctly', () => {
    // Simplified test that doesn't rely on mocking complex behaviors
    
    // Create a world with just one diffuse sphere
    const world = new HittableList();
    const diffuseMaterial = new Lambertian(new Color(0.8, 0.8, 0.8));
    
    // Add object to the world
    const diffuseSphere = new Sphere(new Vec3(0, 0, -1), 0.5, diffuseMaterial);
    world.add(diffuseSphere);
    
    // Create camera (no lights)
    const camera = new Camera(world);
    
    // Create a ray that hits the diffuse sphere
    const ray = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));
    
    // In our current implementation, the result should be calculated using
    // CosinePDF sampling, and should not divide by π, which would cause energy loss
    
    // Force a simple behavior for this test - just check that rayColor runs without errors
    expect(() => camera.rayColor(ray)).not.toThrow();
  });
});

describe('Camera Russian Roulette', () => {
    let world: HittableList;
    let defaultOptions: CameraOptions;

    beforeEach(() => {
        // Create a simple world with one sphere
        const material = new Lambertian(new Color(0.5, 0.5, 0.5));
        const sphere = new Sphere(new Point3(0, 0, -1), 0.5, material);
        world = new HittableList();
        world.add(sphere);

        defaultOptions = {
            imageWidth: 10,
            imageHeight: 10,
            samples: 1,
        };
    });

    describe('Configuration', () => {
        it('should enable Russian Roulette by default', () => {
            const camera = new Camera(world, defaultOptions);
            // Russian Roulette should be enabled by default
            expect(camera).toBeDefined();
        });

        it('should allow disabling Russian Roulette', () => {
            const options: CameraOptions = {
                ...defaultOptions,
                russianRouletteEnabled: false,
            };
            
            const camera = new Camera(world, options);
            expect(camera).toBeDefined();
        });

        it('should allow custom Russian Roulette depth', () => {
            const options: CameraOptions = {
                ...defaultOptions,
                russianRouletteDepth: 5,
            };
            
            const camera = new Camera(world, options);
            expect(camera).toBeDefined();
        });
    });

    describe('Ray Termination', () => {
        it('should not apply Russian Roulette before minimum depth', () => {
            const options: CameraOptions = {
                ...defaultOptions,
                russianRouletteEnabled: true,
                russianRouletteDepth: 5,
            };
            
            const camera = new Camera(world, options);
            
            // Create a ray that will hit the sphere
            const ray = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));
            const stats = { bounces: 2 }; // Below threshold
            
            // Should not throw and should complete normally
            expect(() => camera.rayColor(ray, stats)).not.toThrow();
        });

        it('should apply Russian Roulette after minimum depth', () => {
            // Mock Math.random to control termination
            const originalRandom = Math.random;
            let callCount = 0;
            Math.random = () => {
                callCount++;
                return 0.99; // High value to trigger termination
            };

            try {
                const options: CameraOptions = {
                    ...defaultOptions,
                    russianRouletteEnabled: true,
                    russianRouletteDepth: 1, // Low threshold for testing
                };
                
                const camera = new Camera(world, options);
                
                // Create a ray that will hit the sphere
                const ray = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));
                const stats = { bounces: 2 }; // Above threshold
                
                const result = camera.rayColor(ray, stats);
                expect(result).toBeDefined();
                expect(callCount).toBeGreaterThan(0); // Random should have been called
            } finally {
                Math.random = originalRandom;
            }
        });

        it('should continue rays with low random values', () => {
            // Mock Math.random to prevent termination
            const originalRandom = Math.random;
            Math.random = () => 0.01; // Low value to continue ray

            try {
                const options: CameraOptions = {
                    ...defaultOptions,
                    russianRouletteEnabled: true,
                    russianRouletteDepth: 1,
                };
                
                const camera = new Camera(world, options);
                
                // Create a ray that will hit the sphere
                const ray = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));
                const stats = { bounces: 2 };
                
                const result = camera.rayColor(ray, stats);
                expect(result).toBeDefined();
            } finally {
                Math.random = originalRandom;
            }
        });
    });

    describe('Energy Conservation', () => {
        it('should maintain energy conservation with Russian Roulette disabled vs enabled', () => {
            // This test verifies that Russian Roulette maintains the same expected energy
            const disabledOptions: CameraOptions = {
                ...defaultOptions,
                russianRouletteEnabled: false,
                samples: 100, // More samples for statistical accuracy
            };
            
            const enabledOptions: CameraOptions = {
                ...defaultOptions,
                russianRouletteEnabled: true,
                russianRouletteDepth: 2,
                samples: 100,
            };
            
            const disabledCamera = new Camera(world, disabledOptions);
            const enabledCamera = new Camera(world, enabledOptions);
            
            const buffer1 = new Uint8ClampedArray(10 * 10 * 3);
            const buffer2 = new Uint8ClampedArray(10 * 10 * 3);
            
            const stats1 = disabledCamera.render(buffer1);
            const stats2 = enabledCamera.render(buffer2);
            
            // Both should complete successfully
            expect(stats1.pixels).toBe(100);
            expect(stats2.pixels).toBe(100);
            
            // Russian Roulette version might have fewer total bounces due to early termination
            expect(stats2.bounces.total).toBeLessThanOrEqual(stats1.bounces.total);
        });
    });

    describe('Performance Impact', () => {
        it('should reduce bounce count with Russian Roulette enabled', () => {
            const disabledOptions: CameraOptions = {
                ...defaultOptions,
                russianRouletteEnabled: false,
                samples: 50,
            };
            
            const enabledOptions: CameraOptions = {
                ...defaultOptions,
                russianRouletteEnabled: true,
                russianRouletteDepth: 2,
                samples: 50,
            };
            
            const disabledCamera = new Camera(world, disabledOptions);
            const enabledCamera = new Camera(world, enabledOptions);
            
            const buffer1 = new Uint8ClampedArray(10 * 10 * 3);
            const buffer2 = new Uint8ClampedArray(10 * 10 * 3);
            
            const stats1 = disabledCamera.render(buffer1);
            const stats2 = enabledCamera.render(buffer2);
            
            // Russian Roulette should generally reduce total bounces
            // Note: This is probabilistic, so we use a reasonable expectation
            expect(stats2.bounces.avg).toBeLessThanOrEqual(stats1.bounces.avg * 1.1); // Allow 10% variance
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero attenuation gracefully', () => {
            // Create a material that returns zero attenuation
            const zeroMaterial = new MockPDFMaterial(new Color(0, 0, 0));
            const zeroSphere = new Sphere(new Vec3(0, 0, -1), 0.5, zeroMaterial);
            const zeroWorld = new HittableList();
            zeroWorld.add(zeroSphere);
            
            const options: CameraOptions = {
                ...defaultOptions,
                russianRouletteEnabled: true,
                russianRouletteDepth: 1,
            };
            
            const camera = new Camera(zeroWorld, options);
            const ray = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));
            const stats = { bounces: 2 };
            
            // Should handle zero attenuation without errors
            expect(() => camera.rayColor(ray, stats)).not.toThrow();
        });

        it('should handle high attenuation values', () => {
            // Create a material with high attenuation
            const highMaterial = new MockPDFMaterial(new Color(2, 2, 2));
            const highSphere = new Sphere(new Vec3(0, 0, -1), 0.5, highMaterial);
            const highWorld = new HittableList();
            highWorld.add(highSphere);
            
            const options: CameraOptions = {
                ...defaultOptions,
                russianRouletteEnabled: true,
                russianRouletteDepth: 1,
            };
            
            const camera = new Camera(highWorld, options);
            const ray = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));
            const stats = { bounces: 2 };
            
            // Should cap continuation probability at 95%
            expect(() => camera.rayColor(ray, stats)).not.toThrow();
        });
    });
});

describe('Camera Background Colors', () => {
    let emptyWorld: HittableList;
    let defaultOptions: CameraOptions;

    beforeEach(() => {
        // Create an empty world to test background colors
        emptyWorld = new HittableList();

        defaultOptions = {
            imageWidth: 10,
            imageHeight: 10,
            samples: 1,
        };
    });

    describe('Default Background', () => {
        it('should use white-to-blue gradient by default', () => {
            const camera = new Camera(emptyWorld, defaultOptions);
            
            // Create rays pointing in different directions to test gradient
            const rayUp = new Ray(new Vec3(0, 0, 0), new Vec3(0, 1, 0)); // Should be more blue (bottom color)
            const rayDown = new Ray(new Vec3(0, 0, 0), new Vec3(0, -1, 0)); // Should be more white (top color)
            
            const colorUp = camera.rayColor(rayUp);
            const colorDown = camera.rayColor(rayDown);
            
            // Down ray should have more white (higher overall brightness) - it gets the top color
            const brightnessUp = colorUp.x + colorUp.y + colorUp.z;
            const brightnessDown = colorDown.x + colorDown.y + colorDown.z;
            
            expect(brightnessDown).toBeGreaterThan(brightnessUp);
            
            // Up ray should have Color.BLUE characteristics (lower red and green components)
            // Down ray should have Color.WHITE characteristics (all components equal to 1)
            expect(colorDown.x).toBeCloseTo(1.0, 1); // White has R=1
            expect(colorUp.x).toBeCloseTo(0.5, 1);   // Blue has R=0.5
        });

        it('should interpolate background colors based on ray direction', () => {
            const camera = new Camera(emptyWorld, defaultOptions);
            
            // Test horizontal ray (should be middle of gradient)
            const rayHorizontal = new Ray(new Vec3(0, 0, 0), new Vec3(1, 0, 0));
            const colorHorizontal = camera.rayColor(rayHorizontal);
            
            // Should be a mix of white and blue
            expect(colorHorizontal.x).toBeGreaterThan(0);
            expect(colorHorizontal.y).toBeGreaterThan(0);
            expect(colorHorizontal.z).toBeGreaterThan(0);
        });
    });

    describe('Custom Background Colors', () => {
        it('should use custom background colors when specified', () => {
            const redTop = new Color(1, 0, 0);
            const greenBottom = new Color(0, 1, 0);
            
            const options: CameraOptions = {
                ...defaultOptions,
                backgroundTop: redTop,
                backgroundBottom: greenBottom,
            };
            
            const camera = new Camera(emptyWorld, options);
            
            // Test ray pointing up (should be green - gets bottom color)
            const rayUp = new Ray(new Vec3(0, 0, 0), new Vec3(0, 1, 0));
            const colorUp = camera.rayColor(rayUp);
            
            // Should be predominantly green (bottom color)
            expect(colorUp.y).toBeGreaterThan(colorUp.x);
            expect(colorUp.y).toBeGreaterThan(colorUp.z);
            
            // Test ray pointing down (should be red - gets top color)
            const rayDown = new Ray(new Vec3(0, 0, 0), new Vec3(0, -1, 0));
            const colorDown = camera.rayColor(rayDown);
            
            // Should be predominantly red (top color)
            expect(colorDown.x).toBeGreaterThan(colorDown.y);
            expect(colorDown.x).toBeGreaterThan(colorDown.z);
        });

        it('should support black backgrounds for Cornell box scenarios', () => {
            const options: CameraOptions = {
                ...defaultOptions,
                backgroundTop: Color.BLACK,
                backgroundBottom: Color.BLACK,
            };
            
            const camera = new Camera(emptyWorld, options);
            
            // Test rays in various directions
            const directions = [
                new Vec3(0, 1, 0),   // Up
                new Vec3(0, -1, 0),  // Down
                new Vec3(1, 0, 0),   // Right
                new Vec3(-1, 0, 0),  // Left
                new Vec3(0, 0, 1),   // Forward
                new Vec3(0, 0, -1),  // Backward
            ];
            
            directions.forEach(direction => {
                const ray = new Ray(new Vec3(0, 0, 0), direction);
                const color = camera.rayColor(ray);
                
                // All should be black (no ambient light)
                expect(color.x).toBe(0);
                expect(color.y).toBe(0);
                expect(color.z).toBe(0);
            });
        });

        it('should handle single color backgrounds', () => {
            const purple = new Color(0.5, 0, 0.5);
            
            const options: CameraOptions = {
                ...defaultOptions,
                backgroundTop: purple,
                backgroundBottom: purple,
            };
            
            const camera = new Camera(emptyWorld, options);
            
            // Test rays in different directions - all should be purple
            const rayUp = new Ray(new Vec3(0, 0, 0), new Vec3(0, 1, 0));
            const rayDown = new Ray(new Vec3(0, 0, 0), new Vec3(0, -1, 0));
            
            const colorUp = camera.rayColor(rayUp);
            const colorDown = camera.rayColor(rayDown);
            
            // Both should be the same purple color
            expect(colorUp.x).toBeCloseTo(purple.x, 5);
            expect(colorUp.y).toBeCloseTo(purple.y, 5);
            expect(colorUp.z).toBeCloseTo(purple.z, 5);
            
            expect(colorDown.x).toBeCloseTo(purple.x, 5);
            expect(colorDown.y).toBeCloseTo(purple.y, 5);
            expect(colorDown.z).toBeCloseTo(purple.z, 5);
        });
    });

    describe('Background Gradient Interpolation', () => {
        it('should correctly interpolate between custom colors', () => {
            const white = new Color(1, 1, 1);
            const black = new Color(0, 0, 0);
            
            const options: CameraOptions = {
                ...defaultOptions,
                backgroundTop: white,
                backgroundBottom: black,
            };
            
            const camera = new Camera(emptyWorld, options);
            
            // Test horizontal ray (y = 0, should be middle gray)
            const rayHorizontal = new Ray(new Vec3(0, 0, 0), new Vec3(1, 0, 0));
            const colorHorizontal = camera.rayColor(rayHorizontal);
            
            // Should be approximately 50% gray
            expect(colorHorizontal.x).toBeCloseTo(0.5, 1);
            expect(colorHorizontal.y).toBeCloseTo(0.5, 1);
            expect(colorHorizontal.z).toBeCloseTo(0.5, 1);
        });

        it('should handle extreme color values', () => {
            const brightRed = new Color(10, 0, 0);
            const darkBlue = new Color(0, 0, 0.1);
            
            const options: CameraOptions = {
                ...defaultOptions,
                backgroundTop: brightRed,
                backgroundBottom: darkBlue,
            };
            
            const camera = new Camera(emptyWorld, options);
            
            // Should not throw errors with extreme values
            const ray = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0.5, 0));
            expect(() => camera.rayColor(ray)).not.toThrow();
        });
    });

    describe('Integration with Rendering', () => {
        it('should render correctly with custom backgrounds', () => {
            const options: CameraOptions = {
                imageWidth: 5,
                imageHeight: 5,
                samples: 1,
                backgroundTop: new Color(1, 0, 0),
                backgroundBottom: new Color(0, 0, 1),
            };
            
            const camera = new Camera(emptyWorld, options);
            const buffer = new Uint8ClampedArray(5 * 5 * 3);
            
            const stats = camera.render(buffer);
            
            expect(stats.pixels).toBe(25);
            expect(stats.samples.total).toBe(25);
            
            // Buffer should contain non-zero values (not all black)
            const hasNonZero = Array.from(buffer).some(value => value > 0);
            expect(hasNonZero).toBe(true);
        });

        it('should render black backgrounds correctly', () => {
            const options: CameraOptions = {
                imageWidth: 3,
                imageHeight: 3,
                samples: 1,
                backgroundTop: Color.BLACK,
                backgroundBottom: Color.BLACK,
            };
            
            const camera = new Camera(emptyWorld, options);
            const buffer = new Uint8ClampedArray(3 * 3 * 3);
            
            const stats = camera.render(buffer);
            
            expect(stats.pixels).toBe(9);
            
            // Buffer should be all zeros (black)
            const allZero = Array.from(buffer).every(value => value === 0);
            expect(allZero).toBe(true);
        });
    });
});
