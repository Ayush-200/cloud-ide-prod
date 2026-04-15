// Quick test script to verify Redis Cloud connection
// Run with: node test-redis-connection.js

import Redis from 'ioredis';

const redis = new Redis({
  host: 'redis-15596.c301.ap-south-1-1.ec2.cloud.redislabs.com',
  port: 15596,
  password: 'JQXHqup6eC5sFnTb78xwJ4rMnWeoeoX7',
  tls: {}, // Enable TLS for Redis Cloud
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
  process.exit(1);
});

async function testRedis() {
  try {
    // Test 1: Set a value
    console.log('\n📝 Test 1: Setting test value...');
    await redis.set('test:connection', 'success');
    console.log('✅ Value set successfully');

    // Test 2: Get the value
    console.log('\n📖 Test 2: Getting test value...');
    const result = await redis.get('test:connection');
    console.log('✅ Value retrieved:', result);

    // Test 3: Set workspace data (like backend does)
    console.log('\n📝 Test 3: Setting workspace data...');
    const workspaceData = {
      ip: '10.0.1.98',
      userId: 'test-user-123',
      projectName: 'test-project',
      sessionId: 'test-session-abc',
      taskArn: 'arn:aws:ecs:ap-south-1:123456789:task/test'
    };
    await redis.set('workspace:test-session-abc', JSON.stringify(workspaceData));
    console.log('✅ Workspace data stored');

    // Test 4: Get workspace data (like reverse proxy does)
    console.log('\n📖 Test 4: Getting workspace data...');
    const storedData = await redis.get('workspace:test-session-abc');
    const parsedData = JSON.parse(storedData);
    console.log('✅ Workspace data retrieved:', parsedData);
    console.log('   Container IP:', parsedData.ip);

    // Test 5: List all workspace keys
    console.log('\n📋 Test 5: Listing all workspace keys...');
    const keys = await redis.keys('workspace:*');
    console.log('✅ Found', keys.length, 'workspace(s):', keys);

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await redis.del('test:connection');
    await redis.del('workspace:test-session-abc');
    console.log('✅ Cleanup complete');

    console.log('\n🎉 All tests passed! Redis Cloud is working correctly.\n');
    
    redis.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    redis.disconnect();
    process.exit(1);
  }
}

// Run tests
testRedis();
