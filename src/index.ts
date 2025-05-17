/* Specs: mcp-server.md */

import { fileURLToPath } from 'url';
import { runServer, greetToolHandler, showImageToolHandler, raytraceToolHandler } from './mcp.js';
import { runRaytracerBenchmark } from './benchmark.js';

// Function to check if the module is run directly (ESM equivalent)
function isMainModule(importMetaUrl: string) {
  return fileURLToPath(importMetaUrl) === process.argv[1];
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

  if (process.argv.includes('--benchmark') || process.argv.includes('-b')) {
    runRaytracerBenchmark().catch(error => {
      console.error("Error running benchmark:", error);
      process.exit(1);
    });
  } else if (process.argv.includes('--mcp')) {
    // Otherwise run the MCP server
    runServer().catch(error => {
      console.error("Error running server promise:", error);
      process.exit(1);
    });
  } else {
    console.error("No valid arguments provided. Use --benchmark or --mcp.");
    process.exit(1);
  }
}

// Export handlers for tests
export { greetToolHandler, showImageToolHandler, raytraceToolHandler };