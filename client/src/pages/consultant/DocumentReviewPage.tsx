import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import DocumentReview from '../../components/consultant/DocumentReview';

const DocumentReviewPage: React.FC = () => {
  const { user } = useAuth();

  // Only consultants and admins can access this page
  if (!user || (user.role !== 'consultant' && user.role !== 'admin')) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Document Review</h1>
        <DocumentReview />
      </div>
    </MainLayout>
  );
};

export default DocumentReviewPage;