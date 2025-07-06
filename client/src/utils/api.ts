/**
 * Centralized API service for Vendor Management System
 * 
 * This module provides a consistent way to make API calls throughout the application
 * and handles common functionality like error handling, authentication, and logging.
 */

import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// API URL from environment or default
// Using base URL without /api suffix to avoid duplication
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const API_PREFIX = '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    // Get the token from localStorage - check both 'token' and 'authToken'
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log API calls in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    
    return response;
  },
  (error: AxiosError) => {
    // Handle common error scenarios
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      
      // Log error details in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`API Error: ${error.response.status} ${error.config?.url}`, 
          error.response.data);
      }
      
      // If 401 Unauthorized, clear token but don't redirect
      // Let the AuthContext handle redirection via React Router
      if (error.response.status === 401) {
        // Only clear token if not already on login page
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('token');
          // Auth state will be updated by the AuthContext useEffect
        }
      }
      
      // For 403 Forbidden, just log it - let the component handle the error
      if (error.response.status === 403) {
        console.error('Access forbidden. You do not have permission to access this resource.');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error: No response received', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper function to set auth token
const setAuthToken = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // Store token in localStorage for consistency
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// API service methods
const apiService = {
  // Generic HTTP methods
  get: (url: string, config?: AxiosRequestConfig) => api.get(url, config),
  post: (url: string, data?: any, config?: AxiosRequestConfig) => api.post(url, data, config),
  put: (url: string, data?: any, config?: AxiosRequestConfig) => api.put(url, data, config),
  delete: (url: string, config?: AxiosRequestConfig) => api.delete(url, config),
  
  // Helper method to set auth token
  setAuthToken,
  // Auth endpoints
  auth: {
    login: (email: string, password: string) => 
      api.post(`${API_PREFIX}/auth/login`, { email, password }),
      
    adminLogin: (email: string, password: string) => 
      api.post(`${API_PREFIX}/auth/admin/login`, { email, password }),
      
    vendorLogin: (email: string, password: string) => 
      api.post(`${API_PREFIX}/auth/vendor/login`, { email, password }),
      
    consultantLogin: (email: string, password: string) => 
      api.post(`${API_PREFIX}/auth/consultant/login`, { email, password }),
    
    register: (userData: any) => 
      api.post(`${API_PREFIX}/auth/register`, userData),
    
    getCurrentUser: () => 
      api.get(`${API_PREFIX}/auth/me`),
    
    forgotPassword: (email: string) => 
      api.post(`${API_PREFIX}/auth/forgotpassword`, { email }),
    
    resetPassword: (token: string, password: string) => 
      api.put(`${API_PREFIX}/auth/resetpassword/${token}`, { password }),
    
    updatePassword: (currentPassword: string, newPassword: string) => 
      api.put(`${API_PREFIX}/auth/updatepassword`, { currentPassword, newPassword }),
    
    updateDetails: (userData: any) => 
      api.put(`${API_PREFIX}/auth/updatedetails`, userData),
    
    checkLoginApproval: (approvalId: string) =>
      api.get(`${API_PREFIX}/auth/login-approval/${approvalId}`),
    logout: () =>
      api.post(`${API_PREFIX}/auth/logout`),
  },
  
  // Dashboard endpoints
  dashboard: {
    getVendorDashboard: () =>
      api.get(`${API_PREFIX}/dashboard/vendor`),
    
    getConsultantDashboard: () =>
      api.get(`${API_PREFIX}/dashboard/consultant`),
    
    getAdminDashboard: () =>
      api.get(`${API_PREFIX}/dashboard/admin`),
  },
  
  // User endpoints
  users: {
    getAll: (params?: any) => 
      api.get(`${API_PREFIX}/users`, { params }),
    
    getVendors: (params?: any) => 
      api.get(`${API_PREFIX}/users/vendors`, { params }),
    
    getConsultants: (params?: any) => 
      api.get(`${API_PREFIX}/users/consultants`, { params }),
    
    getById: (id: string) => 
      api.get(`${API_PREFIX}/users/${id}`),
    
    create: (userData: any) => 
      api.post(`${API_PREFIX}/users`, userData),
    
    update: (id: string, userData: any) => 
      api.put(`${API_PREFIX}/users/${id}`, userData),
    
    delete: (id: string) => 
      api.delete(`${API_PREFIX}/users/${id}`),
    
    activate: (id: string) => 
      api.put(`${API_PREFIX}/users/${id}/activate`),
    
    deactivate: (id: string) => 
      api.put(`${API_PREFIX}/users/${id}/deactivate`),
    
    assignConsultant: (vendorId: string, consultantId: string) => 
      api.post(`${API_PREFIX}/users/vendors/${vendorId}/assign-consultant`, { consultantId }),
    
    updateAgreementPeriod: (vendorId: string, agreementPeriod: string) => 
      api.put(`${API_PREFIX}/users/vendors/${vendorId}/agreement-period`, { agreementPeriod }),
    
    getDashboardAnalytics: () => 
      api.get(`${API_PREFIX}/users/analytics/dashboard`),
      
    getVendorsWithAnalytics: () => 
      api.get(`${API_PREFIX}/users/analytics/vendors`),
      
    bulkUpdate: (userIds: string[], action: string) => 
      api.post(`${API_PREFIX}/users/bulk-update`, { userIds, action }),
      
    bulkAssignConsultant: (userIds: string[], consultantId: string) => 
      api.post(`${API_PREFIX}/users/bulk-update`, { 
        userIds, 
        action: 'assignConsultant', 
        data: { consultantId } 
      }),
      
    exportUsers: (role: string, format: string) => 
      api.get(`${API_PREFIX}/users/export`, { params: { role, format } }),
      
    getConsultantsWithAnalytics: () => 
      api.get(`${API_PREFIX}/users/analytics/consultants`),
      
    sendCredentials: (email: string, credentialData: any) => 
      api.post(`${API_PREFIX}/users/send-credentials`, { email, ...credentialData }),
      
    uploadLogo: (userId: string, logoFile: File) => {
      const formData = new FormData();
      formData.append('logo', logoFile);
      return api.post(`${API_PREFIX}/users/${userId}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    
    getImtmaUsers: (params?: any) => 
      api.get(`${API_PREFIX}/users/imtma`, { params }),
    
    getVendorsByConsultant: (consultantId: string) => 
      api.get(`${API_PREFIX}/users/consultants/${consultantId}/vendors`),
    
    resetPassword: (userId: string, passwordData?: { newPassword: string; confirmPassword: string }) => 
      api.post(`${API_PREFIX}/users/${userId}/reset-password`, passwordData || {}),
  },
  
  // Document endpoints
  documents: {
    getAll: (params?: any) => {
      console.log("Fetching all documents with params:", params);
      // Try to get submissions first, if that fails, fall back to legacy documents
      return api.get(`${API_PREFIX}/document-submissions/vendor/submissions`, { params })
        .catch(error => {
          console.log("Falling back to legacy document endpoint after error:", error);
          return api.get(`${API_PREFIX}/documents`, { params });
        });
    },
    
    getById: (id: string) => 
      api.get(`${API_PREFIX}/documents/${id}`),
    
    upload: (formData: FormData) => {
      // Log the FormData contents for debugging
      console.log('FormData entries:');
      // Convert FormData entries to array first to avoid TypeScript iteration error
      Array.from(formData.entries()).forEach(pair => {
        console.log(pair[0], pair[1]);
      });
      
      // Don't set Content-Type header manually, let the browser set it with the boundary
      return api.post(`${API_PREFIX}/documents`, formData, {
        headers: { 
          // Remove Content-Type so browser can set it with proper boundary
          'Content-Type': undefined
        }
      });
    },
    
    // The backend doesn't have a separate endpoint for multiple files
    // Use the main document upload endpoint instead
    uploadMultiple: (formData: FormData) => 
      api.post(`${API_PREFIX}/documents`, formData, {
        headers: { 'Content-Type': undefined }
      }),
    
    updateStatus: (id: string, status: string, reviewNotes?: string) =>
      api.put(`${API_PREFIX}/documents/${id}/status`, { status, reviewNotes }),
      
    // New method for updating individual file statuses
    updateFileStatuses: (id: string, data: any) =>
      api.put(`${API_PREFIX}/documents/${id}/file-statuses`, data),

    update: (id: string, data: any) => // Added update method
      api.put(`${API_PREFIX}/documents/${id}`, data),
    
    addComment: (id: string, comment: string) =>
      api.post(`${API_PREFIX}/documents/${id}/comments`, { comment }),
    
    delete: (id: string) => {
      console.log(`Attempting to delete document with ID: ${id}`);
      // Try both endpoints - first the document submissions API, then fall back to the legacy documents API
      return api.delete(`${API_PREFIX}/document-submissions/documents/${id}`)
        .catch(error => {
          console.log(`Error deleting from document-submissions API: ${error}. Trying legacy endpoint...`);
          return api.delete(`${API_PREFIX}/documents/${id}`);
        });
    },
    
    getByVendor: (vendorId: string, params?: any) =>
      api.get(`${API_PREFIX}/documents/vendor/${vendorId}`, { params }),
    
    getByConsultant: (consultantId: string, params?: any) =>
      api.get(`${API_PREFIX}/documents/consultant/${consultantId}`, { params }),
    
    getByStatus: (status: string, params?: any) => {
      console.log(`Fetching documents with status: ${status}, params:`, params);
      // Try to get documents from the document-submissions API first
      return api.get(`${API_PREFIX}/document-submissions/status/${status}`, { params })
        .catch(error => {
          console.log(`Error fetching from document-submissions API: ${error}. Trying legacy endpoint...`);
          // Fall back to legacy documents API if the new endpoint fails
          return api.get(`${API_PREFIX}/documents/status/${status}`, { params });
        });
    },
      
    getAuditTrail: (id: string) => // Added getAuditTrail method
      api.get(`${API_PREFIX}/documents/${id}/audit-trail`),

    // Get documents grouped by vendor (for vendor-centric view)
    getGroupedByVendor: (params?: any) =>
      api.get(`${API_PREFIX}/documents/grouped-by-vendor`, { params }),
      
    // Download all files as a zip
    downloadAllFiles: (id: string) =>
      api.get(`${API_PREFIX}/documents/${id}/download-all`, { responseType: 'blob' }),
      
    // Generate approval report
    generateApprovalReport: (id: string) =>
      api.get(`${API_PREFIX}/documents/${id}/approval-report`, { responseType: 'blob' }),
      
    // Request document changes
    requestChanges: (id: string, changes: any) =>
      api.put(`${API_PREFIX}/documents/${id}/request-changes`, changes),
      
    // Get document aging report
    getAgingReport: (params?: any) =>
      api.get(`${API_PREFIX}/documents/reports/aging`, { params }),
      
    // Get vendor status data (for Status page)
    getVendorStatus: (vendorId: string, year?: number, month?: string) => {
      const params: any = { vendorId };
      if (year) params.year = year;
      if (month) params.month = month;
      return api.get(`${API_PREFIX}/document-submissions/vendor-status`, { params });
    },
      
    // Send email to organizer with document details
    sendEmailToOrganizer: (id: string, emailData: any) =>
      api.post(`${API_PREFIX}/documents/${id}/send-email`, emailData),
      
    // New endpoints for document submission workflow
    uploadDocumentSubmission: (formData: FormData) => {
      // Log the FormData contents for debugging
      console.log('FormData entries for document submission:');
      Array.from(formData.entries()).forEach(pair => {
        console.log(pair[0], pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]);
      });
      
      // Don't set Content-Type header manually, let the browser set it with the boundary
      return api.post(`${API_PREFIX}/document-submissions/create`, formData, {
        headers: { 
          // Remove Content-Type so browser can set it with proper boundary
          'Content-Type': 'multipart/form-data'
        }
      });
    },
    
    // Upload documents on behalf of a vendor (for consultants)
    uploadVendorDocuments: (formData: FormData) => {
      console.log('FormData entries for vendor document upload:');
      Array.from(formData.entries()).forEach(pair => {
        console.log(pair[0], pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]);
      });
      
      return api.post(`${API_PREFIX}/document-submissions/create`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });
    },
    
    // Reupload a rejected document
    reuploadDocument: async (documentId: string, formData: FormData) => {
      console.log(`Reuploading document with ID: ${documentId}`);
      console.log('FormData entries for document reupload:');
      Array.from(formData.entries()).forEach(pair => {
        console.log(pair[0], pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]);
      });
      
      // First, try to find the submission that contains this document
      try {
        console.log('Looking for submission containing document ID:', documentId);
        
        // Search for the submission containing this document
        const searchResponse = await api.get(`${API_PREFIX}/document-submissions/search-by-document/${documentId}`);
        
        if (searchResponse.data.success && searchResponse.data.data) {
          const { submissionId } = searchResponse.data.data;
          console.log('Found submission ID:', submissionId);
          
          // Use the proper resubmission endpoint
          console.log('Using document-submissions resubmission endpoint');
          
          // The resubmission endpoint expects a single file with field name 'document'
          const resubmissionFormData = new FormData();
          const fileEntry = Array.from(formData.entries()).find(([key, value]) => value instanceof File);
          if (fileEntry) {
            resubmissionFormData.append('document', fileEntry[1]);
          }
          
          return api.post(`${API_PREFIX}/document-submissions/${submissionId}/documents/${documentId}/resubmit`, resubmissionFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      } catch (searchError) {
        console.error('Error searching for submission:', searchError);
      }
      
      // Fallback to the standard document upload endpoint
      console.log('Falling back to standard document upload endpoint for reupload');
      
      // Add the document ID to the form data to identify it as a reupload
      formData.append('documentId', documentId);
      formData.append('isReupload', 'true');
      
      // Use the standard document upload endpoint
      return api.post(`${API_PREFIX}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    
    getVendorSubmissions: (params?: any) =>
      api.get(`${API_PREFIX}/document-submissions/vendor/submissions`, { params }),
      
    getConsultantSubmissions: (params?: any) => {
      console.log("Fetching consultant submissions with params:", params);
      return api.get(`${API_PREFIX}/document-submissions/consultant/submissions`, { params });
    },
      
    getSubmissionById: (id: string) =>
      api.get(`${API_PREFIX}/document-submissions/${id}`),
      
    updateDocumentStatus: (submissionId: string, documentId: string, data: any) => {
      console.log(`Calling updateDocumentStatus API with:
        - submissionId: ${submissionId}
        - documentId: ${documentId}
        - data:`, data);
      
      return api.put(`${API_PREFIX}/document-submissions/${submissionId}/documents/${documentId}/status`, data)
        .catch(error => {
          console.error('API Error in updateDocumentStatus:', error);
          console.error('Error response:', error.response?.data);
          throw error;
        });
    },
      
    updateDocumentRemarks: (submissionId: string, documentId: string, data: any) =>
      api.put(`${API_PREFIX}/document-submissions/${submissionId}/documents/${documentId}/remarks`, data),
      
    finalizeSubmissionReview: (submissionId: string, data: any) =>
      api.put(`${API_PREFIX}/document-submissions/${submissionId}/finalize`, data),
      
    // Using a different name to avoid duplicate property
    resubmitDocumentInSubmission: (submissionId: string, documentId: string, formData: FormData) =>
      api.post(`${API_PREFIX}/document-submissions/${submissionId}/documents/${documentId}/resubmit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }),
      
    downloadFile: (filePath: string, fileName?: string) => {
      console.log(`Original file path: ${filePath}`);
      
      // Process the file path to handle Windows absolute paths
      let processedPath = filePath.trim();
      
      // Handle Windows absolute paths (C:\path\to\file or D:\path\to\file)
      if (processedPath.match(/^[A-Z]:[\\\/]/i)) {
        console.log('Detected Windows absolute path');
        // Extract just the filename from the Windows path
        const pathParts = processedPath.split(/[\\\/]/);
        processedPath = pathParts[pathParts.length - 1];
        console.log(`Extracted filename from Windows path: ${processedPath}`);
      }
      // Handle Unix-style absolute paths
      else if (processedPath.startsWith('/')) {
        // Extract just the filename
        const pathParts = processedPath.split('/');
        processedPath = pathParts[pathParts.length - 1];
        console.log(`Extracted filename from Unix path: ${processedPath}`);
      }
      // Handle relative paths that start with uploads/
      else if (processedPath.startsWith('uploads/') || processedPath.startsWith('uploads\\')) {
        // Remove the uploads/ prefix as the server will add it back
        processedPath = processedPath.replace(/^uploads[\\\/]/, '');
        console.log(`Removed uploads prefix: ${processedPath}`);
      }
      
      console.log(`Processed file path for download: ${processedPath}`);
      
      return api.get(`${API_PREFIX}/document-submissions/download`, {
        params: { filePath: processedPath, fileName, format: 'pdf' },
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      });
    },
      
    // Check if a document exists before trying to view it
    checkDocumentExists: (documentId: string) => {
      console.log(`Checking if document exists: ${documentId}`);
      
      // First check if the ID is a valid MongoDB ObjectId
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(documentId);
      if (!isValidObjectId) {
        console.error(`Invalid MongoDB ObjectId format: ${documentId}`);
        return Promise.resolve(false);
      }
      
      // Try the documents endpoint first
      return api.get(`${API_PREFIX}/documents/exists/${documentId}`)
        .then(response => {
          if (response.data.exists) {
            console.log(`Document exists in documents collection: ${documentId}`);
            return true;
          }
          
          // If not found in documents, try document-submissions
          console.log(`Document not found in documents collection, trying document-submissions: ${documentId}`);
          return api.get(`${API_PREFIX}/document-submissions/exists/${documentId}`)
            .then(subResponse => {
              const exists = subResponse.data.exists;
              console.log(`Document ${exists ? 'exists' : 'not found'} in document-submissions collection: ${documentId}`);
              return exists;
            })
            .catch(subError => {
              console.error('Error checking document-submissions:', subError.message || subError);
              return false;
            });
        })
        .catch(error => {
          console.error('Error checking documents collection:', error.message || error);
          
          // If first endpoint fails, try the second one
          return api.get(`${API_PREFIX}/document-submissions/exists/${documentId}`)
            .then(response => {
              const exists = response.data.exists;
              console.log(`Document ${exists ? 'exists' : 'not found'} in document-submissions collection: ${documentId}`);
              return exists;
            })
            .catch(subError => {
              console.error('Error checking document-submissions:', subError.message || subError);
              return false;
            });
        });
    },
    
    viewFile: (filePath: string) => {
      // Determine file type from extension
      const fileExtension = filePath.split('.').pop()?.toLowerCase();
      let mimeType = 'application/octet-stream'; // Default fallback
      
      // Set appropriate MIME type based on file extension
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
      
      console.log(`Viewing file: ${filePath} with detected MIME type: ${mimeType}`);
      
      // Process the file path to ensure it's in the correct format
      let processedPath = filePath.trim();
      
      // Handle Windows absolute paths (C:\path\to\file or D:\path\to\file)
      if (processedPath.match(/^[A-Z]:[\\\/]/i)) {
        console.log('Detected Windows absolute path, extracting filename');
        // Extract just the filename from the Windows path
        const pathParts = processedPath.split(/[\\\/]/);
        processedPath = pathParts[pathParts.length - 1];
        console.log(`Extracted filename from Windows path: ${processedPath}`);
      }
      // Handle Unix-style absolute paths
      else if (processedPath.startsWith('/')) {
        console.log('Detected Unix absolute path, extracting filename');
        // Extract just the filename
        const pathParts = processedPath.split('/');
        processedPath = pathParts[pathParts.length - 1];
        console.log(`Extracted filename from Unix path: ${processedPath}`);
      }
      // Handle relative paths that start with uploads/
      else if (processedPath.startsWith('uploads/') || processedPath.startsWith('uploads\\')) {
        // Remove the uploads/ prefix as the server will add it back
        processedPath = processedPath.replace(/^uploads[\\\/]/, '');
        console.log(`Removed uploads prefix: ${processedPath}`);
      }
      
      // Remove any leading slashes
      processedPath = processedPath.replace(/^\/+/, '');
      
      console.log(`Processed file path for API request: ${processedPath}`);
      
      // Try the document-submissions endpoint first, then fall back to legacy endpoint if it fails
      return api.get(`${API_PREFIX}/document-submissions/view`, {
        params: { filePath: processedPath },
        responseType: 'blob',
        headers: {
          'Accept': mimeType
        }
      }).catch(error => {
        console.log(`Error fetching from document-submissions/view: ${error}. Trying legacy endpoint...`);
        // Try legacy documents endpoint
        return api.get(`${API_PREFIX}/documents/view`, {
          params: { filePath: processedPath },
          responseType: 'blob',
          headers: {
            'Accept': mimeType
          }
        });
      });
    },
      
    downloadVerificationDocument: (submissionId: string) =>
      api.get(`${API_PREFIX}/document-submissions/${submissionId}/verification-document`, {
        responseType: 'blob'
      }),
      
    // Compliance verification endpoints
    getComplianceReports: (vendorId: string) =>
      api.get(`${API_PREFIX}/compliance-reports/vendor/${vendorId}`),
      
    createComplianceReport: (data: {
      vendorId: string;
      month: string;
      year: number;
      auditReview: string;
      remarks: string;
      auditorName: string;
    }) =>
      api.post(`${API_PREFIX}/compliance-reports`, data),
    
    // Upload attachments to compliance report
    uploadComplianceReportAttachments: (reportId: string, formData: FormData) => {
      console.log(`Uploading attachments for compliance report: ${reportId}`);
      return api.post(`${API_PREFIX}/compliance-reports/${reportId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    
    // Get all submissions for admin status page
    getAllSubmissions: (params?: any) => {
      console.log("Fetching all submissions for admin with params:", params);
      return api.get(`${API_PREFIX}/document-submissions/admin/all`, { params });
    },
  },
  
  // Login approval endpoints
  loginApprovals: {
    getPending: () =>
      api.get(`${API_PREFIX}/login-approvals/pending`),
    
    getById: (id: string) =>
      api.get(`${API_PREFIX}/login-approvals/${id}`),
    
    approve: (id: string) =>
      api.put(`${API_PREFIX}/login-approvals/${id}/approve`),
    
    reject: (id: string, reason: string) =>
      api.put(`${API_PREFIX}/login-approvals/${id}/reject`, { reason }),
    
    getByVendor: (vendorId: string) =>
      api.get(`${API_PREFIX}/login-approvals/vendor/${vendorId}`),
  },
  
  // Notification endpoints
  notifications: {
    getAll: () =>
      api.get(`${API_PREFIX}/notifications`),
    
    markAsRead: (id: string) =>
      api.put(`${API_PREFIX}/notifications/${id}/read`),
    
    markAllAsRead: () =>
      api.put(`${API_PREFIX}/notifications/read-all`),
    
    delete: (id: string) =>
      api.delete(`${API_PREFIX}/notifications/${id}`),
    
    send: (notificationData: any) => // Added send method
      api.post(`${API_PREFIX}/notifications`, notificationData),
  },
  
  // Report endpoints
  reports: {
    getAll: () =>
      api.get(`${API_PREFIX}/reports`),
    
    getDocumentStatus: (startDate: string, endDate: string) =>
      api.post(`${API_PREFIX}/reports/document-status`, { startDate, endDate }),
    
    getAgingReport: () =>
      api.get(`${API_PREFIX}/reports/aging-report`),
    
    getDocumentStatusDistribution: () =>
      api.get(`${API_PREFIX}/documents/reports/status-distribution`),
    
    getMonthlySubmissions: () =>
      api.get(`${API_PREFIX}/documents/reports/monthly-submissions`),
    
    // New MIS report endpoints
    getMISData: (year: number, month: string) =>
      api.get(`${API_PREFIX}/reports/mis`, { params: { year, month } }),
    
    getVendorComplianceReport: (params?: any) =>
      api.get(`${API_PREFIX}/reports/vendor-compliance`, { params }),
    
    getConsultantWorkloadReport: (params?: any) =>
      api.get(`${API_PREFIX}/reports/consultant-workload`, { params }),
    
    generateReport: (reportType: string, params: any) =>
      api.post(`${API_PREFIX}/reports/generate/${reportType}`, params, {
        responseType: 'blob'
      }),
    
    getAdvancedAnalytics: (params?: any) =>
      api.get(`${API_PREFIX}/reports/advanced-analytics`, { params }),
  },
  
  // Message endpoints
  messages: {
    get: (params: any) => // Added get method for messages
      api.get(`${API_PREFIX}/messages`, { params }),
    send: (messageData: any) => // Added send method for messages
      api.post(`${API_PREFIX}/messages`, messageData),
  },
};

export default apiService;