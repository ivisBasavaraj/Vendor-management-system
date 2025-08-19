import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import DocumentSubmissionForm from '../../components/vendor/DocumentSubmissionForm';

interface DocumentSubmissionPageProps {
  mode?: 'submit' | 'resubmit';
}

const DocumentSubmissionPage: React.FC<DocumentSubmissionPageProps> = ({ mode = 'submit' }) => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();

  // Only vendors can access this page
  if (!user || user.role !== 'vendor') {
    return <Navigate to="/dashboard" />;
  }

  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {mode === 'resubmit' ? 'Resubmit Document' : 'Submit Documents'}
        </h1>
        <DocumentSubmissionForm mode={mode} documentId={id} />
      </div>
    </MainLayout>
  );
};

export default DocumentSubmissionPage;