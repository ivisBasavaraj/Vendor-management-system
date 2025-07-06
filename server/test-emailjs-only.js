// Load environment variables
require('dotenv').config();

const axios = require('axios');

async function testEmailJSDirectly() {
  console.log('🧪 Testing EmailJS API Directly...\n');

  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  console.log('📋 Configuration:');
  console.log('Service ID:', serviceId);
  console.log('Template ID:', templateId);
  console.log('Public Key:', publicKey);
  console.log('Private Key:', privateKey ? 'LOADED ✅' : 'MISSING ❌');
  console.log('');

  if (!privateKey) {
    console.error('❌ Private key is missing!');
    return;
  }

  try {
    const templateParams = {
      to_email: 'test@example.com',
      to_name: 'Test User',
      user_name: 'Test User',
      user_email: 'test@example.com',
      user_password: 'TestPass123',
      user_role: 'Vendor',
      company_name: 'Test Company',
      phone_number: '+91-9876543210',
      address: 'Test Address',
      work_location: 'Bangalore',
      agreement_period: 'Annual Contract',
      company_reg_no: 'TEST123',
      tax_id: 'GST123',
      assigned_consultant: 'John Consultant',
      consultant_email: 'john@imtma.in',
      consultant_phone: '+91-9876543211',
      login_url: 'http://localhost:3000/login',
      created_date: new Date().toLocaleDateString(),
      subject: 'Welcome to IMTMA - Test Email'
    };

    console.log('📤 Sending test email...');

    const payload = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey,
      template_params: templateParams
    };

    const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${privateKey}`
      },
      timeout: 15000
    });

    console.log('✅ EmailJS API Response:', response.status, response.statusText);
    console.log('📧 Email sent successfully!');
    
    return { success: true, status: response.status };

  } catch (error) {
    console.error('❌ EmailJS API Error:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Response Data:', error.response.data);
      console.error('Response Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    
    return { success: false, error: error.message };
  }
}

// Run the test
testEmailJSDirectly().then(result => {
  console.log('\n📊 Test Result:', result);
  process.exit(result.success ? 0 : 1);
});