/* Specs: camera.md, pdf-sampling.md */
import { Vec3, Point3, Color } from './geometry/vec3.js';
import { Ray } from './geometry/ray.js';
import { Hittable, PDFHittable } from './geometry/hittable.js';
import { Interval } from './geometry/interval.js';
import { VectorPool } from './geometry/vec3.js';
import { MixturePDF } from './geometry/pdf.js';

/**
 * Camera configuration options for scene generation
 */
export interface CameraOptions {
  imageWidth?: number;           // Width of the rendered image (default: 400)
  imageHeight?: number;          // Height of the rendered image (default: 225)
  vfov?: number;                 // Vertical field of view in degrees (default: 90)
  lookFrom?: Point3;             // Camera position (default: origin)
  lookAt?: Point3;               // Look-at position (default: 0,0,-1)
  vUp?: Vec3;                    // Camera's up direction (default: 0,1,0)
  samples?: number;              // Anti-aliasing samples per pixel (default: 100)
  adaptiveTolerance?: number;    // Tolerance for convergence in adaptive sampling (default: 0.05)
  adaptiveBatchSize?: number;    // Number of samples to batch for adaptive sampling (default: 10)
  lights?: PDFHittable[];        // Light sources for importance sampling (default: [])
}

/**
 * Statistics from the rendering process
 */
export interface RenderStats {
    totalSamples: number;        // Total number of samples taken
    pixelCount: number;          // Total number of pixels rendered
    minSamplesPerPixel: number;  // Minimum samples for any pixel
    maxSamplesPerPixel: number;  // Maximum samples for any pixel
    avgSamplesPerPixel: number;  // Average samples per pixel
}

export class Camera {
    static defaultOptions: Required<CameraOptions> = {
        imageWidth: 400,
        imageHeight: 225, // 16:9 aspect ratio
        vfov: 90,
        lookFrom: new Vec3(0, 0, 0),
        lookAt: new Vec3(0, 0, -1),
        vUp: new Vec3(0, 1, 0),
        samples: 100,
        adaptiveTolerance: 0.05,
        adaptiveBatchSize: 10,
        lights: [],
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
    private readonly maxDepth: number = 10; // Maximum recursion depth for ray bounces
    private readonly samples: number; // Maximum number of samples per pixel
    private readonly adaptiveTolerance: number; // Tolerance for convergence
    private readonly adaptiveSampleBatchSize: number = 32; // Number of samples to process in one batch

    constructor(        
        world: Hittable,
        options?: CameraOptions,
    ) {
        this.world = world;

        const loptions: Required<CameraOptions> = {...Camera.defaultOptions, ...options};

        this.imageWidth = loptions.imageWidth;
        this.imageHeight = loptions.imageHeight;
        this.center = loptions.lookFrom;
        this.samples = loptions.samples;
        this.adaptiveTolerance = loptions.adaptiveTolerance;
        this.adaptiveSampleBatchSize = loptions.adaptiveBatchSize;
        this.lights = loptions.lights || [];

        // Determine viewport dimensions.
        const focalLength = 1.0; // Fixed focal length
        const theta = loptions.vfov * (Math.PI / 180); // Convert vfov to radians
        const h = Math.tan(theta / 2);
        const viewportHeight = 2 * h * focalLength;
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
        const viewportUpperLeft = this.center.subtract(this.w).subtract(halfViewportU).subtract(halfViewportV);
        this.pixel00Loc = viewportUpperLeft.add(this.pixelDeltaU.add(this.pixelDeltaV).multiply(0.5));
    }    
    
    /**
     * Gets a camera ray for the pixel at location i,j.
     * If anti-aliasing is enabled, generates rays with random offsets within the pixel.
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
        
        if (this.samples > 1) {
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
     * If the ray hits an object, it uses the material's PDF or scattered ray to calculate the color.
     * Otherwise, it returns a background gradient color.
     * @param r The ray.
     * @param depth Maximum recursion depth.
     * @returns The color of the ray.
     */
    rayColor(r: Ray, depth: number = this.maxDepth): Color {
        // If we've exceeded the ray bounce limit, no more light is gathered
        if (depth <= 0) {
            return Color.BLACK;
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
            return Color.WHITE.multiply(1.0 - a).add(Color.BLUE.multiply(a));
        }

        // Get emitted light from the hit material
        const emitted = rec.material.emitted(rec);
        
        // If the ray hits an object with a material, compute scatter result
        const scatterResult = rec.material.scatter(r, rec);

        // If the material doesn't scatter, return the emitted light only
        if (!scatterResult) {
            return emitted;
        }

        // Handle specular materials that return a specific ray
        if (scatterResult.scattered) {
            // Recursively trace the specular ray, multiply by attenuation, and add emitted light
            return emitted.add(
                scatterResult.attenuation.multiplyVec(
                    this.rayColor(scatterResult.scattered, depth - 1)
                )
            );
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
            
            // For diffuse materials, BRDF = albedo/π * cos(θ)
            // For Lambertian surfaces with cosine PDF, we compute:
            // BRDF / PDF = (albedo/π * cos(θ)) / (cos(θ)/π) = albedo
            
            // Get the material's BRDF value divided by its PDF value
            const scatterPdfValue = scatterResult.pdf.value(direction);
            const brdfOverPdf = scatterResult.attenuation.multiply(scatterPdfValue / pdfValue);

            // Trace the scattered ray and calculate contribution
            const incomingLight = this.rayColor(scattered, depth - 1);

            // Final contribution is emitted light + (incoming light * brdf/pdf)
            return emitted.add(incomingLight.multiplyVec(brdfOverPdf));
        }
        
        // Fallback - just return emitted light
        return emitted;
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
        const pool = new VectorPool(1600); // Create a vector pool for rendering
        
        // Ensure the region is within the image bounds
        const endX = Math.min(startX + width, this.imageWidth);
        const endY = Math.min(startY + height, this.imageHeight);
        
        // Determine if adaptive sampling should be used
        const useAdaptiveSampling = this.adaptiveTolerance > 0 && this.samples > 1;

        // Statistics tracking
        let totalSamples = 0;
        let minSamplesPerPixel = this.samples; // Start with max possible
        let maxSamplesPerPixel = 0;
        const pixelCount = (endX - startX) * (endY - startY);

        // Render loop for the region
        for (let j = startY; j < endY; ++j) {            
            for (let i = startX; i < endX; ++i) {
                // Initialize pixel data
                let pixelColor = new Color(0, 0, 0);
                let sampleCount = 0;
                
                // Statistics for adaptive sampling
                let s1 = 0; // Sum of illuminance values
                let s2 = 0; // Sum of squared illuminance values
                
                // Sampling loop - unified approach for both adaptive and non-adaptive
                while (sampleCount < this.samples) {
                    // Determine batch size for this iteration
                    const remainingSamples = this.samples - sampleCount;
                    const batchSize = useAdaptiveSampling
                        ? Math.min(this.adaptiveSampleBatchSize, remainingSamples)
                        : remainingSamples;
                    
                    // Process one batch of samples
                    for (let s = 0; s < batchSize; ++s) {
                        // Set up vector pooling for this ray
                        Vec3.usePool(pool);
                        pool.reset();
                        
                        // Get and trace a ray through this pixel with jitter
                        const r = this.getRay(i + Math.random(), j + Math.random());
                        const color = this.rayColor(r, this.maxDepth);
                        
                        // Release the vector pool
                        Vec3.usePool(null);
                        
                        // Accumulate color
                        pixelColor = pixelColor.add(color);
                        
                        // Track statistics for adaptive sampling
                        if (useAdaptiveSampling) {
                            const illuminance = color.illuminance();
                            s1 += illuminance;
                            s2 += illuminance * illuminance;
                        }
                        
                        sampleCount++;
                    }
                    
                    // Only perform convergence check if using adaptive sampling and we have enough samples
                    if (useAdaptiveSampling && sampleCount >= 2 && sampleCount < this.samples) {
                        // Check if pixel has converged using statistical analysis
                        const mean = s1 / sampleCount;
                        const variance = (s2 - (s1 * s1) / sampleCount) / (sampleCount - 1);
                        
                        // Skip convergence check if variance is invalid (constant color or numerical issue)
                        if (variance <= 0 || isNaN(variance)) break;
                        
                        // Calculate 95% confidence interval
                        const stdDev = Math.sqrt(variance);
                        const confidenceInterval = 1.96 * stdDev / Math.sqrt(sampleCount);
                        
                        // Check if confidence interval is within tolerance of the mean
                        if (confidenceInterval <= this.adaptiveTolerance * mean) {
                            break; // Pixel has converged, stop sampling
                        }
                    }
                }
                
                // Compute final pixel color by averaging all samples
                pixelColor = pixelColor.divide(sampleCount);
                
                // Update statistics
                totalSamples += sampleCount;
                minSamplesPerPixel = Math.min(minSamplesPerPixel, sampleCount);
                maxSamplesPerPixel = Math.max(maxSamplesPerPixel, sampleCount);
                
                // Write directly to the full image buffer at the correct position
                const bufferIndex = (j * this.imageWidth + i) * this.channels;
                writeColorToBuffer(buffer, bufferIndex, pixelColor);
            }
        }
        
        // Calculate average samples per pixel
        const avgSamplesPerPixel = totalSamples / pixelCount;
        
        return {
            totalSamples,
            pixelCount,
            minSamplesPerPixel,
            maxSamplesPerPixel,
            avgSamplesPerPixel
        };
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
