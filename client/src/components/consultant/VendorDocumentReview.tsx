import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PaperAirplaneIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

// Define years and months for dropdown
const YEARS = Array.from({ length: 11 }, (_, i) => 2025 + i);
const MONTHS = [
  { value: 'All', label: 'All Months' },
  { value: 'Apr', label: 'April' },
  { value: 'May', label: 'May' },
  { value: 'Jun', label: 'June' },
  { value: 'Jul', label: 'July' },
  { value: 'Aug', label: 'August' },
  { value: 'Sep', label: 'September' },
  { value: 'Oct', label: 'October' },
  { value: 'Nov', label: 'November' },
  { value: 'Dec', label: 'December' },
  { value: 'Jan', label: 'January' },
  { value: 'Feb', label: 'February' },
  { value: 'Mar', label: 'March' }
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

interface Vendor {
  _id: string;
  name: string;
  company: string;
  email: string;
}

const VendorDocumentReview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Filter state
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedVendor, setSelectedVendor] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  
  // Data state
  const [submissions, setSubmissions] = useState<DocumentSubmission[]>([]);
  const [assignedVendors, setAssignedVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [documentRemarks, setDocumentRemarks] = useState<{ [key: string]: string }>({});
  const [overallRemarks, setOverallRemarks] = useState<{ [key: string]: string }>({});
  const [savingStatus, setSavingStatus] = useState<{ [key: string]: 'idle' | 'saving' | 'success' | 'error' }>({});
  
  // Fetch assigned vendors
  useEffect(() => {
    const fetchAssignedVendors = async () => {
      try {
        const response = await apiService.users.getVendors({ assignedConsultant: user?._id });
        
        if (response.data.success) {
          setAssignedVendors(response.data.data);
        }
      } catch (err: any) {
        console.error('Error fetching assigned vendors:', err);
      }
    };
    
    if (user?._id) {
      fetchAssignedVendors();
    }
  }, [user]);
  
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
        
        if (selectedVendor !== 'All') {
          params.vendorId = selectedVendor;
        }
        
        if (selectedStatus !== 'All') {
          params.status = selectedStatus;
        }
        
        // Fetch submissions assigned to the consultant
        const response = await apiService.documents.getConsultantSubmissions(params);
        
        if (response.data.success) {
          const submissionsData = response.data.data;
          
          // Initialize remarks state for all documents
          const initialDocumentRemarks: { [key: string]: string } = {};
          const initialOverallRemarks: { [key: string]: string } = {};
          
          submissionsData.forEach((submission: DocumentSubmission) => {
            submission.documents.forEach(doc => {
              initialDocumentRemarks[doc._id] = doc.consultantRemarks || '';
            });
            
            initialOverallRemarks[submission._id] = submission.consultantApproval?.remarks || '';
          });
          
          setDocumentRemarks(initialDocumentRemarks);
          setOverallRemarks(initialOverallRemarks);
          setSubmissions(submissionsData);
        } else {
          setError(response.data.message || 'Failed to fetch document submissions');
        }
      } catch (err: any) {
        console.error('Error fetching submissions:', err);
        setError(err.message || 'An error occurred while fetching submissions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubmissions();
  }, [selectedYear, selectedMonth, selectedVendor, selectedStatus, user]);
  
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
      const response = await apiService.documents.downloadFile(documentPath);
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading document:', err);
      setError('Failed to download document');
    }
  };
  
  // Update document status
  const handleUpdateDocumentStatus = async (submissionId: string, documentId: string, newStatus: string) => {
    try {
      // Update local state first for immediate feedback
      setSubmissions(prev => 
        prev.map(submission => {
          if (submission._id === submissionId) {
            return {
              ...submission,
              documents: submission.documents.map(doc => {
                if (doc._id === documentId) {
                  return {
                    ...doc,
                    status: newStatus
                  };
                }
                return doc;
              })
            };
          }
          return submission;
        })
      );
      
      // Set saving status
      setSavingStatus(prev => ({
        ...prev,
        [documentId]: 'saving'
      }));
      
      // Send API request
      await apiService.documents.updateDocumentStatus(submissionId, documentId, {
        status: newStatus,
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
    } catch (err) {
      console.error('Error updating document status:', err);
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
    } catch (err) {
      console.error('Error saving remarks:', err);
      setError('Failed to save remarks');
      
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
      
      if (!submission) return;
      
      const allDocumentsReviewed = submission.documents.every(doc => 
        doc.status === 'approved' || doc.status === 'rejected'
      );
      
      if (!allDocumentsReviewed) {
        setError('All documents must be approved or rejected before final approval');
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
        remarks: overallRemarks[submissionId]
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
    } catch (err) {
      console.error('Error finalizing review:', err);
      setError('Failed to finalize review');
      
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
    } catch (err) {
      console.error('Error rejecting submission:', err);
      setError('Failed to reject submission');
      
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
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="neutral">Pending</Badge>;
      case 'under_review':
        return <Badge variant="info">Under Review</Badge>;
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      case 'fully_approved':
        return <Badge variant="success">Fully Approved</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
            <span className="text-red-700 dark:text-red-400">{error}</span>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex items-center mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filter Documents</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            
            <div>
              <label htmlFor="month" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            
            <div>
              <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vendor
              </label>
              <select
                id="vendor"
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="All">All Vendors</option>
                {assignedVendors.map((vendor) => (
                  <option key={vendor._id} value={vendor._id}>{vendor.name} ({vendor.company})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="All">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="fully_approved">Fully Approved</option>
              </select>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Submissions List */}
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      ) : submissions.length === 0 ? (
        <Card>
          <div className="p-8 text-center">
            <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No documents found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No document submissions match your current filters. Try adjusting your filters or check back later.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <Card key={submission._id}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mr-3">
                        {submission.submissionId}
                      </h3>
                      {getStatusBadge(submission.submissionStatus)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Vendor:</span> {submission.vendor ? `${submission.vendor.name} (${submission.vendor.company || 'N/A'})` : 'Unknown Vendor'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Period:</span> {submission.uploadPeriod ? `${submission.uploadPeriod.month} ${submission.uploadPeriod.year}` : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Submitted:</span> {new Date(submission.submissionDate).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-4 md:mt-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleContactVendor(submission.vendor.email)}
                    >
                      <PaperAirplaneIcon className="h-5 w-5 mr-1" />
                      Contact
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleExpand(submission._id)}
                    >
                      {expandedSubmission === submission._id ? (
                        <>
                          <ChevronUpIcon className="h-5 w-5 mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <ChevronDownIcon className="h-5 w-5 mr-1" />
                          View
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              {expandedSubmission === submission._id && (
                <div className="p-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Documents ({submission.documents.length})</h4>
                  
                  <div className="space-y-4">
                    {submission.documents.map((document) => (
                      <div key={document._id} className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
                              <h5 className="text-md font-medium text-gray-900 dark:text-white mr-3">
                                {document.documentName || document.documentType}
                              </h5>
                              {getStatusBadge(document.status)}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {document.fileName}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 mt-4 md:mt-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadDocument(document.filePath, document.fileName)}
                            >
                              <ArrowDownTrayIcon className="h-5 w-5 mr-1" />
                              Download
                            </Button>
                            
                            {['pending', 'under_review'].includes(document.status) && (
                              <>
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => handleUpdateDocumentStatus(submission._id, document._id, 'approved')}
                                  disabled={savingStatus[document._id] === 'saving'}
                                >
                                  <CheckCircleIcon className="h-5 w-5 mr-1" />
                                  Approve
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleUpdateDocumentStatus(submission._id, document._id, 'rejected')}
                                  disabled={savingStatus[document._id] === 'saving'}
                                >
                                  <XCircleIcon className="h-5 w-5 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <label htmlFor={`remarks-${document._id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Remarks
                          </label>
                          <textarea
                            id={`remarks-${document._id}`}
                            value={documentRemarks[document._id] || ''}
                            onChange={(e) => setDocumentRemarks(prev => ({
                              ...prev,
                              [document._id]: e.target.value
                            }))}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 resize-none"
                            rows={2}
                            placeholder="Add your remarks about this document..."
                          ></textarea>
                          
                          <div className="mt-2 flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSaveRemarks(submission._id, document._id)}
                              disabled={savingStatus[document._id] === 'saving'}
                            >
                              {savingStatus[document._id] === 'saving' ? 'Saving...' : 'Save Remarks'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Final Decision</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor={`overall-remarks-${submission._id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Overall Remarks
                        </label>
                        <textarea
                          id={`overall-remarks-${submission._id}`}
                          value={overallRemarks[submission._id] || ''}
                          onChange={(e) => setOverallRemarks(prev => ({
                            ...prev,
                            [submission._id]: e.target.value
                          }))}
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 resize-none"
                          rows={3}
                          placeholder="Add your overall remarks for this submission..."
                        ></textarea>
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        {['pending', 'under_review'].includes(submission.submissionStatus) && (
                          <>
                            <Button
                              variant="danger"
                              onClick={() => handleRejectSubmission(submission._id)}
                              disabled={savingStatus[submission._id] === 'saving'}
                            >
                              <XCircleIcon className="h-5 w-5 mr-1" />
                              Reject Submission
                            </Button>
                            
                            <Button
                              variant="success"
                              onClick={() => handleFinalApproval(submission._id)}
                              disabled={savingStatus[submission._id] === 'saving'}
                            >
                              <CheckCircleIcon className="h-5 w-5 mr-1" />
                              Approve Submission
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorDocumentReview;