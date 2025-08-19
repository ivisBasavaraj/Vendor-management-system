import * as React from 'react';
import { useState, useEffect, useRef, FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../utils/api';
import { FontAwesomeIcon } from '../../utils/icons';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import {
  faFilePdf,
  faFileImage,
  faFileAlt,
  faArrowLeft,
  faExclamationCircle,
  faCheckCircle,
  faSpinner,
  faHistory,
  faTimesCircle,
  faDownload,
  faFile,
  faComment,
  faEdit,
  faExchangeAlt,
  faEye,
  faClipboardCheck,
  faClipboardList
} from '@fortawesome/free-solid-svg-icons';

// Safely access the document object (SSR safety)
const getSafeDocument = (): Document => {
  if (typeof document === 'undefined') {
    throw new Error('Document is not available in this environment');
  }
  return document;
}

// --- Business data types ---
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

interface Vendor {
  _id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
}

interface AppDocument {
  _id: string;
  title: string;
  description: string;
  documentType: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'change_requested';
  submissionDate: string;
  files: DocumentFile[];
  fileUrl?: string; // Add fileUrl as an optional property
  fileName?: string; // Add fileName as an optional property
  vendor: Vendor;
  reviewer?: {
    _id: string;
    name: string;
    email: string;
  };
  reviewNotes?: string;
  reviewDate?: string;
  expiryDate?: string;
  isReupload?: boolean;
  originalDocumentId?: string;
}

interface WorkflowStage {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  startDate?: string;
  completionDate?: string;
  assignedTo?: string;
}

interface Workflow {
  _id: string;
  document: string;
  stages: WorkflowStage[];
  currentStage: string;
  isCompleted: boolean;
  completedAt?: string;
}

const DocumentReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [document, setDocument] = useState<AppDocument | null>(null);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'under_review' | 'approved' | 'rejected' | 'change_requested'>('under_review');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Individual file review state
  const [fileReviews, setFileReviews] = useState<{[fileId: string]: {
    status: 'pending' | 'approved' | 'rejected' | 'change_requested';
    notes: string;
  }}>({});
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState<'individual' | 'bulk'>('individual');


  // Fetch document data
  useEffect(() => {
    const fetchDocumentData = async () => {
      try {
        const response = await apiService.documents.getById(id!);
        if (response.data.success) {
          const docData = response.data.data;
          setDocument(docData);
          setWorkflow(response.data.workflow);
          
          // Pre-populate review status
          if (docData.status) {
            setReviewStatus(docData.status);
          }
          
          // Pre-populate review notes if they exist
          if (docData.reviewNotes) {
            setReviewNotes(docData.reviewNotes);
          }
          
          // Initialize file reviews
          if (docData.files && docData.files.length > 0) {
            const initialFileReviews: {[fileId: string]: {status: 'pending' | 'approved' | 'rejected' | 'change_requested', notes: string}} = {};
            
            docData.files.forEach((file: DocumentFile) => {
              initialFileReviews[file._id] = {
                status: file.status || 'pending',
                notes: file.reviewNotes || ''
              };
            });
            
            setFileReviews(initialFileReviews);
            
            // Set the first file as active
            if (docData.files.length > 0) {
              setActiveFileId(docData.files[0]._id);
            }
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch document details');
        console.error('Error fetching document:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDocumentData();
    }
  }, [id]);

  // Handle individual file review change
  const handleFileReviewChange = (fileId: string, field: 'status' | 'notes', value: string) => {
    setFileReviews(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        [field]: value
      }
    }));
  };
  
  // Set active file for review
  const setActiveFile = (fileId: string) => {
    setActiveFileId(fileId);
  };
  
  // Toggle review mode between individual and bulk
  const toggleReviewMode = () => {
    setReviewMode(prev => prev === 'individual' ? 'bulk' : 'individual');
  };
  
  // Calculate overall status based on individual file reviews
  const calculateOverallStatus = () => {
    if (!document || !document.files || document.files.length === 0) return 'pending';
    
    const statuses = Object.values(fileReviews).map(review => review.status);
    
    if (statuses.every(status => status === 'approved')) {
      return 'approved';
    } else if (statuses.some(status => status === 'rejected')) {
      return 'rejected';
    } else if (statuses.some(status => status === 'change_requested')) {
      return 'change_requested';
    } else {
      return 'under_review';
    }
  };
  
  // Handle document review submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For individual review mode, validate that all files have been reviewed
    if (reviewMode === 'individual') {
      const unreviewed = document?.files.filter(file => 
        !fileReviews[file._id] || fileReviews[file._id].status === 'pending'
      );
      
      if (unreviewed && unreviewed.length > 0) {
        setError(`Please review all documents. ${unreviewed.length} document(s) still pending review.`);
        return;
      }
      
      // Ensure notes are provided for all files regardless of status
      const missingNotes = Object.entries(fileReviews).filter(([_, review]) => 
        !review.notes.trim()
      );
      
      if (missingNotes.length > 0) {
        setError('Please provide remarks for all documents. Remarks are mandatory for both approval and rejection.');
        return;
      }
    } else {
      // For bulk review mode - require remarks for both approval and rejection
      if (!reviewNotes.trim()) {
        setError('Please provide remarks. Remarks are mandatory for both approval and rejection.');
        return;
      }
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      let response;
      
      if (reviewMode === 'individual') {
        // Submit individual file reviews
        response = await apiService.documents.updateFileStatuses(id!, {
          fileReviews: fileReviews,
          overallStatus: calculateOverallStatus(),
          reviewNotes: reviewNotes
        });
      } else {
        // Submit bulk review
        response = await apiService.documents.updateStatus(id!, reviewStatus, reviewNotes);
      }
      
      if (response.data.success) {
        setSuccess('Document review submitted successfully!');
        setDocument(response.data.data);
        setWorkflow(response.data.workflow);
        
        // Redirect to documents list after 2 seconds
        setTimeout(() => {
          navigate('/documents');
        }, 2000);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to submit document review. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };
  


  // Handle file download
  const handleDownload = async (filePath: string, fileName?: string) => {
    try {
      if (!filePath) {
        setError('No file path provided');
        return;
      }

      console.log('Downloading file:', { filePath, fileName });

      // Use the API service to download the file
      const response = await apiService.documents.downloadFile(filePath, fileName || 'document');
      
      // Create blob from response
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/octet-stream' 
      });
      
      // Get the document object safely
      const doc = getSafeDocument();
      
      // Create download URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = doc.createElement('a');
      link.href = url;
      link.download = fileName || 'document';
      (doc.body as HTMLElement).appendChild(link);
      link.click();
      (doc.body as HTMLElement).removeChild(link);
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url);
      
    } catch (error: any) {
      console.error('Error downloading file:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to download file. Please try again.';
      setError(errorMessage);
    }
  };

  // Get file icon based on mime type
  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) {
      return <FontAwesomeIcon icon={faFile} className="text-gray-500" />;
    }
    
    if (mimeType.includes('pdf')) {
      return <FontAwesomeIcon icon={faFilePdf} className="text-red-500" />;
    } else if (mimeType.includes('image')) {
      return <FontAwesomeIcon icon={faFileImage} className="text-blue-500" />;
    } else {
      return <FontAwesomeIcon icon={faFileAlt} className="text-gray-500" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  // Get current workflow stage 
  const getCurrentStage = () => {
    if (!workflow) return 'Unknown';
    
    const stageName = workflow.currentStage;
    switch (stageName) {
      case 'initial_review':
        return 'Initial Review';
      case 'technical_review':
        return 'Technical Review';
      case 'final_approval':
        return 'Final Approval';
      default:
        return stageName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => navigate('/documents')}
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Back to Documents
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Document Review</h1>
          </div>
          

        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faExclamationCircle} className="text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-2" />
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}


        
        {/* Document Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FontAwesomeIcon icon={faSpinner} className="text-blue-500 text-4xl animate-spin" />
          </div>
        ) : document ? (
          <div className="space-y-6">
            {/* Document Details */}
            <div>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h2 className="text-lg font-medium text-gray-800">Document Details</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-500">Title</h3>
                      <p className="text-sm text-gray-900 break-words">{document.title}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-500">Type</h3>
                      <p className="text-sm text-gray-900 break-words">
                        {document.documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-500">Submission Date</h3>
                      <p className="text-sm text-gray-900 break-words">
                        {new Date(document.submissionDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-500">Current Status</h3>
                      <div>
                        {document.status === 'approved' ? (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            <FontAwesomeIcon icon={faCheckCircle} className="mr-1 mt-0.5" />
                            Approved
                          </span>
                        ) : document.status === 'rejected' ? (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            <FontAwesomeIcon icon={faTimesCircle} className="mr-1 mt-0.5" />
                            Rejected
                          </span>
                        ) : document.status === 'under_review' ? (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            <FontAwesomeIcon icon={faSpinner} className="mr-1 mt-0.5 animate-spin" />
                            Under Review
                          </span>
                        ) : (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            <FontAwesomeIcon icon={faExclamationCircle} className="mr-1 mt-0.5" />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                    {document.expiryDate && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-500">Expiry Date</h3>
                        <p className="text-sm text-gray-900 break-words">
                          {new Date(document.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-500">Current Stage</h3>
                      <p className="text-sm text-gray-900 break-words">
                        {getCurrentStage()}
                      </p>
                    </div>
                  </div>

                  {document.description && (
                    <div className="mt-6 space-y-2">
                      <h3 className="text-sm font-medium text-gray-500">Description</h3>
                      <p className="text-sm text-gray-900 break-words leading-relaxed">{document.description}</p>
                    </div>
                  )}

                  {/* Vendor Information */}
                  <div className="mt-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Vendor Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-gray-500">Name</h4>
                        <p className="text-sm text-gray-900 break-words">{document.vendor.name}</p>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-gray-500">Company</h4>
                        <p className="text-sm text-gray-900 break-words">{document.vendor.company}</p>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-gray-500">Email</h4>
                        <p className="text-sm text-gray-900 break-words">{document.vendor.email}</p>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-gray-500">Phone</h4>
                        <p className="text-sm text-gray-900 break-words">{document.vendor.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Files */}
              <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h2 className="text-lg font-medium text-gray-800">Document Files</h2>
                </div>
                <div className="p-6">
                  {document.files && document.files.length > 0 ? (
                    <div className="space-y-4">
                      {document.files.map((file, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getFileIcon(file.mimeType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 break-words">{file.originalName}</p>
                              <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.size)}</p>
                            </div>
                            <div className="flex-shrink-0">
                              <button
                                onClick={() => handleDownload(file.path, file.originalName)}
                                className="text-blue-600 hover:text-blue-800 flex items-center px-3 py-1 rounded-md hover:bg-blue-50 transition-colors whitespace-nowrap"
                              >
                                <FontAwesomeIcon icon={faDownload} className="h-4 w-4 mr-1" />
                                <span>Download</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : document.fileUrl ? (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <FontAwesomeIcon icon={faFile} className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 break-words">{document.fileName}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => handleDownload(document.fileUrl!, document.fileName!)}
                            className="text-blue-600 hover:text-blue-800 flex items-center px-3 py-1 rounded-md hover:bg-blue-50 transition-colors whitespace-nowrap"
                          >
                            <FontAwesomeIcon icon={faDownload} className="h-4 w-4 mr-1" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No files available</p>
                  )}
                </div>
              </div>

              {/* Workflow Timeline */}
              {workflow && (
                <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
                  <div className="border-b border-gray-200 px-6 py-4">
                    <h2 className="text-lg font-medium text-gray-800">Workflow Progress</h2>
                  </div>
                  <div className="p-6">
                    <div className="flow-root">
                      <ul className="-mb-8">
                        {workflow.stages.map((stage, index) => {
                          const isLast = index === workflow.stages.length - 1;
                          return (
                            <li key={index}>
                              <div className="relative pb-8">
                                {!isLast && (
                                  <span
                                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                    aria-hidden="true"
                                  ></span>
                                )}
                                <div className="relative flex space-x-3">
                                  <div>
                                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                      stage.status === 'completed' ? 'bg-green-500' :
                                      stage.status === 'in_progress' ? 'bg-blue-500' :
                                      stage.status === 'rejected' ? 'bg-red-500' : 'bg-gray-300'
                                    }`}>
                                      {stage.status === 'completed' ? (
                                        <FontAwesomeIcon icon={faCheckCircle} className="h-5 w-5 text-white" />
                                      ) : stage.status === 'in_progress' ? (
                                        <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 text-white animate-spin" />
                                      ) : stage.status === 'rejected' ? (
                                        <FontAwesomeIcon icon={faTimesCircle} className="h-5 w-5 text-white" />
                                      ) : (
                                        <FontAwesomeIcon icon={faHistory} className="h-5 w-5 text-white" />
                                      )}
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                      <p className="text-sm text-gray-800 font-medium">
                                        {stage.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {stage.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </p>
                                    </div>
                                    <div className="text-right text-xs whitespace-nowrap text-gray-500">
                                      {stage.startDate && (
                                        <p>Started: {new Date(stage.startDate).toLocaleDateString()}</p>
                                      )}
                                      {stage.completionDate && (
                                        <p>Completed: {new Date(stage.completionDate).toLocaleDateString()}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>


          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <FontAwesomeIcon icon={faExclamationCircle} className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Document not found</h3>
            <p className="mt-1 text-sm text-gray-500">The document you're looking for doesn't exist or you don't have permission to view it.</p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/documents')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Back to Documents
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default DocumentReviewPage;