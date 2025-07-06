import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../utils/api';
import { FontAwesomeIcon } from '../../utils/icons';
import {
  faCheckCircle,
  faTimesCircle,
  faEye,
  faHourglass,
  faFileAlt,
  faFilePdf,
  faFileImage,
  faFile,
  faPlus,
  faSearch,
  faFilter,
  faUserTie,
  faFileContract,
  faInfoCircle,
  faSpinner,
  faUpload
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';

interface DocumentFile {
  _id: string;
  path: string;
  originalName: string;
  mimeType: string;
  size: number;
  documentName?: string;
  documentType?: string;
  description?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'change_requested';
  reviewNotes?: string;
}

// Interface for document submission from the new API
interface DocumentSubmissionItem {
  id?: string;
  _id?: string;
  name?: string;
  documentName?: string;
  type?: string;
  documentType?: string;
  status?: string;
  mimeType?: string;
  consultantRemarks?: string;
  reviewDate?: string;
  uploadDate?: string;
}

interface DocumentSubmission {
  id: string;
  submissionId: string;
  period?: string;
  status: string;
  submissionDate?: string;
  lastModified?: string;
  createdAt?: string;
  updatedAt?: string;
  lastModifiedDate?: string;
  documents: DocumentSubmissionItem[];
  vendor?: {
    id?: string;
    _id?: string;
    name?: string;
    email?: string;
    company?: string;
  };
  consultant?: {
    id?: string;
    _id?: string;
    name: string;
    email: string;
  };
}

interface Document {
  _id: string;
  title: string;
  documentType: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'change_requested' | string;
  createdAt: string;
  submissionDate: string;
  files: DocumentFile[];
  fileName?: string; 
  vendor: {
    _id: string;
    name: string;
    email: string;
    company: string;
  };
  reviewer?: {
    _id: string;
    name: string;
    email: string;
  };
  reviewNotes?: string;
  reviewDate?: string;
}

interface VendorWithDocuments {
  _id: string;
  name: string;
  email: string;
  company: string;
  documents: Document[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface EmailData {
  to: string;
  subject: string;
  message: string;
  includeVendorDetails: boolean;
  includeDocumentList: boolean;
  includeApprovalNotes: boolean;
}

interface DocumentListPageProps {
  mode?: 'view' | 'edit';
}

const DocumentListPage: React.FC<DocumentListPageProps> = ({ mode = 'view' }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [vendorsWithDocs, setVendorsWithDocs] = useState<VendorWithDocuments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number | string>(new Date().getMonth() + 1); // 1-12 for Jan-Dec or empty string for all months
  const [viewMode, setViewMode] = useState<'document' | 'vendor'>('document');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorWithDocuments | null>(null);
  const [emailData, setEmailData] = useState<EmailData>({
    to: '',
    subject: 'Document Status Update',
    message: '',
    includeVendorDetails: true,
    includeDocumentList: true,
    includeApprovalNotes: false
  });
  const [sendingEmail, setSendingEmail] = useState(false);

  // Fetch documents in document-centric view
  const fetchDocuments = async (
    page = 1, 
    limit = 10, 
    searchQuery = search, 
    statusFilter = status,
    yearFilter = year,
    monthFilter: number | string = month
  ) => {
    try {
      setLoading(true);
      
      // Debug: Log the parameters being sent
      const params = {
        page,
        limit,
        search: searchQuery,
        status: statusFilter,
        year: yearFilter,
        month: monthFilter
      };
      console.log('🔍 Fetching documents with parameters:', params);
      
      const response = await apiService.documents.getAll(params);
      
      // Debug: Log the API response
      console.log('📥 API Response:', response.data);

      if (response.data.success) {
        // Check if the response contains document submissions or legacy documents
        let processedDocuments;
        
        if (Array.isArray(response.data.data) && response.data.data.length > 0 && response.data.data[0].documents) {
          // This is a document submission response
          console.log("Processing document submissions:", response.data.data);
          
          // Debug: Log the date fields available
          response.data.data.forEach((submission: any, index: number) => {
            console.log(`Submission ${index + 1} date fields:`, {
              submissionId: submission.submissionId,
              createdAt: submission.createdAt,
              updatedAt: submission.updatedAt,
              submissionDate: submission.submissionDate,
              lastModifiedDate: submission.lastModifiedDate
            });
            
            // Also log document-level dates
            submission.documents?.forEach((doc: any, docIndex: number) => {
              console.log(`  Document ${docIndex + 1} (${doc.documentName}) dates:`, {
                uploadDate: doc.uploadDate,
                reviewDate: doc.reviewDate
              });
            });
          });
          
          // Flatten the submissions into documents
          processedDocuments = response.data.data.flatMap((submission: DocumentSubmission) => {
            return submission.documents.map((doc: DocumentSubmissionItem) => ({
              _id: doc.id || doc._id,
              title: doc.name || doc.documentName || submission.submissionId,
              documentType: doc.type || doc.documentType || 'Unknown',
              status: doc.status || submission.status || 'pending',
              createdAt: submission.createdAt || submission.updatedAt || doc.uploadDate || submission.submissionDate || new Date().toISOString(),
              submissionDate: submission.submissionDate || submission.createdAt || submission.updatedAt || doc.uploadDate,
              files: [{
                _id: doc.id || doc._id,
                path: '',
                originalName: doc.name || doc.documentName || 'Unknown',
                mimeType: doc.mimeType || 'application/pdf',
                size: 0,
                documentName: doc.name || doc.documentName,
                documentType: doc.type || doc.documentType,
                status: doc.status || 'pending',
                reviewNotes: doc.consultantRemarks || ''
              }],
              vendor: {
                _id: submission.vendor?.id || submission.vendor || '',
                name: submission.vendor?.name || user?.name || '',
                email: submission.vendor?.email || user?.email || '',
                company: submission.vendor?.company || ''
              },
              reviewer: submission.consultant ? {
                _id: submission.consultant?.id || '',
                name: submission.consultant?.name || '',
                email: submission.consultant?.email || ''
              } : undefined,
              reviewNotes: doc.consultantRemarks || '',
              reviewDate: doc.reviewDate || ''
            }));
          });
        } else {
          // This is a legacy document response
          processedDocuments = response.data.data;
        }
        
        console.log("Processed documents:", processedDocuments);
        
        // Debug: Log the final dates used for each document
        processedDocuments.forEach((doc: any, index: number) => {
          console.log(`Final document ${index + 1} (${doc.title}) dates:`, {
            createdAt: doc.createdAt,
            submissionDate: doc.submissionDate,
            formattedCreated: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'N/A',
            formattedSubmission: doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : 'N/A'
          });
        });
        
        setDocuments(processedDocuments);
        setPagination({
          page,
          limit,
          total: response.data.total || processedDocuments.length,
          totalPages: Math.ceil((response.data.total || processedDocuments.length) / limit)
        });
      }
    } catch (err: any) {
      console.error('❌ Error fetching documents:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
        url: err.config?.url,
        params: err.config?.params
      });
      setError(err.response?.data?.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch documents grouped by vendor for vendor-centric view
  const fetchVendorsWithDocuments = async (
    page = 1, 
    limit = 10, 
    searchQuery = search, 
    statusFilter = status,
    yearFilter = year,
    monthFilter: number | string = month
  ) => {
    try {
      setLoading(true);
      
      // Debug: Log the parameters being sent for vendor view
      const params = {
        page,
        limit,
        search: searchQuery,
        status: statusFilter,
        year: yearFilter,
        month: monthFilter
      };
      console.log('🏢 Fetching vendors with documents, parameters:', params);
      
      const response = await apiService.documents.getGroupedByVendor(params);
      
      // Debug: Log the API response for vendor view
      console.log('📥 Vendor API Response:', response.data);

      if (response.data.success) {
        setVendorsWithDocs(response.data.data);
        setPagination({
          page,
          limit,
          total: response.data.total,
          totalPages: Math.ceil(response.data.total / limit)
        });
      }
    } catch (err: any) {
      console.error('❌ Error fetching vendors with documents:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
        url: err.config?.url,
        params: err.config?.params
      });
      setError(err.response?.data?.message || 'Failed to fetch vendors with documents');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch based on view mode
  useEffect(() => {
    if (viewMode === 'document') {
      fetchDocuments();
    } else {
      fetchVendorsWithDocuments(1, pagination.limit);
    }
  }, [viewMode]);
  
  // Toggle view mode between document-centric and vendor-centric
  const toggleViewMode = () => {
    const newMode = viewMode === 'document' ? 'vendor' : 'document';
    setViewMode(newMode);
  };
  
  // Handle email modal open
  const openEmailModal = (vendor: VendorWithDocuments) => {
    setSelectedVendor(vendor);
    setEmailData(prev => ({
      ...prev,
      to: vendor.email
    }));
    setShowEmailModal(true);
  };
  
  // Handle email modal close
  const closeEmailModal = () => {
    setShowEmailModal(false);
    setSelectedVendor(null);
  };
  
  // Handle email data change
  const handleEmailDataChange = (field: keyof EmailData, value: string | boolean) => {
    setEmailData((prev: EmailData) => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Send email to vendor
  const sendEmail = async () => {
    if (!selectedVendor) return;
    
    try {
      setSendingEmail(true);
      setError(null);
      
      // Get all document IDs for this vendor
      const documentIds = selectedVendor.documents.map(doc => doc._id);
      
      const response = await apiService.documents.sendEmailToOrganizer(selectedVendor._id, {
        ...emailData,
        documentIds
      });
      
      if (response.data.success) {
        setSuccess('Email sent successfully!');
        closeEmailModal();
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send email');
      console.error('Error sending email:', err);
    } finally {
      setSendingEmail(false);
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (viewMode === 'document') {
      fetchDocuments(1, pagination.limit, search, status, year, month);
    } else {
      fetchVendorsWithDocuments(1, pagination.limit, search, status, year, month);
    }
  };

  // Handle filter change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
    if (viewMode === 'document') {
      fetchDocuments(1, pagination.limit, search, e.target.value, year, month);
    } else {
      fetchVendorsWithDocuments(1, pagination.limit, search, e.target.value, year, month);
    }
  };
  
  // Handle year change
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    setYear(newYear);
    if (viewMode === 'document') {
      fetchDocuments(1, pagination.limit, search, status, newYear, month);
    } else {
      fetchVendorsWithDocuments(1, pagination.limit, search, status, newYear, month);
    }
  };
  
  // Handle month change
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = e.target.value ? parseInt(e.target.value) : '';
    setMonth(newMonth);
    if (viewMode === 'document') {
      fetchDocuments(1, pagination.limit, search, status, year, newMonth);
    } else {
      fetchVendorsWithDocuments(1, pagination.limit, search, status, year, newMonth);
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      if (viewMode === 'document') {
        fetchDocuments(newPage, pagination.limit, search, status, year, month);
      } else {
        fetchVendorsWithDocuments(newPage, pagination.limit, search, status, year, month);
      }
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-1 mt-0.5" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            <FontAwesomeIcon icon={faTimesCircle} className="mr-1 mt-0.5" />
            Rejected
          </span>
        );
      case 'under_review':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            <FontAwesomeIcon icon={faEye} className="mr-1 mt-0.5" />
            Under Review
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <FontAwesomeIcon icon={faHourglass} className="mr-1 mt-0.5" />
            Pending
          </span>
        );
    }
  };

  // Get file icon based on mime type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) {
      return <FontAwesomeIcon icon={faFilePdf} className="text-red-500" />;
    } else if (mimeType.includes('image')) {
      return <FontAwesomeIcon icon={faFileImage} className="text-blue-500" />;
    } else {
      return <FontAwesomeIcon icon={faFileAlt} className="text-gray-500" />;
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {user?.role === 'admin' ? 'Document Management' : 
               mode === 'edit' ? 'Edit Documents' : 'View Documents'}
            </h1>
            <p className="text-gray-600 mt-1">
              {user?.role === 'admin' 
                ? 'View and manage all vendor documents' 
                : mode === 'edit'
                  ? 'Edit and delete your uploaded documents'
                  : 'View your uploaded documents with filtering options'}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center">
            {user?.role === 'admin' && (
              <button
                type="button"
                onClick={toggleViewMode}
                className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FontAwesomeIcon 
                  icon={viewMode === 'document' ? faUserTie : faFileContract} 
                  className="mr-2 -ml-1 h-5 w-5" 
                />
                {viewMode === 'document' ? 'Vendor View' : 'Document View'}
              </button>
            )}
            {user?.role === 'vendor' && mode === 'edit' && (
              <Link
                to="/documents/upload"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2 -ml-1 h-5 w-5" />
                Upload New Document
              </Link>
            )}
          </div>
        </div>
        
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-2" />
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-1">Filter Documents</h3>
            <p className="text-sm text-gray-500">Search and filter documents by status, date, and keywords</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Search Bar */}
            <div className="lg:col-span-5">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Documents
              </label>
              <form onSubmit={handleSearch} className="flex w-full">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faSearch} className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="search"
                    type="text"
                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    placeholder="Search by document name, type, or vendor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="ml-3 inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <FontAwesomeIcon icon={faSearch} className="mr-2" />
                  Search
                </button>
              </form>
            </div>

            {/* Status Filter */}
            <div className="lg:col-span-3">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Document Status
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faFilter} className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="status"
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  value={status}
                  onChange={handleStatusChange}
                >
                  <option value="">All Statuses</option>
                  <option value="uploaded">📋 Uploaded (Pending Review)</option>
                  <option value="under_review">👁️ Under Review</option>
                  <option value="approved">✅ Approved</option>
                  <option value="rejected">❌ Rejected</option>
                  <option value="resubmitted">📤 Resubmitted</option>
                </select>
              </div>
            </div>
              
            {/* Year Filter */}
            <div className="lg:col-span-2">
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <select
                id="year"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                value={year}
                onChange={handleYearChange}
              >
                {Array.from({ length: 16 }, (_, i) => 2035 - i).map(yearOption => (
                  <option key={yearOption} value={yearOption}>{yearOption}</option>
                ))}
              </select>
            </div>
              
            {/* Month Filter */}
            <div className="lg:col-span-2">
              <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
                Month
              </label>
              <select
                id="month"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                value={month}
                onChange={handleMonthChange}
              >
                <option value="">📅 All Months</option>
                <option value={1}>🗓️ January</option>
                <option value={2}>🗓️ February</option>
                <option value={3}>🗓️ March</option>
                <option value={4}>🗓️ April</option>
                <option value={5}>🗓️ May</option>
                <option value={6}>🗓️ June</option>
                <option value={7}>🗓️ July</option>
                <option value={8}>🗓️ August</option>
                <option value={9}>🗓️ September</option>
                <option value={10}>🗓️ October</option>
                <option value={11}>🗓️ November</option>
                <option value={12}>🗓️ December</option>
              </select>
            </div>
          </div>
          
          {/* Active Filters Display */}
          {(search || status || year !== new Date().getFullYear() || (month !== new Date().getMonth() + 1 && month !== '')) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                
                {search && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Search: "{search}"
                    <button
                      onClick={() => {
                        setSearch('');
                        if (viewMode === 'document') {
                          fetchDocuments(1, pagination.limit, '', status, year, month);
                        } else {
                          fetchVendorsWithDocuments(1, pagination.limit, '', status, year, month);
                        }
                      }}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {status && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    Status: {
                      status === 'uploaded' ? 'Uploaded (Pending Review)' :
                      status === 'under_review' ? 'Under Review' :
                      status === 'approved' ? 'Approved' :
                      status === 'rejected' ? 'Rejected' :
                      status === 'resubmitted' ? 'Resubmitted' :
                      status.replace('_', ' ')
                    }
                    <button
                      onClick={() => {
                        setStatus('');
                        if (viewMode === 'document') {
                          fetchDocuments(1, pagination.limit, search, '', year, month);
                        } else {
                          fetchVendorsWithDocuments(1, pagination.limit, search, '', year, month);
                        }
                      }}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {year !== new Date().getFullYear() && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                    Year: {year}
                    <button
                      onClick={() => {
                        const currentYear = new Date().getFullYear();
                        setYear(currentYear);
                        if (viewMode === 'document') {
                          fetchDocuments(1, pagination.limit, search, status, currentYear, month);
                        } else {
                          fetchVendorsWithDocuments(1, pagination.limit, search, status, currentYear, month);
                        }
                      }}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                {month !== new Date().getMonth() + 1 && month !== '' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                    Month: {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][(Number(month) - 1)]}
                    <button
                      onClick={() => {
                        const currentMonth = new Date().getMonth() + 1;
                        setMonth(currentMonth);
                        if (viewMode === 'document') {
                          fetchDocuments(1, pagination.limit, search, status, year, currentMonth);
                        } else {
                          fetchVendorsWithDocuments(1, pagination.limit, search, status, year, currentMonth);
                        }
                      }}
                      className="ml-2 text-orange-600 hover:text-orange-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                
                <button
                  onClick={() => {
                    setSearch('');
                    setStatus('');
                    setYear(new Date().getFullYear());
                    setMonth(new Date().getMonth() + 1);
                    if (viewMode === 'document') {
                      fetchDocuments(1, pagination.limit, '', '', new Date().getFullYear(), new Date().getMonth() + 1);
                    } else {
                      fetchVendorsWithDocuments(1, pagination.limit, '', '', new Date().getFullYear(), new Date().getMonth() + 1);
                    }
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {!loading && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {pagination.total} {pagination.total === 1 ? 'document' : 'documents'} found
                </p>
                {(search || status || year !== new Date().getFullYear() || (month !== new Date().getMonth() + 1 && month !== '')) && (
                  <p className="text-xs text-gray-500">
                    Filtered results • Showing page {pagination.page} of {pagination.totalPages}
                  </p>
                )}
              </div>
              
              {/* Quick Stats */}
              <div className="hidden sm:flex items-center space-x-6 text-xs text-gray-500">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></div>
                  Uploaded: {documents.filter(d => d.status === 'uploaded').length}
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-1"></div>
                  Under Review: {documents.filter(d => d.status === 'under_review').length}
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                  Approved: {documents.filter(d => d.status === 'approved').length}
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-1"></div>
                  Rejected: {documents.filter(d => d.status === 'rejected').length}
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-1"></div>
                  Resubmitted: {documents.filter(d => d.status === 'resubmitted').length}
                </div>
              </div>
            </div>
            
            {/* View Mode Toggle for Mobile */}
            {user?.role === 'admin' && (
              <div className="mt-2 sm:mt-0">
                <button
                  type="button"
                  onClick={toggleViewMode}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FontAwesomeIcon 
                    icon={viewMode === 'document' ? faUserTie : faFileContract} 
                    className="mr-1 h-3 w-3" 
                  />
                  {viewMode === 'document' ? 'Switch to Vendor View' : 'Switch to Document View'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Documents List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FontAwesomeIcon icon={faTimesCircle} className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <FontAwesomeIcon icon={faFile} className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
            <p className="mt-1 text-sm text-gray-500">
              {user?.role === 'admin' 
                ? 'No documents have been uploaded yet.' 
                : mode === 'edit'
                  ? "You don't have any documents that can be edited."
                  : "You don't have any documents to view."}
            </p>
            {user?.role === 'vendor' && mode === 'edit' && (
              <div className="mt-6">
                <Link
                  to="/documents/upload"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FontAwesomeIcon icon={faPlus} className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Upload Document
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {documents.map((document) => (
                <li key={document._id}>
                  <div className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-gray-100 p-2 rounded-md">
                            <FontAwesomeIcon icon={faFile} className="h-6 w-6 text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-blue-600 truncate max-w-md">
                                {document.title}
                              </p>
                              {/* Show consultant remarks tooltip for rejected documents */}
                              {(document.status === 'rejected' || document.status === 'requires_resubmission') && document.reviewNotes && (
                                <div className="relative group">
                                  <FontAwesomeIcon 
                                    icon={faInfoCircle} 
                                    className="h-4 w-4 text-red-500 cursor-help" 
                                    title="Click to see consultant remarks"
                                  />
                                  <div className="absolute bottom-full left-0 mb-2 w-80 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 shadow-lg">
                                    <div className="flex items-start space-x-2">
                                      <FontAwesomeIcon icon={faTimesCircle} className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="font-semibold mb-1">Consultant Remarks:</p>
                                        <p className="leading-relaxed">{document.reviewNotes}</p>
                                      </div>
                                    </div>
                                    {/* Tooltip arrow */}
                                    <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-200"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {document.documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            {/* Show consultant remarks inline for rejected documents */}
                            {(document.status === 'rejected' || document.status === 'requires_resubmission') && document.reviewNotes && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                                <div className="flex items-start space-x-2">
                                  <FontAwesomeIcon icon={faTimesCircle} className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                                  <div className="text-xs">
                                    <p className="font-medium text-red-800 mb-1">Consultant Remarks:</p>
                                    <p className="text-red-700 leading-relaxed">{document.reviewNotes}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          {getStatusBadge(document.status)}
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex flex-col">
                          <p className="flex items-center text-sm text-gray-500">
                            {(() => {
                              try {
                                if (document.submissionDate) {
                                  const submissionDate = new Date(document.submissionDate);
                                  if (!isNaN(submissionDate.getTime())) {
                                    return `Submitted: ${submissionDate.toLocaleDateString()}`;
                                  }
                                }
                                const createdDate = new Date(document.createdAt);
                                if (!isNaN(createdDate.getTime())) {
                                  return `Created: ${createdDate.toLocaleDateString()}`;
                                }
                                return 'Date: Not available';
                              } catch (error) {
                                return 'Date: Invalid';
                              }
                            })()}
                          </p>
                          {user?.role === 'admin' && document.vendor && (
                            <p className="flex items-center text-sm text-gray-500 mt-1">
                              <FontAwesomeIcon icon={faUserTie} className="mr-1" />
                              Vendor: {document.vendor.name} ({document.vendor.company})
                            </p>
                          )}
                          {user?.role === 'admin' && document.reviewer && (
                            <p className="flex items-center text-sm text-gray-500 mt-1">
                              <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                              Consultant: {document.reviewer.name}
                            </p>
                          )}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          {/* Show first file or legacy file */}
                          {document.files && document.files.length > 0 ? (
                            <div className="flex items-center">
                              {getFileIcon(document.files[0].mimeType)}
                              <span className="ml-1">{document.files.length > 1 ? `${document.files.length} files` : document.files[0].originalName}</span>
                            </div>
                          ) : document.fileName ? (
                            <div className="flex items-center">
                              <FontAwesomeIcon icon={faFileAlt} className="text-gray-500" />
                              <span className="ml-1">{document.fileName}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      
                      {/* Document Actions */}
                      <div className="mt-3 flex justify-end space-x-2">
                        <Link
                          to={user?.role === 'consultant' ? `/documents/${document._id}` : `/documents/view/${document._id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          {user?.role === 'consultant' ? (
                            <>
                              <FontAwesomeIcon icon={faEye} className="mr-1" />
                              Review Document
                            </>
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faEye} className="mr-1" />
                              View Details
                            </>
                          )}
                        </Link>
                        
                        {user?.role === 'vendor' && mode === 'edit' && document.status !== 'approved' && (
                          <>
                            {/* Reupload button for rejected documents */}
                            {(document.status === 'rejected' || document.status === 'requires_resubmission') && (
                              <div className="relative group">
                                <Link
                                  to={`/documents/resubmit/${document._id}`}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 mr-2"
                                  title="Reupload rejected document"
                                >
                                  <FontAwesomeIcon icon={faUpload} className="mr-1" />
                                  Reupload
                                </Link>
                                {document.reviewNotes && (
                                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-800 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                    <p className="font-semibold mb-1">Consultant Remarks:</p>
                                    <p>{document.reviewNotes}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this document?')) {
                                  console.log('Attempting to delete document with ID:', document._id);
                                  
                                  // Add debugging info to identify document properly
                                  console.log('Document details:', {
                                    id: document._id,
                                    title: document.title,
                                    type: document.documentType,
                                    status: document.status
                                  });
                                  
                                  apiService.documents.delete(document._id)
                                    .then((response) => {
                                      console.log('Delete response:', response.data);
                                      setSuccess('Document deleted successfully');
                                      fetchDocuments(pagination.page, pagination.limit);
                                      setTimeout(() => setSuccess(null), 3000);
                                    })
                                    .catch(err => {
                                      console.error('Error deleting document:', err);
                                      setError(err.response?.data?.message || 'Failed to delete document');
                                    });
                                }
                              }}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <FontAwesomeIcon icon={faTimesCircle} className="mr-1" />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      pagination.page === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      pagination.page === pagination.totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}</span> to{' '}
                      <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                      <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          pagination.page === 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Page numbers */}
                      {[...Array(pagination.totalPages)].map((_, index) => (
                        <button
                          key={index}
                          onClick={() => handlePageChange(index + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagination.page === index + 1
                              ? 'z-10 bg-blue-500 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          pagination.page === pagination.totalPages
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default DocumentListPage;