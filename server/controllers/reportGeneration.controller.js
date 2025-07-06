const ApprovalReport = require('../models/approvalReport.model');
const MISReport = require('../models/misReport.model');
const VendorSubmission = require('../models/vendorSubmission.model');
const User = require('../models/user.model');
const Document = require('../models/document.model');
const Notification = require('../models/notification.model');
const path = require('path');
const fs = require('fs');

// Generate comprehensive approval report
exports.generateApprovalReport = async (req, res) => {
  try {
    const { reportType = 'custom', startDate, endDate, vendorId } = req.body;
    const generatedBy = req.user.id;

    if (!['admin', 'approver'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and approvers can generate approval reports'
      });
    }

    // Set date range based on report type
    let reportStartDate, reportEndDate;
    const now = new Date();

    switch (reportType) {
      case 'daily':
        reportStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        reportEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'weekly':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        reportStartDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
        reportEndDate = new Date(reportStartDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        reportStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        reportEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'custom':
        reportStartDate = new Date(startDate);
        reportEndDate = new Date(endDate);
        break;
      default:
        reportStartDate = new Date(startDate);
        reportEndDate = new Date(endDate);
    }

    // Create approval report
    const report = new ApprovalReport({
      generatedBy,
      reportType,
      reportPeriod: {
        startDate: reportStartDate,
        endDate: reportEndDate
      }
    });

    // Calculate summary statistics
    await report.calculateSummary();

    // Get vendor data
    let vendorQuery = {};
    if (vendorId) {
      vendorQuery._id = vendorId;
    }

    const vendors = await User.find({ role: 'vendor', ...vendorQuery }).select('name company email');
    const vendorData = [];

    for (const vendor of vendors) {
      const submissions = await VendorSubmission.find({
        vendor: vendor._id,
        submissionDate: {
          $gte: reportStartDate,
          $lte: reportEndDate
        }
      }).populate('documents.document');

      if (submissions.length > 0) {
        const vendorSubmissions = submissions.map(submission => {
          const approvedDocs = submission.documents.filter(doc => doc.status === 'final_approved').length;
          const rejectedDocs = submission.documents.filter(doc => doc.status === 'final_rejected').length;
          const pendingDocs = submission.documents.filter(doc => 
            !['final_approved', 'final_rejected'].includes(doc.status)
          ).length;

          // Collect consultant notes and cross-verification remarks
          const consultantNotes = submission.documents
            .filter(doc => doc.consultantReview?.comments)
            .map(doc => doc.consultantReview.comments);

          const crossVerificationRemarks = submission.documents
            .filter(doc => doc.crossVerification?.remarks)
            .map(doc => doc.crossVerification.remarks);

          return {
            submission: submission._id,
            submissionTitle: submission.submissionTitle,
            status: submission.overallStatus,
            submissionDate: submission.submissionDate,
            documentsCount: submission.documents.length,
            approvedDocuments: approvedDocs,
            rejectedDocuments: rejectedDocs,
            pendingDocuments: pendingDocs,
            processingTime: submission.totalProcessingTime || 0,
            consultantNotes,
            crossVerificationRemarks
          };
        });

        vendorData.push({
          vendor: vendor._id,
          vendorName: vendor.name,
          companyName: vendor.company,
          submissions: vendorSubmissions
        });
      }
    }

    report.vendorData = vendorData;

    // Generate document samples for shared reference
    const documentSamples = await this.generateDocumentSamples(reportStartDate, reportEndDate);
    report.documentSamples = documentSamples;

    // Save report
    await report.save();

    // Generate report file (PDF/Excel)
    const reportFile = await this.generateReportFile(report);
    report.fileUrl = reportFile;
    await report.save();

    res.status(201).json({
      success: true,
      data: report,
      message: 'Approval report generated successfully'
    });
  } catch (error) {
    console.error('Generate approval report error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not generate approval report',
      error: error.message
    });
  }
};

// Generate MIS report for documents currently being processed
exports.generateMISReport = async (req, res) => {
  try {
    const { reportType = 'processing_status' } = req.body;
    const generatedBy = req.user.id;

    if (!['admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can generate MIS reports'
      });
    }

    const report = new MISReport({
      reportType,
      generatedBy,
      reportPeriod: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        endDate: new Date()
      }
    });

    // Generate processing status data
    await report.generateProcessingStatus();

    // Generate performance metrics
    await report.generatePerformanceMetrics();

    // Generate vendor analytics
    const vendorAnalytics = await this.generateVendorAnalytics();
    report.vendorAnalytics = vendorAnalytics;

    // Generate consultant workload data
    const consultantWorkload = await this.generateConsultantWorkload();
    report.consultantWorkload = consultantWorkload;

    // Generate system usage statistics
    const systemUsage = await this.generateSystemUsage();
    report.systemUsage = systemUsage;

    // Generate alerts and recommendations
    const alerts = await this.generateSystemAlerts();
    report.alerts = alerts;

    await report.save();

    res.status(201).json({
      success: true,
      data: report,
      message: 'MIS report generated successfully'
    });
  } catch (error) {
    console.error('Generate MIS report error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not generate MIS report',
      error: error.message
    });
  }
};

// Send monthly automated reminders to vendors
exports.sendMonthlyReminders = async (req, res) => {
  try {
    if (!['admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can send monthly reminders'
      });
    }

    // Find submissions that need reminders
    const submissions = await VendorSubmission.find({
      overallStatus: { $in: ['pending', 'in_progress', 'partially_approved', 'requires_resubmission'] }
    }).populate('vendor', 'name email company');

    const remindersToSend = submissions.filter(submission => submission.needsReminder());

    let remindersSent = 0;

    for (const submission of remindersToSend) {
      // Create notification
      await Notification.create({
        recipient: submission.vendor._id,
        type: 'monthly_reminder',
        title: 'Monthly Document Status Reminder',
        message: `This is a reminder about your pending submission "${submission.submissionTitle}". Please check the status and take necessary action if required.`,
        relatedDocument: submission._id,
        priority: 'medium'
      });

      // Update reminder tracking
      submission.remindersSent += 1;
      submission.lastReminderDate = new Date();
      await submission.save();

      remindersSent++;
    }

    res.status(200).json({
      success: true,
      message: `Monthly reminders sent to ${remindersSent} vendors`,
      data: {
        remindersSent,
        totalPendingSubmissions: submissions.length
      }
    });
  } catch (error) {
    console.error('Send monthly reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not send monthly reminders',
      error: error.message
    });
  }
};

// Send alert notifications to consultants
exports.sendConsultantAlerts = async (req, res) => {
  try {
    if (!['admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can send consultant alerts'
      });
    }

    // Find documents requiring consultant attention
    const submissions = await VendorSubmission.find({
      currentStage: 'consultant_review',
      overallStatus: { $in: ['pending', 'in_progress'] }
    }).populate('vendor', 'name company');

    // Group by consultant (if assigned) or send to all consultants
    const consultants = await User.find({ role: 'consultant', isActive: true });

    let alertsSent = 0;

    for (const consultant of consultants) {
      // Find documents assigned to this consultant or unassigned documents
      const relevantSubmissions = submissions.filter(submission => {
        return submission.documents.some(doc => 
          !doc.consultantReview?.reviewer || 
          doc.consultantReview?.reviewer?.toString() === consultant._id.toString()
        );
      });

      if (relevantSubmissions.length > 0) {
        await Notification.create({
          recipient: consultant._id,
          type: 'consultant_alert',
          title: 'Documents Requiring Your Attention',
          message: `You have ${relevantSubmissions.length} submissions with documents requiring review. Please check your dashboard.`,
          priority: 'high',
          actionUrl: '/consultant/dashboard'
        });

        alertsSent++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Alerts sent to ${alertsSent} consultants`,
      data: {
        alertsSent,
        totalPendingDocuments: submissions.reduce((sum, sub) => sum + sub.documents.length, 0)
      }
    });
  } catch (error) {
    console.error('Send consultant alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not send consultant alerts',
      error: error.message
    });
  }
};

// Download complete document sets for consultants
exports.downloadDocumentSet = async (req, res) => {
  try {
    const { submissionId } = req.params;

    if (!['consultant', 'cross_verifier', 'approver', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download document sets'
      });
    }

    const submission = await VendorSubmission.findById(submissionId)
      .populate('vendor', 'name company')
      .populate('documents.document');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Create a zip file with all documents
    const zipFilePath = await this.createDocumentZip(submission);

    // Log the download
    console.log(`User ${req.user.id} (${req.user.email}) downloaded document set: ${submission.submissionTitle}`);

    // Send the zip file
    res.download(zipFilePath, `${submission.submissionTitle}_documents.zip`, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up the temporary zip file
      fs.unlink(zipFilePath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
      });
    });
  } catch (error) {
    console.error('Download document set error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not download document set',
      error: error.message
    });
  }
};

// Helper methods

exports.generateDocumentSamples = async (startDate, endDate) => {
  const documentTypes = ['registration', 'compliance', 'financial', 'technical', 'other'];
  const samples = [];

  for (const docType of documentTypes) {
    const documents = await Document.find({
      documentType: docType,
      submissionDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['approved', 'rejected'] }
    })
    .populate('vendor', 'name company')
    .limit(5); // Sample of 5 documents per type

    if (documents.length > 0) {
      const sampleDocuments = documents.map(doc => ({
        documentName: doc.title,
        vendor: doc.vendor.name,
        status: doc.status,
        consultantComments: doc.reviewNotes || '',
        crossVerificationRemarks: '', // To be populated from workflow
        fileUrl: doc.fileUrl || (doc.files && doc.files[0] ? doc.files[0].path : '')
      }));

      samples.push({
        documentType: docType,
        sampleDocuments
      });
    }
  }

  return samples;
};

exports.generateVendorAnalytics = async () => {
  const vendors = await User.find({ role: 'vendor' }).select('name company');
  const analytics = [];

  for (const vendor of vendors) {
    const submissions = await VendorSubmission.find({ vendor: vendor._id });
    
    const totalSubmissions = submissions.length;
    const approvedSubmissions = submissions.filter(s => s.overallStatus === 'fully_approved').length;
    const rejectedSubmissions = submissions.filter(s => s.overallStatus === 'rejected').length;
    const pendingSubmissions = submissions.filter(s => 
      ['pending', 'in_progress', 'partially_approved'].includes(s.overallStatus)
    ).length;

    const avgProcessingTime = submissions
      .filter(s => s.totalProcessingTime > 0)
      .reduce((sum, s) => sum + s.totalProcessingTime, 0) / 
      Math.max(1, submissions.filter(s => s.totalProcessingTime > 0).length);

    const complianceScore = totalSubmissions > 0 ? (approvedSubmissions / totalSubmissions) * 100 : 0;

    const lastSubmission = submissions.sort((a, b) => b.submissionDate - a.submissionDate)[0];
    const lastSubmissionDate = lastSubmission ? lastSubmission.submissionDate : null;

    // Check if vendor is active (submitted in last 90 days)
    const isActiveVendor = lastSubmissionDate && 
      (new Date() - lastSubmissionDate) < (90 * 24 * 60 * 60 * 1000);

    // Get document types submitted
    const documentTypes = [...new Set(
      submissions.flatMap(s => s.documents.map(d => d.document?.documentType)).filter(Boolean)
    )];

    analytics.push({
      vendor: vendor._id,
      vendorName: vendor.name,
      companyName: vendor.company,
      totalSubmissions,
      approvedSubmissions,
      rejectedSubmissions,
      pendingSubmissions,
      averageProcessingTime: Math.round(avgProcessingTime),
      complianceScore: Math.round(complianceScore),
      lastSubmissionDate,
      isActiveVendor,
      documentTypes,
      frequentIssues: [] // To be populated based on rejection reasons
    });
  }

  return analytics;
};

exports.generateConsultantWorkload = async () => {
  const consultants = await User.find({ role: 'consultant' }).select('name email');
  const workload = [];

  for (const consultant of consultants) {
    // Count assigned and completed reviews
    const assignedDocs = await VendorSubmission.aggregate([
      { $unwind: '$documents' },
      { $match: { 'documents.consultantReview.reviewer': consultant._id } },
      { $count: 'total' }
    ]);

    const completedReviews = await VendorSubmission.aggregate([
      { $unwind: '$documents' },
      { 
        $match: { 
          'documents.consultantReview.reviewer': consultant._id,
          'documents.consultantReview.status': { $in: ['approved', 'rejected'] }
        }
      },
      { $count: 'total' }
    ]);

    const pendingReviews = await VendorSubmission.aggregate([
      { $unwind: '$documents' },
      { 
        $match: { 
          'documents.status': 'pending',
          $or: [
            { 'documents.consultantReview.reviewer': consultant._id },
            { 'documents.consultantReview.reviewer': { $exists: false } }
          ]
        }
      },
      { $count: 'total' }
    ]);

    const assigned = assignedDocs[0]?.total || 0;
    const completed = completedReviews[0]?.total || 0;
    const pending = pendingReviews[0]?.total || 0;

    // Determine workload status
    let workloadStatus = 'optimal';
    if (pending > 20) workloadStatus = 'overloaded';
    else if (pending < 5) workloadStatus = 'underloaded';

    workload.push({
      consultant: consultant._id,
      consultantName: consultant.name,
      assignedDocuments: assigned,
      completedReviews: completed,
      pendingReviews: pending,
      averageReviewTime: 0, // To be calculated based on review timestamps
      approvalRate: completed > 0 ? 0 : 0, // To be calculated
      rejectionRate: completed > 0 ? 0 : 0, // To be calculated
      workloadStatus,
      lastActivityDate: new Date() // To be populated from actual activity
    });
  }

  return workload;
};

exports.generateSystemUsage = async () => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ 
    lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  });

  // Get login frequency by role
  const loginFrequency = {
    vendors: await User.countDocuments({ 
      role: 'vendor',
      lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }),
    consultants: await User.countDocuments({ 
      role: 'consultant',
      lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }),
    approvers: await User.countDocuments({ 
      role: 'approver',
      lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }),
    admins: await User.countDocuments({ 
      role: 'admin',
      lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
  };

  // Document upload trends (last 30 days)
  const documentUploadTrends = await VendorSubmission.aggregate([
    {
      $match: {
        submissionDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$submissionDate' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return {
    totalUsers,
    activeUsers,
    loginFrequency,
    documentUploadTrends: documentUploadTrends.map(trend => ({
      date: new Date(trend._id),
      count: trend.count
    })),
    peakUsageHours: [9, 10, 11, 14, 15, 16], // Mock data - would be calculated from actual usage
    systemAlerts: [] // To be populated with actual system alerts
  };
};

exports.generateSystemAlerts = async () => {
  const alerts = [];

  // Check for overdue documents
  const overdueSubmissions = await VendorSubmission.find({
    overallStatus: { $in: ['pending', 'in_progress'] },
    lastUpdated: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  }).populate('vendor', 'name');

  overdueSubmissions.forEach(submission => {
    alerts.push({
      type: 'overdue_document',
      severity: 'high',
      message: `Submission "${submission.submissionTitle}" from ${submission.vendor.name} is overdue`,
      affectedEntities: [{
        entityType: 'vendor',
        entityId: submission.vendor._id,
        entityName: submission.vendor.name
      }],
      recommendedAction: 'Contact vendor or escalate to supervisor',
      isResolved: false
    });
  });

  // Check for consultant overload
  const consultantWorkload = await this.generateConsultantWorkload();
  consultantWorkload.forEach(consultant => {
    if (consultant.workloadStatus === 'overloaded') {
      alerts.push({
        type: 'consultant_overload',
        severity: 'medium',
        message: `Consultant ${consultant.consultantName} has ${consultant.pendingReviews} pending reviews`,
        affectedEntities: [{
          entityType: 'consultant',
          entityId: consultant.consultant,
          entityName: consultant.consultantName
        }],
        recommendedAction: 'Redistribute workload or assign additional consultants',
        isResolved: false
      });
    }
  });

  return alerts;
};

exports.generateReportFile = async (report) => {
  // PDF/Excel generation would go here
  return `/reports/${report.reportId}.pdf`;
};

exports.createDocumentZip = async (submission) => {
  // ZIP file creation would go here
  return `/temp/${submission._id}_documents.zip`;
};

// Get approval reports
exports.getApprovalReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, reportType } = req.query;
    
    let query = {};
    if (reportType) query.reportType = reportType;

    const reports = await ApprovalReport.find(query)
      .populate('generatedBy', 'name email')
      .sort({ generationDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ApprovalReport.countDocuments(query);

    res.status(200).json({
      success: true,
      data: reports,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get approval reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch approval reports',
      error: error.message
    });
  }
};

// Get MIS reports
exports.getMISReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, reportType } = req.query;
    
    let query = {};
    if (reportType) query.reportType = reportType;

    const reports = await MISReport.find(query)
      .populate('generatedBy', 'name email')
      .sort({ generationDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await MISReport.countDocuments(query);

    res.status(200).json({
      success: true,
      data: reports,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get MIS reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch MIS reports',
      error: error.message
    });
  }
};

module.exports = exports;