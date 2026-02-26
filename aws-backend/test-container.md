# Docker Container Testing Guide

## Available Test Endpoints

### 1. Health Check
```bash
curl http://localhost:8080/api/test/health
```
Expected: `{"status":"healthy","timestamp":"..."}`

### 2. System Information
```bash
curl http://localhost:8080/api/test/system-info
```
Returns platform, CPU, memory, Node version, and workspace directory.

### 3. Environment Variables
```bash
curl http://localhost:8080/api/test/env-check
```
Verifies PORT, WORKSPACE_DIR, and NODE_ENV are set correctly.

### 4. Workspace Root Files
```bash
curl http://localhost:8080/api/test/workspace-root
```
Lists all files in the workspace directory.

### 5. Test Folder Structure
```bash
curl -X POST http://localhost:8080/api/test/test-folder-structure \
  -H "Content-Type: application/json" \
  -d '{"path":"/workspace"}'
```
Tests the folder structure reading functionality.

### 6. Test File Read
```bash
curl -X POST http://localhost:8080/api/test/test-file-read \
  -H "Content-Type: application/json" \
  -d '{"path":"/workspace/package.json"}'
```
Tests file reading functionality.

### 7. WebSocket Terminal Test
```javascript
// Use Socket.IO client
const socket = io('http://localhost:8080');
socket.emit('frontend-response', 'ls -la\n');
socket.on('backend-response', (data) => console.log(data));
```

## Testing Workflow

### Step 1: Build the Docker Image
```bash
docker build -t my-container-app:test .
```

### Step 2: Run the Container
```bash
docker run -d -p 8080:8080 --name test-container my-container-app:test
```

### Step 3: Run All Tests
```bash
# Health check
curl http://localhost:8080/api/test/health

# System info
curl http://localhost:8080/api/test/system-info

# Environment check
curl http://localhost:8080/api/test/env-check

# Workspace files
curl http://localhost:8080/api/test/workspace-root
```

### Step 4: Check Container Logs
```bash
docker logs test-container
```

### Step 5: Cleanup
```bash
docker stop test-container
docker rm test-container
```

## Quick Test Script

Save as `test-docker.sh`:
```bash
#!/bin/bash

echo "Testing Docker Container..."
BASE_URL="http://localhost:8080"

echo "\n1. Health Check:"
curl -s $BASE_URL/api/test/health | jq

echo "\n2. System Info:"
curl -s $BASE_URL/api/test/system-info | jq

echo "\n3. Environment Check:"
curl -s $BASE_URL/api/test/env-check | jq

echo "\n4. Workspace Root:"
curl -s $BASE_URL/api/test/workspace-root | jq

echo "\nAll tests completed!"
```

Run with: `chmod +x test-docker.sh && ./test-docker.sh`
