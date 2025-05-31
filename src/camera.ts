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
 * Camera configuration options for scene generation
 */
export interface CameraOptions {
  imageWidth?: number;           // Width of the rendered image (default: 400)
  aspectRatio?: number;          // Aspect ratio of the rendered image (default: 16/9)
  vfov?: number;                 // Vertical field of view in degrees (default: 90)
  lookFrom?: Point3;             // Camera position (default: origin)
  lookAt?: Point3;               // Look-at position (default: 0,0,-1)
  vUp?: Vec3;                    // Camera's up direction (default: 0,1,0)
  aperture?: number;             // Camera aperture size for defocus blur (default: 0, no blur)
  focusDistance?: number;        // Distance to focus plane (default: auto-calculated)
  samples?: number;              // Anti-aliasing samples per pixel (default: 100)
  adaptiveTolerance?: number;    // Tolerance for convergence in adaptive sampling (default: 0.05)
  adaptiveBatchSize?: number;    // Number of samples to batch for adaptive sampling (default: 10)
  lights?: PDFHittable[];        // Light sources for importance sampling (default: [])
  renderMode?: RenderMode;       // Render mode for visualization (default: Color)
  maxDepth?: number;             // Maximum recursion depth for ray bounces (default: 100)
  russianRouletteEnabled?: boolean;  // Enable Russian Roulette ray termination (default: true)
  russianRouletteDepth?: number;     // Minimum bounces before applying Russian Roulette (default: 3)
  backgroundTop?: Color;         // Top color for background gradient (default: white)
  backgroundBottom?: Color;      // Bottom color for background gradient (default: blue)
}

export class Camera {
    static defaultOptions: Required<CameraOptions> = {
        imageWidth: 400,
        aspectRatio: 16 / 9,
        vfov: 90,
        lookFrom: Vec3.create(0, 0, 0),
        lookAt: Vec3.create(0, 0, -1),
        vUp: Vec3.create(0, 1, 0),
        aperture: 0,                 // No defocus blur by default
        focusDistance: 1.0,          // Default focus distance
        samples: 100,
        adaptiveTolerance: 0.05,
        adaptiveBatchSize: 10,
        lights: [],
        renderMode: RenderMode.Default,
        maxDepth: 100,
        russianRouletteEnabled: true,
        russianRouletteDepth: 3,
        backgroundTop: Color.WHITE,
        backgroundBottom: Color.BLUE,
    }

    public readonly imageWidth: number;
    public readonly imageHeight: number;
    public readonly channels = 3;
    public readonly center: Vec3;
    public readonly pixel00Loc: Vec3;
    public readonly pixelDeltaU: Vec3;
    public readonly pixelDeltaV: Vec3;
    private readonly u: Vec3;
    private readonly v: Vec3;
    private readonly w: Vec3;
    private readonly world: Hittable;
    private lights: PDFHittable[];
    private readonly maxDepth: number; // Maximum recursion depth for ray bounces
    private readonly maxSamples: number; // Maximum number of samples per pixel
    private readonly adaptiveTolerance: number; // Tolerance for convergence
    private readonly adaptiveSampleBatchSize: number; // Number of samples to process in one batch
    private readonly renderMode: RenderMode; // Render mode for visualization
    private readonly russianRouletteEnabled: boolean; // Whether Russian Roulette is enabled
    private readonly russianRouletteDepth: number; // Minimum bounces before applying Russian Roulette
    private readonly backgroundTop: Color; // Top color for background gradient
    private readonly backgroundBottom: Color; // Bottom color for background gradient
    
    // Defocus blur properties
    private readonly aperture: number;
    private readonly focusDistance: number;
    private readonly defocusDiskU: Vec3;
    private readonly defocusDiskV: Vec3;

    constructor(        
        world: Hittable,
        options?: CameraOptions,
    ) {
        this.world = world;

        const loptions: Required<CameraOptions> = {...Camera.defaultOptions, ...options};

        this.imageWidth = loptions.imageWidth;
        this.imageHeight = Math.ceil(this.imageWidth / loptions.aspectRatio);
        this.center = loptions.lookFrom;
        this.maxDepth = loptions.maxDepth;
        this.maxSamples = loptions.samples;
        this.adaptiveTolerance = loptions.adaptiveTolerance;
        this.adaptiveSampleBatchSize = loptions.adaptiveBatchSize;
        this.lights = loptions.lights;
        this.renderMode = loptions.renderMode;
        this.russianRouletteEnabled = loptions.russianRouletteEnabled;
        this.russianRouletteDepth = loptions.russianRouletteDepth;
        this.backgroundTop = loptions.backgroundTop;
        this.backgroundBottom = loptions.backgroundBottom;

        // Initialize defocus blur properties
        this.aperture = loptions.aperture;
        // Auto-calculate focus distance if not provided
        this.focusDistance = loptions.focusDistance || loptions.lookFrom.subtract(loptions.lookAt).length();

        // Determine viewport dimensions.
        const theta = loptions.vfov * (Math.PI / 180); // Convert vfov to radians
        const h = Math.tan(theta / 2);
        const viewportHeight = 2 * h * this.focusDistance;
        const aspectRatio = this.imageWidth / this.imageHeight;
        const viewportWidth = viewportHeight * aspectRatio;

        // Calculate the u,v,w unit basis vectors for the camera coordinate frame.
        // Use vec3 methods instead of standalone functions
        this.w = loptions.lookFrom.subtract(loptions.lookAt).unitVector();
        this.u = loptions.vUp.cross(this.w).unitVector();
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
        
        if (this.maxSamples > 1) {
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
        if (stats.bounces >= this.maxDepth) {
            return Color.BLACK;
        }

        // Apply Russian Roulette termination if enabled and after minimum depth
        if (this.russianRouletteEnabled && stats.bounces >= this.russianRouletteDepth) {
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
            return this.backgroundTop.multiply(1.0 - a).add(this.backgroundBottom.multiply(a)).multiplyVec(throughput);
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
     * @param renderMode The current render mode
     * @param pixelColor Accumulated color from ray tracing
     * @param pixelBounces Total bounces for this pixel
     * @param sampleCount Number of samples taken for this pixel
     * @returns The final color to write to the buffer
     */
    private specialRenderModeColor(
        pixelColor: Color, 
        pixelBounces: number, 
        sampleCount: number
    ): Color {
        switch (this.renderMode) {
            case RenderMode.Bounces:
                // Visualize average bounces per ray for this pixel (bluescale)
                const avgBounces = sampleCount > 0 ? pixelBounces / sampleCount : 0;
                const bounceIntensity = Math.min(avgBounces / this.maxDepth, 1.0); // Normalize to [0,1]
                return Color.create(0, 0, bounceIntensity); // Blue scale
            
            case RenderMode.Samples:
                // Visualize sample count for this pixel (redscale)
                const sampleIntensity = Math.min(sampleCount / this.maxSamples, 1.0); // Normalize to [0,1]
                return Color.create(sampleIntensity, 0, 0); // Red scale
            
            case RenderMode.Default:
            default:
                // Normal color rendering
                return pixelColor;
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
        if (this.adaptiveTolerance <= 0 || this.maxSamples <= 1 || pixel.samples < 2) return false;
        
        // Only check convergence at batch intervals
        if (pixel.samples % this.adaptiveSampleBatchSize !== 0) return false;

        // Calculate mean and variance
        const mean = pixel.sumIll / pixel.samples;
        const variance = (pixel.sumIll2 - (pixel.sumIll * pixel.sumIll) / pixel.samples) / (pixel.samples - 1);
        
        // Skip convergence check if variance is invalid
        if (variance <= 0 || isNaN(variance)) return true;
        
        // Calculate 95% confidence interval
        const stdDev = Math.sqrt(variance);
        const confidenceInterval = 1.96 * stdDev / Math.sqrt(pixel.samples);
        
        // Check if confidence interval is within tolerance of the mean
        return confidenceInterval <= this.adaptiveTolerance * mean;
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
    renderRegion(
        buffer: Uint8ClampedArray,
        startX: number,
        startY: number,
        width: number,
        height: number
    ): RenderStats {
        // Create a vector pool for rendering
        const pool = new VectorPool(64000);
        Vec3.usePool(pool);
        
        const renderStats = new RenderStats();
        
        // Ensure the region is within the image bounds
        const endX = Math.min(startX + width, this.imageWidth);
        const endY = Math.min(startY + height, this.imageHeight);

        const useAdaptiveSampling = this.adaptiveTolerance > 0 && this.maxSamples > 1;

        // Render loop for the region
        for (let j = startY; j < endY; ++j) {            
            for (let i = startX; i < endX; ++i) {
                const offsetPixel = pool.offset;
                const pixel = new PixelStats();
                
                // Sampling loop - continue until max samples or convergence
                while (pixel.samples < this.maxSamples && !this.pixelConverged(pixel)) {
                    const offsetSample = pool.offset;
                    
                    // Get and trace a ray through this pixel
                    const r = this.getRay(i,j);
                    const rayStats = { bounces: 0 };
                    const rayColor = this.rayColor(r, Color.WHITE, rayStats);
                    pixel.addSample(rayColor, rayStats.bounces, useAdaptiveSampling);
                    
                    // Reset the vector pool offset
                    pool.reset(offsetSample);

                    pixel.color = pixel.color.add(rayColor);
                }
                
                // Compute final pixel color by averaging all samples
                pixel.color = pixel.color.divide(pixel.samples);

                // Determine final pixel color based on render mode
                if (this.renderMode !== RenderMode.Default) {
                    pixel.color = this.specialRenderModeColor(pixel.color, pixel.bounces, pixel.samples);
                }
                
                // Update statistics
                renderStats.addPixel(pixel);
                
                // Write directly to the full image buffer at the correct position
                const bufferIndex = (j * this.imageWidth + i) * this.channels;
                this.writeColorToBuffer(buffer, bufferIndex, pixel.color);

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
        return this.renderRegion(pixelData, 0, 0, this.imageWidth, this.imageHeight);
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
}