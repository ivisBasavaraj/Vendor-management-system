import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../utils/api';
import MainLayout from '../../components/layout/MainLayout';
import DocumentViewer from '../../components/documents/DocumentViewer';
import { ArrowLeftIcon, DocumentTextIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Document {
  _id: string;
  title: string;
  description: string;
  documentType: string;
  status: string;
  submissionDate?: string;
  createdAt?: string;
  updatedAt?: string;
  uploadDate?: string;
  files: Array<{
    _id: string;
    path: string;
    originalName: string;
    mimeType: string;
    size: number;
  }>;
  vendor: {
    _id: string;
    name: string;
    email: string;
  };
  reviewNotes?: string;
}

// Define a type for the file object to avoid TypeScript errors
interface DocumentFile {
  _id: string;
  originalName: string;
  path: string;
  mimeType: string;
  size?: number;
}

// Define a type for API errors
interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const DocumentViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!id) {
          setError('Document ID is missing');
          setLoading(false);
          return;
        }
        
        console.log('Fetching document with ID:', id);
        
        // Check if the ID is a valid MongoDB ObjectId
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
        if (!isValidObjectId) {
          console.error(`Invalid MongoDB ObjectId format: ${id}`);
          setError(`Invalid document ID format: ${id}. Document IDs should be 24-character hexadecimal strings.`);
          setLoading(false);
          return;
        }
        
        // First check if the document exists
        const exists = await apiService.documents.checkDocumentExists(id);
        if (!exists) {
          console.error(`Document with ID ${id} does not exist in any collection`);
          setError(`Document with ID ${id} not found. It may have been deleted, moved to a different location, or you do not have permission to view it. Please verify the document ID and try again.`);
          setLoading(false);
          return;
        }
        
        // First, try to get the document from the vendor submissions endpoint
        // This is the most likely place for vendor documents
        try {
          console.log('Trying to fetch document from vendor submissions');
          const vendorSubmissionsResponse = await apiService.documents.getVendorSubmissions();
          
          if (vendorSubmissionsResponse.data && Array.isArray(vendorSubmissionsResponse.data)) {
            console.log('Got vendor submissions:', vendorSubmissionsResponse.data);
            
            // Look for the document in the vendor's submissions
            const allSubmissions = vendorSubmissionsResponse.data;
            let foundDocument = null;
            let foundSubmission = null;
            
            // Search through all submissions for the document with matching ID
            for (const submission of allSubmissions) {
              // Check if this is the submission we're looking for
              if (submission._id === id) {
                // Found the submission directly
                foundSubmission = submission;
                foundDocument = {
                  ...submission,
                  title: submission.title || 'Document Submission',
                  documentType: 'Submission',
                  submissionDate: submission.submissionDate || submission.createdAt || submission.updatedAt,
                  files: submission.documents?.map((doc: any) => {
                    // Determine mime type from file extension or document name
                    const fileName = doc.documentName || doc.documentType || '';
                    const filePath = doc.filePath || doc.path || '';
                    const fileExtension = (filePath || fileName).split('.').pop()?.toLowerCase();
                    
                    let mimeType = 'application/octet-stream'; // Default fallback
                    switch (fileExtension) {
                      case 'pdf':
                        mimeType = 'application/pdf';
                        break;
                      case 'doc':
                        mimeType = 'application/msword';
                        break;
                      case 'docx':
                        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                        break;
                      case 'xls':
                        mimeType = 'application/vnd.ms-excel';
                        break;
                      case 'xlsx':
                        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                        break;
                      case 'ppt':
                        mimeType = 'application/vnd.ms-powerpoint';
                        break;
                      case 'pptx':
                        mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
                        break;
                      case 'jpg':
                      case 'jpeg':
                        mimeType = 'image/jpeg';
                        break;
                      case 'png':
                        mimeType = 'image/png';
                        break;
                      case 'gif':
                        mimeType = 'image/gif';
                        break;
                      case 'txt':
                        mimeType = 'text/plain';
                        break;
                    }
                    
                    return {
                      _id: doc._id,
                      originalName: fileName,
                      path: filePath,
                      mimeType: mimeType
                    };
                  }) || []
                };
                console.log('Found submission directly:', foundDocument);
                break;
              }
              
              // Check if any document in the submission matches the ID
              if (submission.documents && Array.isArray(submission.documents)) {
                for (const doc of submission.documents) {
                  if (doc._id === id) {
                    // Found the document within a submission
                    foundSubmission = submission;
                    foundDocument = {
                      _id: doc._id,
                      title: doc.documentName || doc.documentType || 'Document',
                      documentType: doc.documentType || 'Document',
                      status: doc.status || 'pending',
                      vendor: submission.vendor,
                      submissionId: submission._id,
                      submissionDate: submission.submissionDate || doc.uploadDate || submission.createdAt || submission.updatedAt,
                      files: [{
                        _id: doc._id,
                        originalName: doc.documentName || doc.documentType || 'Document',
                        path: doc.filePath || doc.path,
                        mimeType: (() => {
                          // Determine mime type from file extension or document name
                          const fileName = doc.documentName || doc.documentType || '';
                          const filePath = doc.filePath || doc.path || '';
                          const fileExtension = (filePath || fileName).split('.').pop()?.toLowerCase();
                          
                          switch (fileExtension) {
                            case 'pdf':
                              return 'application/pdf';
                            case 'doc':
                              return 'application/msword';
                            case 'docx':
                              return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                            case 'xls':
                              return 'application/vnd.ms-excel';
                            case 'xlsx':
                              return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                            case 'ppt':
                              return 'application/vnd.ms-powerpoint';
                            case 'pptx':
                              return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
                            case 'jpg':
                            case 'jpeg':
                              return 'image/jpeg';
                            case 'png':
                              return 'image/png';
                            case 'gif':
                              return 'image/gif';
                            case 'txt':
                              return 'text/plain';
                            default:
                              return 'application/octet-stream';
                          }
                        })()
                      }]
                    };
                    console.log('Found document within submission:', foundDocument);
                    break;
                  }
                }
              }
              
              if (foundDocument) break;
            }
            
            if (foundDocument) {
              console.log('Document found in vendor submissions:', foundDocument);
              console.log('Date fields available:', {
                submissionDate: foundDocument.submissionDate,
                createdAt: foundDocument.createdAt,
                updatedAt: foundDocument.updatedAt,
                uploadDate: foundDocument.uploadDate
              });
              setDocument(foundDocument);
              
              // If document has files, set the first file as active
              if (foundDocument.files && foundDocument.files.length > 0) {
                console.log('Document has files, loading first file');
                setActiveFileIndex(0);
                
                // Get the file path
                const filePath = foundDocument.files[0].path;
                
                if (filePath) {
                  try {
                    await loadDocumentFile(filePath);
                  } catch (fileError) {
                    console.error('Error loading document file:', fileError);
                    
                    // If the file path doesn't work, try to find the file in the submission
                    if (foundSubmission && foundSubmission.documents) {
                      console.log('Trying to find file in submission documents');
                      
                      // Look for any document with a valid file path
                      for (const doc of foundSubmission.documents) {
                        if (doc.filePath || doc.path) {
                          console.log('Found alternative file path:', doc.filePath || doc.path);
                          try {
                            await loadDocumentFile(doc.filePath || doc.path);
                            break;
                          } catch (altFileError) {
                            console.error('Error loading alternative file:', altFileError);
                          }
                        }
                      }
                    }
                  }
                } else {
                  console.log('File path is missing');
                  
                  // Try to find any document with a valid file path in the submission
                  if (foundSubmission && foundSubmission.documents) {
                    console.log('Trying to find any file in submission documents');
                    
                    for (const doc of foundSubmission.documents) {
                      if (doc.filePath || doc.path) {
                        console.log('Found file path in submission:', doc.filePath || doc.path);
                        try {
                          await loadDocumentFile(doc.filePath || doc.path);
                          break;
                        } catch (submissionFileError) {
                          console.error('Error loading file from submission:', submissionFileError);
                        }
                      }
                    }
                  }
                }
              } else {
                console.log('Document has no files');
                
                // Try to find any document with a valid file path in the submission
                if (foundSubmission && foundSubmission.documents) {
                  console.log('Trying to find any file in submission documents');
                  
                  for (const doc of foundSubmission.documents) {
                    if (doc.filePath || doc.path) {
                      console.log('Found file path in submission:', doc.filePath || doc.path);
                      try {
                        await loadDocumentFile(doc.filePath || doc.path);
                        break;
                      } catch (submissionFileError) {
                        console.error('Error loading file from submission:', submissionFileError);
                      }
                    }
                  }
                }
              }
              
              setLoading(false);
              return;
            }
          }
        } catch (vendorSubmissionsError) {
          console.error('Error fetching from vendor submissions:', vendorSubmissionsError);
        }
        
        // If not found in vendor submissions, try document-submissions endpoint
        try {
          console.log('Trying document-submissions endpoint');
          const response = await apiService.documents.getSubmissionById(id);
          
          console.log('Submission API response:', response);
          
          if (response.data && response.data.success) {
            console.log('Document found in submissions:', response.data.data);
            
            // Log document structure for debugging
            if (process.env.NODE_ENV === 'development') {
              console.log('Document structure:', {
                id: response.data.data._id,
                title: response.data.data.title,
                type: response.data.data.documentType,
                status: response.data.data.status,
                files: response.data.data.files?.map((f: DocumentFile) => ({
                  id: f._id,
                  name: f.originalName,
                  path: f.path,
                  type: f.mimeType
                }))
              });
            }
            
            setDocument(response.data.data);
            
            // If document has files, set the first file as active
            if (response.data.data.files && response.data.data.files.length > 0) {
              console.log('Document has files, loading first file');
              setActiveFileIndex(0);
              try {
                await loadDocumentFile(response.data.data.files[0].path);
              } catch (fileError) {
                console.error('Error loading document file:', fileError);
                // Continue showing the document even if file loading fails
              }
            } else if (response.data.data.documents && response.data.data.documents.length > 0) {
              // Try to find files in the documents array
              console.log('Looking for files in documents array');
              for (const doc of response.data.data.documents) {
                if (doc.filePath || doc.path) {
                  console.log('Found file path in document:', doc.filePath || doc.path);
                  try {
                    await loadDocumentFile(doc.filePath || doc.path);
                    break;
                  } catch (docFileError) {
                    console.error('Error loading file from document:', docFileError);
                  }
                }
              }
            } else {
              console.log('Document has no files');
            }
            
            setLoading(false);
            return;
          } else {
            console.log('Document not found in submissions API (success: false)');
          }
        } catch (submissionError) {
          console.log('Document not found in submissions, trying legacy endpoint:', submissionError);
        }
        
        // Try legacy documents endpoint as a last resort
        try {
          console.log('Trying legacy documents endpoint');
          const response = await apiService.documents.getById(id);
          
          console.log('Legacy API response:', response);
          
          if (response.data && response.data.success) {
            console.log('Document found in legacy endpoint:', response.data.data);
            
            setDocument(response.data.data);
            
            // If document has files, set the first file as active
            if (response.data.data.files && response.data.data.files.length > 0) {
              console.log('Document has files, loading first file');
              setActiveFileIndex(0);
              try {
                await loadDocumentFile(response.data.data.files[0].path);
              } catch (fileError) {
                console.error('Error loading document file:', fileError);
                // Continue showing the document even if file loading fails
              }
            } else {
              console.log('Document has no files');
            }
            
            setLoading(false);
            return;
          } else {
            console.error('API returned success: false', response.data);
          }
        } catch (legacyError) {
          console.error('Error fetching document from legacy endpoint:', legacyError);
        }
        
        // Try loading the document directly using the ID
        try {
          console.log('Trying to load document directly using ID:', id);
          const response = await apiService.documents.viewFile(id);
          
          // If we get here, the document exists but we couldn't get metadata
          // Create a minimal document object
          const minimalDocument = {
            _id: id,
            title: 'Document',
            description: 'Document loaded directly',
            documentType: 'unknown',
            status: 'unknown',
            submissionDate: new Date().toISOString(),
            vendor: {
              _id: user?.id || 'unknown',
              name: user?.name || 'Unknown User',
              email: user?.email || 'unknown@example.com'
            },
            files: [{
              _id: id,
              originalName: 'Document',
              path: id,
              mimeType: response.headers?.['content-type'] || 'application/pdf',
              size: response.data?.length || 0
            }]
          };

          setDocument(minimalDocument);
          
          // Create a blob URL for the file
          const contentType = response.headers?.['content-type'] || 'application/pdf';
          const blob = new Blob([response.data], { type: contentType });
          const url = window.URL.createObjectURL(blob);
          
          setDocumentUrl(url);
          console.log('Document loaded successfully using direct ID');
          setLoading(false);
          return;
        } catch (directLoadError) {
          console.error('Failed to load document directly:', directLoadError);
        }
        
        // If we get here, the document was not found in any endpoint
        console.error('Document not found in any endpoint');
        setError(`Document with ID ${id} not found. It may have been deleted, moved to a different location, or you do not have permission to view it. Please verify the document ID and try again.`);
      } catch (err: any) {
        console.error('Error in document fetch process:', err);
        setError(err.message || 'An error occurred while fetching the document');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocument();
  }, [id]);

  const loadDocumentFile = async (filePath: string) => {
    try {
      if (!filePath) {
        console.error('File path is missing or undefined');
        setError('File path is missing');
        return;
      }
      
      console.log('Loading document file with path:', filePath);
      
      // Check if this is a MongoDB ObjectId (document ID)
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(filePath);
      
      if (isObjectId) {
        console.log('This appears to be a document ID, trying to load directly');
        try {
          // Try to load the document directly using its ID
          console.log(`Making API request to view file with ID: ${filePath}`);
          const response = await apiService.documents.viewFile(filePath);
          
          if (!response.data) {
            console.error('API returned empty response data');
            throw new Error('Document data is empty');
          }
          
          // Create a blob URL for the file
          const contentType = response.headers?.['content-type'] || 'application/pdf';
          console.log(`Received file with content type: ${contentType}`);
          const blob = new Blob([response.data], { type: contentType });
          const url = window.URL.createObjectURL(blob);
          
          setDocumentUrl(url);
          console.log('Document loaded successfully using ID');
          return;
        } catch (idError: any) {
          console.error('Failed to load document using ID:', idError);
          console.error('Error details:', {
            message: idError.message,
            status: idError.response?.status,
            statusText: idError.response?.statusText,
            url: idError.config?.url
          });
          // Continue with other methods if ID loading fails
        }
      }
      
      // Handle Windows absolute paths (D:\path\to\file)
      if (filePath.match(/^[A-Z]:\\/i)) {
        console.log('Detected Windows absolute path');
        // Extract just the filename from the Windows path
        const fileName = filePath.split('\\').pop() || filePath;
        console.log('Extracted filename from Windows path:', fileName);
        
        try {
          // Try to load the file using just the filename
          const response = await apiService.documents.viewFile(fileName);
          
          // Create a blob URL for the file
          const fileExtension = fileName.split('.').pop()?.toLowerCase();
          const mimeType = fileExtension === 'pdf' ? 'application/pdf' : 
                          fileExtension === 'jpg' || fileExtension === 'jpeg' ? 'image/jpeg' :
                          fileExtension === 'png' ? 'image/png' : 
                          'application/octet-stream';
          
          const blob = new Blob([response.data], { type: mimeType });
          const url = window.URL.createObjectURL(blob);
          
          setDocumentUrl(url);
          console.log('Document loaded successfully using extracted filename');
          return;
        } catch (windowsPathError: any) {
          console.error('Failed to load document using extracted filename:', windowsPathError.message || windowsPathError);
          // Continue with other methods if filename loading fails
        }
      }
      
      // Clean up the file path
      const cleanPath = filePath.trim();
      
      // Determine the file type from the path if possible
      const fileExtension = cleanPath.split('.').pop()?.toLowerCase();
      console.log('Detected file extension:', fileExtension);
      
      const mimeType = fileExtension === 'pdf' ? 'application/pdf' : 
                       fileExtension === 'jpg' || fileExtension === 'jpeg' ? 'image/jpeg' :
                       fileExtension === 'png' ? 'image/png' :
                       fileExtension === 'doc' ? 'application/msword' :
                       fileExtension === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                       fileExtension === 'xls' ? 'application/vnd.ms-excel' :
                       fileExtension === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                       'application/octet-stream';
      
      console.log('Using MIME type:', mimeType);
      
      // Generate all possible path formats to try
      const fileName = cleanPath.split('/').pop() || cleanPath.split('\\').pop() || cleanPath;
      
      const pathsToTry = [
        cleanPath,
        cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath,
        cleanPath.startsWith('\\') ? cleanPath.substring(1) : cleanPath,
        cleanPath.startsWith('/uploads/') ? cleanPath.substring('/uploads/'.length) : cleanPath,
        cleanPath.startsWith('\\uploads\\') ? cleanPath.substring('\\uploads\\'.length) : cleanPath,
        cleanPath.startsWith('uploads/') ? cleanPath : `uploads/${cleanPath}`,
        cleanPath.includes('/') ? cleanPath : `uploads/${cleanPath}`,
        fileName, // Just the filename
        `uploads/${fileName}`,
        `documents/${fileName}`,
        `files/${fileName}`,
        `uploads/documents/${fileName}`,
        `uploads/files/${fileName}`,
        // Try with different path separators
        cleanPath.replace(/\\/g, '/'),
        // Try with URL encoding
        encodeURIComponent(fileName),
        // Try with different casing
        fileName.toLowerCase(),
        fileName.toUpperCase()
      ];
      
      console.log('Will try these paths:', pathsToTry);
      
      let loaded = false;
      let lastError = null;
      
      // Try each path until one works
      for (const pathToTry of pathsToTry) {
        try {
          console.log('Trying path:', pathToTry);
          const response = await apiService.documents.viewFile(pathToTry);
          
          // Create a blob URL for the file
          const blob = new Blob([response.data], { type: mimeType });
          const url = window.URL.createObjectURL(blob);
          
          setDocumentUrl(url);
          console.log('Document loaded successfully with path:', pathToTry);
          loaded = true;
          break;
        } catch (pathError: any) {
          console.log(`Failed to load with path ${pathToTry}:`, pathError.message || pathError);
          lastError = pathError;
        }
      }
      
      // If all paths failed, try using the document ID directly
      if (!loaded && id) {
        try {
          console.log('All paths failed, trying document ID directly:', id);
          console.log(`Making API request to view file with ID: ${id}`);
          const response = await apiService.documents.viewFile(id);
          
          if (!response.data) {
            console.error('API returned empty response data');
            throw new Error('Document data is empty');
          }
          
          // Create a blob URL for the file
          const contentType = response.headers?.['content-type'] || 'application/pdf';
          console.log(`Received file with content type: ${contentType}, data size: ${response.data.length || 'unknown'} bytes`);
          const blob = new Blob([response.data], { type: contentType });
          const url = window.URL.createObjectURL(blob);
          
          setDocumentUrl(url);
          console.log('Document loaded successfully using document ID');
          loaded = true;
        } catch (idError: any) {
          console.error('Failed to load document using ID:', idError);
          console.error('Error details:', {
            message: idError.message,
            status: idError.response?.status,
            statusText: idError.response?.statusText,
            url: idError.config?.url
          });
          lastError = idError;
        }
      }
      
      if (!loaded) {
        console.error('All paths failed');
        const errorMessage = lastError?.response?.status === 404
          ? `Document not found (404). The document with ID ${id || filePath} may not exist or you don't have permission to access it.`
          : lastError?.message || 'Document file not found or inaccessible after trying multiple paths';
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error('Error in document file loading process:', err);
      setError(err.message || 'Failed to load document file. Please try again later.');
    }
  };

  const handleFileChange = async (index: number) => {
    if (!document || !document.files || index >= document.files.length) return;
    
    setActiveFileIndex(index);
    await loadDocumentFile(document.files[index].path);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status) {
      case 'approved':
      case 'fully_approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
      case 'requires_resubmission':
        return 'bg-red-100 text-red-800';
      case 'partially_approved':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string | undefined) => {
    if (!status) return 'Unknown';
    
    return status
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex flex-col">
              <div className="flex">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
                <span className="text-red-700">{error}</span>
              </div>
              
              {error.includes('not found') && (
                <div className="mt-4 ml-9">
                  <p className="text-sm font-medium text-gray-700 mb-2">What you can do:</p>
                  <ul className="list-disc pl-5 text-sm text-gray-600">
                    <li>Check if the document ID is correct</li>
                    <li>The document may have been deleted from the database</li>
                    <li>You may not have permission to view this document</li>
                    <li>
                      <button 
                        onClick={() => navigate('/documents')}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Return to documents list
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : document ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {documentUrl ? (
                <DocumentViewer 
                  documentUrl={documentUrl}
                  fileName={document.files && document.files[activeFileIndex]?.originalName || 'Document'}
                  mimeType={document.files && document.files[activeFileIndex]?.mimeType || 'application/pdf'}
                />
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center justify-center h-64">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No document file available for preview</p>
                </div>
              )}
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Document Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Title</h3>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{document.title || 'Untitled'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Document Type</h3>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{document.documentType || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
                    <p className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(document.status)}`}>
                        {formatStatus(document.status)}
                      </span>
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Submission Date</h3>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {document.submissionDate ? formatDate(document.submissionDate) : 
                       document.createdAt ? formatDate(document.createdAt) :
                       document.uploadDate ? formatDate(document.uploadDate) : 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Vendor</h3>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {document.vendor?.name || 'Unknown vendor'}
                    </p>
                  </div>
                  
                  {document.reviewNotes && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Review Notes</h3>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{document.reviewNotes}</p>
                    </div>
                  )}
                  
                  {document.files && document.files.length > 0 ? (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Files</h3>
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {document.files.map((file, index) => (
                          <li key={file._id || index} className="py-2">
                            <button
                              onClick={() => handleFileChange(index)}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                                index === activeFileIndex
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                              }`}
                            >
                              <div className="flex items-center">
                                <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-400" />
                                <span className="truncate">{file.originalName || `File ${index + 1}`}</span>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Files</h3>
                      <p className="text-sm text-gray-500">No files available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Document not found</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">The document you're looking for doesn't exist or you don't have permission to view it.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default DocumentViewPage;