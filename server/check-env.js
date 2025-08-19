// Load environment variables
require('dotenv').config();

console.log('🔍 Environment Variables Check:');
console.log('================================');
console.log('EMAILJS_SERVICE_ID:', process.env.EMAILJS_SERVICE_ID || 'MISSING ❌');
console.log('EMAILJS_TEMPLATE_ID:', process.env.EMAILJS_TEMPLATE_ID || 'MISSING ❌');
console.log('EMAILJS_PUBLIC_KEY:', process.env.EMAILJS_PUBLIC_KEY || 'MISSING ❌');
console.log('EMAILJS_PRIVATE_KEY:', process.env.EMAILJS_PRIVATE_KEY ? 'LOADED ✅' : 'MISSING ❌');
console.log('================================');

// Test EmailJS service initialization
try {
  const emailService = require('./utils/emailService');
  console.log('📧 EmailJS Service initialized successfully');
} catch (error) {
  console.error('❌ Error initializing EmailJS service:', error.message);
}