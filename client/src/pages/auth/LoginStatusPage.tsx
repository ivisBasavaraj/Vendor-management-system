import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../utils/api';
import { FontAwesomeIcon } from '../../utils/icons';
import { formatDistanceToNow } from 'date-fns';

const LoginStatusPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loginStatus, setLoginStatus] = useState<any>(null);
  const { loginApprovalId } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    checkLoginStatus();
    
    // Poll for status updates every 10 seconds
    const intervalId = setInterval(checkLoginStatus, 10000);
    
    return () => clearInterval(intervalId);
  }, [loginApprovalId]);

  const checkLoginStatus = async () => {
    if (!loginApprovalId) {
      setError('No login approval ID provided');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiService.auth.checkLoginApproval(loginApprovalId);
      
      setLoginStatus(response.data);
      
      // If approved, automatically log in the user
      if (response.data.success && response.data.status === 'approved' && response.data.token) {
        // Store token in localStorage
        localStorage.setItem('token', response.data.token);
        
        // Set authorization header for future requests
        const token = response.data.token;
        if (token) {
          apiService.setAuthToken(token);
        }
        
        // Short delay to show the success message before redirecting
        setTimeout(() => {
          // Navigate to the appropriate dashboard based on user role
          navigate('/dashboard', { replace: true });
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to check login status');
      console.error('Error checking login status:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStatusIcon = () => {
    if (!loginStatus) return null;
    
    if (loginStatus.token) {
      return (
        <div className="text-center mb-4">
          <div className="bg-success text-white rounded-circle p-4 d-inline-block">
            <FontAwesomeIcon icon="check" size="3x" />
          </div>
          <h2 className="mt-3">Login Approved</h2>
          <p>Redirecting to dashboard...</p>
        </div>
      );
    }
    
    if (loginStatus.status === 'rejected') {
      return (
        <div className="text-center mb-4">
          <div className="bg-danger text-white rounded-circle p-4 d-inline-block">
            <FontAwesomeIcon icon="times" size="3x" />
          </div>
          <h2 className="mt-3">Login Rejected</h2>
          <p>{loginStatus.message}</p>
        </div>
      );
    }
    
    return (
      <div className="text-center mb-4">
        <div className="bg-warning text-white rounded-circle p-4 d-inline-block">
          <FontAwesomeIcon icon="clock" size="3x" />
        </div>
        <h2 className="mt-3">Login Pending Approval</h2>
        <p>Please wait while an administrator reviews your login request.</p>
        {loginStatus.createdAt && (
          <p className="text-muted">
            Requested {formatDistanceToNow(new Date(loginStatus.createdAt))} ago
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center mb-6">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/d/d8/IMTMA.png" 
              alt="IMTMA Logo" 
              className="h-16 w-auto mx-auto mb-4"
            />
          </div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900 mb-4">Login Status</h1>
          
          {loading && (
            <div className="text-center my-5">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-600 mx-auto"></div>
              <p className="mt-3">Checking login status...</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4">
              {error}
            </div>
          )}
          
          {!loading && !error && renderStatusIcon()}
          
          <div className="text-center mt-4">
            <Link 
              to="/login"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginStatusPage;
