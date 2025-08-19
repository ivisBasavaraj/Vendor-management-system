import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Button,
  CircularProgress,
  Chip,
  Alert,
  Divider,
  Avatar,
  Box,
  Typography,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Badge,
  Card as MuiCard,
  CardContent,
  CardHeader,
  LinearProgress
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
  faExclamationCircle,
  faStar,
  faAward,
  faChartLine,
  faUsers,
  faClock,
  faEye,
  faDownload,
  faShare,
  faShieldAlt,
  faCertificate,
  faHistory,
  faUserCheck
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
                  onClick={() => navigate('/admin/consultants')}
                  className="!text-xs !py-1 !px-2"
                >
                  Back
                </Button>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Consultant Profile
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Professional details and activity overview
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<FontAwesomeIcon icon={faEdit} />}
                  onClick={() => navigate(`/users/edit/${id}`)}
                  className="!bg-gradient-to-r !from-blue-500 !to-indigo-500 !text-white !text-xs !py-1 !px-3"
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  startIcon={deleting ? <CircularProgress size={12} /> : <FontAwesomeIcon icon={faTrash} />}
                  onClick={handleDelete}
                  disabled={deleting}
                  className="!text-xs !py-1 !px-3"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="px-4 pt-3">
            <Alert severity="error" className="!text-sm" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        {/* Main Content - Optimized for no scrolling */}
        <div className="px-4 py-4">
          <div className="grid grid-cols-12 gap-4 max-w-7xl mx-auto">
            
            {/* Profile Section - Compact */}
            <div className="col-span-12 lg:col-span-4">
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 overflow-hidden">
                {/* Profile Header with Gradient */}
                <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-4 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative z-10 text-center">
                    <div className="mb-3">
                      {consultant.logo ? (
                        <img 
                          src={getFullImageUrl(consultant.logo)} 
                          alt={consultant.name} 
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
                        style={{ display: consultant.logo ? 'none' : 'flex' }}
                      >
                        {getInitials(consultant.name || '')}
                      </div>
                    </div>
                    
                    <h2 className="text-lg font-bold mb-1">
                      {consultant.name || 'Unknown Consultant'}
                    </h2>
                    
                    <div className="flex items-center justify-center mb-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        consultant.status === 'active' ? 'bg-green-500/20 text-green-100' :
                        consultant.status === 'inactive' ? 'bg-red-500/20 text-red-100' :
                        'bg-yellow-500/20 text-yellow-100'
                      }`}>
                      </div>
                    </div>

                    <div className="text-sm text-white/80">
                      <div className="flex items-center justify-center mb-1">
                        <FontAwesomeIcon icon={faUserTie} className="w-3 h-3 mr-2" />
                        <span>{consultant.role || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <FontAwesomeIcon icon={faBuilding} className="w-3 h-3 mr-2" />
                        <span>{consultant.department || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Information Grid - Compact */}
            <div className="col-span-12 lg:col-span-8">
              <div className="grid grid-cols-1 gap-4 h-full">
                
                {/* Contact & Professional Info Combined */}
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 p-4">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3 flex items-center">
                    <FontAwesomeIcon icon={faUser} className="w-4 h-4 mr-2 text-blue-500" />
                    Contact & Professional Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <FontAwesomeIcon icon={faEnvelope} className="text-gray-400 mr-3 w-4" />
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Email</div>
                          <div className="text-gray-900 dark:text-white font-medium">{consultant.email || 'Not provided'}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <FontAwesomeIcon icon={faPhone} className="text-gray-400 mr-3 w-4" />
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Phone</div>
                          <div className="text-gray-900 dark:text-white font-medium">{consultant.phone || 'Not provided'}</div>
                        </div>
                      </div>

                      {consultant.website && (
                        <div className="flex items-center text-sm">
                          <FontAwesomeIcon icon={faGlobe} className="text-gray-400 mr-3 w-4" />
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Website</div>
                            <a 
                              href={consultant.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
                            >
                              {consultant.website}
                            </a>
                          </div>
                        </div>
                      )}

                      {consultant.address && (
                        <div className="flex items-start text-sm">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400 mr-3 w-4 mt-1" />
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Address</div>
                            <div className="text-gray-900 dark:text-white font-medium">{consultant.address}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {consultant.registrationNumber && (
                        <div className="flex items-center text-sm">
                          <FontAwesomeIcon icon={faIdCard} className="text-gray-400 mr-3 w-4" />
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Registration</div>
                            <div className="text-gray-900 dark:text-white font-medium">{consultant.registrationNumber}</div>
                          </div>
                        </div>
                      )}

                      {consultant.taxId && (
                        <div className="flex items-center text-sm">
                          <FontAwesomeIcon icon={faIdCard} className="text-gray-400 mr-3 w-4" />
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Tax ID</div>
                            <div className="text-gray-900 dark:text-white font-medium">{consultant.taxId}</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center text-sm">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 mr-3 w-4" />
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Last Activity</div>
                          <div className="text-gray-900 dark:text-white font-medium">{consultant.lastActivity || 'Never'}</div>
                        </div>
                      </div>

                      {consultant.createdAt && (
                        <div className="flex items-center text-sm">
                          <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 mr-3 w-4" />
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Joined</div>
                            <div className="text-gray-900 dark:text-white font-medium">
                              {new Date(consultant.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assigned Vendors - Compact */}
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white flex items-center">
                      <FontAwesomeIcon icon={faUsers} className="w-4 h-4 mr-2 text-purple-500" />
                      Assigned Vendors ({assignedVendors.length})
                    </h3>
                    {vendorsLoading && <CircularProgress size={16} />}
                  </div>
                  
                  {assignedVendors.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                      {assignedVendors.map((vendor) => (
                        <div 
                          key={vendor._id} 
                          className="flex items-center justify-between p-2 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/20 rounded-lg hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-600 dark:hover:to-blue-800/30 transition-all duration-200 cursor-pointer"
                          onClick={() => navigate(`/admin/vendors/${vendor._id}`)}
                        >
                          <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                              {vendor.name ? vendor.name.charAt(0).toUpperCase() : 'V'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {vendor.name || 'Unknown Vendor'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {vendor.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {vendor.status && (
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                vendor.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                vendor.status === 'inactive' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}>
                                {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                              </div>
                            )}
                            <FontAwesomeIcon icon={faEye} className="w-3 h-3 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <FontAwesomeIcon 
                        icon={faUsers} 
                        className="text-3xl text-gray-300 dark:text-gray-600 mb-2" 
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No vendors assigned to this consultant
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

export default ConsultantDetailPage;

