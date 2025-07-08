import React, { useState, useEffect, useRef } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../components/layout/MainLayout';
import apiService from '../../utils/api';
import { getMimeTypeFromFileName } from '../../utils/mimeTypes';
import { format, parseISO } from 'date-fns';
import { generateVerificationReport, generateComplianceVerificationReport, preloadLogos, clearLogoCache } from '../../utils/pdfUtils';

// Define API_PREFIX for logging purposes
const API_PREFIX = '/api';
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
  const [uploadDocumentType, setUploadDocumentType] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Compliance report form states
  const [auditFindings, setAuditFindings] = useState('');
  const [complianceStatus, setComplianceStatus] = useState('');
  const [complianceRemarks, setComplianceRemarks] = useState('');
  const [showComplianceForm, setShowComplianceForm] = useState(false);

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

          return {
            _id: submission._id,
            submissionDate: ensureValidDate(submission.createdAt || submission.submissionDate) || new Date().toISOString(),
            documents: transformedDocuments
          };
        }).filter(Boolean);
        
        // Also maintain flattened documents for compatibility with existing functions
        const flatDocuments = transformedSubmissions.flatMap((sub: Submission) => sub.documents);
        
        // Deduplicate documents by ID to prevent counting duplicates
        const uniqueDocuments = flatDocuments.filter((doc: Document, index: number, self: Document[]) => 
          index === self.findIndex((d: Document) => d._id === doc._id)
        );
        
        console.log('Refresh - Document deduplication:', {
          originalCount: flatDocuments.length,
          uniqueCount: uniqueDocuments.length,
          duplicatesRemoved: flatDocuments.length - uniqueDocuments.length
        });
        
        setSubmissions(transformedSubmissions);
        setFilteredSubmissions(transformedSubmissions);
        setDocuments(uniqueDocuments);
        setFilteredDocuments(uniqueDocuments);
        
        // Debug refresh data
        console.log('Refresh - Document analysis:', {
          total: uniqueDocuments.length,
          statusBreakdown: uniqueDocuments.reduce((acc: any, doc: Document) => {
            acc[doc.status] = (acc[doc.status] || 0) + 1;
            return acc;
          }, {}),
          documents: uniqueDocuments.map((doc: Document) => ({
            id: doc._id,
            title: doc.title,
            status: doc.status
          }))
        });
        console.log('Data refreshed successfully');
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
    
    // If we found invalid documents, update the state
    if (invalidDocuments.length > 0) {
      console.log(`Found ${invalidDocuments.length} stale documents out of ${documentsList.length} total`);
      setDocuments(validDocuments);
      setFilteredDocuments(validDocuments.filter(doc => 
        (statusFilter === 'all' || doc.status === statusFilter) &&
        (doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
         doc.documentType.toLowerCase().includes(searchQuery.toLowerCase()))
      ));
      
      // Show a notification to the user
      alert(`${invalidDocuments.length} document(s) that no longer exist in the database have been removed from the view.`);
    }
  };

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
          consultantId: user?.id, // Only get documents for vendors assigned to this consultant
          checkAssignment: true // Add a flag to tell the API to check the assignment
        });
        
        if (documentsResponse.data.success) {
          // Define interfaces for the API response
          interface SubmissionFile {
            _id: string;
            fileName: string;
            filePath: string;
            fileType: string;
            uploadDate: string;
          }
          
          interface SubmissionDocument {
            _id: string;
            documentName: string;
            documentType: string;
            status: string;
            reviewNotes?: string;
            files?: SubmissionFile[];
            // Some APIs might include these properties directly on the document
            filePath?: string;
            fileName?: string;
            fileType?: string;
          }
          
          interface Submission {
            _id: string;
            submissionDate: string;
            documents: SubmissionDocument[];
          }
          
          // Log the API response for debugging
          console.log('Document submissions API response:', documentsResponse.data);
          
          // Helper function to ensure valid dates - preserve original dates when possible
          const ensureValidDate = (dateStr: string | undefined) => {
            console.log('fetchData ensureValidDate input:', dateStr, 'type:', typeof dateStr);
            if (!dateStr) {
              console.log('Date string is empty, returning null for better handling');
              return null; // Return null instead of current date
            }
            
            // Try to parse the date
            const date = new Date(dateStr);
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
              console.log('Invalid date detected:', dateStr, 'returning null');
              return null; // Return null instead of current date
            }
            
            console.log('Valid date found:', dateStr, 'parsed as:', date.toISOString());
            return dateStr;
          };
          
          // Transform the submissions data to grouped submissions
          const transformedSubmissions = documentsResponse.data.data.map((submission: any) => {
            console.log('Processing submission with date fields:', {
              _id: submission._id,
              submissionDate: submission.submissionDate,
              createdAt: submission.createdAt,
              lastModifiedDate: submission.lastModifiedDate
            });
            
            // Check if submission has documents
            if (!submission.documents || submission.documents.length === 0) {
              console.warn('Submission has no documents:', submission);
              return null;
            }
            
            const transformedDocuments = submission.documents.map((doc: any) => {
              // Log all available fields in the document for debugging
              console.log(`Document ${doc.documentName} fields:`, {
                reviewNotes: doc.reviewNotes,
                consultantRemarks: doc.consultantRemarks,
                remarks: doc.remarks,
                notes: doc.notes,
                status: doc.status
              });
              
              // Normalize the status to ensure it matches our expected values
              let normalizedStatus = (doc.status || 'pending').toLowerCase().trim();
              
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
              
              // Log the document files for debugging
              console.log(`Processing document ${doc.documentName}. Files:`, doc.files);
              
              // Process files with detailed logging
              let processedFiles: SubmissionFile[] = [];
              
              if (doc.files && doc.files.length > 0) {
                processedFiles = doc.files.map((file: SubmissionFile, index: number) => {
                  console.log(`Processing file ${index} for document ${doc.documentName}:`, file);
                  
                  // Check if filePath exists and is valid
                  if (!file.filePath) {
                    console.warn(`File ${index} has no filePath:`, file);
                  }
                  
                  return {
                    _id: file._id || 'file-' + Math.random().toString(36).substr(2, 9),
                    fileName: file.fileName || 'unknown.pdf',
                    filePath: file.filePath || '',
                    fileType: file.fileType || 'application/pdf',
                    uploadDate: ensureValidDate(file.uploadDate || submission.createdAt || submission.submissionDate) || new Date().toISOString()
                  };
                });
              } else {
                // If no files array or empty array, create a placeholder file
                console.warn(`Document ${doc.documentName} has no files. Creating placeholder.`);
                
                // Check if the document itself has a filePath property (some APIs structure it this way)
                if (doc.filePath && typeof doc.filePath === 'string') {
                  processedFiles = [{
                    _id: 'file-' + Math.random().toString(36).substr(2, 9),
                    fileName: (doc.fileName as string) || doc.documentName || 'document.pdf',
                    filePath: doc.filePath,
                    fileType: (doc.fileType as string) || 'application/pdf',
                    uploadDate: ensureValidDate(submission.createdAt || submission.submissionDate) || new Date().toISOString()
                  }];
                } else {
                  // Create an empty placeholder
                  processedFiles = [];
                }
              }
              
              // Log the processed files
              console.log(`Processed files for document ${doc.documentName}:`, processedFiles);
              
              const documentObj = {
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
              
              console.log('Transformed document:', documentObj);
              return documentObj;
            });

            return {
              _id: submission._id,
              submissionDate: ensureValidDate(submission.createdAt || submission.submissionDate) || new Date().toISOString(),
              documents: transformedDocuments
            };
          }).filter(Boolean);
          
          // Also maintain flattened documents for compatibility with existing functions
          const flatDocuments = transformedSubmissions.flatMap((sub: Submission) => sub.documents);
          
          // Deduplicate documents by ID to prevent counting duplicates
          const uniqueDocuments = flatDocuments.filter((doc: Document, index: number, self: Document[]) => 
            index === self.findIndex((d: Document) => d._id === doc._id)
          );
          
          console.log('Document deduplication:', {
            originalCount: flatDocuments.length,
            uniqueCount: uniqueDocuments.length,
            duplicatesRemoved: flatDocuments.length - uniqueDocuments.length
          });
          
          // Use unique documents for all subsequent operations
          console.log('Document statuses:', uniqueDocuments.map((doc: Document) => doc.status));
          console.log('Detailed document analysis:', {
            total: uniqueDocuments.length,
            statusBreakdown: uniqueDocuments.reduce((acc: any, doc: Document) => {
              acc[doc.status] = (acc[doc.status] || 0) + 1;
              return acc;
            }, {}),
            documents: uniqueDocuments.map((doc: Document) => ({
              id: doc._id,
              title: doc.title,
              status: doc.status,
              submissionId: doc.submissionId
            }))
          });
          
          setSubmissions(transformedSubmissions);
          setFilteredSubmissions(transformedSubmissions);
          setDocuments(uniqueDocuments);
          setFilteredDocuments(uniqueDocuments);
          
          // Clean up stale documents after a short delay to allow the UI to render first
          setTimeout(() => {
            cleanupStaleDocuments(uniqueDocuments);
          }, 2000);
        } else {
          setError('Failed to load vendor documents');
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        const errorMessage = err.response?.data?.message || 'Failed to load data';
        console.log('Error details:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message
        });
        setError(`${errorMessage} (${err.response?.status || 'Unknown error'})`);
        
        // Log the API endpoints we're trying to use
        console.log('API endpoints being used:', {
          vendorDetails: `${API_PREFIX}/users/${vendorId}`,
          vendorDocuments: `${API_PREFIX}/document-submissions/vendor/submissions?vendorId=${vendorId}`
        });

        // Use mock data for development if API fails
        if (!vendor) {
          setVendor({
            _id: vendorId || '1',
            name: 'John Smith',
            email: 'john@acmecorp.com',
            company: 'Acme Corporation'
          });
        }

        if (documents.length === 0) {
          const mockSubmissions: Submission[] = [
            {
              _id: 'SUB001',
              submissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
              documents: [
                {
                  _id: '1',
                  title: 'Tax Compliance Certificate',
                  documentType: 'Tax Document',
                  submissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                  status: 'pending',
                  fileCount: 1,
                  vendorId: vendorId || '1',
                  submissionId: 'SUB001',
                  files: [
                    {
                      _id: 'f1',
                      fileName: 'tax_certificate_2023.pdf',
                      filePath: '/uploads/tax_certificate_2023.pdf',
                      fileType: 'application/pdf',
                      uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                    }
                  ]
                }
              ]
            },
            {
              _id: 'SUB002',
              submissionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
              documents: [
                {
                  _id: '2',
                  title: 'Business Registration',
                  documentType: 'Legal Document',
                  submissionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                  status: 'under_review',
                  fileCount: 2,
                  vendorId: vendorId || '1',
                  submissionId: 'SUB002',
                  files: [
                    {
                      _id: 'f2',
                      fileName: 'business_registration.pdf',
                      filePath: '/uploads/business_registration.pdf',
                      fileType: 'application/pdf',
                      uploadDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
                    },
                    {
                      _id: 'f3',
                      fileName: 'business_license.pdf',
                      filePath: '/uploads/business_license.pdf',
                      fileType: 'application/pdf',
                      uploadDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
                    }
                  ]
                }
              ]
            },
            {
              _id: 'SUB003',
              submissionDate: new Date().toISOString(), // Today
              documents: [
                {
                  _id: '3',
                  title: 'Financial Statement',
                  documentType: 'Financial Document',
                  submissionDate: new Date().toISOString(),
                  status: 'approved',
                  fileCount: 1,
                  vendorId: vendorId || '1',
                  submissionId: 'SUB003',
                  files: [
                    {
                      _id: 'f4',
                      fileName: 'financial_statement_2023.pdf',
                      filePath: '/uploads/financial_statement_2023.pdf',
                      fileType: 'application/pdf',
                      uploadDate: new Date().toISOString()
                    }
                  ]
                }
              ]
            }
          ];
          
          const mockDocuments = mockSubmissions.flatMap(sub => sub.documents);
          
          setSubmissions(mockSubmissions);
          setFilteredSubmissions(mockSubmissions);
          setDocuments(mockDocuments);
          setFilteredDocuments(mockDocuments);
        }
      } finally {
        setLoading(false);
      }
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
          return docDate.getMonth() === monthMap[filterOptions.month];
        });
      }
      
      return {
        ...submission,
        documents: filteredDocs
      };
    }).filter(submission => submission.documents.length > 0); // Only keep submissions with documents after filtering
    
    setFilteredSubmissions(filteredSubs);
    
    // Also update filtered documents for compatibility
    const flatFiltered = filteredSubs.flatMap(sub => sub.documents);
    setFilteredDocuments(flatFiltered);
  }, [submissions, searchQuery, statusFilter, filterOptions]);

  // Handle document view - fetch fresh document data
  const handleViewDocument = async (document: Document) => {
    try {
      console.log('Fetching fresh document data for view:', document._id);
      
      // Try to fetch the latest version of this document
      if (document.submissionId) {
        // Fetch the submission to get the latest document data
        const submissionResponse = await apiService.documents.getSubmissionById(document.submissionId);
        
        if (submissionResponse.data.success) {
          const submission = submissionResponse.data.data;
          
          // Find the specific document in the submission
          const latestDoc = submission.documents.find((doc: any) => doc._id === document._id);
          
          if (latestDoc) {
            // Transform the latest document data to match our interface
            const transformedDoc = {
              _id: latestDoc._id,
              title: latestDoc.documentName || document.title,
              documentType: latestDoc.documentType || document.documentType,
              submissionDate: submission.submissionDate,
              status: latestDoc.status || document.status,
              fileCount: latestDoc.files ? latestDoc.files.length : (latestDoc.filePath ? 1 : 0),
              vendorId: document.vendorId,
              submissionId: document.submissionId,
              reviewNotes: latestDoc.reviewNotes || latestDoc.consultantRemarks || document.reviewNotes,
              files: latestDoc.files || (latestDoc.filePath ? [{
                _id: 'file-' + Math.random().toString(36).substr(2, 9),
                fileName: latestDoc.fileName || latestDoc.documentName || document.title,
                filePath: latestDoc.filePath,
                fileType: latestDoc.fileType || getMimeTypeFromFileName(latestDoc.filePath || latestDoc.fileName || ''),
                uploadDate: submission.submissionDate
              }] : [])
            };
            
            console.log('Using fresh document data:', transformedDoc);
            setSelectedDocument(transformedDoc);
            setShowDocumentModal(true);
            return;
          }
        }
      }
      
      // Fallback to cached document data if fresh fetch fails
      console.log('Using cached document data');
      setSelectedDocument(document);
      setShowDocumentModal(true);
    } catch (error) {
      console.error('Error fetching fresh document data:', error);
      // Fallback to cached document data
      setSelectedDocument(document);
      setShowDocumentModal(true);
    }
  };

  // Verify document exists before showing approval modal
  const verifyDocumentExists = async (document: Document): Promise<boolean> => {
    try {
      console.log(`Verifying document exists: ${document._id}`);
      
      // First try the document-submissions API if we have a submissionId
      if (document.submissionId) {
        try {
          // The checkDocumentExists function returns a boolean directly
          const exists = await apiService.documents.checkDocumentExists(document._id);
          console.log(`Document exists check result:`, exists);
          return exists;
        } catch (error) {
          console.error('Error checking document existence in document-submissions:', error);
          // Fall through to try the legacy API
        }
      }
      
      // Try the legacy documents API
      try {
        // Use our new debug endpoint to check if the document exists
        // Make sure to use the full API URL with the API_PREFIX
        const response = await fetch(`${API_PREFIX}/documents/debug/${document._id}`);
        if (!response.ok) {
          console.log(`Debug endpoint returned status: ${response.status}`);
          return false;
        }
        
        const data = await response.json();
        console.log(`Debug endpoint response:`, data);
        return data.success;
      } catch (error) {
        console.error('Error checking document existence in documents:', error);
        return false;
      }
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
      setProcessingApproval(false);
      alert(`Document with ID ${document._id} no longer exists in the database. The page will refresh to show current data.`);
      
      // Refresh the documents list
      window.location.reload();
      return;
    }
    
    // Document exists, proceed with approval
    setSelectedDocument(document);
    setApprovalStatus('approved');
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
      setProcessingApproval(false);
      alert(`Document with ID ${document._id} no longer exists in the database. The page will refresh to show current data.`);
      
      // Refresh the documents list
      window.location.reload();
      return;
    }
    
    // Document exists, proceed with rejection
    setSelectedDocument(document);
    setApprovalStatus('rejected');
    setShowApprovalModal(true);
    setProcessingApproval(false);
  };

  // Submit document approval/rejection
  const handleSubmitApproval = async () => {
    if (!selectedDocument || !approvalStatus) return;
    
    // Validate that remarks are provided
    if (!remarks.trim()) {
      alert('Please provide remarks before approving or rejecting the document.');
      return;
    }
    
    setProcessingApproval(true);
    
    try {
      let response;
      // Properly type the apiError variable as AxiosError
      let apiError: import('axios').AxiosError | null = null;
      
      // First try using the new document-submissions API
      if (selectedDocument.submissionId) {
        console.log('Trying new API: Updating document status with:', {
          submissionId: selectedDocument.submissionId,
          documentId: selectedDocument._id,
          status: approvalStatus,
          remarks: remarks
        });
        
        try {
          // Use the new updateDocumentStatus method which requires both submissionId and documentId
          response = await apiService.documents.updateDocumentStatus(
            selectedDocument.submissionId,
            selectedDocument._id,
            {
              status: approvalStatus,
              remarks: remarks
            }
          );
          console.log('New API response:', response);
        } catch (error) {
          const newApiError = error as import('axios').AxiosError;
          console.error('Error with new API, falling back to legacy endpoint:', newApiError);
          apiError = newApiError;
          // If the new API fails, we'll fall back to the legacy API
          response = null;
        }
      }
      
      // If the new API failed or there's no submissionId, try the legacy API
      if (!response) {
        console.log('Trying legacy API: Updating document status with:', {
          documentId: selectedDocument._id,
          status: approvalStatus,
          remarks: remarks
        });
        
        // Fall back to the legacy updateStatus method
        try {
          response = await apiService.documents.updateStatus(
            selectedDocument._id,
            approvalStatus,
            remarks
          );
          console.log('Legacy API response:', response);
        } catch (error) {
          const legacyApiError = error as import('axios').AxiosError;
          console.error('Error with legacy API as well:', legacyApiError);
          apiError = legacyApiError;
          
          // Don't throw here, handle the error gracefully
          response = null;
        }
      }
      
      // If both APIs failed, check if we can update the UI optimistically
      if (!response) {
        console.log('Both APIs failed. Updating UI optimistically and showing error message.');
        
        // Log detailed error information for debugging
        if (apiError) {
          console.error('API Error Details:', {
            status: apiError.response?.status,
            statusText: apiError.response?.statusText,
            data: apiError.response?.data,
            message: apiError.message,
            documentId: selectedDocument._id,
            submissionId: selectedDocument.submissionId
          });
        }
        
        // Update the UI optimistically
        const updatedDocuments = documents.map(doc => {
          if (doc._id === selectedDocument._id) {
            return {
              ...doc,
              status: approvalStatus,
              reviewNotes: remarks
            };
          }
          return doc;
        });
        
        setDocuments(updatedDocuments);
        setFilteredDocuments(updatedDocuments.filter(doc => 
          (statusFilter === 'all' || doc.status === statusFilter) &&
          (doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           doc.documentType.toLowerCase().includes(searchQuery.toLowerCase()))
        ));
        
        setShowApprovalModal(false);
        setRemarks('');
        setApprovalStatus(null);
        
        // Show warning message
        alert(`UI updated to show document as ${approvalStatus === 'approved' ? 'approved' : 'rejected'}, but there was an error saving to the server. The change may not persist after page refresh.`);
        return;
      }
      
      if (response && response.data.success) {
        // Update the document status in the local state
        const updatedDocuments = documents.map(doc => {
          if (doc._id === selectedDocument._id) {
            return {
              ...doc,
              status: approvalStatus,
              reviewNotes: remarks
            };
          }
          return doc;
        });
        
        setDocuments(updatedDocuments);
        setFilteredDocuments(updatedDocuments.filter(doc => 
          (statusFilter === 'all' || doc.status === statusFilter) &&
          (doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           doc.documentType.toLowerCase().includes(searchQuery.toLowerCase()))
        ));
        
        setShowApprovalModal(false);
        setRemarks('');
        setApprovalStatus(null);
        
        // Refresh data to update submission status and show report button if all documents are approved
        refreshData();
        
        // Show success message
        alert(`Document has been ${approvalStatus === 'approved' ? 'approved' : 'rejected'} successfully.`);
      } else if (response) {
        console.error('Failed to update document status:', response.data);
        alert('Failed to update document status. Please try again later.');
      }
    } catch (error) {
      console.error('Error updating document status:', error);
      alert('Failed to update document status. Please try again later.');
    } finally {
      setProcessingApproval(false);
    }
  };

  // Helper function to check if all documents in a submission are approved
  const areAllDocumentsApproved = (submission: Submission): boolean => {
    return submission.documents.length > 0 && submission.documents.every(doc => doc.status === 'approved');
  };

  // Helper function to safely format dates
  const safeFormatDate = (dateString: string | undefined, formatString: string): string => {
    try {
      console.log('Attempting to format date:', dateString);
      
      if (!dateString) {
        console.warn('Date string is null or undefined');
        return 'No Date Available';
      }
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return 'Invalid Date Format';
      }
      
      const formattedDate = format(date, formatString);
      console.log('Successfully formatted date:', dateString, '->', formattedDate);
      return formattedDate;
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Date Format Error';
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilterOptions({
      year: new Date().getFullYear(),
      month: 'all',
      status: 'all'
    });
    setStatusFilter('all');
    setSearchQuery('');
    setShowFilterModal(false);
  };

  // Apply filters
  const applyFilters = () => {
    setShowFilterModal(false);
  };

  // Generate PDF report for approved documents
  const generateDocumentReport = async () => {
    setGeneratingReport(true);
    setReportSuccess(null);
    setReportError(null);
    
    try {
      // Filter only approved documents
      const approvedDocs = documents.filter(doc => doc.status === 'approved');
      
      if (approvedDocs.length === 0) {
        setReportError('No approved documents found to generate report');
        setGeneratingReport(false);
        return;
      }
      
      // Prepare vendor data
      const vendorData = {
        name: vendor?.name || 'Unknown Vendor',
        company: vendor?.company || 'Unknown Company',
        email: vendor?.email || 'Unknown Email'
      };
      
      // Log document data for debugging
      console.log('General Report - Approved documents details:', approvedDocs.map(doc => ({
        id: doc._id,
        title: doc.title,
        status: doc.status,
        reviewNotes: doc.reviewNotes,
        hasReviewNotes: !!doc.reviewNotes,
        reviewNotesLength: doc.reviewNotes ? doc.reviewNotes.length : 0,
        finalRemarks: doc.reviewNotes || 'No remarks provided'
      })));
      
      console.log('Raw all approved documents data:', approvedDocs);
      
      // Generate the PDF using our utility function
      const pdf = await generateVerificationReport(
        vendorData,
        approvedDocs.map(doc => ({
          title: doc.title,
          documentType: doc.documentType,
          submissionDate: doc.submissionDate,
          status: 'Approved',
          remarks: doc.reviewNotes || 'No remarks provided'
        })),
        'Document Verification Report'
      );
      
      // Save the PDF
      pdf.save(`${vendor?.name || 'vendor'}_document_verification_report.pdf`);
      
      setReportSuccess(true);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      setReportError('Failed to generate PDF report');
      setReportSuccess(false);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Generate report for a specific submission
  const handleGenerateSubmissionReport = async (submission: Submission) => {
    setGeneratingReport(true);
    setReportSuccess(null);
    setReportError(null);
    
    try {
      // All documents should be approved if this function is called
      const approvedDocs = submission.documents.filter(doc => doc.status === 'approved');
      
      if (approvedDocs.length === 0) {
        setReportError('No approved documents found in this submission');
        setGeneratingReport(false);
        return;
      }
      
      // Prepare vendor data
      const vendorData = {
        name: vendor?.name || 'Unknown Vendor',
        company: vendor?.company || 'Unknown Company',
        email: vendor?.email || 'Unknown Email'
      };
      
      // Log document data for debugging
      console.log('Submission Report - Approved documents details:', approvedDocs.map(doc => ({
        id: doc._id,
        title: doc.title,
        status: doc.status,
        reviewNotes: doc.reviewNotes,
        hasReviewNotes: !!doc.reviewNotes,
        reviewNotesLength: doc.reviewNotes ? doc.reviewNotes.length : 0,
        finalRemarks: doc.reviewNotes || 'No remarks provided'
      })));
      
      console.log('Raw approved documents data:', approvedDocs);
      
      // Generate the PDF using our utility function
      const pdf = await generateVerificationReport(
        vendorData,
        approvedDocs.map(doc => ({
          title: doc.title,
          documentType: doc.documentType,
          submissionDate: doc.submissionDate,
          status: 'Approved',
          remarks: doc.reviewNotes || 'No remarks provided'
        })),
        `Document Verification Report - Submission ${submission._id.slice(-8).toUpperCase()}`
      );
      
      // Save the PDF with submission ID
      pdf.save(`${vendor?.name || 'vendor'}_submission_${submission._id.slice(-8)}_verification_report.pdf`);
      
      setReportSuccess(true);
      
      // Show success message
      alert('Verification report generated successfully!');
    } catch (error) {
      console.error('Error generating submission PDF report:', error);
      setReportError('Failed to generate submission PDF report');
      setReportSuccess(false);
      alert('Failed to generate verification report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Generate compliance verification report for a specific submission
  const handleGenerateComplianceReport = async (submission: Submission) => {
    setGeneratingReport(true);
    setReportSuccess(null);
    setReportError(null);
    
    try {
      // Prepare vendor data
      const vendorData = {
        name: vendor?.name || 'Unknown Vendor',
        company: vendor?.company || 'Unknown Company',
        email: vendor?.email || 'Unknown Email'
      };

      // Calculate compliance metrics
      const totalDocuments = submission.documents.length;
      const approvedDocuments = submission.documents.filter(doc => doc.status === 'approved').length;
      const rejectedDocuments = submission.documents.filter(doc => doc.status === 'rejected').length;
      const pendingDocuments = submission.documents.filter(doc => doc.status === 'pending' || doc.status === 'under_review').length;
      
      // Calculate compliance rate
      const complianceRate = totalDocuments > 0 ? Math.round((approvedDocuments / totalDocuments) * 100) : 0;
      
      // Determine overall status
      let overallStatus = 'In Progress';
      if (approvedDocuments === totalDocuments) {
        overallStatus = 'Fully Compliant';
      } else if (rejectedDocuments > 0) {
        overallStatus = 'Non-Compliant';
      } else if (pendingDocuments > 0) {
        overallStatus = 'Under Review';
      }

      // Check regulatory compliance based on document types
      const documentTypes = submission.documents.map(doc => doc.documentType);
      const complianceMetrics = {
        totalRequired: totalDocuments,
        totalSubmitted: totalDocuments,
        totalApproved: approvedDocuments,
        totalRejected: rejectedDocuments,
        complianceRate: complianceRate,
        overallStatus: overallStatus,
        pfCompliance: documentTypes.some(type => type.includes('PF') || type.includes('EPF')) && 
                     submission.documents.filter(doc => (doc.documentType.includes('PF') || doc.documentType.includes('EPF')) && doc.status === 'approved').length > 0,
        esiCompliance: documentTypes.some(type => type.includes('ESI') || type.includes('ESIC')) && 
                      submission.documents.filter(doc => (doc.documentType.includes('ESI') || doc.documentType.includes('ESIC')) && doc.status === 'approved').length > 0,
        ptCompliance: documentTypes.some(type => type.includes('PROFESSIONAL_TAX') || type.includes('PT')) && 
                     submission.documents.filter(doc => (doc.documentType.includes('PROFESSIONAL_TAX') || doc.documentType.includes('PT')) && doc.status === 'approved').length > 0,
        lwfCompliance: documentTypes.some(type => type.includes('LABOUR_WELFARE_FUND') || type.includes('LWF')) && 
                      submission.documents.filter(doc => (doc.documentType.includes('LABOUR_WELFARE_FUND') || doc.documentType.includes('LWF')) && doc.status === 'approved').length > 0,
        invoiceCompliance: documentTypes.some(type => type.includes('INVOICE')) && 
                          submission.documents.filter(doc => doc.documentType.includes('INVOICE') && doc.status === 'approved').length > 0,
        recommendations: [] as string[],
        auditorName: user?.name || 'System Consultant',
        auditReview: auditFindings || `Comprehensive review of ${totalDocuments} documents submitted for compliance verification. All documents have been evaluated against IMTMA standards and regulatory requirements.`,
        remarks: complianceRemarks || (complianceRate === 100 ? 
          'All submitted documents meet compliance requirements. Vendor maintains good documentation standards.' :
          `${approvedDocuments} out of ${totalDocuments} documents approved. ${rejectedDocuments > 0 ? 'Some documents require resubmission.' : 'Pending documents under review.'}`)
      };

      // Add recommendations based on compliance status
      if (complianceMetrics.complianceRate < 100) {
        complianceMetrics.recommendations.push('Complete submission of all required documents');
      }
      if (!complianceMetrics.pfCompliance) {
        complianceMetrics.recommendations.push('Ensure PF/EPF compliance documentation is submitted and approved');
      }
      if (!complianceMetrics.esiCompliance) {
        complianceMetrics.recommendations.push('Submit and get approval for ESI/ESIC related documents');
      }
      if (!complianceMetrics.invoiceCompliance) {
        complianceMetrics.recommendations.push('Submit valid invoice documentation');
      }

      // Prepare submission data for the report
      const submissionData = {
        submissionId: submission._id,
        workLocation: vendor?.workLocation || 'As per agreement',
        agreementPeriod: vendor?.agreementPeriod || 
          (vendor?.contractStartDate && vendor?.contractEndDate ? 
            `${format(new Date(vendor.contractStartDate), 'MMM dd, yyyy')} - ${format(new Date(vendor.contractEndDate), 'MMM dd, yyyy')}` : 
            'As per contract terms'),
        uploadPeriod: {
          month: format(new Date(submission.submissionDate), 'MMMM'),
          year: new Date(submission.submissionDate).getFullYear()
        },
        documents: submission.documents.map(doc => ({
          documentName: doc.title,
          documentType: doc.documentType,
          isMandatory: true, // You might want to determine this based on document type
          status: doc.status,
          reviewDate: doc.submissionDate, // Using submission date as review date for now
          consultantRemarks: doc.reviewNotes || 'Approved - Document meets compliance requirements'
        }))
      };

      console.log('Generating compliance verification report with data:', {
        vendorData,
        submissionData,
        complianceMetrics
      });

      // Generate the PDF using our utility function
      const pdf = await generateComplianceVerificationReport(
        vendorData,
        submissionData,
        complianceMetrics,
        `Compliance Verification Report - ${submission._id.slice(-8).toUpperCase()}`
      );

      // Save the PDF with submission ID
      pdf.save(`${vendor?.name || 'vendor'}_compliance_verification_${submission._id.slice(-8)}.pdf`);

      setReportSuccess(true);
      alert('Compliance verification report generated successfully!');
    } catch (error) {
      console.error('Error generating compliance verification report:', error);
      setReportError('Failed to generate compliance verification report');
      setReportSuccess(false);
      alert('Failed to generate compliance verification report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
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
    setUploadDocumentType('');
    setUploadTitle('');
    setUploadError(null);
    setUploadSuccess(null);
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

  // Check if all documents are approved
  const allDocumentsApproved = documents.length > 0 && documents.every(doc => doc.status === 'approved');

  // Get document counts by status
  const documentCounts = {
    total: documents.length,
    approved: documents.filter(doc => doc.status === 'approved').length,
    pending: documents.filter(doc => doc.status === 'pending').length,
    underReview: documents.filter(doc => doc.status === 'under_review').length,
    rejected: documents.filter(doc => doc.status === 'rejected').length,
    resubmitted: documents.filter(doc => doc.status === 'resubmitted').length
  };

  // Debug: Log document statuses to understand the data
  console.log('Document status breakdown:', {
    totalDocuments: documents.length,
    documentStatuses: documents.map(doc => ({ id: doc._id, title: doc.title, status: doc.status })),
    counts: documentCounts
  });



  // Get years for filter dropdown
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return [
      { value: 0, label: 'All Years' },
      { value: currentYear - 1, label: `${currentYear - 1}` },
      { value: currentYear, label: `${currentYear}` },
      { value: currentYear + 1, label: `${currentYear + 1}` }
    ];
  };

  // Get months for filter dropdown
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

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
            <div className="flex items-center">
              <Link to="/vendors-list" className="mr-4">
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
                    <h2 className="text-xl font-semibold flex items-center mb-2">
                      <BuildingOfficeIcon className="h-6 w-6 mr-3 text-blue-500" />
                      {vendor.company}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">{vendor.email}</p>
                    {vendor.workLocation && (
                      <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                        Location: {vendor.workLocation}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 justify-start lg:justify-end">
                    <Badge variant="info" className="px-3 py-2 text-sm font-medium">
                      Total: {documentCounts.total}
                    </Badge>
                    <Badge variant="success" className="px-3 py-2 text-sm font-medium">
                      Approved: {documentCounts.approved}
                    </Badge>
                    <Badge variant="warning" className="px-3 py-2 text-sm font-medium">
                      Pending: {documentCounts.pending}
                    </Badge>
                    <Badge variant="danger" className="px-3 py-2 text-sm font-medium">
                      Rejected: {documentCounts.rejected}
                    </Badge>
                    <Badge variant="warning" className="px-3 py-2 text-sm font-medium">
                      Resubmitted: {documentCounts.resubmitted}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          )}
        
          {/* Error message */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-6 mb-8 rounded-lg shadow-md">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 mr-3 flex-shrink-0" />
                <p className="text-lg font-medium">{error}</p>
              </div>
            </div>
          )}
        
          {/* Search and filter bar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col space-y-4">
              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  placeholder="Search documents by title, type, or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <select
                    className="block w-full py-3 px-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="resubmitted">Resubmitted</option>
                  </select>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowFilterModal(true)}
                    className="flex items-center px-4 py-3 text-base"
                  >
                    <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                    Advanced Filters
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={refreshData}
                    disabled={loading}
                    className="flex items-center px-4 py-3 text-base"
                  >
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </Button>
                  
                  <Button 
                    variant="primary" 
                    onClick={() => setShowUploadModal(true)}
                    disabled={!vendor}
                    className="flex items-center px-4 py-3 text-base bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-md"
                  >
                    <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                    Upload Documents
                  </Button>
                  
                  {allDocumentsApproved && (
                    <Button 
                      variant="primary" 
                      onClick={() => setShowComplianceForm(true)}
                      className="flex items-center px-4 py-3 text-base bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-md"
                    >
                      <DocumentCheckIcon className="h-5 w-5 mr-2" />
                      Compliance Report
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        
        {/* Submissions list */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredSubmissions.length > 0 ? (
          <div className="space-y-8">
            {filteredSubmissions.map((submission) => (
              <motion.div
                key={submission._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden">
                  {/* Submission Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CalendarIcon className="h-6 w-6 text-blue-500" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Submission: {submission._id.slice(-8).toUpperCase()}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Submitted on {safeFormatDate(submission.submissionDate, 'MMMM dd, yyyy \'at\' h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="info" className="px-3 py-1">
                          {submission.documents.length} Document{submission.documents.length !== 1 ? 's' : ''}
                        </Badge>
                        {areAllDocumentsApproved(submission) && (
                          <Badge variant="success" className="px-3 py-1 flex items-center">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            All Approved
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Documents Grid */}
                  <div className="p-6">
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
                              <div className="flex flex-wrap gap-3">
                                <Button
                                  variant="outline"
                                  size="md"
                                  onClick={() => handleViewDocument(document)}
                                  className="flex items-center px-4 py-2 text-base font-medium"
                                >
                                  <EyeIcon className="h-5 w-5 mr-2" />
                                  View Details
                                </Button>
                                
                                {document.status !== 'approved' && (
                                  <Button
                                    variant="success"
                                    size="md"
                                    onClick={() => handleApproveDocument(document)}
                                    className="flex items-center px-4 py-2 text-base font-medium"
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
                                    className="flex items-center px-4 py-2 text-base font-medium"
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
                    
                    {/* Report Buttons - Show only when all documents are approved */}
                    {areAllDocumentsApproved(submission) && (
                      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600 bg-green-50 dark:bg-green-900 rounded-lg p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-center space-x-3">
                            <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                            <div>
                              <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                                All Documents Approved! 🎉
                              </p>
                              <p className="text-sm text-green-600 dark:text-green-400">
                                {submission.documents.length} document{submission.documents.length !== 1 ? 's' : ''} ready for report generation
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3">
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
                            <Button
                              variant="secondary"
                              size="md"
                              onClick={() => {
                                // Store the current submission for later use
                                setSelectedDocument({
                                  _id: submission._id,
                                  title: `Submission ${submission._id.slice(-8)}`,
                                  documentType: 'Submission',
                                  submissionDate: submission.submissionDate,
                                  status: 'pending',
                                  fileCount: submission.documents.length,
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
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <DocumentTextIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No documents found</h3>
            <p className="text-base text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'all' || filterOptions.month !== 'all' || filterOptions.year !== 0
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'This vendor has not submitted any documents yet.'}
            </p>
            {(searchQuery || statusFilter !== 'all' || filterOptions.month !== 'all' || filterOptions.year !== 0) && (
              <Button
                variant="outline"
                size="md"
                className="px-6 py-3 text-base font-medium"
                onClick={resetFilters}
              >
                Clear All Filters
              </Button>
            )}
          </div>
        )}
        </div>
      </div>
      
      {/* Document View Modal */}
      <Modal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        title={selectedDocument?.title || 'View Document'}
      >
        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">{selectedDocument?.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span className="font-medium">Type:</span> {selectedDocument?.documentType}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span className="font-medium">Status:</span> {selectedDocument?.status}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span className="font-medium">Submitted:</span> {selectedDocument?.submissionDate ? safeFormatDate(selectedDocument.submissionDate, 'MMM dd, yyyy') : 'Unknown'}
            </p>
            {selectedDocument?.reviewNotes && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span className="font-medium">Remarks:</span> {selectedDocument.reviewNotes}
              </p>
            )}
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="font-medium mb-2">Files:</h4>
            {selectedDocument?.files && selectedDocument.files.length > 0 ? (
              <ul className="space-y-2">
                {selectedDocument.files.map((file) => (
                  <li key={file._id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="truncate flex-1">{file.fileName}</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center ml-2"
                      onClick={() => {
                        // Use the API service to view the file
                        apiService.documents.viewFile(file.filePath)
                          .then(response => {
                            // Create a blob URL from the response
                            const blob = new Blob([response.data], { type: response.headers['content-type'] });
                            const url = window.URL.createObjectURL(blob);
                            
                            // Open the file in a new tab
                            window.open(url, '_blank');
                          })
                          .catch(error => {
                            console.error('Error viewing file:', error);
                            alert('Error viewing file. Please try again.');
                          });
                      }}
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center ml-2"
                      onClick={() => {
                        // Use the API service to download the file
                        apiService.documents.downloadFile(file.filePath, file.fileName)
                          .then(response => {
                            // Create a blob URL from the response
                            const blob = new Blob([response.data], { type: response.headers['content-type'] });
                            const url = window.URL.createObjectURL(blob);
                            
                            // Create a temporary link element to trigger the download
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = file.fileName;
                            document.body.appendChild(link);
                            link.click();
                            
                            // Clean up
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                          })
                          .catch(error => {
                            console.error('Error downloading file:', error);
                            alert('Error downloading file. Please try again.');
                          });
                      }}
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No files available</p>
            )}
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDocumentModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Approval/Rejection Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title={`${approvalStatus === 'approved' ? 'Approve' : 'Reject'} Document`}
      >
        <div className="p-4">
          <p className="mb-4">
            Are you sure you want to {approvalStatus === 'approved' ? 'approve' : 'reject'} the document "{selectedDocument?.title}"?
          </p>
          
          <div className="mb-4">
            <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Remarks <span className="text-red-500">*</span>
            </label>
            <textarea
              id="remarks"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="Add your remarks here (required)..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              required
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              You must provide remarks before approving or rejecting a document.
            </p>
          </div>
          
          <div className="flex justify-end space-x-2">
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
                approvalStatus === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'
              )}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Filter Modal */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter Documents"
      >
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Year
            </label>
            <Select
              value={filterOptions.year}
              onChange={(e) => setFilterOptions({ ...filterOptions, year: Number(e.target.value) })}
            >
              {getYearOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Month
            </label>
            <Select
              value={filterOptions.month}
              onChange={(e) => setFilterOptions({ ...filterOptions, month: String(e.target.value) })}
            >
              {getMonthOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(String(e.target.value))}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="resubmitted">Resubmitted</option>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={resetFilters}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={applyFilters}
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
      >
        <div className="p-4">
          <p className="mb-4">
            Generate a verification report for all approved documents from {vendor?.name || 'this vendor'}.
          </p>
          
          {reportSuccess === true && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <p>Report generated successfully!</p>
              </div>
            </div>
          )}
          
          {reportError && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                <p>{reportError}</p>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowReportModal(false)}
              disabled={generatingReport}
            >
              Close
            </Button>
            <Button
              variant="primary"
              onClick={generateDocumentReport}
              disabled={generatingReport}
            >
              {generatingReport ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
                  Generating...
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-5 w-5 mr-1" />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="">Select document type</option>
              <option value="PF_REGISTRATION">PF Registration</option>
              <option value="ESI_REGISTRATION">ESI Registration</option>
              <option value="LABOUR_WELFARE_FUND">Labour Welfare Fund</option>
              <option value="INVOICE">Invoice</option>
              <option value="CONTRACT">Contract</option>
              <option value="COMPLIANCE_CERTIFICATE">Compliance Certificate</option>
              <option value="OTHER">Other</option>
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
        title="Compliance Verification Details"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Please fill in the compliance verification details before generating the report.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Audit Review & Findings *
            </label>
            <textarea
              value={auditFindings}
              onChange={(e) => setAuditFindings(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="Enter detailed audit review and findings..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Compliance Status *
            </label>
            <select
              value={complianceStatus}
              onChange={(e) => setComplianceStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="">Select compliance status</option>
              <option value="FULLY_COMPLIANT">Fully Compliant</option>
              <option value="PARTIALLY_COMPLIANT">Partially Compliant</option>
              <option value="NON_COMPLIANT">Non-Compliant</option>
              <option value="UNDER_REVIEW">Under Review</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Compliance Remarks *
            </label>
            <textarea
              value={complianceRemarks}
              onChange={(e) => setComplianceRemarks(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="Enter compliance remarks and recommendations..."
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
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
    </MainLayout>
  );
};

export default VendorDocumentsPage;
