const VendorSubmission = require('../models/vendorSubmission.model');
const Document = require('../models/document.model');
const Workflow = require('../models/workflow.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const ApprovalReport = require('../models/approvalReport.model');
const MISReport = require('../models/misReport.model');
const webSocketService = require('../utils/webSocketService');

// Create a new vendor submission with multiple documents
exports.createVendorSubmission = async (req, res) => {
  try {
    const { submissionTitle, description, documents } = req.body;
    const vendorId = req.user.id;

    if (req.user.role !== 'vendor') {
      return res.status(403).json({
        success: false,
        message: 'Only vendors can create submissions'
      });
    }

    if (!submissionTitle || !documents || documents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Submission title and at least one document are required'
      });
    }

    // Validate that all documents exist and belong to the vendor
    const documentIds = documents.map(doc => doc.documentId);
    const existingDocuments = await Document.find({
      _id: { $in: documentIds },
      vendor: vendorId
    });

    if (existingDocuments.length !== documentIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more documents not found or do not belong to you'
      });
    }

    // Create vendor submission
    const submission = await VendorSubmission.create({
      vendor: vendorId,
      submissionTitle,
      description,
      documents: documents.map(doc => ({
        document: doc.documentId,
        documentName: doc.documentName,
        status: 'pending'
      })),
      overallStatus: 'pending',
      currentStage: 'consultant_review',
      processingStartDate: new Date()
    });

    // Create workflows for each document
    const workflowPromises = documents.map(doc => {
      return Workflow.create({
        document: doc.documentId,
        vendor: vendorId,
        stages: [
          {
            name: 'submission',
            status: 'completed',
            startDate: new Date(),
            completionDate: new Date()
          },
          {
            name: 'consultant_review',
            status: 'pending',
            startDate: new Date()
          },
          {
            name: 'cross_verification',
            status: 'pending'
          },
          {
            name: 'final_approval',
            status: 'pending'
          }
        ],
        currentStage: 'consultant_review'
      });
    });

    await Promise.all(workflowPromises);

    // Update document statuses
    await Document.updateMany(
      { _id: { $in: documentIds } },
      { status: 'under_review' }
    );

    // Notify consultants
    await this.notifyConsultants(submission, 'new_submission');

    // Send confirmation notification to vendor
    await Notification.create({
      recipient: vendorId,
      type: 'submission_confirmation',
      title: 'Submission Created Successfully',
      message: `Your submission "${submissionTitle}" with ${documents.length} documents has been created and is now under review.`,
      relatedDocument: submission._id,
      priority: 'medium'
    });

    res.status(201).json({
      success: true,
      data: submission,
      message: 'Vendor submission created successfully'
    });
  } catch (error) {
    console.error('Create vendor submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not create vendor submission',
      error: error.message
    });
  }
};

// Stage 1: Consultant Review
exports.consultantReview = async (req, res) => {
  try {
    const { submissionId, documentId } = req.params;
    const { action, comments } = req.body; // action: 'approve', 'reject', 'request_changes'
    const consultantId = req.user.id;

    if (!['consultant', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only consultants can perform document reviews'
      });
    }

    const submission = await VendorSubmission.findById(submissionId)
      .populate('vendor', 'name email company')
      .populate('documents.document');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    const documentIndex = submission.documents.findIndex(
      doc => doc.document._id.toString() === documentId
    );

    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document not found in submission'
      });
    }

    const document = submission.documents[documentIndex];

    if (document.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Document has already been reviewed'
      });
    }

    // Update document review status
    document.consultantReview = {
      reviewer: consultantId,
      status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'requires_changes',
      comments: comments,
      reviewDate: new Date()
    };

    // Update document status based on action
    if (action === 'approve') {
      document.status = 'consultant_approved';
    } else if (action === 'reject') {
      document.status = 'consultant_rejected';
    } else {
      document.status = 'pending'; // Requires changes, stays pending
    }

    // Update workflow
    const workflow = await Workflow.findOne({ document: documentId });
    if (workflow) {
      const consultantStage = workflow.stages.find(stage => stage.name === 'consultant_review');
      if (consultantStage) {
        consultantStage.status = action === 'approve' ? 'completed' : 'rejected';
        consultantStage.assignedTo = consultantId;
        consultantStage.completionDate = new Date();
        consultantStage.comments = comments;

        if (action === 'approve') {
          workflow.currentStage = 'cross_verification';
          const crossVerificationStage = workflow.stages.find(stage => stage.name === 'cross_verification');
          if (crossVerificationStage) {
            crossVerificationStage.status = 'pending';
            crossVerificationStage.startDate = new Date();
          }
        } else {
          workflow.currentStage = action === 'reject' ? 'rejected' : 'consultant_review';
        }
      }
      await workflow.save();
    }

    // Recalculate overall submission status
    submission.calculateOverallStatus();
    await submission.save();

    // Create notifications
    await this.createReviewNotifications(submission, document, consultantId, action, comments);

    // If approved, notify cross-verifiers
    if (action === 'approve') {
      await this.notifyCrossVerifiers(submission, document);
    }

    res.status(200).json({
      success: true,
      data: submission,
      message: `Document ${action}d successfully`
    });
  } catch (error) {
    console.error('Consultant review error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not process consultant review',
      error: error.message
    });
  }
};

// Stage 2: Cross-Verification
exports.crossVerification = async (req, res) => {
  try {
    const { submissionId, documentId } = req.params;
    const { action, remarks } = req.body; // action: 'approve', 'reject', 'flag_for_modification'
    const verifierId = req.user.id;

    if (!['cross_verifier', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only cross-verifiers can perform document verification'
      });
    }

    const submission = await VendorSubmission.findById(submissionId)
      .populate('vendor', 'name email company')
      .populate('documents.document');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    const documentIndex = submission.documents.findIndex(
      doc => doc.document._id.toString() === documentId
    );

    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document not found in submission'
      });
    }

    const document = submission.documents[documentIndex];

    if (document.status !== 'consultant_approved') {
      return res.status(400).json({
        success: false,
        message: 'Document must be consultant-approved before cross-verification'
      });
    }

    // Update document cross-verification status
    document.crossVerification = {
      verifier: verifierId,
      status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'flagged_for_modification',
      remarks: remarks,
      verificationDate: new Date()
    };

    // Update document status based on action
    if (action === 'approve') {
      document.status = 'cross_verified';
    } else if (action === 'reject') {
      document.status = 'consultant_rejected'; // Send back to consultant
    } else {
      document.status = 'cross_flagged'; // Flagged for modification
    }

    // Update workflow
    const workflow = await Workflow.findOne({ document: documentId });
    if (workflow) {
      const crossVerificationStage = workflow.stages.find(stage => stage.name === 'cross_verification');
      if (crossVerificationStage) {
        crossVerificationStage.status = action === 'approve' ? 'completed' : 'rejected';
        crossVerificationStage.assignedTo = verifierId;
        crossVerificationStage.completionDate = new Date();
        crossVerificationStage.remarks = remarks;
        crossVerificationStage.actionTaken = action;

        if (action === 'approve') {
          workflow.currentStage = 'final_approval';
          const finalApprovalStage = workflow.stages.find(stage => stage.name === 'final_approval');
          if (finalApprovalStage) {
            finalApprovalStage.status = 'pending';
            finalApprovalStage.startDate = new Date();
          }
        } else if (action === 'reject') {
          workflow.currentStage = 'consultant_review';
          // Reset consultant stage
          const consultantStage = workflow.stages.find(stage => stage.name === 'consultant_review');
          if (consultantStage) {
            consultantStage.status = 'pending';
            consultantStage.startDate = new Date();
          }
        } else {
          workflow.currentStage = 'requires_modification';
        }
      }
      await workflow.save();
    }

    // Recalculate overall submission status
    submission.calculateOverallStatus();
    await submission.save();

    // Create notifications
    await this.createCrossVerificationNotifications(submission, document, verifierId, action, remarks);

    // If approved, notify approvers
    if (action === 'approve') {
      await this.notifyApprovers(submission, document);
    }

    res.status(200).json({
      success: true,
      data: submission,
      message: `Document cross-verification ${action}d successfully`
    });
  } catch (error) {
    console.error('Cross-verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not process cross-verification',
      error: error.message
    });
  }
};

// Stage 3: Final Approval
exports.finalApproval = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { documentApprovals } = req.body; // Array of {documentId, action, comments}
    const approverId = req.user.id;

    if (!['approver', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only approvers can perform final approval'
      });
    }

    const submission = await VendorSubmission.findById(submissionId)
      .populate('vendor', 'name email company')
      .populate('documents.document');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Process each document approval
    for (const approval of documentApprovals) {
      const documentIndex = submission.documents.findIndex(
        doc => doc.document._id.toString() === approval.documentId
      );

      if (documentIndex === -1) continue;

      const document = submission.documents[documentIndex];

      if (document.status !== 'cross_verified') continue;

      // Update document final approval status
      document.finalApproval = {
        approver: approverId,
        status: approval.action === 'approve' ? 'approved' : 'rejected',
        comments: approval.comments,
        approvalDate: new Date()
      };

      // Update document status
      document.status = approval.action === 'approve' ? 'final_approved' : 'final_rejected';

      // Update workflow
      const workflow = await Workflow.findOne({ document: approval.documentId });
      if (workflow) {
        const finalApprovalStage = workflow.stages.find(stage => stage.name === 'final_approval');
        if (finalApprovalStage) {
          finalApprovalStage.status = approval.action === 'approve' ? 'completed' : 'rejected';
          finalApprovalStage.assignedTo = approverId;
          finalApprovalStage.completionDate = new Date();
          finalApprovalStage.comments = approval.comments;
        }

        workflow.currentStage = approval.action === 'approve' ? 'completed' : 'rejected';
        workflow.isCompleted = true;
        workflow.completedAt = new Date();
        workflow.finalApprovalStatus = approval.action === 'approve' ? 'approved' : 'rejected';
        workflow.finalApprovalDate = new Date();
        workflow.finalApprovalBy = approverId;

        await workflow.save();
      }

      // Update document model status
      await Document.findByIdAndUpdate(approval.documentId, {
        status: approval.action === 'approve' ? 'approved' : 'rejected',
        reviewer: approverId,
        reviewDate: new Date(),
        reviewNotes: approval.comments
      });
    }

    // Recalculate overall submission status
    submission.calculateOverallStatus();
    await submission.save();

    // Create notifications
    await this.createFinalApprovalNotifications(submission, documentApprovals, approverId);

    // Generate approval report if submission is completed
    if (submission.overallStatus === 'fully_approved') {
      await this.generateApprovalReport(submission);
    }

    res.status(200).json({
      success: true,
      data: submission,
      message: 'Final approval processed successfully'
    });
  } catch (error) {
    console.error('Final approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not process final approval',
      error: error.message
    });
  }
};

// Get vendor submissions for approver dashboard (organized vertically)
exports.getVendorListForApprover = async (req, res) => {
  try {
    if (!['approver', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only approvers can access this endpoint'
      });
    }

    const { status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (status) {
      query.overallStatus = status;
    }

    // Get submissions ready for final approval or completed
    const submissions = await VendorSubmission.find({
      ...query,
      $or: [
        { currentStage: 'final_approval' },
        { overallStatus: 'fully_approved' },
        { overallStatus: 'partially_approved' }
      ]
    })
    .populate('vendor', 'name email company phone')
    .populate('documents.document', 'title documentType')
    .sort({ submissionDate: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

    // Organize data for approver view
    const vendorList = submissions.map(submission => ({
      submissionId: submission._id,
      vendor: {
        id: submission.vendor._id,
        name: submission.vendor.name,
        email: submission.vendor.email,
        company: submission.vendor.company,
        phone: submission.vendor.phone
      },
      submissionTitle: submission.submissionTitle,
      submissionDate: submission.submissionDate,
      overallStatus: submission.overallStatus,
      currentStage: submission.currentStage,
      totalDocuments: submission.documents.length,
      documentsStatus: {
        approved: submission.documents.filter(doc => doc.status === 'final_approved').length,
        rejected: submission.documents.filter(doc => doc.status === 'final_rejected').length,
        pending: submission.documents.filter(doc => doc.status === 'cross_verified').length
      },
      documents: submission.documents.map(doc => ({
        documentId: doc.document._id,
        documentName: doc.documentName,
        documentType: doc.document.documentType,
        status: doc.status,
        consultantComments: doc.consultantReview?.comments,
        crossVerificationRemarks: doc.crossVerification?.remarks,
        finalApprovalComments: doc.finalApproval?.comments
      })),
      processingTime: submission.totalProcessingTime,
      lastUpdated: submission.lastUpdated
    }));

    const total = await VendorSubmission.countDocuments({
      ...query,
      $or: [
        { currentStage: 'final_approval' },
        { overallStatus: 'fully_approved' },
        { overallStatus: 'partially_approved' }
      ]
    });

    res.status(200).json({
      success: true,
      data: vendorList,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get vendor list error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch vendor list',
      error: error.message
    });
  }
};

// Helper methods for notifications
exports.notifyConsultants = async (submission, type) => {
  const consultants = await User.find({ role: 'consultant', isActive: true });
  
  const notificationPromises = consultants.map(consultant => {
    return Notification.create({
      recipient: consultant._id,
      sender: submission.vendor,
      type: 'document_assignment',
      title: 'New Documents for Review',
      message: `New submission "${submission.submissionTitle}" with ${submission.documents.length} documents requires your review.`,
      relatedDocument: submission._id,
      priority: 'high',
      actionUrl: `/consultant/review/${submission._id}`
    });
  });

  await Promise.all(notificationPromises);
};

exports.notifyCrossVerifiers = async (submission, document) => {
  const crossVerifiers = await User.find({ role: 'cross_verifier', isActive: true });
  
  const notificationPromises = crossVerifiers.map(verifier => {
    return Notification.create({
      recipient: verifier._id,
      type: 'document_verification',
      title: 'Document Ready for Cross-Verification',
      message: `Document "${document.documentName}" from submission "${submission.submissionTitle}" is ready for cross-verification.`,
      relatedDocument: submission._id,
      priority: 'medium',
      actionUrl: `/cross-verification/${submission._id}/${document.document}`
    });
  });

  await Promise.all(notificationPromises);
};

exports.notifyApprovers = async (submission, document) => {
  const approvers = await User.find({ role: 'approver', isActive: true });
  
  const notificationPromises = approvers.map(approver => {
    return Notification.create({
      recipient: approver._id,
      type: 'document_approval',
      title: 'Document Ready for Final Approval',
      message: `Document "${document.documentName}" from submission "${submission.submissionTitle}" is ready for final approval.`,
      relatedDocument: submission._id,
      priority: 'medium',
      actionUrl: `/final-approval/${submission._id}`
    });
  });

  await Promise.all(notificationPromises);
};

exports.createReviewNotifications = async (submission, document, consultantId, action, comments) => {
  // Notify vendor
  const vendorNotification = await Notification.create({
    recipient: submission.vendor._id,
    sender: consultantId,
    type: action === 'approve' ? 'document_approved' : action === 'reject' ? 'document_rejected' : 'document_review',
    title: `Document ${action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Requires Changes'}`,
    message: `Your document "${document.documentName}" has been ${action}d by consultant. ${comments ? 'Comments: ' + comments : ''}`,
    relatedDocument: submission._id,
    priority: action === 'reject' ? 'high' : 'medium'
  });

  // Send real-time notification to vendor
  webSocketService.sendToUser(submission.vendor._id.toString(), 'notification', {
    type: 'notification',
    data: {
      ...vendorNotification.toObject(),
      relatedDocument: {
        _id: submission._id,
        title: document.documentName,
        status: document.status
      }
    }
  });

  // Notify admins
  const admins = await User.find({ role: 'admin', isActive: true });
  const adminNotificationPromises = admins.map(async admin => {
    const adminNotification = await Notification.create({
      recipient: admin._id,
      sender: consultantId,
      type: 'workflow_update',
      title: 'Consultant Review Completed',
      message: `Document "${document.documentName}" from "${submission.submissionTitle}" has been ${action}d.`,
      relatedDocument: submission._id,
      priority: 'low'
    });

    // Send real-time notification to admin
    webSocketService.sendToUser(admin._id.toString(), 'notification', {
      type: 'notification',
      data: {
        ...adminNotification.toObject(),
        relatedDocument: {
          _id: submission._id,
          title: document.documentName,
          status: document.status
        }
      }
    });

    return adminNotification;
  });

  await Promise.all(adminNotificationPromises);
};

exports.createCrossVerificationNotifications = async (submission, document, verifierId, action, remarks) => {
  // Notify vendor
  const vendorNotification = await Notification.create({
    recipient: submission.vendor._id,
    sender: verifierId,
    type: action === 'approve' ? 'document_approved' : action === 'reject' ? 'document_rejected' : 'document_review',
    title: `Document Cross-Verification ${action === 'approve' ? 'Completed' : action === 'reject' ? 'Rejected' : 'Flagged'}`,
    message: `Your document "${document.documentName}" cross-verification is ${action}d. ${remarks ? 'Remarks: ' + remarks : ''}`,
    relatedDocument: submission._id,
    priority: action === 'flag_for_modification' ? 'high' : 'medium'
  });

  // Send real-time notification to vendor
  webSocketService.sendToUser(submission.vendor._id.toString(), 'notification', {
    type: 'notification',
    data: {
      ...vendorNotification.toObject(),
      relatedDocument: {
        _id: submission._id,
        title: document.documentName,
        status: document.status
      }
    }
  });
};

exports.createFinalApprovalNotifications = async (submission, documentApprovals, approverId) => {
  // Notify vendor about final approval results
  const approvedCount = documentApprovals.filter(approval => approval.action === 'approve').length;
  const rejectedCount = documentApprovals.filter(approval => approval.action === 'reject').length;
  const overallApproved = rejectedCount === 0;

  const vendorNotification = await Notification.create({
    recipient: submission.vendor._id,
    sender: approverId,
    type: overallApproved ? 'document_approved' : 'document_rejected',
    title: 'Final Approval Completed',
    message: `Your submission "${submission.submissionTitle}" final approval is complete. ${approvedCount} approved, ${rejectedCount} rejected.`,
    relatedDocument: submission._id,
    priority: 'high'
  });

  // Send real-time notification to vendor
  webSocketService.sendToUser(submission.vendor._id.toString(), 'notification', {
    type: 'notification',
    data: {
      ...vendorNotification.toObject(),
      relatedDocument: {
        _id: submission._id,
        title: submission.submissionTitle,
        status: overallApproved ? 'approved' : 'rejected'
      }
    }
  });
};

exports.generateApprovalReport = async (submission) => {
  // This will be implemented in the report controller
  console.log(`Generating approval report for submission: ${submission._id}`);
};

// Get vendor submissions
exports.getVendorSubmissions = async (req, res) => {
  try {
    const vendorId = req.user.role === 'vendor' ? req.user.id : req.query.vendorId;
    const { status, page = 1, limit = 10 } = req.query;

    let query = {};
    if (vendorId) query.vendor = vendorId;
    if (status) query.overallStatus = status;

    const submissions = await VendorSubmission.find(query)
      .populate('vendor', 'name email company')
      .populate('documents.document', 'title documentType')
      .sort({ submissionDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await VendorSubmission.countDocuments(query);

    res.status(200).json({
      success: true,
      data: submissions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get vendor submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch vendor submissions',
      error: error.message
    });
  }
};

// Get single vendor submission
exports.getVendorSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    
    const submission = await VendorSubmission.findById(id)
      .populate('vendor', 'name email company phone')
      .populate('documents.document')
      .populate('documents.consultantReview.reviewer', 'name email')
      .populate('documents.crossVerification.verifier', 'name email')
      .populate('documents.finalApproval.approver', 'name email');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check authorization
    if (req.user.role === 'vendor' && submission.vendor._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this submission'
      });
    }

    res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Get vendor submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch vendor submission',
      error: error.message
    });
  }
};

// Get consultant pending reviews
exports.getConsultantPendingReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const submissions = await VendorSubmission.find({
      'documents.status': 'pending'
    })
    .populate('vendor', 'name email company')
    .populate('documents.document', 'title documentType')
    .sort({ submissionDate: 1 }) // Oldest first
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

    // Filter to only show documents that need consultant review
    const pendingReviews = submissions.map(submission => ({
      ...submission.toObject(),
      documents: submission.documents.filter(doc => doc.status === 'pending')
    })).filter(submission => submission.documents.length > 0);

    res.status(200).json({
      success: true,
      data: pendingReviews,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(pendingReviews.length / limit),
        total: pendingReviews.length
      }
    });
  } catch (error) {
    console.error('Get consultant pending reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch pending reviews',
      error: error.message
    });
  }
};

// Get cross-verifier pending verifications
exports.getCrossVerifierPendingVerifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const submissions = await VendorSubmission.find({
      'documents.status': 'consultant_approved'
    })
    .populate('vendor', 'name email company')
    .populate('documents.document', 'title documentType')
    .populate('documents.consultantReview.reviewer', 'name')
    .sort({ submissionDate: 1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

    // Filter to only show documents that need cross-verification
    const pendingVerifications = submissions.map(submission => ({
      ...submission.toObject(),
      documents: submission.documents.filter(doc => doc.status === 'consultant_approved')
    })).filter(submission => submission.documents.length > 0);

    res.status(200).json({
      success: true,
      data: pendingVerifications,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(pendingVerifications.length / limit),
        total: pendingVerifications.length
      }
    });
  } catch (error) {
    console.error('Get cross-verifier pending verifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch pending verifications',
      error: error.message
    });
  }
};

// Dashboard methods
exports.getVendorDashboard = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const submissions = await VendorSubmission.find({ vendor: vendorId })
      .populate('documents.document', 'title documentType')
      .sort({ submissionDate: -1 });

    const stats = {
      totalSubmissions: submissions.length,
      pendingSubmissions: submissions.filter(s => s.overallStatus === 'pending').length,
      inProgressSubmissions: submissions.filter(s => s.overallStatus === 'in_progress').length,
      approvedSubmissions: submissions.filter(s => s.overallStatus === 'fully_approved').length,
      rejectedSubmissions: submissions.filter(s => s.overallStatus === 'rejected').length,
      recentSubmissions: submissions.slice(0, 5)
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get vendor dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch vendor dashboard',
      error: error.message
    });
  }
};

exports.getConsultantDashboard = async (req, res) => {
  try {
    const consultantId = req.user.id;

    // Get documents assigned to this consultant
    const assignedSubmissions = await VendorSubmission.find({
      'documents.consultantReview.reviewer': consultantId
    }).populate('vendor', 'name company');

    // Get pending reviews
    const pendingReviews = await VendorSubmission.find({
      'documents.status': 'pending'
    }).populate('vendor', 'name company');

    const stats = {
      assignedDocuments: assignedSubmissions.reduce((sum, sub) => 
        sum + sub.documents.filter(doc => 
          doc.consultantReview?.reviewer?.toString() === consultantId
        ).length, 0
      ),
      pendingReviews: pendingReviews.reduce((sum, sub) => 
        sum + sub.documents.filter(doc => doc.status === 'pending').length, 0
      ),
      completedReviews: assignedSubmissions.reduce((sum, sub) => 
        sum + sub.documents.filter(doc => 
          doc.consultantReview?.reviewer?.toString() === consultantId &&
          ['approved', 'rejected'].includes(doc.consultantReview?.status)
        ).length, 0
      ),
      recentReviews: pendingReviews.slice(0, 5)
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get consultant dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch consultant dashboard',
      error: error.message
    });
  }
};

exports.getCrossVerifierDashboard = async (req, res) => {
  try {
    const verifierId = req.user.id;

    const pendingVerifications = await VendorSubmission.find({
      'documents.status': 'consultant_approved'
    }).populate('vendor', 'name company');

    const completedVerifications = await VendorSubmission.find({
      'documents.crossVerification.verifier': verifierId
    }).populate('vendor', 'name company');

    const stats = {
      pendingVerifications: pendingVerifications.reduce((sum, sub) => 
        sum + sub.documents.filter(doc => doc.status === 'consultant_approved').length, 0
      ),
      completedVerifications: completedVerifications.reduce((sum, sub) => 
        sum + sub.documents.filter(doc => 
          doc.crossVerification?.verifier?.toString() === verifierId
        ).length, 0
      ),
      recentVerifications: pendingVerifications.slice(0, 5)
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get cross-verifier dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch cross-verifier dashboard',
      error: error.message
    });
  }
};

exports.getApproverDashboard = async (req, res) => {
  try {
    const pendingApprovals = await VendorSubmission.find({
      currentStage: 'final_approval'
    }).populate('vendor', 'name company');

    const completedApprovals = await VendorSubmission.find({
      overallStatus: { $in: ['fully_approved', 'rejected'] }
    }).populate('vendor', 'name company');

    const stats = {
      pendingApprovals: pendingApprovals.length,
      completedApprovals: completedApprovals.length,
      recentSubmissions: pendingApprovals.slice(0, 10)
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get approver dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch approver dashboard',
      error: error.message
    });
  }
};

exports.getAdminDashboard = async (req, res) => {
  try {
    const totalSubmissions = await VendorSubmission.countDocuments();
    const pendingSubmissions = await VendorSubmission.countDocuments({ 
      overallStatus: { $in: ['pending', 'in_progress'] }
    });
    const completedSubmissions = await VendorSubmission.countDocuments({ 
      overallStatus: 'fully_approved' 
    });

    const recentSubmissions = await VendorSubmission.find()
      .populate('vendor', 'name company')
      .sort({ submissionDate: -1 })
      .limit(10);

    const stats = {
      totalSubmissions,
      pendingSubmissions,
      completedSubmissions,
      rejectedSubmissions: await VendorSubmission.countDocuments({ overallStatus: 'rejected' }),
      recentSubmissions,
      systemAlerts: [] // To be populated with actual alerts
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch admin dashboard',
      error: error.message
    });
  }
};

// Workflow tracking methods
exports.getSubmissionWorkflow = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await VendorSubmission.findById(submissionId)
      .populate('vendor', 'name company')
      .populate('documents.document', 'title')
      .populate('documents.consultantReview.reviewer', 'name')
      .populate('documents.crossVerification.verifier', 'name')
      .populate('documents.finalApproval.approver', 'name');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Get workflows for all documents in submission
    const documentIds = submission.documents.map(doc => doc.document._id);
    const workflows = await Workflow.find({ 
      document: { $in: documentIds } 
    }).populate('stages.assignedTo', 'name role');

    res.status(200).json({
      success: true,
      data: {
        submission,
        workflows
      }
    });
  } catch (error) {
    console.error('Get submission workflow error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch submission workflow',
      error: error.message
    });
  }
};

exports.getDocumentWorkflow = async (req, res) => {
  try {
    const { documentId } = req.params;

    const workflow = await Workflow.findOne({ document: documentId })
      .populate('document', 'title documentType')
      .populate('vendor', 'name company')
      .populate('stages.assignedTo', 'name role email');

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.status(200).json({
      success: true,
      data: workflow
    });
  } catch (error) {
    console.error('Get document workflow error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch document workflow',
      error: error.message
    });
  }
};

// Placeholder methods for additional functionality
exports.resubmitDocuments = async (req, res) => {
  // Implementation for document resubmission
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

exports.bulkConsultantReview = async (req, res) => {
  try {
    const { documentIds, status, comments } = req.body;
    const consultantId = req.user.id;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Document IDs array is required'
      });
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (approved or rejected) is required'
      });
    }

    // Update all documents
    const updatePromises = documentIds.map(async (docId) => {
      const document = await Document.findById(docId);
      if (!document) return null;

      // Find the submission containing this document
      const submission = await VendorSubmission.findOne({
        'documents.document': docId
      });

      if (!submission) return null;

      // Update document in submission
      const docIndex = submission.documents.findIndex(
        doc => doc.document.toString() === docId
      );

      if (docIndex === -1) return null;

      submission.documents[docIndex].consultantReview = {
        reviewer: consultantId,
        status,
        comments: comments || '',
        date: new Date()
      };

      // Update workflow
      const workflow = await Workflow.findOne({ document: docId });
      if (workflow) {
        const stageIndex = workflow.stages.findIndex(stage => stage.name === 'consultant_review');
        if (stageIndex !== -1) {
          workflow.stages[stageIndex].status = 'completed';
          workflow.stages[stageIndex].completionDate = new Date();
          workflow.stages[stageIndex].outcome = status;
          workflow.stages[stageIndex].comments = comments || '';
          
          // Update next stage
          const nextStageIndex = workflow.stages.findIndex(stage => stage.name === 'cross_verification');
          if (nextStageIndex !== -1) {
            workflow.stages[nextStageIndex].status = 'pending';
            workflow.stages[nextStageIndex].startDate = new Date();
          }
          
          workflow.currentStage = 'cross_verification';
          await workflow.save();
        }
      }

      // Update document status
      document.status = status === 'approved' ? 'consultant_approved' : 'consultant_rejected';
      await document.save();

      await submission.save();
      return document;
    });

    const updatedDocuments = await Promise.all(updatePromises);
    const successfulUpdates = updatedDocuments.filter(doc => doc !== null);

    // Notify vendor
    if (successfulUpdates.length > 0) {
      const firstDoc = successfulUpdates[0];
      const vendor = await User.findById(firstDoc.vendor);
      
      if (vendor) {
        await Notification.create({
          recipient: vendor._id,
          type: 'document',
          title: `Bulk Document ${status === 'approved' ? 'Approval' : 'Rejection'}`,
          message: `${successfulUpdates.length} documents have been ${status === 'approved' ? 'approved' : 'rejected'} by consultant review.`,
          priority: 'medium'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `${successfulUpdates.length} documents have been ${status} by consultant review`,
      data: successfulUpdates
    });
  } catch (error) {
    console.error('Bulk consultant review error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not process bulk consultant review',
      error: error.message
    });
  }
};

exports.bulkCrossVerification = async (req, res) => {
  try {
    const { documentIds, status, comments } = req.body;
    const verifierId = req.user.id;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Document IDs array is required'
      });
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (approved or rejected) is required'
      });
    }

    // Update all documents
    const updatePromises = documentIds.map(async (docId) => {
      const document = await Document.findById(docId);
      if (!document) return null;

      // Find the submission containing this document
      const submission = await VendorSubmission.findOne({
        'documents.document': docId
      });

      if (!submission) return null;

      // Update document in submission
      const docIndex = submission.documents.findIndex(
        doc => doc.document.toString() === docId
      );

      if (docIndex === -1) return null;

      submission.documents[docIndex].crossVerification = {
        verifier: verifierId,
        status,
        comments: comments || '',
        date: new Date()
      };

      // Update workflow
      const workflow = await Workflow.findOne({ document: docId });
      if (workflow) {
        const stageIndex = workflow.stages.findIndex(stage => stage.name === 'cross_verification');
        if (stageIndex !== -1) {
          workflow.stages[stageIndex].status = 'completed';
          workflow.stages[stageIndex].completionDate = new Date();
          workflow.stages[stageIndex].outcome = status;
          workflow.stages[stageIndex].comments = comments || '';
          
          // Update next stage
          const nextStageIndex = workflow.stages.findIndex(stage => stage.name === 'final_approval');
          if (nextStageIndex !== -1) {
            workflow.stages[nextStageIndex].status = 'pending';
            workflow.stages[nextStageIndex].startDate = new Date();
          }
          
          workflow.currentStage = 'final_approval';
          await workflow.save();
        }
      }

      // Update document status
      document.status = status === 'approved' ? 'cross_verified' : 'verification_rejected';
      await document.save();

      await submission.save();
      return document;
    });

    const updatedDocuments = await Promise.all(updatePromises);
    const successfulUpdates = updatedDocuments.filter(doc => doc !== null);

    // Notify vendor
    if (successfulUpdates.length > 0) {
      const firstDoc = successfulUpdates[0];
      const vendor = await User.findById(firstDoc.vendor);
      
      if (vendor) {
        await Notification.create({
          recipient: vendor._id,
          type: 'document',
          title: `Bulk Document ${status === 'approved' ? 'Verification' : 'Rejection'}`,
          message: `${successfulUpdates.length} documents have been ${status === 'approved' ? 'verified' : 'rejected'} in cross-verification.`,
          priority: 'medium'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `${successfulUpdates.length} documents have been ${status} in cross-verification`,
      data: successfulUpdates
    });
  } catch (error) {
    console.error('Bulk cross-verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not process bulk cross-verification',
      error: error.message
    });
  }
};

exports.bulkFinalApproval = async (req, res) => {
  try {
    const { documentIds, status, comments } = req.body;
    const approverId = req.user.id;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Document IDs array is required'
      });
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (approved or rejected) is required'
      });
    }

    // Update all documents
    const updatePromises = documentIds.map(async (docId) => {
      const document = await Document.findById(docId);
      if (!document) return null;

      // Find the submission containing this document
      const submission = await VendorSubmission.findOne({
        'documents.document': docId
      });

      if (!submission) return null;

      // Update document in submission
      const docIndex = submission.documents.findIndex(
        doc => doc.document.toString() === docId
      );

      if (docIndex === -1) return null;

      submission.documents[docIndex].finalApproval = {
        approver: approverId,
        status,
        comments: comments || '',
        date: new Date()
      };

      // Update workflow
      const workflow = await Workflow.findOne({ document: docId });
      if (workflow) {
        const stageIndex = workflow.stages.findIndex(stage => stage.name === 'final_approval');
        if (stageIndex !== -1) {
          workflow.stages[stageIndex].status = 'completed';
          workflow.stages[stageIndex].completionDate = new Date();
          workflow.stages[stageIndex].outcome = status;
          workflow.stages[stageIndex].comments = comments || '';
          workflow.isCompleted = true;
          workflow.completionDate = new Date();
          await workflow.save();
        }
      }

      // Update document status
      document.status = status === 'approved' ? 'approved' : 'rejected';
      document.isProcessingComplete = true;
      document.processingCompletionDate = new Date();
      await document.save();

      // Check if all documents in submission are processed
      const allDocumentsProcessed = submission.documents.every(
        doc => doc.finalApproval && ['approved', 'rejected'].includes(doc.finalApproval.status)
      );

      if (allDocumentsProcessed) {
        submission.overallStatus = 'completed';
        submission.processingEndDate = new Date();
      }

      await submission.save();
      return document;
    });

    const updatedDocuments = await Promise.all(updatePromises);
    const successfulUpdates = updatedDocuments.filter(doc => doc !== null);

    // Notify vendor
    if (successfulUpdates.length > 0) {
      const firstDoc = successfulUpdates[0];
      const vendor = await User.findById(firstDoc.vendor);
      
      if (vendor) {
        await Notification.create({
          recipient: vendor._id,
          type: 'document',
          title: `Bulk Document ${status === 'approved' ? 'Approval' : 'Rejection'}`,
          message: `${successfulUpdates.length} documents have been ${status === 'approved' ? 'approved' : 'rejected'} in final approval.`,
          priority: 'high'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `${successfulUpdates.length} documents have been ${status} in final approval`,
      data: successfulUpdates
    });
  } catch (error) {
    console.error('Bulk final approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not process bulk final approval',
      error: error.message
    });
  }
};

exports.getProcessingTimeAnalytics = async (req, res) => {
  // Implementation for processing time analytics
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

exports.getApprovalRateAnalytics = async (req, res) => {
  // Implementation for approval rate analytics
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

exports.getVendorPerformanceAnalytics = async (req, res) => {
  // Implementation for vendor performance analytics
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

module.exports = exports;