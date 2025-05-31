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

    updatePixelStats(sampleCount: number, pixelBounces: number): void {
        this.samples.total += sampleCount;
        this.samples.min = Math.min(this.samples.min, sampleCount);
        this.samples.max = Math.max(this.samples.max, sampleCount);
        this.bounces.total += pixelBounces;
        this.pixels++;

        // Update averages
        this.samples.avg = this.samples.total / this.pixels;
        this.bounces.avg = this.samples.total > 0 ? this.bounces.total / this.samples.total : 0;
    }

    updateBounceStats(bounces: number): void {
        this.bounces.min = Math.min(this.bounces.min, bounces);
        this.bounces.max = Math.max(this.bounces.max, bounces);
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