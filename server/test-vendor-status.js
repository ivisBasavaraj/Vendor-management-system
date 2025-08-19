const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vendor-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/user.model');
const DocumentSubmission = require('./models/documentSubmission.model');

async function testVendorStatus() {
  try {
    console.log('=== TESTING VENDOR STATUS ===');
    
    // Get a vendor ID from the database
    const vendor = await User.findOne({ role: 'vendor' });
    if (!vendor) {
      console.log('No vendor found in database');
      return;
    }
    
    console.log(`Testing with vendor: ${vendor.name} (${vendor._id})`);
    
    // Get submissions for this vendor
    const submissions = await DocumentSubmission.find({ vendor: vendor._id });
    console.log(`Found ${submissions.length} submissions for this vendor`);
    
    // Count documents
    let totalDocuments = 0;
    let approvedDocuments = 0;
    let rejectedDocuments = 0;
    let pendingDocuments = 0;
    
    submissions.forEach(submission => {
      if (submission.documents) {
        submission.documents.forEach(doc => {
          totalDocuments++;
          switch (doc.status) {
            case 'approved':
              approvedDocuments++;
              break;
            case 'rejected':
              rejectedDocuments++;
              break;
            case 'uploaded':
            case 'under_review':
              pendingDocuments++;
              break;
            default:
              pendingDocuments++;
          }
        });
      }
    });
    
    console.log('Analytics:', {
      totalDocuments,
      approvedDocuments,
      rejectedDocuments,
      pendingDocuments,
      complianceRate: totalDocuments > 0 ? Math.round((approvedDocuments / totalDocuments) * 100) : 0
    });
    
    // Test the specific vendor ID from the URL
    const testVendorId = '68601f4be3ef080b000cc63d';
    console.log(`\nTesting specific vendor ID: ${testVendorId}`);
    
    if (mongoose.Types.ObjectId.isValid(testVendorId)) {
      const testVendor = await User.findById(testVendorId);
      if (testVendor) {
        console.log(`Found test vendor: ${testVendor.name} (${testVendor.email})`);
        
        const testSubmissions = await DocumentSubmission.find({ vendor: testVendorId });
        console.log(`Found ${testSubmissions.length} submissions for test vendor`);
        
        let testTotalDocs = 0;
        testSubmissions.forEach(submission => {
          if (submission.documents) {
            testTotalDocs += submission.documents.length;
          }
        });
        console.log(`Total documents for test vendor: ${testTotalDocs}`);
      } else {
        console.log('Test vendor not found in database');
      }
    } else {
      console.log('Invalid test vendor ID format');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testVendorStatus();