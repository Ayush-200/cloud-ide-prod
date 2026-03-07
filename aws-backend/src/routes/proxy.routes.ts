import express from 'express';
import { proxyToLocalhost } from '../controller/proxy.controller.js';

const router = express.Router();

// Proxy route - forwards all requests to localhost:port
router.all('/:port/*path', proxyToLocalhost);
router.all('/:port', proxyToLocalhost);

export default router;
