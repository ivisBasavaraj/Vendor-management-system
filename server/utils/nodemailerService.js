const nodemailer = require('nodemailer');

/**
 * Nodemailer Email Service - Alternative to EmailJS
 * This service uses Gmail SMTP to send emails when EmailJS fails
 */

class NodemailerService {
  constructor() {
    this.transporter = null;
    // Only initialize if SMTP credentials are provided
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.initializeTransporter();
    } else {
      console.log('SMTP credentials not provided - SMTP backup disabled');
    }
  }

  /**
   * Initialize the email transporter
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('SMTP connection error:', error);
        } else {
          console.log('SMTP server is ready to send emails');
        }
      });
    } catch (error) {
      console.error('Error initializing email transporter:', error);
    }
  }

  /**
   * Generate HTML email template for user welcome
   * @param {Object} user - User object
   * @param {string} password - Temporary password
   * @param {Object} consultant - Assigned consultant (optional)
   * @returns {string} - HTML email content
   */
  generateWelcomeEmailHTML(user, password, consultant = null) {
    return `
    <div style="font-family: system-ui, sans-serif, Arial; font-size: 16px; background-color: #fff8f1;">
      <div style="max-width: 600px; margin: auto; padding: 16px;">
        <img src="https://upload.wikimedia.org/wikipedia/commons/d/d8/IMTMA.png" alt="IMTMA Logo" width="99" height="60"><br>
        
        <h2 style="color: #fc0038;">Welcome to the IMTMA family!</h2>
        
        <p>Dear ${user.name},</p>
        
        <p>We're excited to have you on board as a <strong>${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</strong> in our Vendor Management System.</p>
        
        <p>Your account has been successfully created with the following details:</p>
        
        <!-- Account Information -->
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #fc0038; margin-top: 0;">🔐 Account Information</h3>
          <p><strong>Name:</strong> ${user.name}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
          <p><strong>Temporary Password:</strong> <span style="background-color: #ffe6e6; padding: 4px 8px; border-radius: 3px; font-family: monospace; font-weight: bold;">${password}</span></p>
        </div>
        
        <!-- Company Details -->
        <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #fc0038; margin-top: 0;">🏢 Company Details</h3>
          <p><strong>Company:</strong> ${user.company || 'N/A'}</p>
          <p><strong>Phone:</strong> ${user.phone || 'N/A'}</p>
          <p><strong>Address:</strong> ${user.address || 'N/A'}</p>
          <p><strong>Work Location:</strong> ${user.workLocation || 'N/A'}</p>
          <p><strong>Agreement Period:</strong> ${user.agreementPeriod || 'N/A'}</p>
          ${user.companyRegNo ? `<p><strong>Company Registration No:</strong> ${user.companyRegNo}</p>` : ''}
          ${user.taxId ? `<p><strong>Tax ID:</strong> ${user.taxId}</p>` : ''}
        </div>
        
        <!-- Consultant Assignment (Only for Vendors) -->
        ${consultant ? `
        <div style="background-color: #f0fff0; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #fc0038; margin-top: 0;">👨‍💼 Assigned Consultant</h3>
          <p><strong>Consultant:</strong> ${consultant.name}</p>
          <p><strong>Email:</strong> ${consultant.email}</p>
          <p><strong>Phone:</strong> ${consultant.phone || 'N/A'}</p>
        </div>
        ` : ''}
        
        <!-- Next Steps -->
        <div style="background-color: #fff5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #fc0038; margin-top: 0;">📋 Next Steps</h3>
          <ol style="margin: 0; padding-left: 20px;">
            <li>Click the button below to access the system</li>
            <li>Login with your email and temporary password</li>
            <li><strong>Change your password immediately after first login</strong></li>
            <li>Complete your profile setup</li>
            <li>Start using the system features</li>
          </ol>
        </div>
        
        <!-- Call to Action -->
        <p style="text-align: center; margin: 30px 0;">
          <a style="display: inline-block; text-decoration: none; outline: none; color: #fff; background-color: #fc0038; padding: 12px 24px; border-radius: 4px; font-weight: bold; font-size: 16px;" href="${process.env.CLIENT_URL || 'http://localhost:3000/login'}" target="_blank" rel="noopener">
            🚀 Access IMTMA System
          </a>
        </p>
        
        <!-- Security Notice -->
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0;"><strong>🔒 Security Notice:</strong> Please change your temporary password immediately after your first login for security purposes.</p>
        </div>
        
        <!-- Support Information -->
        <p>If you have any questions or need help getting started, our support team is just an email away at <strong style="color: #fc0038;">support@imtma.in</strong>. We're here to assist you every step of the way!</p>
        
        <p style="color: #666; font-size: 14px;">Account created on: ${new Date().toLocaleDateString()}</p>
        
        <p>Best regards,<br><strong>The IMTMA Team</strong></p>
      </div>
    </div>
    `;
  }





  /**
   * Test email configuration
   * @returns {Promise<Object>} - Test result
   */
  async testConnection() {
    try {
      if (!this.transporter) {
        return {
          success: false,
          error: 'Email transporter not initialized'
        };
      }

      await this.transporter.verify();
      return {
        success: true,
        message: 'SMTP connection successful'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new NodemailerService();