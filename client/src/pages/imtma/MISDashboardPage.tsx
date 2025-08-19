import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import MISDashboard from '../../components/imtma/MISDashboard';

const MISDashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Only IMTMA users and admins can access this page
  if (!user || (user.role !== 'imtma' && user.role !== 'admin')) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">MIS Dashboard</h1>
        <MISDashboard />
      </div>
    </MainLayout>
  );
};

export default MISDashboardPage;