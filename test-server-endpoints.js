#!/usr/bin/env node

/**
 * Test script to verify server endpoints and WebSocket connectivity
 * Run this script to test if your hosted server is working correctly
 */

const https = require('https');
const WebSocket = require('ws');

const API_BASE_URL = 'https://api.vendors.biec.in';
const WS_URL = 'wss://api.vendors.biec.in/ws';

console.log('🔍 Testing Server Endpoints...\n');

// Test 1: Basic API Health Check
function testApiHealth() {
  return new Promise((resolve) => {
    console.log('1. Testing API Health Check...');
    
    const req = https.get(`${API_BASE_URL}/`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('   ✅ API is responding');
          console.log(`   📄 Response: ${data.trim()}`);
        } else {
          console.log(`   ❌ API returned status: ${res.statusCode}`);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ API connection failed: ${error.message}`);
      resolve();
    });

    req.setTimeout(10000, () => {
      console.log('   ❌ API request timed out');
      req.destroy();
      resolve();
    });
  });
}

// Test 2: Static File Serving
function testStaticFiles() {
  return new Promise((resolve) => {
    console.log('\n2. Testing Static File Serving...');
    
    const req = https.get(`${API_BASE_URL}/uploads/`, (res) => {
      if (res.statusCode === 200 || res.statusCode === 403) {
        console.log('   ✅ Static file endpoint is accessible');
      } else {
        console.log(`   ❌ Static file endpoint returned: ${res.statusCode}`);
      }
      resolve();
    });

    req.on('error', (error) => {
      console.log(`   ❌ Static file test failed: ${error.message}`);
      resolve();
    });

    req.setTimeout(5000, () => {
      console.log('   ❌ Static file request timed out');
      req.destroy();
      resolve();
    });
  });
}

// Test 3: WebSocket Connection
function testWebSocket() {
  return new Promise((resolve) => {
    console.log('\n3. Testing WebSocket Connection...');
    
    try {
      const ws = new WebSocket(WS_URL);
      
      const timeout = setTimeout(() => {
        console.log('   ❌ WebSocket connection timed out');
        ws.close();
        resolve();
      }, 10000);

      ws.on('open', () => {
        console.log('   ✅ WebSocket connection established');
        clearTimeout(timeout);
        
        // Send a test message
        ws.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }));
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log(`   📨 Received message: ${message.type}`);
          if (message.type === 'pong') {
            console.log('   ✅ WebSocket ping/pong working');
          }
        } catch (error) {
          console.log('   📨 Received non-JSON message');
        }
      });

      ws.on('close', (code, reason) => {
        console.log(`   🔌 WebSocket closed: ${code} ${reason}`);
        clearTimeout(timeout);
        resolve();
      });

      ws.on('error', (error) => {
        console.log(`   ❌ WebSocket error: ${error.message}`);
        clearTimeout(timeout);
        resolve();
      });

    } catch (error) {
      console.log(`   ❌ WebSocket creation failed: ${error.message}`);
      resolve();
    }
  });
}

// Test 4: CORS Headers
function testCORS() {
  return new Promise((resolve) => {
    console.log('\n4. Testing CORS Headers...');
    
    const req = https.request(`${API_BASE_URL}/`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://vendors.biec.in',
        'Access-Control-Request-Method': 'GET'
      }
    }, (res) => {
      const corsHeader = res.headers['access-control-allow-origin'];
      if (corsHeader) {
        console.log(`   ✅ CORS headers present: ${corsHeader}`);
      } else {
        console.log('   ❌ CORS headers missing');
      }
      resolve();
    });

    req.on('error', (error) => {
      console.log(`   ❌ CORS test failed: ${error.message}`);
      resolve();
    });

    req.setTimeout(5000, () => {
      console.log('   ❌ CORS request timed out');
      req.destroy();
      resolve();
    });

    req.end();
  });
}

// Run all tests
async function runTests() {
  await testApiHealth();
  await testStaticFiles();
  await testWebSocket();
  await testCORS();
  
  console.log('\n🏁 Testing completed!');
  console.log('\n📋 Troubleshooting Tips:');
  console.log('   • If API health check fails: Check if your server is running on port 5000');
  console.log('   • If static files fail: Verify nginx/apache is serving /uploads/ correctly');
  console.log('   • If WebSocket fails: Check if WebSocket is enabled in your reverse proxy');
  console.log('   • If CORS fails: Verify CORS configuration in server.js');
  
  process.exit(0);
}

runTests().catch(console.error);