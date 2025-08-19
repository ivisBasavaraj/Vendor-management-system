import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import VendorDashboard from './VendorDashboard';
import ConsultantDashboard from './ConsultantDashboard';
import { Alert, Box } from '@mui/material';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          User not authenticated. Please log in to access the dashboard.
        </Alert>
      </Box>
    );
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'vendor':
      return <VendorDashboard />;
    case 'consultant':
      return <ConsultantDashboard />;
    case 'cross_verifier':
      return <ConsultantDashboard />; // Cross verifiers can use consultant dashboard for now
    case 'approver':
      return <AdminDashboard />; // Approvers can use admin dashboard for now
    default:
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="warning">
            Dashboard not available for role: {user.role}
          </Alert>
        </Box>
      );
  }
};

export default Dashboard;