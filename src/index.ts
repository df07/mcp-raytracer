import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

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
  async ({ name }, exchange) => {
    console.error(`[Tool:greet] Request with name: ${name}`);
    return { content: [{ type: "text", text: `Hi there, ${name}!` }] };
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