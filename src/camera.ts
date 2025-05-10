/* Specs: camera.md */
import { Vec3, Point3, Color } from './vec3.js';
import { Ray } from './ray.js';
import { Hittable } from './hittable.js';
import { Interval } from './interval.js';
import { VectorPool } from './vec3.js';

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
    private readonly maxDepth: number = 50; // Maximum recursion depth for ray bounces
    private readonly samplesPerPixel: number; // Number of samples per pixel for anti-aliasing

    constructor(
        imageWidth: number, 
        imageHeight: number, 
        vfovDegrees: number, 
        lookfrom: Point3, 
        lookat: Point3, 
        vup: Vec3, 
        world: Hittable,
        samplesPerPixel: number = 1 // Default to 1 sample per pixel (no anti-aliasing)
    ) {
        this.imageWidth = imageWidth;
        this.imageHeight = imageHeight;
        this.center = lookfrom;
        this.world = world; // Store world
        this.samplesPerPixel = samplesPerPixel;

        // Determine viewport dimensions.
        const focalLength = 1.0; // Fixed focal length
        const theta = vfovDegrees * (Math.PI / 180); // Convert vfov to radians
        const h = Math.tan(theta / 2);
        const viewportHeight = 2 * h * focalLength;
        const aspectRatio = imageWidth / imageHeight;
        const viewportWidth = viewportHeight * aspectRatio;

        // Calculate the u,v,w unit basis vectors for the camera coordinate frame.
        // Use vec3 methods instead of standalone functions
        this.w = lookfrom.subtract(lookat).unitVector();
        this.u = vup.cross(this.w).unitVector();
        this.v = this.w.cross(this.u);

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
    
    /**
     * Gets a camera ray for the pixel at location i,j.
     * If anti-aliasing is enabled, generates rays with random offsets within the pixel.
     * @param i The horizontal pixel coordinate.
     * @param j The vertical pixel coordinate.
     * @param pool Vector pool to use for intermediate calculations.
     * @returns A ray originating from the camera through the specified pixel.
     */
    getRay(i: number, j: number, pool?: VectorPool): Ray {
        // Calculate pixel center
        const pixelCenter = this.pixel00Loc.add(this.pixelDeltaU.multiply(i)).add(this.pixelDeltaV.multiply(j));

        // For anti-aliasing, add a random offset within the pixel
        // If samplesPerPixel is 1, we'll use the pixel center (no randomization)
        let pixelSample = pixelCenter;
        
        if (this.samplesPerPixel > 1) {
            // Calculate random offset within the pixel
            const px = -0.5 + Math.random(); // Random between -0.5 and 0.5
            const py = -0.5 + Math.random(); 
            
            // Apply the offset scaled by the pixel delta vectors
            pixelSample = pixelCenter.add(this.pixelDeltaU.multiply(px)).add(this.pixelDeltaV.multiply(py));
        }
        
        // Calculate ray direction from camera center to the sample point
        const rayDirection = pixelSample.subtract(this.center);

        return new Ray(this.center, rayDirection);
    }

    /**
     * Calculates the color of a ray by tracing it into the world.
     * If the ray hits an object, it recursively traces scattered rays up to max depth.
     * Otherwise, it returns a background gradient color.
     * @param r The ray.
     * @param depth Maximum recursion depth.
     * @param pool Vector pool to use for intermediate calculations.
     * @returns The color of the ray.
     */
    rayColor(r: Ray, depth: number = this.maxDepth): Color {
        // If we've exceeded the ray bounce limit, no more light is gathered
        if (depth <= 0) {
            return Vec3.BLACK;
        }

        // Check if the ray hits any object in the world
        // Use tMin = 0.001 to avoid shadow acne
        const rec = this.world.hit(r, new Interval(0.001, Infinity));

        if (rec !== null) {
            // If the ray hits an object with a material, compute scattered ray
        
            const scatterResult = rec.material.scatter(r, rec);
            if (scatterResult) {
                // Recursively trace scattered ray and multiply by attenuation
                return scatterResult.attenuation.multiplyVec(
                    this.rayColor(scatterResult.scattered, depth - 1)
                );
            }
            // If no scattering occurs (material absorbed the ray), return black
            return Vec3.BLACK;
        }

        // If the ray doesn't hit anything, compute background gradient color
        const unitDirection = r.direction.unitVector();
        const a = 0.5 * (unitDirection.y + 1.0);
        // Linear interpolation (lerp) between white and blue based on y-coordinate
        return Vec3.WHITE.multiply(1.0 - a).add(Vec3.BLUE.multiply(a));
    }

    /**
     * Renders the scene and writes the pixel data to the buffer.
     * @param pixelData The buffer to write pixel data into.
     * @param verbose Whether to log progress to stderr.
     */
    render(pixelData: Uint8ClampedArray, verbose: boolean = false): void {
        const pool = new VectorPool(1600); // Create a new vector pool for rendering

        let offset = 0;

        // Render loop
        for (let j = 0; j < this.imageHeight; ++j) {
            // Log progress only if verbose
            if (verbose && j % 10 === 0) {
                process.stderr.write(`\rScanlines remaining: ${this.imageHeight - j} `);
            }
            for (let i = 0; i < this.imageWidth; ++i) {
                let pixelColor = new Vec3(0, 0, 0);

                // Anti-aliasing: average multiple samples per pixel
                for (let s = 0; s < this.samplesPerPixel; ++s) {
                    
                    Vec3.usePool(pool);
                    pool.reset(); // Reset vector pool for each sample

                    const r = this.getRay(i + Math.random(), j + Math.random());
                    const color = this.rayColor(r, this.maxDepth);

                    Vec3.usePool(null); // Release the pool after each ray

                    // Accumulate color for averaging
                    pixelColor = pixelColor.add(color); // don't use pool since the pixelColor vector escapes the loop
                }

                // Divide accumulated color by number of samples and apply gamma correction
                pixelColor = pixelColor.divide(this.samplesPerPixel);
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
 * Applies gamma correction for a more accurate color representation.
 * @param buffer The buffer to write to.
 * @param offset The starting index in the buffer for the pixel.
 * @param pixelColor The color to write.
 */
function writeColorToBuffer(
  buffer: Uint8ClampedArray,
  offset: number,
  pixelColor: Color,
): void {
    // Apply gamma correction by taking the square root of each color component
    const r = Math.sqrt(pixelColor.x);
    const g = Math.sqrt(pixelColor.y);
    const b = Math.sqrt(pixelColor.z);
    
    // Convert to 8-bit color
    buffer[offset + 0] = Math.floor(255.999 * r); // R
    buffer[offset + 1] = Math.floor(255.999 * g); // G
    buffer[offset + 2] = Math.floor(255.999 * b); // B
}
