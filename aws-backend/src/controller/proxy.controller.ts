import type { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Cache proxy instances to prevent memory leaks
const proxyCache = new Map<string, ReturnType<typeof createProxyMiddleware>>();

// Simple proxy that forwards to localhost ports
export const proxyToLocalhost = (req: Request, res: Response, next: NextFunction) => {
  const portParam = req.params.port;
  const port = Array.isArray(portParam) ? portParam[0] : portParam;

  console.log('=== LOCAL PROXY REQUEST ===');
  console.log('Port:', port);
  console.log('Full URL:', req.url);
  console.log('Path:', req.path);

  // Validate port number
  const portNum = parseInt(port);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    return res.status(400).json({ error: 'Invalid port number' });
  }

  const targetUrl = `http://localhost:${port}`;
  console.log(`Proxying to: ${targetUrl}`);

  // Get or create cached proxy instance
  let proxy = proxyCache.get(port);
  
  if (!proxy) {
    proxy = createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      ws: true,
      pathRewrite: {
        // Remove /:port from the beginning of the path
        [`^/${port}`]: ''
      }
    });
    
    proxyCache.set(port, proxy);
    console.log(`Created new proxy instance for port ${port}`);
  } else {
    console.log(`Using cached proxy instance for port ${port}`);
  }

  // Execute the proxy
  proxy(req, res, next);
};
