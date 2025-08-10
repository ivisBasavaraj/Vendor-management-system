// Debug script to check agreement expiry for current users
// Run with: node debug-agreement-expiry.js

const mongoose = require('mongoose');
require('dotenv').config();

// User model (simplified)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  agreementPeriod: String,
  createdAt: Date
});

const User = mongoose.model('User', userSchema);

// Utility function to parse agreement period string and calculate end date
const parseAgreementPeriod = (agreementPeriod, createdAt) => {
  if (!agreementPeriod || !createdAt) {
    return { endDate: null, durationInMonths: 0 };
  }

  const periodString = agreementPeriod.toLowerCase().trim();
  const creationDate = new Date(createdAt);
  
  // If creation date is invalid, return null
  if (isNaN(creationDate.getTime())) {
    return { endDate: null, durationInMonths: 0 };
  }

  // Check if agreement period is in date range format (e.g., "1 July 2025 to 15 July 2025")
  const dateRangeMatch = periodString.match(/(\d{1,2}\s+\w+\s+\d{4})\s+to\s+(\d{1,2}\s+\w+\s+\d{4})/i);
  if (dateRangeMatch) {
    const endDateStr = dateRangeMatch[2];
    const endDate = new Date(endDateStr);
    
    if (!isNaN(endDate.getTime())) {
      // Calculate duration in months for reference
      const timeDiff = endDate.getTime() - creationDate.getTime();
      const durationInMonths = Math.round(timeDiff / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
      
      return { endDate, durationInMonths };
    }
  }

  let durationInMonths = 12; // Default to 1 year

  // Parse common agreement period formats
  if (periodString.includes('annual') || periodString.includes('yearly') || periodString.includes('1 year')) {
    durationInMonths = 12;
  } else if (periodString.includes('2 year') || periodString.includes('two year')) {
    durationInMonths = 24;
  } else if (periodString.includes('3 year') || periodString.includes('three year')) {
    durationInMonths = 36;
  } else if (periodString.includes('6 month') || periodString.includes('six month')) {
    durationInMonths = 6;
  } else if (periodString.includes('18 month') || periodString.includes('eighteen month')) {
    durationInMonths = 18;
  } else if (periodString.includes('permanent') || periodString.includes('indefinite')) {
    // For permanent contracts, don't show expiry warning
    return { endDate: null, durationInMonths: 0 };
  } else {
    // Try to extract number from string (e.g., "5 Year Contract" -> 5)
    const numberMatch = periodString.match(/(\d+)\s*(year|month)/);
    if (numberMatch) {
      const number = parseInt(numberMatch[1], 10);
      const unit = numberMatch[2];
      
      if (unit === 'year') {
        durationInMonths = number * 12;
      } else if (unit === 'month') {
        durationInMonths = number;
      }
    }
  }

  // Calculate end date by adding duration to creation date
  const endDate = new Date(creationDate);
  endDate.setMonth(endDate.getMonth() + durationInMonths);
  
  return { endDate, durationInMonths };
};

// Function to check if agreement is expiring within 30 days
const checkAgreementExpiry = (agreementPeriod, createdAt) => {
  const { endDate } = parseAgreementPeriod(agreementPeriod, createdAt);
  
  if (!endDate) {
    return {
      isExpiring: false,
      daysRemaining: 0,
      endDate: null
    };
  }

  const now = new Date();
  const timeDiff = endDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  return {
    isExpiring: daysRemaining <= 30 && daysRemaining > 0,
    daysRemaining: Math.max(0, daysRemaining),
    endDate
  };
};

async function debugAgreementExpiry() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vendor-management');
    console.log('Connected to MongoDB');

    // Find all vendor users
    const vendors = await User.find({ role: 'vendor' }).select('name email agreementPeriod createdAt');
    
    console.log('\n=== Agreement Expiry Debug Report ===\n');
    console.log(`Found ${vendors.length} vendor(s)\n`);

    vendors.forEach((vendor, index) => {
      console.log(`${index + 1}. ${vendor.name} (${vendor.email})`);
      console.log(`   Created: ${vendor.createdAt ? vendor.createdAt.toLocaleDateString() : 'N/A'}`);
      console.log(`   Agreement Period: "${vendor.agreementPeriod || 'Not set'}"`);
      
      if (vendor.agreementPeriod && vendor.createdAt) {
        const result = checkAgreementExpiry(vendor.agreementPeriod, vendor.createdAt);
        console.log(`   Parsed End Date: ${result.endDate ? result.endDate.toLocaleDateString() : 'N/A'}`);
        console.log(`   Days Remaining: ${result.daysRemaining}`);
        console.log(`   Is Expiring (≤30 days): ${result.isExpiring ? '✅ YES - WARNING SHOULD SHOW' : '❌ NO'}`);
        
        if (result.endDate && result.daysRemaining <= 0) {
          console.log(`   Status: ⚠️ EXPIRED (${Math.abs(result.daysRemaining)} days ago)`);
        } else if (result.isExpiring) {
          console.log(`   Status: 🔔 EXPIRING SOON`);
        } else {
          console.log(`   Status: ✅ ACTIVE`);
        }
      } else {
        console.log(`   Status: ❓ CANNOT CALCULATE (missing data)`);
      }
      console.log('');
    });

    console.log('=== Debug Complete ===');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugAgreementExpiry();