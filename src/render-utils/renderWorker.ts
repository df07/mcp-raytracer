import { parentPort, workerData } from 'worker_threads';
import { createCameraFromSceneData } from '../scenes/scenes.js';
import { WorkerResponse } from '../raytracer.js';
import { RenderRegion } from '../camera.js';
import { SceneData } from '../scenes/sceneData.js';
import { RenderOptions } from '../camera.js';

export type RenderWorkerData = {
  sceneData: SceneData;
  renderOptions?: RenderOptions;
  region: RenderRegion;
  workerId: number;
  sharedBuffer: SharedArrayBuffer;
};

// Worker receives: scene data, render options, region to render, thread ID, and shared buffer
const { sceneData, renderOptions, region, workerId, sharedBuffer } = workerData as RenderWorkerData

// Create scene and camera from scene data
const camera = createCameraFromSceneData(sceneData, renderOptions);

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