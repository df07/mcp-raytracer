import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { Request, Response } from 'express';

// Store active SSE transports by session ID
const activeSseTransports: Record<string, SSEServerTransport> = {};

/**
 * Sets up and starts the Express server for the deprecated HTTP+SSE transport.
 * @param mcpServer The main McpServer instance.
 * @param port The port number to listen on.
 */
export async function startHttpServer(mcpServer: McpServer, port: number) {
  const app = express();
  app.use(express.json());

  // SSE endpoint for establishing the stream (GET /mcp)
  app.get('/mcp', async (req: Request, res: Response) => {
    console.log('[HTTP GET /mcp] Request received, attempting to establish SSE stream.');
    try {
      const transport = new SSEServerTransport('/messages', res);
      const sessionId = transport.sessionId;
      console.log(`[HTTP GET /mcp] Created SSEServerTransport with Session ID: ${sessionId}`);
      activeSseTransports[sessionId] = transport;

      transport.onclose = () => {
        console.log(`[HTTP GET /mcp] SSE transport closed for session ${sessionId}. Cleaning up.`);
        delete activeSseTransports[sessionId];
      };

      await mcpServer.connect(transport);
      console.log(`[HTTP GET /mcp] Server connected to transport for session ${sessionId}. SSE stream established.`);

    } catch (error) {
      console.error('[HTTP GET /mcp] Error establishing SSE stream:', error);
      if (!res.headersSent) {
        res.status(500).send('Error establishing SSE stream');
      }
    }
  });

  // Messages endpoint for receiving client JSON-RPC requests (POST /messages)
  app.post('/messages', async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string | undefined;
    console.log(`[HTTP POST /messages] Request received for session ID: ${sessionId}`);
    
    if (!sessionId) {
      console.error('[HTTP POST /messages] Missing sessionId query parameter.');
      res.status(400).send('Missing sessionId query parameter');
      return;
    }
    
    const transport = activeSseTransports[sessionId];
    if (!transport) {
      console.error(`[HTTP POST /messages] No active transport found for session ID: ${sessionId}`);
      res.status(404).send('Session not found or inactive');
      return;
    }

    try {
      console.log(`[HTTP POST /messages] Calling transport.handlePostMessage for session ${sessionId}.`);
      await transport.handlePostMessage(req, res, req.body);
      console.log(`[HTTP POST /messages] transport.handlePostMessage completed for session ${sessionId}.`);
    } catch (error) {
      console.error(`[HTTP POST /messages] Error handling POST request for session ${sessionId}:`, error);
      if (!res.headersSent) {
        try {
           res.status(500).json({ 
             jsonrpc: '2.0', 
             error: { code: -32603, message: 'Internal server error handling POST' }, 
             id: (req.body as any)?.id ?? null 
           });
        } catch (jsonError) {
            res.status(500).send('Internal server error handling POST request');
        }
      }
    }
  });

  app.listen(port, '127.0.0.1', () => {
    console.error(`[HTTP] Deprecated SSE MCP Server listening on port ${port}. SSE Endpoint: GET /mcp, Message Endpoint: POST /messages`);
  });
} 