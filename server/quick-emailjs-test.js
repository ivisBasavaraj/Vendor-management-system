// Quick EmailJS test after enabling server-side access
require('dotenv').config();

const emailjs = require('@emailjs/nodejs');

async function quickTest() {
  console.log('🧪 Quick EmailJS Test After Enabling Server-Side Access\n');

  try {
    // Initialize EmailJS
    emailjs.init({
      publicKey: process.env.EMAILJS_PUBLIC_KEY,
      privateKey: process.env.EMAILJS_PRIVATE_KEY,
    });

    console.log('📤 Testing EmailJS with your credentials...');

    // Try different recipient variable names that EmailJS commonly uses
    const templateParams = {
      // Common recipient variables
      to_email: 'aryanpapu2005@gmail.com',
      to_name: 'Aryan',
      email: 'aryanpapu2005@gmail.com',
      name: 'Aryan',
      recipient_email: 'aryanpapu2005@gmail.com',
      recipient_name: 'Aryan',
      
      // Email content
      subject: 'EmailJS Server-Side Test Success!',
      message: 'This is a test email to verify EmailJS server-side access is working!',
      
      // User data
      user_name: 'Test User',
      user_email: 'test@example.com',
      user_password: 'TestPass123',
      user_role: 'Vendor',
      company_name: 'Test Company',
      login_url: 'http://localhost:3000/login'
    };

    console.log('📋 Template Parameters:', templateParams);

    const response = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );

    console.log('🎉 SUCCESS! EmailJS server-side access is now working!');
    console.log('📧 Response:', response);
    console.log('\n✅ You can now create users and emails will be sent automatically!');
    
  } catch (error) {
    if (error.status === 403) {
      console.log('❌ Server-side access is still DISABLED');
      console.log('📋 Please check EmailJS dashboard settings again');
    } else {
      console.log('❌ Different error:', error.text || error.message);
    }
  }
}

quickTest();