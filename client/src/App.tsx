import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { NotificationPopupProvider } from './contexts/NotificationPopupContext';
import { motion } from 'framer-motion';
import clientEmailService from './utils/emailService';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import LoginApprovalWaitingPage from './pages/auth/LoginApprovalWaitingPage';
import LoginApprovalListPage from './pages/auth/LoginApprovalListPage';
import LoginStatusPage from './pages/auth/LoginStatusPage';

// Role-specific Login Pages
import AdminLoginPage from './pages/auth/admin/AdminLoginPage';
import VendorLoginPage from './pages/auth/vendor/VendorLoginPage';
import ConsultantLoginPage from './pages/auth/consultant/ConsultantLoginPage';

// Dashboard Pages
import AdminDashboard from './pages/dashboard/AdminDashboard';
import VendorDashboard from './pages/dashboard/VendorDashboard';
import ConsultantDashboard from './pages/dashboard/ConsultantDashboard';

// Document Pages
import UploadDocumentPage from './pages/documents/UploadDocumentPage';
import DocumentListPage from './pages/documents/DocumentListPage';
import DocumentReviewPage from './pages/documents/DocumentReviewPage';
import DocumentViewPage from './pages/documents/DocumentViewPage';
import RejectedDocumentsPage from './pages/documents/RejectedDocumentsPage';

// Vendor Pages
import DocumentSubmissionPage from './pages/vendor/DocumentSubmissionPage';
import DocumentStatusPage from './pages/vendor/DocumentStatusPage';
import { ActionsPage } from './pages/actions';
import ProfilePage from './pages/profile/ProfilePage';
import NotificationsPage from './pages/notifications/NotificationsPage';

// IMTMA Pages
import MISDashboardPage from './pages/imtma/MISDashboardPage';

// Consultant Pages
import ConsultantDocumentReviewPage from './pages/consultant/DocumentReviewPage';
/* eslint-disable-next-line */
import VendorListPage from './pages/consultant/VendorListPage';
import VendorsListPage from './pages/consultant/VendorsListPage';
import VendorDocumentsPage from './pages/consultant/VendorDocumentsPage';
import VendorDocumentPage from './pages/consultant/VendorDocumentPage';
import ApprovedDocumentsPage from './pages/consultant/ApprovedDocumentsPage';
import ComplianceVerificationPage from './pages/consultant/ComplianceVerificationPage';
import VendorStatusPage from './pages/consultant/VendorStatusPage';

// Admin Pages
import UserManagementPage from './pages/admin/UserManagementPage';
import UserRegistrationPage from './pages/users/UserRegistrationPage';
import VendorsPage from './pages/admin/VendorsPage';
import VendorDetailPage from './pages/admin/VendorDetailPage';
import NotificationManagementPage from './pages/admin/NotificationManagementPage';


// Wrapper components to ensure proper re-mounting
const VendorDetailPageWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <VendorDetailPage key={id} />;
};


import ConsultantsPage from './pages/admin/ConsultantsPage';
import ConsultantDetailPage from './pages/admin/ConsultantDetailPage';

import ActivityLogsPage from './pages/admin/ActivityLogsPage';
import StatusPage from './pages/admin/StatusPage';
import DownloadsPage from './pages/admin/DownloadsPage';
import ReportsPage from './pages/admin/ReportsPageExport';
import SettingsPage from './pages/admin/SettingsPage';

// Public Pages
import LandingPage from './pages/LandingPage';

// Navigation Components
import NavigationWrapper from './components/navigation/NavigationWrapper';

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-primary-600 dark:border-primary-400 animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full bg-white dark:bg-neutral-900"></div>
      </div>
    </div>
  </div>
);

// Private route wrapper
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" />;
};

// Public route wrapper (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode, restricted?: boolean }> = ({ 
  children, 
  restricted = false 
}) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (isAuthenticated && restricted) {
    // Redirect to role-specific dashboard if authenticated
    if (user) {
      // For vendors with pending approval, don't redirect
      if (user.role === 'vendor' && user.requiresLoginApproval) {
        return <>{children}</>;
      }
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Role-based route wrapper
const RoleRoute: React.FC<{ children: React.ReactNode, allowedRoles: string[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" />;
  }
  
  if (!user) {
    return <Navigate to="/admin/login" />;
  }
  
  // Check if user role is allowed
  if (!allowedRoles.includes(user.role)) {
    // Redirect to the appropriate dashboard based on their actual role
    return <Navigate to="/dashboard" />;
  }
  
  // For vendors with pending approval, redirect to approval waiting page
  if (user.role === 'vendor' && user.requiresLoginApproval) {
    // Check if we're already on a login approval page to avoid redirect loops
    const currentPath = window.location.pathname;
    if (!currentPath.includes('/login-approval') && !currentPath.includes('/login-status')) {
      return <Navigate to="/vendor/login" />;
    }
  }
  
  return <>{children}</>;
};

// Page transitions
const pageVariants = {
  initial: {
    opacity: 0,
  },
  in: {
    opacity: 1,
  },
  out: {
    opacity: 0,
  },
};

const pageTransition: {
  type: string;
  ease: string;
  duration: number;
} = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3,
};

// Animated page wrapper with location-based key for proper re-rendering
const AnimatedPage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  // Force component re-mount when location changes
  useEffect(() => {
    // This effect will run whenever the location changes
    console.log('Route changed to:', location.pathname);
    
    // Force a scroll to top on route change
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      key={`${location.pathname}-${location.search}-${Date.now()}`} // More unique key
    >
      {children}
    </motion.div>
  );
};

// Dashboard router - renders appropriate dashboard based on user role
const DashboardRouter: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/admin/login" />;
  
  // For vendors with pending approval, redirect to login page
  if (user.role === 'vendor' && user.requiresLoginApproval) {
    return <Navigate to="/vendor/login" />;
  }
  
  // Route to the appropriate dashboard based on user role
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'vendor':
      return <VendorDashboard />;
    case 'consultant':
    case 'cross_verifier':
    case 'approver':
      return <ConsultantDashboard />;
    case 'imtma':
      return <MISDashboardPage />;
    default:
      // Redirect to admin login page for unknown roles
      return <Navigate to="/admin/login" />;
  }
};

const AppContent: React.FC = () => {
  const location = useLocation();
  
  return (
    <Routes location={location} key={`${location.pathname}-${location.search}-${location.hash}`}>
      {/* Public Pages */}
      <Route path="/" element={
          <PublicRoute>
            <AnimatedPage>
              <LandingPage />
            </AnimatedPage>
          </PublicRoute>
        } />

        {/* Auth Routes - General login removed */}
        
        {/* Role-specific Login Routes */}
        <Route path="/admin/login" element={
          <PublicRoute restricted>
            <AnimatedPage>
              <AdminLoginPage />
            </AnimatedPage>
          </PublicRoute>
        } />
        <Route path="/vendor/login" element={
          <PublicRoute restricted>
            <AnimatedPage>
              <VendorLoginPage />
            </AnimatedPage>
          </PublicRoute>
        } />
        <Route path="/consultant/login" element={
          <PublicRoute restricted>
            <AnimatedPage>
              <ConsultantLoginPage />
            </AnimatedPage>
          </PublicRoute>
        } />
        
        {/* Registration route removed - only admins can create users */}
        <Route path="/forgot-password" element={
          <PublicRoute restricted>
            <AnimatedPage>
              <ForgotPasswordPage />
            </AnimatedPage>
          </PublicRoute>
        } />
        <Route path="/reset-password/:token" element={
          <PublicRoute restricted>
            <AnimatedPage>
              <ResetPasswordPage />
            </AnimatedPage>
          </PublicRoute>
        } />
        <Route path="/login-approval/:id" element={
          <PublicRoute restricted>
            <AnimatedPage>
              <LoginApprovalWaitingPage />
            </AnimatedPage>
          </PublicRoute>
        } />
        <Route path="/login-status/:loginApprovalId" element={
          <PublicRoute restricted>
            <AnimatedPage>
              <LoginStatusPage />
            </AnimatedPage>
          </PublicRoute>
        } />

        {/* Role-based Dashboard Route */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <AnimatedPage>
              <DashboardRouter />
            </AnimatedPage>
          </PrivateRoute>
        } />

        {/* Document Routes - Role-based */}
        <Route path="/documents" element={
          <PrivateRoute>
            <AnimatedPage>
              <DocumentListPage />
            </AnimatedPage>
          </PrivateRoute>
        } />
        
        {/* Document View Route for all roles */}
        <Route path="/documents/view/:id" element={
          <PrivateRoute>
            <AnimatedPage>
              <DocumentViewPage />
            </AnimatedPage>
          </PrivateRoute>
        } />
        
        {/* Vendor-specific Routes */}
        <Route path="/documents/upload" element={
          <RoleRoute allowedRoles={['vendor', 'admin']}>
            <AnimatedPage>
              <DocumentSubmissionPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/my-documents" element={
          <RoleRoute allowedRoles={['vendor']}>
            <AnimatedPage>
              <DocumentListPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/submit-document" element={
          <RoleRoute allowedRoles={['vendor']}>
            <AnimatedPage>
              <DocumentSubmissionPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/documents/submit" element={
          <RoleRoute allowedRoles={['vendor']}>
            <AnimatedPage>
              <DocumentSubmissionPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/documents/status" element={
          <RoleRoute allowedRoles={['vendor']}>
            <AnimatedPage>
              <DocumentStatusPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/documents/edit" element={
          <RoleRoute allowedRoles={['vendor']}>
            <AnimatedPage>
              <DocumentListPage mode={"edit" as "view" | "edit"} />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/documents/rejected" element={
          <RoleRoute allowedRoles={['vendor']}>
            <AnimatedPage>
              <RejectedDocumentsPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/documents/resubmit/:id" element={
          <RoleRoute allowedRoles={['vendor']}>
            <AnimatedPage>
              <DocumentSubmissionPage mode="resubmit" />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/actions" element={
          <RoleRoute allowedRoles={['vendor']}>
            <AnimatedPage>
              <ActionsPage />
            </AnimatedPage>
          </RoleRoute>
        } />

        {/* Consultant-specific Routes */}
        <Route path="/documents/:id" element={
          <RoleRoute allowedRoles={['consultant', 'admin']}>
            <AnimatedPage>
              <DocumentReviewPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/review-documents" element={
          <RoleRoute allowedRoles={['consultant', 'admin']}>
            <AnimatedPage>
              <ConsultantDocumentReviewPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/vendors-list" element={
          <RoleRoute allowedRoles={['consultant', 'admin']}>
            <NavigationWrapper>
              <AnimatedPage>
                <VendorsListPage key="vendors-list" />
              </AnimatedPage>
            </NavigationWrapper>
          </RoleRoute>
        } />
        <Route path="/vendor-documents/:vendorId" element={
          <RoleRoute allowedRoles={['consultant', 'admin']}>
            <AnimatedPage>
              <VendorDocumentsPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/vendor-documents" element={
          <RoleRoute allowedRoles={['consultant', 'admin']}>
            <AnimatedPage>
              <VendorDocumentPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/approved-documents" element={
          <RoleRoute allowedRoles={['consultant', 'admin']}>
            <AnimatedPage>
              <ApprovedDocumentsPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/compliance-verification" element={
          <RoleRoute allowedRoles={['consultant', 'admin']}>
            <AnimatedPage>
              <ComplianceVerificationPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/compliance-verification/:vendorId" element={
          <RoleRoute allowedRoles={['consultant', 'admin']}>
            <AnimatedPage>
              <ComplianceVerificationPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/vendor-status" element={
          <RoleRoute allowedRoles={['consultant', 'admin']}>
            <AnimatedPage>
              <VendorStatusPage />
            </AnimatedPage>
          </RoleRoute>
        } />

        <Route path="/rejected-documents" element={
          <RoleRoute allowedRoles={['consultant', 'vendor', 'admin']}>
            <AnimatedPage>
              <DocumentListPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/login-approvals" element={
          <PrivateRoute>
            <AnimatedPage>
              <LoginApprovalListPage />
            </AnimatedPage>
          </PrivateRoute>
        } />

        {/* Admin-specific Routes */}
        <Route path="/admin/vendors" element={
          <RoleRoute allowedRoles={['admin']}>
            <NavigationWrapper>
              <AnimatedPage>
                <VendorsPage key="admin-vendors" />
              </AnimatedPage>
            </NavigationWrapper>
          </RoleRoute>
        } />
        <Route path="/admin/vendors/:id" element={
          <RoleRoute allowedRoles={['admin']}>
            <AnimatedPage>
              <VendorDetailPageWrapper />
            </AnimatedPage>
          </RoleRoute>
        } />


        <Route path="/admin/consultants" element={
          <RoleRoute allowedRoles={['admin']}>
            <NavigationWrapper>
              <AnimatedPage>
                <ConsultantsPage key="admin-consultants" />
              </AnimatedPage>
            </NavigationWrapper>
          </RoleRoute>
        } />
        <Route path="/admin/consultants/:id" element={
          <RoleRoute allowedRoles={['admin']}>
            <AnimatedPage>
              <ConsultantDetailPage />
            </AnimatedPage>
          </RoleRoute>
        } />

        <Route path="/admin/activity-logs" element={
          <RoleRoute allowedRoles={['admin']}>
            <AnimatedPage>
              <ActivityLogsPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/admin/reports" element={
          <RoleRoute allowedRoles={['admin']}>
            <AnimatedPage>
              <ReportsPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/admin/status" element={
          <RoleRoute allowedRoles={['admin']}>
            <AnimatedPage>
              <StatusPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/admin/downloads" element={
          <RoleRoute allowedRoles={['admin']}>
            <AnimatedPage>
              <DownloadsPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/admin/settings" element={
          <RoleRoute allowedRoles={['admin']}>
            <AnimatedPage>
              <SettingsPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/admin/notifications" element={
          <RoleRoute allowedRoles={['admin']}>
            <AnimatedPage>
              <NotificationManagementPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/users/manage" element={
          <RoleRoute allowedRoles={['admin']}>
            <AnimatedPage>
              <UserManagementPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/users/new" element={
          <RoleRoute allowedRoles={['admin']}>
            <AnimatedPage>
              <UserRegistrationPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/users/edit/:userId" element={
          <RoleRoute allowedRoles={['admin']}>
            <AnimatedPage>
              <UserManagementPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/users/consultants" element={
          <RoleRoute allowedRoles={['admin']}>
            <AnimatedPage>
              <DocumentListPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/users/vendors" element={
          <RoleRoute allowedRoles={['admin']}>
            <AnimatedPage>
              <DocumentListPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/users/admins" element={
          <RoleRoute allowedRoles={['admin']}>
            <AnimatedPage>
              <DocumentListPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/reports" element={
          <RoleRoute allowedRoles={['admin', 'imtma']}>
            <AnimatedPage>
              <MISDashboardPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/reports/mis" element={
          <RoleRoute allowedRoles={['admin', 'imtma']}>
            <AnimatedPage>
              <MISDashboardPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/reports/documents" element={
          <RoleRoute allowedRoles={['admin', 'imtma']}>
            <AnimatedPage>
              <DocumentListPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/reports/users" element={
          <RoleRoute allowedRoles={['admin']}>
            <AnimatedPage>
              <DocumentListPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/reports/compliance" element={
          <RoleRoute allowedRoles={['admin']}>
            <AnimatedPage>
              <DocumentListPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/settings" element={
          <RoleRoute allowedRoles={['admin']}>
            <AnimatedPage>
              <DocumentListPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/settings/general" element={
          <RoleRoute allowedRoles={['admin']}>
            <AnimatedPage>
              <DocumentListPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/settings/security" element={
          <RoleRoute allowedRoles={['admin']}>
            <AnimatedPage>
              <DocumentListPage />
            </AnimatedPage>
          </RoleRoute>
        } />
        <Route path="/settings/notifications" element={
          <RoleRoute allowedRoles={['admin']}>
            <AnimatedPage>
              <DocumentListPage />
            </AnimatedPage>
          </RoleRoute>
        } />

        {/* Common Routes for All Authenticated Users */}
        <Route path="/profile" element={
          <PrivateRoute>
            <AnimatedPage>
              <ProfilePage />
            </AnimatedPage>
          </PrivateRoute>
        } />
        <Route path="/notifications" element={
          <PrivateRoute>
            <AnimatedPage>
              <NotificationsPage />
            </AnimatedPage>
          </PrivateRoute>
        } />
        <Route path="/contact" element={
          <PrivateRoute>
            <AnimatedPage>
              <DocumentListPage />
            </AnimatedPage>
          </PrivateRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    // Initialize EmailJS when the app starts
    clientEmailService.init();
    
    // Test configuration in development mode
    if (process.env.NODE_ENV === 'development') {
      clientEmailService.testConfiguration().then((result) => {
        if (result.success) {
          console.log('✅ EmailJS configuration test passed');
        } else {
          console.warn('⚠️ EmailJS configuration test failed:', result.error);
        }
      });
    }
  }, []);

  return (
    <Router>
      <AuthProvider>
        <WebSocketProvider>
          <NotificationPopupProvider>
            <AppContent />
          </NotificationPopupProvider>
        </WebSocketProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
