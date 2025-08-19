/**
 * Utility script to check vendor-consultant assignments
 * This can be run to debug vendor-consultant relationship issues
 */

const mongoose = require('mongoose');
const User = require('../models/user.model');
const DocumentSubmission = require('../models/documentSubmission.model');
require('dotenv').config();

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Check vendor-consultant assignments
const checkVendorConsultantAssignments = async () => {
  try {
    console.log('Checking vendor-consultant assignments...');
    
    // Get all consultants
    const consultants = await User.find({ role: 'consultant' });
    console.log(`Found ${consultants.length} consultants`);
    
    // Get all vendors
    const vendors = await User.find({ role: 'vendor' });
    console.log(`Found ${vendors.length} vendors`);
    
    // Count vendors with assigned consultants
    const vendorsWithConsultants = vendors.filter(vendor => vendor.assignedConsultant);
    console.log(`${vendorsWithConsultants.length} vendors have assigned consultants (${vendors.length - vendorsWithConsultants.length} unassigned)`);
    
    // Check each consultant's assigned vendors
    for (const consultant of consultants) {
      const assignedVendors = vendors.filter(vendor => 
        vendor.assignedConsultant && vendor.assignedConsultant.toString() === consultant._id.toString()
      );
      
      console.log(`Consultant ${consultant.name} (${consultant.email}) has ${assignedVendors.length} assigned vendors`);
      
      if (assignedVendors.length > 0) {
        console.log('  Assigned vendors:');
        assignedVendors.forEach(vendor => {
          console.log(`  - ${vendor.name} (${vendor.email})`);
        });
      } else {
        console.log('  No vendors assigned to this consultant');
      }
      
      // Check for submissions from this consultant's vendors
      const vendorIds = assignedVendors.map(v => v._id);
      const submissions = await DocumentSubmission.find({ 
        vendor: { $in: vendorIds },
        'consultant.email': consultant.email
      });
      
      console.log(`  Found ${submissions.length} submissions from assigned vendors`);
      
      if (submissions.length > 0) {
        console.log('  Recent submissions:');
        submissions.slice(0, 3).forEach(sub => {
          console.log(`  - ${sub.submissionId} (${sub.uploadPeriod.month} ${sub.uploadPeriod.year}) - ${sub.documents.length} documents`);
        });
      }
      
      console.log('-------------------');
    }
    
    // Check for unassigned vendors with submissions
    const unassignedVendors = vendors.filter(vendor => !vendor.assignedConsultant);
    if (unassignedVendors.length > 0) {
      console.log(`\nChecking ${unassignedVendors.length} unassigned vendors for submissions...`);
      
      for (const vendor of unassignedVendors.slice(0, 5)) { // Check first 5 for brevity
        const submissions = await DocumentSubmission.find({ vendor: vendor._id });
        
        if (submissions.length > 0) {
          console.log(`Vendor ${vendor.name} (${vendor.email}) has ${submissions.length} submissions but NO assigned consultant`);
        }
      }
    }
    
    console.log('\nAssignment check complete!');
  } catch (error) {
    console.error('Error checking assignments:', error);
  }
};

// Main function
const main = async () => {
  const conn = await connectDB();
  
  await checkVendorConsultantAssignments();
  
  // Close connection
  mongoose.connection.close();
  console.log('MongoDB connection closed');
};

// Run the script
main();