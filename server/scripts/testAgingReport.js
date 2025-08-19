const mongoose = require('mongoose');
const User = require('../models/user.model');
const Document = require('../models/document.model');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vendor-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test aging report logic
const testAgingReport = async () => {
  try {
    console.log('Testing aging report logic...');
    
    // Get all vendors
    const vendors = await User.find({ role: 'vendor' })
      .select('name email company vendorId assignedConsultant isActive');

    console.log(`Found ${vendors.length} vendors`);
    
    // Get all consultants for mapping
    const consultants = await User.find({ role: 'consultant' })
      .select('name email');
    
    console.log(`Found ${consultants.length} consultants`);
    
    const consultantMap = {};
    consultants.forEach(consultant => {
      consultantMap[consultant._id.toString()] = consultant.name;
    });

    const now = new Date();
    const vendorAgingReport = [];

    // Process each vendor
    for (const vendor of vendors) {
      console.log(`\nProcessing vendor: ${vendor.name}`);
      
      // Find the most recent compliance document for this vendor
      const latestDocument = await Document.findOne({
        vendor: vendor._id,
        documentType: 'compliance'
      })
      .sort({ createdAt: -1 })
      .select('createdAt documentType title');
      
      console.log(`Latest compliance document:`, latestDocument ? {
        title: latestDocument.title,
        type: latestDocument.documentType,
        createdAt: latestDocument.createdAt
      } : 'None found');
      
      // If no compliance documents found, check for any documents
      let fallbackDocument = null;
      if (!latestDocument) {
        fallbackDocument = await Document.findOne({
          vendor: vendor._id
        })
        .sort({ createdAt: -1 })
        .select('createdAt documentType title');
        
        console.log(`Fallback document:`, fallbackDocument ? {
          title: fallbackDocument.title,
          type: fallbackDocument.documentType,
          createdAt: fallbackDocument.createdAt
        } : 'None found');
      }

      let daysSinceLastUpload = null;
      let lastUploadDate = null;
      let status = 'Non-Compliant';
      let documentToUse = latestDocument || fallbackDocument;

      if (documentToUse) {
        // Calculate days since last upload
        daysSinceLastUpload = Math.floor((now - documentToUse.createdAt) / (1000 * 60 * 60 * 24));
        lastUploadDate = documentToUse.createdAt;
        
        // Determine compliance status (compliant if uploaded within 30 days and is compliance document)
        if (latestDocument && daysSinceLastUpload <= 30) {
          status = 'Compliant';
        } else {
          status = 'Non-Compliant';
        }
      } else {
        // No documents found at all
        daysSinceLastUpload = 'N/A';
        lastUploadDate = null;
        status = 'Non-Compliant';
      }

      // Get assigned consultant name
      const assignedConsultantName = vendor.assignedConsultant 
        ? consultantMap[vendor.assignedConsultant.toString()] || 'Unassigned'
        : 'Unassigned';

      const vendorReport = {
        id: vendor._id,
        vendorName: vendor.name,
        vendorId: vendor.vendorId || vendor._id.toString().slice(-6).toUpperCase(),
        company: vendor.company || 'N/A',
        email: vendor.email,
        assignedConsultant: assignedConsultantName,
        lastDocumentUploadDate: lastUploadDate,
        daysSinceLastUpload: daysSinceLastUpload,
        status: status,
        lastDocumentType: documentToUse ? documentToUse.documentType : 'N/A'
      };
      
      console.log(`Vendor report:`, vendorReport);
      vendorAgingReport.push(vendorReport);
    }

    // Calculate summary statistics
    const summary = {
      totalVendors: vendorAgingReport.length,
      compliantVendors: vendorAgingReport.filter(v => v.status === 'Compliant').length,
      nonCompliantVendors: vendorAgingReport.filter(v => v.status === 'Non-Compliant').length,
      errorVendors: vendorAgingReport.filter(v => v.status === 'Error').length,
      averageDaysSinceUpload: 0
    };

    // Calculate average days (excluding N/A and Error values)
    const validDays = vendorAgingReport
      .filter(v => typeof v.daysSinceLastUpload === 'number')
      .map(v => v.daysSinceLastUpload);
    
    if (validDays.length > 0) {
      summary.averageDaysSinceUpload = Math.round(
        validDays.reduce((sum, days) => sum + days, 0) / validDays.length
      );
    }

    console.log('\n=== FINAL REPORT ===');
    console.log('Summary:', summary);
    console.log('\nVendor Reports:');
    vendorAgingReport.forEach(report => {
      console.log(`- ${report.vendorName}: ${report.status} (${report.daysSinceLastUpload} days)`);
    });

  } catch (error) {
    console.error('Error testing aging report:', error);
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testAgingReport();
  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
  process.exit(0);
};

runTest();