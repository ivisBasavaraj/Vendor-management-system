const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vendor-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/user.model');
const DocumentSubmission = require('./models/documentSubmission.model');
const Document = require('./models/document.model');

async function testVendorStatusEndpoint() {
  try {
    console.log('=== TESTING VENDOR STATUS ENDPOINT LOGIC ===');
    
    // Test with a known vendor ID
    const testVendorId = '68601f4be3ef080b000cc63d';
    console.log(`Testing with vendor ID: ${testVendorId}`);
    
    // Check if vendor exists
    const vendor = await User.findById(testVendorId);
    if (!vendor) {
      console.log('❌ Vendor not found');
      
      // Let's find any vendor
      const anyVendor = await User.findOne({ role: 'vendor' });
      if (anyVendor) {
        console.log(`✅ Using alternative vendor: ${anyVendor.name} (${anyVendor._id})`);
        await testVendorAnalytics(anyVendor._id, anyVendor.name);
      } else {
        console.log('❌ No vendors found in database');
      }
      return;
    }
    
    console.log(`✅ Found vendor: ${vendor.name} (${vendor.email})`);
    await testVendorAnalytics(vendor._id, vendor.name);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    mongoose.connection.close();
  }
}

async function testVendorAnalytics(vendorId, vendorName) {
  console.log(`\n--- Testing analytics for ${vendorName} ---`);
  
  // Test DocumentSubmission model
  const documentSubmissions = await DocumentSubmission.find({ vendor: vendorId });
  console.log(`📄 Document submissions found: ${documentSubmissions.length}`);
  
  let totalDocuments = 0;
  let approvedDocuments = 0;
  let pendingDocuments = 0;
  let rejectedDocuments = 0;
  
  if (documentSubmissions.length > 0) {
    documentSubmissions.forEach(submission => {
      if (submission.documents && submission.documents.length > 0) {
        submission.documents.forEach(doc => {
          totalDocuments++;
          
          switch (doc.status) {
            case 'approved':
              approvedDocuments++;
              break;
            case 'under_review':
            case 'uploaded':
              pendingDocuments++;
              break;
            case 'rejected':
              rejectedDocuments++;
              break;
            default:
              pendingDocuments++;
          }
        });
      }
    });
    
    console.log('📊 DocumentSubmission Analytics:');
    console.log(`   Total: ${totalDocuments}`);
    console.log(`   Approved: ${approvedDocuments}`);
    console.log(`   Pending: ${pendingDocuments}`);
    console.log(`   Rejected: ${rejectedDocuments}`);
    console.log(`   Compliance Rate: ${totalDocuments > 0 ? Math.round((approvedDocuments / totalDocuments) * 100) : 0}%`);
  }
  
  // Test Document model (legacy)
  const legacyDocuments = await Document.find({ vendor: vendorId });
  console.log(`📄 Legacy documents found: ${legacyDocuments.length}`);
  
  if (legacyDocuments.length > 0) {
    const legacyApproved = legacyDocuments.filter(doc => 
      doc.status === 'approved' || 
      doc.status === 'consultant_approved' || 
      doc.status === 'final_approved'
    ).length;
    
    const legacyRejected = legacyDocuments.filter(doc => 
      doc.status === 'rejected' || 
      doc.status === 'consultant_rejected' || 
      doc.status === 'final_rejected'
    ).length;
    
    const legacyPending = legacyDocuments.filter(doc => 
      doc.status === 'uploaded' || 
      doc.status === 'under_review' || 
      doc.status === 'pending'
    ).length;
    
    console.log('📊 Legacy Document Analytics:');
    console.log(`   Total: ${legacyDocuments.length}`);
    console.log(`   Approved: ${legacyApproved}`);
    console.log(`   Pending: ${legacyPending}`);
    console.log(`   Rejected: ${legacyRejected}`);
  }
  
  // Combined analytics
  const combinedTotal = totalDocuments + legacyDocuments.length;
  const combinedApproved = approvedDocuments + (legacyDocuments.filter(doc => 
    doc.status === 'approved' || 
    doc.status === 'consultant_approved' || 
    doc.status === 'final_approved'
  ).length);
  
  console.log('\n🎯 COMBINED ANALYTICS (What the endpoint should return):');
  console.log(`   Total Documents: ${combinedTotal}`);
  console.log(`   Approved Documents: ${combinedApproved}`);
  console.log(`   Compliance Rate: ${combinedTotal > 0 ? Math.round((combinedApproved / combinedTotal) * 100) : 0}%`);
  
  if (combinedTotal === 0) {
    console.log('⚠️  No documents found for this vendor. This explains why the frontend shows 0 values.');
  } else {
    console.log('✅ Documents found! The endpoint should return these values.');
  }
}

testVendorStatusEndpoint();