import { Color } from "../geometry/vec3.js";

/**
 * Statistics from the rendering process
 */
export class RenderStats {
    public pixels = 0;
    public samples = {
        total: 0,
        min: Infinity,
        max: 0,
        avg: 0
    };
    public bounces = {
        total: 0,
        min: Infinity,
        max: 0,
        avg: 0
    };

    addPixel(pixel: PixelStats): void {
        this.pixels++;

        this.samples.total += pixel.samples;
        this.samples.min = Math.min(this.samples.min, pixel.samples);
        this.samples.max = Math.max(this.samples.max, pixel.samples);

        this.bounces.total += pixel.bounces;
        this.bounces.min = Math.min(this.bounces.min, pixel.minBounces);
        this.bounces.max = Math.max(this.bounces.max, pixel.maxBounces);

        // Update averages
        this.samples.avg = this.samples.total / this.pixels;
        this.bounces.avg = this.samples.total > 0 ? this.bounces.total / this.samples.total : 0;
    }

    /**
     * Merges multiple RenderStats objects into a single one
     * @param stats Array of RenderStats to merge
     * @returns A new RenderStats object containing the combined statistics
     */
    static merge(stats: RenderStats[]): RenderStats {
        const merged = new RenderStats();
        
        for (const stat of stats) {
            merged.pixels += stat.pixels;
            merged.samples.total += stat.samples.total;
            merged.samples.min = Math.min(merged.samples.min, stat.samples.min);
            merged.samples.max = Math.max(merged.samples.max, stat.samples.max);
            merged.bounces.total += stat.bounces.total;
            merged.bounces.min = Math.min(merged.bounces.min, stat.bounces.min);
            merged.bounces.max = Math.max(merged.bounces.max, stat.bounces.max);
        }

        // Recalculate averages
        if (merged.pixels > 0) {
            merged.samples.avg = merged.samples.total / merged.pixels;
        }
        if (merged.samples.total > 0) {
            merged.bounces.avg = merged.bounces.total / merged.samples.total;
        }

        return merged;
    }
}

export class PixelStats {
    public color = Color.BLACK;
    public samples = 0;
    public bounces = 0;
    public minBounces = Infinity;
    public maxBounces = 0;
    public sumIll = 0;
    public sumIll2 = 0;

    public addSample(rayColor: Color, bounces: number, calcIlluminance: boolean = true): void {
        this.samples++;
        this.bounces += bounces;
        this.minBounces = Math.min(this.minBounces, bounces);
        this.maxBounces = Math.max(this.maxBounces, bounces);

        if (calcIlluminance) {
            const illuminance = rayColor.illuminance();
            this.sumIll += illuminance;
            this.sumIll2 += illuminance * illuminance;
        }
    }
}