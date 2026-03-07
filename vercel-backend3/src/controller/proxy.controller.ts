import type { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { getSessionById } from '../repositories/session.repository.js';

// Debug endpoint to check session info
export const getSessionInfo = async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;

  if (!sessionId) {
    return res.status(400).json({ 
      error: 'sessionId query parameter is required',
      example: '/output/debug?sessionId=your-session-id'
    });
  }

  const session = await getSessionById(sessionId);

  if (!session) {
    return res.status(404).json({ 
      error: 'Session not found',
      sessionId: sessionId
    });
  }

  return res.json({
    sessionId: session.sessionId,
    privateIp: session.privateIp,
    taskArn: session.taskArn,
    userId: session.userId,
    projectId: session.projectId,
    createdAt: session.createdAt,
    message: 'Session found successfully',
    testUrls: {
      port5173: `http://localhost:4000/output/5173?sessionId=${sessionId}`,
      port3000: `http://localhost:4000/output/3000?sessionId=${sessionId}`,
      port8080: `http://localhost:4000/output/8080?sessionId=${sessionId}`
    }
  });
};

// Proxy handler for /output/:port routes
export const proxyToContainer = async (req: Request, res: Response, next: NextFunction) => {
  const portParam = req.params.port;
  const port = Array.isArray(portParam) ? portParam[0] : portParam;
  const sessionId = req.query.sessionId as string;

  console.log('=== PROXY REQUEST ===');
  console.log('Port:', port);
  console.log('SessionId:', sessionId);
  console.log('Full URL:', req.url);
  console.log('Path:', req.path);

  if (!sessionId) {
    return res.status(400).json({ 
      error: 'sessionId query parameter is required',
      example: `/output/${port}?sessionId=your-session-id`
    });
  }

  // Get session from database
  const session = await getSessionById(sessionId);

  console.log('Session from DB:', session);

  if (!session) {
    return res.status(404).json({ 
      error: 'Session not found or expired',
      sessionId: sessionId
    });
  }

  const privateIp = session.privateIp;

  console.log('Private IP:', privateIp);

  // Validate port number
  const portNum = parseInt(port);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    return res.status(400).json({ error: 'Invalid port number' });
  }

  const targetUrl = `http://${privateIp}:${port}`;
  console.log(`Attempting to proxy to: ${targetUrl}`);
  console.log(`Original path: ${req.path}`);
  console.log(`Original URL: ${req.url}`);

  // Create proxy middleware dynamically
  const proxy = createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    ws: true,
    pathRewrite: (path: string) => {
      // The path here is relative to the router mount point (/output)
      // So /output/5173 becomes /5173
      // We need to remove /:port from the beginning
      
      let newPath = path;
      
      // Remove /:port pattern (e.g., /5173)
      newPath = newPath.replace(new RegExp(`^/${port}`), '');
      
      // Remove sessionId query parameter
      newPath = newPath.replace(/[?&]sessionId=[^&]*&?/, '');
      
      // Clean up query string
      if (newPath.includes('?')) {
        const parts = newPath.split('?');
        const queryString = parts[1];
        if (!queryString || queryString.trim() === '') {
          newPath = parts[0];
        }
      }
      
      // Default to / if empty
      if (!newPath || newPath === '?') {
        newPath = '/';
      }
      
      console.log(`Path rewrite: ${path} -> ${newPath}`);
      return newPath;
    },
  });

  // Execute the proxy
  proxy(req, res, next);
};
