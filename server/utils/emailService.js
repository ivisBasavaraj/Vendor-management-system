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
  async sendEmail(to, templateId, templateParams) {
    try {
      // Check if EmailJS is properly initialized
      if (!this.publicKey || !this.privateKey) {
        return {
          success: false,
          error: 'EmailJS credentials not properly configured. Please check EMAILJS_PUBLIC_KEY and EMAILJS_PRIVATE_KEY environment variables.'
        };
      }

      console.log('📤 Sending email via EmailJS Node.js SDK...');
      console.log('📤 [emailService.sendEmail] Sending email via EmailJS Node.js SDK...');
      console.log('📋 [emailService.sendEmail] Service ID:', this.serviceId);
      console.log('📋 [emailService.sendEmail] Template ID:', templateId);
      console.log('📋 [emailService.sendEmail] Recipient:', to);
      console.log('📋 [emailService.sendEmail] Template Params:', JSON.stringify(templateParams, null, 2));

      // Send email using the official EmailJS Node.js SDK
      const response = await emailjs.send(
        this.serviceId,
        templateId,
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

  /**
   * Send document submission notification to consultant
   * @param {Object} submission - Document submission object
   * @param {Object} vendor - Vendor who submitted the documents
   * @param {Object} consultant - Assigned consultant
   * @returns {Promise<Object>} - Result of email operation
   */
  async sendDocumentSubmissionNotification(submission, vendor, consultant) {
    try {
      console.log('Sending document submission notification to consultant...');
      
      // Format document types for email
      const documentTypes = submission.documents.map(doc => {
        // Convert document type to readable format
        const readableType = doc.documentType
          .replace(/_/g, ' ')
          .toLowerCase()
          .replace(/\b\w/g, l => l.toUpperCase());
        
        return {
          type: readableType,
          name: doc.documentName,
          status: doc.status
        };
      });

      // Create document list string for email
      const documentList = documentTypes.map(doc => `• ${doc.type} (${doc.name})`).join('\n');
      
      // Format agreement period
      const agreementPeriod = submission.agreementPeriod 
        ? `${new Date(submission.agreementPeriod.startDate).toLocaleDateString()} - ${new Date(submission.agreementPeriod.endDate).toLocaleDateString()}`
        : vendor.agreementPeriod || 'Annual Contract';

      const templateParams = {
        // Multiple recipient formats for EmailJS compatibility
        to_email: consultant.email,
        to_name: consultant.name,
        email: consultant.email,
        recipient_email: consultant.email,
        recipient_name: consultant.name,
        
        // Consultant information
        consultant_name: consultant.name,
        
        // Vendor information
        vendor_name: vendor.name,
        vendor_company: vendor.company || 'N/A',
        vendor_email: vendor.email,
        vendor_phone: vendor.phone || 'N/A',
        
        // Submission details
        submission_id: submission.submissionId,
        submission_date: new Date(submission.submissionDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        submission_time: new Date(submission.submissionDate).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        
        // Agreement and work details
        agreement_period: agreementPeriod,
        work_location: submission.workLocation || vendor.workLocation || 'IMTMA, Bengaluru',
        invoice_no: submission.invoiceNo || 'N/A',
        
        // Document information
        document_count: submission.documents.length,
        document_types: documentList,
        document_list: documentTypes.map(doc => doc.type).join(', '),
        
        // Upload period
        upload_period: `${submission.uploadPeriod.month} ${submission.uploadPeriod.year}`,
        
        // System URLs
        review_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/consultant/submissions/${submission._id}`,
        dashboard_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/consultant/dashboard`,
        
        // Email metadata
        subject: `New Document Submission: ${vendor.name} - ${submission.uploadPeriod.month} ${submission.uploadPeriod.year}`,
        email_type: 'document_submission_notification'
      };

      // Use the specific template ID for document submission notifications
      const documentSubmissionTemplateId = 'template_ojv7u88';
      const emailResult = await this.sendEmailWithTemplate(templateParams, documentSubmissionTemplateId);
      
      if (emailResult.success) {
        console.log('✅ Document submission notification sent successfully');
        return {
          success: true,
          recipient: consultant.email,
          vendorName: vendor.name,
          submissionId: submission.submissionId,
          message: 'Document submission notification sent successfully',
          method: 'EmailJS'
        };
      } else {
        console.log('❌ EmailJS failed for document submission notification, trying backup SMTP...');
        
        // Try backup SMTP service if available
        try {
          const nodemailerResult = await nodemailerService.sendCustomEmail(
            consultant.email,
            consultant.name,
            templateParams.subject,
            `New document submission from ${vendor.name} (${vendor.company}) for ${submission.uploadPeriod.month} ${submission.uploadPeriod.year}.\n\nDocuments submitted:\n${documentList}\n\nPlease review at: ${templateParams.review_url}`,
            templateParams
          );
          
          if (nodemailerResult && nodemailerResult.success) {
            console.log('✅ Document submission notification sent via SMTP backup');
            return {
              success: true,
              recipient: consultant.email,
              vendorName: vendor.name,
              submissionId: submission.submissionId,
              message: 'Document submission notification sent via SMTP backup',
              method: 'SMTP'
            };
          }
        } catch (smtpError) {
          console.log('❌ SMTP backup also failed:', smtpError.message);
        }
        
        console.log('❌ Both EmailJS and SMTP failed for document submission notification');
        return {
          success: false,
          recipient: consultant.email,
          vendorName: vendor.name,
          submissionId: submission.submissionId,
          message: 'Failed to send document submission notification',
          emailJSError: emailResult.error,
          method: 'Failed'
        };
      }
    } catch (error) {
      console.error('Error sending document submission notification:', error);
      return {
        success: false,
        recipient: consultant ? consultant.email : 'unknown',
        vendorName: vendor ? vendor.name : 'unknown',
        submissionId: submission ? submission.submissionId : 'unknown',
        error: error.message
      };
    }
  }

  /**
   * Send document rejection notification to vendor
   * @param {Object} document - Document object with rejection details
   * @param {Object} vendor - Vendor object
   * @param {Object} consultant - Consultant object who rejected the document
   * @returns {Object} - Result object with success status and details
   */
  async sendDocumentRejectionNotification(document, vendor, consultant) {
    try {
      console.log('Sending document rejection notification to vendor...');
      
      // Format document type for display
      const formatDocumentType = (type) => {
        if (!type) return 'Document';
        
        const typeMap = {
          'INVOICE': 'Invoice',
          'FORM_T_MUSTER_ROLL': 'Form T Muster Roll',
          'BANK_STATEMENT': 'Bank Statement',
          'ECR': 'ECR (Employee Contribution Record)',
          'PF_COMBINED_CHALLAN': 'PF Combined Challan',
          'ESI_CHALLAN': 'ESI Challan',
          'SALARY_REGISTER': 'Salary Register',
          'ATTENDANCE_REGISTER': 'Attendance Register',
          'COMPLIANCE_CERTIFICATE': 'Compliance Certificate',
          'OTHER': 'Other Document'
        };
        
        return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      };

      // Format rejection date and time
      const rejectionDate = new Date(document.reviewDate || Date.now());
      const formattedDate = rejectionDate.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = rejectionDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      // Generate URLs
      const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const documentUrl = `${baseUrl}/vendor/documents`;
      const uploadUrl = `${baseUrl}/vendor/upload`;
      const dashboardUrl = `${baseUrl}/vendor/dashboard`;

      const templateParams = {
        // Multiple recipient formats for EmailJS compatibility
        to_email: vendor.email,
        to_name: vendor.name,
        email: vendor.email,
        recipient_email: vendor.email,
        recipient_name: vendor.name,
        
        // Vendor information
        vendor_name: vendor.name,
        vendor_email: vendor.email,
        vendor_company: vendor.company || vendor.companyName || 'N/A',
        
        // Consultant information
        consultant_name: consultant.name,
        consultant_email: consultant.email,
        reviewer_name: consultant.name,
        reviewer_email: consultant.email,
        
        // Document information
        document_title: document.documentName || document.title || 'Document',
        document_type: formatDocumentType(document.documentType),
        document_type_raw: document.documentType,
        document_id: document._id || document.id,
        document_name: document.documentName || document.title || 'Document',
        
        // Rejection details
        rejection_date: formattedDate,
        rejection_time: formattedTime,
        rejection_reason: document.reviewComments || document.comments || 'No specific reason provided',
        review_comments: document.reviewComments || document.comments || 'No specific reason provided',
        
        // Status information
        status: 'Rejected',
        status_color: 'rejected',
        previous_status: document.previousStatus || 'Pending Review',
        
        // Action URLs
        document_url: documentUrl,
        upload_url: uploadUrl,
        dashboard_url: dashboardUrl,
        resubmit_url: uploadUrl,
        
        // Email metadata
        subject: `Document Rejected - ${formatDocumentType(document.documentType)} - Action Required`,
        email_type: 'document_rejection_notification',
        
        // Additional context
        submission_period: document.uploadPeriod ? `${document.uploadPeriod.month} ${document.uploadPeriod.year}` : 'N/A',
        submission_month: document.uploadPeriod ? document.uploadPeriod.month : 'N/A',
        submission_year: document.uploadPeriod ? document.uploadPeriod.year : 'N/A',
        work_location: vendor.workLocation || 'IMTMA, Bengaluru',
        
        // Next steps
        next_steps: 'Please review the rejection comments, make necessary corrections, and resubmit the document.',
        
        // Timestamps
        sent_date: new Date().toLocaleDateString('en-IN'),
        sent_time: new Date().toLocaleTimeString('en-IN', { hour12: true })
      };

      console.log('📤 Sending email via EmailJS Node.js SDK...');
      console.log('📋 Service ID:', process.env.EMAILJS_SERVICE_ID);
      console.log('📋 Template ID: template_7ngbgsh');
      console.log('📋 Recipient:', vendor.email);

      // Use specific template ID for rejection emails
      const templateId = 'template_7ngbgsh';

      const response = await emailjs.send(
        process.env.EMAILJS_SERVICE_ID,
        templateId,
        templateParams,
        {
          publicKey: process.env.EMAILJS_PUBLIC_KEY,
          privateKey: process.env.EMAILJS_PRIVATE_KEY,
        }
      );

      console.log('✅ Email sent successfully via EmailJS SDK');
      console.log('📧 Response:', response);

      return {
        success: true,
        method: 'EmailJS',
        recipient: vendor.email,
        vendorName: vendor.name,
        documentType: formatDocumentType(document.documentType),
        consultantName: consultant.name,
        message: 'Document rejection notification sent successfully',
        emailJSResponse: response
      };

    } catch (emailJSError) {
      console.log('❌ Error sending email via EmailJS SDK:', emailJSError);
      
      // Try SMTP backup if available
      if (this.nodemailerService && typeof this.nodemailerService.sendCustomEmail === 'function') {
        console.log('❌ EmailJS failed for document rejection notification, trying backup SMTP...');
        
        try {
          const emailContent = this.generateDocumentRejectionEmailContent(document, vendor, consultant);
          
          const smtpResult = await this.nodemailerService.sendCustomEmail(
            vendor.email,
            `Document Rejected - ${formatDocumentType(document.documentType)} - Action Required`,
            emailContent.text,
            emailContent.html
          );

          if (smtpResult.success) {
            console.log('✅ Document rejection notification sent via SMTP backup');
            return {
              success: true,
              method: 'SMTP',
              recipient: vendor.email,
              vendorName: vendor.name,
              documentType: formatDocumentType(document.documentType),
              consultantName: consultant.name,
              message: 'Document rejection notification sent via SMTP backup'
            };
          }
        } catch (smtpError) {
          console.log('❌ SMTP backup also failed:', smtpError.message);
        }
      }

      console.log('❌ Both EmailJS and SMTP failed for document rejection notification');
      
      return {
        success: false,
        method: 'Failed',
        recipient: vendor.email,
        vendorName: vendor.name,
        documentType: formatDocumentType(document.documentType),
        consultantName: consultant.name,
        error: 'Failed to send document rejection notification',
        emailJSError: `EmailJS SDK error: ${emailJSError.text || emailJSError.message}`
      };
    }
  }

  /**
   * Generate email content for document rejection (SMTP backup)
   */
  generateDocumentRejectionEmailContent(document, vendor, consultant) {
    const formatDocumentType = (type) => {
      const typeMap = {
        'INVOICE': 'Invoice',
        'FORM_T_MUSTER_ROLL': 'Form T Muster Roll',
        'BANK_STATEMENT': 'Bank Statement',
        'ECR': 'ECR (Employee Contribution Record)',
        'PF_COMBINED_CHALLAN': 'PF Combined Challan',
        'ESI_CHALLAN': 'ESI Challan',
        'SALARY_REGISTER': 'Salary Register',
        'ATTENDANCE_REGISTER': 'Attendance Register',
        'COMPLIANCE_CERTIFICATE': 'Compliance Certificate',
        'OTHER': 'Other Document'
      };
      return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const documentType = formatDocumentType(document.documentType);
    const rejectionDate = new Date(document.reviewDate || Date.now()).toLocaleDateString('en-IN');
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    const text = `
Document Rejection Notification - IMTMA Vendor Management System

Dear ${vendor.name},

Your document has been rejected and requires your attention.

Document Details:
- Document Type: ${documentType}
- Document Name: ${document.documentName || 'N/A'}
- Rejection Date: ${rejectionDate}
- Reviewed By: ${consultant.name}

Rejection Reason:
${document.reviewComments || document.comments || 'No specific reason provided'}

Next Steps:
1. Review the rejection comments carefully
2. Make necessary corrections to your document
3. Resubmit the corrected document through the system

You can access your dashboard at: ${baseUrl}/vendor/dashboard

If you have any questions, please contact your assigned consultant: ${consultant.name} (${consultant.email})

Best regards,
IMTMA Vendor Management System
    `;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .rejection-box { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; }
        .button { display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Document Rejection Notification</h2>
            <p>IMTMA Vendor Management System</p>
        </div>
        <div class="content">
            <p>Dear ${vendor.name},</p>
            <p>Your document has been rejected and requires your attention.</p>
            
            <div class="rejection-box">
                <h3>Document Details:</h3>
                <p><strong>Document Type:</strong> ${documentType}</p>
                <p><strong>Document Name:</strong> ${document.documentName || 'N/A'}</p>
                <p><strong>Rejection Date:</strong> ${rejectionDate}</p>
                <p><strong>Reviewed By:</strong> ${consultant.name}</p>
            </div>
            
            <div class="rejection-box">
                <h3>Rejection Reason:</h3>
                <p>${document.reviewComments || document.comments || 'No specific reason provided'}</p>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ol>
                <li>Review the rejection comments carefully</li>
                <li>Make necessary corrections to your document</li>
                <li>Resubmit the corrected document through the system</li>
            </ol>
            
            <p><a href="${baseUrl}/vendor/dashboard" class="button">Go to Dashboard</a></p>
        </div>
        <div class="footer">
            <p>This is an automated notification from IMTMA Vendor Management System.</p>
            <p>If you have questions, contact: ${consultant.name} (${consultant.email})</p>
        </div>
    </div>
</body>
</html>
    `;

    return { text, html };
  }
}

module.exports = new EmailService();