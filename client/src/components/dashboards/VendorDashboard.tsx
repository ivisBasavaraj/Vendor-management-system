import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Warning,
  Schedule,
  Upload,
  Notifications,
  TrendingUp,
  Description
} from '@mui/icons-material';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import apiService from '../../utils/api';

interface VendorDashboardData {
  vendorInfo: {
    name: string;
    email: string;
    company: string;
  };
  currentPeriod: { year: number; month: string };
  currentSubmission: any;
  submissionStats: {
    totalSubmissions: number;
    draft: number;
    submitted: number;
    underReview: number;
    partiallyApproved: number;
    fullyApproved: number;
    requiresResubmission: number;
  };
  documentStatusBreakdown: {
    total: number;
    uploaded: number;
    underReview: number;
    approved: number;
    rejected: number;
    resubmitted: number;
  };
  rejectedDocuments: Array<{
    submissionId: string;
    submissionPeriod: { year: number; month: string };
    documentType: string;
    documentName: string;
    rejectionReason: string;
    rejectedDate: string;
    reviewedBy: any;
  }>;
  complianceStatus: {
    currentPeriodCompliant: boolean;
    overallComplianceRate: number;
    pendingActions: number;
    lastSubmissionDate: string;
  };
  recentNotifications: any[];
  submissionHistory: Array<{
    _id: { year: number; month: string };
    status: string;
    submissionDate: string;
  }>;
  nextDeadline: string;
}

const VendorDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<VendorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiService.dashboard.getVendorDashboard();
      setDashboardData(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'fully_approved': '#4caf50',
      'partially_approved': '#ff9800',
      'under_review': '#2196f3',
      'submitted': '#9c27b0',
      'requires_resubmission': '#f44336',
      'draft': '#757575',
      'approved': '#4caf50',
      'rejected': '#f44336',
      'uploaded': '#2196f3',
      'resubmitted': '#ff9800'
    };
    return colors[status] || '#757575';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'fully_approved': 'Fully Approved',
      'partially_approved': 'Partially Approved',
      'under_review': 'Under Review',
      'submitted': 'Submitted',
      'requires_resubmission': 'Requires Resubmission',
      'draft': 'Draft',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'uploaded': 'Uploaded',
      'resubmitted': 'Resubmitted'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!dashboardData) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No dashboard data available
      </Alert>
    );
  }

  // Prepare chart data
  const submissionStatsData = Object.entries(dashboardData.submissionStats)
    .filter(([key]) => key !== 'totalSubmissions')
    .map(([key, value]) => ({
      name: getStatusLabel(key),
      value: value as number,
      color: getStatusColor(key)
    }));

  const documentStatusData = Object.entries(dashboardData.documentStatusBreakdown || {})
    .filter(([key]) => key !== 'total')
    .map(([key, value]) => ({
      name: getStatusLabel(key),
      value: value as number,
      color: getStatusColor(key)
    }));

  const submissionHistoryData = dashboardData.submissionHistory.map(item => ({
    period: `${item._id.month} ${item._id.year}`,
    status: item.status,
    date: new Date(item.submissionDate).toLocaleDateString()
  }));

  const complianceRate = dashboardData.complianceStatus.overallComplianceRate;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom>
        Vendor Dashboard - {dashboardData.vendorInfo.name}
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        {dashboardData.vendorInfo.company} | {dashboardData.currentPeriod.month} {dashboardData.currentPeriod.year}
      </Typography>

      {/* Alert for pending actions */}
      {dashboardData.complianceStatus.pendingActions > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have {dashboardData.complianceStatus.pendingActions} pending action(s) that require your attention.
        </Alert>
      )}

      {/* Key Metrics Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Box sx={{ flex: '1 1 calc(33.333% - 20px)', minWidth: '200px' }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Assignment color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Submissions
                  </Typography>
                  <Typography variant="h5">
                    {dashboardData.submissionStats.totalSubmissions}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 calc(33.333% - 20px)', minWidth: '200px' }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Compliance Rate
                  </Typography>
                  <Typography variant="h5">
                    {complianceRate}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={complianceRate} 
                    sx={{ mt: 1 }}
                    color={complianceRate >= 80 ? 'success' : complianceRate >= 60 ? 'warning' : 'error'}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 calc(33.333% - 20px)', minWidth: '200px' }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle 
                  color={dashboardData.complianceStatus.currentPeriodCompliant ? 'success' : 'error'} 
                  sx={{ mr: 2 }} 
                />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Current Period Status
                  </Typography>
                  <Typography variant="h6">
                    {dashboardData.complianceStatus.currentPeriodCompliant ? 'Compliant' : 'Non-Compliant'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 calc(33.333% - 20px)', minWidth: '200px' }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Schedule color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Next Deadline
                  </Typography>
                  <Typography variant="h6">
                    {new Date(dashboardData.nextDeadline).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Current Submission Status */}
      {dashboardData.currentSubmission && (
        <Box sx={{ mb: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Submission Status - {dashboardData.currentPeriod.month} {dashboardData.currentPeriod.year}
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <Chip
                  label={getStatusLabel(dashboardData.currentSubmission.submissionStatus)}
                  sx={{
                    backgroundColor: getStatusColor(dashboardData.currentSubmission.submissionStatus),
                    color: 'white',
                    mr: 2
                  }}
                />
                <Typography variant="body2" color="textSecondary">
                  Submission ID: {dashboardData.currentSubmission.submissionId}
                </Typography>
              </Box>
              
              {dashboardData.documentStatusBreakdown && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Document Status Breakdown:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Object.entries(dashboardData.documentStatusBreakdown)
                      .filter(([key]) => key !== 'total')
                      .map(([status, count]) => (
                        <Chip
                          key={status}
                          label={`${getStatusLabel(status)}: ${count}`}
                          size="small"
                          variant="outlined"
                          sx={{ color: getStatusColor(status), borderColor: getStatusColor(status) }}
                        />
                      ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Charts Row */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        {/* Submission Statistics */}
        <Box sx={{ flex: '1 1 calc(50% - 16px)', minWidth: '300px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Submission Statistics
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={submissionStatsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {submissionStatsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

        {/* Document Status (if current submission exists) */}
        {dashboardData.documentStatusBreakdown && (
          <Box sx={{ flex: '1 1 calc(50% - 16px)', minWidth: '300px' }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Current Period Document Status
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={documentStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {documentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>

      {/* Submission History */}
      <Box sx={{ mb: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Submission History
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submission Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissionHistoryData.length > 0 ? (
                    submissionHistoryData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.period}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(item.status)}
                            size="small"
                            sx={{
                              backgroundColor: getStatusColor(item.status),
                              color: 'white'
                            }}
                          />
                        </TableCell>
                        <TableCell>{item.date}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">No submission history available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default VendorDashboard;