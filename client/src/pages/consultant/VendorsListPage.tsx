import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import VendorsList from '../../components/consultant/VendorsList';

const VendorsListPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Force component re-mount when location changes
  useEffect(() => {
    console.log('VendorsListPage mounted/updated:', location.pathname);
  }, [location.pathname]);

  // Only consultants can access this page
  if (!user || user.role !== 'consultant') {
    return <Navigate to="/dashboard" />;
  }

  return (
    <MainLayout>
      <div className="p-6" key={`vendors-list-${Date.now()}`}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Vendors List</h1>
        <VendorsList key={`vendors-component-${Date.now()}`} />
      </div>
    </MainLayout>
  );
};

export default VendorsListPage;