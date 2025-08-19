const Report = require('../models/report.model');
const Document = require('../models/document.model');
const User = require('../models/user.model');
const Workflow = require('../models/workflow.model');
const emailService = require('../utils/emailService');

const path = require('path');
const fs = require('fs');

// Get all reports (with filtering)
exports.getReports = async (req, res) => {
  try {
    let query = {};

    // Filter by type if provided
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Filter by creator if provided
    if (req.query.createdBy) {
      query.createdBy = req.query.createdBy;
    }

    // Filter for public or own reports
    if (req.user.role !== 'admin') {
      query.$or = [
        { isPublic: true },
        { createdBy: req.user.id }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Report.countDocuments(query);

    // Get reports
    const reports = await Report.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Pagination result
    const pagination = {};
    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
      success: true,
      count: reports.length,
      pagination,
      data: reports,
      total
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch reports',
      error: error.message
    });
  }
};

// Get a single report
exports.getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('schedule.recipients', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user has access to this report
    if (req.user.role !== 'admin' && 
        report.createdBy.toString() !== req.user.id && 
        !report.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this report'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch report',
      error: error.message
    });
  }
};

// Create a report
exports.createReport = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      type, 
      parameters,
      schedule,
      filters,
      isPublic
    } = req.body;

    // Create report
    const report = await Report.create({
      name,
      description,
      type,
      parameters: parameters || {},
      createdBy: req.user.id,
      schedule: schedule || { isScheduled: false },
      filters: filters || {},
      isPublic: isPublic || false
    });

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not create report',
      error: error.message
    });
  }
};

// Update a report
exports.updateReport = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      type, 
      parameters,
      schedule,
      filters,
      isPublic
    } = req.body;

    let report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && report.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this report'
      });
    }

    // Update fields
    if (name) report.name = name;
    if (description) report.description = description;
    if (type) report.type = type;
    if (parameters) report.parameters = parameters;
    if (schedule) report.schedule = schedule;
    if (filters) report.filters = filters;
    if (isPublic !== undefined) report.isPublic = isPublic;

    await report.save();

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update report',
      error: error.message
    });
  }
};

// Delete a report
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && report.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this report'
      });
    }

    await report.remove();

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not delete report',
      error: error.message
    });
  }
};

// Generate document status report
exports.generateDocumentStatusReport = async (req, res) => {
  try {
    const { startDate, endDate, vendors, documentTypes, statuses } = req.body;

    // Build query
    let query = {};
    
    // Date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Filter by vendors
    if (vendors && vendors.length > 0) {
      query.vendor = { $in: vendors };
    }
    
    // Filter by document types
    if (documentTypes && documentTypes.length > 0) {
      query.documentType = { $in: documentTypes };
    }
    
    // Filter by statuses
    if (statuses && statuses.length > 0) {
      query.status = { $in: statuses };
    }

    // Get documents
    const documents = await Document.find(query)
      .populate('vendor', 'name email company')
      .populate('reviewer', 'name email')
      .sort({ createdAt: -1 });

    // Group by status for summary
    const statusSummary = {};
    documents.forEach(doc => {
      if (!statusSummary[doc.status]) {
        statusSummary[doc.status] = 0;
      }
      statusSummary[doc.status]++;
    });

    // Group by document type
    const typeSummary = {};
    documents.forEach(doc => {
      if (!typeSummary[doc.documentType]) {
        typeSummary[doc.documentType] = 0;
      }
      typeSummary[doc.documentType]++;
    });

    // Create a summary of vendors
    const vendorSummary = {};
    documents.forEach(doc => {
      const vendorId = doc.vendor._id.toString();
      if (!vendorSummary[vendorId]) {
        vendorSummary[vendorId] = {
          name: doc.vendor.name,
          company: doc.vendor.company,
          email: doc.vendor.email,
          totalDocuments: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          under_review: 0
        };
      }
      
      vendorSummary[vendorId].totalDocuments++;
      vendorSummary[vendorId][doc.status]++;
    });

    // Create report data
    const reportData = {
      generatedAt: new Date(),
      filters: {
        startDate,
        endDate,
        vendors,
        documentTypes,
        statuses
      },
      summary: {
        totalDocuments: documents.length,
        byStatus: statusSummary,
        byType: typeSummary,
        byVendor: Object.values(vendorSummary)
      },
      documents: documents.map(doc => ({
        id: doc._id,
        title: doc.title,
        status: doc.status,
        documentType: doc.documentType,
        vendor: {
          id: doc.vendor._id,
          name: doc.vendor.name,
          company: doc.vendor.company
        },
        reviewer: doc.reviewer ? {
          id: doc.reviewer._id,
          name: doc.reviewer.name
        } : null,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        reviewDate: doc.reviewDate
      }))
    };

    // Save report if requested
    if (req.body.saveReport) {
      const report = await Report.create({
        name: req.body.reportName || `Document Status Report - ${new Date().toISOString().split('T')[0]}`,
        description: req.body.description || 'Generated document status report',
        type: 'document_status',
        parameters: reportData.filters,
        createdBy: req.user.id,
        filters: reportData.filters,
        isPublic: req.body.isPublic || false
      });

      reportData.reportId = report._id;
    }

    res.status(200).json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Generate document status report error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not generate document status report',
      error: error.message
    });
  }
};

// Send monthly reminder to vendors with pending documents
exports.sendMonthlyVendorReminders = async (req, res) => {
  try {
    // Get all vendors
    const vendors = await User.find({ role: 'vendor', isActive: true });
    
    // Track successful and failed notifications
    const results = {
      success: [],
      failed: []
    };
    
    // Process each vendor
    for (const vendor of vendors) {
      try {
        // Find pending or partially completed documents for this vendor
        const pendingDocs = await Document.find({
          vendor: vendor._id,
          status: { $in: ['pending', 'under_review', 'rejected'] }
        });
        // If vendor has pending documents, send reminder
        if (pendingDocs.length > 0) {
          // Group documents by status
          const documentsByStatus = {
            pending: [],
            under_review: [],
            rejected: []
          };
          pendingDocs.forEach(doc => {
            documentsByStatus[doc.status].push({
              title: doc.title,
              documentType: doc.documentType,
              status: doc.status,
              updatedAt: doc.updatedAt,
              reviewNotes: doc.reviewNotes
            });
          });
          // Implement WebSocket notification
          const notification = {
            type: 'document_reminder',
            userId: vendor._id,
            message: `You have ${pendingDocs.length} pending document(s) that require your attention`,
            data: {
              pendingCount: documentsByStatus.pending.length,
              underReviewCount: documentsByStatus.under_review.length,
              rejectedCount: documentsByStatus.rejected.length,
              documents: pendingDocs.map(doc => ({
                id: doc._id,
                title: doc.title,
                documentType: doc.documentType,
                status: doc.status,
                updatedAt: doc.updatedAt,
                reviewNotes: doc.reviewNotes
              }))
            },
            timestamp: new Date()
          };
          // Send WebSocket notification
          if (req.io) {
            req.io.to(vendor._id.toString()).emit('notification', notification);
          }

          // Send email reminder
          try {
            const emailResult = await emailService.sendBulkVendorReminders([{
              vendor: vendor,
              pendingDocuments: pendingDocs
            }]);
            
            results.success.push({
              vendor: {
                id: vendor._id,
                name: vendor.name,
                email: vendor.email
              },
              documentsCount: pendingDocs.length,
              emailSent: emailResult.success,
              emailError: emailResult.success ? null : emailResult.error
            });
          } catch (emailError) {
            console.error(`Error sending email to vendor ${vendor.email}:`, emailError);
            results.success.push({
              vendor: {
                id: vendor._id,
                name: vendor.name,
                email: vendor.email
              },
              documentsCount: pendingDocs.length,
              emailSent: false,
              emailError: emailError.message
            });
          }
        } else {
          results.failed.push({
            vendor: {
              id: vendor._id,
              name: vendor.name,
              email: vendor.email
            },
            error: 'No pending documents found'
          });
        }
      } catch (vendorError) {
        console.error(`Error processing vendor ${vendor.email}:`, vendorError);
        results.failed.push({
          vendor: {
            id: vendor._id,
            name: vendor.name,
            email: vendor.email
          },
          error: vendorError.message
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        totalVendors: vendors.length,
        notificationsSent: results.success.length,
        notificationsFailed: results.failed.length,
        details: results
      }
    });
  } catch (error) {
    console.error('Send monthly vendor reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not send monthly vendor reminders',
      error: error.message
    });
  }
};

// Generate vendor aging report - shows days since last compliance document upload
exports.generateAgingReport = async (req, res) => {
  try {
    console.log('Generating vendor aging report...');
    
    // Get all vendors
    const vendors = await User.find({ role: 'vendor' })
      .select('name email company vendorId assignedConsultant isActive');

    console.log(`Found ${vendors.length} vendors`);
    
    // Get all consultants for mapping
    const consultants = await User.find({ role: 'consultant' })
      .select('name email');
    
    console.log(`Found ${consultants.length} consultants`);
    
    const consultantMap = {};
    consultants.forEach(consultant => {
      consultantMap[consultant._id.toString()] = consultant.name;
    });

    const now = new Date();
    const vendorAgingReport = [];

    // Process each vendor
    for (const vendor of vendors) {
      try {
        // Find the most recent compliance document for this vendor
        const latestDocument = await Document.findOne({
          vendor: vendor._id,
          // Filter for compliance documents only - using enum value directly
          documentType: 'compliance'
        })
        .sort({ createdAt: -1 })
        .select('createdAt documentType title');
        
        // If no compliance documents found, check for any documents
        let fallbackDocument = null;
        if (!latestDocument) {
          fallbackDocument = await Document.findOne({
            vendor: vendor._id
          })
          .sort({ createdAt: -1 })
          .select('createdAt documentType title');
        }

        let daysSinceLastUpload = null;
        let lastUploadDate = null;
        let status = 'Non-Compliant';
        let documentToUse = latestDocument || fallbackDocument;

        if (documentToUse) {
          // Calculate days since last upload
          daysSinceLastUpload = Math.floor((now - documentToUse.createdAt) / (1000 * 60 * 60 * 24));
          lastUploadDate = documentToUse.createdAt;
          
          // Determine compliance status (compliant if uploaded within 30 days and is compliance document)
          if (latestDocument && daysSinceLastUpload <= 30) {
            status = 'Compliant';
          } else {
            status = 'Non-Compliant';
          }
        } else {
          // No documents found at all
          daysSinceLastUpload = 'N/A';
          lastUploadDate = null;
          status = 'Non-Compliant';
        }

        // Get assigned consultant name
        const assignedConsultantName = vendor.assignedConsultant 
          ? consultantMap[vendor.assignedConsultant.toString()] || 'Unassigned'
          : 'Unassigned';

        vendorAgingReport.push({
          id: vendor._id,
          vendorName: vendor.name,
          vendorId: vendor.vendorId || vendor._id.toString().slice(-6).toUpperCase(),
          company: vendor.company || 'N/A',
          email: vendor.email,
          assignedConsultant: assignedConsultantName,
          lastDocumentUploadDate: lastUploadDate,
          daysSinceLastUpload: daysSinceLastUpload,
          status: status,
          lastDocumentType: documentToUse ? documentToUse.documentType : 'N/A'
        });

      } catch (vendorError) {
        console.error(`Error processing vendor ${vendor.email}:`, vendorError);
        // Add vendor with error status
        vendorAgingReport.push({
          id: vendor._id,
          vendorName: vendor.name,
          vendorId: vendor.vendorId || vendor._id.toString().slice(-6).toUpperCase(),
          company: vendor.company || 'N/A',
          email: vendor.email,
          assignedConsultant: 'Unassigned',
          lastDocumentUploadDate: null,
          daysSinceLastUpload: 'Error',
          status: 'Error',
          lastDocumentType: 'N/A'
        });
      }
    }

    // Calculate summary statistics
    const summary = {
      totalVendors: vendorAgingReport.length,
      compliantVendors: vendorAgingReport.filter(v => v.status === 'Compliant').length,
      nonCompliantVendors: vendorAgingReport.filter(v => v.status === 'Non-Compliant').length,
      errorVendors: vendorAgingReport.filter(v => v.status === 'Error').length,
      averageDaysSinceUpload: 0
    };

    // Calculate average days (excluding N/A and Error values)
    const validDays = vendorAgingReport
      .filter(v => typeof v.daysSinceLastUpload === 'number')
      .map(v => v.daysSinceLastUpload);
    
    if (validDays.length > 0) {
      summary.averageDaysSinceUpload = Math.round(
        validDays.reduce((sum, days) => sum + days, 0) / validDays.length
      );
    }

    console.log(`Generated aging report for ${vendorAgingReport.length} vendors`);
    console.log('Summary:', summary);

    res.status(200).json({
      success: true,
      data: {
        generatedAt: now,
        summary,
        vendors: vendorAgingReport
      }
    });

  } catch (error) {
    console.error('Generate vendor aging report error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not generate vendor aging report',
      error: error.message
    });
  }
};