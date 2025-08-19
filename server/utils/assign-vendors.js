/**
 * Utility script to assign vendors to consultants
 * This can be run to fix vendor-consultant relationships
 */

const mongoose = require('mongoose');
const User = require('../models/user.model');
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

// Assign vendors to consultants
const assignVendorsToConsultants = async () => {
  try {
    console.log('Starting vendor-consultant assignment process...');
    
    // Get all consultants
    const consultants = await User.find({ role: 'consultant' });
    console.log(`Found ${consultants.length} consultants`);
    
    if (consultants.length === 0) {
      console.log('No consultants found. Please create consultant users first.');
      return;
    }
    
    // Get all vendors
    const vendors = await User.find({ role: 'vendor' });
    console.log(`Found ${vendors.length} vendors`);
    
    if (vendors.length === 0) {
      console.log('No vendors found. Please create vendor users first.');
      return;
    }
    
    // Count vendors with assigned consultants
    const vendorsWithConsultants = vendors.filter(vendor => vendor.assignedConsultant);
    console.log(`${vendorsWithConsultants.length} vendors already have assigned consultants`);
    
    // Get unassigned vendors
    const unassignedVendors = vendors.filter(vendor => !vendor.assignedConsultant);
    console.log(`${unassignedVendors.length} vendors need to be assigned`);
    
    if (unassignedVendors.length === 0) {
      console.log('All vendors are already assigned to consultants. No action needed.');
      return;
    }
    
    // Distribute vendors evenly among consultants
    const vendorsPerConsultant = Math.ceil(unassignedVendors.length / consultants.length);
    console.log(`Assigning approximately ${vendorsPerConsultant} vendors per consultant`);
    
    let assignmentCount = 0;
    
    for (let i = 0; i < unassignedVendors.length; i++) {
      const vendor = unassignedVendors[i];
      const consultantIndex = Math.floor(i / vendorsPerConsultant);
      
      // If we run out of consultants, loop back to the first one
      const consultant = consultants[consultantIndex % consultants.length];
      
      try {
        // Use updateOne to avoid validation issues
        await User.updateOne(
          { _id: vendor._id },
          { $set: { assignedConsultant: consultant._id } }
        );
        
        console.log(`Assigned vendor ${vendor.name} (${vendor.email}) to consultant ${consultant.name} (${consultant.email})`);
        assignmentCount++;
      } catch (error) {
        console.error(`Error assigning consultant to vendor ${vendor.name}:`, error.message);
      }
    }
    
    console.log(`\nAssignment complete! ${assignmentCount} vendors have been assigned to consultants.`);
    
    // Verify assignments
    const updatedVendors = await User.find({ role: 'vendor' });
    const nowAssigned = updatedVendors.filter(v => v.assignedConsultant).length;
    
    console.log(`${nowAssigned} out of ${updatedVendors.length} vendors now have assigned consultants`);
    
    // Show assignment distribution
    console.log('\nConsultant assignment distribution:');
    for (const consultant of consultants) {
      const assignedCount = await User.countDocuments({ 
        role: 'vendor', 
        assignedConsultant: consultant._id 
      });
      
      console.log(`- ${consultant.name} (${consultant.email}): ${assignedCount} vendors`);
    }
    
  } catch (error) {
    console.error('Error assigning vendors to consultants:', error);
  }
};

// Main function
const main = async () => {
  const conn = await connectDB();
  
  await assignVendorsToConsultants();
  
  // Close connection
  mongoose.connection.close();
  console.log('\nMongoDB connection closed');
};

// Run the script
main();