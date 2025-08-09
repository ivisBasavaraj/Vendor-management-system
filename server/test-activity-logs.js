const axios = require('axios');

const BASE_URL = 'http://localhost:54112/api';

async function testActivityLogs() {
  try {
    console.log('Testing activity logs API...');
    
    // First, login to get token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@imtma.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, token received');
    
    // Set up headers with token
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test activity logs endpoint
    console.log('2. Fetching activity logs...');
    const activityLogsResponse = await axios.get(`${BASE_URL}/activity-logs?page=1&limit=10`, {
      headers
    });
    
    console.log('Activity logs response:', activityLogsResponse.data);
    
  } catch (error) {
    console.error('Error testing activity logs:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testActivityLogs();