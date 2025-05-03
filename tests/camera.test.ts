import { Camera } from '../src/camera.js';
import { Vec3, Point3, Color, unitVector } from '../src/vec3.js';
import { Ray } from '../src/ray.js';
import { Hittable, HitRecord } from '../src/hittable.js';
import { Interval } from '../src/interval.js';

// Mock Hittable for testing rayColor
class MockHittable implements Hittable {
    shouldHit: boolean;
    hitNormal: Vec3;

    constructor(shouldHit: boolean, hitNormal: Vec3 = new Vec3(0, 0, 0)) {
        this.shouldHit = shouldHit;
        this.hitNormal = hitNormal;
    }

    hit(r: Ray, rayT: Interval): HitRecord | null {
        if (this.shouldHit && rayT.contains(1.0)) { // Assume hit at t=1 for simplicity
            const rec = new HitRecord();
            rec.t = 1.0;
            rec.p = r.at(1.0);
            // Simulate setting face normal - for this test, just use the provided normal
            rec.normal = this.hitNormal;
            rec.frontFace = true; // Assume front face hit
            return rec;
        }
        return null;
    }
}


describe('Camera', () => {
    const imageWidth = 400;
    const imageHeight = 200;
    // Use Vec3 constructor for Point3 types
    const lookfrom: Point3 = new Vec3(0, 0, 0);
    const lookat: Point3 = new Vec3(0, 0, -1);
    const vup = new Vec3(0, 1, 0);
    const vfov = 90;

    // Test cases for rayColor
    const backgroundRay = new Ray(new Vec3(0,0,0), new Vec3(0, 0.5, -1));
    const hittingRay = new Ray(new Vec3(0,0,0), new Vec3(0, 0, -1));
    const hitNormal = new Vec3(0, 0, 1);

    const mockWorldMiss = new MockHittable(false);
    const mockWorldHit = new MockHittable(true, hitNormal);

    let cameraMiss: Camera;
    let cameraHit: Camera;


    beforeEach(() => {
        // Re-initialize cameras before each test
        cameraMiss = new Camera(imageWidth, imageHeight, vfov, lookfrom, lookat, vup, mockWorldMiss);
        cameraHit = new Camera(imageWidth, imageHeight, vfov, lookfrom, lookat, vup, mockWorldHit);
    });

    test('constructor initializes properties correctly', () => {
        expect(cameraHit.imageWidth).toBe(imageWidth);
        expect(cameraHit.imageHeight).toBe(imageHeight);
        expect(cameraHit.center).toEqual(lookfrom);
        expect((cameraHit as any).world).toBe(mockWorldHit); // Check world is stored

        // Basic checks for calculated properties - more detailed checks could be added
        expect(cameraHit.pixel00Loc).toBeDefined();
        expect(cameraHit.pixelDeltaU).toBeDefined();
        expect(cameraHit.pixelDeltaV).toBeDefined();

        // Check basis vectors (w should point towards lookat, u should be horizontal, v vertical)
        // Access private members for testing purposes using type assertion
        const w = (cameraHit as any).w as Vec3;
        const u = (cameraHit as any).u as Vec3;
        const v = (cameraHit as any).v as Vec3;

        // w = unit(lookfrom - lookat) = unit(0,0,1) = (0,0,1)
        expect(w.x).toBeCloseTo(0); // Use getter property
        expect(w.y).toBeCloseTo(0); // Use getter property
        expect(w.z).toBeCloseTo(1); // Use getter property

        // u = unit(cross(vup, w)) = unit(cross((0,1,0), (0,0,1))) = unit((1,0,0)) = (1,0,0)
        expect(u.x).toBeCloseTo(1); // Use getter property
        expect(u.y).toBeCloseTo(0); // Use getter property
        expect(u.z).toBeCloseTo(0); // Use getter property

        // v = cross(w, u) = cross((0,0,1), (1,0,0)) = (0,1,0)
        expect(v.x).toBeCloseTo(0); // Use getter property
        expect(v.y).toBeCloseTo(1); // Use getter property
        expect(v.z).toBeCloseTo(0); // Use getter property
    });

    test('getRay returns a ray with correct origin', () => {
        // Use cameraHit instance
        const testRay = cameraHit.getRay(0, 0);
        expect(testRay.origin).toEqual(cameraHit.center);
    });

    test('getRay returns a ray with correct direction for center pixel', () => {
        const i = imageWidth / 2;
        const j = imageHeight / 2;
        // Use cameraHit instance
        const testRay = cameraHit.getRay(i, j);
        // The ray for the center pixel should point directly along -w (towards lookat)
        // Need to normalize the direction vector for comparison as getRay doesn't guarantee unit vectors
        const direction = unitVector(testRay.direction); // Use imported unitVector
        expect(direction.x).toBeCloseTo(0); // Use getter property
        expect(direction.y).toBeCloseTo(0); // Use getter property
        expect(direction.z).toBeCloseTo(-1); // Use getter property, points towards -Z
    });


    test('getRay returns different directions for different pixels', () => {
        // Use cameraHit instance
        const ray1 = cameraHit.getRay(10, 10);
        const ray2 = cameraHit.getRay(imageWidth - 10, imageHeight - 10);
        expect(ray1.direction).not.toEqual(ray2.direction);
    });

    test('getRay for top-left corner (0,0)', () => {
        // Use cameraHit instance
        const testRay = cameraHit.getRay(0, 0);
        // Direction should point towards the top-left of the viewport
        // Exact values depend on vfov and aspect ratio
        expect(testRay.direction.x).toBeLessThan(0); // Use getter property, Points left
        expect(testRay.direction.y).toBeGreaterThan(0); // Use getter property, Points up
        expect(testRay.direction.z).toBeLessThan(0); // Use getter property, Points forward (-Z)
    });

    test('getRay for bottom-right corner', () => {
        // Use cameraHit instance
        const testRay = cameraHit.getRay(imageWidth -1 , imageHeight -1);
        // Direction should point towards the bottom-right of the viewport
        expect(testRay.direction.x).toBeGreaterThan(0); // Use getter property, Points right
        expect(testRay.direction.y).toBeLessThan(0); // Use getter property, Points down
        expect(testRay.direction.z).toBeLessThan(0); // Use getter property, Points forward (-Z)
    });

    // Tests for rayColor
    test('rayColor returns background color when ray misses', () => {
        // ... test using cameraMiss ...
        const colorResult = cameraMiss.rayColor(backgroundRay);
        // Calculate expected background color for the backgroundRay direction
        const unitDirection = backgroundRay.direction.unitVector();
        const a = 0.5 * (unitDirection.y + 1.0);
        const expectedColor = new Vec3(1.0, 1.0, 1.0).multiply(1.0 - a).add(new Vec3(0.5, 0.7, 1.0).multiply(a));

        expect(colorResult.x).toBeCloseTo(expectedColor.x);
        expect(colorResult.y).toBeCloseTo(expectedColor.y);
        expect(colorResult.z).toBeCloseTo(expectedColor.z);
    });

    test('rayColor returns normal-based color when ray hits', () => {
        // ... test using cameraHit ...
        const colorResult = cameraHit.rayColor(hittingRay);
        // Calculate expected color based on the mock hit normal
        const expectedColor = hitNormal.add(new Vec3(1, 1, 1)).multiply(0.5);

        expect(colorResult.x).toBeCloseTo(expectedColor.x);
        expect(colorResult.y).toBeCloseTo(expectedColor.y);
        expect(colorResult.z).toBeCloseTo(expectedColor.z);
    });

    // Test for render method (basic check)
    test('render fills the pixel buffer', () => {
        // ... test using cameraHit ...
        const channels = 3; // RGB
        // Use Uint8ClampedArray as expected by the render method
        const pixelData = new Uint8ClampedArray(imageWidth * imageHeight * channels);
        // Fill buffer with a known value first to ensure render changes it
        pixelData.fill(128);

        // Call render with only the buffer argument
        cameraHit.render(pixelData);

        // Check buffer size
        expect(pixelData.length).toBe(imageWidth * imageHeight * channels);

        // Check that the buffer is no longer filled with the initial value
        // (This is a weak test, but confirms *something* was written)
        let allSame = true;
        for (let i = 0; i < pixelData.length; i++) {
            if (pixelData[i] !== 128) {
                allSame = false;
                break;
            }
        }
        expect(allSame).toBe(false);
    });
});
