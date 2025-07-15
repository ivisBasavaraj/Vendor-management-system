import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import apiService from '../../utils/api';
import { FontAwesomeIcon } from '../../utils/icons';
import {
  faExclamationCircle,
  faCheckCircle,
  faCloudUploadAlt,
  faFile,
  faTrash,
  faEdit,
  faInfoCircle,
  faHistory
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import ScrollingDatePicker from '../../components/ui/ScrollingDatePicker';

// Monthly Mandatory document types
const MONTHLY_MANDATORY_DOCUMENT_TYPES = [
  'invoice',
  'form_t_muster_roll',
  'bank_statement',
  'ecr',
  'pf_combined_challan',
  'pf_trrn_details',
  'esi_contribution_history',
  'esi_challan',
  'professional_tax_returns'
];

// Annual Mandatory document type (January only)
const ANNUAL_MANDATORY_DOCUMENT_TYPES = [
  'labour_welfare_fund'
];

// One-Time Optional document types
const OPTIONAL_DOCUMENT_TYPES = [
  'vendor_agreement',
  'epf_code_letter',
  'epf_form_5a',
  'esic_registration',
  'pt_registration',
  'pt_enrollment',
  'contract_labour_license'
];

// All mandatory document types (combined)
const MANDATORY_DOCUMENT_TYPES = [...MONTHLY_MANDATORY_DOCUMENT_TYPES, ...ANNUAL_MANDATORY_DOCUMENT_TYPES];

// Document types array with frequency information
const DOCUMENT_TYPES = [
  // Monthly Mandatory Documents (Due Every Month)
  { id: 'invoice', name: 'Invoice', mandatory: true, frequency: 'Every Month' },
  { id: 'form_t_muster_roll', name: 'Form T Combined Muster Roll Cum Register of Wages (previous month)', mandatory: true, frequency: 'Every Month' },
  { id: 'bank_statement', name: 'Bank Statement (previous month)', mandatory: true, frequency: 'Every Month' },
  { id: 'ecr', name: 'Electronic Challan Cum Return (ECR) (previous month)', mandatory: true, frequency: 'Every Month' },
  { id: 'pf_combined_challan', name: 'Combined Challan of A/C NO. 01, 02, 10, 21 & 22 (EPFO) (previous month)', mandatory: true, frequency: 'Every Month' },
  { id: 'pf_trrn_details', name: 'Provident Fund TRRN Details (previous month)', mandatory: true, frequency: 'Every Month' },
  { id: 'esi_contribution_history', name: 'ESIC Contribution History Statement (previous month)', mandatory: true, frequency: 'Every Month' },
  { id: 'esi_challan', name: 'ESIC Challan (previous month)', mandatory: true, frequency: 'Every Month' },
  { id: 'professional_tax_returns', name: 'Professional Tax Returns – Form 5A (previous month)', mandatory: true, frequency: 'Every Month' },
  
  // Annual Document (Due in January Only)
  { id: 'labour_welfare_fund', name: 'Labour Welfare Fund Form-D (December data)', mandatory: true, frequency: 'Only in January' },
  
  // One-Time Documents (Not Mandatory)
  { id: 'vendor_agreement', name: 'Copy of Agreement (Vendors)', mandatory: false, frequency: 'One Time (Any month)' },
  { id: 'epf_code_letter', name: 'EPF Code Allotment Letter', mandatory: false, frequency: 'One Time (Any month)' },
  { id: 'epf_form_5a', name: 'EPF Form – 5A', mandatory: false, frequency: 'One Time (Any month)' },
  { id: 'esic_registration', name: 'ESIC Registration Certificate – Form C11', mandatory: false, frequency: 'One Time (Any month)' },
  { id: 'pt_registration', name: 'Professional Tax Registration Certificate – Form 3', mandatory: false, frequency: 'One Time (Any month)' },
  { id: 'pt_enrollment', name: 'Professional Tax Enrollment Certificate – Form 4', mandatory: false, frequency: 'One Time (Any month)' },
  { id: 'contract_labour_license', name: 'Contract Labour License (if applicable)', mandatory: false, frequency: 'One Time (Any month)' }
];

interface FileWithPreview extends File {
  preview?: string;
  id?: string;
  documentName?: string;
  documentType?: string;
  description?: string;
}

interface RejectionFeedback {
  documentId: string;
  reviewerName: string;
  reviewDate: string;
  notes: string;
}

// Add DocumentRequirements component
const DocumentRequirements: React.FC<{ files: FileWithPreview[] }> = ({ files }) => {
  const uploadedDocumentTypes = files.map(file => file.documentType);
  
  // Group documents by frequency
  const monthlyDocs = DOCUMENT_TYPES.filter(doc => 
    MONTHLY_MANDATORY_DOCUMENT_TYPES.includes(doc.id)
  );
  const annualDocs = DOCUMENT_TYPES.filter(doc => 
    ANNUAL_MANDATORY_DOCUMENT_TYPES.includes(doc.id)
  );
  const optionalDocs = DOCUMENT_TYPES.filter(doc => 
    OPTIONAL_DOCUMENT_TYPES.includes(doc.id)
  );
  
  return (
    <div className="mt-6 bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Mandatory Document Requirements ({uploadedDocumentTypes.filter(type => 
          MANDATORY_DOCUMENT_TYPES.includes(type || '')).length} of {
            // Show count based on current month
            new Date().getMonth() === 0 ? // January is 0 in JavaScript
              MONTHLY_MANDATORY_DOCUMENT_TYPES.length + ANNUAL_MANDATORY_DOCUMENT_TYPES.length :
              MONTHLY_MANDATORY_DOCUMENT_TYPES.length
          })
      </h3>
      
      {/* Monthly Documents Section */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Monthly Mandatory Documents</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {monthlyDocs.map((docType) => {
            const isUploaded = uploadedDocumentTypes.includes(docType.id);
            return (
              <div 
                key={docType.id}
                className={`flex items-center p-2 rounded ${
                  isUploaded ? 'bg-green-50 text-green-700' : 'bg-white text-gray-600'
                }`}
              >
                <FontAwesomeIcon 
                  icon={isUploaded ? faCheckCircle : faExclamationCircle} 
                  className={`mr-2 ${isUploaded ? 'text-green-500' : 'text-gray-400'}`}
                />
                <div className="flex flex-col">
                  <span className="text-sm">{docType.name}</span>
                  <span className="text-xs text-gray-500">{docType.frequency}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Annual Documents Section */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Annual Mandatory Documents</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {annualDocs.map((docType) => {
            const isUploaded = uploadedDocumentTypes.includes(docType.id);
            return (
              <div 
                key={docType.id}
                className={`flex items-center p-2 rounded ${
                  isUploaded ? 'bg-green-50 text-green-700' : 'bg-white text-gray-600'
                }`}
              >
                <FontAwesomeIcon 
                  icon={isUploaded ? faCheckCircle : faExclamationCircle} 
                  className={`mr-2 ${isUploaded ? 'text-green-500' : 'text-gray-400'}`}
                />
                <div className="flex flex-col">
                  <span className="text-sm">{docType.name}</span>
                  <span className="text-xs text-gray-500">{docType.frequency}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Optional Documents Section */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">One-Time Optional Documents</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {optionalDocs.map((docType) => {
            const isUploaded = uploadedDocumentTypes.includes(docType.id);
            return (
              <div 
                key={docType.id}
                className={`flex items-center p-2 rounded ${
                  isUploaded ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                <FontAwesomeIcon 
                  icon={isUploaded ? faCheckCircle : faInfoCircle} 
                  className={`mr-2 ${isUploaded ? 'text-green-500' : 'text-gray-400'}`}
                />
                <div className="flex flex-col">
                  <span className="text-sm">{docType.name}</span>
                  <span className="text-xs text-gray-500">{docType.frequency}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const UploadDocumentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: documentId } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [remarks, setRemarks] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(null);
  const [agreementPeriod, setAgreementPeriod] = useState<string>('');
  const [agreementEndDate, setAgreementEndDate] = useState<Date | null>(null);
  const [isAgreementExpiringSoon, setIsAgreementExpiringSoon] = useState<boolean>(false);
  const [isAgreementExpired, setIsAgreementExpired] = useState<boolean>(false);
  const [userDataLoaded, setUserDataLoaded] = useState<boolean>(false);
  const [consultant, setConsultant] = useState('');
  const [consultantOptions, setConsultantOptions] = useState<string[]>([]);
  const locationOfWork = 'Onsite';
  
  // Document availability state
  const [availableDocumentTypes, setAvailableDocumentTypes] = useState<string[]>([
    ...MONTHLY_MANDATORY_DOCUMENT_TYPES,
    ...ANNUAL_MANDATORY_DOCUMENT_TYPES,
    ...OPTIONAL_DOCUMENT_TYPES
  ]);
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1); // 1-12 for Jan-Dec
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  
  // UI state
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Reupload state
  const [isReupload, setIsReupload] = useState(false);
  const [rejectionFeedback, setRejectionFeedback] = useState<RejectionFeedback | null>(null);
  const [originalDocumentId, setOriginalDocumentId] = useState<string | null>(null);
  const [editingFileIndex, setEditingFileIndex] = useState<number | null>(null);
  
  // Check if this is a reupload based on URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reuploadParam = params.get('reupload');
    const originalId = params.get('originalId');
    
    if (reuploadParam === 'true' && originalId) {
      setIsReupload(true);
      setOriginalDocumentId(originalId);
      fetchRejectedDocumentDetails(originalId);
    }
  }, [location]);
  
  // Fetch rejected document details
  const fetchRejectedDocumentDetails = async (docId: string) => {
    try {
      setLoading(true);
      const response = await apiService.documents.getById(docId);
      
      if (response.data.success) {
        const document = response.data.data;
        
        // Pre-populate form with original document details
        setTitle(document.title);
        setRemarks(document.description || '');
        setDocumentType(document.documentType);
        if (document.expiryDate) {
          setExpiryDate(new Date(document.expiryDate));
        }
        if (document.invoiceNumber) {
          setInvoiceNumber(document.invoiceNumber);
        }
        if (document.invoiceDate) {
          setInvoiceDate(new Date(document.invoiceDate));
        }
        if (document.agreementPeriod) {
          // If the document has an agreement period, use it as is (assuming it's stored as string)
          setAgreementPeriod(typeof document.agreementPeriod === 'string' ? document.agreementPeriod : document.agreementPeriod.toString());
        }
        
        // Set rejection feedback
        if (document.reviewNotes && document.reviewer) {
          setRejectionFeedback({
            documentId: document._id,
            reviewerName: document.reviewer.name,
            reviewDate: new Date(document.reviewDate).toLocaleDateString(),
            notes: document.reviewNotes
          });
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to fetch document details'
      );
    } finally {
      setLoading(false);
    }
  };

  // Determine available document types based on month and rejected documents
  const determineAvailableDocumentTypes = async () => {
    try {
      // Get rejected documents for the current month and year
      const response = await apiService.documents.getByStatus('rejected', {
        year: currentYear,
        month: currentMonth
      });
      
      // Start with monthly mandatory document types
      let availableTypes = [...MONTHLY_MANDATORY_DOCUMENT_TYPES];
      
      // If it's January, add the annual document
      if (currentMonth === 1) {
        availableTypes.push(...ANNUAL_MANDATORY_DOCUMENT_TYPES);
      }
      
      // Always add optional one-time documents
      availableTypes.push(...OPTIONAL_DOCUMENT_TYPES);
      
      // Add rejected document types
      if (response.data.success) {
        let rejectedDocTypes: string[] = [];
        
        if (Array.isArray(response.data.data) && response.data.data.length > 0) {
          // Process document submissions
          if (response.data.data[0].documents) {
            // This is a document submission response
            rejectedDocTypes = response.data.data.flatMap((submission: any) => {
              return submission.documents
                .filter((doc: any) => doc.status === 'rejected')
                .map((doc: any) => doc.type || doc.documentType);
            });
          } else {
            // This is a legacy document response
            rejectedDocTypes = response.data.data
              .filter((doc: any) => doc.status === 'rejected')
              .map((doc: any) => doc.documentType);
          }
        }
        
        // Add rejected document types to available types if not already included
        rejectedDocTypes.forEach(type => {
          if (!availableTypes.includes(type)) {
            availableTypes.push(type);
          }
        });
      }
      
      // Set available document types
      setAvailableDocumentTypes(availableTypes);
      console.log('Available document types:', availableTypes);
    } catch (error) {
      console.error('Error determining available document types:', error);
      // Fallback to all document types (monthly, annual, and optional)
      const allTypes = [
        ...MONTHLY_MANDATORY_DOCUMENT_TYPES,
        ...ANNUAL_MANDATORY_DOCUMENT_TYPES,
        ...OPTIONAL_DOCUMENT_TYPES
      ];
      setAvailableDocumentTypes(allTypes);
      console.log('Fallback available document types:', allTypes);
    }
  };

  // Debug document types
  useEffect(() => {
    console.log('Document Types Configuration:');
    console.log('Monthly Mandatory:', MONTHLY_MANDATORY_DOCUMENT_TYPES);
    console.log('Annual Mandatory:', ANNUAL_MANDATORY_DOCUMENT_TYPES);
    console.log('Optional:', OPTIONAL_DOCUMENT_TYPES);
    console.log('All Document Types:', DOCUMENT_TYPES.map(dt => dt.id));
    console.log('Current Month:', currentMonth);
  }, []);

  // Function to check if agreement is expiring within 30 days
  const checkAgreementExpiry = (endDate: Date | null): boolean => {
    if (!endDate) return false;
    
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    return endDate <= thirtyDaysFromNow && endDate >= today;
  };

  // Function to check if agreement has already expired
  const checkAgreementExpired = (endDate: Date | null): boolean => {
    if (!endDate) return false;
    
    const today = new Date();
    return endDate < today;
  };

  // Fetch consultant options and assigned consultant
  useEffect(() => {
    const fetchConsultantData = async () => {
      try {
        console.log('Fetching user data...');
        // Get current user info with assigned consultant
        const userResponse = await apiService.auth.getCurrentUser();
        
        console.log('Full API response:', userResponse);
        
        if (userResponse.data.success && userResponse.data.data) {
          const userData = userResponse.data.data;
          console.log('User data received:', userData);
          console.log('User role:', userData.role);
          console.log('User agreement period:', userData.agreementPeriod);
          console.log('Agreement period type:', typeof userData.agreementPeriod);
          
          // Set default agreement period from user data if available and user is a vendor
          if (userData.role === 'vendor' && userData.agreementPeriod) {
            console.log('Setting agreement period from user data:', userData.agreementPeriod);
            setAgreementPeriod(userData.agreementPeriod);
            
            // Try to fetch more structured agreement period from DocumentSubmission model
            try {
              const submissionResponse = await apiService.documents.getVendorSubmissions({ 
                vendorId: userData._id,
                limit: 1 // Just get the latest submission to check agreement period
              });
              
              if (submissionResponse.data.success && submissionResponse.data.data.length > 0) {
                const latestSubmission = submissionResponse.data.data[0];
                console.log('Latest submission data:', latestSubmission);
                
                if (latestSubmission.agreementPeriod && latestSubmission.agreementPeriod.endDate) {
                  const endDate = new Date(latestSubmission.agreementPeriod.endDate);
                  console.log('Found structured agreement end date from submission:', endDate);
                  setAgreementEndDate(endDate);
                  setIsAgreementExpiringSoon(checkAgreementExpiry(endDate));
                  setIsAgreementExpired(checkAgreementExpired(endDate));
                  return; // Use structured data, don't parse string
                }
              }
            } catch (submissionError) {
              console.log('Could not fetch structured agreement period from submissions:', submissionError);
              // Fall back to parsing the string from user data
            }
            
            // If no structured data found, parse the agreement period string
            console.log('Parsing agreement period string:', userData.agreementPeriod);
            const parsedEndDate = parseAgreementPeriod(userData.agreementPeriod);
            if (parsedEndDate) {
              console.log('Parsed agreement end date from string:', parsedEndDate);
              setAgreementEndDate(parsedEndDate);
              setIsAgreementExpiringSoon(checkAgreementExpiry(parsedEndDate));
              setIsAgreementExpired(checkAgreementExpired(parsedEndDate));
            }
          } else {
            console.log('Agreement period not set. Role:', userData.role, 'Agreement period:', userData.agreementPeriod);
          }
          
          // Check if there's an assigned consultant
          if (userData.assignedConsultant) {
            // Extract the consultant ID - handle both string and object cases
            const assignedConsultant = userData.assignedConsultant;
            const consultantId = typeof assignedConsultant === 'string' 
              ? assignedConsultant 
              : assignedConsultant._id || assignedConsultant.id;
            
            if (consultantId) {
              // Fetch the consultant details
              const consultantResponse = await apiService.users.getById(consultantId);
            
              if (consultantResponse.data.success && consultantResponse.data.data) {
                const consultantData = consultantResponse.data.data;
                console.log('Assigned consultant found:', consultantData);
                
                // Set the consultant email
                setConsultant(consultantData.email);
                
                // Add to options
                setConsultantOptions([consultantData.email]);
              }
            }
          } else {
            console.log('No assigned consultant found for this vendor');
            // Fallback to default consultant options
            setConsultantOptions(['consultant1@example.com', 'consultant2@example.com']);
          }
          
          setUserDataLoaded(true);
        }
      } catch (error) {
        console.error('Error fetching consultant data:', error);
        // Fallback to default consultant options
        setConsultantOptions(['consultant1@example.com', 'consultant2@example.com']);
        setUserDataLoaded(true);
      }
    };
    
    if (!userDataLoaded) {
      fetchConsultantData();
    }
    determineAvailableDocumentTypes();
  }, [currentMonth, currentYear, userDataLoaded]);

  // Function to parse agreement period and extract end date
  const parseAgreementPeriod = (agreementPeriodStr: string): Date | null => {
    if (!agreementPeriodStr) return null;
    
    // Try to extract date patterns from the agreement period string
    // Common formats: "2024-2025", "April 2024 - March 2025", "Annual Contract (2024-2025)", etc.
    
    // Pattern 1: Look for year ranges like "2024-2025" or "(2024-2025)"
    const yearRangeMatch = agreementPeriodStr.match(/(\d{4})-(\d{4})/);
    if (yearRangeMatch) {
      const endYear = parseInt(yearRangeMatch[2]);
      // Assume agreement ends on March 31st of the end year (common for annual contracts)
      return new Date(endYear, 2, 31); // March is month 2 (0-indexed)
    }
    
    // Pattern 2: Look for specific end dates like "March 2025", "Mar 2025", "April 2024 - March 2025"
    const monthYearMatch = agreementPeriodStr.match(/(?:to|until|-)\s*(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i);
    if (monthYearMatch) {
      const monthName = monthYearMatch[1].toLowerCase();
      const endYear = parseInt(monthYearMatch[2]);
      
      const monthMap: { [key: string]: number } = {
        'january': 0, 'jan': 0,
        'february': 1, 'feb': 1,
        'march': 2, 'mar': 2,
        'april': 3, 'apr': 3,
        'may': 4,
        'june': 5, 'jun': 5,
        'july': 6, 'jul': 6,
        'august': 7, 'aug': 7,
        'september': 8, 'sep': 8,
        'october': 9, 'oct': 9,
        'november': 10, 'nov': 10,
        'december': 11, 'dec': 11
      };
      
      const monthIndex = monthMap[monthName];
      if (monthIndex !== undefined) {
        // Get the last day of the month
        const lastDay = new Date(endYear, monthIndex + 1, 0).getDate();
        return new Date(endYear, monthIndex, lastDay);
      }
    }
    
    // Pattern 2b: Look for just "March 2025", "Mar 2025" at the end
    const endMonthMatch = agreementPeriodStr.match(/(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/i);
    if (endMonthMatch) {
      const monthName = endMonthMatch[1].toLowerCase();
      const endYear = parseInt(endMonthMatch[2]);
      
      const monthMap: { [key: string]: number } = {
        'january': 0, 'jan': 0,
        'february': 1, 'feb': 1,
        'march': 2, 'mar': 2,
        'april': 3, 'apr': 3,
        'may': 4,
        'june': 5, 'jun': 5,
        'july': 6, 'jul': 6,
        'august': 7, 'aug': 7,
        'september': 8, 'sep': 8,
        'october': 9, 'oct': 9,
        'november': 10, 'nov': 10,
        'december': 11, 'dec': 11
      };
      
      const monthIndex = monthMap[monthName];
      if (monthIndex !== undefined) {
        // Get the last day of the month
        const lastDay = new Date(endYear, monthIndex + 1, 0).getDate();
        return new Date(endYear, monthIndex, lastDay);
      }
    }
    
    // Pattern 3: Look for date formats like "31/03/2025", "31-03-2025", "2025-03-31"
    const dateFormats = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, // DD/MM/YYYY or DD-MM-YYYY
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/, // YYYY/MM/DD or YYYY-MM-DD
    ];
    
    for (const format of dateFormats) {
      const match = agreementPeriodStr.match(format);
      if (match) {
        if (format === dateFormats[0]) {
          // DD/MM/YYYY format
          const day = parseInt(match[1]);
          const month = parseInt(match[2]) - 1; // 0-indexed
          const year = parseInt(match[3]);
          return new Date(year, month, day);
        } else {
          // YYYY/MM/DD format
          const year = parseInt(match[1]);
          const month = parseInt(match[2]) - 1; // 0-indexed
          const day = parseInt(match[3]);
          return new Date(year, month, day);
        }
      }
    }
    
    // If no pattern matches, return null
    return null;
  };

  // Debug agreement period changes and check expiry
  useEffect(() => {
    console.log('Agreement period state changed:', agreementPeriod);
    
    if (agreementPeriod) {
      const endDate = parseAgreementPeriod(agreementPeriod);
      setAgreementEndDate(endDate);
      
      const isExpiringSoon = checkAgreementExpiry(endDate);
      const isExpired = checkAgreementExpired(endDate);
      setIsAgreementExpiringSoon(isExpiringSoon);
      setIsAgreementExpired(isExpired);
      
      console.log('Agreement period analysis:', {
        agreementPeriod,
        parsedEndDate: endDate,
        isExpiringSoon,
        daysUntilExpiry: endDate ? Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
      });
    }
  }, [agreementPeriod]);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Process the dropped or selected files
  const processFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;

    const fileArray: FileWithPreview[] = Array.from(newFiles).map(file => {
      // Create a unique id for the file
      const fileWithPreview = file as FileWithPreview;
      fileWithPreview.id = Math.random().toString(36).substring(2, 15);
      
      // Set default document name based on file name
      fileWithPreview.documentName = file.name.split('.')[0];
      
      // Set default document type
      fileWithPreview.documentType = '';
      
      // Set default description
      fileWithPreview.description = '';
      
      // Create a preview URL for images
      if (file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }
      
      return fileWithPreview;
    });

    setFiles(prev => [...prev, ...fileArray]);
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    // Reset the input value so the same file can be selected again if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  // Remove a file from the list
  const removeFile = (id: string) => {
    setFiles(prev => {
      const updatedFiles = prev.filter(file => file.id !== id);
      return updatedFiles;
    });
  };

  // Handle document name change
  const handleDocumentNameChange = (id: string, name: string) => {
    setFiles(prev => 
      prev.map(file => 
        file.id === id ? { ...file, documentName: name } : file
      )
    );
  };
  
  // Handle document type change
  const handleFileDocumentTypeChange = (id: string, type: string) => {
    setFiles(prev => 
      prev.map(file => 
        file.id === id ? { ...file, documentType: type } : file
      )
    );
  };
  
  // Handle document description change
  const handleFileDescriptionChange = (id: string, desc: string) => {
    setFiles(prev => 
      prev.map(file => 
        file.id === id ? { ...file, description: desc } : file
      )
    );
  };
  
  // Toggle file editing
  const toggleFileEditing = (index: number | null) => {
    setEditingFileIndex(index);
  };
  
  // Handle adding a new document
  const handleAddDocument = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Add validation function
  const validateDocuments = () => {
    const uploadedDocumentTypes = files.map(file => file.documentType);
    const missingMandatoryDocs = MANDATORY_DOCUMENT_TYPES.filter(
      type => !uploadedDocumentTypes.includes(type)
    );

    if (missingMandatoryDocs.length > 0) {
      // Group missing documents by frequency
      const missingMonthlyDocs = missingMandatoryDocs.filter(type => 
        DOCUMENT_TYPES.find(doc => doc.id === type)?.frequency === 'Every Month'
      );
      
      const missingAnnualDocs = missingMandatoryDocs.filter(type => 
        DOCUMENT_TYPES.find(doc => doc.id === type)?.frequency === 'Only in January'
      );
      
      // Create error message with frequency grouping
      let errorMessage = 'Missing mandatory documents:';
      
      if (missingMonthlyDocs.length > 0) {
        const monthlyDocNames = missingMonthlyDocs
          .map(type => DOCUMENT_TYPES.find(doc => doc.id === type)?.name)
          .filter(Boolean)
          .join(', ');
        
        errorMessage += `\n• Monthly Documents: ${monthlyDocNames}`;
      }
      
      if (missingAnnualDocs.length > 0) {
        const annualDocNames = missingAnnualDocs
          .map(type => DOCUMENT_TYPES.find(doc => doc.id === type)?.name)
          .filter(Boolean)
          .join(', ');
        
        errorMessage += `\n• Annual Documents: ${annualDocNames}`;
      }
      
      setError(errorMessage);
      return false;
    }

    return true;
  };

  // Submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!title.trim()) {
      setError('Document title is required');
      return;
    }
    
    if (!documentType) {
      setError('Please select a document type');
      return;
    }
    
    if (files.length === 0) {
      setError('Please upload at least one file');
      return;
    }
    
    if (!invoiceNumber.trim()) {
      setError('Invoice Number is required');
      return;
    }
    
    if (!invoiceDate) {
      setError('Invoice Date is required');
      return;
    }

    if (!agreementPeriod) {
      setError('Agreement Period is not loaded. Please refresh the page or contact administrator.');
      return;
    }

    // Check if agreement has expired
    if (isAgreementExpired) {
      setError('Cannot upload documents: Your agreement has expired. Please contact your administrator to renew your agreement.');
      return;
    }

    if (!consultant) {
      setError('Consultant selection is required');
      return;
    }

    // Validate mandatory documents
    if (!validateDocuments()) {
      return;
    }

    // Validate that all files have document names and types
    const missingMetadata = files.filter(
      file => !file.documentName?.trim() || !file.documentType?.trim()
    );

    if (missingMetadata.length > 0) {
      setError('Please provide both name and type for all uploaded documents');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', remarks); // Still using 'description' field for API compatibility
      formData.append('documentType', documentType);
      
      if (expiryDate) {
        formData.append('expiryDate', expiryDate.toISOString());
      }
      
      // If this is a reupload, include the original document ID
      if (isReupload && originalDocumentId) {
        formData.append('originalDocumentId', originalDocumentId);
        formData.append('isReupload', 'true');
      }
      
      // Append each file to the form data with its metadata
      files.forEach((file, index) => {
        // Log file information to debug
        console.log(`Adding file to FormData:`, {
          name: file.name,
          type: file.type,
          size: file.size,
          documentName: file.documentName || '',
          documentType: file.documentType || ''
        });
        
        // Make sure we're using the correct field name that matches the server's expectation
        formData.append('files', file, file.name);
        formData.append(`fileMetadata[${index}][documentName]`, file.documentName || '');
        formData.append(`fileMetadata[${index}][documentType]`, file.documentType || '');
        formData.append(`fileMetadata[${index}][description]`, file.description || '');
      });

      formData.append('invoiceNumber', invoiceNumber);
      
      if (invoiceDate) {
        formData.append('invoiceDate', invoiceDate.toISOString());
      }
      
      if (agreementPeriod) {
        formData.append('agreementPeriod', agreementPeriod);
      }
      
      formData.append('consultant', consultant);
      formData.append('workLocation', locationOfWork);
      
      // Add year and month for document period
      formData.append('year', currentYear.toString());
      formData.append('month', currentMonth.toString());

      // Use the main document upload endpoint
      const response = await apiService.documents.upload(formData);

      if (response.data.success) {
        setSuccess(isReupload ? 'Documents reuploaded successfully!' : 'Documents uploaded successfully!');
        
        // Reset form after successful upload
        setTitle('');
        setRemarks('');
        setDocumentType('');
        setExpiryDate(null);
        setInvoiceNumber('');
        setInvoiceDate(null);
        setAgreementPeriod('');
        setFiles([]);
        setIsReupload(false);
        setOriginalDocumentId(null);
        setRejectionFeedback(null);
        
        // Redirect to documents list after 2 seconds
        setTimeout(() => {
          navigate('/documents');
        }, 2000);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to upload document. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Get the final document type label
  const getDocumentTypeLabel = () => {
    const selectedType = DOCUMENT_TYPES.find(type => type.id === documentType);
    return selectedType ? selectedType.name : 'Unknown';
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isReupload ? 'Reupload Rejected Documents' : 'Upload New Documents'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isReupload 
                ? 'Reupload corrected documents for verification by the consultant team.' 
                : 'Upload documents for approval by the consultant team.'}
            </p>
          </div>
          
          {!isReupload && (
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <div>
                <label htmlFor="uploadYear" className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <select
                  id="uploadYear"
                  value={currentYear}
                  onChange={(e) => {
                    setCurrentYear(parseInt(e.target.value));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(yearOption => (
                    <option key={yearOption} value={yearOption}>{yearOption}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="uploadMonth" className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <select
                  id="uploadMonth"
                  value={currentMonth}
                  onChange={(e) => {
                    setCurrentMonth(parseInt(e.target.value));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>January</option>
                  <option value={2}>February</option>
                  <option value={3}>March</option>
                  <option value={4}>April</option>
                  <option value={5}>May</option>
                  <option value={6}>June</option>
                  <option value={7}>July</option>
                  <option value={8}>August</option>
                  <option value={9}>September</option>
                  <option value={10}>October</option>
                  <option value={11}>November</option>
                  <option value={12}>December</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        {/* Rejection Feedback (if reupload) */}
        {isReupload && rejectionFeedback && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4">
            <div className="flex items-start">
              <FontAwesomeIcon icon={faInfoCircle} className="text-yellow-500 mr-2 mt-1" />
              <div>
                <h3 className="font-medium text-yellow-800">Feedback from Reviewer</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  <strong>Reviewer:</strong> {rejectionFeedback.reviewerName}
                </p>
                <p className="text-sm text-yellow-700">
                  <strong>Date:</strong> {rejectionFeedback.reviewDate}
                </p>
                <p className="text-sm text-yellow-700 mt-2">
                  <strong>Notes:</strong> {rejectionFeedback.notes}
                </p>
              </div>
            </div>
          </div>
        )}

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

        {/* Agreement Expired Error */}
        {isAgreementExpired && agreementEndDate && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex items-start">
              <FontAwesomeIcon icon={faExclamationCircle} className="text-red-500 mr-2 mt-1" />
              <div>
                <h3 className="font-medium text-red-800">Agreement Expired</h3>
                <p className="text-sm text-red-700 mt-1">
                  Your agreement period expired on <strong>{agreementEndDate.toLocaleDateString()}</strong> 
                  ({Math.abs(Math.ceil((agreementEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days ago).
                  You cannot upload documents until your agreement is renewed. Please contact your administrator immediately.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Agreement Expiry Warning */}
        {!isAgreementExpired && isAgreementExpiringSoon && agreementEndDate && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4">
            <div className="flex items-start">
              <FontAwesomeIcon icon={faExclamationCircle} className="text-yellow-500 mr-2 mt-1" />
              <div>
                <h3 className="font-medium text-yellow-800">Agreement Expiring Soon</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Your agreement period expires on <strong>{agreementEndDate.toLocaleDateString()}</strong> 
                  ({Math.ceil((agreementEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining).
                  Please contact your administrator to renew your agreement before uploading documents.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Document Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Document Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter document title"
                  disabled={loading}
                />
              </div>

              {/* Document Type */}
              <div>
                <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="documentType"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="">Select Document Type</option>
                  {(() => {
                    // Debug the filtering
                    const filteredTypes = DOCUMENT_TYPES.filter(type => 
                      // Show all types for reupload
                      isReupload || 
                      // Show available types based on month and rejected documents
                      availableDocumentTypes.includes(type.id)
                    );
                    console.log('Filtered document types for dropdown:', filteredTypes.map(t => t.id));
                    return filteredTypes;
                  })().map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>



              {/* Expiry Date */}
              <div>
                <ScrollingDatePicker
                  id="expiryDate"
                  name="expiryDate"
                  label="Expiry Date (if applicable)"
                  value={expiryDate}
                  onChange={setExpiryDate}
                  minYear={new Date().getFullYear()}
                  maxYear={new Date().getFullYear() + 20}
                  disabled={loading}
                  placeholder="Select expiry date"
                />
              </div>

              {/* Invoice Number */}
              <div>
                <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter invoice number"
                  disabled={loading}
                />
              </div>
              
              {/* Invoice Date */}
              <div>
                <ScrollingDatePicker
                  id="invoiceDate"
                  name="invoiceDate"
                  label="Invoice Date"
                  value={invoiceDate}
                  onChange={setInvoiceDate}
                  minYear={new Date().getFullYear() - 5}
                  maxYear={new Date().getFullYear() + 5}
                  disabled={loading}
                  placeholder="Select invoice date"
                  required={true}
                />
              </div>

              {/* Agreement Period */}
              <div>
                <label htmlFor="agreementPeriod" className={`block text-sm font-medium mb-2 ${
                  isAgreementExpired 
                    ? 'text-red-800' 
                    : isAgreementExpiringSoon 
                      ? 'text-red-700' 
                      : 'text-gray-700 dark:text-gray-300'
                }`}>
                  Agreement Period
                  {isAgreementExpired && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-200 text-red-900">
                      Expired
                    </span>
                  )}
                  {!isAgreementExpired && isAgreementExpiringSoon && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Expiring Soon
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  id="agreementPeriod"
                  name="agreementPeriod"
                  value={agreementPeriod}
                  readOnly
                  placeholder="Agreement period will be loaded from your profile"
                  className={`w-full px-4 py-3 border rounded-lg bg-gray-50 dark:bg-gray-600 dark:text-gray-300 cursor-not-allowed ${
                    isAgreementExpired 
                      ? 'border-red-600 bg-red-100 dark:bg-red-900/30 dark:border-red-500' 
                      : isAgreementExpiringSoon 
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-400' 
                        : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                <div className="mt-1">
                  <p className={`text-xs ${
                    isAgreementExpired 
                      ? 'text-red-700 dark:text-red-400' 
                      : isAgreementExpiringSoon 
                        ? 'text-yellow-600 dark:text-yellow-400' 
                        : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    This field is set by the administrator and cannot be modified.
                  </p>
                  {isAgreementExpired && agreementEndDate && (
                    <p className="text-xs text-red-700 dark:text-red-400 mt-1 font-medium">
                      ❌ Agreement expired on {agreementEndDate.toLocaleDateString()} 
                      ({Math.abs(Math.ceil((agreementEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days ago)
                    </p>
                  )}
                  {!isAgreementExpired && isAgreementExpiringSoon && agreementEndDate && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-medium">
                      ⚠️ Agreement expires on {agreementEndDate.toLocaleDateString()} 
                      ({Math.ceil((agreementEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining)
                    </p>
                  )}
                </div>
              </div>

              {/* Consultant Email/Name */}
              <div>
                <label htmlFor="consultant" className="block text-sm font-medium text-gray-700 mb-1">
                  Consultant Email/Name <span className="text-red-500">*</span>
                </label>
                <select
                  id="consultant"
                  value={consultant}
                  onChange={e => setConsultant(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="">Select Consultant</option>
                  {consultantOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Location of Work */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location of Work
                </label>
                <input
                  type="text"
                  value={locationOfWork}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
            </div>

            {/* Remarks */}
            <div className="mt-6">
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter document remarks"
                disabled={loading}
              ></textarea>
            </div>

            {/* File Upload Area */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Files <span className="text-red-500">*</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 ${
                  dragging 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-400'
                }`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <FontAwesomeIcon icon={faCloudUploadAlt} className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Drag and drop files here, or{" "}
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-500 font-medium"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supported file types: PDF, DOC, DOCX, JPG, PNG (Max 10MB per file)
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  multiple
                  disabled={loading}
                />
              </div>
            </div>

            {/* File Preview */}
            {files.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Please provide a name and type for each document. This will help consultants identify and review your documents more efficiently.
                </p>
                <div className="space-y-4">
                  {files.map((file, index) => (
                    <div 
                      key={file.id} 
                      className="border rounded-lg p-4 bg-gray-50 relative"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          {file.preview ? (
                            <img src={file.preview} alt="Preview" className="h-10 w-10 object-cover rounded" />
                          ) : (
                            <FontAwesomeIcon icon={faFile} className="h-10 w-10 text-gray-400" />
                          )}
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-800 truncate max-w-xs">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => toggleFileEditing(editingFileIndex === index ? null : index)}
                            className="text-blue-500 hover:text-blue-700"
                            disabled={loading}
                          >
                            <FontAwesomeIcon icon={editingFileIndex === index ? faCheckCircle : faEdit} className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFile(file.id!)}
                            className="text-gray-400 hover:text-red-500"
                            disabled={loading}
                          >
                            <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Document Metadata Form */}
                      {(editingFileIndex === index || editingFileIndex === null) && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label htmlFor={`docName-${file.id}`} className="block text-xs font-medium text-gray-700 mb-1">
                              Document Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              id={`docName-${file.id}`}
                              value={file.documentName || ''}
                              onChange={(e) => handleDocumentNameChange(file.id!, e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Enter document name"
                              disabled={loading}
                            />
                          </div>
                          <div>
                            <label htmlFor={`docType-${file.id}`} className="block text-xs font-medium text-gray-700 mb-1">
                              Document Type
                            </label>
                            <select
                              id={`docType-${file.id}`}
                              value={file.documentType || ''}
                              onChange={(e) => handleFileDocumentTypeChange(file.id!, e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              disabled={loading}
                            >
                              <option value="">Select Document Type</option>
                              {DOCUMENT_TYPES.filter(type => 
                                // Show all types for reupload
                                isReupload || 
                                // Show available types based on month and rejected documents
                                availableDocumentTypes.includes(type.id)
                              ).map((type) => (
                                <option key={`${file.id}-${type.id}`} value={type.id}>
                                  {type.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label htmlFor={`docDesc-${file.id}`} className="block text-xs font-medium text-gray-700 mb-1">
                              Remarks
                            </label>
                            <textarea
                              id={`docDesc-${file.id}`}
                              value={file.description || ''}
                              onChange={(e) => handleFileDescriptionChange(file.id!, e.target.value)}
                              rows={2}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Brief remarks about this document"
                              disabled={loading}
                            ></textarea>
                          </div>
                        </div>
                      )}
                      
                      {/* Add Document Button */}
                      <button
                        type="button"
                        onClick={handleAddDocument}
                        className="absolute bottom-3 right-3 inline-flex items-center justify-center p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm"
                        title="Add another document"
                        disabled={loading}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add DocumentRequirements component before the Submit Button */}
            <DocumentRequirements files={files} />

            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/documents')}
                className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isAgreementExpired 
                    ? "bg-gray-400 cursor-not-allowed opacity-70" 
                    : loading 
                      ? "bg-blue-600 opacity-70 cursor-not-allowed" 
                      : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                }`}
                disabled={loading || isAgreementExpired}
                title={isAgreementExpired ? "Cannot upload: Agreement has expired" : ""}
              >
                {isAgreementExpired 
                  ? "Agreement Expired" 
                  : loading 
                    ? "Uploading..." 
                    : "Upload Document"
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default UploadDocumentPage;