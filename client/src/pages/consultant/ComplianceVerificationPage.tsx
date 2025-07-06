import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { 
  PrinterIcon, 
  DocumentArrowDownIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  DocumentIcon,
  ArrowUpTrayIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';
import apiService from '../../utils/api';

interface Vendor {
  _id: string;
  name: string;
  company: string;
  email: string;
  address: string;
  workLocation: string;
  agreementPeriod: string;
  phone?: string;
  registrationDate?: string;
  companyRegNo?: string;
  taxId?: string;
}

interface DocumentHistory {
  documentId: string;
  documentName: string;
  documentType: string;
  status: string;
  submissionDate: string;
  reviewDate?: string;
  reviewNotes?: string;
}

interface AuditTrailEntry {
  action: string;
  performedBy: string;
  performedByName: string;
  timestamp: string;
  details: string;
}

interface ComplianceReport {
  _id: string;
  vendorId: string;
  month: string;
  year: number;
  auditReview: string;
  remarks: string;
  auditorName: string;
  auditorId: string;
  createdAt: string;
  status: 'draft' | 'completed' | 'archived';
  documentHistory: DocumentHistory[];
  auditTrail: AuditTrailEntry[];
  attachments?: Array<{
    fileName: string;
    filePath: string;
    fileSize: number;
    uploadDate: string;
  }>;
}

const ComplianceVerificationPage: React.FC = () => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [month, setMonth] = useState<string>(new Date().toLocaleString('default', { month: 'long' }));
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [auditReview, setAuditReview] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);
  
  // File upload state
  const [completionReport, setCompletionReport] = useState<File | null>(null);
  const [documentVerificationReport, setDocumentVerificationReport] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ComplianceReport | null>(null);

  // Fetch vendors with enhanced data
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        const response = await apiService.users.getVendors();
        if (response.data.success) {
          // Enhance vendor data with additional information
          const enhancedVendors = response.data.data.map((vendor: any) => ({
            ...vendor,
            // Ensure we have meaningful defaults for all fields
            workLocation: vendor.workLocation || 'Bangalore International Exhibition Centre (BIEC)',
            agreementPeriod: vendor.agreementPeriod || 'Annual Service Agreement (Jan 2024 - Dec 2024)',
            phone: vendor.phone || 'Contact through email',
            registrationDate: vendor.createdAt || new Date().toISOString(),
            companyRegNo: vendor.companyRegNo || 'REG' + Math.random().toString().substr(2, 8),
            taxId: vendor.taxId || 'GST' + Math.random().toString().substr(2, 8)
          }));
          console.log('Enhanced vendors data:', enhancedVendors);
          setVendors(enhancedVendors);
        } else {
          throw new Error('Failed to fetch vendors');
        }
      } catch (err: any) {
        console.error('Error fetching vendors:', err);
        setError(err.message || 'An error occurred while fetching vendors');
        // Fallback to empty array instead of mock data for production
        setVendors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  // Fetch comprehensive reports when vendor is selected
  useEffect(() => {
    if (selectedVendor) {
      const fetchReports = async () => {
        try {
          setLoading(true);
          console.log('Fetching compliance reports for vendor:', selectedVendor._id);
          
          const response = await apiService.documents.getComplianceReports(selectedVendor._id);
          if (response.data.success) {
            console.log('Compliance reports fetched successfully:', response.data.data);
            setReports(response.data.data);
          } else {
            console.log('No compliance reports found, initializing empty array');
            setReports([]);
          }
        } catch (err: any) {
          console.error('Error fetching compliance reports:', err);
          // Initialize with empty array instead of mock data
          setReports([]);
          // Only show error if it's not a 404 (no reports found)
          if (err.response?.status !== 404) {
            setError(err.message || 'An error occurred while fetching reports');
          }
        } finally {
          setLoading(false);
        }
      };

      fetchReports();
    }
  }, [selectedVendor]);

  // Handle vendor selection
  const handleVendorSelect = (vendorId: string) => {
    const vendor = vendors.find(v => v._id === vendorId);
    if (vendor) {
      setSelectedVendor(vendor);
    }
  };

  // Handle form submission with comprehensive data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('Creating compliance report with data:', {
        vendorId: selectedVendor._id,
        month,
        year,
        auditReview,
        remarks,
        auditorName: user?.name || 'Unknown Auditor'
      });

      const response = await apiService.documents.createComplianceReport({
        vendorId: selectedVendor._id,
        month,
        year,
        auditReview,
        remarks,
        auditorName: user?.name || 'Unknown Auditor'
      });

      if (response.data.success) {
        setSuccess('Compliance report created successfully');
        console.log('Compliance report created:', response.data.data);
        
        // Add the new report to the list
        setReports([response.data.data, ...reports]);
        
        // Reset form
        setAuditReview('');
        setRemarks('');
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000);
      } else {
        throw new Error(response.data.message || 'Failed to create compliance report');
      }
    } catch (err: any) {
      console.error('Error creating compliance report:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred while creating the report');
    } finally {
      setLoading(false);
    }
  };

  // Handle print with enhanced styling
  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const originalContents = document.body.innerHTML;
      
      document.body.innerHTML = `
        <html>
          <head>
            <title>Compliance Verification Report - ${selectedVendor?.company || 'Vendor'}</title>
            <style>
              body { 
                font-family: 'Arial', sans-serif; 
                font-size: 12px;
                line-height: 1.4;
                margin: 0;
                padding: 15px;
                color: #333;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 20px; 
                border: 2px solid #333;
              }
              th, td { 
                border: 1px solid #333; 
                padding: 10px; 
                text-align: left; 
                vertical-align: top;
              }
              th { 
                background-color: #f8f9fa; 
                font-weight: bold;
                font-size: 14px;
              }
              .header-logos {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
                padding: 20px;
                border-bottom: 3px solid #333;
              }
              .logo-section {
                display: flex;
                align-items: center;
              }
              .logo-section img {
                height: 60px;
                width: auto;
                margin: 0 15px;
              }
              .logo-text {
                text-align: center;
              }
              .logo-text h1, .logo-text h3 {
                margin: 5px 0;
                color: #333;
              }
              .report-title {
                text-align: center;
                margin: 0 20px;
              }
              .report-title h2 {
                font-size: 18px;
                font-weight: bold;
                margin: 0;
                text-decoration: underline;
              }
              .font-bold { font-weight: bold; }
              .text-lg { font-size: 14px; }
              .text-sm { font-size: 11px; }
              .whitespace-pre-wrap { white-space: pre-wrap; }
              .signature-box {
                border: 2px dashed #666;
                padding: 15px;
                text-align: center;
                margin-top: 10px;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 10px;
                color: #666;
              }
              @media print {
                body { margin: 0; }
                button { display: none !important; }
                .no-print { display: none !important; }
                .print-page-break { page-break-before: always; }
              }
            </style>
          </head>
          <body>
            ${printContents}
            <div class="footer">
              <p>Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}</p>
              <p>© IMTMA & BIEC - Compliance Verification System</p>
            </div>
          </body>
        </html>
      `;
      
      window.print();
      document.body.innerHTML = originalContents;
      // Reload the page to restore all functionality
      window.location.reload();
    }
  };

  // Export to PDF
  const handleExport = () => {
    // This would typically use a library like jsPDF or html2pdf
    alert('Export to PDF functionality would be implemented here');
  };

  // Handle file selection
  const handleCompletionReportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size should be less than 10MB');
        return;
      }
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        setError('Only PDF, DOC, and DOCX files are allowed');
        return;
      }
      setCompletionReport(file);
      setError(null);
    }
  };

  const handleDocumentVerificationReportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size should be less than 10MB');
        return;
      }
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        setError('Only PDF, DOC, and DOCX files are allowed');
        return;
      }
      setDocumentVerificationReport(file);
      setError(null);
    }
  };

  // Handle file upload
  const handleUploadReports = async () => {
    if (!selectedReport) {
      setError('Please select a compliance report first');
      return;
    }

    if (!completionReport && !documentVerificationReport) {
      setError('Please select at least one file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      const formData = new FormData();
      if (completionReport) {
        formData.append('completionReport', completionReport);
      }
      if (documentVerificationReport) {
        formData.append('documentVerificationReport', documentVerificationReport);
      }

      const response = await apiService.documents.uploadComplianceReportAttachments(selectedReport._id, formData);

      if (response.data.success) {
        setUploadSuccess('Reports uploaded successfully');
        setCompletionReport(null);
        setDocumentVerificationReport(null);
        
        // Refresh the reports list
        if (selectedVendor) {
          const reportsResponse = await apiService.documents.getComplianceReports(selectedVendor._id);
          if (reportsResponse.data.success) {
            setReports(reportsResponse.data.data);
          }
        }
        
        // Clear success message after 5 seconds
        setTimeout(() => setUploadSuccess(null), 5000);
      } else {
        throw new Error(response.data.message || 'Failed to upload reports');
      }
    } catch (err: any) {
      console.error('Error uploading reports:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred while uploading reports');
    } finally {
      setUploading(false);
    }
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Compliance Verification</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create and manage compliance verification reports for vendors
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Button
              leftIcon={<PrinterIcon className="h-5 w-5" />}
              variant="outline"
              onClick={handlePrint}
              disabled={!selectedVendor}
            >
              Print
            </Button>
            <Button
              leftIcon={<DocumentArrowDownIcon className="h-5 w-5" />}
              onClick={handleExport}
              disabled={!selectedVendor}
            >
              Export PDF
            </Button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4">
            <div className="flex">
              <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
              <span className="text-green-700">{success}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vendor Selection */}
          <div className="lg:col-span-1">
            <Card>
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-4">Select Vendor</h2>
                {loading && vendors.length === 0 ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {vendors.map(vendor => (
                      <button
                        key={vendor._id}
                        onClick={() => handleVendorSelect(vendor._id)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedVendor?._id === vendor._id
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="font-medium">{vendor.company}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{vendor.name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Compliance Verification Form */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-4">
               
                
                {selectedVendor ? (
                  <div>
                    {/* Printable Report Area */}
                    <div ref={printRef} className="mb-6 print:block">
                      {/* Header with Logos */}
                      <div className="flex justify-between items-center mb-6 p-4 border-b-2 border-gray-300">
                        <div className="flex items-center">
                          <img 
                            src="/images/IMTMA-logo.png" 
                            alt="IMTMA Logo" 
                            className="h-16 w-auto mr-4"
                            onError={(e) => {
                              console.log('IMTMA logo failed to load');
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div>
                            <h1 className="text-lg font-bold text-gray-900">
                              
                            </h1>
                            <p className="text-sm text-gray-600"></p>
                          </div>
                        </div>
                        <div className="text-center">
                          <h2 className="text-xl font-bold text-gray-900 mb-2">
                            COMPLIANCE VERIFICATION REPORT
                          </h2>
                          <p className="text-sm text-gray-600">
                            Report Generated: {new Date().toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <div className="text-right mr-4">
                            <h3 className="text-lg font-bold text-gray-900">
                              
                            </h3>
                            <p className="text-sm text-gray-600"></p>
                          </div>
                          <img 
                            src="/images/BIEC-logo.png" 
                            alt="BIEC Logo" 
                            className="h-16 w-auto"
                            onError={(e) => {
                              console.log('BIEC logo failed to load');
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      </div>

                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th colSpan={2} className="border border-gray-300 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 p-3 text-center text-lg font-bold">
                              VENDOR COMPLIANCE VERIFICATION DETAILS
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 dark:border-gray-700 p-3 font-medium bg-gray-50 dark:bg-gray-900 w-1/3">Name & Address of the Vendor</td>
                            <td className="border border-gray-300 dark:border-gray-700 p-3">
                              <div className="flex items-start">
                                <BuildingOfficeIcon className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                                <div>
                                  <div className="font-bold text-lg">{selectedVendor.company}</div>
                                  <div className="text-gray-700 font-medium">{selectedVendor.name}</div>
                                  <div className="text-gray-600 dark:text-gray-400 mt-1">{selectedVendor.address || 'No address provided'}</div>
                                  <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                    Email: {selectedVendor.email}
                                  </div>
                                  {selectedVendor.phone && (
                                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                                      Phone: {selectedVendor.phone}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>

                          <tr>
                            <td className="border border-gray-300 dark:border-gray-700 p-3 font-medium bg-gray-50 dark:bg-gray-900">Location of Work</td>
                            <td className="border border-gray-300 dark:border-gray-700 p-3">
                              <div className="flex items-center">
                                <MapPinIcon className="h-5 w-5 text-gray-500 mr-2" />
                                <span className="font-medium">{selectedVendor.workLocation}</span>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 dark:border-gray-700 p-3 font-medium bg-gray-50 dark:bg-gray-900">Agreement Period</td>
                            <td className="border border-gray-300 dark:border-gray-700 p-3">
                              <div className="flex items-center">
                                <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
                                <span className="font-medium">{selectedVendor.agreementPeriod}</span>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 dark:border-gray-700 p-3 font-medium bg-gray-50 dark:bg-gray-900">Compliance Period</td>
                            <td className="border border-gray-300 dark:border-gray-700 p-3">
                              <div className="flex items-center">
                                <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
                                <span className="font-bold text-lg">{month} {year}</span>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 dark:border-gray-700 p-3 font-medium bg-gray-50 dark:bg-gray-900">Audit Review & Findings</td>
                            <td className="border border-gray-300 dark:border-gray-700 p-3">
                              <div className="whitespace-pre-wrap">{auditReview || 'No audit review provided'}</div>
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 dark:border-gray-700 p-3 font-medium bg-gray-50 dark:bg-gray-900">Compliance Status & Remarks</td>
                            <td className="border border-gray-300 dark:border-gray-700 p-3">
                              <div className="whitespace-pre-wrap">{remarks || 'No specific remarks'}</div>
                            </td>
                          </tr>
                          <tr>
                            
                          </tr>
                          <tr>
                            <td className="border border-gray-300 dark:border-gray-700 p-3 font-medium bg-gray-50 dark:bg-gray-900">Auditor Certification</td>
                            <td className="border border-gray-300 dark:border-gray-700 p-3">
                              <div className="space-y-3">
                                <div className="flex items-center">
                                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                                  <span className="font-medium">Verified by: {user?.name || 'Unknown Auditor'}</span>
                                </div>
                                <div className="text-sm text-gray-600">
                                  Date of Verification: {new Date().toLocaleDateString('en-IN')}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Time of Verification: {new Date().toLocaleTimeString('en-IN')}
                                </div>
                                </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Form for creating new report */}
                    <form onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label htmlFor="month" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Month
                          </label>
                          <select
                            id="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                          >
                            {[
                              'January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'
                            ].map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Year
                          </label>
                          <select
                            id="year"
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                          >
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="auditReview" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Audit Review
                        </label>
                        <textarea
                          id="auditReview"
                          value={auditReview}
                          onChange={(e) => setAuditReview(e.target.value)}
                          rows={4}
                          className="block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter audit review details..."
                          required
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Remarks (if any)
                        </label>
                        <textarea
                          id="remarks"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          rows={2}
                          className="block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter any remarks..."
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : 'Save Compliance Report'}
                        </Button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No vendor selected</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Please select a vendor from the list to create a compliance verification report.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Upload Reports Section */}
        {selectedVendor && reports.length > 0 && (
          <div className="mt-6">
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Additional Reports</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Upload Completion Report and Document Verification Report for existing compliance reports
                    </p>
                  </div>
                </div>

                {/* Success Message for Upload */}
                {uploadSuccess && (
                  <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4">
                    <div className="flex">
                      <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
                      <span className="text-green-700">{uploadSuccess}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Report Selection */}
                  <div>
                    <label htmlFor="report-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Compliance Report
                    </label>
                    <select
                      id="report-select"
                      className="block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={selectedReport?._id || ''}
                      onChange={(e) => {
                        const report = reports.find(r => r._id === e.target.value);
                        setSelectedReport(report || null);
                      }}
                    >
                      <option value="">Select a compliance report...</option>
                      {reports.map((report) => (
                        <option key={report._id} value={report._id}>
                          {report.month} {report.year} - {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedReport && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Completion Report Upload */}
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Completion Report
                        </label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                          <ArrowUpTrayIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {completionReport ? completionReport.name : 'Click to upload Completion Report'}
                          </div>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleCompletionReportChange}
                            className="hidden"
                            id="completion-report-input"
                          />
                          <label
                            htmlFor="completion-report-input"
                            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-700 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                          >
                            <PaperClipIcon className="h-4 w-4 mr-2" />
                            Choose File
                          </label>
                          {completionReport && (
                            <div className="mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCompletionReport(null)}
                              >
                                Remove
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Document Verification Report Upload */}
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Document Verification Report
                        </label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                          <ArrowUpTrayIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {documentVerificationReport ? documentVerificationReport.name : 'Click to upload Document Verification Report'}
                          </div>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleDocumentVerificationReportChange}
                            className="hidden"
                            id="doc-verification-report-input"
                          />
                          <label
                            htmlFor="doc-verification-report-input"
                            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-700 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                          >
                            <PaperClipIcon className="h-4 w-4 mr-2" />
                            Choose File
                          </label>
                          {documentVerificationReport && (
                            <div className="mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDocumentVerificationReport(null)}
                              >
                                Remove
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedReport && (completionReport || documentVerificationReport) && (
                    <div className="flex justify-end space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCompletionReport(null);
                          setDocumentVerificationReport(null);
                          setSelectedReport(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUploadReports}
                        disabled={uploading}
                        leftIcon={<ArrowUpTrayIcon className="h-5 w-5" />}
                      >
                        {uploading ? 'Uploading...' : 'Upload Reports'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Previous Reports */}
        {selectedVendor && (
          <div className="mt-6">
            <Card>
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Compliance History & Reports</h2>
                  <div className="text-sm text-gray-500">
                    Total Reports: {reports.length}
                  </div>
                </div>
                
                {reports.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Report Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Period
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Audit Summary
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Auditor
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {reports.map((report) => (
                          <tr key={report._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              <div className="font-medium">
                                {new Date(report.createdAt).toLocaleDateString('en-IN')}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(report.createdAt).toLocaleTimeString('en-IN')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              <div className="font-medium">{report.month} {report.year}</div>
                              {report.documentHistory && report.documentHistory.length > 0 && (
                                <div className="text-xs text-gray-500">
                                  {report.documentHistory.length} documents reviewed
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                report.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : report.status === 'draft'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                              <div className="truncate" title={report.auditReview}>
                                {report.auditReview.length > 100 
                                  ? `${report.auditReview.substring(0, 100)}...` 
                                  : report.auditReview}
                              </div>
                              {report.remarks && (
                                <div className="text-xs text-gray-400 mt-1 truncate" title={report.remarks}>
                                  Remarks: {report.remarks.length > 50 
                                    ? `${report.remarks.substring(0, 50)}...` 
                                    : report.remarks}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              <div className="font-medium">{report.auditorName}</div>
                              {report.auditTrail && report.auditTrail.length > 0 && (
                                <div className="text-xs text-gray-400">
                                  {report.auditTrail.length} audit entries
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    // Load report details into form
                                    setMonth(report.month);
                                    setYear(report.year);
                                    setAuditReview(report.auditReview);
                                    setRemarks(report.remarks);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                  title="Load report details"
                                >
                                  View
                                </button>
                                <button
                                  onClick={handlePrint}
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  title="Print this report"
                                >
                                  Print
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No compliance reports found</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      This vendor doesn't have any compliance reports yet. Create one using the form above.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ComplianceVerificationPage;