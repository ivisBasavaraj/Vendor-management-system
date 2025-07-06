import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  EyeIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import apiService from '../../utils/api';

interface Document {
  _id: string;
  title: string;
  documentType: string;
  submissionDate: string;
  approvalDate: string;
  vendor: {
    _id: string;
    name: string;
    company: string;
  };
  reviewer: {
    _id: string;
    name: string;
  };
  files: Array<{
    _id: string;
    originalName: string;
    path: string;
    mimeType: string;
  }>;
  reviewNotes?: string;
}

const ApprovedDocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const [vendors, setVendors] = useState<Array<{ _id: string, name: string, company: string }>>([]);

  // Fetch approved documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        
        // Add parameters to get only documents assigned to the current consultant
        const params = {
          consultantId: user?._id,
          includeVendorDetails: true,
          includeFiles: true
        };
        
        console.log('Fetching approved documents with params:', params);
        const response = await apiService.documents.getByStatus('approved', params);
        if (response.data.success) {
          console.log('API response data:', response.data);
          
          // Make sure we have the expected data structure
          const documentsData = response.data.data || [];
          
          // Log the first document for debugging
          if (documentsData.length > 0) {
            console.log('First document sample:', documentsData[0]);
          }
          
          setDocuments(documentsData);
          setFilteredDocuments(documentsData);
          
          // Extract unique vendors for filter
          const uniqueVendors = Array.from(
            new Set(documentsData.map((doc: Document) => doc.vendor?._id).filter(Boolean))
          ).map(vendorId => {
            const doc = documentsData.find((d: Document) => d.vendor?._id === vendorId);
            return {
              _id: vendorId as string,
              name: doc?.vendor?.name || 'Unknown Vendor',
              company: doc?.vendor?.company || 'Unknown Company'
            };
          });
          setVendors(uniqueVendors);
        } else {
          setError('Failed to fetch approved documents');
        }
      } catch (err: any) {
        console.error('Error fetching approved documents:', err);
        
        // Log detailed error information
        const errorDetails = {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data
        };
        console.log('Error details:', errorDetails);
        
        // Set a user-friendly error message
        const errorMessage = err.response?.data?.message || err.message || 'An error occurred while fetching documents';
        setError(`${errorMessage} (${err.response?.status || 'Unknown error'})`);
        
        // Initialize with empty arrays instead of mock data
        setDocuments([]);
        setFilteredDocuments([]);
        setVendors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user]);

  // Filter documents based on search query, vendor filter, and date filter
  useEffect(() => {
    let filtered = documents;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        (doc.title?.toLowerCase() || '').includes(query) ||
        (doc.vendor?.company?.toLowerCase() || '').includes(query) ||
        (doc.vendor?.name?.toLowerCase() || '').includes(query) ||
        (doc.documentType?.toLowerCase() || '').includes(query)
      );
    }
    
    // Apply vendor filter
    if (vendorFilter !== 'all') {
      filtered = filtered.filter(doc => doc.vendor?._id === vendorFilter);
    }
    
    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          // Today
          filtered = filtered.filter(doc => {
            if (!doc.approvalDate) return false;
            try {
              const approvalDate = new Date(doc.approvalDate);
              return approvalDate.toDateString() === now.toDateString();
            } catch (e) {
              console.error('Invalid date format:', doc.approvalDate);
              return false;
            }
          });
          break;
        case 'week':
          // Last 7 days
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(doc => {
            if (!doc.approvalDate) return false;
            try {
              const approvalDate = new Date(doc.approvalDate);
              return approvalDate >= filterDate;
            } catch (e) {
              console.error('Invalid date format:', doc.approvalDate);
              return false;
            }
          });
          break;
        case 'month':
          // Last 30 days
          filterDate.setDate(now.getDate() - 30);
          filtered = filtered.filter(doc => {
            if (!doc.approvalDate) return false;
            try {
              const approvalDate = new Date(doc.approvalDate);
              return approvalDate >= filterDate;
            } catch (e) {
              console.error('Invalid date format:', doc.approvalDate);
              return false;
            }
          });
          break;
        case 'quarter':
          // Last 90 days
          filterDate.setDate(now.getDate() - 90);
          filtered = filtered.filter(doc => {
            if (!doc.approvalDate) return false;
            try {
              const approvalDate = new Date(doc.approvalDate);
              return approvalDate >= filterDate;
            } catch (e) {
              console.error('Invalid date format:', doc.approvalDate);
              return false;
            }
          });
          break;
      }
    }
    
    setFilteredDocuments(filtered);
  }, [documents, searchQuery, vendorFilter, dateFilter]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by the useEffect
  };

  // Download document file
  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      if (!filePath) {
        setError('File path is missing');
        return;
      }
      
      console.log(`Attempting to download file: ${filePath}`);
      const response = await apiService.documents.downloadFile(filePath);
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'document.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      console.log(`File downloaded successfully: ${fileName}`);
    } catch (err: any) {
      console.error('Error downloading file:', err);
      
      // Log detailed error information
      const errorDetails = {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      };
      console.log('Download error details:', errorDetails);
      
      // Set a user-friendly error message
      const errorMessage = err.response?.data?.message || err.message || 'Failed to download file';
      setError(`${errorMessage} (${err.response?.status || 'Unknown error'})`);
    }
  };

  // Export documents to CSV
  const exportToCSV = () => {
    const headers = ['Title', 'Type', 'Vendor', 'Submission Date', 'Approval Date', 'Reviewer'];
    const csvData = filteredDocuments.map(doc => [
      doc.title || 'Untitled Document',
      doc.documentType ? doc.documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown Type',
      doc.vendor ? `${doc.vendor.company || 'Unknown Company'} (${doc.vendor.name || 'Unknown Vendor'})` : 'Unknown Vendor',
      doc.submissionDate ? new Date(doc.submissionDate).toLocaleDateString() : 'Unknown Date',
      doc.approvalDate ? new Date(doc.approvalDate).toLocaleDateString() : 'Unknown Date',
      doc.reviewer?.name || 'Unknown Reviewer'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'approved_documents.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format document type
  const formatDocumentType = (type: string | undefined) => {
    if (!type) return 'Unknown Document Type';
    
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Only consultants can access this page
  if (!user || !['consultant', 'cross_verifier', 'approver', 'admin'].includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Approved Documents</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View all documents that have been approved
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button
              leftIcon={<ArrowDownTrayIcon className="h-5 w-5" />}
              onClick={exportToCSV}
            >
              Export to CSV
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <Card className="mb-6">
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <form onSubmit={handleSearch} className="flex w-full">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="ml-2 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Search
                  </button>
                </form>
              </div>

              <div className="md:w-48">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={vendorFilter}
                    onChange={(e) => setVendorFilter(e.target.value)}
                  >
                    <option value="all">All Vendors</option>
                    {vendors.map(vendor => (
                      <option key={vendor._id} value={vendor._id}>
                        {vendor.company || 'Unknown Company'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="md:w-48">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="quarter">Last 90 Days</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Documents List */}
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No approved documents found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchQuery || vendorFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No documents have been approved yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDocuments.map((document) => (
              <Card key={document._id}>
                <div className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {document.title || 'Untitled Document'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {formatDocumentType(document.documentType)}
                      </p>
                    </div>
                    <div className="mt-2 md:mt-0 flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Approved
                      </span>
                      <Button
                        size="sm"
                        as={Link}
                        to={`/documents/${document._id}`}
                        leftIcon={<EyeIcon className="h-4 w-4" />}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                      {document.vendor?.company || 'Unknown Company'}
                    </div>
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 mr-1" />
                      {document.vendor?.name || 'Unknown Vendor'}
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Approved: {document.approvalDate ? new Date(document.approvalDate).toLocaleDateString() : 'Unknown Date'}
                    </div>
                  </div>

                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ApprovedDocumentsPage;