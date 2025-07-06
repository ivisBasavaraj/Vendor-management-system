import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiService from '../utils/api';
// No need to import axios directly as we'll use apiService.setAuthToken
import { jwtDecode } from 'jwt-decode';
import { useWebSocket } from './WebSocketContext';
import { useNavigate } from 'react-router-dom';
import { User, UserRole, LoginApproval, LoginResult } from '../types/auth';

// API URL from environment or default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// JWT token interface
interface JwtPayload {
  id: string;
  role: UserRole;
  exp: number;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  clearError: () => void;
  setError: (message: string) => void;
  checkLoginApprovalStatus: (loginApprovalId: string) => Promise<LoginApproval | null>;
  pendingLoginApproval: LoginApproval | null;
  setPendingLoginApproval: (approval: LoginApproval | null) => void;
  sendLoginApprovalNotification: (notification: any) => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { sendLoginApprovalNotification } = useWebSocket();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingLoginApproval, setPendingLoginApproval] = useState<LoginApproval | null>(null);

  // Note: axios defaults are now handled in the apiService

  // Check for token on load
  useEffect(() => {
    const checkToken = async () => {
      try {
        // Check for token in both locations for backward compatibility
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        
        if (!token) {
          setLoading(false);
          return;
        }

        // Set auth token in API service
        apiService.setAuthToken(token);

        // Verify token and get user data
        const decoded = jwtDecode<JwtPayload>(token);
        
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
          apiService.setAuthToken(null);
          setLoading(false);
          return;
        }

        // Get user data
        const response = await apiService.auth.getCurrentUser();
        
        if (response.data.success) {
          setUser({
            _id: response.data.data._id,
            id: response.data.data._id, // Added id
            name: response.data.data.name,
            email: response.data.data.email,
            role: response.data.data.role,
          });
          setIsAuthenticated(true);
        }
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        apiService.setAuthToken(null);
        console.error('Authentication error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    if (sendLoginApprovalNotification) {
      sendLoginApprovalNotification({
        type: 'login_attempt',
        email: email,
        timestamp: new Date().toISOString()
      });
    }
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.auth.login(email, password);
      
      if (response.data.success) {
        // If login approval is required, store the approval info and return
        if (response.data.requiresApproval) {
          // Check if the vendor already has an approved login request
          const approvalId = response.data.loginApprovalId;
          const approvalStatus = await checkLoginApprovalStatus(approvalId);
          
          // If already approved, complete the login process
          if (approvalStatus && approvalStatus.status === 'approved' && response.data.token) {
            // Store token consistently
            localStorage.setItem('token', response.data.token);
            // Keep authToken for backward compatibility
            localStorage.setItem('authToken', response.data.token);
            apiService.setAuthToken(response.data.token);
            
            const userData = {
              _id: response.data.user._id,
              id: response.data.user._id, // Added id
              name: response.data.user.name,
              email: response.data.user.email,
              role: response.data.user.role,
            };
            
            setUser(userData);
            setIsAuthenticated(true);
            setPendingLoginApproval(null);
            
            // Navigate to role-specific dashboard
            navigate('/dashboard');
            
            return {
              success: true,
              message: 'Login successful',
              token: response.data.token,
              user: userData
            };
          }
          
          // Otherwise, handle as pending approval
          const approvalInfo: LoginApproval = {
            id: response.data.loginApprovalId,
            status: 'pending' as const,
            requestToken: response.data.requestToken,
            createdAt: response.data.createdAt,
            expiresAt: response.data.expiresAt
          };
          
          setPendingLoginApproval(approvalInfo);
          
          // Return the approval info so the component can handle redirection
          return {
            success: false,
            message: 'Login approval required',
            token: undefined,
            user: undefined // Changed from null
          };
        }
        
        // Regular login flow (no approval required)
        const { token, user } = response.data;
        // Store token consistently
        localStorage.setItem('token', token);
        // Keep authToken for backward compatibility
        localStorage.setItem('authToken', token);
        apiService.setAuthToken(token);
        
        const userData = {
          _id: user._id,
          id: user._id, // Added id
          name: user.name,
          email: user.email,
          role: user.role,
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        
        // Navigate to role-specific dashboard
        navigate('/dashboard');
        
        return {
          success: true,
          message: 'Login successful',
          token: token,
          user: userData
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Login failed. Please check your credentials.',
        token: undefined,
        user: undefined // Changed from null
      };
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please check your credentials.'
      );
      return {
        success: false,
        message: err.message,
        token: undefined,
        user: undefined // Changed from null
      };
    } finally {
      setLoading(false);
    }
  };

  // Check login approval status
  const checkLoginApprovalStatus = async (loginApprovalId: string): Promise<LoginApproval | null> => {
    try {
      setLoading(true);
      
      console.log('Checking login approval status for ID:', loginApprovalId);
      const response = await apiService.auth.checkLoginApproval(loginApprovalId);
      
      console.log('Login approval response:', response.data);
      console.log('Response structure check:', {
        hasData: !!response.data.data,
        hasStatus: !!response.data.status,
        responseKeys: Object.keys(response.data)
      });
      
      if (response.data.success) {
        // Handle different response structures
        const approval = response.data.data || response.data;
        const status = approval.status || response.data.status;
        
        // Update the local approval state
        setPendingLoginApproval({
          id: approval._id || loginApprovalId,
          status: status,
          requestToken: approval.requestToken || response.data.requestToken || loginApprovalId,
          createdAt: approval.createdAt || response.data.createdAt,
          expiresAt: approval.expiresAt || response.data.expiresAt
        });
        
        // If approved, complete the login process
        if (status === 'approved' && response.data.token && response.data.user) {
          const { token, user } = response.data;
          // Store token consistently
          localStorage.setItem('token', token);
          // Keep authToken for backward compatibility
          localStorage.setItem('authToken', token);
          apiService.setAuthToken(token);
          
          const userData = {
            _id: user._id,
            id: user._id, // Added id
            name: user.name,
            email: user.email,
            role: user.role,
            company: user.company,
            requiresLoginApproval: user.requiresLoginApproval || false
          };
          
          console.log('Login approved - user set:', userData);
          
          setUser(userData);
          setIsAuthenticated(true);
          setPendingLoginApproval(null);
          
          // Navigate to role-specific dashboard
          navigate('/dashboard');
        }
        
        return {
          id: approval._id || loginApprovalId,
          status: status,
          requestToken: approval.requestToken || response.data.requestToken || loginApprovalId,
          createdAt: approval.createdAt || response.data.createdAt,
          expiresAt: approval.expiresAt || response.data.expiresAt
        };
      }
      
      return null;
    } catch (err) {
      console.error('Login approval status check error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Try to call logout API, but don't fail if it doesn't work
      await apiService.auth.logout();
    } catch (error) {
      // Ignore logout API errors - we still want to clear local state
      console.warn('Logout API call failed, but continuing with local logout:', error);
    }
    
    // Always clear local state regardless of API call success
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    apiService.setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setPendingLoginApproval(null);
    
    // Redirect to login page
    navigate('/login');
  };

  // Register function
  const register = async (userData: any) => {
    try {
      setLoading(true);
      setError(null);
      // Ensure address is always a string (even if empty)
      const payload = {
        ...userData,
        address: (userData.address ?? '').toString()
      };
      await apiService.auth.register(payload);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Registration failed. Please try again.'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };
  
  // Set error message
  const setErrorMessage = (message: string) => {
    setError(message);
  };

  // Auth context value
  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    register,
    clearError,
    setError: setErrorMessage,
    checkLoginApprovalStatus,
    pendingLoginApproval,
    setPendingLoginApproval,
    sendLoginApprovalNotification
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};