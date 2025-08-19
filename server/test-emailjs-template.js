/**
 * Test EmailJS Template Configuration
 * This script tests if the template_ojv7u88 exists and is properly configured
 */

require('dotenv').config();
const emailjs = require('@emailjs/nodejs');

async function testEmailJSTemplate() {
  console.log('🧪 Testing EmailJS Template Configuration...\n');

  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  console.log('📋 Configuration:');
  console.log(`Service ID: ${serviceId}`);
  console.log(`Template ID: ${templateId}`);
  console.log(`Public Key: ${publicKey}`);
  console.log(`Private Key: ${privateKey ? 'LOADED ✅' : 'MISSING ❌'}`);
  console.log('');

  if (!privateKey) {
    console.error('❌ Private key is missing! Please add EMAILJS_PRIVATE_KEY to your .env file');
    return;
  }

  // Test with minimal template parameters
  const templateParams = {
    // Try multiple recipient variable formats
    to_email: 'test@example.com',
    to_name: 'Test User',
    email: 'test@example.com',
    recipient_email: 'test@example.com',
    recipient_name: 'Test User',
    
    // Required template variables
    consultant_name: 'Test Consultant',
    vendor_name: 'Test Vendor',
    vendor_company: 'Test Company',
    vendor_email: 'vendor@test.com',
    vendor_phone: '+91-9876543210',
    
    submission_id: 'SUB-2025-Jan-TEST',
    submission_date: 'January 20, 2025',
    submission_time: '2:30 PM',
    upload_period: 'Jan 2025',
    
    agreement_period: 'Annual Contract',
    work_location: 'IMTMA, Bengaluru',
    invoice_no: 'INV-2025-001',
    
    document_count: 3,
    document_types: ['Invoice', 'Bank Statement', 'ECR'],
    document_list: 'Invoice, Bank Statement, ECR',
    
    review_url: 'http://localhost:3000/consultant/review/test',
    dashboard_url: 'http://localhost:3000/consultant/dashboard',
    
    subject: 'Test Document Submission Notification',
    email_type: 'document_submission_notification'
  };

  try {
    console.log('📤 Testing email send with template_ojv7u88...');
    
    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      {
        publicKey: publicKey,
        privateKey: privateKey,
      }
    );

    console.log('✅ SUCCESS! Email sent successfully');
    console.log('📧 Response:', response);
    console.log('\n🎉 Template is working correctly!');
    console.log('📝 Next steps:');
    console.log('1. Check the recipient email inbox');
    console.log('2. Verify all template variables are displayed correctly');
    console.log('3. Test the review and dashboard links');
    
  } catch (error) {
    console.error('❌ FAILED! EmailJS Error:');
    console.error('Status:', error.status);
    console.error('Message:', error.text || error.message);
    
    if (error.status === 422) {
      console.log('\n🔧 Troubleshooting 422 Error:');
      console.log('1. Template ID might not exist: template_ojv7u88');
      console.log('2. Template might not be configured to receive recipient email');
      console.log('3. Template variables might be missing or incorrect');
      console.log('\n📝 To fix this:');
      console.log('1. Go to https://www.emailjs.com/');
      console.log('2. Create a template with ID: template_ojv7u88');
      console.log('3. Configure it to use {{to_email}} or {{email}} for recipient');
      console.log('4. Add all required template variables');
    } else if (error.status === 401) {
      console.log('\n🔧 Authentication Error:');
      console.log('1. Check your EmailJS service ID and keys');
      console.log('2. Verify your EmailJS account is active');
      console.log('3. Ensure private key is correct');
    } else {
      console.log('\n🔧 Other Error:');
      console.log('1. Check EmailJS service status');
      console.log('2. Verify internet connection');
      console.log('3. Check EmailJS dashboard for more details');
    }
  }
}

// Check environment variables
function checkEnvironment() {
  const required = ['EMAILJS_SERVICE_ID', 'EMAILJS_TEMPLATE_ID', 'EMAILJS_PUBLIC_KEY', 'EMAILJS_PRIVATE_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.log('❌ Missing environment variables:', missing.join(', '));
    console.log('📝 Please check your .env file');
    return false;
  }
  return true;
}

// Main execution
async function main() {
  console.log('🚀 EmailJS Template Test');
  console.log('='.repeat(50));
  
  if (!checkEnvironment()) {
    process.exit(1);
  }
  
  await testEmailJSTemplate();
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Test completed!');
}

main().catch(console.error);