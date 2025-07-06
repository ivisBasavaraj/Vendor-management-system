/**
 * Test script for EmailJS integration
 * This script tests the new welcome email functionality
 */

// Load environment variables
require('dotenv').config();

const emailService = require('./utils/emailService');

// Test data for a vendor
const testVendor = {
  name: 'Test Vendor Company',
  email: 'test.vendor@example.com',
  role: 'vendor',
  company: 'Test Manufacturing Ltd.',
  phone: '+91-9876543210',
  address: '123 Industrial Area, Bangalore, Karnataka 560001',
  workLocation: 'Bangalore',
  agreementPeriod: 'Annual Contract',
  companyRegNo: 'CIN123456789',
  taxId: 'GST123456789',
  _id: '507f1f77bcf86cd799439011'
};

// Test data for assigned consultant
const testConsultant = {
  name: 'John Consultant',
  email: 'john.consultant@imtma.in',
  phone: '+91-9876543211',
  _id: '507f1f77bcf86cd799439012'
};

// Test data for a consultant
const testConsultantUser = {
  name: 'Jane Consultant',
  email: 'jane.consultant@imtma.in',
  role: 'consultant',
  company: 'IMTMA Consulting Services',
  phone: '+91-9876543212',
  address: '456 Business District, Mumbai, Maharashtra 400001',
  workLocation: 'Mumbai',
  agreementPeriod: 'Permanent',
  _id: '507f1f77bcf86cd799439013'
};

async function testEmailIntegration() {
  console.log('🧪 Testing EmailJS Integration...\n');

  try {
    // Test 1: Send welcome email to vendor
    console.log('📧 Test 1: Sending welcome email to vendor...');
    const vendorResult = await emailService.sendUserWelcomeEmail(
      testVendor, 
      'TempPass123!', 
      testConsultant
    );
    
    console.log('Vendor Email Result:', {
      success: vendorResult.success,
      recipient: vendorResult.recipient,
      role: vendorResult.userRole,
      message: vendorResult.message,
      error: vendorResult.error
    });
    console.log('');

    // Test 2: Send welcome email to consultant
    console.log('📧 Test 2: Sending welcome email to consultant...');
    const consultantResult = await emailService.sendUserWelcomeEmail(
      testConsultantUser, 
      'ConsultPass456!'
    );
    
    console.log('Consultant Email Result:', {
      success: consultantResult.success,
      recipient: consultantResult.recipient,
      role: consultantResult.userRole,
      message: consultantResult.message,
      error: consultantResult.error
    });
    console.log('');

    // Summary
    console.log('📊 Test Summary:');
    console.log(`✅ Vendor Email: ${vendorResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Consultant Email: ${consultantResult.success ? 'SUCCESS' : 'FAILED'}`);
    
    if (vendorResult.success && consultantResult.success) {
      console.log('\n🎉 All tests passed! EmailJS integration is working correctly.');
      console.log('📬 Check the test email addresses for the welcome emails.');
    } else {
      console.log('\n❌ Some tests failed. Check the error messages above.');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testEmailIntegration();
}

module.exports = { testEmailIntegration };