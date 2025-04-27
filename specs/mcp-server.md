# MCP Server Specification (`src/index.ts`)

This specification outlines the basic Model Context Protocol (MCP) server setup.

## Core Functionality

-   **Server Initialization:**
    -   Initialize an `McpServer` instance using `@modelcontextprotocol/sdk`.
    -   Define server metadata (name: `HelloWorldServer`, version, display name, description).
-   **Communication:**
    -   Use Standard Input/Output (`StdioServerTransport`) for communication.
-   **Error Handling:**
    -   Implement basic global error handling for `uncaughtException` and `unhandledRejection` to ensure stability.

## Included Tools (for Testing/Example)

The server includes two basic tools primarily for demonstrating MCP functionality:

1.  **`greet` Tool:**
    -   **Purpose:** Simple text-based greeting.
    -   **Input:** Takes a `name` (string).
    -   **Output:** Returns a plain text greeting message including the provided name.
2.  **`showImage` Tool:**
    -   **Purpose:** Demonstrates image content handling.
    -   **Input:** None.
    -   **Output:** Reads `assets/red-circle.png`, encodes it, and returns it as an `image` content type. Handles file reading errors.

## Execution

-   The server logic is defined in `src/index.ts`.
-   Cursor runs this server as a tool, configured in `.cursor/mcp.json`.
-   The command used is: `npx ts-node src/index.ts` 