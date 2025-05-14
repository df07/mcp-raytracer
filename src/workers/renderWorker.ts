import { parentPort, workerData } from 'worker_threads';
import { generateScene, SceneConfig } from '../sceneGenerator.js';
import { Region, WorkerResponse } from '../raytracer.js';

// Worker receives: scene config, region to render, thread ID, and shared buffer
const { sceneConfig, region, workerId, sharedBuffer, verbose } = workerData as {
  sceneConfig: SceneConfig;
  region: Region;
  workerId: number;
  sharedBuffer: SharedArrayBuffer;
  verbose: boolean;
};

// Create scene and camera 
const scene = generateScene(sceneConfig);
const camera = scene.camera;

// Use the shared buffer for pixel data
const pixelData = new Uint8ClampedArray(sharedBuffer);

// Log start if verbose
if (verbose) {
  console.error(`Worker ${workerId} rendering region: ${region.startX},${region.startY} to ${region.startX + region.width},${region.startY + region.height}`);
}

// Render the region directly to the shared buffer
const stats = camera.renderRegion(
  pixelData,
  region.startX,
  region.startY,
  region.width,
  region.height
);

const response: WorkerResponse = { 
  completed: true,
  workerId,
  stats
};

// Signal completion to the main thread (no need to send pixel data back)
parentPort?.postMessage(response); 