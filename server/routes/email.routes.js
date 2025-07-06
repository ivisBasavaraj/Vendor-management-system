const express = require('express');
const router = express.Router();
const emailService = require('../utils/emailService');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Test email configuration (Admin only)
router.post('/test', protect, authorize('admin'), async (req, res) => {
  try {
    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: 'Test email address is required'
      });
    }

    // Test basic email functionality
    const testResult = await emailService.sendCustomEmail(
      testEmail,
      'Test User',
      'EmailJS Configuration Test',
      'This is a test email to verify EmailJS configuration is working correctly.',
      {
        test_type: 'configuration_test',
        server_time: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }
    );

    res.status(200).json({
      success: true,
      data: {
        emailSent: testResult.success,
        recipient: testEmail,
        result: testResult
      },
      message: testResult.success 
        ? 'Test email sent successfully' 
        : 'Failed to send test email'
    });
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test email configuration',
      error: error.message
    });
  }
});

// Send welcome email to vendor (Admin only)
router.post('/welcome-vendor', protect, authorize('admin'), async (req, res) => {
  try {
    const { vendorId, consultantId, temporaryPassword } = req.body;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor ID is required'
      });
    }

    // Get vendor details
    const User = require('../models/user.model');
    const vendor = await User.findById(vendorId);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Get consultant details if provided
    let consultant = null;
    if (consultantId) {
      consultant = await User.findById(consultantId).select('name email');
    }

    // Send welcome emails
    const emailResults = await emailService.sendVendorWelcomeEmails(
      vendor,
      consultant,
      temporaryPassword || 'temp123456'
    );

    res.status(200).json({
      success: true,
      data: {
        vendor: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email
        },
        consultant: consultant ? {
          id: consultant._id,
          name: consultant.name,
          email: consultant.email
        } : null,
        emailResults
      },
      message: emailResults.success 
        ? 'Welcome emails sent successfully' 
        : 'Failed to send welcome emails'
    });
  } catch (error) {
    console.error('Welcome email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send welcome emails',
      error: error.message
    });
  }
});

// Send document upload notification (Vendor only)
router.post('/document-upload', protect, authorize('vendor'), async (req, res) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required'
      });
    }

    // Get document details
    const DocModel = require('../models/document.model');
    const User = require('../models/user.model');
    
    const document = await DocModel.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Get vendor details
    const vendor = await User.findById(req.user.id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Get assigned consultant
    let consultant = null;
    if (vendor.assignedConsultant) {
      consultant = await User.findById(vendor.assignedConsultant).select('name email');
    } else {
      // Find first available consultant
      consultant = await User.findOne({ role: 'consultant' }).select('name email');
    }

    if (!consultant) {
      return res.status(404).json({
        success: false,
        message: 'No consultant available'
      });
    }

    // Send upload confirmation emails
    const emailResults = await emailService.sendDocumentUploadEmails(
      document,
      vendor,
      consultant
    );

    res.status(200).json({
      success: true,
      data: {
        document: {
          id: document._id,
          title: document.title,
          type: document.documentType
        },
        vendor: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email
        },
        consultant: {
          id: consultant._id,
          name: consultant.name,
          email: consultant.email
        },
        emailResults
      },
      message: emailResults.success 
        ? 'Upload notification emails sent successfully' 
        : 'Failed to send upload notification emails'
    });
  } catch (error) {
    console.error('Document upload email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send document upload notifications',
      error: error.message
    });
  }
});

// Send document review result (Consultant and Admin)
router.post('/document-review', protect, authorize('consultant', 'admin'), async (req, res) => {
  try {
    const { documentId, status, reviewComments } = req.body;

    if (!documentId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Document ID and status are required'
      });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be approved or rejected'
      });
    }

    // Get document and vendor details
    const DocModel = require('../models/document.model');
    const User = require('../models/user.model');
    
    const document = await DocModel.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const vendor = await User.findById(document.vendor).select('name email');
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const consultant = await User.findById(req.user.id).select('name email');

    // Send review result email
    const emailResults = await emailService.sendDocumentReviewEmails(
      document,
      vendor,
      consultant,
      status,
      reviewComments
    );

    res.status(200).json({
      success: true,
      data: {
        document: {
          id: document._id,
          title: document.title,
          type: document.documentType
        },
        vendor: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email
        },
        consultant: {
          id: consultant._id,
          name: consultant.name,
          email: consultant.email
        },
        status,
        reviewComments,
        emailResults
      },
      message: emailResults.success 
        ? 'Review result email sent successfully' 
        : 'Failed to send review result email'
    });
  } catch (error) {
    console.error('Document review email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send document review notification',
      error: error.message
    });
  }
});

// Send bulk vendor reminders (Admin only)
router.post('/vendor-reminders', protect, authorize('admin'), async (req, res) => {
  try {
    const User = require('../models/user.model');
    const Document = require('../models/document.model');

    // Get all active vendors
    const vendors = await User.find({ role: 'vendor', isActive: true });
    
    const reminders = [];
    for (const vendor of vendors) {
      // Find pending documents for each vendor
      const pendingDocs = await Document.find({
        vendor: vendor._id,
        status: { $in: ['pending', 'under_review', 'rejected'] }
      });

      if (pendingDocs.length > 0) {
        reminders.push({
          vendor: vendor,
          pendingDocuments: pendingDocs
        });
      }
    }

    if (reminders.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalVendors: vendors.length,
          remindersNeeded: 0
        },
        message: 'No vendors have pending documents'
      });
    }

    // Send bulk reminders
    const emailResults = await emailService.sendBulkVendorReminders(reminders);

    res.status(200).json({
      success: true,
      data: {
        totalVendors: vendors.length,
        remindersNeeded: reminders.length,
        emailsSent: emailResults.totalSent,
        emailsFailed: emailResults.totalFailed,
        results: emailResults.results
      },
      message: `Sent ${emailResults.totalSent} reminder emails to vendors`
    });
  } catch (error) {
    console.error('Vendor reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send vendor reminders',
      error: error.message
    });
  }
});

// Get email configuration status (Admin only)
router.get('/config', protect, authorize('admin'), async (req, res) => {
  try {
    const emailService = require('../utils/emailService');
    
    res.status(200).json({
      success: true,
      data: {
        serviceId: emailService.serviceId ? '✅ Configured' : '❌ Missing',
        templateId: emailService.templateId ? '✅ Configured' : '❌ Missing',
        userId: emailService.userId ? '✅ Configured' : '❌ Missing',
        baseUrl: emailService.baseUrl,
        isConfigured: !!(emailService.serviceId && emailService.templateId && emailService.userId)
      },
      message: 'Email configuration status retrieved'
    });
  } catch (error) {
    console.error('Email config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email configuration',
      error: error.message
    });
  }
});

module.exports = router;