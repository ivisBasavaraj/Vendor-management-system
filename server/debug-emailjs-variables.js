// Debug EmailJS template variables
require('dotenv').config();

const emailjs = require('@emailjs/nodejs');

async function debugEmailJSVariables() {
  console.log('🔍 Debug EmailJS Template Variables\n');

  try {
    // Initialize EmailJS
    emailjs.init({
      publicKey: process.env.EMAILJS_PUBLIC_KEY,
      privateKey: process.env.EMAILJS_PRIVATE_KEY,
    });

    // Create comprehensive test data
    const templateParams = {
      // Recipient information (multiple formats)
      to_email: 'aryanpapu2005@gmail.com',
      to_name: 'Aryan Papu',
      email: 'aryanpapu2005@gmail.com',
      name: 'Aryan Papu',
      recipient_email: 'aryanpapu2005@gmail.com',
      recipient_name: 'Aryan Papu',
      
      // User account information
      user_name: 'Aryan Papu',
      user_email: 'aryanpapu2005@gmail.com',
      user_password: 'TempPass123!',
      user_role: 'Vendor',
      
      // Company information
      company_name: 'Test Manufacturing Company',
      phone_number: '+91-9876543210',
      address: '123 Industrial Area, Bangalore, Karnataka 560001',
      work_location: 'Bangalore',
      agreement_period: 'Annual Contract (2024-2025)',
      company_reg_no: 'CIN123456789',
      tax_id: 'GST29ABCDE1234F1Z5',
      
      // Consultant information
      assigned_consultant: 'John Consultant',
      consultant_email: 'john.consultant@imtma.in',
      consultant_phone: '+91-9876543211',
      
      // System information
      login_url: 'http://localhost:3000/login',
      created_date: new Date().toLocaleDateString('en-IN'),
      subject: 'Welcome to IMTMA Vendor Management System - Your Account Details',
      
      // Email content
      message: 'Welcome to IMTMA! Your vendor account has been created successfully.'
    };

    console.log('📋 Template Parameters Being Sent:');
    console.log('=====================================');
    Object.entries(templateParams).forEach(([key, value]) => {
      console.log(`${key}: "${value}"`);
    });
    console.log('=====================================\n');

    console.log('📤 Sending email with debug data...');

    const response = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );

    console.log('✅ Email sent successfully!');
    console.log('📧 Response:', response);
    console.log('\n📬 Check your email (aryanpapu2005@gmail.com) to see if variables are populated correctly.');
    console.log('\n🔧 If variables still show as corrupted:');
    console.log('   1. Copy the template from FIXED_EMAILJS_TEMPLATE.html');
    console.log('   2. Replace your current EmailJS template');
    console.log('   3. Test again');
    
  } catch (error) {
    console.error('❌ Error:', error.text || error.message);
  }
}

debugEmailJSVariables();