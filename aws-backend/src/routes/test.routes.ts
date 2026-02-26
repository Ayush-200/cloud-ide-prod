import express from 'express';
import { getFolderStructure, getfileData } from '../controller/container.controller.js';
import os from 'os';
import fs from 'fs/promises';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// System info
router.get('/system-info', (req, res) => {
    res.json({
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        cpus: os.cpus().length,
        totalMemory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        freeMemory: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        uptime: `${(os.uptime() / 60).toFixed(2)} minutes`,
        nodeVersion: process.version,
        workspaceDir: process.env.WORKSPACE_DIR || '/workspace'
    });
});

// Test folder structure endpoint
router.post('/test-folder-structure', getFolderStructure);

// Test file read endpoint
router.post('/test-file-read', getfileData);

// List workspace root
router.get('/workspace-root', async (req, res) => {
    try {
        const workspaceDir = process.env.WORKSPACE_DIR || '/workspace';
        const files = await fs.readdir(workspaceDir, { withFileTypes: true });
        
        res.json({
            path: workspaceDir,
            files: files.map(f => ({
                name: f.name,
                isDirectory: f.isDirectory()
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read workspace' });
    }
});

// Environment variables check
router.get('/env-check', (req, res) => {
    res.json({
        PORT: process.env.PORT || '8080',
        WORKSPACE_DIR: process.env.WORKSPACE_DIR || 'not set',
        NODE_ENV: process.env.NODE_ENV || 'not set'
    });
});

export default router;
