const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vendor-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/user.model');
const Document = require('./models/document.model');

async function debugDocuments() {
  try {
    console.log('=== DOCUMENT DEBUG ===');
    
    // Get all vendors
    const vendors = await User.find({ role: 'vendor' }).select('name email _id');
    console.log(`Found ${vendors.length} vendors:`);
    vendors.forEach(vendor => {
      console.log(`- ${vendor.name} (${vendor.email}) - ID: ${vendor._id}`);
    });
    
    // Get all documents
    const documents = await Document.find({}).select('title vendor status createdAt');
    console.log(`\nFound ${documents.length} documents:`);
    
    if (documents.length > 0) {
      documents.forEach(doc => {
        console.log(`- ${doc.title} | Vendor: ${doc.vendor} | Status: ${doc.status} | Created: ${doc.createdAt}`);
      });
      
      // Group documents by vendor
      const docsByVendor = {};
      documents.forEach(doc => {
        const vendorId = doc.vendor.toString();
        if (!docsByVendor[vendorId]) {
          docsByVendor[vendorId] = [];
        }
        docsByVendor[vendorId].push(doc);
      });
      
      console.log('\n=== DOCUMENTS BY VENDOR ===');
      Object.keys(docsByVendor).forEach(vendorId => {
        const vendor = vendors.find(v => v._id.toString() === vendorId);
        const vendorName = vendor ? vendor.name : 'Unknown Vendor';
        const docs = docsByVendor[vendorId];
        
        console.log(`\nVendor: ${vendorName} (${vendorId})`);
        console.log(`Total documents: ${docs.length}`);
        
        const statusCounts = docs.reduce((acc, doc) => {
          acc[doc.status] = (acc[doc.status] || 0) + 1;
          return acc;
        }, {});
        
        console.log('Status breakdown:', statusCounts);
      });
    } else {
      console.log('No documents found in the database');
    }
    
    // Check consultants and their assigned vendors
    console.log('\n=== CONSULTANT ASSIGNMENTS ===');
    const consultants = await User.find({ role: 'consultant' }).select('name email _id');
    console.log(`Found ${consultants.length} consultants:`);
    
    for (const consultant of consultants) {
      console.log(`\nConsultant: ${consultant.name} (${consultant.email}) - ID: ${consultant._id}`);
      
      const assignedVendors = await User.find({ 
        role: 'vendor', 
        assignedConsultant: consultant._id 
      }).select('name email _id');
      
      console.log(`Assigned vendors: ${assignedVendors.length}`);
      assignedVendors.forEach(vendor => {
        console.log(`  - ${vendor.name} (${vendor.email}) - ID: ${vendor._id}`);
        
        // Count documents for this vendor
        const vendorDocs = documents.filter(doc => doc.vendor.toString() === vendor._id.toString());
        console.log(`    Documents: ${vendorDocs.length}`);
        if (vendorDocs.length > 0) {
          const statusCounts = vendorDocs.reduce((acc, doc) => {
            acc[doc.status] = (acc[doc.status] || 0) + 1;
            return acc;
          }, {});
          console.log(`    Status breakdown:`, statusCounts);
        }
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugDocuments();

const User = require('./models/user.model');
const Document = require('./models/document.model');

async function debugDocuments() {
  try {
    console.log('=== DOCUMENT DEBUG ===');
    
    // Get all vendors
    const vendors = await User.find({ role: 'vendor' }).select('name email _id');
    console.log(`Found ${vendors.length} vendors:`);
    vendors.forEach(vendor => {
      console.log(`- ${vendor.name} (${vendor.email}) - ID: ${vendor._id}`);
    });
    
    // Get all documents
    const documents = await Document.find({}).select('title vendor status createdAt');
    console.log(`\nFound ${documents.length} documents:`);
    
    if (documents.length > 0) {
      documents.forEach(doc => {
        console.log(`- ${doc.title} | Vendor: ${doc.vendor} | Status: ${doc.status} | Created: ${doc.createdAt}`);
      });
      
      // Group documents by vendor
      const docsByVendor = {};
      documents.forEach(doc => {
        const vendorId = doc.vendor.toString();
        if (!docsByVendor[vendorId]) {
          docsByVendor[vendorId] = [];
        }
        docsByVendor[vendorId].push(doc);
      });
      
      console.log('\n=== DOCUMENTS BY VENDOR ===');
      Object.keys(docsByVendor).forEach(vendorId => {
        const vendor = vendors.find(v => v._id.toString() === vendorId);
        const vendorName = vendor ? vendor.name : 'Unknown Vendor';
        const docs = docsByVendor[vendorId];
        
        console.log(`\nVendor: ${vendorName} (${vendorId})`);
        console.log(`Total documents: ${docs.length}`);
        
        const statusCounts = docs.reduce((acc, doc) => {
          acc[doc.status] = (acc[doc.status] || 0) + 1;
          return acc;
        }, {});
        
        console.log('Status breakdown:', statusCounts);
      });
    } else {
      console.log('No documents found in the database');
    }
    
    // Check consultants and their assigned vendors
    console.log('\n=== CONSULTANT ASSIGNMENTS ===');
    const consultants = await User.find({ role: 'consultant' }).select('name email _id');
    console.log(`Found ${consultants.length} consultants:`);
    
    for (const consultant of consultants) {
      console.log(`\nConsultant: ${consultant.name} (${consultant.email}) - ID: ${consultant._id}`);
      
      const assignedVendors = await User.find({ 
        role: 'vendor', 
        assignedConsultant: consultant._id 
      }).select('name email _id');
      
      console.log(`Assigned vendors: ${assignedVendors.length}`);
      assignedVendors.forEach(vendor => {
        console.log(`  - ${vendor.name} (${vendor.email}) - ID: ${vendor._id}`);
        
        // Count documents for this vendor
        const vendorDocs = documents.filter(doc => doc.vendor.toString() === vendor._id.toString());
        console.log(`    Documents: ${vendorDocs.length}`);
        if (vendorDocs.length > 0) {
          const statusCounts = vendorDocs.reduce((acc, doc) => {
            acc[doc.status] = (acc[doc.status] || 0) + 1;
            return acc;
          }, {});
          console.log(`    Status breakdown:`, statusCounts);
        }
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugDocuments();