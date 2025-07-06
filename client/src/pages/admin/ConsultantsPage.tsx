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
  faUserTie,
  faBriefcase
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../../components/layout/MainLayout';
import axios from 'axios';
import apiService from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';

// Mock data for consultants
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
    avatar: null,
    role: 'Senior Consultant',
    status: 'active'
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
    avatar: null,
    role: 'Quality Analyst',
    status: 'active'
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
    avatar: null,
    role: 'Financial Advisor',
    status: 'inactive'
  },
  { 
    _id: '4',
    id: '4', 
    name: 'Emily Davis', 
    email: 'emily.davis@example.com', 
    phone: '+91 6543210987', 
    department: 'Legal',
    documentsReviewed: 27,
    lastActivity: '2023-06-10',
    avatar: null,
    role: 'Legal Consultant',
    status: 'active'
  },
  { 
    _id: '5',
    id: '5', 
    name: 'Robert Wilson', 
    email: 'robert.wilson@example.com', 
    phone: '+91 5432109876', 
    department: 'Procurement',
    documentsReviewed: 38,
    lastActivity: '2023-06-08',
    avatar: null,
    role: 'Procurement Specialist',
    status: 'active'
  },
  { 
    _id: '6',
    id: '6', 
    name: 'Jennifer Lee', 
    email: 'jennifer.lee@example.com', 
    phone: '+91 4321098765', 
    department: 'Human Resources',
    documentsReviewed: 22,
    lastActivity: '2023-06-07',
    avatar: null,
    role: 'HR Consultant',
    status: 'active'
  },
  { 
    _id: '7',
    id: '7', 
    name: 'David Miller', 
    email: 'david.miller@example.com', 
    phone: '+91 3210987654', 
    department: 'IT',
    documentsReviewed: 41,
    lastActivity: '2023-06-06',
    avatar: null,
    role: 'IT Specialist',
    status: 'inactive'
  },
  { 
    _id: '8',
    id: '8', 
    name: 'Lisa Anderson', 
    email: 'lisa.anderson@example.com', 
    phone: '+91 2109876543', 
    department: 'Operations',
    documentsReviewed: 29,
    lastActivity: '2023-06-05',
    avatar: null,
    role: 'Operations Consultant',
    status: 'active'
  },
];

const ConsultantsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        setLoading(true);
        // Use the API service to fetch real consultant data
        const response = await apiService.users.getConsultants();
        console.log('Consultants API response:', response.data);
        setConsultants(response.data.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching consultants:', error);
        setLoading(false);
        // If API fails, fall back to mock data for development
        console.log('Using mock data for consultants');
        setConsultants(mockConsultants);
      }
    };

    fetchConsultants();
  }, []);

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

  const filteredConsultants = consultants.filter(consultant => 
    (consultant.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (consultant.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (consultant.department?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (consultant.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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
    
    // If id is undefined, return a random color
    if (!id) {
      return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Use the id to deterministically select a color
    const index: number = id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const handleDelete = async (consultantId: string, consultantName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${consultantName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(consultantId);
      await apiService.users.delete(consultantId);
      
      // Remove the consultant from the local state
      setConsultants(prev => prev.filter(consultant => 
        (consultant.id || consultant._id) !== consultantId
      ));
      
      // Show success message (you could add a toast notification here)
      console.log('Consultant deleted successfully');
      
    } catch (error: any) {
      console.error('Error deleting consultant:', error);
      // Show error message (you could add a toast notification here)
      alert(error?.response?.data?.message || 'Failed to delete consultant');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Consultants Management
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Manage all consultant accounts and their document reviews
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
                placeholder="Search consultants by name, email, department..."
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
                {filteredConsultants
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((consultant) => (
                    <Card 
                      key={consultant.id} 
                      className="overflow-hidden hover:shadow-lg transition-all duration-200"
                      hover
                    >
                      <div className="h-24 bg-gradient-to-r from-purple-500 to-purple-700 flex items-center justify-center">
                        {consultant.avatar ? (
                          <img 
                            src={consultant.avatar} 
                            alt={consultant.name} 
                            className="h-16 w-16 rounded-full object-cover border-2 border-white"
                          />
                        ) : (
                          <div className={`h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-bold ${getRandomColor(consultant)}`}>
                            {getInitials(consultant.name)}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white truncate">
                            {consultant.name || 'N/A'}
                          </h3>
                          <div className="flex items-center">
                            {getStatusIcon(consultant.status)}
                            <span className={`ml-1 text-xs ${
                              consultant.status === 'active' ? 'text-green-500' : 
                              consultant.status === 'inactive' ? 'text-red-500' : 
                              'text-amber-500'
                            }`}>
                              {consultant.status ? (consultant.status.charAt(0).toUpperCase() + consultant.status.slice(1)) : 'Unknown'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                          <div className="flex items-center mb-1">
                            <FontAwesomeIcon icon={faUserTie} className="w-4 h-4 mr-2 text-neutral-500" />
                            <span className="truncate">{consultant.role || 'N/A'}</span>
                          </div>
                          <div className="flex items-center mb-1">
                            <FontAwesomeIcon icon={faBuilding} className="w-4 h-4 mr-2 text-neutral-500" />
                            <span className="truncate">{consultant.department || 'N/A'}</span>
                          </div>
                          <div className="flex items-center mb-1">
                            <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 mr-2 text-neutral-500" />
                            <span className="truncate">{consultant.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center mb-1">
                            <FontAwesomeIcon icon={faFileAlt} className="w-4 h-4 mr-2 text-neutral-500" />
                            <span>{consultant.documentsReviewed || 0} Documents Reviewed</span>
                          </div>
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faBriefcase} className="w-4 h-4 mr-2 text-neutral-500" />
                            <span>{consultant.assignedVendorsCount || 0} Assigned Vendors</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-3 border-t border-neutral-200 dark:border-neutral-700">
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center">
                            <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3 mr-1" />
                            <span>Last active: {consultant.lastActivity || 'N/A'}</span>
                          </div>
                          <div className="flex space-x-1">
                            <button 
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded-full dark:hover:bg-blue-900/30"
                              onClick={() => {
                                const consultantId = consultant.id || consultant._id;
                                console.log('Navigating to consultant:', consultantId, consultant);
                                if (consultantId) {
                                  navigate(`/admin/consultants/${consultantId}`);
                                } else {
                                  alert('Consultant ID not found');
                                }
                              }}
                            >
                              <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-1 text-amber-600 hover:bg-amber-100 rounded-full dark:hover:bg-amber-900/30"
                              onClick={() => {
                                const consultantId = consultant.id || consultant._id;
                                console.log('Navigating to edit consultant:', consultantId, consultant);
                                if (consultantId) {
                                  navigate(`/admin/consultants/${consultantId}/edit`);
                                } else {
                                  alert('Consultant ID not found');
                                }
                              }}
                            >
                              <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-1 text-red-600 hover:bg-red-100 rounded-full dark:hover:bg-red-900/30"
                              onClick={() => {
                                const consultantId = consultant.id || consultant._id;
                                if (consultantId) {
                                  handleDelete(consultantId, consultant.name);
                                } else {
                                  alert('Consultant ID not found');
                                }
                              }}
                              disabled={deleting === (consultant.id || consultant._id)}
                            >
                              {deleting === (consultant.id || consultant._id) ? (
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
                          Consultant
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Contact
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Department
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Documents Reviewed
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Assigned Vendors
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
                      {filteredConsultants
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((consultant) => (
                          <tr key={consultant.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-750">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {consultant.avatar ? (
                                  <img 
                                    src={consultant.avatar} 
                                    alt={consultant.name} 
                                    className="h-10 w-10 rounded-full"
                                  />
                                ) : (
                                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${getRandomColor(consultant)}`}>
                                    {getInitials(consultant.name)}
                                  </div>
                                )}
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-neutral-900 dark:text-white">
                                    {consultant.name || 'N/A'}
                                  </div>
                                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                    {consultant.role || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-neutral-900 dark:text-white">{consultant.email || 'N/A'}</div>
                              <div className="text-sm text-neutral-500 dark:text-neutral-400">{consultant.phone || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-neutral-900 dark:text-white">{consultant.department || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                consultant.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                                consultant.status === 'inactive' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}>
                                {consultant.status ? (consultant.status.charAt(0).toUpperCase() + consultant.status.slice(1)) : 'Unknown'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                              {consultant.documentsReviewed || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                              {consultant.assignedVendorsCount || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                              {consultant.lastActivity || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button 
                                className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 mr-3"
                                onClick={() => {
                                  const consultantId = consultant.id || consultant._id;
                                  if (consultantId) {
                                    navigate(`/admin/consultants/${consultantId}`);
                                  } else {
                                    alert('Consultant ID not found');
                                  }
                                }}
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                              <button 
                                className="text-amber-600 hover:text-amber-900 dark:hover:text-amber-400 mr-3"
                                onClick={() => {
                                  const consultantId = consultant.id || consultant._id;
                                  if (consultantId) {
                                    navigate(`/admin/consultants/${consultantId}/edit`);
                                  } else {
                                    alert('Consultant ID not found');
                                  }
                                }}
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button 
                                className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                                onClick={() => {
                                  const consultantId = consultant.id || consultant._id;
                                  if (consultantId) {
                                    handleDelete(consultantId, consultant.name);
                                  } else {
                                    alert('Consultant ID not found');
                                  }
                                }}
                                disabled={deleting === (consultant.id || consultant._id)}
                              >
                                {deleting === (consultant.id || consultant._id) ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <FontAwesomeIcon icon={faTrash} />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      {filteredConsultants.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-6 py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                            No consultants found
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
                Showing {Math.min(page * rowsPerPage + 1, filteredConsultants.length)} to {Math.min((page + 1) * rowsPerPage, filteredConsultants.length)} of {filteredConsultants.length} consultants
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
                {[...Array(Math.ceil(filteredConsultants.length / rowsPerPage))].slice(0, 5).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-10 h-10 rounded-md ${page === i ? 'bg-primary-600 text-white' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(Math.ceil(filteredConsultants.length / rowsPerPage) - 1, page + 1))}
                  disabled={page >= Math.ceil(filteredConsultants.length / rowsPerPage) - 1}
                  className={`p-2 rounded-md border border-neutral-300 dark:border-neutral-700 ${page >= Math.ceil(filteredConsultants.length / rowsPerPage) - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
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

export default ConsultantsPage;

