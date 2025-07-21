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
  faFileContract
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
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <Button
              variant="outlined"
              startIcon={<FontAwesomeIcon icon={faArrowLeft} />}
              onClick={() => navigate('/admin/vendors')}
              className="shrink-0"
            >
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Vendor Details
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                View and manage vendor information
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outlined"
              startIcon={<FontAwesomeIcon icon={faEdit} />}
              onClick={() => navigate(`/admin/vendors/${vendor._id}/edit`)}
              color="primary"
            >
              Edit Vendor
            </Button>
            <Button
              variant="outlined"
              startIcon={<FontAwesomeIcon icon={faTrash} />}
              onClick={handleDelete}
              disabled={deleteLoading}
              color="error"
            >
              {deleteLoading ? <CircularProgress size={20} /> : 'Delete Vendor'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                  {vendor.logo ? (
                    <img 
                      src={getFullImageUrl(vendor.logo)} 
                      alt={vendor.name} 
                      className="h-16 w-16 rounded-full object-cover"
                      onError={(e) => {
                        console.error('Failed to load vendor logo:', vendor.logo);
                        // Hide the image and show initials instead
                        e.currentTarget.style.display = 'none';
                        const initialsDiv = e.currentTarget.nextElementSibling as HTMLElement;
                        if (initialsDiv) {
                          initialsDiv.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className="h-16 w-16 rounded-full bg-primary-500 flex items-center justify-center text-white text-xl font-bold"
                    style={{ display: vendor.logo ? 'none' : 'flex' }}
                  >
                    {getInitials(vendor.name)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                      {vendor.name || 'N/A'}
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {vendor.companyName || vendor.email}
                    </p>
                    <div className="flex items-center mt-2">
                      {getStatusIcon(vendor.status)}
                      <span className={`ml-2 text-sm font-medium ${
                        vendor.status === 'active' ? 'text-green-600' : 
                        vendor.status === 'inactive' ? 'text-red-600' : 
                        'text-amber-600'
                      }`}>
                        {vendor.status ? (vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)) : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <FontAwesomeIcon icon={faEnvelope} className="text-neutral-500 w-5" />
                        <div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Email</p>
                          <p className="text-neutral-900 dark:text-white">{vendor.email}</p>
                        </div>
                      </div>
                      
                      {vendor.phone && (
                        <div className="flex items-center space-x-3">
                          <FontAwesomeIcon icon={faPhone} className="text-neutral-500 w-5" />
                          <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Phone</p>
                            <p className="text-neutral-900 dark:text-white">{vendor.phone}</p>
                          </div>
                        </div>
                      )}

                      {vendor.industry && (
                        <div className="flex items-center space-x-3">
                          <FontAwesomeIcon icon={faBuilding} className="text-neutral-500 w-5" />
                          <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Industry</p>
                            <p className="text-neutral-900 dark:text-white">{vendor.industry}</p>
                          </div>
                        </div>
                      )}

                      {vendor.location && (
                        <div className="flex items-center space-x-3">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-neutral-500 w-5" />
                          <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Location</p>
                            <p className="text-neutral-900 dark:text-white">{vendor.location}</p>
                          </div>
                        </div>
                      )}

                      {vendor.workLocation && (
                        <div className="flex items-center space-x-3">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-neutral-500 w-5" />
                          <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Work Location</p>
                            <p className="text-neutral-900 dark:text-white">{vendor.workLocation}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-3">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-neutral-500 w-5" />
                        <div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Agreement Period</p>
                          <p className="text-neutral-900 dark:text-white font-medium">
                            {vendor.agreementPeriod || 'Annual Contract'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="space-y-4">
                      {vendor.contactPerson && (
                        <div className="flex items-center space-x-3">
                          <FontAwesomeIcon icon={faUser} className="text-neutral-500 w-5" />
                          <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Contact Person</p>
                            <p className="text-neutral-900 dark:text-white">{vendor.contactPerson}</p>
                          </div>
                        </div>
                      )}

                      {vendor.registrationNumber && (
                        <div className="flex items-center space-x-3">
                          <FontAwesomeIcon icon={faIdCard} className="text-neutral-500 w-5" />
                          <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Registration Number</p>
                            <p className="text-neutral-900 dark:text-white">{vendor.registrationNumber}</p>
                          </div>
                        </div>
                      )}

                      {vendor.taxId && (
                        <div className="flex items-center space-x-3">
                          <FontAwesomeIcon icon={faIdCard} className="text-neutral-500 w-5" />
                          <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Tax ID</p>
                            <p className="text-neutral-900 dark:text-white">{vendor.taxId}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-3">
                        <FontAwesomeIcon icon={faFileAlt} className="text-neutral-500 w-5" />
                        <div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Documents</p>
                          <p className="text-neutral-900 dark:text-white">{vendor.documentsCount || 0} Documents</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <FontAwesomeIcon icon={faUserTie} className="text-neutral-500 w-5" />
                        <div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Assigned Consultant</p>
                          {vendor.assignedConsultant ? (
                            <div>
                              <p className="text-neutral-900 dark:text-white font-medium">
                                {vendor.assignedConsultant.name}
                              </p>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                {vendor.assignedConsultant.email}
                              </p>
                              {vendor.assignedConsultant.phone && (
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                  {vendor.assignedConsultant.phone}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-neutral-500 dark:text-neutral-400 italic">No consultant assigned</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {vendor.address && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Address</p>
                      <p className="text-neutral-900 dark:text-white">{vendor.address}</p>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* Side Info Card */}
          <div>
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                  Account Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Role</p>
                    <Chip 
                      label={vendor.role.charAt(0).toUpperCase() + vendor.role.slice(1)} 
                      color="primary" 
                      size="small" 
                    />
                  </div>

                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Member Since</p>
                    <p className="text-neutral-900 dark:text-white">
                      {new Date(vendor.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Last Updated</p>
                    <p className="text-neutral-900 dark:text-white">
                      {new Date(vendor.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {vendor.lastLogin && (
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Last Login</p>
                      <p className="text-neutral-900 dark:text-white">
                        {new Date(vendor.lastLogin).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default VendorDetailPage;