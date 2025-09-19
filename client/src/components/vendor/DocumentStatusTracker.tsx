import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../utils/api';
import { getMimeTypeFromFileName, canPreviewInBrowser } from '../../utils/mimeTypes';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

// Define years and months for dropdown
const YEARS = Array.from({ length: 16 }, (_, i) => 2035 - i);
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

// Types for Document Submission
interface Document {
  id?: string;
  type?: string;
  documentType?: string;  // Common field name from backend
  docType?: string;       // Alternative field name
  category?: string;      // Another possible field name
  name?: string;
  title?: string;         // Another possible field name for document name
  status: string;
  uploadDate?: string;
  reviewDate?: string;
  consultantStatus?: string;
  consultantRemarks?: string;
  remarks?: string;  // Add this field to handle different field names
  reviewNotes?: string;  // Add this field to handle different field names
  filePath?: string;
}

interface Consultant {
  name: string;
  email: string;
}

interface DocumentSubmission {
  id: string;
  submissionId: string;
  period: string;
  status: string;
  submissionDate?: string;
  lastModified?: string;
  documentCount: number;
  consultant: Consultant;
  documents: Document[];
}

interface DocumentStatusTrackerProps {
  showRejectedOnly?: boolean;
}

const DocumentStatusTracker: React.FC<DocumentStatusTrackerProps> = ({ showRejectedOnly = false }) => {
  // Filter state
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear()); // Default to current year
  const [selectedMonth, setSelectedMonth] = useState<string>('All'); // Show all months by default
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Data state
  const [submissions, setSubmissions] = useState<DocumentSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [selectedDocumentForView, setSelectedDocumentForView] = useState<Document | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState<boolean>(false);
  
  // Fetch submissions based on filters
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Prepare query parameters - always fetch all data for the year
        // and filter on frontend to ensure we get all documents
        const params: Record<string, any> = {
          year: selectedYear
        };
        
        // Never send month to backend - filter only on frontend
        
        console.log('Fetching submissions with filters:', {
          ...params,
          selectedYear,
          selectedMonth,
          showRejectedOnly,
          note: 'Month filtering will be done on frontend'
        });
        
        if (showRejectedOnly) {
          params.status = 'rejected,requires_resubmission';
        }
        
        try {
          // Fetch submissions
          const response = await apiService.documents.getVendorSubmissions(params);
          
          console.log('API Response:', response.data);
          
          if (response.data.success) {
            // Ensure submissions is always an array
            let submissionsData = Array.isArray(response.data.data) 
              ? response.data.data 
              : [];
            
            // Process and normalize submission data
            submissionsData = submissionsData.map((submission: any) => {
              // Normalize submission status
              let normalizedSubmission = { ...submission };
              if (normalizedSubmission.status === 'draft') {
                normalizedSubmission.status = 'in_progress';
              }
              
              // Ensure submission has all required fields
              normalizedSubmission.submissionId = normalizedSubmission.submissionId || normalizedSubmission._id || normalizedSubmission.id;
              normalizedSubmission.id = normalizedSubmission._id || normalizedSubmission.id || normalizedSubmission.submissionId;
              
              // Handle period - prefer uploadPeriod when available
              if ((normalizedSubmission as any).uploadPeriod?.month && (normalizedSubmission as any).uploadPeriod?.year) {
                normalizedSubmission.period = `${(normalizedSubmission as any).uploadPeriod.month} ${(normalizedSubmission as any).uploadPeriod.year}`;
              } else if (!normalizedSubmission.period && normalizedSubmission.month && normalizedSubmission.year) {
                normalizedSubmission.period = `${normalizedSubmission.month} ${normalizedSubmission.year}`;
              } else if (!normalizedSubmission.period && normalizedSubmission.submissionPeriod) {
                normalizedSubmission.period = normalizedSubmission.submissionPeriod;
              } else if (!normalizedSubmission.period) {
                // Try to extract from submissionDate if available
                const date = normalizedSubmission.submissionDate || normalizedSubmission.createdAt;
                if (date) {
                  const dateObj = new Date(date);
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  normalizedSubmission.period = `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
                }
              }
              
              // Handle submission date - try multiple field names
              if (!normalizedSubmission.submissionDate) {
                normalizedSubmission.submissionDate = 
                  normalizedSubmission.submissionDate || 
                  normalizedSubmission.createdAt || 
                  normalizedSubmission.updatedAt ||
                  normalizedSubmission.lastModified;
              }
              
              // Handle consultant information
              if (!normalizedSubmission.consultant && normalizedSubmission.assignedConsultant) {
                normalizedSubmission.consultant = normalizedSubmission.assignedConsultant;
              }
              
              // Process documents array
              if (normalizedSubmission.documents && Array.isArray(normalizedSubmission.documents)) {
                normalizedSubmission.documents = normalizedSubmission.documents.map((doc: Document) => {
                  // Normalize document status
                  if (doc.status === 'draft') {
                    doc = { ...doc, status: 'in_progress' };
                  }
                  
                  // Set consultantStatus if not present but status is rejected
                  if (!doc.consultantStatus && (doc.status === 'rejected' || doc.status === 'requires_resubmission')) {
                    doc.consultantStatus = 'rejected';
                  }
                  
                  // Copy remarks to consultantRemarks if needed
                  if (!doc.consultantRemarks && (doc.remarks || doc.reviewNotes)) {
                    doc.consultantRemarks = doc.remarks || doc.reviewNotes;
                  }
                  
                  return doc;
                });
              }
              
              return normalizedSubmission;
            });
            
            console.log('Processed submissions data:', submissionsData);
            console.log('Sample submission data:', submissionsData[0]);
            setSubmissions(submissionsData);
          } else {
            setError(response.data.message || 'Failed to fetch document submissions');
            // Set empty array to prevent filter errors
            setSubmissions([]);
          }
        } catch (apiError) {
          console.error('API Error fetching submissions:', apiError);
          setError('Failed to connect to the server. Please try again later.');
          
          // Set empty array to prevent filter errors
          setSubmissions([]);
        }
      } catch (err: any) {
        console.error('Error in submission fetching process:', err);
        setError(err.message || 'An unexpected error occurred');
        // Set empty array to prevent filter errors
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubmissions();
  }, [selectedYear, selectedMonth, showRejectedOnly]);
  
  // Toggle expanded submission
  const toggleExpand = (submissionId: string) => {
    if (expandedSubmission === submissionId) {
      setExpandedSubmission(null);
    } else {
      setExpandedSubmission(submissionId);
    }
  };
  
  // Handle resubmission
  const handleResubmit = (submissionId: string) => {
    // Navigate to resubmission page with the submission ID
    window.location.href = `/documents/resubmit/${submissionId}`;
  };
  
  // Handle document viewing (show document details)
  const handleViewDocument = (document: Document) => {
    setSelectedDocumentForView(document);
    setIsDocumentModalOpen(true);
  };


  
  // Get readable document name from document type
  const getDocumentDisplayName = (doc: Document): string => {
    // Try different possible field names for document type
    const documentType = (doc as any).documentType || 
                        (doc as any).type || 
                        (doc as any).docType || 
                        (doc as any).category ||
                        '';
    
    // If we have a meaningful name (not generic), use it
    if (doc.name && doc.name !== 'Unknown Document' && doc.name !== 'Document') {
      return doc.name;
    }
    
    // Also try title field
    const title = (doc as any).title;
    if (title && title !== 'Unknown Document' && title !== 'Document') {
      return title;
    }
    
    // Convert the type to lowercase for consistent matching
    const type = documentType?.toString().toLowerCase() || '';
    
    // Map document types to readable names
    const typeToNameMap: { [key: string]: string } = {
      'invoice': 'Invoice',
      'form_t_muster_roll': 'Form T Combined Muster Roll Cum Register of Wages',
      'bank_statement': 'Bank Statement',
      'ecr': 'Electronic Challan Cum Return (ECR)',
      'pf_combined_challan': 'Combined Challan of A/C NO. 01, 02, 10, 21 & 22 (EPFO)',
      'pf_trrn_details': 'Provident Fund TRRN Details',
      'esi_contribution_history': 'ESIC Contribution History Statement',
      'esi_challan': 'ESIC Challan',
      'professional_tax_returns': 'Professional Tax Returns – Form 5A',
      'labour_welfare_fund': 'Labour Welfare Fund Form-D',
      'labour_welfare_fund_december': 'Labour Welfare Fund Form-D_Statement of Labour Welfare Fund by Employer',
      'vendor_agreement': 'Copy of Agreement (Vendors)',
      'epf_code_letter': 'EPF Code Allotment Letter',
      'epf_form_5a': 'EPF Form – 5A',
      'esic_registration': 'ESIC Registration Certificate – Form C11',
      'pt_registration': 'Professional Tax Registration Certificate – Form 3',
      'pt_enrollment': 'Professional Tax Enrollment Certificate – Form 4',
      'contract_labour_license': 'Contract Labour License',
      // Add common backend document types
      'financial': 'Financial Document',
      'compliance': 'Compliance Document',
      'registration': 'Registration Document'
    };
    
    // Check if we have a mapping for this type
    if (typeToNameMap[type]) {
      return typeToNameMap[type];
    }
    
    // If no mapping found, try to format the type nicely
    if (type) {
      return type
        .replace(/_/g, ' ')
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    // Last resort - return the original name or a default
    return doc.name || doc.title || 'Document';
  };
  
  // Filter submissions by search query and date (as backup to API filtering)
  const filteredSubmissions = Array.isArray(submissions) ? submissions.filter(submission => {
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        submission.submissionId?.toLowerCase().includes(query) ||
        (submission.consultant?.name && submission.consultant.name.toLowerCase().includes(query)) ||
        (submission.consultant?.email && submission.consultant.email.toLowerCase().includes(query)) ||
        (submission.period && submission.period.toLowerCase().includes(query)) ||
        (Array.isArray(submission.documents) && submission.documents.some(doc => 
          getDocumentDisplayName(doc).toLowerCase().includes(query) ||
          (doc.type && doc.type.toLowerCase().includes(query))
        ))
      );
      
      if (!matchesSearch) return false;
    }
    
    // Filter by submission month
    if (selectedMonth !== 'All') {
      // Extract month from multiple possible sources
      let submissionMonth = null;
      
      // Filter by period field (what's displayed to user)
      if (submission.period) {
        const periodParts = submission.period.split(' ');
        if (periodParts.length >= 2) {
          submissionMonth = periodParts[0];
        }
      }
      // Fallback to uploadPeriod.month
      else if ((submission as any).uploadPeriod?.month) {
        submissionMonth = (submission as any).uploadPeriod.month;
      }
      // Finally try submission date
      else if (submission.submissionDate) {
        const date = new Date(submission.submissionDate);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        submissionMonth = monthNames[date.getMonth()];
      }
      
      // Normalize month names for comparison
      const monthMap: { [key: string]: string } = {
        'Jan': 'Jan', 'January': 'Jan',
        'Feb': 'Feb', 'February': 'Feb', 
        'Mar': 'Mar', 'March': 'Mar',
        'Apr': 'Apr', 'April': 'Apr',
        'May': 'May',
        'Jun': 'Jun', 'June': 'Jun',
        'Jul': 'Jul', 'July': 'Jul',
        'Aug': 'Aug', 'August': 'Aug',
        'Sep': 'Sep', 'September': 'Sep',
        'Oct': 'Oct', 'October': 'Oct',
        'Nov': 'Nov', 'November': 'Nov',
        'Dec': 'Dec', 'December': 'Dec'
      };
      
      const normalizedSubmissionMonth = submissionMonth ? monthMap[submissionMonth] : null;
      const normalizedSelectedMonth = monthMap[selectedMonth] || selectedMonth;
      
      console.log('Month filtering:', {
        selectedMonth,
        submissionMonth,
        normalizedSubmissionMonth,
        normalizedSelectedMonth,
        period: submission.period,
        submissionDate: submission.submissionDate,
        match: normalizedSubmissionMonth === normalizedSelectedMonth,
        monthMapKeys: Object.keys(monthMap)
      });
      
      // Only show submissions that match the selected month
      return normalizedSubmissionMonth === normalizedSelectedMonth;
    }
    
    return true;
  }) : [];
  
  // Calculate submission status based on document statuses
  const calculateSubmissionStatus = (documents: Document[]): string => {
    if (!documents || documents.length === 0) {
      return 'in_progress'; // No documents uploaded yet
    }

    const documentStatuses = documents.map(doc => doc.status?.toLowerCase() || 'pending');
    
    // Check if any document is resubmitted (takes priority)
    const hasResubmitted = documentStatuses.some(status => 
      status === 'resubmitted'
    );
    
    // Check if any document is rejected (but not resubmitted)
    const hasRejected = documentStatuses.some(status => 
      status === 'rejected' || status === 'requires_resubmission'
    ) && !hasResubmitted;
    
    // Check if all documents are approved
    const allApproved = documentStatuses.every(status => 
      status === 'approved' || status === 'fully_approved'
    );
    
    // Check if any document is still pending or under review
    const hasPending = documentStatuses.some(status => 
      status === 'pending' || status === 'under_review' || status === 'submitted' || status === 'in_progress'
    );

    if (hasResubmitted) {
      return 'in_progress'; // Resubmitted documents are being processed
    } else if (hasRejected) {
      return 'pending'; // If any document is rejected, overall status is pending
    } else if (allApproved) {
      return 'approved'; // All documents approved
    } else if (hasPending) {
      return 'in_progress'; // Some documents still being processed
    } else {
      return 'in_progress'; // Default to in_progress
    }
  };

  // Get status icon
  const getStatusIcon = (status: string | undefined | null) => {
    if (!status) {
      return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
    
    switch (status) {
      case 'approved':
      case 'fully_approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
      case 'requires_resubmission':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'partially_approved':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'in_progress':
      case 'under_review':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
    }
  };
  
  // Get status badge variant
  const getStatusBadgeVariant = (status: string | undefined | null): 'success' | 'danger' | 'warning' | 'info' | 'default' => {
    if (!status) {
      return 'default';
    }
    
    switch (status) {
      case 'approved':
      case 'fully_approved':
        return 'success';
      case 'rejected':
      case 'requires_resubmission':
        return 'danger';
      case 'partially_approved':
        return 'warning';
      case 'under_review':
      case 'in_progress':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  // Format status text
  const formatStatus = (status: string | undefined | null) => {
    if (!status) {
      return 'Unknown';
    }
    return status
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {showRejectedOnly ? 'Rejected Documents' : 'Document Status Tracker'}
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
                setSelectedYear(new Date().getFullYear()); // Reset to current year
                setSelectedMonth('All'); // Show all months
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
          <div className="py-12 flex justify-center">
            <div className="animate-pulse flex space-x-4 items-center">
              <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
              <div className="text-gray-600 dark:text-gray-400">Loading submissions...</div>
            </div>
          </div>
        ) : filteredSubmissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submission ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consultant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submission Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {filteredSubmissions.map((submission) => (
                  <React.Fragment key={submission.id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {submission.submissionId}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {submission.period || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {submission.consultant?.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {submission.consultant?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {submission.submissionDate ? 
                          new Date(submission.submissionDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 
                          'Not submitted'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {(() => {
                            const calculatedStatus = calculateSubmissionStatus(submission.documents);
                            return (
                              <>
                                {getStatusIcon(calculatedStatus)}
                                <Badge
                                  variant={getStatusBadgeVariant(calculatedStatus)}
                                  className="ml-2"
                                >
                                  {formatStatus(calculatedStatus)}
                                </Badge>
                              </>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleExpand(submission.id)}
                            title={expandedSubmission === submission.id ? 'Hide Details' : 'Show Details'}
                          >
                            {expandedSubmission === submission.id ? (
                              <ChevronUpIcon className="h-5 w-5" />
                            ) : (
                              <ChevronDownIcon className="h-5 w-5" />
                            )}
                          </Button>
                          
                          {(submission.status === 'rejected' || submission.status === 'requires_resubmission') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResubmit(submission.id)}
                            >
                              Resubmit
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded details */}
                    {expandedSubmission === submission.id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              Document Details
                            </h4>
                            
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-800">
                                  <tr>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Document Name
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Status
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Consultant Remarks
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                  {(submission.documents || []).map((doc, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {getDocumentDisplayName(doc)}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap">
                                        <Badge variant={getStatusBadgeVariant(doc.status)}>
                                          {formatStatus(doc.status)}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                                        {doc.consultantRemarks || doc.remarks || doc.reviewNotes || '-'}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap">
                                        <div className="flex space-x-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleViewDocument(doc)}
                                            title="View Document Details"
                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                          >
                                            <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
                                            View
                                          </Button>
                                          
                                          {(doc.status === 'rejected' || doc.status === 'requires_resubmission' || 
                                            doc.consultantStatus === 'rejected') && submission.id && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleResubmit(submission.id)}
                                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                              Resubmit
                                            </Button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No document submissions found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {showRejectedOnly 
                ? `No rejected documents found for ${selectedMonth === 'All' ? selectedYear : `${selectedMonth} ${selectedYear}`}.`
                : `No document submissions found for ${selectedMonth === 'All' ? selectedYear : `${selectedMonth} ${selectedYear}`}.`}
            </p>
            <div className="text-sm text-gray-400 dark:text-gray-500 mb-4">
              <p>Try adjusting your filters:</p>
              <ul className="list-disc list-inside mt-2 text-left max-w-md mx-auto">
                <li>Select a different year or month</li>
                <li>Clear the search query</li>
                <li>Check if documents were submitted under a different period</li>
              </ul>
            </div>
            {!showRejectedOnly && (
              <Link to="/documents/upload">
                <Button>
                  Upload Documents
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
      
      {/* Document Details Modal */}
      {isDocumentModalOpen && selectedDocumentForView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Document Details
              </h2>
              <button
                onClick={() => setIsDocumentModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Document Type
                </label>
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-gray-900 dark:text-white">
                    {getDocumentDisplayName(selectedDocumentForView)}
                  </span>
                </div>
              </div>
              
              {/* Document Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <Badge variant={getStatusBadgeVariant(selectedDocumentForView.status)}>
                  {formatStatus(selectedDocumentForView.status)}
                </Badge>
              </div>
              
              {/* Upload Date */}
              {selectedDocumentForView.uploadDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Upload Date
                  </label>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(selectedDocumentForView.uploadDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              
              {/* Review Date */}
              {selectedDocumentForView.reviewDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Review Date
                  </label>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(selectedDocumentForView.reviewDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              
              {/* Consultant Status */}
              {selectedDocumentForView.consultantStatus && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Consultant Status
                  </label>
                  <Badge variant={getStatusBadgeVariant(selectedDocumentForView.consultantStatus)}>
                    {formatStatus(selectedDocumentForView.consultantStatus)}
                  </Badge>
                </div>
              )}
              
              {/* Remarks/Comments */}
              {(selectedDocumentForView.consultantRemarks || selectedDocumentForView.remarks || selectedDocumentForView.reviewNotes) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Consultant Remarks
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {selectedDocumentForView.consultantRemarks || 
                       selectedDocumentForView.remarks || 
                       selectedDocumentForView.reviewNotes || 
                       'No remarks available'}
                    </p>
                  </div>
                </div>
              )}
              
              {/* File Information */}
              {selectedDocumentForView.filePath && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    File Information
                  </label>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                   
                    <p className="text-xs text-blue-600 dark:text-blue-400 italic mt-1">
                      Note: Direct file viewing is not available in this version.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex justify-end pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setIsDocumentModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default DocumentStatusTracker;