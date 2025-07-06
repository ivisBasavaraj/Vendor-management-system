import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import UserManagement from '../../components/admin/UserManagement';
import UserForm from '../../components/admin/UserForm';

const UserManagementPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Check if we're on the user creation or edit route
  const isNewUserRoute = location.pathname === '/users/new';
  const isEditUserRoute = location.pathname.startsWith('/users/edit/');
  
  // Only admins can access this page
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return (
    <MainLayout>
      <div className="p-6">
        {isNewUserRoute ? (
          <UserForm mode="create" />
        ) : isEditUserRoute ? (
          <UserForm mode="edit" />
        ) : (
          <UserManagement />
        )}
      </div>
    </MainLayout>
  );
};

export default UserManagementPage;
