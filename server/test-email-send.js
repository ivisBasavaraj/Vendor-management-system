const emailService = require('./utils/emailService');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function testEmailSending() {
  try {
    console.log('🚀 Starting email test...');
    
    // Test email parameters - replace with actual values
    const testParams = {
      to_name: 'Test User',
      to_email: 'basavarajkasbi@gmail.com', // Replace with actual test email
      document_name: 'Test Document',
      consultant_name: 'Test Consultant',
      rejection_reason: 'Testing email service'
    };

    console.log('Sending test email...');
    
    // Test sending a rejection email
    const result = await emailService.sendEmail(
      testParams.to_email,
      'template_7ngbgsh', // Using the rejection template
      testParams
    );
    
    console.log('✅ Test email result:', result);
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

// Run the test
testEmailSending();
