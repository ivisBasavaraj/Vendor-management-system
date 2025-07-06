import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import VendorsList from '../../components/consultant/VendorsList';

const VendorsListPage: React.FC = () => {
  const { user } = useAuth();

  // Only consultants can access this page
  if (!user || user.role !== 'consultant') {
    return <Navigate to="/dashboard" />;
  }

  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Vendors List</h1>
        <VendorsList />
      </div>
    </MainLayout>
  );
};

export default VendorsListPage;