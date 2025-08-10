import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../utils/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import {
  DocumentArrowUpIcon,
  TrashIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Define API_PREFIX for document existence checks
const API_PREFIX = '/api';

// 🔁 Monthly Mandatory Uploads - Required every month and must be marked as mandatory
const MONTHLY_MANDATORY_DOCUMENTS = [
  { id: 'invoice', name: 'Invoice' },
  { id: 'form_t_muster_roll', name: 'Form T Combined Muster Roll Cum Register of Wages (previous month)' },
  { id: 'bank_statement', name: 'Bank Statement (previous month)' },
  { id: 'ecr', name: 'Electronic Challan Cum Return (ECR) (previous month)' },
  { id: 'pf_combined_challan', name: 'Combined Challan of A/C NO. 01, 02, 10, 21 & 22 (EPFO) (previous month)' },
  { id: 'pf_trrn_details', name: 'Provident Fund TRRN Details (previous month)' },
  { id: 'esi_contribution_history', name: 'ESIC Contribution History Statement (previous month)' },
  { id: 'esi_challan', name: 'ESIC Challan (previous month)' },
  { id: 'professional_tax_returns', name: 'Professional Tax Returns – Form 5A (previous month)' }
];

// 🗓️ Annual Upload - Required only in January and be mandatory
const ANNUAL_MANDATORY_DOCUMENTS: { id: string; name: string }[] = [
  // Labour Welfare Fund document moved to DECEMBER_MANDATORY_DOCUMENTS to only show in December
];

// 📅 December Mandatory Documents - Required when December is selected
const DECEMBER_MANDATORY_DOCUMENTS = [
  { id: 'labour_welfare_fund_december', name: 'Labour Welfare Fund Form-D_Statement of Labour Welfare Fund by Employer (every year December month)' }
];

// 📁 One-Time Optional Uploads - Upload only once (any month) and marked as not mandatory
const ONE_TIME_OPTIONAL_DOCUMENTS = [
  { id: 'vendor_agreement', name: 'Copy of Agreement (Vendors)' },
  { id: 'epf_code_letter', name: 'EPF Code Allotment Letter' },
  { id: 'epf_form_5a', name: 'EPF Form – 5A' },
  { id: 'esic_registration', name: 'ESIC Registration Certificate – Form C11' },
  { id: 'pt_registration', name: 'Professional Tax Registration Certificate – Form 3' },
  { id: 'pt_enrollment', name: 'Professional Tax Enrollment Certificate – Form 4' },
  { id: 'contract_labour_license', name: 'Contract Labour License (if applicable)' }
];

// Legacy alias for backward compatibility
const OPTIONAL_DOCUMENTS = ONE_TIME_OPTIONAL_DOCUMENTS;

// Function to get available document types based on selected month
const getAvailableDocumentTypes = (selectedMonth: string) => {
  const monthlyDocs = MONTHLY_MANDATORY_DOCUMENTS;
  const annualDocs = selectedMonth === 'Jan' ? ANNUAL_MANDATORY_DOCUMENTS : [];
  const decemberDocs = selectedMonth === 'Dec' ? DECEMBER_MANDATORY_DOCUMENTS : [];
  const optionalDocs = ONE_TIME_OPTIONAL_DOCUMENTS;
  
  return {
    mandatory: [...monthlyDocs, ...annualDocs, ...decemberDocs],
    optional: optionalDocs,
    all: [...monthlyDocs, ...annualDocs, ...decemberDocs, ...optionalDocs]
  };
};

// Function to check if a document type is mandatory for the given month
const isDocumentMandatory = (documentType: string, selectedMonth: string) => {
  const monthlyMandatory = MONTHLY_MANDATORY_DOCUMENTS.some(doc => doc.id === documentType);
  const annualMandatory = selectedMonth === 'Jan' && ANNUAL_MANDATORY_DOCUMENTS.some(doc => doc.id === documentType);
  const decemberMandatory = selectedMonth === 'Dec' && DECEMBER_MANDATORY_DOCUMENTS.some(doc => doc.id === documentType);
  
  return monthlyMandatory || annualMandatory || decemberMandatory;
};

// All mandatory document types (combined) - keeping for backward compatibility
const MANDATORY_DOCUMENTS = [...MONTHLY_MANDATORY_DOCUMENTS, ...ANNUAL_MANDATORY_DOCUMENTS, ...DECEMBER_MANDATORY_DOCUMENTS];

// Utility function to parse agreement period string and calculate end date
const parseAgreementPeriod = (agreementPeriod: string, createdAt: string): { endDate: Date | null, durationInMonths: number } => {
  if (!agreementPeriod || !createdAt) {
    return { endDate: null, durationInMonths: 0 };
  }

  const periodString = agreementPeriod.trim();
  const creationDate = new Date(createdAt);
  
  // If creation date is invalid, return null
  if (isNaN(creationDate.getTime())) {
    return { endDate: null, durationInMonths: 0 };
  }

  // Check if agreement period is in date range format (e.g., "1 July 2025 to 15 July 2025")
  const dateRangeMatch = periodString.match(/(\d{1,2}\s+\w+\s+\d{4})\s+to\s+(\d{1,2}\s+\w+\s+\d{4})/i);
  if (dateRangeMatch) {
    let endDateStr = dateRangeMatch[2];
    
    // Fix common typos in month names
    endDateStr = endDateStr
      .replace(/agust/gi, 'august')
      .replace(/septemb/gi, 'september')
      .replace(/octob/gi, 'october')
      .replace(/novemb/gi, 'november')
      .replace(/decemb/gi, 'december')
      .replace(/febru/gi, 'february');
    
    const endDate = new Date(endDateStr);
    
    if (!isNaN(endDate.getTime())) {
      // Calculate duration in months for reference
      const timeDiff = endDate.getTime() - creationDate.getTime();
      const durationInMonths = Math.round(timeDiff / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
      
      return { endDate, durationInMonths };
    }
  }

  // If not a date range, parse as period description
  const periodStringLower = periodString.toLowerCase();
  let durationInMonths = 12; // Default to 1 year

  // Parse common agreement period formats
  if (periodStringLower.includes('annual') || periodStringLower.includes('yearly') || periodStringLower.includes('1 year')) {
    durationInMonths = 12;
  } else if (periodStringLower.includes('2 year') || periodStringLower.includes('two year')) {
    durationInMonths = 24;
  } else if (periodStringLower.includes('3 year') || periodStringLower.includes('three year')) {
    durationInMonths = 36;
  } else if (periodStringLower.includes('6 month') || periodStringLower.includes('six month')) {
    durationInMonths = 6;
  } else if (periodStringLower.includes('18 month') || periodStringLower.includes('eighteen month')) {
    durationInMonths = 18;
  } else if (periodStringLower.includes('permanent') || periodStringLower.includes('indefinite')) {
    // For permanent contracts, don't show expiry warning
    return { endDate: null, durationInMonths: 0 };
  } else {
    // Try to extract number from string (e.g., "5 Year Contract" -> 5)
    const numberMatch = periodStringLower.match(/(\d+)\s*(year|month)/);
    if (numberMatch) {
      const number = parseInt(numberMatch[1], 10);
      const unit = numberMatch[2];
      
      if (unit === 'year') {
        durationInMonths = number * 12;
      } else if (unit === 'month') {
        durationInMonths = number;
      }
    }
  }

  // Calculate end date by adding duration to creation date
  const endDate = new Date(creationDate);
  endDate.setMonth(endDate.getMonth() + durationInMonths);
  
  return { endDate, durationInMonths };
};

// Function to check if agreement is expiring within 30 days
const checkAgreementExpiry = (agreementPeriod: string, createdAt: string) => {
  const { endDate } = parseAgreementPeriod(agreementPeriod, createdAt);
  
  if (!endDate) {
    return {
      isExpiring: false,
      daysRemaining: 0,
      endDate: null
    };
  }

  const now = new Date();
  const timeDiff = endDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  return {
    isExpiring: daysRemaining <= 30 && daysRemaining > 0,
    daysRemaining: Math.max(0, daysRemaining),
    endDate
  };
};

// Function to map document type IDs to valid document types for backend
const getValidDocumentType = (documentType: string): string => {
  // Map specific document types to backend enum values
  const typeMapping: { [key: string]: string } = {
    'invoice': 'financial',
    'form_t_muster_roll': 'compliance',
    'bank_statement': 'financial',
    'ecr': 'compliance',
    'pf_combined_challan': 'financial',
    'pf_trrn_details': 'compliance',
    'esi_contribution_history': 'financial',
    'esi_challan': 'financial',
    'professional_tax_returns': 'compliance',
    'labour_welfare_fund': 'compliance',
    'labour_welfare_fund_december': 'compliance',
    'vendor_agreement': 'registration',
    'epf_code_letter': 'registration',
    'epf_form_5a': 'registration',
    'esic_registration': 'registration',
    'pt_registration': 'registration',
    'pt_enrollment': 'registration',
    'contract_labour_license': 'registration',
    // Handle uppercase variants that might come from backend
    'PF_TRRN_DETAILS': 'compliance',
    'FORM_T_MUSTER_ROLL': 'compliance',
    'BANK_STATEMENT': 'financial',
    'ECR': 'compliance',
    'PF_COMBINED_CHALLAN': 'financial',
    'ESI_CONTRIBUTION_HISTORY': 'financial',
    'ESI_CHALLAN': 'financial',
    'PROFESSIONAL_TAX_RETURNS': 'compliance',
    'LABOUR_WELFARE_FUND': 'compliance',
    'LABOUR_WELFARE_FUND_DECEMBER': 'compliance',
    'VENDOR_AGREEMENT': 'registration',
    'EPF_CODE_LETTER': 'registration',
    'EPF_FORM_5A': 'registration',
    'ESIC_REGISTRATION': 'registration',
    'PT_REGISTRATION': 'registration',
    'PT_ENROLLMENT': 'registration',
    'CONTRACT_LABOUR_LICENSE': 'registration',
    'INVOICE': 'financial'
  };
  
  // Return mapped type or default to 'compliance'
  return typeMapping[documentType] || 'compliance';
};

// Define years and months for dropdown
const YEARS = Array.from({ length: 11 }, (_, i) => 2025 + i);
const MONTHS = [
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

interface DocumentFile {
  id: string;
  documentType: string;
  file: File;
  isMandatory: boolean;
}

interface Consultant {
  _id: string;
  name: string;
  email: string;
}

interface DocumentSubmissionFormProps {
  mode?: 'submit' | 'resubmit';
  documentId?: string;
}

interface DocumentDetails {
  _id: string;
  title: string;
  documentType: string;
  status: string;
  reviewNotes?: string;
  submissionId?: string;
}

const DocumentSubmissionForm: React.FC<DocumentSubmissionFormProps> = ({ mode = 'submit', documentId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Form state
  const [year, setYear] = useState<number>(2025);
  const [month, setMonth] = useState<string>('Apr');
  const [consultantId, setConsultantId] = useState<string>('');
  const [consultantName, setConsultantName] = useState<string>('');
  const [consultantEmail, setConsultantEmail] = useState<string>('');
  const [invoiceNo, setInvoiceNo] = useState<string>('');
  const [agreementPeriod, setAgreementPeriod] = useState<string>('');
  const [documentFiles, setDocumentFiles] = useState<DocumentFile[]>([]);
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [documentDetails, setDocumentDetails] = useState<DocumentDetails | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [agreementExpiryWarning, setAgreementExpiryWarning] = useState<{
    isExpiring: boolean;
    daysRemaining: number;
    endDate: Date | null;
  }>({
    isExpiring: false,
    daysRemaining: 0,
    endDate: null
  });
  

  
  // Load assigned consultant and document details (if in resubmit mode)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch assigned consultant for the vendor
        if (user?._id) {
          const response = await apiService.users.getById(user._id);
          
          if (response.data.success && response.data.data) {
            const userData = response.data.data;
            console.log('User data fetched in DocumentSubmissionForm:', userData);
            
            // Set agreement period from user data
            if (userData.agreementPeriod) {
              console.log('Setting agreement period from user data:', userData.agreementPeriod);
              setAgreementPeriod(userData.agreementPeriod);
              
              // Check if agreement is expiring within 30 days
              const expiryInfo = checkAgreementExpiry(userData.agreementPeriod, userData.createdAt);
              setAgreementExpiryWarning(expiryInfo);
              
              console.log('🔍 Agreement expiry check result:', {
                agreementPeriod: userData.agreementPeriod,
                createdAt: userData.createdAt,
                endDate: expiryInfo.endDate,
                isExpiring: expiryInfo.isExpiring,
                daysRemaining: expiryInfo.daysRemaining
              });
              
              if (expiryInfo.isExpiring) {
                console.log(`⚠️ Agreement expiring in ${expiryInfo.daysRemaining} days! WARNING SHOULD BE VISIBLE!`);
              } else if (expiryInfo.endDate && expiryInfo.daysRemaining <= 0) {
                console.log(`❌ Agreement has already expired! (${Math.abs(expiryInfo.daysRemaining)} days ago)`);
              } else {
                console.log(`✅ Agreement is active. ${expiryInfo.daysRemaining} days remaining. No warning needed.`);
              }
            }
            
            // Handle assigned consultant
            if (userData.assignedConsultant) {
              // Extract the consultant ID - handle both string and object cases
              const assignedConsultant = userData.assignedConsultant;
              const consultantId = typeof assignedConsultant === 'string' 
                ? assignedConsultant 
                : assignedConsultant._id || assignedConsultant.id;
              
              if (consultantId) {
                const consultantResponse = await apiService.users.getById(consultantId);
                
                if (consultantResponse.data.success) {
                  const consultant = consultantResponse.data.data;
                  setConsultantId(consultant._id);
                  setConsultantName(consultant.name);
                  setConsultantEmail(consultant.email);
                }
              }
            }
          }
          
          // Fetch all consultants for dropdown
          const allConsultantsResponse = await apiService.users.getConsultants();
          
          if (allConsultantsResponse.data.success) {
            setConsultants(allConsultantsResponse.data.data);
          }
          
          // If in resubmit mode, fetch document details
          if (mode === 'resubmit' && documentId) {
            try {
              const documentResponse = await apiService.documents.getById(documentId);
              
              if (documentResponse.data.success) {
                const doc = documentResponse.data.data;
                setDocumentDetails({
                  _id: doc._id,
                  title: doc.title,
                  documentType: doc.documentType,
                  status: doc.status,
                  reviewNotes: doc.reviewNotes,
                  submissionId: doc.submissionId
                });
                
                if (doc.submissionId) {
                  setSubmissionId(doc.submissionId);
                }
                
                // Set the year and month based on the document's submission date
                if (doc.submissionDate) {
                  const date = new Date(doc.submissionDate);
                  setYear(date.getFullYear());
                  
                  // Convert month number to month code (Apr, May, etc.)
                  const monthIndex = date.getMonth();
                  const monthCodes = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  setMonth(monthCodes[monthIndex]);
                }
              } else {
                setError('Failed to load document details. Please try again.');
              }
            } catch (docErr: any) {
              console.error('Error fetching document details:', docErr);
              setError('Failed to load document details. Please try again.');
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('Failed to load necessary information. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, mode, documentId]);
  
  // Handle file selection for mandatory documents
  const handleFileChange = (documentType: string, file: File | null) => {
    if (!file) return;
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError(`File ${file.name} exceeds the 5MB size limit.`);
      return;
    }
    
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'];
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      setError(`File ${file.name} has an unsupported format. Please upload PDF, Word, Excel, PNG, or JPEG files.`);
      return;
    }
    
    // Add or update file in the list
    setDocumentFiles(prev => {
      const existingIndex = prev.findIndex(doc => doc.documentType === documentType);
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          file
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: `doc_${Date.now()}`,
            documentType,
            file,
            isMandatory: isDocumentMandatory(documentType, month)
          }
        ];
      }
    });
    
    // Clear any previous errors
    setError(null);
  };
  
  // Remove a document
  const handleRemoveDocument = (id: string) => {
    setDocumentFiles(prev => prev.filter(doc => doc.id !== id));
  };
  
  // Handle consultant selection
  const handleConsultantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selected = consultants.find(c => c._id === selectedId);
    
    if (selected) {
      setConsultantId(selected._id);
      setConsultantName(selected.name);
      setConsultantEmail(selected.email);
    } else {
      setConsultantId('');
      setConsultantName('');
      setConsultantEmail('');
    }
  };
  
  // Check if all mandatory documents are uploaded
  const checkMandatoryDocuments = () => {
    const uploadedTypes = documentFiles.map(doc => doc.documentType);
    const availableTypes = getAvailableDocumentTypes(month);
    const missingTypes = availableTypes.mandatory.filter(doc => !uploadedTypes.includes(doc.id));
    
    return {
      allUploaded: missingTypes.length === 0,
      missing: missingTypes,
      required: availableTypes.mandatory
    };
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Different validation based on mode
    if (mode === 'submit') {
      // Validate form for full submission
      if (!year || !month || !consultantName || !consultantEmail || !invoiceNo) {
        setError('Please fill in all required fields.');
        return;
      }
      
      // Check mandatory documents
      const mandatoryCheck = checkMandatoryDocuments();
      if (!mandatoryCheck.allUploaded) {
        setError(`Please upload all mandatory documents. Missing: ${mandatoryCheck.missing.map(doc => doc.name).join(', ')}`);
        return;
      }
    } else {
      // Validate form for resubmission
      if (!documentFiles.length) {
        setError('Please upload the document file.');
        return;
      }
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      if (mode === 'resubmit' && documentDetails && documentId) {
        // Handle document resubmission
        const formData = new FormData();
        
        // Get the document file (should be only one in resubmit mode)
        const docFile = documentFiles[0];
        
        if (!docFile) {
          setError('Please upload the document file.');
          setSubmitting(false);
          return;
        }
        
        // If we have a submissionId, try to use the resubmitDocumentInSubmission API
        if (submissionId) {
          console.log('Resubmitting document using new API:', {
            submissionId,
            documentId,
            fileName: docFile.file.name
          });
          
          try {
            // Create a direct API call to the document submission controller
            // instead of using the standard document upload API
            
            // First, let's try to update the document status directly
            try {
              const updateResponse = await apiService.documents.updateStatus(
                documentId,
                'resubmitted',
                'Document resubmitted by vendor'
              );
              
              if (updateResponse.data.success) {
                setSuccess('Document status updated successfully. The document has been marked as resubmitted.');
                setTimeout(() => {
                  navigate('/vendor/documents');
                }, 2000);
                return;
              }
            } catch (updateErr) {
              console.error('Error updating document status:', updateErr);
              // Continue with file upload as fallback
            }
            
            // If status update failed, try file upload as fallback
            const submissionFormData = new FormData();
            
            // Use 'files' as the field name for the standard upload API
            submissionFormData.append('files', docFile.file);
            
            // Add required metadata fields
            submissionFormData.append('documentType', 'compliance'); // Use a valid document type
            submissionFormData.append('title', `Resubmission: ${documentDetails.documentType}`);
            submissionFormData.append('description', `Resubmitted document for ${documentDetails.documentType}`);
            
            // Add vendor ID explicitly
            submissionFormData.append('vendor', user?._id || '');
            
            // Add fields to identify this as a reupload
            submissionFormData.append('isReupload', 'true');
            submissionFormData.append('originalDocumentId', documentId);
            
            // If we have a submission ID, add it to the form data
            if (submissionId) {
              submissionFormData.append('submissionId', submissionId);
            }
            
            // First check if the document exists
            let documentExists = false;
            try {
              // Check if document exists
              const checkResponse = await fetch(`${API_PREFIX}/documents/exists/${documentId}`);
              const checkData = await checkResponse.json();
              documentExists = checkData.exists;
              console.log(`Document existence check result for ${documentId}:`, documentExists);
            } catch (checkErr) {
              console.error('Error checking document existence:', checkErr);
              // Assume document doesn't exist if check fails
              documentExists = false;
            }
            
            // If document doesn't exist, create a new document instead of reuploading
            if (!documentExists) {
              console.log(`Document ${documentId} doesn't exist. Creating a new document instead of reuploading.`);
              
              // Use the standard document upload endpoint
              const newDocResponse = await apiService.documents.upload(submissionFormData);
              
              if (newDocResponse.data.success) {
                setSuccess('Document submitted successfully as a new document (previous version no longer exists)');
                
                // Redirect to status page after a delay
                setTimeout(() => {
                  navigate('/documents/status');
                }, 2000);
                return;
              } else {
                throw new Error(newDocResponse.data.message || 'Failed to submit document');
              }
            }
            
            // If document exists, proceed with reupload
            const response = await apiService.documents.reuploadDocument(
              documentId,
              submissionFormData
            );
            
            if (response.data.success) {
              setSuccess('Document resubmitted successfully!');
              
              // Redirect to status page after a delay
              setTimeout(() => {
                navigate('/documents/status');
              }, 2000);
            } else {
              throw new Error(response.data.message || 'Failed to resubmit document');
            }
          } catch (resubmitErr: any) {
            console.error('Error resubmitting document with new API:', resubmitErr);
            
            // Try legacy API as fallback
            try {
              // Prepare formData for standard document upload API
              const reuploadFormData = new FormData();
              reuploadFormData.append('files', docFile.file); // Use 'files' as the field name for the standard upload API
              
              // Add metadata fields for the document
              reuploadFormData.append('documentType', getValidDocumentType(documentDetails.documentType));
              reuploadFormData.append('title', `Resubmission: ${documentDetails.documentType}`);
              reuploadFormData.append('description', `Resubmitted document for ${documentDetails.documentType}`);
              
              // First check if the document exists
              let documentExists = false;
              try {
                // Check if document exists
                const checkResponse = await fetch(`${API_PREFIX}/documents/exists/${documentId}`);
                const checkData = await checkResponse.json();
                documentExists = checkData.exists;
                console.log(`Legacy API - Document existence check result for ${documentId}:`, documentExists);
              } catch (checkErr) {
                console.error('Legacy API - Error checking document existence:', checkErr);
                // Assume document doesn't exist if check fails
                documentExists = false;
              }
              
              // If document doesn't exist, create a new document instead of reuploading
              if (!documentExists) {
                console.log(`Legacy API - Document ${documentId} doesn't exist. Creating a new document instead of reuploading.`);
                
                // Use the standard document upload endpoint
                const newDocResponse = await apiService.documents.upload(reuploadFormData);
                
                if (newDocResponse.data.success) {
                  setSuccess('Document submitted successfully as a new document (previous version no longer exists)');
                  
                  // Redirect to status page after a delay
                  setTimeout(() => {
                    navigate('/documents/status');
                  }, 2000);
                  return;
                } else {
                  throw new Error(newDocResponse.data.message || 'Failed to submit document');
                }
              }
              
              // Add fields to identify this as a reupload
              reuploadFormData.append('isReupload', 'true');
              reuploadFormData.append('originalDocumentId', documentId);
              
              const legacyResponse = await apiService.documents.reuploadDocument(
                documentId,
                reuploadFormData
              );
              
              if (legacyResponse.data.success) {
                setSuccess('Document resubmitted successfully!');
                
                // Redirect to status page after a delay
                setTimeout(() => {
                  navigate('/documents/status');
                }, 2000);
              } else {
                throw new Error(legacyResponse.data.message || 'Failed to resubmit document');
              }
            } catch (legacyErr: any) {
              console.error('Error resubmitting document with legacy API:', legacyErr);
              setError(legacyErr.response?.data?.message || 'Failed to resubmit document. Please try again.');
            }
          }
        } else {
          // Use legacy API directly
          try {
            // Create a direct API call to the document submission controller
            // instead of using the standard document upload API
            
            // First, let's try to update the document status directly
            try {
              const updateResponse = await apiService.documents.updateStatus(
                documentId,
                'resubmitted',
                'Document resubmitted by vendor'
              );
              
              if (updateResponse.data.success) {
                setSuccess('Document status updated successfully. The document has been marked as resubmitted.');
                setTimeout(() => {
                  navigate('/vendor/documents');
                }, 2000);
                return;
              }
            } catch (updateErr) {
              console.error('Error updating document status:', updateErr);
              // Continue with file upload as fallback
            }
            
            // If status update failed, try file upload as fallback
            const reuploadFormData = new FormData();
            
            // Use 'files' as the field name for the standard upload API
            reuploadFormData.append('files', docFile.file);
            
            // Add required metadata fields
            reuploadFormData.append('documentType', 'compliance'); // Use a valid document type
            reuploadFormData.append('title', `Resubmission: ${documentDetails.documentType}`);
            reuploadFormData.append('description', `Resubmitted document for ${documentDetails.documentType}`);
            
            // Add vendor ID explicitly
            reuploadFormData.append('vendor', user?._id || '');
            
            // First check if the document exists
            let documentExists = false;
            try {
              // Check if document exists
              const checkResponse = await fetch(`${API_PREFIX}/documents/exists/${documentId}`);
              const checkData = await checkResponse.json();
              documentExists = checkData.exists;
              console.log(`Fallback method - Document existence check result for ${documentId}:`, documentExists);
            } catch (checkErr) {
              console.error('Fallback method - Error checking document existence:', checkErr);
              // Assume document doesn't exist if check fails
              documentExists = false;
            }
            
            // If document doesn't exist, create a new document instead of reuploading
            if (!documentExists) {
              console.log(`Fallback method - Document ${documentId} doesn't exist. Creating a new document instead of reuploading.`);
              
              // Use the standard document upload endpoint
              const newDocResponse = await apiService.documents.upload(reuploadFormData);
              
              if (newDocResponse.data.success) {
                setSuccess('Document submitted successfully as a new document (previous version no longer exists)');
                
                // Redirect to status page after a delay
                setTimeout(() => {
                  navigate('/vendor/documents');
                }, 2000);
                return;
              } else {
                throw new Error(newDocResponse.data.message || 'Failed to submit document');
              }
            }
            
            // Add fields to identify this as a reupload
            reuploadFormData.append('isReupload', 'true');
            reuploadFormData.append('originalDocumentId', documentId);
            
            const legacyResponse = await apiService.documents.reuploadDocument(
              documentId,
              reuploadFormData
            );
            
            if (legacyResponse.data.success) {
              setSuccess('Document resubmitted successfully!');
              
              // Redirect to status page after a delay
              setTimeout(() => {
                navigate('/documents/status');
              }, 2000);
            } else {
              setError(legacyResponse.data.message || 'Failed to resubmit document. Please try again.');
            }
          } catch (legacyErr: any) {
            console.error('Error resubmitting document with legacy API:', legacyErr);
            setError(legacyErr.response?.data?.message || 'Failed to resubmit document. Please try again.');
          }
        }
      } else {
        // Handle full document submission
        const formData = new FormData();
        formData.append('year', year.toString());
        formData.append('month', month);
        formData.append('consultantName', consultantName);
        formData.append('consultantEmail', consultantEmail);
        formData.append('invoiceNo', invoiceNo);
        formData.append('workLocation', 'IMTMA, Bengaluru');
        formData.append('agreementPeriod', agreementPeriod);
        
        // Add all document files
        documentFiles.forEach((doc) => {
          // Append each file with its type as the field name for proper identification on server
          formData.append(doc.documentType, doc.file);
          formData.append(`${doc.documentType}_isMandatory`, doc.isMandatory.toString());
        });
        
        // Log FormData for debugging
        console.log('Submitting documents with the following data:');
        // Convert FormData entries to array first to avoid TypeScript iteration error
        Array.from(formData.entries()).forEach(pair => {
          console.log(pair[0], pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]);
        });
        
        // Submit the form
        const response = await apiService.documents.uploadDocumentSubmission(formData);
        
        if (response.data.success) {
          setSuccess('Documents submitted successfully!');
          
          // Redirect to status page after a delay
          setTimeout(() => {
            navigate('/documents/status');
          }, 2000);
        } else {
          setError(response.data.message || 'Failed to submit documents. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('Error submitting documents:', err);
      setError(err.response?.data?.message || 'An error occurred while submitting documents. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {mode === 'resubmit' ? 'Resubmit Document' : 'Document Submission'}
        </h2>
        
        {/* Agreement Expiry Warning Banner */}
        {agreementExpiryWarning.isExpiring && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                  Agreement Expiring Soon!
                </h3>
                <p className="text-red-700 dark:text-red-300 mt-1">
                  {agreementExpiryWarning.daysRemaining === 0 
                    ? 'Your agreement expires today!' 
                    : `Your agreement expires in ${agreementExpiryWarning.daysRemaining} day${agreementExpiryWarning.daysRemaining !== 1 ? 's' : ''}!`
                  }
                  {agreementExpiryWarning.endDate && (
                    <span className="ml-1">
                      ({agreementExpiryWarning.endDate.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })})
                    </span>
                  )}
                </p>
                <p className="text-red-700 dark:text-red-300 mt-1 font-medium">
                  Please contact your consultant immediately to renew your agreement to avoid service interruption.
                </p>
                {consultantEmail && (
                  <div className="mt-3">
                    <a
                      href={`mailto:${consultantEmail}?subject=Urgent: Agreement Renewal Request&body=Dear ${consultantName || 'Consultant'},%0D%0A%0D%0AMy agreement is expiring soon and I need immediate assistance with the renewal process.%0D%0A%0D%0AExpiry Date: ${agreementExpiryWarning.endDate ? agreementExpiryWarning.endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}%0D%0A%0D%0APlease contact me as soon as possible.%0D%0A%0D%0AThank you.`}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200"
                    >
                      Contact Consultant Now
                    </a>
                    <span className="ml-3 text-sm text-red-600 dark:text-red-400">
                      {consultantName} ({consultantEmail})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Agreement Expired Banner */}
        {!agreementExpiryWarning.isExpiring && agreementExpiryWarning.endDate && agreementExpiryWarning.daysRemaining <= 0 && (
          <div className="mb-6 bg-red-800 dark:bg-red-900 border-l-4 border-red-600 p-4 rounded-md">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-200 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-red-100 dark:text-red-200">
                  Agreement Has Expired
                </h3>
                <p className="text-red-200 dark:text-red-300 mt-1">
                  Your agreement expired on {agreementExpiryWarning.endDate.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })} ({Math.abs(agreementExpiryWarning.daysRemaining)} day{Math.abs(agreementExpiryWarning.daysRemaining) !== 1 ? 's' : ''} ago)
                </p>
                <p className="text-red-200 dark:text-red-300 mt-1 font-medium">
                  Please contact your consultant immediately to renew your agreement. Service may be interrupted.
                </p>
                {consultantEmail && (
                  <div className="mt-3">
                    <a
                      href={`mailto:${consultantEmail}?subject=URGENT: Expired Agreement Renewal&body=Dear ${consultantName || 'Consultant'},%0D%0A%0D%0AMy agreement has expired and I need immediate assistance with the renewal process.%0D%0A%0D%0AExpiry Date: ${agreementExpiryWarning.endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}%0D%0A%0D%0APlease contact me urgently to avoid service interruption.%0D%0A%0D%0AThank you.`}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200"
                    >
                      Contact Consultant URGENTLY
                    </a>
                    <span className="ml-3 text-sm text-red-300">
                      {consultantName} ({consultantEmail})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
              <span className="text-red-700 dark:text-red-400">{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 p-4 rounded-md">
            <div className="flex">
              <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
              <span className="text-green-700 dark:text-green-400">{success}</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {mode === 'resubmit' && documentDetails ? (
              // Resubmission mode - show only the specific document type
              <div className="space-y-6">
                {/* Document Information */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Document Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Document Type</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">{documentDetails.documentType}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                      <p className="text-base font-semibold text-red-600 dark:text-red-400">Rejected</p>
                    </div>
                  </div>
                  
                  {documentDetails.reviewNotes && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Consultant Remarks</p>
                      <div className="mt-1 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400">
                        {documentDetails.reviewNotes}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Document Upload */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Upload New Document
                  </h3>
                  
                  <div className="border border-gray-300 dark:border-gray-600 rounded-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <label htmlFor="reupload" className="block text-md font-medium text-gray-700 dark:text-gray-300">
                        {documentDetails.documentType} <span className="text-red-500">*</span>
                      </label>
                    </div>
                    
                    <div className="mt-2 flex items-center">
                      <input
                        id="reupload"
                        type="file"
                        onChange={(e) => handleFileChange(documentDetails.documentType, e.target.files ? e.target.files[0] : null)}
                        className="sr-only"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      />
                      <label
                        htmlFor="reupload"
                        className="cursor-pointer bg-white dark:bg-gray-800 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-5 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <DocumentArrowUpIcon className="h-5 w-5 text-gray-400 mr-2 inline-block" />
                        Choose File
                      </label>
                      
                      <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                        {documentFiles.find(file => file.documentType === documentDetails.documentType)?.file.name || 'No file chosen'}
                      </span>
                      
                      {documentFiles.find(file => file.documentType === documentDetails.documentType) && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(documentFiles.find(file => file.documentType === documentDetails.documentType)?.id || '')}
                          className="ml-3 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      Please upload a new version of the document addressing the consultant's remarks.
                      Supported file formats: PDF, Word, Excel, PNG, JPEG. Maximum file size: 5MB.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Regular submission mode - show all document types
              <>
                {/* Upload Period */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Year
                    </label>
                    <select
                      id="year"
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value))}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    >
                      {YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
              
                  <div>
                    <label htmlFor="month" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Month
                    </label>
                    <select
                      id="month"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    >
                      {MONTHS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Agreement Period (Read-only) */}
                <div>
                  <label htmlFor="agreementPeriod" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Agreement Period
                    {agreementExpiryWarning.isExpiring && (
                      <span className="ml-2 inline-flex items-center">
                        <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                        <span className="text-red-500 text-xs font-medium">Expiring Soon!</span>
                      </span>
                    )}
                    {!agreementExpiryWarning.isExpiring && agreementExpiryWarning.endDate && agreementExpiryWarning.daysRemaining <= 0 && (
                      <span className="ml-2 inline-flex items-center">
                        <ExclamationTriangleIcon className="h-4 w-4 text-red-600 mr-1" />
                        <span className="text-red-600 text-xs font-medium">Expired!</span>
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="agreementPeriod"
                      value={agreementPeriod}
                      readOnly
                      placeholder="Agreement period will be loaded from your profile"
                      className={`block w-full rounded-md shadow-sm cursor-not-allowed bg-gray-50 ${
                        agreementExpiryWarning.isExpiring
                          ? 'border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200'
                          : (!agreementExpiryWarning.isExpiring && agreementExpiryWarning.endDate && agreementExpiryWarning.daysRemaining <= 0)
                          ? 'border-red-400 dark:border-red-500 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          : 'border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-300'
                      }`}
                    />
                    {agreementExpiryWarning.isExpiring && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                      </div>
                    )}
                    {!agreementExpiryWarning.isExpiring && agreementExpiryWarning.endDate && agreementExpiryWarning.daysRemaining <= 0 && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This field is set by the administrator and cannot be modified.
                  </p></div>
                
                {/* Consultant Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="consultantId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Consultant
                    </label>
                    <select
                      id="consultantId"
                      value={consultantId}
                      onChange={handleConsultantChange}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                      disabled={user?.role === 'vendor'}
                    >
                      <option value="">Select Consultant</option>
                      {consultants.map((consultant) => (
                        <option key={consultant._id} value={consultant._id}>
                          {consultant.name}
                        </option>
                      ))}
                    </select>
                    {user?.role === 'vendor' && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Consultant assignment is managed by administrators
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="consultantEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Consultant Email
                    </label>
                    <input
                      type="email"
                      id="consultantEmail"
                      value={consultantEmail}
                      onChange={(e) => setConsultantEmail(e.target.value)}
                      className={`block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 ${user?.role === 'vendor' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                      required
                      readOnly={user?.role === 'vendor'}
                    />
                    {user?.role === 'vendor' && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Consultant information is managed by administrators
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Location & Invoice */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      value="IMTMA, Bengaluru"
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-gray-100 dark:bg-gray-800"
                      disabled
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="invoiceNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Invoice No.
                    </label>
                    <input
                      type="text"
                      id="invoiceNo"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    />
                  </div>
                </div>
                
                {/* Document Upload Section */}
                <div className="mt-8">
                  {(() => {
                    const availableTypes = getAvailableDocumentTypes(month);
                    
                    return (
                      <div className="space-y-8">
                        {/* Monthly Mandatory Documents */}
                        <div>
                          <div className="flex items-center mb-4">
                            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg mr-3">
                              <span className="text-gray-600 dark:text-gray-400 text-xl">🔁</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Monthly Mandatory Uploads
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Required every month and must be marked as mandatory
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            {MONTHLY_MANDATORY_DOCUMENTS.map((doc) => {
                              const uploadedDoc = documentFiles.find(d => d.documentType === doc.id);
                              
                              return (
                                <div key={doc.id} className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-md p-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <label htmlFor={`file-${doc.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                      {doc.name} <span className="text-gray-500">*</span>
                                    </label>
                                    {uploadedDoc && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        type="button"
                                        onClick={() => handleRemoveDocument(uploadedDoc.id)}
                                      >
                                        <TrashIcon className="h-5 w-5 text-red-500" />
                                      </Button>
                                    )}
                                  </div>
                                  
                                  {uploadedDoc ? (
                                    <div className="flex items-center mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                        {uploadedDoc.file.name}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                                      <div className="space-y-1 text-center">
                                        <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                          <label
                                            htmlFor={`file-${doc.id}`}
                                            className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                                          >
                                            <span>Upload required file</span>
                                            <input
                                              id={`file-${doc.id}`}
                                              name={`file-${doc.id}`}
                                              type="file"
                                              className="sr-only"
                                              onChange={(e) => handleFileChange(doc.id, e.target.files ? e.target.files[0] : null)}
                                              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                                            />
                                          </label>
                                          <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          PDF, Word, Excel, PNG, JPEG up to 5MB
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Annual Mandatory Documents (January only) */}
                        {month === 'Jan' && (
                          <div>
                            <div className="flex items-center mb-4">
                              <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-lg mr-3">
                                <span className="text-orange-600 dark:text-orange-400 text-xl">🗓️</span>
                              </div>
                              <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                  Annual Upload
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Required only in January and be mandatory
                                </p>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              {ANNUAL_MANDATORY_DOCUMENTS.map((doc) => {
                                const uploadedDoc = documentFiles.find(d => d.documentType === doc.id);
                                
                                return (
                                  <div key={doc.id} className="border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 rounded-md p-4">
                                    <div className="flex justify-between items-center mb-2">
                                      <label htmlFor={`file-${doc.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {doc.name} <span className="text-red-500">*</span>
                                      </label>
                                      {uploadedDoc && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          type="button"
                                          onClick={() => handleRemoveDocument(uploadedDoc.id)}
                                        >
                                          <TrashIcon className="h-5 w-5 text-red-500" />
                                        </Button>
                                      )}
                                    </div>
                                    
                                    {uploadedDoc ? (
                                      <div className="flex items-center mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                          {uploadedDoc.file.name}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-orange-300 dark:border-orange-600 border-dashed rounded-md">
                                        <div className="space-y-1 text-center">
                                          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-orange-400" />
                                          <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                            <label
                                              htmlFor={`file-${doc.id}`}
                                              className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500"
                                            >
                                              <span>Upload annual document</span>
                                              <input
                                                id={`file-${doc.id}`}
                                                name={`file-${doc.id}`}
                                                type="file"
                                                className="sr-only"
                                                onChange={(e) => handleFileChange(doc.id, e.target.files ? e.target.files[0] : null)}
                                                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                                              />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                          </div>
                                          <p className="text-xs text-gray-500 dark:text-gray-400">
                                            PDF, Word, Excel, PNG, JPEG up to 5MB
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* December Mandatory Documents */}
                        {month === 'Dec' && (
                          <div>
                            <div className="flex items-center mb-4">
                              <div className="bg-red-100 dark:bg-red-900 p-2 rounded-lg mr-3">
                                <span className="text-red-600 dark:text-red-400 text-xl">📅</span>
                              </div>
                              <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                  December Mandatory Upload
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Required when December is selected (Between 15th - 25th January month)
                                </p>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              {DECEMBER_MANDATORY_DOCUMENTS.map((doc) => {
                                const uploadedDoc = documentFiles.find(d => d.documentType === doc.id);
                                
                                return (
                                  <div key={doc.id} className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-md p-4">
                                    <div className="flex justify-between items-center mb-2">
                                      <label htmlFor={`file-${doc.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {doc.name} <span className="text-red-500">*</span>
                                      </label>
                                      {uploadedDoc && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          type="button"
                                          onClick={() => handleRemoveDocument(uploadedDoc.id)}
                                        >
                                          <TrashIcon className="h-5 w-5 text-red-500" />
                                        </Button>
                                      )}
                                    </div>
                                    
                                    {uploadedDoc ? (
                                      <div className="flex items-center mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                                        <span className="text-sm text-green-700 dark:text-green-400">
                                          {uploadedDoc.file.name}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                                        <div className="space-y-1 text-center">
                                          <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                                          <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                            <label
                                              htmlFor={`file-${doc.id}`}
                                              className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                                            >
                                              <span>Upload a file</span>
                                              <input
                                                id={`file-${doc.id}`}
                                                type="file"
                                                className="sr-only"
                                                onChange={(e) => handleFileChange(doc.id, e.target.files ? e.target.files[0] : null)}
                                                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                                              />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                          </div>
                                          <p className="text-xs text-gray-500 dark:text-gray-400">
                                            PDF, Word, Excel, PNG, JPEG up to 5MB
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* One-Time Optional Documents */}
                        <div>
                          <div className="flex items-center mb-4">
                            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg mr-3">
                              <span className="text-gray-600 dark:text-gray-400 text-xl">📁</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                One-Time Optional Uploads
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Upload only once (any month) and marked as not mandatory
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            {ONE_TIME_OPTIONAL_DOCUMENTS.map((doc) => {
                              const uploadedDoc = documentFiles.find(d => d.documentType === doc.id);
                              
                              return (
                                <div key={doc.id} className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-md p-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <label htmlFor={`file-${doc.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                      {doc.name} <span className="text-gray-400">(Optional)</span>
                                    </label>
                                    {uploadedDoc && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        type="button"
                                        onClick={() => handleRemoveDocument(uploadedDoc.id)}
                                      >
                                        <TrashIcon className="h-5 w-5 text-red-500" />
                                      </Button>
                                    )}
                                  </div>
                                  
                                  {uploadedDoc ? (
                                    <div className="flex items-center mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                        {uploadedDoc.file.name}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                                      <div className="space-y-1 text-center">
                                        <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                          <label
                                            htmlFor={`file-${doc.id}`}
                                            className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                                          >
                                            <span>Upload optional file</span>
                                            <input
                                              id={`file-${doc.id}`}
                                              name={`file-${doc.id}`}
                                              type="file"
                                              className="sr-only"
                                              onChange={(e) => handleFileChange(doc.id, e.target.files ? e.target.files[0] : null)}
                                              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                                            />
                                          </label>
                                          <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          PDF, Word, Excel, PNG, JPEG up to 5MB
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
            
            {/* Submit Button */}
            <div className="flex justify-end mt-8">
              <Button
                type="submit"
                variant="primary"
                isLoading={submitting}
                disabled={submitting || (mode !== 'resubmit' && !checkMandatoryDocuments().allUploaded)}
                leftIcon={mode === 'resubmit' ? <DocumentArrowUpIcon className="h-5 w-5" /> : <DocumentArrowUpIcon className="h-5 w-5" />}
              >
                {mode === 'resubmit' ? 'Resubmit Document' : 'Submit Documents'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default DocumentSubmissionForm;