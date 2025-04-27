import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Helper to get the root directory (assuming index.ts is in src)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // Gets the directory of the current module (src)
const projectRoot = path.resolve(__dirname, '..'); // Go up one level from src

const server = new McpServer({
  name: "HelloWorldServer",
  version: "0.0.1",
  displayName: "Hello World MCP Server",
  description: "A basic MCP server example.",
  capabilities: {
    resources: { listChanged: false },
    tools: { listChanged: false },
  },
});

server.tool(
  "greet",
  { name: z.string().describe("The name of the person to greet") },
  async ({ name }, exchange) => {
    // Revert to simple text greeting
    console.error(`[Tool:greet] Request with name: ${name}. Returning text.`);
    return { 
      content: [{ type: "text", text: `Hi there, ${name}!` }] 
    };
  }
);

server.tool(
  "showRedCircle", 
  "Displays a red circle image.", // Provide description directly
  async (/* No args expected */) => { // Simpler handler signature
    console.error(`[Tool:showRedCircle] Request received. Reading and returning image file.`);
    try {
      const imagePath = path.join(projectRoot, 'assets', 'red-circle.png');
      console.error(`[Tool:showRedCircle] Reading image from: ${imagePath}`);
      const imageBuffer = await fs.readFile(imagePath);
      const base64Data = imageBuffer.toString('base64');

      // Return value structure
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
      console.error(`[Tool:showRedCircle] Error reading or encoding image:`, error);
      // Error return value structure
      return {
        content: [
          {
            type: "text",
            text: `Error processing image for showRedCircle tool: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true, 
      };
    }
  }
);

async function runServer() {
  console.error(`Starting MCP Server in stdio mode.`);
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[Stdio] MCP Server connected and listening on stdio.");
  } catch (error) {
    console.error("[Stdio] Failed to start MCP server:", error);
    process.exit(1);
  }
}

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

runServer().catch(error => {
  console.error("Error running server promise:", error);
  process.exit(1);
});