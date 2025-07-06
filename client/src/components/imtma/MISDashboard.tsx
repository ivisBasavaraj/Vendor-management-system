import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../utils/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import {
  DocumentTextIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  ChartBarIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

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

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface MISData {
  totalVendors: number;
  totalSubmissions: number;
  submittedCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  pendingConsultantReview: number;
  statusBreakdown: Array<{
    name: string;
    value: number;
  }>;
  vendorCompliance: Array<{
    vendorName: string;
    complianceRate: number;
    submissionCount: number;
  }>;
  consultantWorkload: Array<{
    consultantName: string;
    assignedCount: number;
    completedCount: number;
    pendingCount: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    submissions: number;
    approvals: number;
  }>;
}

const MISDashboard: React.FC = () => {
  // Filter state
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth()].value);
  
  // Data state
  const [misData, setMisData] = useState<MISData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch MIS data based on filters
  useEffect(() => {
    const fetchMISData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch MIS data
        const response = await apiService.reports.getMISData(selectedYear, selectedMonth);
        
        if (response.data.success) {
          setMisData(response.data.data);
        } else {
          setError(response.data.message || 'Failed to fetch MIS data');
        }
      } catch (err: any) {
        console.error('Error fetching MIS data:', err);
        setError(err.message || 'An error occurred while fetching MIS data');
        
        // Set mock data for demonstration
        setMisData({
          totalVendors: 45,
          totalSubmissions: 38,
          submittedCount: 38,
          pendingCount: 12,
          approvedCount: 22,
          rejectedCount: 4,
          pendingConsultantReview: 8,
          statusBreakdown: [
            { name: 'Pending', value: 12 },
            { name: 'Under Review', value: 8 },
            { name: 'Approved', value: 22 },
            { name: 'Rejected', value: 4 }
          ],
          vendorCompliance: [
            { vendorName: 'Vendor A', complianceRate: 95, submissionCount: 5 },
            { vendorName: 'Vendor B', complianceRate: 88, submissionCount: 4 },
            { vendorName: 'Vendor C', complianceRate: 75, submissionCount: 3 },
            { vendorName: 'Vendor D', complianceRate: 100, submissionCount: 6 },
            { vendorName: 'Vendor E', complianceRate: 60, submissionCount: 2 }
          ],
          consultantWorkload: [
            { consultantName: 'Consultant A', assignedCount: 15, completedCount: 10, pendingCount: 5 },
            { consultantName: 'Consultant B', assignedCount: 12, completedCount: 8, pendingCount: 4 },
            { consultantName: 'Consultant C', assignedCount: 18, completedCount: 12, pendingCount: 6 }
          ],
          monthlyTrend: [
            { month: 'Jan', submissions: 8, approvals: 6 },
            { month: 'Feb', submissions: 10, approvals: 8 },
            { month: 'Mar', submissions: 12, approvals: 9 },
            { month: 'Apr', submissions: 15, approvals: 12 },
            { month: 'May', submissions: 9, approvals: 7 },
            { month: 'Jun', submissions: 11, approvals: 9 }
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMISData();
  }, [selectedYear, selectedMonth]);
  
  // Handle refresh
  const handleRefresh = () => {
    setLoading(true);
    // Re-fetch data with the same filters
    const fetchMISData = async () => {
      try {
        const response = await apiService.reports.getMISData(selectedYear, selectedMonth);
        
        if (response.data.success) {
          setMisData(response.data.data);
          setError(null);
        } else {
          setError(response.data.message || 'Failed to fetch MIS data');
        }
      } catch (err: any) {
        console.error('Error refreshing MIS data:', err);
        setError(err.message || 'An error occurred while refreshing MIS data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMISData();
  };
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-md">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            MIS Dashboard
          </h2>
          
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="year" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Year:
              </label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                {YEARS.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label htmlFor="month" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Month:
              </label>
              <select
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowPathIcon className="h-5 w-5" />}
              onClick={handleRefresh}
              isLoading={loading}
            >
              Refresh
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
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : misData ? (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 p-3 rounded-md">
                    <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Vendors</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{misData.totalVendors}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="text-green-500 font-medium">{misData.submittedCount}</span> submitted this period
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/30 p-3 rounded-md">
                    <ClipboardDocumentCheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Approved</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{misData.approvedCount}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="text-green-500 font-medium">{Math.round((misData.approvedCount / misData.totalSubmissions) * 100)}%</span> approval rate
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-md">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{misData.pendingCount}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="text-yellow-500 font-medium">{misData.pendingConsultantReview}</span> with consultants
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-red-100 dark:bg-red-900/30 p-3 rounded-md">
                    <DocumentTextIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rejected</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{misData.rejectedCount}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="text-red-500 font-medium">{Math.round((misData.rejectedCount / misData.totalSubmissions) * 100)}%</span> rejection rate
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Breakdown */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Status Breakdown</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={misData.statusBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {misData.statusBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Monthly Trend */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Monthly Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={misData.monthlyTrend}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="submissions" fill="#8884d8" name="Submissions" />
                      <Bar dataKey="approvals" fill="#82ca9d" name="Approvals" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Vendor Compliance */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Vendor Compliance</h3>
                <Button
                  variant="outline"
                  size="sm"
                  as={Link}
                  to="/reports/vendor-compliance"
                >
                  View Full Report
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Submissions
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Compliance Rate
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {misData.vendorCompliance.map((vendor, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {vendor.vendorName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {vendor.submissionCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  vendor.complianceRate >= 90 ? 'bg-green-500' :
                                  vendor.complianceRate >= 70 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${vendor.complianceRate}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                              {vendor.complianceRate}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              vendor.complianceRate >= 90 ? 'success' :
                              vendor.complianceRate >= 70 ? 'warning' :
                              'danger'
                            }
                          >
                            {vendor.complianceRate >= 90 ? 'Good' :
                             vendor.complianceRate >= 70 ? 'Average' :
                             'Poor'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Consultant Workload */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Consultant Workload</h3>
                <Button
                  variant="outline"
                  size="sm"
                  as={Link}
                  to="/reports/consultant-workload"
                >
                  View Full Report
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Consultant
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Assigned
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Completed
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Pending
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Completion Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {misData.consultantWorkload.map((consultant, index) => {
                      const completionRate = consultant.assignedCount > 0 
                        ? Math.round((consultant.completedCount / consultant.assignedCount) * 100)
                        : 0;
                        
                      return (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {consultant.consultantName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {consultant.assignedCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {consultant.completedCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {consultant.pendingCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {completionRate >= 70 ? (
                                <ArrowTrendingUpIcon className="h-5 w-5 text-green-500 mr-1" />
                              ) : (
                                <ArrowTrendingDownIcon className="h-5 w-5 text-red-500 mr-1" />
                              )}
                              <span className={`text-sm font-medium ${
                                completionRate >= 70 ? 'text-green-500' : 'text-red-500'
                              }`}>
                                {completionRate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                leftIcon={<ChartBarIcon className="h-5 w-5" />}
                as={Link}
                to="/reports/generate"
              >
                Generate Reports
              </Button>
              
              <Button
                variant="outline"
                leftIcon={<FunnelIcon className="h-5 w-5" />}
                as={Link}
                to="/reports/advanced"
              >
                Advanced Analytics
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-md">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No data available</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              There is no MIS data available for the selected period.
            </p>
            <div className="mt-6">
              <Button
                onClick={handleRefresh}
                leftIcon={<ArrowPathIcon className="h-5 w-5" />}
              >
                Refresh Data
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MISDashboard;