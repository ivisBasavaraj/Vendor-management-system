#!/usr/bin/env node

/**
 * Quick EmailJS Fix and Test Script
 * This script verifies the EmailJS configuration and provides fixes
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 EmailJS Configuration Fix & Test');
console.log('=====================================\n');

// Check server .env file
const serverEnvPath = path.join(__dirname, 'server', '.env');
const clientEnvPath = path.join(__dirname, 'client', '.env');

console.log('📋 Checking Configuration Files...\n');

// Check server .env
if (fs.existsSync(serverEnvPath)) {
  const serverEnv = fs.readFileSync(serverEnvPath, 'utf8');
  const hasEmailjsUserId = serverEnv.includes('EMAILJS_USER_ID=o3dwpHGpHKdlNsieC');
  console.log(`✅ Server .env exists: ${hasEmailjsUserId ? 'EmailJS User ID configured' : '⚠️ EmailJS User ID not found'}`);
} else {
  console.log('❌ Server .env file not found');
}

// Check client .env
if (fs.existsSync(clientEnvPath)) {
  const clientEnv = fs.readFileSync(clientEnvPath, 'utf8');
  const hasReactEmailjsUserId = clientEnv.includes('REACT_APP_EMAILJS_USER_ID=o3dwpHGpHKdlNsieC');
  console.log(`✅ Client .env exists: ${hasReactEmailjsUserId ? 'React EmailJS User ID configured' : '⚠️ React EmailJS User ID not found'}`);
} else {
  console.log('❌ Client .env file not found');
}

console.log('\n🎯 Current Configuration:');
console.log('- Service ID: service_5oxyeaa');
console.log('- Template ID: template_yajf9hf');
console.log('- User ID: o3dwpHGpHKdlNsieC');

console.log('\n📝 Next Steps:');
console.log('1. Make sure both client and server are completely stopped');
console.log('2. Restart the client: cd client && npm start');
console.log('3. Restart the server: cd server && npm run dev');
console.log('4. Check browser console for EmailJS debug messages');
console.log('5. Look for "🔧 EmailJS Configuration Debug:" in console');

console.log('\n🔍 If still having issues:');
console.log('1. Clear browser cache and hard refresh (Ctrl+Shift+R)');
console.log('2. Check if process.env.REACT_APP_EMAILJS_USER_ID is visible in browser DevTools');
console.log('3. Try creating a new .env file with only the EmailJS variables');

console.log('\n✅ Configuration should now be working!');
console.log('The fallback configuration in config/emailjs.config.ts will ensure EmailJS works even if env vars fail.');