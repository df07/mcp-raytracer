/* Specs: camera.md, pdf-sampling.md */
import { Vec3, Point3, Color } from './geometry/vec3.js';
import { Ray } from './geometry/ray.js';
import { Hittable, PDFHittable } from './geometry/hittable.js';
import { Interval } from './geometry/interval.js';
import { VectorPool } from './geometry/vec3.js';
import { MixturePDF } from './geometry/pdf.js';
import { PixelStats, RenderStats } from './render-utils/renderStats.js';

/**
 * Render mode options for visualization
 */
export enum RenderMode {
    Default = 'default',  // Normal color rendering (default)
    Bounces = 'bounces',  // Visualize bounce count (bluescale)
    Samples = 'samples'   // Visualize sample count (redscale)
}

/**
 * Camera positioning and visual settings
 */
export interface CameraOptions {
  vfov?: number;                 // Vertical field of view in degrees (default: 90)
  from?: Point3;                 // Camera position (default: origin)
  at?: Point3;                   // Look-at target (default: 0,0,-1)
  up?: Vec3;                     // Camera's up direction (default: 0,1,0)
  aperture?: number;             // Camera aperture size for defocus blur (default: 0, no blur)
  focus?: number;                // Distance to focus plane (default: auto-calculated)
  background?: BackgroundOptions      // Bottom color for background gradient (default: blue)
  lights?: PDFHittable[];        // Light sources for importance sampling (default: [])
}

export type BackgroundOptions = {
  type: 'gradient';
  top: Vec3;        // Top color for background gradient
  bottom: Vec3;     // Bottom color for background gradient
}

/**
 * Render quality and performance settings
 */
export interface RenderOptions {
  width?: number;                // Width of the rendered image (default: 400)
  aspect?: number;               // Aspect ratio of the rendered image (default: 16/9)
  samples?: number;              // Anti-aliasing samples per pixel (default: 100)
  depth?: number;                // Maximum recursion depth for ray bounces (default: 100)
  aTolerance?: number;             // Tolerance for convergence in adaptive sampling (default: 0.05)
  aBatch?: number;           // Number of samples to batch for adaptive sampling (default: 10)
  roulette?: boolean;            // Enable Russian Roulette ray termination (default: true)
  rouletteDepth?: number;        // Minimum bounces before applying Russian Roulette (default: 3)
  mode?: RenderMode;             // Render mode for visualization (default: Default)
}

export type RenderRegion = {
    x: number;
    y: number;
    width: number;
    height: number;
}

export class Camera {
    static defaultCameraOptions: Required<CameraOptions> = {
        vfov: 90,
        from: Vec3.create(0, 0, 0),
        at: Vec3.create(0, 0, -1),
        up: Vec3.create(0, 1, 0),
        aperture: 0,                 // No defocus blur by default
        focus: 1.0,          // Default focus distance
        background: { type: 'gradient', top: Color.WHITE, bottom: Color.BLUE },
        lights: [],
    }

    static defaultRenderData: Required<RenderOptions> = {
        width: 400,
        aspect: 16 / 9,
        samples: 100,
        aTolerance: 0.05,
        aBatch: 10,
        mode: RenderMode.Default,
        depth: 100,
        roulette: true,
        rouletteDepth: 3,
    }

    public readonly imageWidth: number;
    public readonly imageHeight: number;
    public readonly channels = 3;
    public readonly center: Vec3;
    public readonly pixel00Loc: Vec3;
    public readonly pixelDeltaU: Vec3;
    public readonly pixelDeltaV: Vec3;
    public readonly u: Vec3;
    public readonly v: Vec3;
    public readonly w: Vec3;
    public readonly world: Hittable;
    public readonly lights: PDFHittable[];
    public readonly options: Readonly<Required<RenderOptions>>  
    public readonly background: BackgroundOptions; // Top color for background gradient
    public readonly useAdaptiveSampling: boolean;
    
    // Defocus blur properties
    public readonly aperture: number;
    public readonly focusDistance: number;
    public readonly defocusDiskU: Vec3;
    public readonly defocusDiskV: Vec3;

    constructor(        
        world: Hittable,
        cameraOptions: CameraOptions = {},
        renderData: RenderOptions = {}
    ) {
        this.world = world;

        // Merge with defaults
        const finalCameraOptions = { ...Camera.defaultCameraOptions, ...cameraOptions };
        this.options = { ...Camera.defaultRenderData, ...renderData };

        // Set render properties
        this.imageWidth = this.options.width;
        this.imageHeight = Math.ceil(this.imageWidth / this.options.aspect);

        // Set camera properties
        this.center = finalCameraOptions.from;
        this.lights = finalCameraOptions.lights;
        this.background = finalCameraOptions.background;
        this.aperture = finalCameraOptions.aperture;
        
        // Auto-calculate focus distance if not provided
        this.focusDistance = finalCameraOptions.focus || finalCameraOptions.from.subtract(finalCameraOptions.at).length();

        // Determine viewport dimensions.
        const theta = finalCameraOptions.vfov * (Math.PI / 180); // Convert vfov to radians
        const h = Math.tan(theta / 2);
        const viewportHeight = 2 * h * this.focusDistance;
        const aspectRatio = this.imageWidth / this.imageHeight;
        const viewportWidth = viewportHeight * aspectRatio;

        // Calculate the u,v,w unit basis vectors for the camera coordinate frame.
        // Use vec3 methods instead of standalone functions
        this.w = finalCameraOptions.from.subtract(finalCameraOptions.at).unitVector();
        this.u = finalCameraOptions.up.cross(this.w).unitVector();
        this.v = this.w.cross(this.u);

        // Calculate the vectors across the horizontal and down the vertical viewport edges.
        // Use vec3 methods instead of standalone functions
        const viewportU = this.u.multiply(viewportWidth);    // Vector across viewport horizontal edge
        const viewportV = this.v.multiply(-viewportHeight); // Vector down viewport vertical edge

        // Calculate the horizontal and vertical delta vectors from pixel to pixel.
        // Use vec3 methods instead of standalone functions
        this.pixelDeltaU = viewportU.divide(this.imageWidth);
        this.pixelDeltaV = viewportV.divide(this.imageHeight);

        // Calculate the location of the upper left pixel.
        // Use vec3 methods instead of standalone functions
        const halfViewportU = viewportU.divide(2);
        const halfViewportV = viewportV.divide(2);
        const viewportUpperLeft = this.center.subtract(this.w.multiply(this.focusDistance)).subtract(halfViewportU).subtract(halfViewportV);
        this.pixel00Loc = viewportUpperLeft.add(this.pixelDeltaU.add(this.pixelDeltaV).multiply(0.5));

        // Initialize defocus disk vectors
        this.defocusDiskU = this.u.multiply(this.aperture / 2);
        this.defocusDiskV = this.v.multiply(this.aperture / 2);

        this.useAdaptiveSampling = this.options.aTolerance > 0 && this.options.samples > 1;
    }    
    
    /**
     * Gets a camera ray for the pixel at location i,j.
     * If anti-aliasing is enabled, generates rays with random offsets within the pixel.
     * If defocus blur is enabled, generates rays from random points on the aperture disk.
     * @param i The horizontal pixel coordinate.
     * @param j The vertical pixel coordinate.
     * @returns A ray originating from the camera through the specified pixel.
     */
    getRay(i: number, j: number): Ray {
        // Calculate pixel center
        const pixelCenter = this.pixel00Loc.add(this.pixelDeltaU.multiply(i)).add(this.pixelDeltaV.multiply(j));

        // For anti-aliasing, add a random offset within the pixel
        // If samplesPerPixel is 1, we'll use the pixel center (no randomization)
        let pixelSample = pixelCenter;
        
        if (this.options.samples > 1) {
            // Calculate random offset within the pixel
            const px = -0.5 + Math.random(); // Random between -0.5 and 0.5
            const py = -0.5 + Math.random(); 
            
            // Apply the offset scaled by the pixel delta vectors
            pixelSample = pixelCenter.add(this.pixelDeltaU.multiply(px)).add(this.pixelDeltaV.multiply(py));
        }
        
        // Calculate ray origin and direction for defocus blur
        let rayOrigin = this.center;
        let rayDirection = pixelSample.subtract(this.center);
        
        if (this.aperture > 0) {
            // Sample a random point on the defocus disk
            const rd = Vec3.randomInUnitDisk();
            const offset = this.defocusDiskU.multiply(rd.x).add(this.defocusDiskV.multiply(rd.y));
            
            // Offset the ray origin by the aperture sample
            rayOrigin = this.center.add(offset);
            
            // Calculate the ray direction to hit the same point on the focus plane
            rayDirection = pixelSample.subtract(rayOrigin);
        }

        return new Ray(rayOrigin, rayDirection);
    }

    /**
     * Calculates the color of a ray by tracing it into the world.
     * If the ray hits an object, it uses the material's PDF or scattered ray to calculate the color.
     * Otherwise, it returns a background gradient color.
     * @param r The ray.
     * @param throughput The cumulative energy/attenuation of the ray path.
     * @param stats Optional stats object to track bounce count.
     * @returns The color of the ray.
     */
    rayColor(r: Ray, throughput: Color = Color.WHITE, stats?: { bounces: number }): Color {
        // Initialize stats if not provided
        if (!stats) {
            stats = { bounces: 0 };
        }

        // If we've exceeded the ray bounce limit, no more light is gathered
        if (stats.bounces >= this.options.depth) {
            return Color.BLACK;
        }

        // Apply Russian Roulette termination if enabled and after minimum depth
        if (this.options.roulette && stats.bounces >= this.options.rouletteDepth) {
            // Use throughput to determine continuation probability
            const maxComponent = Math.max(throughput.x, throughput.y, throughput.z);
            const continueProbability = Math.min(maxComponent, 0.95); // Cap at 95%
            
            // Probabilistically terminate the ray
            if (Math.random() > continueProbability) {
                return Color.BLACK; // Terminate ray early
            }
            
            // Compensate throughput for surviving rays to maintain unbiased result
            throughput = throughput.divide(continueProbability);
        }

        // Check if the ray hits any object in the world
        // Use tMin = 0.001 to avoid shadow acne
        const rec = this.world.hit(r, new Interval(0.001, Infinity));

        // If no hit, return background color
        if (rec === null) {
            // Compute background gradient color
            const unitDirection = r.direction.unitVector();
            const a = 0.5 * (unitDirection.y + 1.0);
            // Linear interpolation (lerp) between white and blue based on y-coordinate
            return this.background.top.multiply(1.0 - a).add(this.background.bottom.multiply(a)).multiplyVec(throughput);
        }

        // Get emitted light from the hit material
        const emitted = rec.material.emitted(rec).multiplyVec(throughput);
        
        // If the ray hits an object with a material, compute scatter result
        const scatterResult = rec.material.scatter(r, rec);

        // If the material doesn't scatter, return the emitted light only
        if (!scatterResult) {
            return emitted;
        }

        // Increment bounce count for scattered rays
        stats.bounces++;

        // Handle specular materials that return a specific ray
        if (scatterResult.scattered) {
            // Update throughput with material attenuation
            const newThroughput = throughput.multiplyVec(scatterResult.attenuation);
            
            // Recursively trace the specular ray
            const scatteredColor = this.rayColor(scatterResult.scattered, newThroughput, stats);
            return emitted.add(scatteredColor);
        }
        
        // Handle diffuse materials that return a PDF for sampling
        if (scatterResult.pdf) {
            // Create a light source PDF if we have lights available
            let lightPdfs = this.lights.map(light => light.pdf(rec.p));
            const pdf = new MixturePDF([scatterResult.pdf, ...lightPdfs], [0.5, ...lightPdfs.map(l => 0.5 / lightPdfs.length)]);
            
            // Generate a direction using the PDF
            const direction = pdf.generate();
            const scattered = new Ray(rec.p, direction);
            
            // Get the PDF value for this direction
            const pdfValue = pdf.value(direction);
            
            // Avoid division by near-zero values
            const EPSILON = 0.0001;
            if (pdfValue <= EPSILON) {
                return emitted;
            }
            
            // Get the material's BRDF value by multiplying the attenuation by the material's PDF value
            const scatterPdfValue = scatterResult.pdf.value(direction);
            const brdf = scatterResult.attenuation.multiply(scatterPdfValue);

            // Update throughput with BRDF contribution
            const newThroughput = throughput.multiplyVec(brdf).divide(pdfValue);

            // Trace the scattered ray and calculate contribution
            const incomingColor = this.rayColor(scattered, newThroughput, stats);

            // Final contribution is emitted light + incoming light
            return emitted.add(incomingColor);
        }
        
        // Fallback - just return emitted light
        return emitted;
    }

    /**
     * Determines the final pixel color based on the render mode.
     * @param pixel The pixel stats object
     * @returns The final color to write to the buffer
     */
    private finalColor(pixel: PixelStats): Color {
        switch (this.options.mode) {
            case RenderMode.Bounces:
                const avgBounces = pixel.samples > 0 ? pixel.bounces / pixel.samples : 0;
                const bounceIntensity = Math.min(avgBounces / this.options.depth, 1.0); // Normalize to [0,1]
                return Color.create(0, 0, bounceIntensity); // Blue scale
            case RenderMode.Samples:
                const sampleIntensity = Math.min(pixel.samples / this.options.samples, 1.0); // Normalize to [0,1]
                return Color.create(sampleIntensity, 0, 0); // Red scale
            case RenderMode.Default:
            default:
                // Normal color rendering
                return pixel.color.divide(pixel.samples);;
        }
    }

    /**
     * Checks if the pixel has converged based on its illuminance statistics
     * Only checks for convergence at batch intervals to avoid excessive computation
     * @param pixel Pixel object containing illuminance statistics
     * @returns Whether the pixel has converged
     */
    private pixelConverged(pixel: { samples: number, sumIll: number, sumIll2: number }): boolean {
        // Only check convergence if adaptive sampling is enabled and we have enough samples
        if (this.options.aTolerance <= 0 || this.options.samples <= 1 || pixel.samples < 2) return false;
        
        // Only check convergence at batch intervals
        if (pixel.samples % this.options.aBatch !== 0) return false;

        // Calculate mean and variance
        const mean = pixel.sumIll / pixel.samples;
        const variance = (pixel.sumIll2 - (pixel.sumIll * pixel.sumIll) / pixel.samples) / (pixel.samples - 1);
        
        // Skip convergence check if variance is invalid
        if (variance <= 0 || isNaN(variance)) return true;
        
        // Calculate 95% confidence interval
        const stdDev = Math.sqrt(variance);
        const confidenceInterval = 1.96 * stdDev / Math.sqrt(pixel.samples);
        
        // Check if confidence interval is within tolerance of the mean
        return confidenceInterval <= this.options.aTolerance * mean;
    }

    private samplePixel(i: number, j: number): { rayColor: Color, bounces: number } {
        const r = this.getRay(i,j);
        const rayStats = { bounces: 0 };
        const rayColor = this.rayColor(r, Color.WHITE, rayStats);
        return { rayColor, bounces: rayStats.bounces };
    }

    /**
     * Renders a specific region of the scene and writes the pixel data to the buffer.
     * Uses adaptive sampling if enabled to optimize rendering by focusing samples on complex areas.
     * 
     * @param buffer The buffer to write pixel data into
     * @param startX The starting X coordinate of the region (inclusive)
     * @param startY The starting Y coordinate of the region (inclusive)
     * @param width The width of the region
     * @param height The height of the region
     * @returns Statistics about the rendering process
     */
    renderRegion(buffer: Uint8ClampedArray, region: RenderRegion): RenderStats {
        const { x, y, width, height } = region;
        const endX = Math.min(x + width, this.imageWidth);
        const endY = Math.min(y + height, this.imageHeight);

        // Create a vector pool for rendering
        const pool = new VectorPool(64000);
        Vec3.usePool(pool);
        
        const renderStats = new RenderStats();

        // Render loop for the region
        for (let j = y; j < endY; ++j) {            
            for (let i = x; i < endX; ++i) {
                const offsetPixel = pool.offset;
                const pixel = new PixelStats();
                
                // Sampling loop - continue until max samples or convergence
                while (pixel.samples < this.options.samples && !this.pixelConverged(pixel)) {
                    
                    // Get and trace a ray through this pixel
                    const offsetSample = pool.offset;
                    const { rayColor, bounces } = this.samplePixel(i, j);
                    pool.reset(offsetSample);

                    // Accumulate color and bounce statistics
                    pixel.add(rayColor, bounces, this.useAdaptiveSampling);
                }
                
                // Compute final pixel color by averaging all samples
                pixel.color = this.finalColor(pixel);
                this.writeColorToBuffer(buffer, i, j, pixel.color);

                // Accumulate statistics
                renderStats.addPixel(pixel);
                pool.reset(offsetPixel);
            }
        }

        // Release the vector pool
        Vec3.usePool(null);
        
        return renderStats;
    }

    /**
     * Renders the scene and writes the pixel data to the buffer.
     * Uses adaptive sampling if enabled to optimize rendering by focusing samples on complex areas.
     * @param pixelData The buffer to write pixel data into.
     * @returns Statistics about the rendering process
     */ 
    render(pixelData: Uint8ClampedArray): RenderStats {
        return this.renderRegion(pixelData, {
            x: 0,
            y: 0,
            width: this.imageWidth,
            height: this.imageHeight
        });
    }

    /**
     * Writes the color components to the buffer at the specified offset.
     * Applies gamma correction for a more accurate color representation.
     * @param buffer The buffer to write to.
     * @param offset The starting index in the buffer for the pixel.
     * @param pixelColor The color to write.
     */
    private writeColorToBuffer(
      buffer: Uint8ClampedArray,
      i: number,
      j: number,
      pixelColor: Color,
    ): void {
        const offset = (j * this.imageWidth + i) * this.channels;

        // Apply gamma correction by taking the square root of each color component
        const r = Math.sqrt(pixelColor.x);
        const g = Math.sqrt(pixelColor.y);
        const b = Math.sqrt(pixelColor.z);
        
        // Convert to 8-bit color
        buffer[offset + 0] = Math.floor(255.999 * r); // R
        buffer[offset + 1] = Math.floor(255.999 * g); // G
        buffer[offset + 2] = Math.floor(255.999 * b); // B
    }
}