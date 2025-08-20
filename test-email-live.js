const axios = require('axios');
require('dotenv').config();

// Replace with your actual deployed server URL
const SERVER_URL = 'https://your-vps-ip-or-domain';

async function testLiveEmail() {
  try {
    console.log('🚀 Testing email functionality on live server...');
    
    // This assumes you have an API endpoint that triggers an email
    const response = await axios.post(`${SERVER_URL}/api/test-email`, {
      to_email: 'basavarajkasbi@gmail.com',
      template_id: 'template_7ngbgsh',
      template_params: {
        to_name: 'Test User',
        document_name: 'Test Document',
        consultant_name: 'Test Consultant',
        rejection_reason: 'Testing live email service'
      }
    });
    
    console.log('✅ Test email sent successfully:', response.data);
  } catch (error) {
    console.error('❌ Error sending test email:', error.response?.data || error.message);
  }
}

testLiveEmail();
