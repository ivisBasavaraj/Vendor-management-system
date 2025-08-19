// Debug script to check user data in database
// Run with: node debug-user-data.js

const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/vendor-management-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// User Schema (simplified for debugging)
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  agreementPeriod: String,
  createdAt: Date,
  updatedAt: Date
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function debugUserData() {
  try {
    console.log('=== Debugging User Data ===\n');
    
    // Find all users first
    const allUsers = await User.find({}).select('name email role agreementPeriod createdAt updatedAt');
    console.log(`Found ${allUsers.length} total user(s):\n`);
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    console.log('\n=== VENDOR USERS ONLY ===\n');
    
    // Find all vendor users
    const vendors = allUsers.filter(user => user.role === 'vendor');
    
    console.log(`Found ${vendors.length} vendor(s):\n`);
    
    vendors.forEach((vendor, index) => {
      console.log(`${index + 1}. ${vendor.name} (${vendor.email})`);
      console.log(`   Agreement Period: "${vendor.agreementPeriod || 'NOT SET'}"`);
      console.log(`   Created At: ${vendor.createdAt ? vendor.createdAt.toISOString() : 'NOT SET'}`);
      console.log(`   Updated At: ${vendor.updatedAt ? vendor.updatedAt.toISOString() : 'NOT SET'}`);
      
      // Test the expiry calculation
      if (vendor.agreementPeriod && vendor.createdAt) {
        const result = testExpiryCalculation(vendor.agreementPeriod, vendor.createdAt.toISOString());
        console.log(`   Expiry Test Result:`);
        console.log(`     End Date: ${result.endDate ? result.endDate.toLocaleDateString() : 'N/A'}`);
        console.log(`     Days Remaining: ${result.daysRemaining}`);
        console.log(`     Is Expiring: ${result.isExpiring}`);
        console.log(`     Status: ${result.status}`);
      } else {
        console.log(`   ❌ Missing data for expiry calculation`);
      }
      
      console.log('');
    });
    
    if (vendors.length === 0) {
      console.log('❌ No vendor users found in database');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Test expiry calculation function
function testExpiryCalculation(agreementPeriod, createdAt) {
  const periodString = agreementPeriod.trim();
  const creationDate = new Date(createdAt);
  
  if (isNaN(creationDate.getTime())) {
    return { endDate: null, daysRemaining: 0, isExpiring: false, status: 'Invalid creation date' };
  }

  let endDate;
  let durationInMonths = 12; // Default

  // Check if agreement period is in date range format (e.g., "1 July 2025 to 15 July 2025")
  const dateRangeMatch = periodString.match(/(\d{1,2}\s+\w+\s+\d{4})\s+to\s+(\d{1,2}\s+\w+\s+\d{4})/i);
  if (dateRangeMatch) {
    const endDateStr = dateRangeMatch[2];
    endDate = new Date(endDateStr);
    
    if (!isNaN(endDate.getTime())) {
      // Calculate duration in months for reference
      const timeDiff = endDate.getTime() - creationDate.getTime();
      durationInMonths = Math.round(timeDiff / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
    } else {
      return { endDate: null, daysRemaining: 0, isExpiring: false, status: 'Invalid end date in range' };
    }
  } else {
    // Parse as period description
    const periodStringLower = periodString.toLowerCase();
    
    if (periodStringLower.includes('annual') || periodStringLower.includes('yearly') || periodStringLower.includes('1 year')) {
      durationInMonths = 12;
    } else if (periodStringLower.includes('2 year')) {
      durationInMonths = 24;
    } else if (periodStringLower.includes('3 year')) {
      durationInMonths = 36;
    } else if (periodStringLower.includes('6 month')) {
      durationInMonths = 6;
    } else if (periodStringLower.includes('permanent') || periodStringLower.includes('indefinite')) {
      return { endDate: null, durationInMonths: 0, isExpiring: false, status: 'Permanent contract' };
    }

    // Calculate end date by adding duration to creation date
    endDate = new Date(creationDate);
    endDate.setMonth(endDate.getMonth() + durationInMonths);
  }
  
  const now = new Date();
  const timeDiff = endDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  let status = 'Active';
  if (daysRemaining <= 0) {
    status = `Expired ${Math.abs(daysRemaining)} days ago`;
  } else if (daysRemaining <= 30) {
    status = `Expiring in ${daysRemaining} days`;
  }

  return {
    endDate,
    daysRemaining: Math.max(0, daysRemaining),
    isExpiring: daysRemaining <= 30 && daysRemaining > 0,
    status
  };
}

// Run the debug
debugUserData();