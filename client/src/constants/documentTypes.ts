// Document type configurations for the upload system

// 🔁 Monthly Mandatory Uploads - Required every month and must be marked as mandatory
export const MONTHLY_MANDATORY_DOCUMENTS = [
  { 
    id: 'INVOICE', 
    name: 'Invoice',
    displayName: 'Invoice',
    description: 'Monthly invoice document',
    category: 'monthly_mandatory' as const
  },
  { 
    id: 'FORM_T_MUSTER_ROLL', 
    name: 'Form T Combined Muster Roll Cum Register of Wages (previous month)',
    displayName: 'Form T Muster Roll',
    description: 'Combined Muster Roll Cum Register of Wages for previous month',
    category: 'monthly_mandatory' as const
  },
  { 
    id: 'BANK_STATEMENT', 
    name: 'Bank Statement (previous month)',
    displayName: 'Bank Statement',
    description: 'Bank statement for previous month',
    category: 'monthly_mandatory' as const
  },
  { 
    id: 'ECR', 
    name: 'Electronic Challan Cum Return (ECR) (previous month)',
    displayName: 'ECR',
    description: 'Electronic Challan Cum Return for previous month',
    category: 'monthly_mandatory' as const
  },
  { 
    id: 'PF_COMBINED_CHALLAN', 
    name: 'Combined Challan of A/C NO. 01, 02, 10, 21 & 22 (EPFO) (previous month)',
    displayName: 'PF Combined Challan',
    description: 'EPFO Combined Challan for previous month',
    category: 'monthly_mandatory' as const
  },
  { 
    id: 'PF_TRRN_DETAILS', 
    name: 'Provident Fund TRRN Details (previous month)',
    displayName: 'PF TRRN Details',
    description: 'Provident Fund TRRN Details for previous month',
    category: 'monthly_mandatory' as const
  },
  { 
    id: 'ESI_CONTRIBUTION_HISTORY', 
    name: 'ESIC Contribution History Statement (previous month)',
    displayName: 'ESIC Contribution History',
    description: 'ESIC Contribution History Statement for previous month',
    category: 'monthly_mandatory' as const
  },
  { 
    id: 'ESI_CHALLAN', 
    name: 'ESIC Challan (previous month)',
    displayName: 'ESIC Challan',
    description: 'ESIC Challan for previous month',
    category: 'monthly_mandatory' as const
  },
  { 
    id: 'PROFESSIONAL_TAX_RETURNS', 
    name: 'Professional Tax Returns – Form 5A (previous month)',
    displayName: 'Professional Tax Returns',
    description: 'Professional Tax Returns Form 5A for previous month',
    category: 'monthly_mandatory' as const
  }
] as const;

// 🗓️ Annual Upload - Required only in January and be mandatory
export const ANNUAL_MANDATORY_DOCUMENTS = [
  { 
    id: 'LABOUR_WELFARE_FUND', 
    name: 'Labour Welfare Fund Form-D (December data)',
    displayName: 'Labour Welfare Fund',
    description: 'Labour Welfare Fund Form-D with December data',
    category: 'annual_mandatory' as const
  }
] as const;

// 📁 One-Time Optional Uploads - Upload only once (any month) and marked as not mandatory
export const ONE_TIME_OPTIONAL_DOCUMENTS = [
  { 
    id: 'VENDOR_AGREEMENT', 
    name: 'Copy of Agreement (Vendors)',
    displayName: 'Vendor Agreement',
    description: 'Copy of Agreement document for vendors',
    category: 'one_time_optional' as const
  },
  { 
    id: 'EPF_CODE_LETTER', 
    name: 'EPF Code Allotment Letter',
    displayName: 'EPF Code Letter',
    description: 'EPF Code Allotment Letter',
    category: 'one_time_optional' as const
  },
  { 
    id: 'EPF_FORM_5A', 
    name: 'EPF Form – 5A',
    displayName: 'EPF Form 5A',
    description: 'EPF Form 5A document',
    category: 'one_time_optional' as const
  },
  { 
    id: 'ESIC_REGISTRATION', 
    name: 'ESIC Registration Certificate – Form C11',
    displayName: 'ESIC Registration',
    description: 'ESIC Registration Certificate Form C11',
    category: 'one_time_optional' as const
  },
  { 
    id: 'PT_REGISTRATION', 
    name: 'Professional Tax Registration Certificate – Form 3',
    displayName: 'PT Registration',
    description: 'Professional Tax Registration Certificate Form 3',
    category: 'one_time_optional' as const
  },
  { 
    id: 'PT_ENROLLMENT', 
    name: 'Professional Tax Enrollment Certificate – Form 4',
    displayName: 'PT Enrollment',
    description: 'Professional Tax Enrollment Certificate Form 4',
    category: 'one_time_optional' as const
  },
  { 
    id: 'CONTRACT_LABOUR_LICENSE', 
    name: 'Contract Labour License (if applicable)',
    displayName: 'Labour License',
    description: 'Contract Labour License document (if applicable)',
    category: 'one_time_optional' as const
  }
] as const;

// Document type interface
export interface DocumentType {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly description: string;
  readonly category: 'monthly_mandatory' | 'annual_mandatory' | 'one_time_optional';
}

// Type for the document type arrays
type DocumentTypeArray = readonly DocumentType[];

// All document types combined
export const ALL_DOCUMENT_TYPES: DocumentTypeArray = [
  ...MONTHLY_MANDATORY_DOCUMENTS,
  ...ANNUAL_MANDATORY_DOCUMENTS,
  ...ONE_TIME_OPTIONAL_DOCUMENTS
] as const;

// Legacy aliases for backward compatibility
export const MANDATORY_DOCUMENTS: DocumentTypeArray = [...MONTHLY_MANDATORY_DOCUMENTS, ...ANNUAL_MANDATORY_DOCUMENTS] as const;
export const OPTIONAL_DOCUMENTS: DocumentTypeArray = ONE_TIME_OPTIONAL_DOCUMENTS;

// Utility functions

/**
 * Get available document types based on selected month
 */
export const getAvailableDocumentTypes = (selectedMonth: string) => {
  const monthlyDocs = MONTHLY_MANDATORY_DOCUMENTS as DocumentTypeArray;
  const annualDocs = (selectedMonth === 'Jan' ? ANNUAL_MANDATORY_DOCUMENTS : []) as DocumentTypeArray;
  const optionalDocs = ONE_TIME_OPTIONAL_DOCUMENTS as DocumentTypeArray;
  
  return {
    mandatory: [...monthlyDocs, ...annualDocs] as DocumentTypeArray,
    monthly_mandatory: monthlyDocs,
    annual_mandatory: annualDocs,
    one_time_optional: optionalDocs,
    all: [...monthlyDocs, ...annualDocs, ...optionalDocs] as DocumentTypeArray
  };
};

/**
 * Check if a document type is mandatory for the given month
 */
export const isDocumentMandatory = (documentTypeId: string, selectedMonth: string): boolean => {
  const monthlyMandatory = (MONTHLY_MANDATORY_DOCUMENTS as readonly DocumentType[]).some(doc => doc.id === documentTypeId);
  const annualMandatory = selectedMonth === 'Jan' && (ANNUAL_MANDATORY_DOCUMENTS as readonly DocumentType[]).some(doc => doc.id === documentTypeId);
  
  return monthlyMandatory || annualMandatory;
};

/**
 * Check if a document type is one-time optional
 */
export const isOneTimeOptional = (documentTypeId: string): boolean => {
  return (ONE_TIME_OPTIONAL_DOCUMENTS as readonly DocumentType[]).some(doc => doc.id === documentTypeId);
};

/**
 * Get document type by ID
 */
export const getDocumentTypeById = (documentTypeId: string): DocumentType | undefined => {
  return (ALL_DOCUMENT_TYPES as readonly DocumentType[]).find(doc => doc.id === documentTypeId);
};

/**
 * Get document types by category
 */
export const getDocumentTypesByCategory = (category: 'monthly_mandatory' | 'annual_mandatory' | 'one_time_optional'): DocumentType[] => {
  return (ALL_DOCUMENT_TYPES as readonly DocumentType[]).filter(doc => doc.category === category);
};

/**
 * Get required document types for a specific month
 */
export const getRequiredDocumentTypes = (month: string): DocumentType[] => {
  const monthlyRequired = MONTHLY_MANDATORY_DOCUMENTS as readonly DocumentType[];
  const annualRequired = (month === 'Jan' ? ANNUAL_MANDATORY_DOCUMENTS : []) as readonly DocumentType[];
  
  return [...monthlyRequired, ...annualRequired];
};

/**
 * Map document type ID to valid backend document type
 */
export const getValidDocumentType = (documentTypeId: string): string => {
  // Map specific document types to backend enum values
  const typeMapping: { [key: string]: string } = {
    'INVOICE': 'financial',
    'FORM_T_MUSTER_ROLL': 'compliance',
    'BANK_STATEMENT': 'financial',
    'ECR': 'compliance',
    'PF_COMBINED_CHALLAN': 'financial',
    'PF_TRRN_DETAILS': 'compliance',
    'ESI_CONTRIBUTION_HISTORY': 'financial',
    'ESI_CHALLAN': 'financial',
    'PROFESSIONAL_TAX_RETURNS': 'compliance',
    'LABOUR_WELFARE_FUND': 'compliance',
    'VENDOR_AGREEMENT': 'registration',
    'EPF_CODE_LETTER': 'registration',
    'EPF_FORM_5A': 'registration',
    'ESIC_REGISTRATION': 'registration',
    'PT_REGISTRATION': 'registration',
    'PT_ENROLLMENT': 'registration',
    'CONTRACT_LABOUR_LICENSE': 'registration',
    // Handle lowercase variants
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
    'vendor_agreement': 'registration',
    'epf_code_letter': 'registration',
    'epf_form_5a': 'registration',
    'esic_registration': 'registration',
    'pt_registration': 'registration',
    'pt_enrollment': 'registration',
    'contract_labour_license': 'registration'
  };
  
  // Return mapped type or default to 'compliance'
  return typeMapping[documentTypeId] || 'compliance';
};

// Category display information
export const DOCUMENT_CATEGORIES = {
  monthly_mandatory: {
    name: 'Monthly Mandatory Uploads',
    description: 'Required every month and must be marked as mandatory',
    icon: '🔁',
    color: 'gray',
    bgColor: 'bg-gray-50 dark:bg-gray-800/50',
    borderColor: 'border-gray-200 dark:border-gray-700',
    textColor: 'text-gray-600 dark:text-gray-400',
    required: true
  },
  annual_mandatory: {
    name: 'Annual Upload',
    description: 'Required only in January and be mandatory',
    icon: '🗓️',
    color: 'orange',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    textColor: 'text-orange-600 dark:text-orange-400',
    required: true
  },
  one_time_optional: {
    name: 'One-Time Optional Uploads',
    description: 'Upload only once (any month) and marked as not mandatory',
    icon: '📁',
    color: 'gray',
    bgColor: 'bg-gray-50 dark:bg-gray-800/50',
    borderColor: 'border-gray-200 dark:border-gray-700',
    textColor: 'text-gray-600 dark:text-gray-400',
    required: false
  }
};