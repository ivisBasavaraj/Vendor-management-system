import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import apiService from '../../utils/api';

interface Vendor {
  _id: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: 'active' | 'inactive' | 'pending';
  documentCount?: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  lastSubmission?: string;
  assignedConsultant?: {
    _id: string;
    name: string;
    email: string;
  };
}

const VendorListPage: React.FC = () => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);

  // Fetch vendors
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        const response = await apiService.users.getVendors();
        if (response.data.success) {
          setVendors(response.data.data);
          setFilteredVendors(response.data.data);
        } else {
          setError('Failed to fetch vendors');
        }
      } catch (err: any) {
        // For development, use mock data
        if (process.env.NODE_ENV === 'development') {
          const mockVendors: Vendor[] = [
            {
              _id: '1',
              name: 'John Smith',
              company: 'Acme Corporation',
              email: 'john@acme.com',
              phone: '+1 (555) 123-4567',
              address: '123 Main St, Anytown, USA',
              status: 'active',
              documentCount: {
                total: 15,
                pending: 3,
                approved: 10,
                rejected: 2
              },
              lastSubmission: '2023-06-15T10:30:00Z',
              assignedConsultant: {
                _id: user?._id || '1',
                name: user?.name || 'Jane Consultant',
                email: user?.email || 'jane@example.com'
              }
            },
            {
              _id: '2',
              name: 'Sarah Johnson',
              company: 'TechSystems Inc.',
              email: 'sarah@techsystems.com',
              phone: '+1 (555) 987-6543',
              address: '456 Tech Blvd, Innovation City, USA',
              status: 'active',
              documentCount: {
                total: 8,
                pending: 1,
                approved: 7,
                rejected: 0
              },
              lastSubmission: '2023-06-20T14:45:00Z',
              assignedConsultant: {
                _id: user?._id || '1',
                name: user?.name || 'Jane Consultant',
                email: user?.email || 'jane@example.com'
              }
            },
            {
              _id: '3',
              name: 'Michael Brown',
              company: 'Global Supplies Ltd.',
              email: 'michael@globalsupplies.com',
              phone: '+1 (555) 456-7890',
              address: '789 Supply Chain Road, Logistics Town, USA',
              status: 'inactive',
              documentCount: {
                total: 5,
                pending: 0,
                approved: 3,
                rejected: 2
              },
              lastSubmission: '2023-05-10T09:15:00Z',
              assignedConsultant: {
                _id: user?._id || '1',
                name: user?.name || 'Jane Consultant',
                email: user?.email || 'jane@example.com'
              }
            },
            {
              _id: '4',
              name: 'Emily Davis',
              company: 'Innovative Solutions',
              email: 'emily@innovative.com',
              phone: '+1 (555) 789-0123',
              address: '321 Innovation Way, Future City, USA',
              status: 'pending',
              documentCount: {
                total: 0,
                pending: 0,
                approved: 0,
                rejected: 0
              },
              assignedConsultant: {
                _id: user?._id || '1',
                name: user?.name || 'Jane Consultant',
                email: user?.email || 'jane@example.com'
              }
            }
          ];
          setVendors(mockVendors);
          setFilteredVendors(mockVendors);
        } else {
          setError(err.message || 'An error occurred while fetching vendors');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, [user]);

  // Filter vendors based on search query and status filter
  useEffect(() => {
    let filtered = vendors;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(vendor => 
        (vendor.name && vendor.name.toLowerCase().includes(query)) ||
        (vendor.company && vendor.company.toLowerCase().includes(query)) ||
        (vendor.email && vendor.email.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vendor => vendor.status && vendor.status === statusFilter);
    }
    
    setFilteredVendors(filtered);
  }, [vendors, searchQuery, statusFilter]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by the useEffect
  };

  // Toggle vendor details
  const toggleVendorDetails = (vendorId: string) => {
    if (expandedVendor === vendorId) {
      setExpandedVendor(null);
    } else {
      setExpandedVendor(vendorId);
    }
  };

  // Export vendors to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Company', 'Email', 'Phone', 'Status', 'Total Documents', 'Pending', 'Approved', 'Rejected'];
    const csvData = filteredVendors.map(vendor => [
      vendor.name || 'Unknown',
      vendor.company || 'No Company',
      vendor.email || 'No Email',
      vendor.phone || 'No Phone',
      vendor.status || 'Unknown',
      (vendor.documentCount?.total || 0).toString(),
      (vendor.documentCount?.pending || 0).toString(),
      (vendor.documentCount?.approved || 0).toString(),
      (vendor.documentCount?.rejected || 0).toString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'vendors.csv');
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor List</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View and manage all vendors assigned to you
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button
              leftIcon={<ArrowDownTrayIcon className="h-5 w-5" />}
              onClick={exportToCSV}
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

        {/* Filters and Search */}
        <Card className="mb-6">
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <form onSubmit={handleSearch} className="flex w-full">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Search vendors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="ml-2 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Search
                  </button>
                </form>
              </div>

              <div className="md:w-64">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FunnelIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Vendors List */}
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No vendors found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No vendors are currently assigned to you.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVendors.map((vendor) => (
              <Card key={vendor._id}>
                <div className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {vendor.company || 'No Company'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">{vendor.name || 'Unknown'}</p>
                    </div>
                    <div className="mt-2 md:mt-0 flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        !vendor.status
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          : vendor.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : vendor.status === 'inactive'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {vendor.status ? vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1) : 'Unknown'}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleVendorDetails(vendor._id)}
                      >
                        {expandedVendor === vendor._id ? 'Hide Details' : 'View Details'}
                      </Button>
                      <Button
                        size="sm"
                        as={Link}
                        to={`/vendors/${vendor._id}/documents`}
                      >
                        View Documents
                      </Button>
                    </div>
                  </div>
                  
                  {/* Document Statistics */}
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Total Documents</div>
                      <div className="text-xl font-semibold">{vendor.documentCount?.total || 0}</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                      <div className="text-sm text-blue-500 dark:text-blue-400">Pending</div>
                      <div className="text-xl font-semibold text-blue-600 dark:text-blue-300">{vendor.documentCount?.pending || 0}</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
                      <div className="text-sm text-green-500 dark:text-green-400">Approved</div>
                      <div className="text-xl font-semibold text-green-600 dark:text-green-300">{vendor.documentCount?.approved || 0}</div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">
                      <div className="text-sm text-red-500 dark:text-red-400">Rejected</div>
                      <div className="text-xl font-semibold text-red-600 dark:text-red-300">{vendor.documentCount?.rejected || 0}</div>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedVendor === vendor._id && (
                    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Contact Information</h4>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                              <a href={`mailto:${vendor.email || ''}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                                {vendor.email || 'No email provided'}
                              </a>
                            </div>
                            <div className="flex items-center">
                              <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                              <a href={`tel:${vendor.phone || ''}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                                {vendor.phone || 'No phone provided'}
                              </a>
                            </div>
                            <div className="flex items-start">
                              <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                              <span className="text-gray-700 dark:text-gray-300">{vendor.address || 'No address provided'}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Document Information</h4>
                          <div className="space-y-2">
                            {vendor.lastSubmission && (
                              <div className="flex items-center">
                                <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                                <span className="text-gray-700 dark:text-gray-300">
                                  Last Submission: {new Date(vendor.lastSubmission).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center">
                              <CheckCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                              <span className="text-gray-700 dark:text-gray-300">
                                Compliance Status: {(vendor.documentCount?.approved || 0) > 0 ? 'Compliant' : 'Non-compliant'}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4">
                            <Button
                              as={Link}
                              to={`/compliance-verification/${vendor._id}`}
                              size="sm"
                              variant="outline"
                              className="w-full"
                            >
                              Compliance Verification
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default VendorListPage;