import React, { useState, useEffect, useRef } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../components/layout/MainLayout';
import apiService from '../../utils/api';
import { getMimeTypeFromFileName } from '../../utils/mimeTypes';
import { format, parseISO } from 'date-fns';
import { generateVerificationReport, generateComplianceVerificationReport, preloadLogos, clearLogoCache } from '../../utils/pdfUtils';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  DocumentCheckIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';

// Define API_PREFIX for logging purposes
const API_PREFIX = '/api';

interface Vendor {
  _id: string;
  name: string;
  email: string;
  company: string;
  workLocation?: string;
  agreementPeriod?: string;
  contractStartDate?: string;
  contractEndDate?: string;
}

interface Document {
  _id: string;
  title: string;
  documentType: string;
  submissionDate: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'resubmitted';
  fileCount: number;
  vendorId: string;
  submissionId?: string;
  reviewNotes?: string;
  files?: Array<{
    _id: string;
    fileName: string;
    filePath: string;
    fileType: string;
    uploadDate: string;
  }>;
}

interface Submission {
  _id: string;
  submissionDate: string;
  documents: Document[];
}

interface FilterOptions {
  year: number;
  month: string;
  status: string;
}

const VendorDocumentsPage: React.FC = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]); // Keep for compatibility with existing functions
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]); // Keep for compatibility
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [approvalStatus, setApprovalStatus] = useState<'approved' | 'rejected' | null>(null);
  const [processingApproval, setProcessingApproval] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    year: new Date().getFullYear(),
    month: 'all',
    status: 'all'
  });
  const [showReportModal, setShowReportModal] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<boolean | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  
  // Upload document states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploadDocumentType, setUploadDocumentType] = useState('COMPLIANCE_CERTIFICATE');
  const [uploadTitle, setUploadTitle] = useState('COMPLIANCE_CERTIFICATE');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Compliance form states
  const [showComplianceForm, setShowComplianceForm] = useState(false);
  const [auditFindings, setAuditFindings] = useState('');
  const [complianceStatus, setComplianceStatus] = useState('');
  const [complianceRemarks, setComplianceRemarks] = useState('');

  // Fetch vendor and documents data
  useEffect(() => {
    const fetchData = async () => {
      if (!vendorId) {
        console.error('No vendorId provided in URL parameters');
        return;
      }
      
      // Wait for user to be loaded before proceeding
      if (!user) {
        console.log('User not loaded yet, waiting...');
        return;
      }
      
      console.log('Fetching data for vendor ID:', vendorId);
      
      // Clear cache and preload logos for PDF generation
      clearLogoCache();
      preloadLogos().catch(error => console.warn('Failed to preload logos:', error));

      await refreshData();
    };

    fetchData();
  }, [vendorId, user]);

  // Auto-refresh when page regains focus (user comes back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && vendorId) {
        console.log('Page regained focus, refreshing data...');
        refreshData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [vendorId]);

  // Filter submissions based on search query, status, and date filters
  useEffect(() => {
    let filteredSubs = [...submissions];
    
    // Apply filters to submissions
    filteredSubs = filteredSubs.map(submission => {
      let filteredDocs = [...submission.documents];
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredDocs = filteredDocs.filter(doc => 
          doc.title.toLowerCase().includes(query) || 
          doc.documentType.toLowerCase().includes(query)
        );
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        filteredDocs = filteredDocs.filter(doc => doc.status === statusFilter);
      }
      
      // Apply date filters
      if (filterOptions.year && filterOptions.year !== 0) {
        filteredDocs = filteredDocs.filter(doc => {
          const docDate = new Date(doc.submissionDate);
          return docDate.getFullYear() === filterOptions.year;
        });
      }
      
      if (filterOptions.month && filterOptions.month !== 'all') {
        const monthMap: { [key: string]: number } = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        
        filteredDocs = filteredDocs.filter(doc => {
          const docDate = new Date(doc.submissionDate);
          const docMonth = docDate.getMonth();
          const targetMonth = monthMap[filterOptions.month];
          return docMonth === targetMonth;
        });
      }
      
      // Filter out compliance certificates from the filtered documents
      const nonComplianceDocs = filteredDocs.filter((doc: Document) => doc.documentType !== 'COMPLIANCE_CERTIFICATE');
      
      return {
        ...submission,
        documents: nonComplianceDocs
      };
    }).filter(submission => submission.documents.length > 0); // Only keep submissions with documents after filtering
    
    setFilteredSubmissions(filteredSubs);
    
    // Also update filtered documents for compatibility
    const flatFiltered = filteredSubs.flatMap(sub => sub.documents);
    setFilteredDocuments(flatFiltered);
  }, [submissions, searchQuery, statusFilter, filterOptions]);

  // Only consultants and admins can access this page
  if (!user || (user.role !== 'consultant' && user.role !== 'admin')) {
    return <Navigate to="/dashboard" />;
  }

  // Function to refresh data
  const refreshData = async () => {
    if (!vendorId) return;
    
    try {
      setLoading(true);
      setError(null);

      // Fetch vendor details
      const vendorResponse = await apiService.users.getById(vendorId);
      if (vendorResponse.data.success) {
        const vendorData = vendorResponse.data.data;
        
        // Check if this vendor is assigned to the current consultant
        const assignedConsultantId = typeof vendorData.assignedConsultant === 'object' 
          ? vendorData.assignedConsultant?._id || vendorData.assignedConsultant?.id
          : vendorData.assignedConsultant;
        
        const currentUserId = user?._id || user?.id;
        
        console.log('Permission check:', {
          vendorId: vendorData._id,
          vendorName: vendorData.name,
          assignedConsultantId,
          currentUserId,
          userRole: user?.role,
          assignedConsultantObject: vendorData.assignedConsultant
        });
        
        if (assignedConsultantId && assignedConsultantId === currentUserId) {
          console.log('Permission granted: Vendor is assigned to current consultant');
          setVendor(vendorData);
        } else {
          // Check if the user is an admin (admins can view all vendors)
          if (user?.role !== 'admin') {
            console.log('Permission denied: Vendor not assigned to current consultant and user is not admin');
            setError('You do not have permission to view this vendor');
            setLoading(false);
            return;
          } else {
            // Admin can view all vendors
            console.log('Permission granted: User is admin');
            setVendor(vendorData);
          }
        }
      } else {
        setError('Failed to load vendor details');
      }

      // Fetch vendor documents using the document-submissions API
      const documentsResponse = await apiService.documents.getVendorSubmissions({ 
        vendorId: vendorId,
        consultantId: user?.id,
        checkAssignment: true
      });
      
      if (documentsResponse.data.success) {
        // Helper function to ensure valid dates - preserve original dates when possible
        const ensureValidDate = (dateStr: string | undefined) => {
          console.log('ensureValidDate input:', dateStr, 'type:', typeof dateStr);
          if (!dateStr) {
            console.log('Date string is empty, returning null for better handling');
            return null; // Return null instead of current date
          }
          
          // Handle various date formats
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) {
            console.log('Invalid date detected:', dateStr, 'returning null');
            return null; // Return null instead of current date
          }
          console.log('Valid date found:', dateStr, 'parsed as:', date.toISOString());
          return dateStr;
        };

        // Transform the data to grouped submissions
        const transformedSubmissions = documentsResponse.data.data.map((submission: any) => {
          console.log('Processing submission with date fields:', {
            _id: submission._id,
            submissionDate: submission.submissionDate,
            createdAt: submission.createdAt,
            lastModifiedDate: submission.lastModifiedDate
          });
          
          if (!submission.documents || submission.documents.length === 0) {
            return null;
          }
          
          const transformedDocuments = submission.documents.map((doc: any) => {
              // Log all available fields in the document for debugging
              console.log(`RefreshData - Document ${doc.documentName} fields:`, {
                reviewNotes: doc.reviewNotes,
                consultantRemarks: doc.consultantRemarks,
                remarks: doc.remarks,
                notes: doc.notes,
                status: doc.status
              });
              
              let normalizedStatus = (doc.status || 'pending').toLowerCase().trim();
              
              console.log('Document', doc.documentName, 'original status:', doc.status, 'normalized:', normalizedStatus);
              
              // Comprehensive status normalization
              if (normalizedStatus === 'review' || normalizedStatus === 'in_review' || normalizedStatus === 'under_review') {
                normalizedStatus = 'under_review';
              } else if (normalizedStatus === 'submitted' || normalizedStatus === 'new' || normalizedStatus === '' || 
                         normalizedStatus === 'upload' || normalizedStatus === 'uploaded' || !doc.status) {
                normalizedStatus = 'pending';
              } else if (normalizedStatus === 'approve' || normalizedStatus === 'accept' || normalizedStatus === 'accepted') {
                normalizedStatus = 'approved';
              } else if (normalizedStatus === 'reject' || normalizedStatus === 'deny' || normalizedStatus === 'denied') {
                normalizedStatus = 'rejected';
              } else if (normalizedStatus === 'resubmit' || normalizedStatus === 're-submit' || normalizedStatus === 'resubmission') {
                normalizedStatus = 'resubmitted';
              }
              
              console.log('Document', doc.documentName, 'final normalized status:', normalizedStatus);
            
            let processedFiles: any[] = [];
            
            if (doc.files && doc.files.length > 0) {
              processedFiles = doc.files.map((file: any) => ({
                _id: file._id || 'file-' + Math.random().toString(36).substr(2, 9),
                fileName: file.fileName || 'unknown.pdf',
                filePath: file.filePath || '',
                fileType: file.fileType || 'application/pdf',
                uploadDate: ensureValidDate(file.uploadDate || submission.createdAt || submission.submissionDate) || new Date().toISOString()
              }));
            } else if (doc.filePath && typeof doc.filePath === 'string') {
              processedFiles = [{
                _id: 'file-' + Math.random().toString(36).substr(2, 9),
                fileName: doc.fileName || doc.documentName || 'document.pdf',
                filePath: doc.filePath,
                fileType: doc.fileType || 'application/pdf',
                uploadDate: ensureValidDate(submission.createdAt || submission.submissionDate) || new Date().toISOString()
              }];
            }
            
            return {
              _id: doc._id,
              title: doc.documentName || 'Unnamed Document',
              documentType: doc.documentType || 'Unknown Type',
              submissionDate: ensureValidDate(submission.createdAt || submission.submissionDate) || new Date().toISOString(),
              status: normalizedStatus,
              fileCount: processedFiles.length || 0,
              vendorId: vendorId || '',
              submissionId: submission._id,
              reviewNotes: doc.reviewNotes || doc.consultantRemarks || doc.remarks || doc.notes || '',
              files: processedFiles
            };
          });

          // Filter out compliance certificate documents from this submission
          const nonComplianceDocuments = transformedDocuments.filter((doc: any) => {
            const docType = (doc.documentType || '').toUpperCase().trim();
            const isCompliance = docType === 'COMPLIANCE_CERTIFICATE' || 
                                docType === 'COMPLIANCE CERTIFICATE' ||
                                docType.includes('COMPLIANCE') && docType.includes('CERTIFICATE');

            return !isCompliance;
          });
          
          // Only return submission if it has non-compliance documents
          if (nonComplianceDocuments.length === 0) {
            return null;
          }

          return {
            _id: submission._id,
            submissionDate: ensureValidDate(submission.createdAt || submission.submissionDate) || new Date().toISOString(),
            documents: nonComplianceDocuments
          };
        }).filter(Boolean);
        
        // Also maintain flattened documents for compatibility with existing functions
        const allDocuments = transformedSubmissions.flatMap((sub: any) => sub.documents);
        
        setSubmissions(transformedSubmissions);
        setFilteredSubmissions(transformedSubmissions);
        setDocuments(allDocuments);
        setFilteredDocuments(allDocuments);
      } else {
        console.error('Failed to fetch documents:', documentsResponse.data.message);
        setError('Failed to load documents');
      }
    } catch (err: any) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  // Function to clean up stale documents
  const cleanupStaleDocuments = async (documentsList: Document[]) => {
    console.log('Checking for stale documents...');
    
    const validDocuments: Document[] = [];
    const invalidDocuments: Document[] = [];
    
    // Check each document
    for (const doc of documentsList) {
      try {
        const exists = await verifyDocumentExists(doc);
        if (exists) {
          validDocuments.push(doc);
        } else {
          console.log(`Document ${doc._id} no longer exists in the database`);
          invalidDocuments.push(doc);
        }
      } catch (error) {
        // If we can't verify, assume it's valid to avoid data loss
        console.error(`Error verifying document ${doc._id}:`, error);
        validDocuments.push(doc);
      }
    }
    
    if (invalidDocuments.length > 0) {
      console.log(`Found ${invalidDocuments.length} stale documents, updating state...`);
      
      // Update submissions by removing invalid documents
      const updatedSubmissions = submissions.map(submission => ({
        ...submission,
        documents: submission.documents.filter(doc => 
          validDocuments.some(validDoc => validDoc._id === doc._id)
        )
      })).filter(submission => submission.documents.length > 0);
      
      setSubmissions(updatedSubmissions);
      setFilteredSubmissions(updatedSubmissions);
      setDocuments(validDocuments);
      setFilteredDocuments(validDocuments.filter(doc => 
        filteredDocuments.some(filteredDoc => filteredDoc._id === doc._id)
      ));
    }
    
    return validDocuments;
  };

  // Helper function to get year options for filter
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return [
      { value: 0, label: 'All Years' },
      { value: currentYear - 1, label: `${currentYear - 1}` },
      { value: currentYear, label: `${currentYear}` },
      { value: currentYear + 1, label: `${currentYear + 1}` }
    ];
  };

  // Helper function to get month options for filter
  const getMonthOptions = () => {
    return [
      { value: 'all', label: 'All Months' },
      { value: 'Jan', label: 'January' },
      { value: 'Feb', label: 'February' },
      { value: 'Mar', label: 'March' },
      { value: 'Apr', label: 'April' },
      { value: 'May', label: 'May' },
      { value: 'Jun', label: 'June' },
      { value: 'Jul', label: 'July' },
      { value: 'Aug', label: 'August' },
      { value: 'Sep', label: 'September' },
      { value: 'Oct', label: 'October' },
      { value: 'Nov', label: 'November' },
      { value: 'Dec', label: 'December' }
    ];
  };

  // Function to verify if a document still exists in the database
  const verifyDocumentExists = async (document: Document): Promise<boolean> => {
    try {
      const response = await apiService.documents.getById(document._id);
      return response.data.success;
    } catch (error) {
      console.error('Error verifying document existence:', error);
      return false;
    }
  };

  // Handle document approval
  const handleApproveDocument = async (document: Document) => {
    // Show loading state
    setProcessingApproval(true);
    
    // Verify document exists before showing approval modal
    const exists = await verifyDocumentExists(document);
    if (!exists) {
      setError('Document no longer exists. Please refresh the page.');
      setProcessingApproval(false);
      return;
    }

    setSelectedDocument(document);
    setApprovalStatus('approved');
    setRemarks('');
    setShowApprovalModal(true);
    setProcessingApproval(false);
  };

  // Handle document rejection
  const handleRejectDocument = async (document: Document) => {
    // Show loading state
    setProcessingApproval(true);
    
    // Verify document exists before showing rejection modal
    const exists = await verifyDocumentExists(document);
    if (!exists) {
      setError('Document no longer exists. Please refresh the page.');
      setProcessingApproval(false);
      return;
    }

    setSelectedDocument(document);
    setApprovalStatus('rejected');
    setRemarks('');
    setShowApprovalModal(true);
    setProcessingApproval(false);
  };

  // Submit approval/rejection
  const handleSubmitApproval = async () => {
    if (!selectedDocument || !approvalStatus || !remarks.trim()) {
      return;
    }

    setProcessingApproval(true);

    try {
      const response = await apiService.documents.updateStatus(selectedDocument._id, approvalStatus, remarks.trim());

      if (response.data.success) {
        // Update the document in the local state
        const updatedSubmissions = submissions.map(submission => ({
          ...submission,
          documents: submission.documents.map(doc =>
            doc._id === selectedDocument._id
              ? { ...doc, status: approvalStatus, reviewNotes: remarks.trim() }
              : doc
          )
        }));

        setSubmissions(updatedSubmissions);
        setFilteredSubmissions(updatedSubmissions);

        // Also update the flattened documents
        const updatedDocuments = documents.map(doc =>
          doc._id === selectedDocument._id
            ? { ...doc, status: approvalStatus, reviewNotes: remarks.trim() }
            : doc
        );
        setDocuments(updatedDocuments);
        setFilteredDocuments(updatedDocuments);

        setShowApprovalModal(false);
        setSelectedDocument(null);
        setApprovalStatus(null);
        setRemarks('');
      } else {
        setError('Failed to update document status');
      }
    } catch (error: any) {
      console.error('Error updating document status:', error);
      setError('Failed to update document status');
    } finally {
      setProcessingApproval(false);
    }
  };

  // Handle file download
  const handleDownloadFile = async (file: any) => {
    try {
      // Use filePath if available, otherwise fall back to _id
      const filePathOrId = file.filePath || file._id;
      console.log('Downloading file with path/id:', filePathOrId, 'fileName:', file.fileName);
      console.log('Full file object:', file);
      
      const response = await apiService.documents.downloadFile(filePathOrId, file.fileName);
      
      console.log('Download response headers:', response.headers);
      console.log('Download response content-type:', response.headers['content-type']);
      console.log('Download response size:', response.data.size || response.data.length);
      
      // Check if the response is actually a PDF compliance report
      if (response.headers['content-type'] === 'application/pdf' && response.data.size > 100000) {
        console.warn('Response appears to be a large PDF, might be a compliance report instead of the requested file');
      }
      
      // Create blob and download
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/octet-stream' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('File download completed successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Failed to download file');
    }
  };

  // Handle report generation
  const handleGenerateReport = async () => {
    if (!vendor) return;

    setGeneratingReport(true);
    setReportSuccess(null);
    setReportError(null);

    try {
      const vendorData = {
        name: vendor.name,
        company: vendor.company,
        email: vendor.email,
        address: vendor.workLocation || ''
      };

      const documentData = documents.map(doc => ({
        title: doc.title,
        documentType: doc.documentType,
        status: doc.status,
        submissionDate: doc.submissionDate,
        reviewNotes: doc.reviewNotes || '',
        fileCount: doc.fileCount
      }));

      await generateVerificationReport(vendorData, documentData, `Document Verification Report - ${vendor.name}`);
      setReportSuccess(true);
    } catch (error: any) {
      console.error('Error generating report:', error);
      setReportError(error.message || 'Failed to generate report');
      setReportSuccess(false);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Helper function to filter out compliance certificate documents
  const filterOutComplianceCertificates = (documents: any[]) => {
    return documents.filter(doc => {
      const docType = (doc.documentType || '').toUpperCase().trim();
      const isCompliance = docType === 'COMPLIANCE_CERTIFICATE' || 
                          docType === 'COMPLIANCE CERTIFICATE' ||
                          docType.includes('COMPLIANCE') && docType.includes('CERTIFICATE');
      return !isCompliance;
    });
  };

  // Helper function to check if all documents in a submission are approved
  const areAllDocumentsApproved = (submission: Submission): boolean => {
    const filteredDocuments = filterOutComplianceCertificates(submission.documents);
    return filteredDocuments.length > 0 && filteredDocuments.every(doc => doc.status === 'approved');
  };

  // Generate compliance verification report for a specific submission
  const handleGenerateComplianceReport = async (submission: Submission) => {
    setGeneratingReport(true);
    setReportSuccess(null);
    setReportError(null);
    
    try {
      if (!vendor) {
        throw new Error('Vendor information not available');
      }

      // Debug: Log all vendor fields to see what's available
      console.log('Vendor object for compliance report:', vendor);
      console.log('Available vendor fields:', Object.keys(vendor));

      const vendorData = {
        name: vendor.name,
        company: vendor.company,
        email: vendor.email,
        address: vendor.workLocation || '',
        contractPeriod: (vendor.contractStartDate && vendor.contractEndDate ? 
            `${format(new Date(vendor.contractStartDate), 'MMM dd, yyyy')} - ${format(new Date(vendor.contractEndDate), 'MMM dd, yyyy')}` : 
            vendor.agreementPeriod || 'Not specified')
      };

      console.log('Processed vendor data for PDF:', vendorData);

      // Calculate compliance metrics (excluding compliance certificates)
      const filteredDocuments = filterOutComplianceCertificates(submission.documents);
      const totalDocuments = filteredDocuments.length;
      const approvedDocuments = filteredDocuments.filter(doc => doc.status === 'approved').length;
      const rejectedDocuments = filteredDocuments.filter(doc => doc.status === 'rejected').length;
      const pendingDocuments = filteredDocuments.filter(doc => doc.status === 'pending' || doc.status === 'under_review').length;

      // Prevent report generation if any documents are rejected
      if (rejectedDocuments > 0) {
        throw new Error(`Cannot generate compliance verification report. This submission contains ${rejectedDocuments} rejected document(s). All documents must be approved to generate the report.`);
      }
      
      // Calculate compliance rate based on approved + rejected (processed documents)
      const processedDocuments = approvedDocuments + rejectedDocuments;
      const complianceRate = processedDocuments > 0 ? Math.round((approvedDocuments / processedDocuments) * 100) : 0;
      
      const complianceMetrics = {
        totalDocuments,
        approvedDocuments,
        rejectedDocuments,
        pendingDocuments,
        complianceRate,
        auditFindings: auditFindings.trim(),
        auditReview: auditFindings.trim(),
        complianceStatus: complianceStatus,
        complianceRemarks: complianceRemarks.trim(),
        remarks: complianceRemarks.trim(),
        submissionDate: submission.submissionDate,
        reviewDate: new Date().toISOString(),
        reviewedBy: user?.name || 'Consultant',
        auditorName: user?.name || 'System Consultant',
        hasRejectedDocuments: rejectedDocuments > 0
      };

      const submissionData = {
        _id: submission._id,
        submissionDate: submission.submissionDate,
        workLocation: vendor.workLocation || 'Not specified',
        locationOfWork: vendor.workLocation || 'Not specified',
        agreementPeriod: (vendor.contractStartDate && vendor.contractEndDate ? 
            `${format(new Date(vendor.contractStartDate), 'MMM dd, yyyy')} - ${format(new Date(vendor.contractEndDate), 'MMM dd, yyyy')}` : 
            vendor.agreementPeriod || 'Not specified'),
        month: format(new Date(submission.submissionDate), 'MMMM'),
        year: format(new Date(submission.submissionDate), 'yyyy'),
        documents: filteredDocuments.map(doc => ({
          _id: doc._id,
          title: doc.title,
          documentType: doc.documentType,
          submissionDate: doc.submissionDate,
          status: doc.status,
          reviewNotes: doc.reviewNotes || '',
          fileCount: doc.fileCount,
          files: doc.files || []
        }))
      };

      // Generate the PDF using our utility function
      const pdf = await generateComplianceVerificationReport(
        vendorData,
        submissionData,
        complianceMetrics,
        'Compliance Verification Report'
      );

      // Save the PDF with submission ID
      pdf.save(`${vendor?.name || 'vendor'}_compliance_verification_${submission._id.slice(-8)}.pdf`);

      setReportSuccess(true);
      alert('Compliance verification report generated successfully!');
      
      // Close the compliance form modal
      resetComplianceForm();
    } catch (error) {
      console.error('Error generating compliance verification report:', error);
      setReportError('Failed to generate compliance verification report');
      setReportSuccess(false);
      alert('Failed to generate compliance verification report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Handle compliance form submission
  const handleComplianceFormSubmit = async () => {
    if (!auditFindings.trim() || !complianceStatus.trim() || !complianceRemarks.trim()) {
      alert('Please fill in all compliance form fields before generating the report.');
      return;
    }
    
    // Find the submission based on the stored document
    if (!selectedDocument || !selectedDocument.submissionId) {
      alert('No submission selected. Please try again.');
      return;
    }
    
    // Find the submission in the submissions array
    const submission = submissions.find(sub => sub._id === selectedDocument.submissionId);
    
    if (!submission) {
      alert('Could not find the selected submission. Please try again.');
      return;
    }
    
    // Generate the compliance report with the form data
    await handleGenerateComplianceReport(submission);
  };

  // Reset compliance form
  const resetComplianceForm = () => {
    setAuditFindings('');
    setComplianceStatus('');
    setComplianceRemarks('');
    setShowComplianceForm(false);
  };

  // Handle document upload
  const handleUploadDocuments = async () => {
    if (!uploadFiles || uploadFiles.length === 0 || !uploadDocumentType || !uploadTitle.trim()) {
      setUploadError('Please fill in all required fields and select files to upload');
      return;
    }

    if (!vendorId) {
      setUploadError('Vendor ID is required');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      
      // Add files to form data
      Array.from(uploadFiles).forEach((file, index) => {
        formData.append('documents', file);
      });
      
      // Add metadata
      formData.append('vendorId', vendorId);
      formData.append('documentType', uploadDocumentType);
      formData.append('title', uploadTitle.trim());
      formData.append('uploadedBy', user?.id || '');
      formData.append('uploadedByName', user?.name || 'Consultant');
      
      // Add current month and year for document tracking
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleString('default', { month: 'short' });
      const currentYear = currentDate.getFullYear();
      formData.append('month', currentMonth);
      formData.append('year', currentYear.toString());

      console.log('Uploading documents:', {
        vendorId,
        documentType: uploadDocumentType,
        title: uploadTitle,
        fileCount: uploadFiles.length,
        files: Array.from(uploadFiles).map(f => ({ name: f.name, size: f.size, type: f.type }))
      });

      // Upload documents using the API
      const response = await apiService.documents.uploadVendorDocuments(formData);

      if (response.data.success) {
        setUploadSuccess(`Successfully uploaded ${uploadFiles.length} document(s)`);
        
        // Reset form
        setUploadFiles(null);
        setUploadDocumentType('');
        setUploadTitle('');
        
        // Refresh the documents list
        await refreshData();
        
        // Close modal after a short delay
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadSuccess(null);
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to upload documents');
      }
    } catch (error: any) {
      console.error('Error uploading documents:', error);
      setUploadError(error.response?.data?.message || error.message || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  // Reset upload form when modal closes
  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setUploadFiles(null);
    setUploadDocumentType('COMPLIANCE_CERTIFICATE');
    setUploadTitle('COMPLIANCE_CERTIFICATE');
    setUploadError(null);
    setUploadSuccess(null);
  };

  // Generate document verification report for a specific submission
  const handleGenerateSubmissionReport = async (submission: Submission) => {
    if (!vendor) return;

    setGeneratingReport(true);
    setReportSuccess(null);
    setReportError(null);

    try {
      const vendorData = {
        name: vendor.name,
        company: vendor.company,
        email: vendor.email,
        address: vendor.workLocation || ''
      };

      // Filter out compliance certificates and map to the expected format
      console.log('Original submission documents:', submission.documents);
      const filteredDocuments = filterOutComplianceCertificates(submission.documents);
      console.log('Filtered documents (after removing compliance certificates):', filteredDocuments);
      
      const documentData = filteredDocuments.map(doc => ({
        title: doc.title,
        documentType: doc.documentType,
        status: doc.status,
        submissionDate: doc.submissionDate,
        reviewNotes: doc.reviewNotes || '',
        remarks: doc.reviewNotes || 'Document verified successfully',
        fileCount: doc.fileCount
      }));

      console.log('Document data for verification report:', documentData);

      await generateVerificationReport(vendorData, documentData, `Document Verification Report - ${vendor.name} - ${submission._id.slice(-8)}`);
      setReportSuccess(true);
    } catch (error: any) {
      console.error('Error generating submission report:', error);
      setReportError(error.message || 'Failed to generate submission report');
      setReportSuccess(false);
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hidden image for logo reference (not displayed) */}
          <img 
            ref={logoRef}
            src="/logo.png" 
            alt="Logo" 
            className="hidden"
            onError={(e) => {
              console.log('Logo failed to load, will use placeholder in PDF');
            }}
          />
          
          {/* Back button and header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <Link to="/consultant/vendors">
                <Button variant="outline" size="md" className="flex items-center px-4 py-2">
                  <ChevronLeftIcon className="h-5 w-5 mr-2" />
                  Back to Vendors
                </Button>
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {vendor?.name}'s Documents
              </h1>
            </div>
          </div>
        
          {/* Vendor info card */}
          {vendor && (
            <Card className="mb-8 shadow-lg">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Company</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{vendor.company}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{vendor.email}</p>
                      </div>
                      {vendor.workLocation && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Work Location</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{vendor.workLocation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Error state */}
          {error && (
            <Card className="mb-8 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <div className="p-6">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Loading state */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Search and Filter Controls */}
              <Card className="mb-8 shadow-lg">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="flex-1 max-w-md">
                      <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search documents..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="min-w-[140px]"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="under_review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="resubmitted">Resubmitted</option>
                      </Select>
                      
                      <Button
                        variant="outline"
                        onClick={() => setShowFilterModal(true)}
                        className="flex items-center px-4 py-2"
                      >
                        <FunnelIcon className="h-5 w-5 mr-2" />
                        Filters
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={refreshData}
                        disabled={loading}
                        className="flex items-center px-4 py-2"
                      >
                        <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                      
                      <Button 
                        variant="primary" 
                        onClick={() => setShowUploadModal(true)}
                        disabled={!vendor}
                        className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-md"
                      >
                        <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                        Upload Documents
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Documents List */}
              {filteredSubmissions.length === 0 ? (
                <Card className="shadow-lg">
                  <div className="p-12 text-center">
                    <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No documents found</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchQuery || statusFilter !== 'all' ? 
                        'Try adjusting your search or filter criteria.' : 
                        'This vendor has not submitted any documents yet.'
                      }
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-8">
                  {filteredSubmissions.map((submission) => (
                    <Card key={submission._id} className="shadow-lg">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                            <CalendarIcon className="h-5 w-5 mr-2 text-gray-500" />
                            Submitted on {format(parseISO(submission.submissionDate), 'PPP')}
                          </h3>
                          <Badge variant="secondary" className="text-sm">
                            {submission.documents.length} document{submission.documents.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {submission.documents.map((document) => (
                            <motion.div
                              key={document._id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Card className="h-full flex flex-col border-l-4 border-l-blue-400 hover:shadow-lg transition-all duration-200 hover:scale-105">
                                <div className="flex-grow p-6">
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                                      {document.title}
                                    </h4>
                                    <div className="flex-shrink-0">
                                      {document.status === 'pending' && (
                                        <Badge variant="warning" className="px-3 py-1 text-sm font-medium">
                                          ⏳ Pending
                                        </Badge>
                                      )}
                                      {document.status === 'under_review' && (
                                        <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
                                          🔍 Under Review
                                        </Badge>
                                      )}
                                      {document.status === 'approved' && (
                                        <Badge variant="success" className="px-3 py-1 text-sm font-medium">
                                          ✅ Approved
                                        </Badge>
                                      )}
                                      {document.status === 'rejected' && (
                                        <Badge variant="danger" className="px-3 py-1 text-sm font-medium">
                                          ❌ Rejected
                                        </Badge>
                                      )}
                                      {document.status === 'resubmitted' && (
                                        <Badge variant="warning" className="px-3 py-1 text-sm font-medium">
                                          🔄 Resubmitted
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-3 mb-4">
                                    <p className="text-base text-gray-600 dark:text-gray-400">
                                      <span className="font-semibold text-gray-800 dark:text-gray-200">Type:</span> {document.documentType}
                                    </p>
                                    
                                    <p className="text-base text-gray-600 dark:text-gray-400">
                                      <span className="font-semibold text-gray-800 dark:text-gray-200">Files:</span> {document.fileCount} file{document.fileCount !== 1 ? 's' : ''}
                                    </p>
                                    
                                    {document.reviewNotes && (
                                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          <span className="font-semibold text-gray-800 dark:text-gray-200">Remarks:</span>
                                        </p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                          {document.reviewNotes}
                                        </p>
                                      </div>
                                    )}
                                    
                                    {document.status === 'resubmitted' && (
                                      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 p-3 rounded-lg">
                                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                                          📄 This document has been resubmitted with new files. Please review the updated version.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    <Button
                                      variant="outline"
                                      size="md"
                                      onClick={() => {
                                        setSelectedDocument(document);
                                        setShowDocumentModal(true);
                                      }}
                                      className="flex items-center justify-center px-4 py-2 text-base font-medium w-full"
                                    >
                                      <EyeIcon className="h-5 w-5 mr-2" />
                                      View Details
                                    </Button>
                                    
                                    {document.status !== 'approved' && (
                                      <Button
                                        variant="success"
                                        size="md"
                                        onClick={() => handleApproveDocument(document)}
                                        className="flex items-center justify-center px-4 py-2 text-base font-medium w-full"
                                      >
                                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                                        Approve
                                      </Button>
                                    )}
                                    
                                    {document.status !== 'rejected' && (
                                      <Button
                                        variant="danger"
                                        size="md"
                                        onClick={() => handleRejectDocument(document)}
                                        className="flex items-center justify-center px-4 py-2 text-base font-medium w-full"
                                      >
                                        <XCircleIcon className="h-5 w-5 mr-2" />
                                        Reject
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                        
                        {/* Report Buttons - Show when documents are processed (approved or rejected) */}
                        {(areAllDocumentsApproved(submission) || submission.documents.some(doc => doc.status === 'rejected')) && (
                          <div className={`mt-8 pt-6 border-t border-gray-200 dark:border-gray-600 rounded-lg p-6 ${
                            areAllDocumentsApproved(submission) 
                              ? 'bg-green-50 dark:bg-green-900' 
                              : 'bg-blue-50 dark:bg-blue-900'
                          }`}>
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              <div className="flex items-center space-x-3">
                                {areAllDocumentsApproved(submission) ? (
                                  <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                                ) : (
                                  <ExclamationTriangleIcon className="h-6 w-6 text-blue-500 flex-shrink-0" />
                                )}
                                <div>
                                  <p className={`text-lg font-semibold ${
                                    areAllDocumentsApproved(submission)
                                      ? 'text-green-700 dark:text-green-300'
                                      : 'text-blue-700 dark:text-blue-300'
                                  }`}>
                                    {areAllDocumentsApproved(submission) 
                                      ? 'All Documents Approved! 🎉'
                                      : 'Documents Processed - Report Available 📋'
                                    }
                                  </p>
                                  <p className={`text-sm ${
                                    areAllDocumentsApproved(submission)
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-blue-600 dark:text-blue-400'
                                  }`}>
                                    {filterOutComplianceCertificates(submission.documents).length} document{filterOutComplianceCertificates(submission.documents).length !== 1 ? 's' : ''} processed - compliance report can be generated
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-3">
                                {/* Document Verification Report button hidden */}
                                {false && (
                                <Button
                                  variant="primary"
                                  size="md"
                                  onClick={() => handleGenerateSubmissionReport(submission)}
                                  disabled={generatingReport}
                                  className="flex items-center px-6 py-3 text-base font-medium bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-md"
                                >
                                  {generatingReport ? (
                                    <>
                                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                                      Generating...
                                    </>
                                  ) : (
                                    <>
                                      <DocumentCheckIcon className="h-5 w-5 mr-3" />
                                      Document Verification Report
                                    </>
                                  )}
                                </Button>
                                )}
                                
                                <Button
                                  variant="secondary"
                                  size="md"
                                  onClick={() => {
                                    // Store the current submission for later use
                                    setSelectedDocument({
                                      _id: submission._id,
                                      title: 'Document Submission',
                                      documentType: 'Submission',
                                      submissionDate: submission.submissionDate,
                                      status: 'pending',
                                      fileCount: filterOutComplianceCertificates(submission.documents).length,
                                      vendorId: vendorId || '',
                                      submissionId: submission._id
                                    });
                                    
                                    // Set default values for the form
                                    setAuditFindings('All submitted documents have been reviewed and verified for compliance with regulatory requirements.');
                                    setComplianceStatus('FULLY_COMPLIANT');
                                    setComplianceRemarks('The vendor has demonstrated satisfactory compliance with all required documentation.');
                                    
                                    // Show the compliance form
                                    setShowComplianceForm(true);
                                  }}
                                  disabled={generatingReport}
                                  className="flex items-center px-6 py-3 text-base font-medium bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-md"
                                >
                                  {generatingReport ? (
                                    <>
                                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                                      Generating...
                                    </>
                                  ) : (
                                    <>
                                      <ChartBarIcon className="h-5 w-5 mr-3" />
                                      Compliance Verification Report
                                    </>
                                  )}
                                </Button>

                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Document Details Modal */}
          <Modal
            isOpen={showDocumentModal}
            onClose={() => setShowDocumentModal(false)}
            title="Document Details"
            size="xl"
          >
            {selectedDocument && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Document Title
                    </label>
                    <p className="text-gray-900 dark:text-white break-words">{selectedDocument.title}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Document Type
                    </label>
                    <p className="text-gray-900 dark:text-white break-words">{selectedDocument.documentType}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Submission Date
                    </label>
                    <p className="text-gray-900 dark:text-white break-words">
                      {format(parseISO(selectedDocument.submissionDate), 'PPp')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </label>
                    <div>
                      <Badge 
                        variant={
                          selectedDocument.status === 'approved' ? 'success' :
                          selectedDocument.status === 'rejected' ? 'danger' :
                          selectedDocument.status === 'under_review' ? 'warning' :
                          selectedDocument.status === 'resubmitted' ? 'info' :
                          'default'
                        }
                      >
                        {selectedDocument.status.charAt(0).toUpperCase() + selectedDocument.status.slice(1).replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>

                {selectedDocument.reviewNotes && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Review Notes
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap break-words leading-relaxed">
                        {selectedDocument.reviewNotes}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Files ({selectedDocument.fileCount})
                  </label>
                  <div className="space-y-3">
                    {selectedDocument.files?.map((file, index) => (
                      <div key={file._id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <DocumentTextIcon className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
                              {file.fileName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">
                              {file.fileType} • Uploaded {format(parseISO(file.uploadDate), 'PPp')}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadFile(file)}
                              className="flex items-center whitespace-nowrap"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDocumentModal(false)}
                  >
                    Close
                  </Button>
                  {selectedDocument.status !== 'approved' && (
                    <Button
                      variant="success"
                      onClick={() => {
                        setShowDocumentModal(false);
                        handleApproveDocument(selectedDocument);
                      }}
                      className="flex items-center"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Approve
                    </Button>
                  )}
                  {selectedDocument.status !== 'rejected' && (
                    <Button
                      variant="danger"
                      onClick={() => {
                        setShowDocumentModal(false);
                        handleRejectDocument(selectedDocument);
                      }}
                      className="flex items-center"
                    >
                      <XCircleIcon className="h-5 w-5 mr-2" />
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Modal>

          {/* Approval Modal */}
          <Modal
            isOpen={showApprovalModal}
            onClose={() => setShowApprovalModal(false)}
            title={`${approvalStatus === 'approved' ? 'Approve' : 'Reject'} Document`}
            size="md"
          >
            {selectedDocument && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    {selectedDocument.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedDocument.documentType} • Submitted {format(parseISO(selectedDocument.submissionDate), 'PPp')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {approvalStatus === 'approved' ? 'Approval' : 'Rejection'} Remarks *
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={`Enter ${approvalStatus === 'approved' ? 'approval' : 'rejection'} remarks...`}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Please provide detailed remarks for your decision.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowApprovalModal(false)}
                    disabled={processingApproval}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant={approvalStatus === 'approved' ? 'success' : 'danger'}
                    onClick={handleSubmitApproval}
                    disabled={processingApproval || !remarks.trim()}
                  >
                    {processingApproval ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        {approvalStatus === 'approved' ? (
                          <CheckCircleIcon className="h-5 w-5 mr-2" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 mr-2" />
                        )}
                        {approvalStatus === 'approved' ? 'Approve' : 'Reject'} Document
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Modal>

          {/* Filter Modal */}
          <Modal
            isOpen={showFilterModal}
            onClose={() => setShowFilterModal(false)}
            title="Filter Documents"
            size="md"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year
                </label>
                <Select
                  value={filterOptions.year.toString()}
                  onChange={(e) => setFilterOptions(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                >
                  {getYearOptions().map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Month
                </label>
                <Select
                  value={filterOptions.month}
                  onChange={(e) => setFilterOptions(prev => ({ ...prev, month: e.target.value }))}
                >
                  {getMonthOptions().map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <Select
                  value={filterOptions.status}
                  onChange={(e) => setFilterOptions(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="resubmitted">Resubmitted</option>
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterOptions({
                      year: new Date().getFullYear(),
                      month: 'all',
                      status: 'all'
                    });
                  }}
                >
                  Reset
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setShowFilterModal(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </Modal>

          {/* Report Generation Modal */}
          <Modal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            title="Generate Verification Report"
            size="md"
          >
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start">
                  <DocumentCheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Document Verification Report
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Generate a comprehensive PDF report containing all document verification details for {vendor?.name}.
                    </p>
                  </div>
                </div>
              </div>

              {reportSuccess !== null && (
                <div className={`border rounded-lg p-4 ${
                  reportSuccess 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-start">
                    {reportSuccess ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 mr-3 mt-0.5" />
                    ) : (
                      <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400 mr-3 mt-0.5" />
                    )}
                    <div>
                      <h4 className={`text-sm font-medium mb-1 ${
                        reportSuccess 
                          ? 'text-green-900 dark:text-green-100' 
                          : 'text-red-900 dark:text-red-100'
                      }`}>
                        {reportSuccess ? 'Report Generated Successfully' : 'Report Generation Failed'}
                      </h4>
                      <p className={`text-sm ${
                        reportSuccess 
                          ? 'text-green-700 dark:text-green-300' 
                          : 'text-red-700 dark:text-red-300'
                      }`}>
                        {reportSuccess 
                          ? 'The verification report has been downloaded to your device.' 
                          : reportError || 'An error occurred while generating the report.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReportModal(false);
                    setReportSuccess(null);
                    setReportError(null);
                  }}
                  disabled={generatingReport}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={handleGenerateReport}
                  disabled={generatingReport || !vendor}
                  className="flex items-center"
                >
                  {generatingReport ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Modal>

          {/* Upload Documents Modal */}
          <Modal
            isOpen={showUploadModal}
            onClose={handleCloseUploadModal}
            title="Upload Documents"
            size="lg"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="Enter document title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Document Type *
                </label>
                <select
                  value={uploadDocumentType}
                  onChange={(e) => setUploadDocumentType(e.target.value)}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white bg-gray-50 dark:bg-gray-700 cursor-not-allowed"
                >
                  <option value="COMPLIANCE_CERTIFICATE">Compliance Certificate</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Files *
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setUploadFiles(e.target.files)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG
                </p>
              </div>
              
              {uploadError && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                    <p>{uploadError}</p>
                  </div>
                </div>
              )}
              
              {uploadSuccess && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    <p>{uploadSuccess}</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCloseUploadModal}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUploadDocuments}
                  disabled={uploading || !uploadFiles || !uploadDocumentType || !uploadTitle.trim()}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <DocumentArrowUpIcon className="h-5 w-5 mr-1" />
                      Upload Documents
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Modal>

          {/* Compliance Form Modal */}
          <Modal
            isOpen={showComplianceForm}
            onClose={resetComplianceForm}
            title="Compliance Verification Report"
            size="lg"
          >
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Audit Findings & Review
                  </label>
                  <textarea
                    value={auditFindings}
                    onChange={(e) => setAuditFindings(e.target.value)}
                    placeholder="Enter detailed audit findings and review comments..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Compliance Status
                  </label>
                  <Select
                    value={complianceStatus}
                    onChange={(e) => setComplianceStatus(e.target.value)}
                    className="w-full"
                    required
                  >
                    <option value="">Select compliance status</option>
                    <option value="FULLY_COMPLIANT">Fully Compliant</option>
                    <option value="PARTIALLY_COMPLIANT">Partially Compliant</option>
                    <option value="NON_COMPLIANT">Non-Compliant</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Compliance Remarks
                  </label>
                  <textarea
                    value={complianceRemarks}
                    onChange={(e) => setComplianceRemarks(e.target.value)}
                    placeholder="Enter specific compliance remarks and recommendations..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    rows={4}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                <Button
                  variant="outline"
                  onClick={resetComplianceForm}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleComplianceFormSubmit}
                  disabled={!auditFindings.trim() || !complianceStatus.trim() || !complianceRemarks.trim()}
                >
                  <DocumentCheckIcon className="h-5 w-5 mr-1" />
                  Generate Report
                </Button>
              </div>
            </div>
          </Modal>

        </div>
      </div>
    </MainLayout>
  );
};

export default VendorDocumentsPage;