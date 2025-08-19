import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import VendorDocumentReview from '../../components/consultant/VendorDocumentReview';

const VendorDocumentPage: React.FC = () => {
  const { user } = useAuth();

  // Only consultants and admins can access this page
  if (!user || (user.role !== 'consultant' && user.role !== 'admin')) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Vendor Document Review</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Review and approve documents submitted by your assigned vendors. You can filter by vendor, status, or time period.
        </p>
        <VendorDocumentReview />
      </div>
    </MainLayout>
  );
};

export default VendorDocumentPage;