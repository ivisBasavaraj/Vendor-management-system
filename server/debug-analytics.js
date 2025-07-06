const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vendor-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/user.model');
const Document = require('./models/document.model');
const DocumentSubmission = require('./models/documentSubmission.model');

async function debugAnalytics() {
  try {
    console.log('=== ANALYTICS DEBUG ===');
    
    // Get all vendors
    const vendors = await User.find({ role: 'vendor' }).select('name email assignedConsultant');
    console.log(`Found ${vendors.length} vendors`);
    
    for (const vendor of vendors) {
      console.log(`\n--- Vendor: ${vendor.name} (${vendor.email}) ---`);
      
      // Check Document model
      const documents = await Document.find({ vendor: vendor._id });
      console.log(`Documents in Document model: ${documents.length}`);
      
      if (documents.length > 0) {
        const docStatuses = {};
        documents.forEach(doc => {
          docStatuses[doc.status] = (docStatuses[doc.status] || 0) + 1;
        });
        console.log('Document statuses:', docStatuses);
      }
      
      // Check DocumentSubmission model
      const submissions = await DocumentSubmission.find({ vendor: vendor._id });
      console.log(`Document submissions: ${submissions.length}`);
      
      if (submissions.length > 0) {
        let totalDocs = 0;
        const docStatuses = {};
        
        submissions.forEach(submission => {
          if (submission.documents) {
            totalDocs += submission.documents.length;
            submission.documents.forEach(doc => {
              docStatuses[doc.status] = (docStatuses[doc.status] || 0) + 1;
            });
          }
        });
        
        console.log(`Total documents in submissions: ${totalDocs}`);
        console.log('Submission document statuses:', docStatuses);
      }
    }
    
    // Check if there are any consultants
    const consultants = await User.find({ role: 'consultant' }).select('name email');
    console.log(`\nFound ${consultants.length} consultants`);
    
    consultants.forEach(consultant => {
      console.log(`Consultant: ${consultant.name} (${consultant.email})`);
    });
    
    // Check vendor-consultant assignments
    const assignedVendors = await User.find({ 
      role: 'vendor', 
      assignedConsultant: { $exists: true, $ne: null } 
    }).populate('assignedConsultant', 'name email');
    
    console.log(`\nVendors with assigned consultants: ${assignedVendors.length}`);
    assignedVendors.forEach(vendor => {
      console.log(`${vendor.name} -> ${vendor.assignedConsultant?.name || 'Unknown'}`);
    });
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugAnalytics();