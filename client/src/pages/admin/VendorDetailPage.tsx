import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Button,
  CircularProgress,
  Chip,
  Alert
} from '@mui/material';
import { FontAwesomeIcon } from '../../utils/icons';
import { 
  faArrowLeft,
  faEdit,
  faTrash,
  faBuilding,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faCalendarAlt,
  faFileAlt,
  faCheckCircle,
  faTimesCircle,
  faExclamationCircle,
  faUser,
  faIdCard,
  faUserTie,
  faFileContract,
  faChartLine,
  faHistory,
  faGlobe
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import apiService from '../../utils/api';
import { getFullImageUrl } from '../../utils/imageUtils';

interface VendorDetail {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  industry?: string;
  location?: string;
  documentsCount?: number;
  companyName?: string;
  contactPerson?: string;
  address?: string;
  website?: string;
  taxId?: string;
  registrationNumber?: string;
  logo?: string;
  workLocation?: string;
  agreementPeriod?: string;
  companyRegNo?: string;
  assignedConsultant?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

const VendorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    // Reset state when ID changes
    setVendor(null);
    setError(null);
    setLoading(true);
    
    if (id) {
      fetchVendorDetails();
    } else {
      setError('No vendor ID provided');
      setLoading(false);
    }
  }, [id]);

  const fetchVendorDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.users.getById(id!);
      setVendor(response.data.data);
    } catch (error: any) {
      console.error('Error fetching vendor details:', error);
      setError(error?.response?.data?.message || 'Failed to fetch vendor details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!vendor) return;
    
    if (!window.confirm(`Are you sure you want to delete vendor "${vendor.name || vendor.email}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleteLoading(true);
      await apiService.users.delete(vendor._id);
      alert('Vendor deleted successfully');
      navigate('/admin/vendors');
    } catch (error: any) {
      console.error('Error deleting vendor:', error);
      alert(error?.response?.data?.message || 'Failed to delete vendor');
    } finally {
      setDeleteLoading(false);
    }
  };

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

  const getRandomColor = (vendor: any) => {
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
    
    const id = vendor?._id;
    if (!id) return colors[0];
    
    const index = id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <CircularProgress />
        </div>
      </MainLayout>
    );
  }

  if (error || !vendor) {
    return (
      <MainLayout>
        <div className="p-6">
          <Alert severity="error" className="mb-4">
            {error || 'Vendor not found'}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<FontAwesomeIcon icon={faArrowLeft} />}
            onClick={() => navigate('/admin/vendors')}
          >
            Back to Vendors
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900">
        {/* Compact Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-10">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FontAwesomeIcon icon={faArrowLeft} />}
                  onClick={() => navigate('/admin/vendors')}
                  className="!text-xs !py-1 !px-2"
                >
                  Back
                </Button>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Vendor Profile
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Business details and partnership overview
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<FontAwesomeIcon icon={faEdit} />}
                  onClick={() => navigate(`/users/edit/${vendor._id}`)}
                  className="!bg-gradient-to-r !from-blue-500 !to-indigo-500 !text-white !text-xs !py-1 !px-3"
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  startIcon={deleteLoading ? <CircularProgress size={12} /> : <FontAwesomeIcon icon={faTrash} />}
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="!text-xs !py-1 !px-3"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Optimized for no scrolling */}
        <div className="px-4 py-4">
          <div className="grid grid-cols-12 gap-4 max-w-7xl mx-auto">
            
            {/* Profile Section - Compact */}
            <div className="col-span-12 lg:col-span-4">
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 overflow-hidden">
                {/* Profile Header with Gradient */}
                <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 p-4 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative z-10 text-center">
                    <div className="mb-3">
                      {vendor.logo ? (
                        <img 
                          src={getFullImageUrl(vendor.logo)} 
                          alt={vendor.name} 
                          className="h-16 w-16 rounded-full mx-auto object-cover border-3 border-white/30"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const initialsDiv = e.currentTarget.nextElementSibling as HTMLElement;
                            if (initialsDiv) {
                              initialsDiv.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className="h-16 w-16 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm text-white text-lg font-bold mx-auto border-2 border-white/30"
                        style={{ display: vendor.logo ? 'none' : 'flex' }}
                      >
                        {getInitials(vendor.name)}
                      </div>
                    </div>
                    
                    <h2 className="text-lg font-bold mb-1">
                      {vendor.name || 'Unknown Vendor'}
                    </h2>
                    
                    {vendor.companyName && (
                      <p className="text-sm text-white/80 mb-2">
                        {vendor.companyName}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-center mb-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        vendor.status === 'active' ? 'bg-green-500/20 text-green-100' :
                        vendor.status === 'inactive' ? 'bg-red-500/20 text-red-100' :
                        'bg-yellow-500/20 text-yellow-100'
                      }`}>
                      </div>
                    </div>

                    <div className="text-sm text-white/80">
                      <div className="flex items-center justify-center mb-1">
                        <FontAwesomeIcon icon={faBuilding} className="w-3 h-3 mr-2" />
                        <span>{vendor.industry || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3 mr-2" />
                        <span>{vendor.location || vendor.workLocation || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                
                
              </div>
            </div>

            {/* Information Grid - Compact */}
            <div className="col-span-12 lg:col-span-8">
              <div className="grid grid-cols-1 gap-4 h-full">
                
                {/* Contact & Business Info Combined */}
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 p-4">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3 flex items-center">
                    <FontAwesomeIcon icon={faBuilding} className="w-4 h-4 mr-2 text-blue-500" />
                    Contact & Business Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <FontAwesomeIcon icon={faEnvelope} className="text-gray-400 mr-3 w-4" />
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Email</div>
                          <div className="text-gray-900 dark:text-white font-medium">{vendor.email}</div>
                        </div>
                      </div>
                      
                      {vendor.phone && (
                        <div className="flex items-center text-sm">
                          <FontAwesomeIcon icon={faPhone} className="text-gray-400 mr-3 w-4" />
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Phone</div>
                            <div className="text-gray-900 dark:text-white font-medium">{vendor.phone}</div>
                          </div>
                        </div>
                      )}

                      {vendor.contactPerson && (
                        <div className="flex items-center text-sm">
                          <FontAwesomeIcon icon={faUser} className="text-gray-400 mr-3 w-4" />
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Contact Person</div>
                            <div className="text-gray-900 dark:text-white font-medium">{vendor.contactPerson}</div>
                          </div>
                        </div>
                      )}

                      {vendor.website && (
                        <div className="flex items-center text-sm">
                          <FontAwesomeIcon icon={faGlobe} className="text-gray-400 mr-3 w-4" />
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Website</div>
                            <a 
                              href={vendor.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
                            >
                              {vendor.website}
                            </a>
                          </div>
                        </div>
                      )}

                      {vendor.address && (
                        <div className="flex items-start text-sm">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400 mr-3 w-4 mt-1" />
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Address</div>
                            <div className="text-gray-900 dark:text-white font-medium">{vendor.address}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {vendor.registrationNumber && (
                        <div className="flex items-center text-sm">
                          <FontAwesomeIcon icon={faIdCard} className="text-gray-400 mr-3 w-4" />
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Registration</div>
                            <div className="text-gray-900 dark:text-white font-medium">{vendor.registrationNumber}</div>
                          </div>
                        </div>
                      )}

                      {vendor.taxId && (
                        <div className="flex items-center text-sm">
                          <FontAwesomeIcon icon={faIdCard} className="text-gray-400 mr-3 w-4" />
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Tax ID</div>
                            <div className="text-gray-900 dark:text-white font-medium">{vendor.taxId}</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center text-sm">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 mr-3 w-4" />
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Agreement Period</div>
                          <div className="text-gray-900 dark:text-white font-medium">{vendor.agreementPeriod || 'Annual Contract'}</div>
                        </div>
                      </div>

                      <div className="flex items-center text-sm">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 mr-3 w-4" />
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Member Since</div>
                          <div className="text-gray-900 dark:text-white font-medium">
                            {new Date(vendor.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {vendor.lastLogin && (
                        <div className="flex items-center text-sm">
                          <FontAwesomeIcon icon={faHistory} className="text-gray-400 mr-3 w-4" />
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Last Login</div>
                            <div className="text-gray-900 dark:text-white font-medium">
                              {new Date(vendor.lastLogin).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assigned Consultant - Compact */}
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white flex items-center">
                      <FontAwesomeIcon icon={faUserTie} className="w-4 h-4 mr-2 text-purple-500" />
                      Assigned Consultant
                    </h3>
                  </div>
                  
                  {vendor.assignedConsultant ? (
                    <div className="flex items-center p-3 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/20 rounded-lg hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-600 dark:hover:to-blue-800/30 transition-all duration-200">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold mr-3">
                        {getInitials(vendor.assignedConsultant.name)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {vendor.assignedConsultant.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {vendor.assignedConsultant.email}
                        </p>
                        {vendor.assignedConsultant.phone && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {vendor.assignedConsultant.phone}
                          </p>
                        )}
                      </div>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/admin/consultants/${vendor.assignedConsultant?._id}`)}
                        className="!text-xs !py-1 !px-2"
                      >
                        View
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <FontAwesomeIcon 
                        icon={faUserTie} 
                        className="text-3xl text-gray-300 dark:text-gray-600 mb-2" 
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No consultant assigned to this vendor
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default VendorDetailPage;