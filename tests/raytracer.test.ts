import { rayColor, generateImageBuffer } from '../src/raytracer.js'; // Import generateImageBuffer instead of render
import { Vec3 } from '../src/vec3.js';
import type { Color } from '../src/vec3.js';
import { HittableList } from '../src/hittableList.js';
import { Sphere } from '../src/sphere.js';
import { Ray } from '../src/ray.js';
import sharp from 'sharp';

describe('rayColor', () => {
  it('should return background color for a ray that misses', () => {
    const world = new HittableList(); // Empty world
    const r = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));
    const color = rayColor(r, world);

    // Calculate expected background color
    const unitDirection = r.direction.unitVector();
    const a = 0.5 * (unitDirection.y + 1.0);
    const expectedColor = new Vec3(1.0, 1.0, 1.0).multiply(1.0 - a).add(new Vec3(0.5, 0.7, 1.0).multiply(a));

    expect(color.x).toBeCloseTo(expectedColor.x);
    expect(color.y).toBeCloseTo(expectedColor.y);
    expect(color.z).toBeCloseTo(expectedColor.z);
  });

  it('should return object color for a ray that hits', () => {
    const world = new HittableList();
    const sphere = new Sphere(new Vec3(0, 0, -1), 0.5); // Use Vec3 for center
    world.add(sphere);
    const r = new Ray(new Vec3(0, 0, 0), new Vec3(0, 0, -1));
    const color = rayColor(r, world);

    // Calculate expected hit color based on normal
    // Hit point p = ray.at(0.5) = (0, 0, -0.5)
    // Center c = (0, 0, -1)
    // Normal n = (p - c) / radius = (0, 0, 0.5) / 0.5 = (0, 0, 1)
    // Expected color = (normal + (1,1,1)) * 0.5 = ((0,0,1) + (1,1,1)) * 0.5 = (1,1,2) * 0.5 = (0.5, 0.5, 1)
    const expectedColor: Color = new Vec3(0.5, 0.5, 1.0); // Use Vec3 constructor, type as Color

    expect(color.x).toBeCloseTo(expectedColor.x);
    expect(color.y).toBeCloseTo(expectedColor.y);
    expect(color.z).toBeCloseTo(expectedColor.z);
  });
});


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