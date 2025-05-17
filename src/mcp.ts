/* Specs: mcp-server.md */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { generateImageBuffer } from "./raytracer.js";
import { CameraOptions } from "./camera.js";
import { SpheresSceneOptions, RainSceneOptions } from "./sceneGenerator.js";

// Helper to get the root directory (assuming mcp.ts is in src)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // Gets the directory of the current module (src)
const projectRoot = path.resolve(__dirname, ".." ); // Go up one level from src

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
    content: [{ type: "text", text: `Hi there, ${name}!` }],
  };
};

export const showImageToolHandler = async (): Promise<any> => {
  console.error(`[Tool:showImage] Request received. Reading and returning image file.`);
  try {
    const imagePath = path.resolve(projectRoot, "assets", "red-circle.png");
    console.error(`[Tool:showImage] Reading image from: ${imagePath}`);
    const imageBuffer = await fs.readFile(imagePath);
    const base64Data = imageBuffer.toString("base64");

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

export const raytraceToolHandler = async (args: {
  verbose?: boolean,
  parallel?: boolean,
  threads?: number,
  scene?: {
    type: "default",
    camera?: CameraOptions
  } | {
    type: "spheres",
    camera?: CameraOptions,
    options?: SpheresSceneOptions,
  } | {
    type: "rain",
    camera?: CameraOptions,
    options?: RainSceneOptions,
  },
}): Promise<any> => {
  const {
    scene = { type: "default" as const },
    verbose = false,
    parallel = true,
    threads,
  } = args;

  console.error(
    `[Tool:raytrace] Request received. Generating PNG via ray tracing. Parallel: ${parallel}, Verbose: ${verbose}, Scene: ${JSON.stringify(scene)}`
  );

  try {
    // Generate the image using the specified rendering options
    const buffer = await generateImageBuffer(scene, {
      parallel,
      threads,
      verbose,
    });

    const base64Data = buffer.toString("base64");

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
  adaptiveBatchSize: z.number().optional().describe("Number of samples to batch for adaptive sampling"),
});

// Define the schema for spheres scene options
const spheresSceneOptionsSchema = z.object({
  count: z.number().optional().describe("Number of spheres to generate"),
  seed: z.number().optional().describe("Random seed for deterministic scene generation"),
});

// Define the schema for rain scene options
const rainSceneOptionsSchema = z.object({
  count: z.number().optional().describe("Number of raindrops (spheres) to generate"),
  sphereRadius: z.number().optional().describe("Radius of each raindrop sphere"),
  seed: z.number().optional().describe("Random seed for deterministic scene generation"),
});

// Register the tools with the server
server.tool(
  "greet",
  { name: z.string().describe("The name of the person to greet") },
  greetToolHandler
);

server.tool(
  "showImage",
  "Displays a red circle image.",
  showImageToolHandler
);

const raytraceInputSchema = z.object({
  verbose: z.boolean().optional().default(false).describe("Log progress to stderr during generation"),
  parallel: z.boolean().optional().default(true).describe("Use parallel rendering with worker threads"),
  threads: z.number().optional().describe("Number of worker threads to use (default: CPU cores - 1)"),
  scene: z.union([
    z.object({
      type: z.literal("default"),
      camera: cameraOptionsSchema.optional(),
    }).optional(),
    z.object({
      type: z.literal("spheres"),
      camera: cameraOptionsSchema.optional(),
      options: spheresSceneOptionsSchema.optional(),
    }),
    z.object({
      type: z.literal("rain"),
      camera: cameraOptionsSchema.optional(),
      options: rainSceneOptionsSchema.optional(),
    }),
  ])
    .optional()
    .default({ type: "default" })
    .describe("Scene configuration"),
});

server.tool(
  "raytrace",
  "Generates a PNG image using a simple raytracer.",
  raytraceInputSchema.shape,
  raytraceToolHandler
);

// Server runner for stdio mode
export async function runServer() {
  console.error(`Starting MCP Server in stdio mode. Current working directory: ${process.cwd()}`);
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // Log expected tools upon successful connection
    console.error(`[Stdio] MCP Server connected. Tools: [greet, showImage, raytrace]`);
  } catch (error) {
    console.error("[Stdio] Failed to start MCP server:", error);
    process.exit(1);
  }
} 