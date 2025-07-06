#!/usr/bin/env node

/**
 * EmailJS Setup Script for Vendor Management System
 * This script helps configure EmailJS settings and creates necessary environment files
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEmailJS() {
  console.log('\n🔧 EmailJS Setup for Vendor Management System');
  console.log('================================================\n');

  console.log('This script will help you configure EmailJS for sending role-based emails.\n');

  // Get EmailJS configuration
  const serviceId = await question('Enter your EmailJS Service ID (default: service_5oxyeaa): ') || 'service_5oxyeaa';
  const templateId = await question('Enter your EmailJS Template ID (default: template_yajf9hf): ') || 'template_yajf9hf';
  const userId = await question('Enter your EmailJS User ID (Public Key): ');

  if (!userId) {
    console.log('\n❌ Error: EmailJS User ID is required!');
    console.log('Please get your User ID from https://www.emailjs.com/');
    process.exit(1);
  }

  // Get server configuration
  const serverPort = await question('Enter server port (default: 5000): ') || '5000';
  const clientPort = await question('Enter client port (default: 3000): ') || '3000';
  const mongoUri = await question('Enter MongoDB URI (leave empty to use default): ') || 'mongodb://localhost:27017/vendor-management';
  const jwtSecret = await question('Enter JWT Secret (leave empty to generate): ') || generateRandomString(32);

  // Create server .env file
  const serverEnvContent = `# Database Configuration
MONGO_URI=${mongoUri}

# JWT Configuration
JWT_SECRET=${jwtSecret}
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# Server Configuration
PORT=${serverPort}
NODE_ENV=development

# EmailJS Configuration
EMAILJS_SERVICE_ID=${serviceId}
EMAILJS_TEMPLATE_ID=${templateId}
EMAILJS_USER_ID=${userId}

# Client Configuration
CLIENT_URL=http://localhost:${clientPort}
`;

  // Create client .env file
  const clientEnvContent = `# EmailJS Configuration
REACT_APP_EMAILJS_SERVICE_ID=${serviceId}
REACT_APP_EMAILJS_TEMPLATE_ID=${templateId}
REACT_APP_EMAILJS_USER_ID=${userId}

# API Configuration
REACT_APP_API_URL=http://localhost:${serverPort}
REACT_APP_CLIENT_URL=http://localhost:${clientPort}

# Environment
REACT_APP_NODE_ENV=development
`;

  // Write server .env file
  const serverEnvPath = path.join(__dirname, 'server', '.env');
  fs.writeFileSync(serverEnvPath, serverEnvContent);
  console.log(`\n✅ Created server/.env file`);

  // Write client .env file
  const clientEnvPath = path.join(__dirname, 'client', '.env');
  fs.writeFileSync(clientEnvPath, clientEnvContent);
  console.log(`✅ Created client/.env file`);

  // Create EmailJS template guide
  const templateGuide = `
# EmailJS Template Configuration

Your EmailJS template has been configured with these settings:
- Service ID: ${serviceId}
- Template ID: ${templateId}
- User ID: ${userId}

## Next Steps:

1. **Setup EmailJS Template:**
   - Go to https://www.emailjs.com/
   - Navigate to your templates
   - Create or edit template with ID: ${templateId}
   - Copy the HTML template from: server/templates/emailjs-template-guide.md

2. **Test Configuration:**
   - Start your server: cd server && npm run dev
   - Start your client: cd client && npm start
   - Check browser console for EmailJS initialization messages
   - Use the EmailJS test component in admin dashboard

3. **Template Variables:**
   Your template should include these variables:
   - {{subject}} - Email subject
   - {{to_name}} - Recipient name
   - {{email_type}} - Type of email (vendor_welcome, document_upload_confirmation, etc.)
   - See full list in server/templates/emailjs-template-guide.md

4. **Testing:**
   - Admin can test emails from: /admin/settings
   - API endpoints available at: /api/email/*
   - Check server logs for email sending status

## Troubleshooting:

- If emails don't send, verify your EmailJS service is active
- Check CORS settings in EmailJS dashboard (allow localhost)
- Verify template ID matches exactly
- Check browser network tab for EmailJS API calls
`;

  fs.writeFileSync(path.join(__dirname, 'EMAILJS_SETUP_COMPLETE.md'), templateGuide);
  console.log(`✅ Created setup guide: EMAILJS_SETUP_COMPLETE.md`);

  console.log('\n🎉 EmailJS Setup Complete!');
  console.log('\nConfiguration Summary:');
  console.log(`📧 Service ID: ${serviceId}`);
  console.log(`📄 Template ID: ${templateId}`);
  console.log(`🔑 User ID: ${userId}`);
  console.log(`🖥️  Server: http://localhost:${serverPort}`);
  console.log(`💻 Client: http://localhost:${clientPort}`);

  console.log('\n📋 Next Steps:');
  console.log('1. Configure your EmailJS template using the guide in server/templates/emailjs-template-guide.md');
  console.log('2. Start your development servers');
  console.log('3. Test email functionality from the admin dashboard');

  rl.close();
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Check if we're in the right directory
if (!fs.existsSync('server') || !fs.existsSync('client')) {
  console.log('❌ Error: Please run this script from the root directory of the Vendor Management System');
  console.log('Make sure you have both "server" and "client" directories present.');
  process.exit(1);
}

// Run setup
setupEmailJS().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});