# Spec: Parallel Raytracer

**Reference:** ["Ray Tracing in One Weekend"](https://raytracing.github.io/books/RayTracingInOneWeekend.html)

**Related Specs:** `specs/raytracer.md`, `specs/camera.md`

## Goal

Implement a simple parallel raytracing system using Node.js Worker Threads to improve rendering performance on multi-core systems.

## Motivation

The current raytracer performs all calculations in a single thread, which is slow for complex scenes or high-resolution images. By leveraging multi-core systems, we can significantly reduce rendering time.

## Implementation Overview

The implementation uses a simple divide-and-conquer approach:

1. **Extend Camera with Region Rendering**: Add functionality to render specific regions of an image with detailed statistics
2. **Worker-Based Parallelism**: Create worker threads that render image regions in parallel
3. **Simple API**: Maintain a consistent API with clearly defined rendering options

## Final Implementation

### 1. Camera Enhancement

The Camera class was extended to support:
- Rendering specific rectangular regions of the image
- Track detailed rendering statistics (samples per pixel, min/max/avg samples)
- Return statistics for analysis and optimization

```typescript
interface RenderStats {
    totalSamples: number;        // Total number of samples taken
    pixelCount: number;          // Total number of pixels rendered
    minSamplesPerPixel: number;  // Minimum samples for any pixel
    maxSamplesPerPixel: number;  // Maximum samples for any pixel
    avgSamplesPerPixel: number;  // Average samples per pixel
}

// Render a specific region
renderRegion(buffer, startX, startY, width, height): RenderStats {...}

// Render the entire image
render(pixelData): RenderStats {...}
```

### 2. Worker Thread Implementation

A worker thread module was created that:
- Receives scene configuration and a region to render via the worker_threads API
- Creates its own scene and camera instance in the worker context
- Renders only its assigned region directly to a shared memory buffer
- Returns rendering statistics to the main thread

```typescript
// Worker receives configuration and renders a region
import { parentPort, workerData } from 'worker_threads';
import { generateScene } from '../sceneGenerator.js';

// Use shared memory for direct rendering
const { sceneConfig, region, sharedBuffer } = workerData;
const scene = generateScene(sceneConfig);
const pixelData = new Uint8ClampedArray(sharedBuffer);

// Render directly to the shared buffer
const stats = scene.camera.renderRegion(
  pixelData,
  region.startX,
  region.startY,
  region.width,
  region.height
);

// Return rendering statistics
parentPort.postMessage({ completed: true, stats });
```

### 3. Unified Rendering API

The main raytracer module was simplified to handle both single-threaded and parallel rendering with a common interface:

```typescript
// Options for rendering
interface RaytracerOptions {
    parallel?: boolean;   // Whether to use parallel rendering (default: false)
    threads?: number;     // Number of worker threads to use (default: CPU count - 1)
    verbose?: boolean;    // Whether to log progress information (default: false)
}

// Main rendering function
async function generateImageBuffer(
    sceneConfig: SceneConfig = { type: 'default' },
    options: RaytracerOptions = {}
): Promise<Buffer>
```

### 4. Memory Sharing with SharedArrayBuffer

For optimal performance, a shared memory approach was implemented:
- The main thread creates a `SharedArrayBuffer` for pixel data
- Worker threads write directly to this buffer during rendering
- No need to copy data between threads, which would be a performance bottleneck

### 5. Region Management

The image is divided into regions for parallel processing:
- A simple row-based division strategy (horizontal strips)
- Each worker thread is assigned a region
- The total number of regions equals the number of available worker threads

```typescript
interface Region {
    startX: number;
    startY: number;
    width: number;
    height: number;
}

function divideIntoRegions(imageWidth, imageHeight, count): Region[] {...}
```

## Performance Improvements

The parallel implementation shows significant performance benefits:
- Nearly linear scaling with the number of CPU cores
- Especially effective for complex scenes with many objects
- Adaptive sampling statistics are aggregated across all workers

## Testing

The implementation includes robust testing:
- Unit tests for single-threaded and parallel rendering
- Verification of identical output between rendering modes
- Performance benchmarking for complex scenes at various resolutions

## Future Enhancements

1. **Tile-Based Division**: Improve load balancing with rectangular tiles instead of rows

2. **Dynamic Work Allocation**: Implement a task queue where workers request new regions

3. **Region-Based Adaptive Sampling**: Apply different adaptive sampling parameters to different regions

4. **Cancel Support**: Allow rendering to be cancelled midway and return a partial result 