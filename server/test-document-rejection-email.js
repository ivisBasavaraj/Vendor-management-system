/**
 * Test Document Rejection Email Notification
 * This tests the EmailJS integration for document rejection notifications to vendors
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

async function testDocumentRejectionEmail() {
  console.log('🧪 Testing Document Rejection Email Notification...\n');

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

  // Mock rejected document data
  const mockRejectedDocument = {
    _id: '507f1f77bcf86cd799439011',
    documentType: 'INVOICE',
    documentName: 'January_Invoice_2025.pdf',
    status: 'rejected',
    reviewDate: new Date(),
    reviewComments: 'The invoice amount does not match the bank statement. Please verify the calculations and ensure all line items are correctly totaled. Additionally, the invoice date appears to be incorrect - it should reflect the actual service period.',
    reviewedBy: testConsultant._id,
    uploadPeriod: {
      year: 2025,
      month: 'Jan'
    },
    previousStatus: 'pending'
  };

  console.log('📋 Test Configuration:');
  console.log(`Service ID: ${process.env.EMAILJS_SERVICE_ID}`);
  console.log(`Template ID: template_7ngbgsh`);
  console.log(`Public Key: ${process.env.EMAILJS_PUBLIC_KEY}`);
  console.log(`Private Key: ${process.env.EMAILJS_PRIVATE_KEY ? 'LOADED ✅' : 'MISSING ❌'}`);
  console.log('');

  console.log('📧 Email Details:');
  console.log(`To: ${testVendor.email}`);
  console.log(`From Consultant: ${testConsultant.name} (${testConsultant.email})`);
  console.log(`Document: ${mockRejectedDocument.documentName}`);
  console.log(`Document Type: ${mockRejectedDocument.documentType}`);
  console.log(`Rejection Reason: ${mockRejectedDocument.reviewComments.substring(0, 100)}...`);
  console.log('');

  try {
    console.log('📤 Sending rejection notification...');
    
    const result = await emailService.sendDocumentRejectionNotification(
      mockRejectedDocument,
      testVendor,
      testConsultant
    );

    console.log('\n📊 Result:');
    if (result.success) {
      console.log('✅ SUCCESS - Document rejection email sent successfully!');
      console.log(`📧 Recipient: ${result.recipient}`);
      console.log(`👤 Vendor: ${result.vendorName}`);
      console.log(`📄 Document Type: ${result.documentType}`);
      console.log(`👨‍💼 Consultant: ${result.consultantName}`);
      console.log(`🔧 Method: ${result.method}`);
      console.log(`💬 Message: ${result.message}`);
      
      console.log('\n🎉 Next Steps:');
      console.log('1. Check the vendor\'s email inbox for the rejection notification');
      console.log('2. Verify all template variables are populated correctly');
      console.log('3. Test the resubmit and dashboard links');
      console.log('4. Confirm the rejection reason is clearly displayed');
      console.log('5. Ensure the consultant contact information is correct');
    } else {
      console.log('❌ FAILED - Document rejection email could not be sent');
      console.log(`📧 Recipient: ${result.recipient}`);
      console.log(`👤 Vendor: ${result.vendorName}`);
      console.log(`📄 Document Type: ${result.documentType}`);
      console.log(`👨‍💼 Consultant: ${result.consultantName}`);
      console.log(`❗ Error: ${result.error || result.message}`);
      
      if (result.emailJSError) {
        console.log(`🔧 EmailJS Error: ${result.emailJSError}`);
      }
      
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Verify EmailJS template ID: template_7ngbgsh');
      console.log('2. Check that template variables match our implementation');
      console.log('3. Ensure recipient email is valid');
      console.log('4. Check EmailJS dashboard for delivery logs');
      console.log('5. Verify the template exists in EmailJS dashboard');
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
  const required = ['EMAILJS_SERVICE_ID', 'EMAILJS_PUBLIC_KEY', 'EMAILJS_PRIVATE_KEY'];
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
  console.log('🚀 Document Rejection Email Test');
  console.log('='.repeat(50));
  
  if (!checkEnvironment()) {
    process.exit(1);
  }
  
  await testDocumentRejectionEmail();
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Test completed!');
  console.log('\n📝 Template Setup Required:');
  console.log('1. Go to https://www.emailjs.com/');
  console.log('2. Create template with ID: template_7ngbgsh');
  console.log('3. Copy HTML from: server/templates/document-rejection-template.html');
  console.log('4. Configure template variables as documented');
}

main().catch(console.error);