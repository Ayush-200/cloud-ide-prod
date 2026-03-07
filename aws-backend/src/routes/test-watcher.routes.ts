import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// Test endpoint to create a file and trigger chokidar
router.post('/create-test-file', async (req, res) => {
  try {
    const workspacePath = process.env.WORKSPACE_PATH || '/workspace';
    const testFilePath = path.join(workspacePath, 'test-chokidar.txt');
    const timestamp = new Date().toISOString();
    
    await fs.writeFile(testFilePath, `Chokidar test file created at ${timestamp}`);
    
    console.log('✅ Test file created:', testFilePath);
    
    res.json({
      success: true,
      message: 'Test file created',
      path: testFilePath,
      workspacePath: workspacePath,
      timestamp: timestamp
    });
  } catch (error: any) {
    console.error('❌ Error creating test file:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint to delete a file and trigger chokidar
router.post('/delete-test-file', async (req, res) => {
  try {
    const workspacePath = process.env.WORKSPACE_PATH || '/workspace';
    const testFilePath = path.join(workspacePath, 'test-chokidar.txt');
    
    await fs.unlink(testFilePath);
    
    console.log('✅ Test file deleted:', testFilePath);
    
    res.json({
      success: true,
      message: 'Test file deleted',
      path: testFilePath
    });
  } catch (error: any) {
    console.error('❌ Error deleting test file:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get watcher status
router.get('/watcher-status', (req, res) => {
  res.json({
    workspacePath: process.env.WORKSPACE_PATH || '/workspace',
    userId: process.env.USER_ID || 'N/A',
    projectName: process.env.PROJECT_NAME || 'N/A',
    sessionId: process.env.SESSION_ID || 'N/A',
    accessPointId: process.env.ACCESS_POINT_ID || 'N/A',
    cwd: process.cwd()
  });
});

export default router;
