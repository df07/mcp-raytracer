import { parentPort, workerData } from 'worker_threads';
import { generateScene, SceneConfig } from '../scenes/scenes.js';
import { WorkerResponse } from '../raytracer.js';
import { RenderRegion } from '../camera.js';

export type RenderWorkerData = {
  sceneConfig: SceneConfig;
  region: RenderRegion;
  workerId: number;
  sharedBuffer: SharedArrayBuffer;
};

// Worker receives: scene config, region to render, thread ID, and shared buffer
const { sceneConfig, region, workerId, sharedBuffer } = workerData as RenderWorkerData

// Create scene and camera 
const camera = generateScene(sceneConfig);

// Use the shared buffer for pixel data
const pixelData = new Uint8ClampedArray(sharedBuffer);

// Render the region directly to the shared buffer
const stats = camera.renderRegion(pixelData, region);

const response: WorkerResponse = { 
  completed: true,
  workerId,
  stats
};

// Signal completion to the main thread (no need to send pixel data back)
parentPort?.postMessage(response); 