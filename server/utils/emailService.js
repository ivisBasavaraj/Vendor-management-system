const crypto = require('crypto');
const emailjs = require('@emailjs/nodejs');
const nodemailerService = require('./nodemailerService');

/**
 * EmailJS Service for sending role-based emails
 * This service works with EmailJS Node.js SDK to send automatic email notifications
 */

class EmailService {
  constructor() {
    // Use your provided EmailJS credentials
    this.serviceId = process.env.EMAILJS_SERVICE_ID || 'service_pmod9cv';
    this.templateId = process.env.EMAILJS_TEMPLATE_ID || 'template_ojv7u88';
    this.publicKey = process.env.EMAILJS_PUBLIC_KEY || 'tvqapjUgFzWLxpwN9';
    this.privateKey = process.env.EMAILJS_PRIVATE_KEY; // This is required for server-side
    
    // Initialize EmailJS with credentials
    this.initializeEmailJS();
  }

  /**
   * Initialize EmailJS SDK with proper credentials
   */
  initializeEmailJS() {
    try {
      if (!this.publicKey) {
        console.warn('EmailJS Public Key not found in environment variables. Email functionality may not work.');
        return;
      }
      
      if (!this.privateKey) {
        console.warn('EmailJS Private Key not found. Server-side email sending requires a private key.');
        console.warn('Please add EMAILJS_PRIVATE_KEY to your environment variables.');
        return;
      }

      // Initialize EmailJS with public and private keys
      emailjs.init({
        publicKey: this.publicKey,
        privateKey: this.privateKey,
      });

      console.log('✅ EmailJS SDK initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing EmailJS SDK:', error);
    }
  }

  /**
   * Send email using EmailJS Node.js SDK with specific template ID
   * @param {Object} templateParams - Parameters for the email template
   * @param {string} templateId - Specific template ID to use (optional, defaults to this.templateId)
   * @returns {Promise<Object>} - Result of the email sending operation
   */
  async sendEmailWithTemplate(templateParams, templateId = null) {
    try {
      const useTemplateId = templateId || this.templateId;
      
      // Check if EmailJS is properly initialized
      if (!this.publicKey || !this.privateKey) {
        return {
          success: false,
          error: 'EmailJS credentials not properly configured. Please check EMAILJS_PUBLIC_KEY and EMAILJS_PRIVATE_KEY environment variables.'
        };
      }

      console.log('📤 Sending email via EmailJS Node.js SDK...');
      console.log('📋 Service ID:', this.serviceId);
      console.log('📋 Template ID:', useTemplateId);
      console.log('📋 Recipient:', templateParams.to_email);

      // Send email using the official EmailJS Node.js SDK
      const response = await emailjs.send(
        this.serviceId,
        useTemplateId,
        templateParams,
        {
          publicKey: this.publicKey,
          privateKey: this.privateKey,
        }
      );

      console.log('✅ Email sent successfully via EmailJS SDK');
      console.log('📧 Response:', response);
      
      return { 
        success: true, 
        message: 'Email sent successfully via EmailJS SDK',
        response: response
      };
    } catch (error) {
      console.error('❌ Error sending email via EmailJS SDK:', error);
      
      // Handle different types of errors
      if (error.text) {
        return { 
          success: false, 
          error: `EmailJS SDK error: ${error.text}` 
        };
      } else if (error.status) {
        return { 
          success: false, 
          error: `EmailJS SDK HTTP error: ${error.status}` 
        };
      } else {
        return { 
          success: false, 
          error: `EmailJS SDK error: ${error.message || 'Unknown error'}` 
        };
      }
    }
  }

  /**
   * Send email using EmailJS Node.js SDK (Server-side)
   * @param {Object} templateParams - Parameters for the email template
   * @returns {Promise<Object>} - Result of the email sending operation
   */
  async sendEmail(templateParams) {
    try {
      // Check if EmailJS is properly initialized
      if (!this.publicKey || !this.privateKey) {
        return {
          success: false,
          error: 'EmailJS credentials not properly configured. Please check EMAILJS_PUBLIC_KEY and EMAILJS_PRIVATE_KEY environment variables.'
        };
      }

      console.log('📤 Sending email via EmailJS Node.js SDK...');
      console.log('📋 Service ID:', this.serviceId);
      console.log('📋 Template ID:', this.templateId);
      console.log('📋 Recipient:', templateParams.to_email);

      // Send email using the official EmailJS Node.js SDK
      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams,
        {
          publicKey: this.publicKey,
          privateKey: this.privateKey,
        }
      );

      console.log('✅ Email sent successfully via EmailJS SDK');
      console.log('📧 Response:', response);
      
      return { 
        success: true, 
        message: 'Email sent successfully via EmailJS SDK',
        response: response
      };
    } catch (error) {
      console.error('❌ Error sending email via EmailJS SDK:', error);
      
      // Handle different types of errors
      if (error.text) {
        return { 
          success: false, 
          error: `EmailJS SDK error: ${error.text}` 
        };
      } else if (error.status) {
        return { 
          success: false, 
          error: `EmailJS API error: ${error.status} - ${error.text || error.message}` 
        };
      } else {
        return { 
          success: false, 
          error: `EmailJS error: ${error.message || 'Unknown error occurred'}` 
        };
      }
    }
  }

  /**
   * Send welcome email to new user (vendor or consultant) with all registration information
   * @param {Object} user - User object (vendor or consultant)
   * @param {string} temporaryPassword - Generated password for the user
   * @param {Object} consultant - Assigned consultant object (for vendors only)
   * @returns {Promise<Object>} - Result of email operation
   */
  async sendUserWelcomeEmail(user, temporaryPassword, consultant = null) {
    try {
      // First, try EmailJS
      console.log('Attempting to send email via EmailJS...');
      
      // Prepare template parameters with all user information
      // Include multiple recipient variable names to ensure compatibility
      const templateParams = {
        // Recipient information (multiple formats for compatibility)
        to_email: user.email,
        to_name: user.name,
        email: user.email,
        name: user.name,
        recipient_email: user.email,
        recipient_name: user.name,
        
        // User account information
        user_name: user.name,
        user_email: user.email,
        user_password: temporaryPassword,
        user_role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
        
        // Company information
        company_name: user.company || 'N/A',
        phone_number: user.phone || 'N/A',
        address: user.address || 'N/A',
        work_location: user.workLocation || 'N/A',
        agreement_period: user.agreementPeriod || 'N/A',
        company_reg_no: user.companyRegNo || 'N/A',
        tax_id: user.taxId || 'N/A',
        
        // Consultant information (for vendors)
        assigned_consultant: consultant ? consultant.name : 'N/A',
        consultant_email: consultant ? consultant.email : 'N/A',
        consultant_phone: consultant ? consultant.phone : 'N/A',
        
        // System information
        login_url: process.env.CLIENT_URL || 'http://localhost:3000/login',
        created_date: new Date().toLocaleDateString(),
        subject: `Welcome to IMTMA Vendor Management System - Your ${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Account Details`,
        
        // Email content
        message: `Welcome to IMTMA! Your ${user.role} account has been created successfully.`
      };

      const emailJSResult = await this.sendEmail(templateParams);
      
      if (emailJSResult.success) {
        console.log('✅ Email sent successfully via EmailJS');
        return {
          success: true,
          recipient: user.email,
          userRole: user.role,
          message: 'Welcome email sent successfully via EmailJS',
          method: 'EmailJS'
        };
      } else {
        console.log('❌ EmailJS failed, trying backup SMTP service...');
        console.log('EmailJS Error:', emailJSResult.error);
        
        // If EmailJS fails, try Nodemailer as backup
        const nodemailerResult = await nodemailerService.sendUserWelcomeEmail(user, temporaryPassword, consultant);
        
        if (nodemailerResult.success) {
          console.log('✅ Email sent successfully via SMTP backup');
          return {
            success: true,
            recipient: user.email,
            userRole: user.role,
            message: 'Welcome email sent successfully via SMTP (EmailJS backup)',
            method: 'SMTP',
            emailJSError: emailJSResult.error
          };
        } else {
          console.log('❌ Both EmailJS and SMTP failed');
          return {
            success: false,
            recipient: user.email,
            userRole: user.role,
            message: 'Failed to send welcome email via both EmailJS and SMTP',
            emailJSError: emailJSResult.error,
            smtpError: nodemailerResult.error
          };
        }
      }
    } catch (error) {
      console.error('Error in email sending process:', error);
      return {
        success: false,
        recipient: user.email,
        userRole: user.role,
        error: error.message
      };
    }
  }

  /**
   * Send welcome email to new vendor with login credentials (Legacy method - kept for backward compatibility)
   * @param {Object} vendor - Vendor user object
   * @param {Object} consultant - Assigned consultant object
   * @param {string} temporaryPassword - Generated password for the vendor
   * @returns {Promise<Object>} - Result of email operations
   */
  async sendVendorWelcomeEmails(vendor, consultant, temporaryPassword) {
    const results = [];

    try {
      // Email to vendor with login credentials
      const vendorEmailParams = {
        email_type: 'vendor_welcome',
        to_email: vendor.email,
        to_name: vendor.name,
        vendor_name: vendor.name,
        vendor_email: vendor.email,
        vendor_password: temporaryPassword,
        company_name: vendor.company || 'N/A',
        consultant_name: consultant ? consultant.name : 'Not assigned',
        consultant_email: consultant ? consultant.email : 'N/A',
        login_url: process.env.CLIENT_URL || 'http://localhost:3000/login',
        subject: 'Welcome to Vendor Management System - Your Account Details'
      };

      const vendorResult = await this.sendEmail(vendorEmailParams);
      results.push({
        recipient: 'vendor',
        email: vendor.email,
        ...vendorResult
      });

      // Email to consultant about new vendor assignment
      if (consultant) {
        const consultantEmailParams = {
          email_type: 'consultant_vendor_assignment',
          to_email: consultant.email,
          to_name: consultant.name,
          consultant_name: consultant.name,
          vendor_name: vendor.name,
          vendor_email: vendor.email,
          vendor_company: vendor.company || 'N/A',
          vendor_phone: vendor.phone || 'N/A',
          vendor_address: vendor.address || 'N/A',
          assignment_date: new Date().toLocaleDateString(),
          subject: `New Vendor Assignment: ${vendor.name} from ${vendor.company || 'Unknown Company'}`
        };

        const consultantResult = await this.sendEmail(consultantEmailParams);
        results.push({
          recipient: 'consultant',
          email: consultant.email,
          ...consultantResult
        });
      }

      return {
        success: true,
        results: results
      };
    } catch (error) {
      console.error('Error sending vendor welcome emails:', error);
      return {
        success: false,
        error: error.message,
        results: results
      };
    }
  }

  /**
   * Send document upload confirmation emails
   * @param {Object} document - Document object
   * @param {Object} vendor - Vendor who uploaded the document
   * @param {Object} consultant - Assigned consultant
   * @returns {Promise<Object>} - Result of email operations
   */
  async sendDocumentUploadEmails(document, vendor, consultant) {
    const results = [];

    try {
      // Email to vendor confirming successful upload
      const vendorEmailParams = {
        email_type: 'document_upload_confirmation',
        to_email: vendor.email,
        to_name: vendor.name,
        vendor_name: vendor.name,
        document_title: document.title,
        document_type: document.documentType,
        upload_date: new Date(document.createdAt).toLocaleDateString(),
        upload_time: new Date(document.createdAt).toLocaleTimeString(),
        document_id: document._id,
        status: 'Successfully Uploaded',
        next_steps: 'Your document is now pending review by your assigned consultant.',
        subject: `Document Upload Confirmation: ${document.title}`
      };

      const vendorResult = await this.sendEmail(vendorEmailParams);
      results.push({
        recipient: 'vendor',
        email: vendor.email,
        ...vendorResult
      });

      // Email to consultant about new document for review
      if (consultant) {
        const consultantEmailParams = {
          email_type: 'document_review_notification',
          to_email: consultant.email,
          to_name: consultant.name,
          consultant_name: consultant.name,
          vendor_name: vendor.name,
          vendor_company: vendor.company || 'N/A',
          document_title: document.title,
          document_type: document.documentType,
          upload_date: new Date(document.createdAt).toLocaleDateString(),
          upload_time: new Date(document.createdAt).toLocaleTimeString(),
          document_id: document._id,
          review_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/documents/${document._id}`,
          subject: `New Document for Review: ${document.title} from ${vendor.name}`
        };

        const consultantResult = await this.sendEmail(consultantEmailParams);
        results.push({
          recipient: 'consultant',
          email: consultant.email,
          ...consultantResult
        });
      }

      return {
        success: true,
        results: results
      };
    } catch (error) {
      console.error('Error sending document upload emails:', error);
      return {
        success: false,
        error: error.message,
        results: results
      };
    }
  }

  /**
   * Send document review status emails
   * @param {Object} document - Document object
   * @param {Object} vendor - Vendor who owns the document
   * @param {Object} consultant - Consultant who reviewed the document
   * @param {string} newStatus - New status of the document (approved/rejected)
   * @param {string} reviewComments - Optional comments from the consultant
   * @returns {Promise<Object>} - Result of email operations
   */
  async sendDocumentReviewEmails(document, vendor, consultant, newStatus, reviewComments = '') {
    const results = [];

    try {
      // Determine email content based on status
      const isApproved = newStatus === 'approved';
      const statusText = isApproved ? 'Approved' : 'Rejected';
      const statusColor = isApproved ? 'green' : 'red';
      
      // Email to vendor about document review result
      const vendorEmailParams = {
        email_type: 'document_review_result',
        to_email: vendor.email,
        to_name: vendor.name,
        vendor_name: vendor.name,
        document_title: document.title,
        document_type: document.documentType,
        status: statusText,
        status_color: statusColor,
        consultant_name: consultant.name,
        review_date: new Date().toLocaleDateString(),
        review_time: new Date().toLocaleTimeString(),
        review_comments: reviewComments || (isApproved ? 'No additional comments provided.' : 'Please review and resubmit your document.'),
        next_steps: isApproved 
          ? 'Your document has been successfully approved and is now part of your compliance record.' 
          : 'Please review the feedback and resubmit your document with the necessary corrections.',
        document_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/documents/${document._id}`,
        subject: `Document ${statusText}: ${document.title}`
      };

      const vendorResult = await this.sendEmail(vendorEmailParams);
      results.push({
        recipient: 'vendor',
        email: vendor.email,
        ...vendorResult
      });

      return {
        success: true,
        results: results
      };
    } catch (error) {
      console.error('Error sending document review emails:', error);
      return {
        success: false,
        error: error.message,
        results: results
      };
    }
  }

  /**
   * Send custom notification email
   * @param {string} recipientEmail - Email address of recipient
   * @param {string} recipientName - Name of recipient
   * @param {string} subject - Email subject
   * @param {string} message - Email message
   * @param {Object} additionalParams - Additional template parameters
   * @returns {Promise<Object>} - Result of email operation
   */
  async sendCustomEmail(recipientEmail, recipientName, subject, message, additionalParams = {}) {
    try {
      const templateParams = {
        email_type: 'custom_notification',
        to_email: recipientEmail,
        to_name: recipientName,
        subject: subject,
        message: message,
        sent_date: new Date().toLocaleDateString(),
        sent_time: new Date().toLocaleTimeString(),
        ...additionalParams
      };

      const result = await this.sendEmail(templateParams);
      return {
        success: true,
        recipient: recipientEmail,
        ...result
      };
    } catch (error) {
      console.error('Error sending custom email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send password reset notification email
   * @param {Object} user - User object whose password was reset
   * @param {string} newPassword - New temporary password
   * @returns {Promise<Object>} - Result of email operation
   */
  async sendPasswordResetNotification(user, newPassword) {
    try {
      console.log('Sending password reset notification email...');
      
      // Create a login link for the user
      const loginUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const loginLink = `${loginUrl}/login`;
      
      const templateParams = {
        // Required EmailJS fields
        to_email: user.email,
        to_name: user.name,
        
        // Template-specific variables for password reset template
        email: user.email,
        user_password: newPassword,
        login_url: loginLink,
        
        // Optional user information
        user_name: user.name,
        user_role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
        company_name: user.company || 'IMTMA Vendor Management System',
        reset_date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      };

      // Use the specific password reset template
      const passwordResetTemplateId = 'template_7ngbgsh';
      const emailResult = await this.sendEmailWithTemplate(templateParams, passwordResetTemplateId);
      
      if (emailResult.success) {
        console.log('✅ Password reset notification sent successfully');
        return {
          success: true,
          recipient: user.email,
          userRole: user.role,
          message: 'Password reset notification sent successfully',
          method: 'EmailJS'
        };
      } else {
        console.log('❌ EmailJS failed for password reset notification, trying backup SMTP...');
        
        // Try backup SMTP service
        const nodemailerResult = await nodemailerService.sendPasswordResetNotification(user, newPassword);
        
        if (nodemailerResult && nodemailerResult.success) {
          console.log('✅ Password reset notification sent via SMTP backup');
          return {
            success: true,
            recipient: user.email,
            userRole: user.role,
            message: 'Password reset notification sent via SMTP backup',
            method: 'SMTP'
          };
        } else {
          console.log('❌ Both EmailJS and SMTP failed for password reset notification');
          return {
            success: false,
            recipient: user.email,
            userRole: user.role,
            message: 'Failed to send password reset notification',
            emailJSError: emailResult.error,
            smtpError: nodemailerResult ? nodemailerResult.error : 'SMTP service unavailable'
          };
        }
      }
    } catch (error) {
      console.error('Error sending password reset notification:', error);
      return {
        success: false,
        recipient: user.email,
        userRole: user.role,
        error: error.message
      };
    }
  }

  /**
   * Send bulk reminder emails to vendors with pending documents
   * @param {Array} vendorReminders - Array of vendor reminder objects
   * @returns {Promise<Object>} - Result of bulk email operations
   */
  async sendBulkVendorReminders(vendorReminders) {
    const results = [];

    try {
      for (const reminder of vendorReminders) {
        const { vendor, pendingDocuments } = reminder;
        
        const emailParams = {
          email_type: 'vendor_reminder',
          to_email: vendor.email,
          to_name: vendor.name,
          vendor_name: vendor.name,
          pending_count: pendingDocuments.length,
          pending_documents: pendingDocuments.map(doc => ({
            title: doc.title,
            type: doc.documentType,
            status: doc.status,
            days_pending: Math.floor((new Date() - new Date(doc.updatedAt)) / (1000 * 60 * 60 * 24))
          })),
          reminder_date: new Date().toLocaleDateString(),
          dashboard_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`,
          subject: `Reminder: ${pendingDocuments.length} Pending Document(s) Require Your Attention`
        };

        const result = await this.sendEmail(emailParams);
        results.push({
          recipient: 'vendor',
          email: vendor.email,
          vendorName: vendor.name,
          pendingCount: pendingDocuments.length,
          ...result
        });
      }

      return {
        success: true,
        totalSent: results.filter(r => r.success).length,
        totalFailed: results.filter(r => !r.success).length,
        results: results
      };
    } catch (error) {
      console.error('Error sending bulk vendor reminders:', error);
      return {
        success: false,
        error: error.message,
        results: results
      };
    }
  }
}

module.exports = new EmailService();