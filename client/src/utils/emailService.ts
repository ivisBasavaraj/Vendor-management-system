import emailjs from '@emailjs/browser';
import emailjsConfig, { debugEmailjsConfig } from '../config/emailjs.config';

/**
 * Client-side EmailJS Service for sending role-based emails
 * This service initializes EmailJS and provides methods for sending emails
 */

interface EmailConfig {
  serviceId: string;
  templateId: string;
  userId: string;
}

interface VendorWelcomeEmailParams {
  to_email: string;
  to_name: string;
  vendor_name: string;
  vendor_email: string;
  vendor_password: string;
  company_name: string;
  consultant_name: string;
  consultant_email: string;
  login_url: string;
  subject: string;
}

interface DocumentUploadEmailParams {
  to_email: string;
  to_name: string;
  vendor_name: string;
  document_title: string;
  document_type: string;
  upload_date: string;
  upload_time: string;
  document_id: string;
  status: string;
  subject: string;
}

interface DocumentReviewEmailParams {
  to_email: string;
  to_name: string;
  vendor_name: string;
  document_title: string;
  document_type: string;
  status: string;
  status_color: string;
  consultant_name: string;
  review_date: string;
  review_time: string;
  review_comments: string;
  next_steps: string;
  document_url: string;
  subject: string;
}

class ClientEmailService {
  private config: EmailConfig;
  private isInitialized: boolean = false;

  constructor() {
    this.config = emailjsConfig;

    // Debug logging
    debugEmailjsConfig();
  }

  /**
   * Initialize EmailJS with user ID
   * This should be called once when the app starts
   */
  init(): void {
    if (!this.config.userId) {
      console.error('EmailJS User ID is not configured. Please set REACT_APP_EMAILJS_USER_ID in your environment variables.');
      return;
    }

    try {
      emailjs.init(this.config.userId);
      this.isInitialized = true;
      console.log('EmailJS initialized successfully');
    } catch (error) {
      console.error('Failed to initialize EmailJS:', error);
    }
  }

  /**
   * Check if EmailJS is properly initialized
   */
  isReady(): boolean {
    return this.isInitialized && !!this.config.userId;
  }

  /**
   * Send email using EmailJS
   * @param templateParams - Email template parameters
   * @returns Promise with result
   */
  private async sendEmail(templateParams: any): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!this.isReady()) {
      return {
        success: false,
        error: 'EmailJS is not initialized. Please call init() first.'
      };
    }

    try {
      const result = await emailjs.send(
        this.config.serviceId,
        this.config.templateId,
        templateParams
      );

      console.log('Email sent successfully:', result);
      return {
        success: true,
        message: 'Email sent successfully'
      };
    } catch (error: any) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email'
      };
    }
  }

  /**
   * Send welcome email to new vendor
   */
  async sendVendorWelcomeEmail(params: VendorWelcomeEmailParams) {
    const templateParams = {
      email_type: 'vendor_welcome',
      ...params
    };

    return await this.sendEmail(templateParams);
  }

  /**
   * Send notification email to consultant about new vendor assignment
   */
  async sendConsultantVendorAssignmentEmail(params: {
    to_email: string;
    to_name: string;
    consultant_name: string;
    vendor_name: string;
    vendor_email: string;
    vendor_company: string;
    vendor_phone: string;
    vendor_address: string;
    assignment_date: string;
    subject: string;
  }) {
    const templateParams = {
      email_type: 'consultant_vendor_assignment',
      ...params
    };

    return await this.sendEmail(templateParams);
  }

  /**
   * Send document upload confirmation email to vendor
   */
  async sendDocumentUploadConfirmationEmail(params: DocumentUploadEmailParams) {
    const templateParams = {
      email_type: 'document_upload_confirmation',
      ...params,
      next_steps: 'Your document is now pending review by your assigned consultant.'
    };

    return await this.sendEmail(templateParams);
  }

  /**
   * Send document review notification email to consultant
   */
  async sendDocumentReviewNotificationEmail(params: {
    to_email: string;
    to_name: string;
    consultant_name: string;
    vendor_name: string;
    vendor_company: string;
    document_title: string;
    document_type: string;
    upload_date: string;
    upload_time: string;
    document_id: string;
    review_url: string;
    subject: string;
  }) {
    const templateParams = {
      email_type: 'document_review_notification',
      ...params
    };

    return await this.sendEmail(templateParams);
  }

  /**
   * Send document review result email to vendor
   */
  async sendDocumentReviewResultEmail(params: DocumentReviewEmailParams) {
    const templateParams = {
      email_type: 'document_review_result',
      ...params
    };

    return await this.sendEmail(templateParams);
  }

  /**
   * Send vendor reminder email
   */
  async sendVendorReminderEmail(params: {
    to_email: string;
    to_name: string;
    vendor_name: string;
    pending_count: number;
    pending_documents: Array<{
      title: string;
      type: string;
      status: string;
      days_pending: number;
    }>;
    reminder_date: string;
    dashboard_url: string;
    subject: string;
  }) {
    const templateParams = {
      email_type: 'vendor_reminder',
      ...params
    };

    return await this.sendEmail(templateParams);
  }

  /**
   * Send custom notification email
   */
  async sendCustomEmail(params: {
    to_email: string;
    to_name: string;
    subject: string;
    message: string;
    [key: string]: any;
  }) {
    const templateParams = {
      email_type: 'custom_notification',
      sent_date: new Date().toLocaleDateString(),
      sent_time: new Date().toLocaleTimeString(),
      ...params
    };

    return await this.sendEmail(templateParams);
  }

  /**
   * Test email configuration
   */
  async testConfiguration(): Promise<{ success: boolean; message: string; error?: string }> {
    if (!this.isReady()) {
      return {
        success: false,
        message: 'EmailJS is not initialized',
        error: 'Please check your configuration and call init() first'
      };
    }

    try {
      // Send a test email
      const testParams = {
        email_type: 'test',
        to_email: 'test@example.com',
        to_name: 'Test User',
        subject: 'EmailJS Configuration Test',
        message: 'This is a test email to verify EmailJS configuration.',
        sent_date: new Date().toLocaleDateString(),
        sent_time: new Date().toLocaleTimeString()
      };

      const result = await this.sendEmail(testParams);
      
      return {
        success: result.success,
        message: result.success ? 'EmailJS configuration is working correctly' : 'EmailJS configuration test failed',
        error: result.error
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to test EmailJS configuration',
        error: error.message
      };
    }
  }
}

// Create singleton instance
const clientEmailService = new ClientEmailService();

export default clientEmailService;
export type { 
  VendorWelcomeEmailParams, 
  DocumentUploadEmailParams, 
  DocumentReviewEmailParams 
};