import sharp from 'sharp';
import os from 'os';
import path from 'path';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { generateScene, generateSceneData, SceneConfig } from './scenes/scenes.js';
import { RenderStats } from './render-utils/renderStats.js';
import { RenderRegion } from './camera.js';
import { RenderWorkerData } from './render-utils/renderWorker.js';
import fs from 'fs';

// Get the directory for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Options for parallel rendering
 */
export interface RaytracerOptions {
    parallel?: boolean;   // Whether to use parallel rendering (default: false)
    threads?: number;     // Number of worker threads to use (default: CPU count - 1)
    verbose?: boolean;    // Whether to log progress information (default: false)
}

export interface WorkerResponse {
    completed: boolean;
    workerId: number;
    stats: RenderStats;
}

/**
 * Generates a PNG image buffer for the raytraced scene.
 * Can use either single-threaded or parallel processing based on options.
 *
 * @param sceneConfig The scene configuration to render
 * @param options Options for parallel rendering and verbosity
 * @returns A Promise resolving to the image buffer and render statistics
 */
export async function generateImageBuffer(
    sceneConfig: SceneConfig = { type: 'default' },
    options: RaytracerOptions = {}
): Promise<Buffer> {
    const { parallel = false, threads, verbose = false } = options;
    
    // Common setup - create scene and get dimensions
    const camera = generateScene(sceneConfig);
    const { imageWidth, imageHeight, channels } = camera;
    
    // Prepare pixel buffer - either shared for parallel or regular for single-threaded
    let pixelData: Uint8ClampedArray;
    const byteLength = imageWidth * imageHeight * channels;
    
    // Render statistics
    let renderStats: RenderStats;
    
    if (!parallel) {
        // Single-threaded rendering
        pixelData = new Uint8ClampedArray(byteLength);
        renderStats = camera.render(pixelData);
    } else {
        const threadCount = threads || Math.max(1, os.cpus().length - 1);

        if (verbose) {
            console.error(`Starting parallel render with ${threadCount} worker threads`);
        }

        // Generate scene data once for all workers
        const sceneData = generateSceneData(sceneConfig);

        // Create a shared buffer for all workers
        const sharedBuffer = new SharedArrayBuffer(byteLength);
        pixelData = new Uint8ClampedArray(sharedBuffer);
        
        // Divide into regions, and run worker on each region
        const regions = divideIntoRegions(imageWidth, imageHeight, threadCount);
        const workerPromises = regions.map((region, index) => {
            return runWorker({ 
                sceneData, 
                renderOptions: sceneConfig.render,
                region, 
                workerId: index, 
                sharedBuffer 
            }, verbose);
        });
        
        const results = await Promise.all(workerPromises);

        // Aggregate statistics from all workers
        renderStats = RenderStats.merge(results);
    }
    
    if (verbose) {
        console.error(`Adaptive sampling stats: avg=${renderStats.samples.avg.toFixed(2)}, min=${renderStats!.samples.min}, max=${renderStats!.samples.max}`);
        console.error(`Ray bounce stats: avg=${renderStats.bounces.avg.toFixed(2)}, min=${renderStats!.bounces.min}, max=${renderStats!.bounces.max}`);
    }
    
    if (pixelData.length === 0) {
        throw new Error('Generated pixelData buffer is empty before calling sharp.');
    }
    
    // Create PNG using sharp
    const pngBuffer = await sharp(Buffer.from(pixelData.buffer), {
        raw: {
            width: imageWidth,
            height: imageHeight,
            channels,
        },
    })
    .png()
    .toBuffer();
    
    return pngBuffer;
}

/**
 * Runs a worker thread to render a region of the image directly to the shared buffer
 * 
 * @param sceneConfig Scene configuration
 * @param region Region to render
 * @param workerId Worker identifier
 * @param sharedBuffer The shared buffer to write to
 * @param imageWidth Full image width
 * @param channels Number of color channels
 * @param verbose Whether to log progress
 * @returns Promise that resolves when the worker completes
 */
function runWorker(workerData: RenderWorkerData, verbose: boolean): Promise<RenderStats> {
    return new Promise((resolve, reject) => {
        // Determine the absolute path to the worker script
        // This is more robust for testing environments
        let workerScriptPath: string;
        
        try {
            // First try the standard path relative to this module
            workerScriptPath = path.resolve(__dirname, 'render-utils', 'renderWorker.js');
            
            // Check if the file exists
            if (!fs.existsSync(workerScriptPath)) {
                // Try alternate path for test environment (from project root)
                const testPath = path.resolve(process.cwd(), 'dist', 'src', 'render-utils', 'renderWorker.js');
                if (fs.existsSync(testPath)) {
                    workerScriptPath = testPath;
                } else {
                    throw new Error(`Worker script not found at: ${workerScriptPath} or ${testPath}`);
                }
            }
        } catch (err) {
            reject(err);
            return;
        }
        
        const worker = new Worker(workerScriptPath, { workerData: workerData });
        
        // Handle messages from the worker
        worker.on('message', (result: WorkerResponse) => {
            // console.error(`Worker ${workerId} completed with result:`, JSON.stringify(result, null, 2));
            resolve(result.stats);
            worker.terminate();
        });
        
        // Handle errors
        worker.on('error', (err) => {
            console.error(`Worker ${workerData.workerId} error:`, err);
            reject(err);
        });
        
        // Handle worker exit
        worker.on('exit', (code) => {
            if (code !== 0) {
                const error = new Error(`Worker ${workerData.workerId} stopped with exit code ${code}`);
                reject(error);
            }
        });
    });
}

/**
 * Divides the image into regions for parallel processing
 * 
 * @param imageWidth Image width
 * @param imageHeight Image height
 * @param count Number of regions to create
 * @returns Array of regions
 */
function divideIntoRegions(
    imageWidth: number,
    imageHeight: number,
    count: number
): RenderRegion[] {
    // Simple row-based division
    const regionHeight = Math.ceil(imageHeight / count);
    
    const regions: RenderRegion[] = [];
    for (let i = 0; i < count; i++) {
        const startY = i * regionHeight;
        const height = Math.min(regionHeight, imageHeight - startY);
        
        // If we've allocated all rows, stop creating regions
        if (height <= 0) break;
        
        regions.push({ x: 0, y: startY, width: imageWidth, height });
    }
    
    return regions;
}