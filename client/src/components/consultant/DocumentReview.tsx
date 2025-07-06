import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../utils/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';

// Define years and months for dropdown
const YEARS = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);
const MONTHS = [
  { value: 'All', label: 'All Months' },
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

interface DocumentSubmission {
  _id: string;
  submissionId: string;
  uploadPeriod: {
    year: number;
    month: string;
  };
  submissionDate: string;
  submissionStatus: string;
  vendor: {
    _id: string;
    name: string;
    email: string;
    company: string;
  };
  documents: Array<{
    _id: string;
    documentType: string;
    documentName: string;
    fileName: string;
    filePath: string;
    status: string;
    consultantRemarks?: string;
  }>;
  consultantApproval: {
    isApproved: boolean;
    approvalDate?: string;
    remarks?: string;
  };
}

const DocumentReview: React.FC = () => {
  // Filter state
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth() + 1].value);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Data state
  const [submissions, setSubmissions] = useState<DocumentSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [reviewInProgress, setReviewInProgress] = useState<{ [key: string]: boolean }>({});
  const [documentRemarks, setDocumentRemarks] = useState<{ [key: string]: string }>({});
  const [overallRemarks, setOverallRemarks] = useState<{ [key: string]: string }>({});
  const [savingStatus, setSavingStatus] = useState<{ [key: string]: 'idle' | 'saving' | 'success' | 'error' }>({});
  
  const navigate = useNavigate();
  
  // Fetch submissions based on filters
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Prepare query parameters
        const params: any = {
          year: selectedYear
        };
        
        if (selectedMonth !== 'All') {
          params.month = selectedMonth;
        }
        
        console.log("Fetching consultant submissions with params:", params);
        
        // Fetch submissions assigned to the consultant
        const response = await apiService.documents.getConsultantSubmissions(params);
        
        console.log("Consultant submissions API response:", response.data);
        
        if (response.data.success) {
          const submissionsData = response.data.data;
          
          console.log(`Received ${submissionsData.length} submissions from API`);
          
          // Initialize remarks state for all documents
          const initialDocumentRemarks: { [key: string]: string } = {};
          const initialOverallRemarks: { [key: string]: string } = {};
          
          submissionsData.forEach((submission: DocumentSubmission) => {
            console.log(`Processing submission: ${submission.submissionId}, documents: ${submission.documents.length}`);
            
            submission.documents.forEach(doc => {
              initialDocumentRemarks[doc._id] = doc.consultantRemarks || '';
            });
            
            initialOverallRemarks[submission._id] = submission.consultantApproval?.remarks || '';
          });
          
          setDocumentRemarks(initialDocumentRemarks);
          setOverallRemarks(initialOverallRemarks);
          setSubmissions(submissionsData);
          
          if (submissionsData.length === 0) {
            console.log("No submissions found for the consultant. Check if vendors are correctly assigned to this consultant.");
          }
        } else {
          console.error("API returned success: false", response.data);
          setError(response.data.message || 'Failed to fetch document submissions');
        }
      } catch (err: any) {
        console.error('Error fetching submissions:', err);
        console.error('Error details:', err.response?.data || err.message);
        setError(err.message || 'An error occurred while fetching submissions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubmissions();
  }, [selectedYear, selectedMonth]);
  
  // Toggle expanded submission
  const toggleExpand = (submissionId: string) => {
    if (expandedSubmission === submissionId) {
      setExpandedSubmission(null);
    } else {
      setExpandedSubmission(submissionId);
    }
  };
  
  // Download document
  const handleDownloadDocument = async (documentPath: string, fileName: string) => {
    try {
      // Validate inputs
      if (!documentPath) {
        console.error('Invalid document path:', documentPath);
        setError('Cannot download document: Missing file path');
        return;
      }
      
      console.log('Downloading document:', { documentPath, fileName });
      const response = await apiService.documents.downloadFile(documentPath);
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'document');
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        link.remove();
      }, 100);
    } catch (err: any) {
      console.error('Error downloading document:', err);
      setError(err.message || 'Failed to download document');
    }
  };
  
  // Update document status
  const handleUpdateDocumentStatus = async (submissionId: string, documentId: string, newStatus: string) => {
    try {
      // Enhanced debugging
      console.log('Original IDs received:', { 
        submissionId_original: submissionId, 
        documentId_original: documentId,
        submissionId_type: typeof submissionId,
        documentId_type: typeof documentId
      });
      
      // Validate IDs
      if (!submissionId || !documentId) {
        console.error('Invalid submission or document ID', { submissionId, documentId });
        setError('Cannot update document status: Missing ID information');
        return;
      }
      
      // Check if remarks are provided - they are mandatory for both approval and rejection
      if (!documentRemarks[documentId] || documentRemarks[documentId].trim() === '') {
        setError('Please provide remarks. Remarks are mandatory for both approval and rejection.');
        return;
      }

      // Try to get the actual submission from state
      const submission = submissions.find(s => String(s._id) === String(submissionId));
      if (!submission) {
        console.error('Submission not found in state with ID:', submissionId);
        console.log('Available submissions:', submissions.map(s => ({ id: s._id, submissionId: s.submissionId })));
        setError('Cannot update document status: Submission not found');
        return;
      }
      
      // Try to get the actual document from submission
      const document = submission.documents.find(d => String(d._id) === String(documentId));
      if (!document) {
        console.error('Document not found in submission with ID:', documentId);
        console.log('Available documents in this submission:', 
          submission.documents.map(d => ({ id: d._id, name: d.documentName }))
        );
        setError('Cannot update document status: Document not found');
        return;
      }
      
      // Using the verified IDs from the actual objects
      const verifiedSubmissionId = String(submission._id);
      const verifiedDocumentId = String(document._id);
      
      console.log('Verified IDs to use:', { 
        verifiedSubmissionId, 
        verifiedDocumentId,
        newStatus
      });
      
      // Update local state first for immediate feedback
      setSubmissions(prev => 
        prev.map(sub => {
          if (String(sub._id) === String(verifiedSubmissionId)) {
            return {
              ...sub,
              documents: sub.documents.map(doc => {
                if (String(doc._id) === String(verifiedDocumentId)) {
                  return {
                    ...doc,
                    status: newStatus
                  };
                }
                return doc;
              })
            };
          }
          return sub;
        })
      );
      
      // Set saving status
      setSavingStatus(prev => ({
        ...prev,
        [verifiedDocumentId]: 'saving'
      }));
      
      // Log API request
      console.log('Sending API request with params:', {
        submissionId: verifiedSubmissionId,
        documentId: verifiedDocumentId,
        data: {
          status: newStatus,
          remarks: documentRemarks[verifiedDocumentId] || ''
        }
      });
      
      // Send API request
      await apiService.documents.updateDocumentStatus(
        verifiedSubmissionId, 
        verifiedDocumentId, 
        {
          status: newStatus,
          remarks: documentRemarks[verifiedDocumentId] || ''
        }
      );
      
      // Update saving status
      setSavingStatus(prev => ({
        ...prev,
        [verifiedDocumentId]: 'success'
      }));
      
      // Reset status after a delay
      setTimeout(() => {
        setSavingStatus(prev => ({
          ...prev,
          [verifiedDocumentId]: 'idle'
        }));
      }, 2000);
    } catch (err: any) {
      console.error('Error updating document status:', err);
      // Safely access error properties after type assertion
      console.error('Error details:', 
        err && typeof err === 'object' ? (err.response?.data || err.message || 'Unknown error') : String(err)
      );
      setError('Failed to update document status');
      
      // Update saving status
      setSavingStatus(prev => ({
        ...prev,
        [documentId]: 'error'
      }));
    }
  };
  
  // Save document remarks
  const handleSaveRemarks = async (submissionId: string, documentId: string) => {
    try {
      // Validate IDs
      if (!submissionId || !documentId) {
        console.error('Invalid submission or document ID', { submissionId, documentId });
        setError('Cannot save remarks: Missing ID information');
        return;
      }

      console.log('Saving document remarks:', { submissionId, documentId, remarks: documentRemarks[documentId] });
      
      // Set saving status
      setSavingStatus(prev => ({
        ...prev,
        [documentId]: 'saving'
      }));
      
      // Send API request
      await apiService.documents.updateDocumentRemarks(submissionId, documentId, {
        remarks: documentRemarks[documentId]
      });
      
      // Update saving status
      setSavingStatus(prev => ({
        ...prev,
        [documentId]: 'success'
      }));
      
      // Reset status after a delay
      setTimeout(() => {
        setSavingStatus(prev => ({
          ...prev,
          [documentId]: 'idle'
        }));
      }, 2000);
    } catch (err: any) {
      console.error('Error saving remarks:', err);
      setError(err.message || 'Failed to save remarks');
      
      // Update saving status
      setSavingStatus(prev => ({
        ...prev,
        [documentId]: 'error'
      }));
    }
  };
  
  // Final approval
  const handleFinalApproval = async (submissionId: string) => {
    try {
      // Check if all documents are reviewed
      const submission = submissions.find(s => s._id === submissionId);
      
      if (!submission) {
        setError('Submission not found');
        return;
      }
      
      const allDocumentsReviewed = submission.documents.every(doc => 
        doc.status === 'approved' || doc.status === 'rejected'
      );
      
      if (!allDocumentsReviewed) {
        setError('All documents must be approved or rejected before final approval');
        return;
      }
      
      // Check if overall remarks are provided
      if (!overallRemarks[submissionId] || overallRemarks[submissionId].trim() === '') {
        setError('Please provide overall remarks. Remarks are mandatory for final approval.');
        return;
      }
      
      // Set saving status
      setSavingStatus(prev => ({
        ...prev,
        [submissionId]: 'saving'
      }));
      
      // Send API request
      await apiService.documents.finalizeSubmissionReview(submissionId, {
        isApproved: true,
        remarks: overallRemarks[submissionId] || ''
      });
      
      // Update local state
      setSubmissions(prev => 
        prev.map(submission => {
          if (submission._id === submissionId) {
            return {
              ...submission,
              submissionStatus: 'fully_approved',
              consultantApproval: {
                ...submission.consultantApproval,
                isApproved: true,
                approvalDate: new Date().toISOString(),
                remarks: overallRemarks[submissionId] || ''
              }
            };
          }
          return submission;
        })
      );
      
      // Update saving status
      setSavingStatus(prev => ({
        ...prev,
        [submissionId]: 'success'
      }));
      
      // Reset status after a delay
      setTimeout(() => {
        setSavingStatus(prev => ({
          ...prev,
          [submissionId]: 'idle'
        }));
      }, 2000);
    } catch (err: any) {
      console.error('Error finalizing review:', err);
      setError(err.message || 'Failed to finalize review');
      
      // Update saving status
      setSavingStatus(prev => ({
        ...prev,
        [submissionId]: 'error'
      }));
    }
  };
  
  // Reject submission
  const handleRejectSubmission = async (submissionId: string) => {
    try {
      // Validate submission ID
      if (!submissionId) {
        setError('Cannot reject: Missing submission ID');
        return;
      }
      
      // Check if remarks are provided
      if (!overallRemarks[submissionId] || overallRemarks[submissionId].trim() === '') {
        setError('Please provide overall remarks. Remarks are mandatory for rejection.');
        return;
      }
      
      // Set saving status
      setSavingStatus(prev => ({
        ...prev,
        [submissionId]: 'saving'
      }));
      
      // Send API request
      await apiService.documents.finalizeSubmissionReview(submissionId, {
        isApproved: false,
        remarks: overallRemarks[submissionId]
      });
      
      // Update local state
      setSubmissions(prev => 
        prev.map(submission => {
          if (submission._id === submissionId) {
            return {
              ...submission,
              submissionStatus: 'rejected',
              consultantApproval: {
                ...submission.consultantApproval,
                isApproved: false,
                approvalDate: new Date().toISOString(),
                remarks: overallRemarks[submissionId]
              }
            };
          }
          return submission;
        })
      );
      
      // Update saving status
      setSavingStatus(prev => ({
        ...prev,
        [submissionId]: 'success'
      }));
      
      // Reset status after a delay
      setTimeout(() => {
        setSavingStatus(prev => ({
          ...prev,
          [submissionId]: 'idle'
        }));
      }, 2000);
    } catch (err: any) {
      console.error('Error rejecting submission:', err);
      setError(err.message || 'Failed to reject submission');
      
      // Update saving status
      setSavingStatus(prev => ({
        ...prev,
        [submissionId]: 'error'
      }));
    }
  };
  
  // Contact vendor
  const handleContactVendor = (vendorEmail: string) => {
    window.location.href = `mailto:${vendorEmail}`;
  };
  
  // Filter submissions by search query and status
  const filteredSubmissions = submissions.filter(submission => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        submission.submissionId.toLowerCase().includes(query) ||
        (submission.vendor && submission.vendor.name && submission.vendor.name.toLowerCase().includes(query)) ||
        (submission.vendor && submission.vendor.company && submission.vendor.company.toLowerCase().includes(query)) ||
        (submission.documents && submission.documents.some(doc => doc.documentName && doc.documentName.toLowerCase().includes(query)))
      );
      
      if (!matchesSearch) return false;
    }
    
    // Filter by status
    if (selectedStatus !== 'all') {
      // Check if the submission status matches the selected status
      if (submission.submissionStatus === selectedStatus) {
        return true;
      }
      
      // Check if any document in the submission has the selected status
      const hasDocumentWithStatus = submission.documents.some(doc => doc.status === selectedStatus);
      
      return hasDocumentWithStatus;
    }
    
    return true;
  });
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'under_review':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
    }
  };
  
  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
      case 'fully_approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'under_review':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  // Format status text
  const formatStatus = (status: string | undefined) => {
    if (!status) return 'Unknown';
    
    return status
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Check if all documents in a submission are reviewed
  const areAllDocumentsReviewed = (submission: DocumentSubmission) => {
    return submission.documents.every(doc => 
      doc.status === 'approved' || doc.status === 'rejected'
    );
  };
  
  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Document Review
        </h2>
        
        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 space-y-1">
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Year
            </label>
            <select
              id="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              {YEARS.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 space-y-1">
            <label htmlFor="month" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Month
            </label>
            <select
              id="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              {MONTHS.map((month) => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 space-y-1">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              id="status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div className="flex-1 space-y-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Search submissions..."
              />
            </div>
          </div>
          
          <div className="flex-none">
            <Button
              variant="outline"
              leftIcon={<FunnelIcon className="h-5 w-5" />}
              onClick={() => {
                setSelectedYear(new Date().getFullYear());
                setSelectedMonth(MONTHS[new Date().getMonth() + 1].value);
                setSelectedStatus('all');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
              <span className="text-red-700 dark:text-red-400">{error}</span>
            </div>
          </div>
        )}
        
        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-md">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No submissions found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              There are no document submissions assigned to you for the selected period.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Submission ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Period
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Submission Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredSubmissions.map((submission) => (
                    <React.Fragment key={submission._id}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {submission.submissionId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {submission.vendor ? submission.vendor.name : 'Unknown Vendor'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {submission.vendor ? (submission.vendor.company || 'N/A') : 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {submission.uploadPeriod ? `${submission.uploadPeriod.month} ${submission.uploadPeriod.year}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(submission.submissionDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(submission.submissionStatus)}
                            <Badge
                              variant={getStatusBadgeVariant(submission.submissionStatus)}
                              className="ml-2"
                            >
                              {formatStatus(submission.submissionStatus)}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleExpand(submission._id)}
                              title={expandedSubmission === submission._id ? 'Hide Details' : 'Show Details'}
                            >
                              {expandedSubmission === submission._id ? (
                                <ChevronUpIcon className="h-5 w-5" />
                              ) : (
                                <ChevronDownIcon className="h-5 w-5" />
                              )}
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleContactVendor(submission.vendor.email)}
                              title="Contact Vendor"
                            >
                              <PaperAirplaneIcon className="h-5 w-5 text-blue-500" />
                            </Button>
                            
                            {submission.submissionStatus !== 'fully_approved' && submission.submissionStatus !== 'rejected' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setReviewInProgress({ ...reviewInProgress, [submission._id]: true })}
                                disabled={reviewInProgress[submission._id]}
                              >
                                Review
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded details */}
                      {expandedSubmission === submission._id && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                Document Details
                              </h4>
                              
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                  <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Document Type
                                      </th>
                                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                      </th>
                                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Remarks
                                      </th>
                                      <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                    {submission.documents.map((doc) => (
                                      <tr 
                                        key={doc._id} 
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        data-submission-id={submission._id}
                                        data-document-id={doc._id}
                                      >
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                          {doc.documentName}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                          <Badge variant={getStatusBadgeVariant(doc.status)}>
                                            {formatStatus(doc.status)}
                                          </Badge>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                                          {reviewInProgress[submission._id] ? (
                                            <div>
                                              <textarea
                                                value={documentRemarks[doc._id] || ''}
                                                onChange={(e) => setDocumentRemarks({
                                                  ...documentRemarks,
                                                  [doc._id]: e.target.value
                                                })}
                                                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                                rows={2}
                                                placeholder="Add remarks (required for both approval and rejection)..."
                                                required
                                              />
                                              <p className="mt-1 text-xs text-red-500">* Remarks are mandatory</p>
                                            </div>
                                          ) : (
                                            doc.consultantRemarks || '-'
                                          )}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                          <div className="flex justify-end space-x-2">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => {
                                                // Convert IDs to strings
                                                const submissionId = String(submission._id);
                                                const documentId = String(doc._id);
                                                
                                                console.log('Download button clicked for document:', { 
                                                  submissionId,
                                                  documentId,
                                                  filePath: doc.filePath,
                                                  fileName: doc.fileName 
                                                });
                                                handleDownloadDocument(doc.filePath, doc.fileName);
                                              }}
                                              title="Download Document"
                                            >
                                              <ArrowDownTrayIcon className="h-5 w-5 text-blue-500" />
                                            </Button>
                                            
                                            {reviewInProgress[submission._id] && (
                                              <>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="approve-doc-btn text-green-600 border-green-600 hover:bg-green-50"
                                                  data-submission-id={submission.submissionId || submission._id}
                                                  data-document-id={doc._id}
                                                  onClick={(e) => {
                                                    // Get IDs directly from the button's data attributes
                                                    const button = e.currentTarget as HTMLElement;
                                                    const submissionId = button.getAttribute('data-submission-id') || '';
                                                    const documentId = button.getAttribute('data-document-id') || '';
                                                    
                                                    console.log('Approve button clicked, using IDs from button attributes:', { 
                                                      submissionId, 
                                                      documentId 
                                                    });
                                                    
                                                    if (!submissionId || !documentId) {
                                                      console.error('Could not find IDs from button attributes');
                                                      console.log('Button element:', button);
                                                      console.log('Raw submission ID in state:', submission._id);
                                                      console.log('Raw document ID in state:', doc._id);
                                                      setError('Error: Could not identify document to approve');
                                                      return;
                                                    }
                                                    
                                                    handleUpdateDocumentStatus(submissionId, documentId, 'approved');
                                                  }}
                                                  disabled={savingStatus[doc._id] === 'saving'}
                                                >
                                                  Approve
                                                </Button>
                                                
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="reject-doc-btn text-red-600 border-red-600 hover:bg-red-50"
                                                  data-submission-id={submission.submissionId || submission._id}
                                                  data-document-id={doc._id}
                                                  onClick={(e) => {
                                                    // Get IDs directly from the button's data attributes
                                                    const button = e.currentTarget as HTMLElement;
                                                    const submissionId = button.getAttribute('data-submission-id') || '';
                                                    const documentId = button.getAttribute('data-document-id') || '';
                                                    
                                                    console.log('Reject button clicked, using IDs from button attributes:', { 
                                                      submissionId, 
                                                      documentId 
                                                    });
                                                    
                                                    if (!submissionId || !documentId) {
                                                      console.error('Could not find IDs from button attributes');
                                                      console.log('Button element:', button);
                                                      console.log('Raw submission ID in state:', submission._id);
                                                      console.log('Raw document ID in state:', doc._id);
                                                      setError('Error: Could not identify document to reject');
                                                      return;
                                                    }
                                                    
                                                    handleUpdateDocumentStatus(submissionId, documentId, 'rejected');
                                                  }}
                                                  disabled={savingStatus[doc._id] === 'saving'}
                                                >
                                                  Reject
                                                </Button>
                                                
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="save-remarks-btn"
                                                  data-submission-id={submission._id}
                                                  data-document-id={doc._id}
                                                  onClick={(e) => {
                                                    // Get IDs directly from the button's data attributes
                                                    const button = e.currentTarget as HTMLElement;
                                                    const submissionId = button.getAttribute('data-submission-id') || '';
                                                    const documentId = button.getAttribute('data-document-id') || '';
                                                    
                                                    console.log('Save remarks button clicked, using IDs from button attributes:', { 
                                                      submissionId, 
                                                      documentId 
                                                    });
                                                    
                                                    if (!submissionId || !documentId) {
                                                      console.error('Could not find IDs from button attributes');
                                                      console.log('Button element:', button);
                                                      console.log('Raw submission ID in state:', submission._id);
                                                      console.log('Raw document ID in state:', doc._id);
                                                      setError('Error: Could not identify document to save remarks for');
                                                      return;
                                                    }
                                                    
                                                    handleSaveRemarks(submissionId, documentId);
                                                  }}
                                                  disabled={savingStatus[doc._id] === 'saving'}
                                                >
                                                  {savingStatus[doc._id] === 'saving' ? 'Saving...' : 
                                                   savingStatus[doc._id] === 'success' ? 'Saved!' : 
                                                   savingStatus[doc._id] === 'error' ? 'Error!' : 'Save'}
                                                </Button>
                                              </>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              
                              {/* Review actions */}
                              {reviewInProgress[submission._id] && (
                                <div className="mt-6 space-y-4">
                                  <div>
                                    <label htmlFor={`overall-remarks-${submission._id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Overall Remarks <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                      id={`overall-remarks-${submission._id}`}
                                      value={overallRemarks[submission._id] || ''}
                                      onChange={(e) => setOverallRemarks({
                                        ...overallRemarks,
                                        [submission._id]: e.target.value
                                      })}
                                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                      rows={3}
                                      placeholder="Add overall remarks for this submission (required)..."
                                      required
                                    />
                                    <p className="mt-1 text-xs text-red-500">* Remarks are mandatory for final approval</p>
                                  </div>
                                  
                                  <div className="flex justify-between">
                                    <Button
                                      variant="outline"
                                      onClick={() => setReviewInProgress({ ...reviewInProgress, [submission._id]: false })}
                                    >
                                      Cancel
                                    </Button>
                                    
                                    <div className="space-x-3">
                                      <Button
                                        variant="danger"
                                        onClick={() => handleRejectSubmission(submission._id)}
                                        disabled={!overallRemarks[submission._id] || savingStatus[submission._id] === 'saving'}
                                      >
                                        Reject Submission
                                      </Button>
                                      
                                      <Button
                                        variant="primary"
                                        onClick={() => handleFinalApproval(submission._id)}
                                        disabled={!areAllDocumentsReviewed(submission) || savingStatus[submission._id] === 'saving'}
                                      >
                                        {savingStatus[submission._id] === 'saving' ? 'Processing...' : 
                                         savingStatus[submission._id] === 'success' ? 'Approved!' : 
                                         savingStatus[submission._id] === 'error' ? 'Error!' : 'Finalize Approval'}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DocumentReview;