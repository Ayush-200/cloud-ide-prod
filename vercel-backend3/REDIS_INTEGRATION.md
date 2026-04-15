# Redis Integration for Workspace Management

## Overview
This integration stores workspace information in Redis to enable the reverse proxy to route requests to the correct container based on workspace ID (session ID).

## Architecture

### Data Flow
```
1. User creates/opens project
2. Fargate task starts → Private IP assigned
3. Store in Redis: workspace:{sessionId} → { ip, userId, projectName, sessionId, taskArn }
4. Reverse proxy queries Redis to get container IP
5. Proxy routes request to correct container
6. On session end → Delete from Redis
```

## Redis Data Structure

### Key Format
```
workspace:{sessionId}
```

### Value Format (JSON)
```json
{
  "ip": "10.0.2.45",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "projectName": "my-react-app",
  "sessionId": "V1StGXR8_Z5jdHi6B-myT",
  "taskArn": "arn:aws:ecs:us-east-1:123456789:task/my-cluster/abc123"
}
```

## Implementation

### 1. Store Workspace (Session Start)
**Location:** `vercel-backend3/src/controller/session.ts`

```typescript
await storeWorkspaceInRedis(sessionId, {
  ip: privateIp,
  userId,
  projectName,
  sessionId,
  taskArn
});
```

**When:** After Fargate task reaches RUNNING state and private IP is extracted

### 2. Retrieve Workspace (Reverse Proxy)
**Location:** `reverse-proxy/resolver.ts`

```typescript
const containerIp = await getContainerIp(workspaceId);
// Returns: "10.0.2.45"
```

**When:** On every incoming request to route to correct container

### 3. Delete Workspace (Session End)
**Location:** `vercel-backend3/src/controller/session.ts`

```typescript
await deleteWorkspaceFromRedis(sessionId);
```

**When:** User closes session or container is stopped

## Files Created/Modified

### New Files
1. `vercel-backend3/src/utils/redis.ts` - Redis client configuration
2. `vercel-backend3/src/services/workspace.service.ts` - Workspace CRUD operations

### Modified Files
1. `vercel-backend3/src/controller/session.ts` - Added Redis storage on start/stop
2. `reverse-proxy/resolver.ts` - Fixed field name from `containerIp` to `ip`
3. `vercel-backend3/package.json` - Added `ioredis` dependency
4. `vercel-backend3/.env` - Added Redis configuration

## Environment Variables

Add to `.env`:
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
```

For production, update with your Redis instance details (e.g., AWS ElastiCache, Redis Cloud).

## Installation

```bash
cd vercel-backend3
npm install
```

This will install the `ioredis` package.

## Usage Examples

### Store Workspace
```typescript
import { storeWorkspaceInRedis } from './services/workspace.service.js';

await storeWorkspaceInRedis('session-123', {
  ip: '10.0.2.45',
  userId: 'user-456',
  projectName: 'my-app',
  sessionId: 'session-123',
  taskArn: 'arn:aws:ecs:...'
});
```

### Retrieve Workspace
```typescript
import { getWorkspaceFromRedis } from './services/workspace.service.js';

const workspace = await getWorkspaceFromRedis('session-123');
console.log(workspace.ip); // "10.0.2.45"
```

### Delete Workspace
```typescript
import { deleteWorkspaceFromRedis } from './services/workspace.service.js';

await deleteWorkspaceFromRedis('session-123');
```

### Update IP (Container Restart)
```typescript
import { updateWorkspaceIpInRedis } from './services/workspace.service.js';

await updateWorkspaceIpInRedis('session-123', '10.0.3.78');
```

## Reverse Proxy Integration

The reverse proxy uses the workspace ID from the request to look up the container IP:

```typescript
// In reverse-proxy/resolver.ts
const containerIp = await getContainerIp(workspaceId);

// In reverse-proxy/proxy.ts
const target = `http://${containerIp}:${port}`;
proxy.web(req, res, { target, changeOrigin: true });
```

## Benefits

1. **Fast Lookup**: Redis provides O(1) lookup time for container IPs
2. **Decoupled Architecture**: Reverse proxy doesn't need database access
3. **Scalability**: Redis can handle millions of workspace mappings
4. **Session Persistence**: Workspace data survives backend restarts
5. **Easy Cleanup**: Automatic deletion when sessions end

## Error Handling

All Redis operations include error handling:
- Connection errors are logged
- Failed operations throw errors with descriptive messages
- Workspace not found returns null (for retrieval)

## Monitoring

Redis operations log to console:
- ✅ Success messages (green checkmark)
- ⚠️ Warning messages (yellow warning)
- ❌ Error messages (red X)

Example logs:
```
✅ Redis connected successfully
✅ Stored workspace in Redis: workspace:V1StGXR8_Z5jdHi6B-myT
✅ Retrieved container IP for workspace V1StGXR8_Z5jdHi6B-myT: 10.0.2.45
✅ Deleted workspace from Redis: workspace:V1StGXR8_Z5jdHi6B-myT
```

## Production Considerations

1. **Redis Persistence**: Enable RDB or AOF persistence
2. **High Availability**: Use Redis Sentinel or Cluster
3. **TTL**: Consider adding expiration time for stale workspaces
4. **Monitoring**: Set up Redis monitoring (memory, connections, latency)
5. **Security**: Use Redis AUTH and TLS for production

## Future Enhancements

1. Add TTL (Time To Live) for automatic cleanup of stale workspaces
2. Implement Redis pub/sub for real-time workspace updates
3. Add workspace metadata (creation time, last accessed, etc.)
4. Implement workspace health checks
5. Add Redis connection pooling for better performance
