/**
 * Test script for Document Submission Email Notification
 * This script tests the EmailJS integration for document submission notifications
 */

// Load environment variables from server directory
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

// Import email service
const emailService = require('./server/utils/emailService');

// Mock data for testing
const mockSubmission = {
  _id: '507f1f77bcf86cd799439011',
  submissionId: 'SUB-2025-Jan-TEST123',
  submissionDate: new Date(),
  uploadPeriod: {
    year: 2025,
    month: 'Jan'
  },
  agreementPeriod: {
    startDate: new Date('2024-04-01'),
    endDate: new Date('2025-03-31')
  },
  workLocation: 'IMTMA, Bengaluru',
  invoiceNo: 'INV-2025-001',
  documents: [
    {
      documentType: 'INVOICE',
      documentName: 'January_Invoice_2025.pdf',
      status: 'uploaded'
    },
    {
      documentType: 'FORM_T_MUSTER_ROLL',
      documentName: 'Muster_Roll_Jan_2025.xlsx',
      status: 'uploaded'
    },
    {
      documentType: 'BANK_STATEMENT',
      documentName: 'Bank_Statement_Jan_2025.pdf',
      status: 'uploaded'
    },
    {
      documentType: 'ECR',
      documentName: 'ECR_January_2025.xlsx',
      status: 'uploaded'
    },
    {
      documentType: 'PF_COMBINED_CHALLAN',
      documentName: 'PF_Challan_Jan_2025.pdf',
      status: 'uploaded'
    }
  ]
};

const mockVendor = {
  _id: '507f1f77bcf86cd799439012',
  name: 'John Smith',
  email: 'vendor@example.com',
  company: 'ABC Construction Pvt Ltd',
  phone: '+91-9876543210',
  agreementPeriod: 'Annual Contract (Apr 2024 - Mar 2025)',
  workLocation: 'IMTMA, Bengaluru'
};

const mockConsultant = {
  _id: '507f1f77bcf86cd799439013',
  name: 'Sarah Johnson',
  email: 'consultant@example.com', // Replace with your test email
  role: 'consultant'
};

async function testDocumentSubmissionEmail() {
  console.log('🧪 Testing Document Submission Email Notification...\n');
  
  console.log('📋 Test Data:');
  console.log(`Vendor: ${mockVendor.name} (${mockVendor.company})`);
  console.log(`Consultant: ${mockConsultant.name} (${mockConsultant.email})`);
  console.log(`Submission ID: ${mockSubmission.submissionId}`);
  console.log(`Documents: ${mockSubmission.documents.length} files`);
  console.log(`Period: ${mockSubmission.uploadPeriod.month} ${mockSubmission.uploadPeriod.year}\n`);
  
  try {
    console.log('📤 Sending email notification...');
    
    const result = await emailService.sendDocumentSubmissionNotification(
      mockSubmission,
      mockVendor,
      mockConsultant
    );
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log(`📧 Recipient: ${result.recipient}`);
      console.log(`👤 Vendor: ${result.vendorName}`);
      console.log(`📄 Submission: ${result.submissionId}`);
      console.log(`🔧 Method: ${result.method}`);
      console.log(`💬 Message: ${result.message}`);
    } else {
      console.log('❌ Email failed to send');
      console.log(`📧 Recipient: ${result.recipient}`);
      console.log(`👤 Vendor: ${result.vendorName}`);
      console.log(`📄 Submission: ${result.submissionId}`);
      console.log(`❗ Error: ${result.error || result.message}`);
      
      if (result.emailJSError) {
        console.log(`🔧 EmailJS Error: ${result.emailJSError}`);
      }
    }
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Check environment variables
function checkEnvironmentVariables() {
  console.log('🔧 Checking Environment Variables...\n');
  
  const requiredVars = [
    'EMAILJS_SERVICE_ID',
    'EMAILJS_TEMPLATE_ID', 
    'EMAILJS_PUBLIC_KEY',
    'EMAILJS_PRIVATE_KEY',
    'CLIENT_URL'
  ];
  
  let allSet = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${varName.includes('KEY') ? '***' + value.slice(-4) : value}`);
    } else {
      console.log(`❌ ${varName}: Not set`);
      allSet = false;
    }
  });
  
  console.log('');
  
  if (!allSet) {
    console.log('⚠️  Some environment variables are missing. Please check your .env file.');
    console.log('📝 Required variables are listed in server/.env.example\n');
  }
  
  return allSet;
}

// Main execution
async function main() {
  console.log('🚀 Document Submission Email Test\n');
  console.log('=' .repeat(50));
  
  // Check environment variables first
  const envOk = checkEnvironmentVariables();
  
  if (!envOk) {
    console.log('❌ Cannot proceed with test due to missing environment variables.');
    process.exit(1);
  }
  
  // Run the email test
  await testDocumentSubmissionEmail();
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Test completed!');
  console.log('\n📝 Next Steps:');
  console.log('1. Check your email inbox for the notification');
  console.log('2. Verify all template variables are populated correctly');
  console.log('3. Test the review and dashboard links');
  console.log('4. If email failed, check EmailJS dashboard for delivery status');
  console.log('\n💡 Tips:');
  console.log('- Replace consultant email with your test email address');
  console.log('- Check spam/junk folder if email not received');
  console.log('- Verify EmailJS template ID matches: template_ojv7u88');
}

// Run the test
main().catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});