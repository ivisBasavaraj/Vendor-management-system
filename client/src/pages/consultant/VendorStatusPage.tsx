import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useSearchParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { 
  ChartBarIcon, 
  ArrowDownTrayIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  DocumentCheckIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import apiService from '../../utils/api';

interface Vendor {
  _id: string;
  name: string;
  company: string;
}

interface Document {
  id: string;
  submissionId: string;
  documentType: string;
  documentName: string;
  fileName: string;
  fileType: string;
  uploadDate: string;
  status: string;
  isMandatory: boolean;
  consultantRemarks: string;
  reviewDate: string | null;
}

interface StatusData {
  vendorId: string;
  vendorName: string;
  vendorCompany: string;
  year: number;
  month: string;
  totalDocuments: number;
  approvedDocuments: number;
  rejectedDocuments: number;
  pendingDocuments: number;
  complianceScore: number;
  documents: Document[];
  documentsByType?: Record<string, Document[]>;
}

const VendorStatusPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  

  
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [months, setMonths] = useState<string[]>([
    'All Time',
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]);
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current selections from URL params
  const selectedVendor = searchParams.get('vendorId') || '';
  const selectedYear = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
  const selectedMonth = searchParams.get('month') || 'All Time';

  // If vendorId is provided but year/month are not, set default values
  useEffect(() => {
    if (selectedVendor && (!searchParams.get('year') || !searchParams.get('month'))) {
      const newParams = new URLSearchParams(searchParams);
      if (!searchParams.get('year')) {
        newParams.set('year', new Date().getFullYear().toString());
      }
      if (!searchParams.get('month')) {
        newParams.set('month', 'All Time');
      }
      setSearchParams(newParams);
    }
  }, [selectedVendor, searchParams, setSearchParams]);

  // Functions to update URL parameters
  const updateVendorSelection = (vendorId: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (vendorId) {
      newParams.set('vendorId', vendorId);
    } else {
      newParams.delete('vendorId');
    }
    setSearchParams(newParams);
  };

  const updateYearSelection = (year: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('year', year.toString());
    setSearchParams(newParams);
  };

  const updateMonthSelection = (month: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('month', month);
    setSearchParams(newParams);
  };

  // Generate years (current year and 4 years back)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const yearsList = [];
    for (let i = 0; i < 5; i++) {
      yearsList.push(currentYear - i);
    }
    setYears(yearsList);
  }, []);

  // Fetch vendors
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.users.getVendors();
        
        if (response.data.success && response.data.data) {
          setVendors(response.data.data);
        } else {
          throw new Error(response.data.message || 'Failed to fetch vendors');
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load vendors';
        
        if (err.response?.status === 401) {
          setError('Authentication required. Please log in again.');
          setVendors([]);
        } else {
          setError(errorMessage);
          
          // Add some sample vendors for demonstration if API fails
          const sampleVendors: Vendor[] = [
            { _id: 'sample-1', name: 'John Smith', company: 'Acme Corporation' },
            { _id: 'sample-2', name: 'Sarah Johnson', company: 'TechSystems Inc.' },
            { _id: 'sample-3', name: 'Michael Brown', company: 'Global Supplies Ltd.' },
            { _id: 'sample-4', name: 'Lisa Chen', company: 'Advanced Manufacturing Co.' },
            { _id: 'sample-5', name: 'David Wilson', company: 'Premier Services LLC' }
          ];
          setVendors(sampleVendors);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  // Fetch status data when selection changes
  useEffect(() => {
    if (selectedVendor && (selectedMonth === 'All Time' || (selectedYear && selectedMonth))) {
      fetchStatusData();
    } else {
      setStatusData(null);
    }
  }, [selectedVendor, selectedYear, selectedMonth]);

  const fetchStatusData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // If "All Time" is selected, don't pass year and month parameters
      const isAllTime = selectedMonth === 'All Time';
      
      const response = await apiService.documents.getVendorStatus(
        selectedVendor,
        isAllTime ? undefined : selectedYear,
        isAllTime ? undefined : selectedMonth
      );
      
      if (response.data.success) {
        // Always use the actual API data
        setStatusData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch status data');
      }
    } catch (err: any) {
      console.error('Error fetching vendor status:', err);
      
      if (err.response?.status === 404) {
        setError('No data found for the selected vendor and period');
      } else if (err.response?.status === 400) {
        setError('Invalid request parameters');
      } else if (err.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else {
        setError(err.response?.data?.message || err.message || 'An error occurred while fetching status data');
      }
      
      setStatusData(null);
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!statusData) return;
    
    // Summary data
    const summaryHeaders = [
      'Vendor', 'Company', 'Year', 'Month', 
      'Total Documents', 'Approved', 'Rejected', 'Pending', 'Compliance Score'
    ];
    
    const summaryData = [
      statusData.vendorName,
      statusData.vendorCompany,
      statusData.year ? statusData.year.toString() : 'All Time',
      statusData.month || 'All Time',
      statusData.totalDocuments.toString(),
      statusData.approvedDocuments.toString(),
      statusData.rejectedDocuments.toString(),
      statusData.pendingDocuments.toString(),
      `${statusData.complianceScore}%`
    ];
    
    // Document details data
    const documentHeaders = [
      'Document Type', 'Document Name', 'File Type', 'Upload Date', 'Status', 'Mandatory', 'Remarks'
    ];
    
    let csvContent = [
      'SUMMARY DATA',
      summaryHeaders.join(','),
      summaryData.join(','),
      '',
      'DOCUMENT DETAILS',
      documentHeaders.join(',')
    ];
    
    // Add document rows if available
    if (statusData.documents && statusData.documents.length > 0) {
      statusData.documents.forEach(doc => {
        const docRow = [
          doc.documentType,
          `"${doc.documentName.replace(/"/g, '""')}"`, // Escape quotes in CSV
          doc.fileType,
          new Date(doc.uploadDate).toLocaleDateString(),
          doc.status,
          doc.isMandatory ? 'Yes' : 'No',
          `"${(doc.consultantRemarks || '').replace(/"/g, '""')}"` // Escape quotes in CSV
        ];
        csvContent.push(docRow.join(','));
      });
    }
    
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const yearStr = statusData.year ? statusData.year.toString() : 'AllTime';
    const monthStr = statusData.month || 'AllTime';
    link.setAttribute('download', `vendor_status_${statusData.vendorCompany}_${monthStr}_${yearStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor Status</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Filter vendor document status by Vendor, Year, and Month
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button
              leftIcon={<ArrowDownTrayIcon className="h-5 w-5" />}
              onClick={exportToCSV}
              disabled={!statusData}
            >
              Export to CSV
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}



        {/* Selection Filters */}
        <Card className="mb-6">
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Vendor Selection */}
              <div>
                <label htmlFor="vendor-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Vendor
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="vendor-select"
                    className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={selectedVendor}
                    onChange={(e) => updateVendorSelection(e.target.value)}
                  >
                    <option value="">Select a vendor</option>
                    {vendors.map((vendor) => (
                      <option key={vendor._id} value={vendor._id}>
                        {vendor.company} ({vendor.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Year Selection */}
              <div>
                <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Year
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="year-select"
                    className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={selectedYear}
                    onChange={(e) => updateYearSelection(parseInt(e.target.value))}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Month Selection */}
              <div>
                <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Month
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="month-select"
                    className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={selectedMonth}
                    onChange={(e) => updateMonthSelection(e.target.value)}
                  >
                    {months.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Status Display */}
        {loading ? (
          <Card>
            <div className="p-4">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </Card>
        ) : statusData ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Total Documents */}
              <Card>
                <div className="p-4">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 mr-4">
                      <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Documents</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{statusData.totalDocuments}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Approved Documents */}
              <Card>
                <div className="p-4">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 mr-4">
                      <DocumentCheckIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{statusData.approvedDocuments}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Rejected Documents */}
              <Card>
                <div className="p-4">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-red-100 dark:bg-red-900 mr-4">
                      <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{statusData.rejectedDocuments}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Compliance Score */}
              <Card>
                <div className="p-4">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 mr-4">
                      <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Compliance Score</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{statusData.complianceScore}%</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Detailed Information */}
            <Card>
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-4">
                  Status Details for {statusData.vendorCompany} - {statusData.month} {statusData.year}
                </h2>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Category
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          Vendor Name
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {statusData.vendorName}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          Company
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {statusData.vendorCompany}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          Period
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {statusData.month} {statusData.year}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          Total Documents
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {statusData.totalDocuments}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          Approved Documents
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {statusData.approvedDocuments}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          Rejected Documents
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {statusData.rejectedDocuments}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          Pending Documents
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {statusData.pendingDocuments}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          Compliance Score
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {statusData.complianceScore}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* Visual representation of compliance */}
                <div className="mt-6">
                  <h3 className="text-md font-medium mb-2">Compliance Progress</h3>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                    <div 
                      className={`h-4 rounded-full ${
                        statusData.complianceScore >= 80 
                          ? 'bg-green-500' 
                          : statusData.complianceScore >= 50 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${statusData.complianceScore}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Document Details */}
            {statusData.documents && statusData.documents.length > 0 ? (
              <Card className="mt-6">
                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-4">
                    Document Details
                  </h2>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Document Type
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Document Name
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            File Type
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Upload Date
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Mandatory
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Remarks
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {statusData.documents.map((doc, index) => (
                          <tr key={doc.id || index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {doc.documentType}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {doc.documentName}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {doc.fileType.toUpperCase()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {new Date(doc.uploadDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${doc.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                                  doc.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                                {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {doc.isMandatory ? 'Yes' : 'No'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {doc.consultantRemarks || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="mt-6">
                <div className="p-8 text-center">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Documents Found</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {statusData.vendorCompany} has not submitted any documents for {statusData.month} {statusData.year}.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Documents will appear here once they are uploaded by the vendor.
                  </p>
                </div>
              </Card>
            )}
            
            {/* Documents By Type */}
            {statusData.documentsByType && Object.keys(statusData.documentsByType).length > 0 && (
              <Card className="mt-6">
                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-4">
                    Documents By Type
                  </h2>
                  
                  <div className="space-y-6">
                    {Object.entries(statusData.documentsByType).map(([type, docs]) => (
                      <div key={type} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-medium">
                          {type}
                        </div>
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {docs.map((doc, index) => (
                              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-sm truncate" title={doc.documentName}>
                                      {doc.documentName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {new Date(doc.uploadDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${doc.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                                      doc.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                  </span>
                                </div>
                                {doc.consultantRemarks && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                                    <span className="font-medium">Remarks:</span> {doc.consultantRemarks}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <div className="p-8 text-center">
              <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Status Data Available</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {!selectedVendor ? 
                  (vendors.length === 0 ? 
                    'Loading vendor information...' :
                    'Please select a vendor, year, and month to view status information.'
                  ) :
                  `No data found for ${vendors.find(v => v._id === selectedVendor)?.company || 'the selected vendor'} in ${selectedMonth} ${selectedYear}.`
                }
              </p>
              {!selectedVendor && vendors.length > 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p>Available vendors: {vendors.length}</p>
                  <p>Use the filters above to select a vendor and time period.</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default VendorStatusPage;