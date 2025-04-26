import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "HelloWorldServer",
  version: "0.0.1",
  displayName: "Hello World MCP Server",
  description: "A basic MCP server example."
});

server.resource(
  "hello",
  "hello://world",
  async (uri) => {
    console.error(`[Resource:hello] Request for ${uri.href}`);
    return {
      contents: [{
        uri: uri.href,
        text: "Hello, World from MCP Server!",
        mimeType: "text/plain"
      }]
    };
  }
);

server.tool(
  "greet",
  { name: z.string().describe("The name of the person to greet") },
  async ({ name }) => {
    console.error(`[Tool:greet] Request with name: ${name}`);
    return {
      content: [{ type: "text", text: `Greetings, ${name}!` }]
    };
  }
);

async function runServer() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Server connected and listening on stdio (stderr).");
  } catch (error) {
    console.error("Failed to start MCP server (stderr):", error);
    process.exit(1);
  }
}

// --- Global Error Handling ---
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
// --- End Global Error Handling ---

runServer();