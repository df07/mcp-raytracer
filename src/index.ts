/* Specs: mcp-server.md */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { generateImageBuffer } from "./raytracer.js";
import { USE_GL_MATRIX } from "./vec3.js";

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

// Define handler for the new raytrace tool
export const raytraceToolHandler = async ({ verbose = false, width = 400, samples = 100 }: 
  { verbose?: boolean, width?: number, samples?: number }): Promise<any> => {
  console.error(`[Tool:raytrace] Request received. Generating PNG via ray tracing. Width: ${width}, Samples: ${samples}, Verbose: ${verbose}`);
  try {
    // First update samplesPerPixel in the Camera constructor
    // Generate the image using the refactored function with custom width and samples
    const pngBuffer = await generateImageBuffer(width, verbose, samples);
    const base64Data = pngBuffer.toString('base64');

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

// Register the new raytrace tool
const raytraceInputSchema = z.object({
  verbose: z.boolean().optional().default(false).describe("Log progress to stderr during generation"),
  width: z.number().optional().default(400).describe("Width of the generated image"),
  samples: z.number().optional().default(100).describe("Number of samples per pixel (higher = better quality but slower)")
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
  const options: { [key: string]: any } = {
    width: 400,
    samples: 100,
    verbose: true,
    useGlMatrix: false,
    output: null,
    iterations: 1
  };

  // Process args
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--width' || arg === '-w') {
      options.width = parseInt(args[++i], 10);
    } else if (arg === '--samples' || arg === '-s') {
      options.samples = parseInt(args[++i], 10);
    } else if (arg === '--gl-matrix') {
      options.useGlMatrix = true;
      process.env.USE_GL_MATRIX = 'true';
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    } else if (arg === '--iterations' || arg === '-i') {
      options.iterations = parseInt(args[++i], 10);
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Raytracer Performance Benchmark

Usage: node dist/src/index.js [options]

Options:
  --width, -w <number>     Image width (default: 400)
  --samples, -s <number>   Samples per pixel (default: 100)
  --gl-matrix              Use gl-matrix implementation
  --output, -o <file>      Output PNG file
  --iterations, -i <num>   Number of iterations to run (default: 1)
  --help, -h               Show this help
      `);
      process.exit(0);
    }
  }

  console.error(`Running raytracer with options:`);
  console.error(`  Width: ${options.width}`);
  console.error(`  Samples: ${options.samples}`);
  console.error(`  GL-Matrix: ${options.useGlMatrix}`);
  console.error(`  Output: ${options.output || 'none (image discarded)'}`);
  console.error(`  Iterations: ${options.iterations}`);

  const totalStartTime = Date.now();
  let totalRenderTime = 0;

  // Run multiple iterations as specified
  for (let iter = 1; iter <= options.iterations; iter++) {
    console.error(`\nIteration ${iter}/${options.iterations}:`);
    
    // Measure time
    const iterStartTime = Date.now();
    
    try {
      // Generate the image
      const pngBuffer = await generateImageBuffer(
        options.width, 
        options.verbose, 
        options.samples
      );
      
      const iterDuration = Date.now() - iterStartTime;
      totalRenderTime += iterDuration;
      console.error(`  Render time: ${iterDuration}ms`);
      
      // Save the output file (only for the first iteration if multiple)
      if (options.output && iter === 1) {
        await fs.writeFile(options.output, pngBuffer);
        console.error(`  Image saved to ${options.output}`);
      }
    } catch (error) {
      console.error(`Error in iteration ${iter}:`, error);
      process.exit(1);
    }
  }
  
  // Calculate and display stats
  const totalDuration = Date.now() - totalStartTime;
  const avgRenderTime = totalRenderTime / options.iterations;
  
  console.error(`\nPerformance Summary:`);
  console.error(`  Implementation: ${options.useGlMatrix ? 'gl-matrix' : 'native'}`);
  console.error(`  Total time: ${totalDuration}ms`);
  console.error(`  Average render time: ${avgRenderTime.toFixed(2)}ms`);
  console.error(`  Iterations: ${options.iterations}`);
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