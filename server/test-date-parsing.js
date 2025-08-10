// Test date parsing for the problematic agreement period
const testAgreementPeriod = "1 April 2025 to 26 Agust 2025";
const createdAt = "2025-08-10T00:00:00.000Z";

console.log('Testing agreement period parsing...');
console.log('Agreement Period:', testAgreementPeriod);
console.log('Created At:', createdAt);

// Test the regex pattern
const dateRangeMatch = testAgreementPeriod.toLowerCase().match(/(\d{1,2}\s+\w+\s+\d{4})\s+to\s+(\d{1,2}\s+\w+\s+\d{4})/i);
console.log('Regex match result:', dateRangeMatch);

if (dateRangeMatch) {
  const startDateStr = dateRangeMatch[1];
  const endDateStr = dateRangeMatch[2];
  
  console.log('Start date string:', startDateStr);
  console.log('End date string:', endDateStr);
  
  // Try to parse the end date
  const endDate = new Date(endDateStr);
  console.log('Parsed end date:', endDate);
  console.log('Is valid date:', !isNaN(endDate.getTime()));
  
  // Try with corrected spelling
  const correctedEndDateStr = endDateStr.replace('agust', 'august');
  const correctedEndDate = new Date(correctedEndDateStr);
  console.log('Corrected end date string:', correctedEndDateStr);
  console.log('Corrected parsed end date:', correctedEndDate);
  console.log('Is corrected date valid:', !isNaN(correctedEndDate.getTime()));
  
  // Calculate days remaining
  const now = new Date();
  const timeDiff = correctedEndDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  console.log('Current date:', now);
  console.log('Days remaining:', daysRemaining);
  console.log('Should show warning (≤30 days):', daysRemaining <= 30 && daysRemaining > 0);
}