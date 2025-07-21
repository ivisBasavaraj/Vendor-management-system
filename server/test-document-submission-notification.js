/**
 * Test Document Submission Email Notification
 * This tests the specific functionality for notifying consultants when vendors submit documents
 */

require('dotenv').config();
const mongoose = require('mongoose');
const emailService = require('./utils/emailService');
const User = require('./models/user.model');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

async function testDocumentSubmissionNotification() {
  console.log('🧪 Testing Document Submission Email Notification...\n');

  // Connect to database first
  await connectDB();

  // Find real consultants and vendors from database
  const consultants = await User.find({ role: 'consultant', isActive: true }).select('name email role');
  const vendors = await User.find({ role: 'vendor' }).populate('assignedConsultant', 'name email').limit(5);

  console.log(`📊 Found ${consultants.length} consultants and ${vendors.length} vendors in database\n`);

  if (consultants.length === 0) {
    console.log('❌ No consultants found in database. Please create consultant users first.');
    process.exit(1);
  }

  if (vendors.length === 0) {
    console.log('❌ No vendors found in database. Please create vendor users first.');
    process.exit(1);
  }

  // Show available consultants
  console.log('👥 Available Consultants:');
  consultants.forEach((consultant, index) => {
    console.log(`${index + 1}. ${consultant.name} (${consultant.email})`);
  });

  // Show vendors and their assigned consultants
  console.log('\n🏢 Available Vendors:');
  vendors.forEach((vendor, index) => {
    const assignedConsultant = vendor.assignedConsultant 
      ? `${vendor.assignedConsultant.name} (${vendor.assignedConsultant.email})`
      : 'Not assigned';
    console.log(`${index + 1}. ${vendor.name} - ${vendor.company || 'No company'} - Consultant: ${assignedConsultant}`);
  });

  // Use the first vendor and their assigned consultant (or first available consultant)
  const testVendor = vendors[0];
  const testConsultant = testVendor.assignedConsultant || consultants[0];

  console.log(`\n🎯 Test Configuration:`);
  console.log(`Vendor: ${testVendor.name} (${testVendor.email})`);
  console.log(`Company: ${testVendor.company || 'N/A'}`);
  console.log(`Consultant: ${testConsultant.name} (${testConsultant.email})`);
  console.log(`Assignment: ${testVendor.assignedConsultant ? 'Assigned' : 'Using available consultant'}\n`);

  // Mock submission data using real vendor and consultant
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

  // Use real vendor and consultant data
  const realVendor = testVendor;
  const realConsultant = testConsultant;

  console.log('📋 Test Configuration:');
  console.log(`Service ID: ${process.env.EMAILJS_SERVICE_ID}`);
  console.log(`Template ID: ${process.env.EMAILJS_TEMPLATE_ID}`);
  console.log(`Public Key: ${process.env.EMAILJS_PUBLIC_KEY}`);
  console.log(`Private Key: ${process.env.EMAILJS_PRIVATE_KEY ? 'LOADED ✅' : 'MISSING ❌'}`);
  console.log('');

  console.log('📧 Email Details:');
  console.log(`To: ${realConsultant.email}`);
  console.log(`Vendor: ${realVendor.name} (${realVendor.company || 'N/A'})`);
  console.log(`Submission: ${mockSubmission.submissionId}`);
  console.log(`Documents: ${mockSubmission.documents.length} files`);
  console.log('');

  try {
    console.log('📤 Sending notification...');
    
    const result = await emailService.sendDocumentSubmissionNotification(
      mockSubmission,
      realVendor,
      realConsultant
    );

    console.log('\n📊 Result:');
    if (result.success) {
      console.log('✅ SUCCESS - Email sent successfully!');
      console.log(`📧 Recipient: ${result.recipient}`);
      console.log(`👤 Vendor: ${result.vendorName}`);
      console.log(`📄 Submission: ${result.submissionId}`);
      console.log(`🔧 Method: ${result.method}`);
      console.log(`💬 Message: ${result.message}`);
      
      console.log('\n🎉 Next Steps:');
      console.log('1. Check your email inbox for the notification');
      console.log('2. Verify all template variables are populated');
      console.log('3. Test the review and dashboard links');
      console.log('4. The email should contain vendor info, document list, and action buttons');
    } else {
      console.log('❌ FAILED - Email could not be sent');
      console.log(`📧 Recipient: ${result.recipient}`);
      console.log(`👤 Vendor: ${result.vendorName}`);
      console.log(`📄 Submission: ${result.submissionId}`);
      console.log(`❗ Error: ${result.error || result.message}`);
      
      if (result.emailJSError) {
        console.log(`🔧 EmailJS Error: ${result.emailJSError}`);
      }
      
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Verify EmailJS template ID: template_ojv7u88');
      console.log('2. Check that template variables match our implementation');
      console.log('3. Ensure recipient email is valid');
      console.log('4. Check EmailJS dashboard for delivery logs');
    }
  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Check if environment variables are set
function checkEnvironment() {
  const required = ['EMAILJS_SERVICE_ID', 'EMAILJS_TEMPLATE_ID', 'EMAILJS_PUBLIC_KEY', 'EMAILJS_PRIVATE_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.log('❌ Missing environment variables:', missing.join(', '));
    console.log('📝 Please check your .env file and ensure all EmailJS variables are set');
    return false;
  }
  return true;
}

// Run the test
async function main() {
  console.log('🚀 Document Submission Email Test');
  console.log('=' .repeat(50));
  
  if (!checkEnvironment()) {
    process.exit(1);
  }
  
  await testDocumentSubmissionNotification();
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Test completed!');
}

main().catch(console.error);