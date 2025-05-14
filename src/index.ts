/* Specs: mcp-server.md */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { generateImageBuffer, RaytracerOptions } from './raytracer.js';
import { SceneConfig } from './sceneGenerator.js';
import { CameraOptions } from './camera.js';
import { RandomSceneOptions } from './sceneGenerator.js';

// Helper to get the root directory (assuming index.ts is in src)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // Gets the directory of the current module (src)
const projectRoot = path.resolve(__dirname, '..'); // Go up one level from src


// Export the server instance for testing
export const server = new McpServer({
  name: "HelloWorldServer",
  version: "0.0.1",
  displayName: "Hello World MCP Server",
  description: "A basic MCP server example.",
  capabilities: {
    resources: { listChanged: false },
    tools: { listChanged: false },
  },
});

// Define and export handlers for testing
export const greetToolHandler = async ({ name }: { name: string }): Promise<any> => {
  console.error(`[Tool:greet] Request with name: ${name}. Returning text.`);
  return { 
    content: [{ type: "text", text: `Hi there, ${name}!` }] 
  };
};

export const showImageToolHandler = async (/* No args expected */): Promise<any> => { 
  console.error(`[Tool:showImage] Request received. Reading and returning image file.`);
  try {
    const imagePath = path.resolve(projectRoot, 'assets', 'red-circle.png');
    console.error(`[Tool:showImage] Reading image from: ${imagePath}`);
    const imageBuffer = await fs.readFile(imagePath);
    const base64Data = imageBuffer.toString('base64');

    return {
      content: [
        {
          type: "image",
          data: base64Data,
          mimeType: "image/png",
        },
      ],
    };
  } catch (error) {
    console.error(`[Tool:showImage] Error reading or encoding image:`, error);
    return {
      content: [
        {
          type: "text",
          text: `Error processing image for showImage tool: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true, 
    };
  }
};

// Define handler for the raytrace tool with parallel support
export const raytraceToolHandler = async (args: {
  verbose?: boolean,
  parallel?: boolean,
  threads?: number,
  scene?: {
    type: 'default',
    camera?: {
      imageWidth?: number,
      imageHeight?: number,
      vfov?: number,
      lookFrom?: any,
      lookAt?: any,
      vUp?: any,
      samples?: number,
      adaptiveTolerance?: number,
      adaptiveBatchSize?: number
    }
  } | {
    type: 'random',
    camera?: {
      imageWidth?: number,
      imageHeight?: number,
      vfov?: number,
      lookFrom?: any,
      lookAt?: any,
      vUp?: any,
      samples?: number,
      adaptiveTolerance?: number,
      adaptiveBatchSize?: number
    },
    options?: {
      count?: number,
      centerPoint?: any,
      radius?: number,
      minSphereRadius?: number,
      maxSphereRadius?: number,
      groundSphere?: boolean,
      groundY?: number,
      groundRadius?: number,
      seed?: number
    }
  }
}): Promise<any> => {
  const { 
    scene = { type: 'default' as const },
    verbose = false,
    parallel = true,
    threads 
  } = args;
  
  console.error(`[Tool:raytrace] Request received. Generating PNG via ray tracing. Parallel: ${parallel}, Verbose: ${verbose}, Scene: ${JSON.stringify(scene)}`);
  
  try {
    // Generate the image using the specified rendering options
    const buffer = await generateImageBuffer(scene, { 
      parallel, 
      threads,
      verbose 
    });
      
    const base64Data = buffer.toString('base64');

    return {
      content: [
        {
          type: "image",
          data: base64Data,
          mimeType: "image/png",
        },
      ],
    };
  } catch (error) {
    console.error(`[Tool:raytrace] Error generating PNG:`, error);
    return {
      content: [
        {
          type: "text",
          text: `Error processing image for raytrace tool: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
};

// Register tools using the exported handlers
server.tool(
  "greet",
  { name: z.string().describe("The name of the person to greet") },
  greetToolHandler // Use adjusted handler
);

server.tool(
  "showImage", 
  "Displays a red circle image.", 
  showImageToolHandler // Use adjusted handler
);

// Define the schema for camera options
const cameraOptionsSchema = z.object({
  imageWidth: z.number().optional().describe("Width of the rendered image"),
  imageHeight: z.number().optional().describe("Height of the rendered image"),
  vfov: z.number().optional().describe("Vertical field of view in degrees"),
  lookFrom: z.any().optional().describe("Camera position"),
  lookAt: z.any().optional().describe("Look-at position"),
  vUp: z.any().optional().describe("Camera's up direction"),
  samples: z.number().optional().describe("Anti-aliasing samples per pixel"),
  adaptiveTolerance: z.number().optional().describe("Tolerance for convergence in adaptive sampling"),
  adaptiveBatchSize: z.number().optional().describe("Number of samples to batch for adaptive sampling")
});

// Define the schema for random scene options
const randomSceneOptionsSchema = z.object({
  count: z.number().optional().describe("Number of spheres to generate"),
  centerPoint: z.any().optional().describe("Center point for sphere distribution"),
  radius: z.number().optional().describe("Radius of the distribution area"),
  minSphereRadius: z.number().optional().describe("Minimum radius for generated spheres"),
  maxSphereRadius: z.number().optional().describe("Maximum radius for generated spheres"),
  groundSphere: z.boolean().optional().describe("Whether to include a large ground sphere"),
  groundY: z.number().optional().describe("Y-position of the ground sphere"),
  groundRadius: z.number().optional().describe("Radius of the ground sphere"),
  seed: z.number().optional().describe("Random seed for deterministic scene generation")
});

// Register the raytrace tool with proper schema
const raytraceInputSchema = z.object({
  verbose: z.boolean().optional().default(false).describe("Log progress to stderr during generation"),
  parallel: z.boolean().optional().default(true).describe("Use parallel rendering with worker threads"),
  threads: z.number().optional().describe("Number of worker threads to use (default: CPU cores - 1)"),
  scene: z.union([
    z.object({
      type: z.literal('default'),
      camera: cameraOptionsSchema.optional()
    }).optional(),
    z.object({
      type: z.literal('random'),
      camera: cameraOptionsSchema.optional(),
      options: randomSceneOptionsSchema.optional()
    })
  ]).optional().default({ type: 'default' }).describe("Scene configuration")
});

server.tool(
  "raytrace",
  "Generates a PNG image using a simple raytracer.",
  raytraceInputSchema.shape,
  raytraceToolHandler
);

async function runServer() {
  console.error(`Starting MCP Server in stdio mode. Current working directory: ${process.cwd()}`);
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // Log expected tools upon successful connection 
    // (Dynamic lookup failed or was unreliable)
    console.error(`[Stdio] MCP Server connected. Tools: [greet, showImage, raytrace]`);
  } catch (error) {
    console.error("[Stdio] Failed to start MCP server:", error);
    process.exit(1);
  }
}

// Function to check if the module is run directly (ESM equivalent)
function isMainModule(importMetaUrl: string) {
  return fileURLToPath(importMetaUrl) === process.argv[1];
}

// New function to run performance testing from command line
async function runRaytracerBenchmark() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const cameraOptions: CameraOptions = {};
  const randomSceneOptions: RandomSceneOptions = {};
  const generationOptions = {
    verbose: true,
    output: null as string | null,
    iterations: 1,
    parallel: false,
    threads: undefined as number | undefined
  };
  // Process args
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--width' || arg === '-w') {
      cameraOptions.imageWidth = parseInt(args[++i], 10);
      cameraOptions.imageHeight = Math.ceil(cameraOptions.imageWidth / (16 / 9)); // Maintain 16:9 aspect ratios
    } else if (arg === '--samples' || arg === '-s') {
      cameraOptions.samples = parseInt(args[++i], 10);
    } else if (arg === '--output' || arg === '-o') {
      generationOptions.output = args[++i];
    } else if (arg === '--iterations' || arg === '-i') {
      generationOptions.iterations = parseInt(args[++i], 10);
    } else if (arg === '--spheres') {
      randomSceneOptions.count = parseInt(args[++i], 10);
    } else if (arg === '--seed') {
      randomSceneOptions.seed = parseInt(args[++i], 10);
    } else if (arg === '--adaptive-tolerance' || arg === '--at') {
      cameraOptions.adaptiveTolerance = parseFloat(args[++i]);
    } else if (arg === '--adaptive-batch' || arg === '--ab') {
      cameraOptions.adaptiveBatchSize = parseInt(args[++i], 10);
    } else if (arg === '--parallel' || arg === '-p') {
      generationOptions.parallel = true;
    } else if (arg === '--threads' || arg === '-t') {
      generationOptions.threads = parseInt(args[++i], 10);
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Raytracer Performance Benchmark

Usage: node dist/src/index.js [options]

Options:
  --width, -w <number>     Image width (default: 400)  
  --samples, -s <number>   Samples per pixel (default: 100)
  --output, -o <file>      Output PNG file  
  --iterations, -i <num>   Number of iterations to run (default: 1)
  --spheres <number>       Number of random spheres to generate (0 = default scene)
  --seed <number>          Random seed for deterministic scene generation
  --adaptive-tolerance <n> Convergence tolerance for adaptive sampling (default: 0.05)
  --adaptive-batch <n>     Number of samples to process in one batch (default: 32)
  --parallel, -p           Use parallel rendering with worker threads
  --threads, -t <number>   Number of worker threads to use
  --help, -h               Show this help
      `);
      process.exit(0);
    }
  }
  console.error(`Running raytracer with options:`);
  console.error(`  Dimensions: ${cameraOptions.imageWidth}x${cameraOptions.imageHeight}`);
  console.error(`  Samples: ${cameraOptions.samples}`);
  console.error(`  Output: ${generationOptions.output || 'none (image discarded)'}`);
  if (generationOptions.iterations > 1) {
    console.error(`  Iterations: ${generationOptions.iterations}`);
  }
  if (generationOptions.parallel) {
    console.error(`  Parallel: true ${generationOptions.threads ? `(${generationOptions.threads} threads)` : ''}`);
  }

  const totalStartTime = Date.now();
  let totalRenderTime = 0;

  // Run multiple iterations as specified
  for (let iter = 1; iter <= generationOptions.iterations; iter++) {
    console.error(`\nIteration ${iter}/${generationOptions.iterations}:`);

    // Measure time
    const iterStartTime = Date.now();
      try {      
        // Configure scene based on command line options
        let sceneConfig: SceneConfig;

        if (randomSceneOptions?.count) {
          sceneConfig = { 
            type: 'random', 
            camera: Object.keys(cameraOptions).length > 0 ? cameraOptions : undefined,
            options: Object.keys(randomSceneOptions).length > 0 ? randomSceneOptions : undefined 
          };
        } else {
          sceneConfig = { 
            type: 'default',
            camera: Object.keys(cameraOptions).length > 0 ? cameraOptions : undefined
          };
        }

        // Set up rendering options
        const renderOptions: RaytracerOptions = {
          parallel: generationOptions.parallel,
          threads: generationOptions.threads,
          verbose: generationOptions.verbose
        };

        // Generate the image
        const pngBuffer = await generateImageBuffer(sceneConfig, renderOptions);

        const iterDuration = Date.now() - iterStartTime;
        totalRenderTime += iterDuration;
        console.error(`  Render time: ${iterDuration}ms`);

        // Save the output file (only for the first iteration if multiple)
        if (generationOptions.output && iter === 1) {
          await fs.writeFile(generationOptions.output, pngBuffer);
          console.error(`  Image saved to ${generationOptions.output}`);
        }
    } catch (error) {
      console.error(`Error in iteration ${iter}:`, error);
      process.exit(1);
    }
  }
  
  // Calculate and display stats
  const totalDuration = Date.now() - totalStartTime;
  const avgRenderTime = totalRenderTime / generationOptions.iterations;
    console.error(`\nPerformance Summary:`);
  console.error(`  Implementation: ${generationOptions.parallel ? 'parallel' : 'single-threaded'}`);
  console.error(`  Total time: ${totalDuration}ms`);
  console.error(`  Average render time: ${avgRenderTime.toFixed(2)}ms`);
  console.error(`  Iterations: ${generationOptions.iterations}`);
}

// Only run server and attach listeners if run directly
if (isMainModule(import.meta.url)) {
  process.on('uncaughtException', (error, origin) => {
    console.error(`
===== Uncaught Exception =====
Origin: ${origin}
Error: ${error.stack || error}
============================
`);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error(`
===== Unhandled Rejection =====
Promise: ${promise}
Reason: ${reason instanceof Error ? reason.stack : reason}
=============================
`);
  });

  // Check if we should run in benchmark mode
  if (process.argv.includes('--benchmark') || process.argv.includes('-b')) {
    runRaytracerBenchmark().catch(error => {
      console.error("Error running benchmark:", error);
      process.exit(1);
    });
  } else {
    // Otherwise run the MCP server
    runServer().catch(error => {
      console.error("Error running server promise:", error);
      process.exit(1);
    });
  }
}