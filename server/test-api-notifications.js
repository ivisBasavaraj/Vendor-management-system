const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const API_BASE_URL = 'http://localhost:5000';

async function testNotificationsAPI() {
  try {
    console.log('🧪 Testing Notifications API...\n');

    // First, let's try to login to get a token
    console.log('1. Attempting to login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'basavarajkasbi@gmail.com', // Using the vendor we found in the test
      password: 'password123' // You might need to adjust this
    });

    if (loginResponse.data.success) {
      const token = loginResponse.data.token;
      console.log('✅ Login successful');
      
      // Set up headers with the token
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Test getting notifications
      console.log('\n2. Fetching notifications...');
      const notificationsResponse = await axios.get(`${API_BASE_URL}/api/notifications`, { headers });
      
      if (notificationsResponse.data.success) {
        console.log('✅ Notifications fetched successfully');
        console.log(`📊 Total notifications: ${notificationsResponse.data.total}`);
        console.log(`📊 Unread notifications: ${notificationsResponse.data.unread}`);
        console.log(`📊 Notifications in response: ${notificationsResponse.data.data.length}`);
        
        // Show first few notifications
        if (notificationsResponse.data.data.length > 0) {
          console.log('\n📋 Recent notifications:');
          notificationsResponse.data.data.slice(0, 3).forEach((notification, index) => {
            console.log(`  ${index + 1}. ${notification.title}`);
            console.log(`     Message: ${notification.message}`);
            console.log(`     Type: ${notification.type}`);
            console.log(`     Read: ${notification.isRead ? 'Yes' : 'No'}`);
            console.log(`     Created: ${new Date(notification.createdAt).toLocaleString()}`);
            console.log('');
          });
        } else {
          console.log('📭 No notifications found');
        }
      } else {
        console.log('❌ Failed to fetch notifications:', notificationsResponse.data.message);
      }

    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: The password might be incorrect. Try checking the user in the database or use a different user.');
    }
  }
}

// Run the test
testNotificationsAPI();