// Test script to verify agreement expiry parsing logic
// Run with: node test-agreement-expiry.js

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

// Test cases
console.log('=== Agreement Expiry Warning Tests ===\n');

const testCases = [
  {
    name: 'Annual Contract - Expires in 15 days',
    agreementPeriod: 'Annual Contract',
    createdAt: new Date(Date.now() - (365 - 15) * 24 * 60 * 60 * 1000).toISOString(),
    expected: 'Should show expiry warning'
  },
  {
    name: 'Annual Contract - Expires in 45 days',
    agreementPeriod: 'Annual Contract',
    createdAt: new Date(Date.now() - (365 - 45) * 24 * 60 * 60 * 1000).toISOString(),
    expected: 'Should NOT show expiry warning'
  },
  {
    name: '2 Year Contract - Expires in 20 days',
    agreementPeriod: '2 Year Contract',
    createdAt: new Date(Date.now() - (730 - 20) * 24 * 60 * 60 * 1000).toISOString(),
    expected: 'Should show expiry warning'
  },
  {
    name: '6 Month Contract - Expires in 10 days',
    agreementPeriod: '6 Month Contract',
    createdAt: new Date(Date.now() - (180 - 10) * 24 * 60 * 60 * 1000).toISOString(),
    expected: 'Should show expiry warning'
  },
  {
    name: 'Permanent Contract',
    agreementPeriod: 'Permanent',
    createdAt: new Date(Date.now() - 36 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    expected: 'Should NOT show expiry warning (permanent)'
  },
  {
    name: 'Custom 5 Year Contract - Expires in 25 days',
    agreementPeriod: '5 Year Contract',
    createdAt: new Date(Date.now() - (1825 - 25) * 24 * 60 * 60 * 1000).toISOString(),
    expected: 'Should show expiry warning'
  },
  {
    name: 'Annual Contract - Expires today',
    agreementPeriod: 'Annual Contract',
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    expected: 'Should NOT show expiry warning (expired)'
  }
];

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}`);
  console.log(`   Agreement Period: "${testCase.agreementPeriod}"`);
  console.log(`   Created: ${new Date(testCase.createdAt).toLocaleDateString()}`);
  
  const result = checkAgreementExpiry(testCase.agreementPeriod, testCase.createdAt);
  
  console.log(`   End Date: ${result.endDate ? result.endDate.toLocaleDateString() : 'N/A'}`);
  console.log(`   Days Remaining: ${result.daysRemaining}`);
  console.log(`   Is Expiring: ${result.isExpiring}`);
  console.log(`   Expected: ${testCase.expected}`);
  console.log(`   Result: ${result.isExpiring ? '✅ SHOWING WARNING' : '❌ NO WARNING'}`);
  console.log('');
});

console.log('=== Test Complete ===');