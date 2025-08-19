import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import DocumentStatusTracker from '../../components/vendor/DocumentStatusTracker';

const DocumentStatusPage: React.FC = () => {
  const { user } = useAuth();

  // Only vendors can access this page
  if (!user || user.role !== 'vendor') {
    return <Navigate to="/dashboard" />;
  }

  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Document Status</h1>
        <DocumentStatusTracker />
      </div>
    </MainLayout>
  );
};

export default DocumentStatusPage;