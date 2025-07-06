import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '../../utils/icons';
import {
  faExclamationCircle,
  faSearch,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faMapMarkerAlt,
  faMobileAlt,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';

// Interface for login approval
interface LoginApproval {
  _id: string;
  vendor: {
    _id: string;
    name: string;
    email: string;
    company: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  expiresAt: string;
  ipAddress: string;
  deviceInfo: string;
  userAgent: string;
}

const LoginApprovalListPage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [approvals, setApprovals] = useState<LoginApproval[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [processingSuccess, setProcessingSuccess] = useState<Record<string, boolean>>({});
  const [processingError, setProcessingError] = useState<Record<string, string>>({});
  
  // Check if user is authorized
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/login');
      } else if (user && (user.role !== 'admin' && user.role !== 'consultant')) {
        // Redirect to dashboard if user is authenticated but doesn't have required role
        navigate('/dashboard');
      }
    }
  }, [user, isAuthenticated, authLoading, navigate]);
  
  // Fetch pending login approvals
  const fetchPendingApprovals = async () => {
    try {
      // Only fetch if user has the right role
      if (!user || (user.role !== 'admin' && user.role !== 'consultant')) {
        return;
      }
      
      setLoading(true);
      setError(null);
      
      const response = await apiService.loginApprovals.getPending();
      
      if (response.data.success) {
        setApprovals(response.data.data);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        // Handle forbidden error gracefully
        setError('You do not have permission to view login approvals');
        // Redirect to dashboard after a short delay
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        setError(err.response?.data?.message || 'Failed to load login approval requests');
      }
      console.error('Error fetching login approvals:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch approvals on component mount
  useEffect(() => {
    if (isAuthenticated && user && (user.role === 'admin' || user.role === 'consultant')) {
      fetchPendingApprovals();
    }
  }, [isAuthenticated, user]);
  
  // Handle approval/rejection
  const handleApprovalAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      setProcessing(prev => ({ ...prev, [id]: true }));
      setProcessingError(prev => ({ ...prev, [id]: '' }));
      
      let response;
      
      if (action === 'approve') {
        // Use the updated API service method for approval
        response = await apiService.loginApprovals.approve(id);
      } else {
        // For rejection, include the reason
        const reason = 'Login request rejected by administrator';
        response = await apiService.loginApprovals.reject(id, reason);
      }
      
      if (response.data.success) {
        setProcessingSuccess(prev => ({ ...prev, [id]: true }));
        
        // Update the approvals list after a short delay to show the success message
        setTimeout(() => {
          setApprovals(prevApprovals => 
            prevApprovals.filter(approval => approval._id !== id)
          );
          setProcessingSuccess(prev => ({ ...prev, [id]: false }));
        }, 1500);
      }
    } catch (err: any) {
      console.error(`Error ${action}ing login approval:`, err);
      setProcessingError(prev => ({ 
        ...prev, 
        [id]: err.response?.data?.message || `Failed to ${action} login request` 
      }));
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }));
    }
  };
  
  // Filter approvals by search term
  const filteredApprovals = approvals.filter(approval => {
    const searchLower = searchTerm.toLowerCase();
    
    return (
      approval.vendor.name.toLowerCase().includes(searchLower) ||
      approval.vendor.email.toLowerCase().includes(searchLower) ||
      approval.vendor.company.toLowerCase().includes(searchLower) ||
      approval.ipAddress.toLowerCase().includes(searchLower)
    );
  });
  
  // Format date to local string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Calculate time left until expiry
  const getTimeLeft = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/d/d8/IMTMA.png" 
          alt="IMTMA Logo" 
          className="h-16 w-auto mx-auto mb-6"
        />
      </div>
      
      {/* Back Button */}
      <div className="mb-6">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Login Approvals</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and approve vendor login requests
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={fetchPendingApprovals}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FontAwesomeIcon icon={faExclamationCircle} className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Search box */}
      <div className="mb-6">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FontAwesomeIcon icon={faSearch} className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            placeholder="Search by vendor name, email, company or IP address"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredApprovals.length === 0 ? (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <FontAwesomeIcon icon={faClock} className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No pending login requests</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no pending login requests that require your approval at this time.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredApprovals.map((approval) => (
              <li key={approval._id} className="relative">
                {processing[approval._id] && (
                  <div className="absolute inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                )}
                
                {processingSuccess[approval._id] && (
                  <div className="absolute inset-0 bg-green-100 bg-opacity-90 flex items-center justify-center z-10">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faCheckCircle} className="h-6 w-6 text-green-500 mr-2" />
                      <span className="text-green-700 font-medium">Action processed successfully</span>
                    </div>
                  </div>
                )}
                
                <div className="px-4 py-5 sm:px-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="mb-4 md:mb-0">
                      <h3 className="text-lg font-medium text-gray-900">{approval.vendor.name}</h3>
                      <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span className="truncate">{approval.vendor.email}</span>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span>{approval.vendor.company}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleApprovalAction(approval._id, 'approve')}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <FontAwesomeIcon icon={faCheckCircle} className="mr-1" /> Approve
                      </button>
                      <button
                        onClick={() => handleApprovalAction(approval._id, 'reject')}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <FontAwesomeIcon icon={faTimesCircle} className="mr-1" /> Reject
                      </button>
                    </div>
                  </div>
                  
                  {processingError[approval._id] && (
                    <div className="mt-2 text-sm text-red-600">
                      {processingError[approval._id]}
                    </div>
                  )}
                  
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-start">
                      <FontAwesomeIcon icon={faClock} className="flex-shrink-0 h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="ml-3 text-sm">
                        <p className="font-medium text-gray-900">Request Time</p>
                        <p className="text-gray-500">{formatDate(approval.createdAt)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <FontAwesomeIcon icon={faClock} className="flex-shrink-0 h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="ml-3 text-sm">
                        <p className="font-medium text-gray-900">Expires</p>
                        <p className="text-gray-500">{getTimeLeft(approval.expiresAt)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="flex-shrink-0 h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="ml-3 text-sm">
                        <p className="font-medium text-gray-900">IP Address</p>
                        <p className="text-gray-500">{approval.ipAddress}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start sm:col-span-2 lg:col-span-3">
                      <FontAwesomeIcon icon={faMobileAlt} className="flex-shrink-0 h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="ml-3 text-sm">
                        <p className="font-medium text-gray-900">Device Information</p>
                        <p className="text-gray-500 truncate max-w-full">
                          {approval.deviceInfo || approval.userAgent}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LoginApprovalListPage;