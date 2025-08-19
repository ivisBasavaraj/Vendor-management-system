import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { getFullImageUrl } from '../../utils/imageUtils';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  EyeIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Table from '../ui/Table';
import Pagination from '../ui/Pagination';

interface Vendor {
  _id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  logo?: string;
  isActive: boolean;
  analytics?: {
    totalDocuments: number;
    approvedDocuments: number;
    pendingDocuments: number;
    rejectedDocuments: number;
    complianceRate: number;
    lastActivity: string;
  };
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const VendorsList: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Load vendors data assigned to the consultant
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Debug current user
        console.log('=== FRONTEND DEBUG ===');
        console.log('Current user:', {
          id: user?.id,
          _id: user?._id,
          role: user?.role,
          name: user?.name,
          email: user?.email
        });
        
        console.log('Expected consultant from debug:', {
          name: 'Pooja',
          email: 'pooja@gmail.com',
          id: '682798eacf670eab81338b8c'
        });
        
        const requestParams = { 
          assignedToMe: true,  // Only get vendors assigned to the current consultant
          consultantId: user?.id, // Pass the consultant ID explicitly
          includeAnalytics: true  // Include analytics data
        };
        
        console.log('Request parameters:', requestParams);
        
        // Try the specific consultant endpoint first
        let response;
        try {
          console.log('Calling consultant-specific endpoint: /api/users/consultant/my-vendors');
          response = await apiService.get('/api/users/consultant/my-vendors');
          console.log('Using consultant-specific endpoint - SUCCESS');
          console.log('Consultant endpoint response:', response.data);
        } catch (consultantEndpointError) {
          console.log('Consultant endpoint failed:', consultantEndpointError);
          console.log('Falling back to general endpoint');
          // Fallback to the general vendors endpoint
          response = await apiService.users.getVendors(requestParams);
          console.log('General endpoint response:', response.data);
        }
        
        console.log('Vendors API response:', response.data);
        console.log('=== END FRONTEND DEBUG ===');
        
        if (response.data.success) {
          const vendorsData = response.data.data;
          console.log('Raw vendors data from API:', vendorsData);
          
          // Check each vendor for analytics data
          vendorsData.forEach((vendor: any, index: number) => {
            console.log(`Vendor ${index + 1} (${vendor.name}):`, {
              hasAnalytics: !!vendor.analytics,
              analytics: vendor.analytics,
              _id: vendor._id
            });
          });
          console.log('Raw vendors data from API:', vendorsData);
          
          // Check each vendor for analytics data
          vendorsData.forEach((vendor: any, index: number) => {
            console.log(`Vendor ${index + 1} (${vendor.name}):`, {
              hasAnalytics: !!vendor.analytics,
              analytics: vendor.analytics,
              _id: vendor._id
            });
          });
          
          // Make sure we have analytics data for each vendor
          const vendorsWithAnalytics = vendorsData.map((vendor: Vendor) => {
            if (!vendor.analytics) {
              console.log(`No analytics found for vendor ${vendor.name}, using defaults`);
              // Add default analytics if missing
              return {
                ...vendor,
                analytics: {
                  totalDocuments: 0,
                  approvedDocuments: 0,
                  pendingDocuments: 0,
                  rejectedDocuments: 0,
                  complianceRate: 0,
                  lastActivity: new Date().toISOString()
                }
              };
            }
            console.log(`Analytics found for vendor ${vendor.name}:`, vendor.analytics);
            return vendor;
          });
          
          setVendors(vendorsWithAnalytics);
          setTotalPages(Math.ceil(vendorsWithAnalytics.length / 10)); // Assuming 10 items per page
        } else {
          setError(response.data.message || 'Failed to load vendors');
        }
      } catch (err: any) {
        console.error('Error fetching vendors:', err);
        const errorMessage = err.response?.data?.message || 'Failed to load vendors';
        console.log('Error details:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message
        });
        setError(`${errorMessage} (${err.response?.status || 'Unknown error'})`);
        
        // Use mock data for development if API fails
        const mockVendors: Vendor[] = [
          {
            _id: '68458a8b148863de006e2c5b', // Use a MongoDB-like ID format
            name: 'John Smith',
            email: 'john@acmecorp.com',
            company: 'Acme Corporation',
            phone: '555-123-4567',
            isActive: true,
            analytics: {
              totalDocuments: 15,
              approvedDocuments: 10,
              pendingDocuments: 3,
              rejectedDocuments: 2,
              complianceRate: 85,
              lastActivity: new Date().toISOString()
            }
          },
          {
            _id: '68458a8b148863de006e2c5c', // Use a MongoDB-like ID format
            name: 'Sarah Johnson',
            email: 'sarah@techsystems.com',
            company: 'TechSystems Inc.',
            phone: '555-987-6543',
            isActive: true,
            analytics: {
              totalDocuments: 8,
              approvedDocuments: 5,
              pendingDocuments: 2,
              rejectedDocuments: 1,
              complianceRate: 75,
              lastActivity: new Date().toISOString()
            }
          },
          {
            _id: '68458a8b148863de006e2c5d', // Use a MongoDB-like ID format
            name: 'Michael Brown',
            email: 'michael@globalsupplies.com',
            company: 'Global Supplies Ltd.',
            phone: '555-456-7890',
            isActive: true,
            analytics: {
              totalDocuments: 12,
              approvedDocuments: 8,
              pendingDocuments: 4,
              rejectedDocuments: 0,
              complianceRate: 90,
              lastActivity: new Date().toISOString()
            }
          }
        ];
        
        setVendors(mockVendors);
        setTotalPages(Math.ceil(mockVendors.length / 10));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [refreshKey]);
  
  // Log vendors data for debugging
  console.log('Vendors data:', vendors);
  
  // Filtered vendors based on search and status
  const filteredVendors = vendors.filter(vendor => {
    // Search filter
    const matchesSearch = 
      searchQuery === '' || 
      vendor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vendor.company && vendor.company.toLowerCase().includes(searchQuery.toLowerCase()));
      
    // Status filter
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && vendor.isActive) ||
      (statusFilter === 'inactive' && !vendor.isActive);
      
    return matchesSearch && matchesStatus;
  });
  
  // Paginate vendors
  const paginatedVendors = filteredVendors.slice((page - 1) * 10, page * 10);
  
  // Handle view vendor documents
  const handleViewDocuments = (vendorId: string) => {
    console.log(`Navigating to vendor documents for vendor ID: ${vendorId}`);
    
    // Make sure the vendorId is valid
    if (!vendorId) {
      console.error('Invalid vendor ID');
      return;
    }
    
    // Use the correct route path
    const url = `/vendor-documents/${vendorId}`;
    console.log(`Navigation URL: ${url}`);
    
    // Navigate to the vendor documents page
    navigate(url);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };


  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
    >
      {error && (
        <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      <Card className="mb-8">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white flex items-center">
              <BuildingOfficeIcon className="mr-2 h-5 w-5 text-neutral-500" />
              Assigned Vendors
            </h2>
            
            <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
              <Button
                leftIcon={<ArrowPathIcon className="h-5 w-5" />}
                variant="outline"
                onClick={handleRefresh}
              >
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="w-full md:w-48">
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <Button
              leftIcon={<FunnelIcon className="h-5 w-5" />}
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
            >
              Reset
            </Button>
          </div>
          
          {/* Vendors Table */}
          {paginatedVendors.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-md">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No vendors found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                There are no vendors assigned to you matching the current filters.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Documents
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Compliance
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Last Activity
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {paginatedVendors.map((vendor) => (
                      <tr key={vendor._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {vendor.logo ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                                  src={getFullImageUrl(vendor.logo)}
                                  alt={vendor.name || vendor.company || 'Vendor'}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold ${vendor.logo ? 'hidden' : ''}`}>
                                {(vendor.company || vendor.name || 'V').charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div 
                                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer hover:underline transition-colors duration-200"
                                onClick={() => handleViewDocuments(vendor._id)}
                                title="Click to view documents"
                              >
                                {vendor.company || 'N/A'}
                              </div>
                              <div 
                                className="text-sm text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer hover:underline transition-colors duration-200"
                                onClick={() => handleViewDocuments(vendor._id)}
                                title="Click to view documents"
                              >
                                {vendor.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{vendor.email}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{vendor.phone || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={vendor.isActive ? 'success' : 'danger'}>
                            {vendor.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {vendor.analytics ? (
                            <div className="flex flex-col">
                              <div className="text-sm text-gray-900 dark:text-white">
                                Total: {vendor.analytics.totalDocuments}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                <span className="text-green-600 dark:text-green-400">{vendor.analytics.approvedDocuments} Approved</span> / 
                                <span className="text-yellow-600 dark:text-yellow-400"> {vendor.analytics.pendingDocuments} Pending</span> / 
                                <span className="text-red-600 dark:text-red-400"> {vendor.analytics.rejectedDocuments} Rejected</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">No data</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {vendor.analytics ? (
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                                <div 
                                  className={`h-2.5 rounded-full ${
                                    vendor.analytics.complianceRate >= 80 ? 'bg-green-600' : 
                                    vendor.analytics.complianceRate >= 50 ? 'bg-yellow-500' : 'bg-red-600'
                                  }`}
                                  style={{ width: `${vendor.analytics.complianceRate}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-900 dark:text-white">
                                {vendor.analytics.complianceRate}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">No data</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {vendor.analytics?.lastActivity ? formatDate(vendor.analytics.lastActivity) : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<EyeIcon className="h-4 w-4" />}
                            onClick={() => handleViewDocuments(vendor._id)}
                          >
                            View Documents
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default VendorsList;