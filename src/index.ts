import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { startHttpServer } from "./mcpServer.js";

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
  // Determine transport mode from command line arguments
  const args = process.argv.slice(2);
  let transportMode = 'stdio';
  const transportArgIndex = args.indexOf('--transport');
  if (transportArgIndex !== -1 && args.length > transportArgIndex + 1) {
    transportMode = args[transportArgIndex + 1].toLowerCase();
  }

  console.error(`Starting MCP Server in ${transportMode} mode (determined by args).`);

  if (transportMode === 'http') {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    await startHttpServer(server, port);

  } else {
    try {
      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.error("[Stdio] MCP Server connected and listening on stdio.");
    } catch (error) {
      console.error("[Stdio] Failed to start MCP server:", error);
      process.exit(1);
    }
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