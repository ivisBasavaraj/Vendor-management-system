import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Avatar,
  GridLegacy as Grid,
  Card as MuiCard,
  CardContent,
  CardActions,
  Divider
} from '@mui/material';
import { FontAwesomeIcon } from '../../utils/icons';
import { 
  faSearch, 
  faEye, 
  faEdit, 
  faTrash,
  faFilter,
  faPlus,
  faBuilding,
  faFileAlt,
  faCalendarAlt,
  faEnvelope,
  faPhone,
  faCheckCircle,
  faTimesCircle,
  faExclamationCircle,
  faUserTie
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../../components/layout/MainLayout';
import apiService from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';

// Mock data for vendors
const mockVendors = [
  { 
    id: '1', 
    name: 'ABC Supplies', 
    email: 'contact@abcsupplies.com', 
    phone: '+91 9876543210', 
    status: 'active',
    documentsCount: 12,
    lastActivity: '2023-06-15',
    logo: 'https://via.placeholder.com/100x100/0976ce/ffffff?text=ABC',
    location: 'Mumbai, India',
    industry: 'Manufacturing'
  },
  { 
    id: '2', 
    name: 'XYZ Manufacturing', 
    email: 'info@xyzmanufacturing.com', 
    phone: '+91 8765432109', 
    status: 'active',
    documentsCount: 8,
    lastActivity: '2023-06-14',
    logo: 'https://via.placeholder.com/100x100/7c3aed/ffffff?text=XYZ',
    location: 'Delhi, India',
    industry: 'Electronics'
  },
  { 
    id: '3', 
    name: 'Global Logistics', 
    email: 'support@globallogistics.com', 
    phone: '+91 7654321098', 
    status: 'inactive',
    documentsCount: 5,
    lastActivity: '2023-05-30',
    logo: 'https://via.placeholder.com/100x100/16a34a/ffffff?text=GL',
    location: 'Bangalore, India',
    industry: 'Logistics'
  },
  { 
    id: '4', 
    name: 'Tech Solutions', 
    email: 'help@techsolutions.com', 
    phone: '+91 6543210987', 
    status: 'active',
    documentsCount: 15,
    lastActivity: '2023-06-12',
    logo: 'https://via.placeholder.com/100x100/dc2626/ffffff?text=TS',
    location: 'Chennai, India',
    industry: 'IT Services'
  },
  { 
    id: '5', 
    name: 'Industrial Parts', 
    email: 'sales@industrialparts.com', 
    phone: '+91 5432109876', 
    status: 'pending',
    documentsCount: 3,
    lastActivity: '2023-06-10',
    logo: null, // Keep some without logos to test fallback
    location: 'Hyderabad, India',
    industry: 'Industrial'
  },
  { 
    id: '6', 
    name: 'Precision Tools', 
    email: 'info@precisiontools.com', 
    phone: '+91 4321098765', 
    status: 'active',
    documentsCount: 9,
    lastActivity: '2023-06-08',
    logo: 'https://via.placeholder.com/100x100/6b7280/ffffff?text=PT',
    location: 'Pune, India',
    industry: 'Manufacturing'
  },
  { 
    id: '7', 
    name: 'Rapid Delivery', 
    email: 'contact@rapiddelivery.com', 
    phone: '+91 3210987654', 
    status: 'active',
    documentsCount: 7,
    lastActivity: '2023-06-07',
    logo: null, // Keep some without logos to test fallback
    location: 'Kolkata, India',
    industry: 'Logistics'
  },
  { 
    id: '8', 
    name: 'Smart Electronics', 
    email: 'support@smartelectronics.com', 
    phone: '+91 2109876543', 
    status: 'inactive',
    documentsCount: 4,
    lastActivity: '2023-06-05',
    logo: 'https://via.placeholder.com/100x100/f59e0b/ffffff?text=SE',
    location: 'Ahmedabad, India',
    industry: 'Electronics'
  },
];

const VendorsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [logoErrors, setLogoErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      // Use the API service to fetch real vendor data
      const response = await apiService.users.getVendors();
      setVendors(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setLoading(false);
      // If API fails, fall back to mock data for development
      if (process.env.NODE_ENV === 'development') {
        setVendors(mockVendors);
      }
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleDelete = async (vendor: any) => {
    if (!window.confirm(`Are you sure you want to delete vendor "${vendor.name || vendor.email}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleteLoading(vendor._id || vendor.id);
      await apiService.users.delete(vendor._id || vendor.id);
      
      // Refresh the vendors list
      await fetchVendors();
      alert('Vendor deleted successfully');
    } catch (error: any) {
      console.error('Error deleting vendor:', error);
      alert(error?.response?.data?.message || 'Failed to delete vendor');
    } finally {
      setDeleteLoading(null);
    }
  };

  const filteredVendors = vendors.filter(vendor => 
    (vendor.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (vendor.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (vendor.industry?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (vendor.location?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />;
      case 'inactive':
        return <FontAwesomeIcon icon={faTimesCircle} className="text-red-500" />;
      case 'pending':
        return <FontAwesomeIcon icon={faExclamationCircle} className="text-amber-500" />;
      default:
        return null;
    }
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return 'N/A';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRandomColor = (id: string | undefined) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-green-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-teal-500'
    ];
    
    // If id is undefined, return a random color
    if (!id) {
      return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Use the id to deterministically select a color
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const handleLogoError = (vendorId: string) => {
    setLogoErrors(prev => new Set(prev).add(vendorId));
  };

  const VendorLogo: React.FC<{ 
    vendor: any; 
    size: 'small' | 'large'; 
    className?: string;
  }> = ({ vendor, size, className = '' }) => {
    const vendorId = vendor._id || vendor.id;
    const hasLogoError = logoErrors.has(vendorId);
    const logoUrl = vendor.logo;
    
    // Size classes
    const sizeClasses = size === 'small' 
      ? 'h-10 w-10 text-sm' 
      : 'h-16 w-16 text-xl';
    
    // If no logo URL or logo failed to load, show initials
    if (!logoUrl || hasLogoError) {
      return (
        <div className={`${sizeClasses} rounded-full flex items-center justify-center text-white font-bold ${getRandomColor(vendorId)} ${className}`}>
          {getInitials(vendor.name)}
        </div>
      );
    }
    
    // Show logo image
    return (
      <img 
        src={logoUrl} 
        alt={vendor.name || 'Vendor Logo'} 
        className={`${sizeClasses} ${size === 'small' ? 'rounded-full' : 'object-contain'} ${className}`}
        onError={() => handleLogoError(vendorId)}
        onLoad={() => {
          // Remove from error set if image loads successfully
          setLogoErrors(prev => {
            const newSet = new Set(prev);
            newSet.delete(vendorId);
            return newSet;
          });
        }}
      />
    );
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Vendors Management
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Manage all vendor accounts and their documents
            </p>
          </div>

        </div>

        <Card className="mb-8">
          <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search vendors by name, email, location..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md ${viewMode === 'table' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <FontAwesomeIcon icon={faFilter} />
              </button>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <CircularProgress />
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVendors
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((vendor) => (
                    <Card 
                      key={vendor._id || vendor.id} 
                      className="overflow-hidden hover:shadow-lg transition-all duration-200"
                      hover
                    >
                      <div className="h-24 bg-gradient-to-r from-primary-500 to-primary-700 flex items-center justify-center">
                        <VendorLogo vendor={vendor} size="large" />
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white truncate">
                            {vendor.name || 'N/A'}
                          </h3>
                          <div className="flex items-center">
                            {getStatusIcon(vendor.status)}
                            <span className={`ml-1 text-xs ${
                              vendor.status === 'active' ? 'text-green-500' : 
                              vendor.status === 'inactive' ? 'text-red-500' : 
                              'text-amber-500'
                            }`}>
                              {vendor.status ? (vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)) : 'Unknown'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                          <div className="flex items-center mb-1">
                            <FontAwesomeIcon icon={faBuilding} className="w-4 h-4 mr-2 text-neutral-500" />
                            <span className="truncate">{vendor.industry || 'N/A'}</span>
                          </div>
                          <div className="flex items-center mb-1">
                            <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 mr-2 text-neutral-500" />
                            <span className="truncate">{vendor.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center mb-1">
                            <FontAwesomeIcon icon={faPhone} className="w-4 h-4 mr-2 text-neutral-500" />
                            <span>{vendor.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faFileAlt} className="w-4 h-4 mr-2 text-neutral-500" />
                            <span>{vendor.documentsCount || 0} Documents</span>
                          </div>
                          <div className="flex items-center mb-1">
                            <FontAwesomeIcon icon={faUserTie} className="w-4 h-4 mr-2 text-neutral-500" />
                            <span className="truncate">
                              {vendor.assignedConsultant ? vendor.assignedConsultant.name : 'No consultant'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2 text-neutral-500" />
                            <span className="truncate text-xs">
                              {vendor.agreementPeriod || 'Annual Contract'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-3 border-t border-neutral-200 dark:border-neutral-700">
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center">
                            <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3 mr-1" />
                            <span>Last active: {vendor.lastActivity || 'N/A'}</span>
                          </div>
                          <div className="flex space-x-1">
                            <button 
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded-full dark:hover:bg-blue-900/30"
                              onClick={() => navigate(`/admin/vendors/${vendor._id || vendor.id}`)}
                              title="View Details"
                            >
                              <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-1 text-amber-600 hover:bg-amber-100 rounded-full dark:hover:bg-amber-900/30"
                              onClick={() => navigate(`/admin/vendors/${vendor._id || vendor.id}/edit`)}
                              title="Edit Vendor"
                            >
                              <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-1 text-red-600 hover:bg-red-100 rounded-full dark:hover:bg-red-900/30"
                              onClick={() => handleDelete(vendor)}
                              disabled={deleteLoading === (vendor._id || vendor.id)}
                              title="Delete Vendor"
                            >
                              {deleteLoading === (vendor._id || vendor.id) ? (
                                <CircularProgress size={16} />
                              ) : (
                                <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                    <thead className="bg-neutral-50 dark:bg-neutral-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Vendor
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Contact
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Industry
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Documents
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Assigned Consultant
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Last Activity
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                      {filteredVendors
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((vendor) => (
                          <tr key={vendor._id || vendor.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-750">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <VendorLogo vendor={vendor} size="small" />
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-neutral-900 dark:text-white">
                                    {vendor.name || 'N/A'}
                                  </div>
                                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                    {vendor.location || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-neutral-900 dark:text-white">{vendor.email || 'N/A'}</div>
                              <div className="text-sm text-neutral-500 dark:text-neutral-400">{vendor.phone || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-neutral-900 dark:text-white">{vendor.industry || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                vendor.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                                vendor.status === 'inactive' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}>
                                {vendor.status ? (vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)) : 'Unknown'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                              {vendor.documentsCount || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {vendor.assignedConsultant ? (
                                <div>
                                  <div className="text-sm font-medium text-neutral-900 dark:text-white">
                                    {vendor.assignedConsultant.name}
                                  </div>
                                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                    {vendor.assignedConsultant.email}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-neutral-500 dark:text-neutral-400 italic">
                                  No consultant assigned
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                              {vendor.lastActivity || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button 
                                className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 mr-3"
                                onClick={() => navigate(`/admin/vendors/${vendor._id || vendor.id}`)}
                                title="View Details"
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                              <button 
                                className="text-amber-600 hover:text-amber-900 dark:hover:text-amber-400 mr-3"
                                onClick={() => navigate(`/admin/vendors/${vendor._id || vendor.id}/edit`)}
                                title="Edit Vendor"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button 
                                className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                                onClick={() => handleDelete(vendor)}
                                disabled={deleteLoading === (vendor._id || vendor.id)}
                                title="Delete Vendor"
                              >
                                {deleteLoading === (vendor._id || vendor.id) ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <FontAwesomeIcon icon={faTrash} />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      {filteredVendors.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-6 py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                            No vendors found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Showing {Math.min(page * rowsPerPage + 1, filteredVendors.length)} to {Math.min((page + 1) * rowsPerPage, filteredVendors.length)} of {filteredVendors.length} vendors
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className={`p-2 rounded-md border border-neutral-300 dark:border-neutral-700 ${page === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-600 dark:text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                {[...Array(Math.ceil(filteredVendors.length / rowsPerPage))].slice(0, 5).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-10 h-10 rounded-md ${page === i ? 'bg-primary-600 text-white' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(Math.ceil(filteredVendors.length / rowsPerPage) - 1, page + 1))}
                  disabled={page >= Math.ceil(filteredVendors.length / rowsPerPage) - 1}
                  className={`p-2 rounded-md border border-neutral-300 dark:border-neutral-700 ${page >= Math.ceil(filteredVendors.length / rowsPerPage) - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-600 dark:text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default VendorsPage;