const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testDirectAPI() {
  try {
    console.log('🧪 Testing API endpoints directly...\n');

    // Test if server is running
    console.log('1. Testing server health...');
    const healthResponse = await axios.get(`${API_BASE_URL}/`);
    console.log('✅ Server is running:', healthResponse.data);

    // Test notifications endpoint without auth (should return 401)
    console.log('\n2. Testing notifications endpoint (should require auth)...');
    try {
      const notificationsResponse = await axios.get(`${API_BASE_URL}/api/notifications`);
      console.log('❌ Unexpected: Got response without auth:', notificationsResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly requires authentication (401)');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    // Test with a simple admin login (if we can find credentials)
    console.log('\n3. Testing with admin credentials...');
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: 'admin@imtma.in',
        password: 'admin123'
      });
      
      if (loginResponse.data.success) {
        console.log('✅ Admin login successful');
        
        const token = loginResponse.data.token;
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Now test notifications
        console.log('\n4. Testing notifications with admin token...');
        const notificationsResponse = await axios.get(`${API_BASE_URL}/api/notifications`, { headers });
        
        console.log('✅ Notifications API working!');
        console.log(`📊 Response:`, {
          success: notificationsResponse.data.success,
          total: notificationsResponse.data.total,
          count: notificationsResponse.data.count,
          unread: notificationsResponse.data.unread
        });
        
        if (notificationsResponse.data.data && notificationsResponse.data.data.length > 0) {
          console.log('\n📋 Sample notifications:');
          notificationsResponse.data.data.slice(0, 2).forEach((notification, index) => {
            console.log(`  ${index + 1}. ${notification.title}`);
            console.log(`     Type: ${notification.type}, Read: ${notification.isRead}`);
          });
        }
        
      } else {
        console.log('❌ Admin login failed:', loginResponse.data.message);
      }
    } catch (loginError) {
      console.log('❌ Login error:', loginError.response?.data?.message || loginError.message);
      console.log('💡 Trying alternative credentials...');
      
      // Try with different credentials
      try {
        const altLoginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
          email: 'admin@example.com',
          password: 'password'
        });
        console.log('✅ Alternative login worked');
      } catch (altError) {
        console.log('❌ Alternative login also failed');
        console.log('💡 You may need to check the database for correct admin credentials');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDirectAPI();