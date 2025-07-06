import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Button,
  CircularProgress,
  Chip,
  Alert,
  Divider
} from '@mui/material';
import { FontAwesomeIcon } from '../../utils/icons';
import { 
  faArrowLeft,
  faEdit,
  faTrash,
  faUser,
  faEnvelope,
  faPhone,
  faBuilding,
  faMapMarkerAlt,
  faIdCard,
  faGlobe,
  faUserTie,
  faBriefcase,
  faFileAlt,
  faCalendarAlt,
  faCheckCircle,
  faTimesCircle,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import apiService from '../../utils/api';
import { getFullImageUrl } from '../../utils/imageUtils';

// Mock data for development fallback
const mockConsultants = [
  { 
    _id: '1',
    id: '1', 
    name: 'John Smith', 
    email: 'john.smith@example.com', 
    phone: '+91 9876543210', 
    department: 'Engineering',
    documentsReviewed: 45,
    lastActivity: '2023-06-15',
    avatar: undefined,
    role: 'Senior Consultant',
    status: 'active',
    address: '123 Main St, City, State 12345',
    website: 'https://johnsmith.com',
    taxId: 'TAX123456',
    registrationNumber: 'REG789012',
    createdAt: '2023-01-15T10:30:00Z',
    updatedAt: '2023-06-15T14:20:00Z'
  },
  { 
    _id: '2',
    id: '2', 
    name: 'Sarah Johnson', 
    email: 'sarah.johnson@example.com', 
    phone: '+91 8765432109', 
    department: 'Quality Control',
    documentsReviewed: 32,
    lastActivity: '2023-06-14',
    avatar: undefined,
    role: 'Quality Analyst',
    status: 'active',
    address: '456 Oak Ave, City, State 67890',
    website: 'https://sarahjohnson.com',
    taxId: 'TAX654321',
    registrationNumber: 'REG210987',
    createdAt: '2023-02-10T09:15:00Z',
    updatedAt: '2023-06-14T16:45:00Z'
  },
  { 
    _id: '3',
    id: '3', 
    name: 'Michael Brown', 
    email: 'michael.brown@example.com', 
    phone: '+91 7654321098', 
    department: 'Finance',
    documentsReviewed: 18,
    lastActivity: '2023-06-12',
    avatar: undefined,
    role: 'Financial Advisor',
    status: 'inactive',
    address: '789 Pine St, City, State 54321',
    website: undefined,
    taxId: 'TAX987654',
    registrationNumber: 'REG543210',
    createdAt: '2023-03-05T11:00:00Z',
    updatedAt: '2023-06-12T13:30:00Z'
  }
];

interface ConsultantData {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  role?: string;
  department?: string;
  documentsReviewed?: number;
  lastActivity?: string;
  avatar?: string;
  logo?: string;
  address?: string;
  website?: string;
  taxId?: string;
  registrationNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  assignedVendorsCount?: number;
}

interface AssignedVendor {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status?: string;
  createdAt?: string;
}

const ConsultantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consultant, setConsultant] = useState<ConsultantData | null>(null);
  const [assignedVendors, setAssignedVendors] = useState<AssignedVendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    console.log('ConsultantDetailPage - ID from params:', id, 'Type:', typeof id, 'Is Object:', typeof id === 'object');
    console.log('ID stringified:', JSON.stringify(id));
    if (id) {
      fetchConsultantDetails();
      fetchAssignedVendors();
    } else {
      setError('No consultant ID provided');
      setLoading(false);
    }
  }, [id]);

  const fetchConsultantDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure ID is a string and not an object
      let consultantId: string;
      if (typeof id === 'string') {
        consultantId = id;
      } else if (id && typeof id === 'object') {
        console.error('ID is an object:', id);
        // If it's an object, try to extract the actual ID
        const idObj = id as any;
        consultantId = idObj.id || idObj._id || Object.values(idObj)[0] as string;
      } else {
        consultantId = String(id);
      }
      console.log('Original ID:', id, 'Type:', typeof id);
      console.log('Processed consultantId:', consultantId, 'Type:', typeof consultantId);
      
      if (!consultantId || consultantId === 'undefined' || consultantId === 'null') {
        throw new Error('Invalid consultant ID');
      }
      
      const response = await apiService.users.getById(consultantId);
      console.log('Consultant API response:', response.data);
      setConsultant(response.data.data);
    } catch (error: any) {
      console.error('Error fetching consultant details:', error);
      
      // Try to find in mock data as fallback
      const mockConsultant = mockConsultants.find(c => c.id === id || c._id === id);
      if (mockConsultant) {
        console.log('Using mock consultant data:', mockConsultant);
        setConsultant(mockConsultant);
      } else {
        if (error?.response?.status === 404) {
          setError('Consultant not found');
        } else {
          setError(error?.response?.data?.message || 'Failed to fetch consultant details');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedVendors = async () => {
    try {
      setVendorsLoading(true);
      let consultantId: string;
      if (typeof id === 'string') {
        consultantId = id;
      } else if (id && typeof id === 'object') {
        console.error('ID is an object in fetchAssignedVendors:', id);
        const idObj = id as any;
        consultantId = idObj.id || idObj._id || Object.values(idObj)[0] as string;
      } else {
        consultantId = String(id);
      }
      console.log('Fetching assigned vendors for consultant:', consultantId);
      const response = await apiService.users.getVendorsByConsultant(consultantId);
      console.log('Assigned vendors response:', response.data);
      setAssignedVendors(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching assigned vendors:', error);
      // Don't set error state for this as it's not critical
      setAssignedVendors([]);
    } finally {
      setVendorsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!consultant || !window.confirm(`Are you sure you want to delete ${consultant.name || 'this consultant'}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(true);
      let consultantId: string;
      if (typeof id === 'string') {
        consultantId = id;
      } else if (id && typeof id === 'object') {
        console.error('ID is an object in handleDelete:', id);
        const idObj = id as any;
        consultantId = idObj.id || idObj._id || Object.values(idObj)[0] as string;
      } else {
        consultantId = String(id);
      }
      await apiService.users.delete(consultantId);
      navigate('/admin/consultants');
    } catch (error: any) {
      console.error('Error deleting consultant:', error);
      setError(error?.response?.data?.message || 'Failed to delete consultant');
    } finally {
      setDeleting(false);
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

  const getInitials = (name: string) => {
    if (!name) return 'NA';
    return name
      .split(' ')
      .map(part => part && part[0] ? part[0] : '')
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'NA';
  };

  const getRandomColor = (consultant: any) => {
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
    
    const id = consultant?.id || consultant?._id;
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

  if (error || !consultant) {
    return (
      <MainLayout>
        <div className="p-6">
          <Alert severity="error" className="mb-4">
            {error || 'Consultant not found'}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<FontAwesomeIcon icon={faArrowLeft} />}
            onClick={() => navigate('/admin/consultants')}
          >
            Back to Consultants
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
              onClick={() => navigate('/admin/consultants')}
              className="shrink-0"
            >
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Consultant Details
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                View and manage consultant information
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outlined"
              startIcon={<FontAwesomeIcon icon={faEdit} />}
              onClick={() => navigate(`/admin/consultants/${id}/edit`)}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={deleting ? <CircularProgress size={16} /> : <FontAwesomeIcon icon={faTrash} />}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="text-center">
              <div className="p-6">
                <div className="mb-4">
                  {consultant.logo ? (
                    <img 
                      src={getFullImageUrl(consultant.logo)} 
                      alt={consultant.name} 
                      className="h-24 w-24 rounded-full mx-auto object-cover"
                      onError={(e) => {
                        console.error('Failed to load consultant logo:', consultant.logo);
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
                    className={`h-24 w-24 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto ${getRandomColor(consultant)}`}
                    style={{ display: consultant.logo ? 'none' : 'flex' }}
                  >
                    {getInitials(consultant.name || '')}
                  </div>
                </div>
                
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                  {consultant.name || 'Unknown Consultant'}
                </h2>
                
                <div className="flex items-center justify-center mb-4">
                  {getStatusIcon(consultant.status || 'pending')}
                  <Chip 
                    label={(consultant.status || 'pending').charAt(0).toUpperCase() + (consultant.status || 'pending').slice(1)}
                    color={getStatusColor(consultant.status || 'pending') as any}
                    size="small"
                    className="ml-2"
                  />
                </div>

                <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center justify-center">
                    <FontAwesomeIcon icon={faUserTie} className="w-4 h-4 mr-2" />
                    <span>{consultant.role || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <FontAwesomeIcon icon={faBuilding} className="w-4 h-4 mr-2" />
                    <span>{consultant.department || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <FontAwesomeIcon icon={faFileAlt} className="w-4 h-4 mr-2" />
                    <span>{consultant.documentsReviewed || 0} Documents Reviewed</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Details Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                  Contact Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faEnvelope} className="text-neutral-500 mr-3" />
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Email</p>
                      <p className="text-neutral-900 dark:text-white">{consultant.email || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faPhone} className="text-neutral-500 mr-3" />
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Phone</p>
                      <p className="text-neutral-900 dark:text-white">{consultant.phone || 'Not provided'}</p>
                    </div>
                  </div>

                  {consultant.website && (
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faGlobe} className="text-neutral-500 mr-3" />
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Website</p>
                        <a 
                          href={consultant.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          {consultant.website}
                        </a>
                      </div>
                    </div>
                  )}

                  {consultant.address && (
                    <div className="flex items-start">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-neutral-500 mr-3 mt-1" />
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Address</p>
                        <p className="text-neutral-900 dark:text-white">{consultant.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Professional Information */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                  Professional Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faBriefcase} className="text-neutral-500 mr-3" />
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Role</p>
                      <p className="text-neutral-900 dark:text-white">{consultant.role || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faBuilding} className="text-neutral-500 mr-3" />
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Department</p>
                      <p className="text-neutral-900 dark:text-white">{consultant.department || 'Not specified'}</p>
                    </div>
                  </div>

                  {consultant.registrationNumber && (
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faIdCard} className="text-neutral-500 mr-3" />
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Registration Number</p>
                        <p className="text-neutral-900 dark:text-white">{consultant.registrationNumber}</p>
                      </div>
                    </div>
                  )}

                  {consultant.taxId && (
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faIdCard} className="text-neutral-500 mr-3" />
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Tax ID</p>
                        <p className="text-neutral-900 dark:text-white">{consultant.taxId}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Activity Information */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                  Activity Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faFileAlt} className="text-neutral-500 mr-3" />
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Documents Reviewed</p>
                      <p className="text-neutral-900 dark:text-white">{consultant.documentsReviewed || 0}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-neutral-500 mr-3" />
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Last Activity</p>
                      <p className="text-neutral-900 dark:text-white">{consultant.lastActivity || 'Never'}</p>
                    </div>
                  </div>

                  {consultant.createdAt && (
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-neutral-500 mr-3" />
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Joined</p>
                        <p className="text-neutral-900 dark:text-white">
                          {new Date(consultant.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {consultant.updatedAt && (
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-neutral-500 mr-3" />
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Last Updated</p>
                        <p className="text-neutral-900 dark:text-white">
                          {new Date(consultant.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Assigned Vendors */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Assigned Vendors ({assignedVendors.length})
                  </h3>
                  {vendorsLoading && <CircularProgress size={20} />}
                </div>
                
                {assignedVendors.length > 0 ? (
                  <div className="space-y-3">
                    {assignedVendors.map((vendor) => (
                      <div 
                        key={vendor._id} 
                        className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                            {vendor.name ? vendor.name.charAt(0).toUpperCase() : 'V'}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-white">
                              {vendor.name || 'Unknown Vendor'}
                            </p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                              {vendor.email}
                            </p>
                            {vendor.company && (
                              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                                {vendor.company}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {vendor.status && (
                            <Chip 
                              label={vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                              color={getStatusColor(vendor.status)}
                              size="small"
                            />
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/admin/vendors/${vendor._id}`)}
                            startIcon={<FontAwesomeIcon icon={faUser} />}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FontAwesomeIcon 
                      icon={faUser} 
                      className="text-4xl text-neutral-300 dark:text-neutral-600 mb-3" 
                    />
                    <p className="text-neutral-500 dark:text-neutral-400">
                      No vendors assigned to this consultant
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ConsultantDetailPage;









