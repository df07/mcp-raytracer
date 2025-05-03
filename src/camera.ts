/* Specs: camera.md */
import { Vec3, Point3, Color, cross, unitVector } from './vec3.js';
import { Ray } from './ray.js';
import { Hittable } from './hittable.js';
import { Interval } from './interval.js';

export class Camera {
    public readonly imageWidth: number;
    public readonly imageHeight: number;
    public readonly center: Point3;
    public readonly pixel00Loc: Point3;
    public readonly pixelDeltaU: Vec3;
    public readonly pixelDeltaV: Vec3;
    private readonly u: Vec3;
    private readonly v: Vec3;
    private readonly w: Vec3;
    private readonly world: Hittable;

    constructor(imageWidth: number, imageHeight: number, vfovDegrees: number, lookfrom: Point3, lookat: Point3, vup: Vec3, world: Hittable) {
        this.imageWidth = imageWidth;
        this.imageHeight = imageHeight;
        this.center = lookfrom;
        this.world = world; // Store world

        // Determine viewport dimensions.
        const focalLength = 1.0; // Fixed focal length
        const theta = vfovDegrees * (Math.PI / 180); // Convert vfov to radians
        const h = Math.tan(theta / 2);
        const viewportHeight = 2 * h * focalLength;
        const aspectRatio = imageWidth / imageHeight;
        const viewportWidth = viewportHeight * aspectRatio;

        // Calculate the u,v,w unit basis vectors for the camera coordinate frame.
        // Use vec3 methods instead of standalone functions
        this.w = unitVector(lookfrom.subtract(lookat));
        this.u = unitVector(cross(vup, this.w));
        this.v = cross(this.w, this.u);

        // Calculate the vectors across the horizontal and down the vertical viewport edges.
        // Use vec3 methods instead of standalone functions
        const viewportU = this.u.multiply(viewportWidth);    // Vector across viewport horizontal edge
        const viewportV = this.v.multiply(-viewportHeight); // Vector down viewport vertical edge

        // Calculate the horizontal and vertical delta vectors from pixel to pixel.
        // Use vec3 methods instead of standalone functions
        this.pixelDeltaU = viewportU.divide(imageWidth);
        this.pixelDeltaV = viewportV.divide(imageHeight);

        // Calculate the location of the upper left pixel.
        // Use vec3 methods instead of standalone functions
        const halfViewportU = viewportU.divide(2);
        const halfViewportV = viewportV.divide(2);
        const viewportUpperLeft = this.center.subtract(this.w).subtract(halfViewportU).subtract(halfViewportV);
        this.pixel00Loc = viewportUpperLeft.add(this.pixelDeltaU.add(this.pixelDeltaV).multiply(0.5));
    }

    getRay(i: number, j: number): Ray {
        // Get a camera ray for the pixel at location i,j.

        // Use vec3 methods instead of standalone functions
        const pixelCenter = this.pixel00Loc.add(this.pixelDeltaU.multiply(i)).add(this.pixelDeltaV.multiply(j));
        const rayDirection = pixelCenter.subtract(this.center);

        return new Ray(this.center, rayDirection);
    }

    /**
     * Calculates the color of a ray by tracing it into the world.
     * If the ray hits an object, it computes the color based on the surface normal.
     * Otherwise, it returns a background gradient color.
     * @param r The ray.
     * @returns The color of the ray.
     */
    rayColor(r: Ray): Color {
        // Check if the ray hits any object in the world
        // Use this.world instead of passing world as parameter
        // Use tMin = 0.001 to avoid shadow acne
        const rec = this.world.hit(r, new Interval(0.001, Infinity));

        if (rec !== null) {
            // If the ray hits an object, compute color based on the normal
            // Map normal components to RGB values (ranging from -1 to 1, shifted to 0 to 1)
            return rec.normal.add(new Vec3(1, 1, 1)).multiply(0.5);
        }

        // If the ray doesn't hit anything, compute background gradient color
        const unitDirection = r.direction.unitVector();
        const a = 0.5 * (unitDirection.y + 1.0);
        // Linear interpolation (lerp) between white and blue based on y-coordinate
        return new Vec3(1.0, 1.0, 1.0).multiply(1.0 - a).add(new Vec3(0.5, 0.7, 1.0).multiply(a));
    }

    /**
     * Renders the scene and writes the pixel data to the buffer.
     * @param pixelData The buffer to write pixel data into.
     * @param verbose Whether to log progress to stderr.
     */
    render(pixelData: Uint8ClampedArray, verbose: boolean = false): void {
        let offset = 0;

        // Render loop
        for (let j = 0; j < this.imageHeight; ++j) {
            // Log progress only if verbose
            if (verbose && j % 10 === 0) {
                process.stderr.write(`\rScanlines remaining: ${this.imageHeight - j} `);
            }
            for (let i = 0; i < this.imageWidth; ++i) {
                const r = this.getRay(i, j);
                const pixelColor = this.rayColor(r);
                writeColorToBuffer(pixelData, offset, pixelColor);
                offset += 3; // Move to the next pixel (RGB)
            }
        }
         // Clear progress line only if verbose
         if (verbose) {
            process.stderr.write(`\rScanlines remaining: 0 \n`);
        }
    }
}

/**
 * Writes the color components to the buffer at the specified offset.
 * @param buffer The buffer to write to.
 * @param offset The starting index in the buffer for the pixel.
 * @param pixelColor The color to write.
 */
function writeColorToBuffer(
  buffer: Uint8ClampedArray,
  offset: number,
  pixelColor: Color,
): void {
    buffer[offset + 0] = Math.floor(255.999 * pixelColor.x); // R
    buffer[offset + 1] = Math.floor(255.999 * pixelColor.y); // G
    buffer[offset + 2] = Math.floor(255.999 * pixelColor.z); // B
}
