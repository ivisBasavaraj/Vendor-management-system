const express = require('express');
const router = express.Router();
const ComplianceReport = require('../models/complianceReport.model');
const User = require('../models/user.model');
const Document = require('../models/document.model');
const DocumentSubmission = require('../models/documentSubmission.model');
const { protect } = require('../middlewares/auth.middleware');
const { ObjectId } = require('mongoose').Types;
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/compliance-reports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
    }
  }
});

// Get compliance reports for a specific vendor
router.get('/vendor/:vendorId', protect, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 10, year, month } = req.query;

    // Build query
    const query = { vendorId: new ObjectId(vendorId) };
    if (year) query.year = parseInt(year);
    if (month) query.month = month;

    // Get compliance reports with pagination
    const skip = (page - 1) * limit;
    const reports = await ComplianceReport.find(query)
      .populate('vendorId', 'name email company')
      .populate('auditorId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalReports = await ComplianceReport.countDocuments(query);

    res.json({
      success: true,
      data: reports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReports / limit),
        totalItems: totalReports,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching compliance reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch compliance reports',
      error: error.message
    });
  }
});

// Get all compliance reports (for admin/consultant)
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, year, month, vendorId, auditorId } = req.query;

    // Build query
    const query = {};
    if (year) query.year = parseInt(year);
    if (month) query.month = month;
    if (vendorId) query.vendorId = new ObjectId(vendorId);
    if (auditorId) query.auditorId = new ObjectId(auditorId);

    // Get compliance reports with pagination, excluding deactivated vendors
    const skip = (page - 1) * limit;
    const allReports = await ComplianceReport.find(query)
      .populate({
        path: 'vendorId',
        select: 'name email company address workLocation isActive',
        match: { isActive: { $ne: false } }
      })
      .populate('auditorId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter out reports where vendor is null (deactivated users)
    const reports = allReports.filter(report => report.vendorId !== null);

    // Get total count of reports from active vendors only
    const activeVendorReports = await ComplianceReport.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'vendorId',
          foreignField: '_id',
          as: 'vendorInfo'
        }
      },
      {
        $match: {
          'vendorInfo.isActive': { $ne: false }
        }
      },
      { $count: 'total' }
    ]);
    
    const totalReports = activeVendorReports.length > 0 ? activeVendorReports[0].total : 0;

    res.json({
      success: true,
      data: reports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReports / limit),
        totalItems: totalReports,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching compliance reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch compliance reports',
      error: error.message
    });
  }
});

// Get a specific compliance report by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const report = await ComplianceReport.findById(id)
      .populate('vendorId', 'name email company address workLocation agreementPeriod')
      .populate('auditorId', 'name email')
      .populate('documentHistory.documentId', 'title documentType status');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Compliance report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching compliance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch compliance report',
      error: error.message
    });
  }
});

// Create a new compliance report
router.post('/', protect, async (req, res) => {
  try {
    const { vendorId, month, year, auditReview, remarks } = req.body;
    const auditorId = req.user.id;
    const auditorName = req.user.name;

    // Check if report already exists for this vendor, month, and year
    const existingReport = await ComplianceReport.findOne({
      vendorId: new ObjectId(vendorId),
      month,
      year: parseInt(year)
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'Compliance report already exists for this vendor, month, and year'
      });
    }

    // Fetch vendor details
    const vendor = await User.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Fetch document history for the vendor
    const documentHistory = await fetchVendorDocumentHistory(vendorId, year, month);
    
    // Create audit trail entry
    const auditTrail = [{
      action: 'COMPLIANCE_REPORT_CREATED',
      performedBy: auditorId,
      performedByName: auditorName,
      timestamp: new Date(),
      details: `Compliance report created for ${month} ${year}`
    }];

    // Create compliance report
    const complianceReport = new ComplianceReport({
      vendorId: new ObjectId(vendorId),
      month,
      year: parseInt(year),
      auditReview,
      remarks,
      auditorName,
      auditorId,
      documentHistory,
      auditTrail,
      status: 'completed'
    });

    await complianceReport.save();

    // Populate the created report before sending response
    const populatedReport = await ComplianceReport.findById(complianceReport._id)
      .populate('vendorId', 'name email company address workLocation')
      .populate('auditorId', 'name email');

    res.status(201).json({
      success: true,
      data: populatedReport,
      message: 'Compliance report created successfully'
    });
  } catch (error) {
    console.error('Error creating compliance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create compliance report',
      error: error.message
    });
  }
});

// Update a compliance report
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { auditReview, remarks, status } = req.body;
    const auditorId = req.user.id;
    const auditorName = req.user.name;

    const report = await ComplianceReport.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Compliance report not found'
      });
    }

    // Update fields
    if (auditReview) report.auditReview = auditReview;
    if (remarks !== undefined) report.remarks = remarks;
    if (status) report.status = status;

    // Add audit trail entry
    report.auditTrail.push({
      action: 'COMPLIANCE_REPORT_UPDATED',
      performedBy: auditorId,
      performedByName: auditorName,
      timestamp: new Date(),
      details: 'Compliance report updated'
    });

    await report.save();

    // Populate the updated report
    const populatedReport = await ComplianceReport.findById(id)
      .populate('vendorId', 'name email company address workLocation')
      .populate('auditorId', 'name email');

    res.json({
      success: true,
      data: populatedReport,
      message: 'Compliance report updated successfully'
    });
  } catch (error) {
    console.error('Error updating compliance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update compliance report',
      error: error.message
    });
  }
});

// Delete a compliance report
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const auditorId = req.user.id;
    const auditorName = req.user.name;

    const report = await ComplianceReport.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Compliance report not found'
      });
    }

    // Add audit trail entry before deletion
    report.auditTrail.push({
      action: 'COMPLIANCE_REPORT_DELETED',
      performedBy: auditorId,
      performedByName: auditorName,
      timestamp: new Date(),
      details: 'Compliance report deleted'
    });

    await ComplianceReport.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Compliance report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting compliance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete compliance report',
      error: error.message
    });
  }
});

// Upload attachments to compliance report
router.post('/:id/attachments', protect, upload.fields([
  { name: 'completionReport', maxCount: 1 },
  { name: 'documentVerificationReport', maxCount: 1 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const auditorId = req.user.id;
    const auditorName = req.user.name;

    const report = await ComplianceReport.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Compliance report not found'
      });
    }

    const attachments = [];
    
    // Process completion report
    if (req.files && req.files.completionReport) {
      const file = req.files.completionReport[0];
      attachments.push({
        fileName: `Completion_Report_${file.originalname}`,
        filePath: file.path,
        fileSize: file.size,
        fileType: 'Completion Report',
        uploadDate: new Date()
      });
    }

    // Process document verification report
    if (req.files && req.files.documentVerificationReport) {
      const file = req.files.documentVerificationReport[0];
      attachments.push({
        fileName: `Document_Verification_Report_${file.originalname}`,
        filePath: file.path,
        fileSize: file.size,
        fileType: 'Document Verification Report',
        uploadDate: new Date()
      });
    }

    if (attachments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid files uploaded'
      });
    }

    // Add attachments to the report
    report.attachments.push(...attachments);

    // Add audit trail entry
    report.auditTrail.push({
      action: 'ATTACHMENTS_UPLOADED',
      performedBy: auditorId,
      performedByName: auditorName,
      timestamp: new Date(),
      details: `Uploaded ${attachments.length} attachment(s): ${attachments.map(a => a.fileType).join(', ')}`
    });

    await report.save();

    // Populate the updated report
    const populatedReport = await ComplianceReport.findById(id)
      .populate('vendorId', 'name email company address workLocation')
      .populate('auditorId', 'name email');

    res.json({
      success: true,
      data: populatedReport,
      message: 'Attachments uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading attachments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload attachments',
      error: error.message
    });
  }
});

// Download compliance report attachment
router.get('/:reportId/attachments/:attachmentId/download', protect, async (req, res) => {
  try {
    const { reportId, attachmentId } = req.params;

    const report = await ComplianceReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Compliance report not found'
      });
    }

    const attachment = report.attachments.find(att => att._id.toString() === attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    // Check if file exists
    if (!fs.existsSync(attachment.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Stream the file
    const fileStream = fs.createReadStream(attachment.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download attachment',
      error: error.message
    });
  }
});

// View compliance report attachment
router.get('/:reportId/attachments/:attachmentId/view', protect, async (req, res) => {
  try {
    const { reportId, attachmentId } = req.params;

    const report = await ComplianceReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Compliance report not found'
      });
    }

    const attachment = report.attachments.find(att => att._id.toString() === attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    // Check if file exists
    if (!fs.existsSync(attachment.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Determine content type based on file extension
    const ext = path.extname(attachment.fileName).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.doc':
        contentType = 'application/msword';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
    }

    // Set appropriate headers for viewing
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${attachment.fileName}"`);

    // Stream the file
    const fileStream = fs.createReadStream(attachment.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error viewing attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to view attachment',
      error: error.message
    });
  }
});

// Helper function to fetch vendor document history
async function fetchVendorDocumentHistory(vendorId, year, month) {
  try {
    const documentHistory = [];

    // Normalize month to short enum if provided (Jan, Feb, ...)
    let normalizedMonth = null;
    let periodStartDate = null;
    let periodEndDate = null;
    if (year && month) {
      const monthMap = {
        'january': 'Jan', 'jan': 'Jan', '1': 'Jan', '01': 'Jan',
        'february': 'Feb', 'feb': 'Feb', '2': 'Feb', '02': 'Feb',
        'march': 'Mar', 'mar': 'Mar', '3': 'Mar', '03': 'Mar',
        'april': 'Apr', 'apr': 'Apr', '4': 'Apr', '04': 'Apr',
        'may': 'May', '5': 'May', '05': 'May',
        'june': 'Jun', 'jun': 'Jun', '6': 'Jun', '06': 'Jun',
        'july': 'Jul', 'jul': 'Jul', '7': 'Jul', '07': 'Jul',
        'august': 'Aug', 'aug': 'Aug', '8': 'Aug', '08': 'Aug',
        'september': 'Sep', 'sep': 'Sep', '9': 'Sep', '09': 'Sep',
        'october': 'Oct', 'oct': 'Oct', '10': 'Oct',
        'november': 'Nov', 'nov': 'Nov', '11': 'Nov',
        'december': 'Dec', 'dec': 'Dec', '12': 'Dec'
      };
      const monthKey = String(month).toLowerCase();
      normalizedMonth = monthMap[monthKey] || month;

      // Compute period date range for legacy Document filtering
      const monthIndex = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      }[normalizedMonth];
      if (monthIndex !== undefined) {
        const y = parseInt(year);
        periodStartDate = new Date(Date.UTC(y, monthIndex, 1, 0, 0, 0));
        periodEndDate = new Date(Date.UTC(y, monthIndex + 1, 1, 0, 0, 0));
      }
    }

    // Query legacy Document collection (uses vendor and submissionDate)
    const legacyQuery = { vendor: new ObjectId(vendorId) };
    if (periodStartDate && periodEndDate) {
      legacyQuery.submissionDate = { $gte: periodStartDate, $lt: periodEndDate };
    }
    const documents = await Document.find(legacyQuery)
      .sort({ createdAt: -1 })
      .limit(100);

    documents.forEach(doc => {
      documentHistory.push({
        documentId: doc._id,
        documentName: doc.title || doc.name,
        documentType: doc.documentType || 'Unknown',
        status: doc.status,
        submissionDate: doc.submissionDate || doc.createdAt,
        reviewDate: doc.reviewDate || doc.updatedAt,
        reviewNotes: doc.reviewNotes || ''
      });
    });

    // Query DocumentSubmission collection (uses vendor ObjectId and uploadPeriod)
    const submissionQuery = { vendor: new ObjectId(vendorId) };
    if (year) submissionQuery['uploadPeriod.year'] = parseInt(year);
    if (normalizedMonth) submissionQuery['uploadPeriod.month'] = normalizedMonth;

    const submissions = await DocumentSubmission.find(submissionQuery)
      .sort({ createdAt: -1 })
      .limit(100);

    submissions.forEach(submission => {
      if (submission.documents && submission.documents.length > 0) {
        submission.documents.forEach(doc => {
          documentHistory.push({
            documentId: doc._id,
            documentName: doc.documentName,
            documentType: doc.documentType,
            status: doc.status,
            submissionDate: submission.createdAt,
            reviewDate: doc.reviewDate || submission.updatedAt,
            reviewNotes: doc.reviewNotes || ''
          });
        });
      }
    });

    return documentHistory;
  } catch (error) {
    console.error('Error fetching document history:', error);
    return [];
  }
}

module.exports = router;